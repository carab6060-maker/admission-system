import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const role = searchParams.get('role')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';

    const conditions: string[] = [];
    const params: any[] = [];

    // Isolation: non-superadmin only sees users of their school
    if (authUser && authUser.role !== 'superadmin' && authUser.companyId) {
      params.push(authUser.companyId);
      conditions.push(`company_id::text = $${params.length}`);
      conditions.push(`LOWER(role) != 'superadmin'`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(
        `(LOWER(username) LIKE $${params.length} OR LOWER(full_name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length})`
      );
    }

    if (role && role !== 'All') {
      params.push(role.toLowerCase());
      conditions.push(`LOWER(role) = $${params.length}`);
    }

    if (status && status !== 'All') {
      if (status.toLowerCase() === 'active') {
        conditions.push(`is_active = true`);
      } else if (status.toLowerCase() === 'inactive') {
        conditions.push(`is_active = false`);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.full_name, 
        u.role, 
        u.is_active, 
        u.company_id,
        c.name as company_name,
        c.code as company_code,
        u.created_at, 
        u.updated_at 
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      ${whereClause} 
      ORDER BY u.created_at ASC
    `;

    const result = await query(sql, params);

    // Summary statistics
    const statsSql = `
      SELECT 
        COUNT(*)::int as total_users,
        COUNT(CASE WHEN LOWER(role) = 'superadmin' THEN 1 END)::int as super_admins,
        COUNT(CASE WHEN LOWER(role) = 'admin' THEN 1 END)::int as admins,
        COUNT(CASE WHEN LOWER(role) = 'staff' OR LOWER(role) = 'cashier' THEN 1 END)::int as staff_users,
        COUNT(CASE WHEN is_active = true THEN 1 END)::int as active_users
      FROM users
    `;
    const statsRes = await query(statsSql);
    const stats = statsRes.rows[0];

    return NextResponse.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
      stats: {
        totalUsers: stats.total_users,
        superAdmins: stats.super_admins,
        admins: stats.admins,
        staffUsers: stats.staff_users,
        activeUsers: stats.active_users,
      },
    });
  } catch (err: any) {
    console.error('Error fetching users:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const username = body.username?.trim().toLowerCase();
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();
    const fullName = body.full_name?.trim();
    const role = (body.role?.trim().toLowerCase() || 'admin');
    const isActive = body.is_active !== undefined ? Boolean(body.is_active) : true;

    // Validation
    if (!username || username.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    if (!fullName) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }
    if (!['superadmin', 'admin', 'staff'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Choose Super Admin, Admin, or Staff' }, { status: 400 });
    }

    // Check if username or email is already taken
    const existing = await query(
      `SELECT id, username, email FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $2`,
      [username, email]
    );

    if (existing.rows.length > 0) {
      const match = existing.rows[0];
      if (match.username.toLowerCase() === username) {
        return NextResponse.json({ error: `Username "${username}" is already in use` }, { status: 409 });
      }
      return NextResponse.json({ error: `Email "${email}" is already registered` }, { status: 409 });
    }

    const authUser = await getAuthUser(request);
    let companyId = body.company_id || null;

    if (authUser && authUser.role !== 'superadmin') {
      if (role === 'superadmin') {
        return NextResponse.json({ error: 'Only Super Admin can create Super Admin accounts' }, { status: 403 });
      }
      companyId = authUser.companyId || null;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const insertRes = await query(
      `INSERT INTO users (
        username, email, password_hash, full_name, role, is_active, company_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, username, email, full_name, role, is_active, company_id, created_at`,
      [username, email, passwordHash, fullName, role, isActive, companyId]
    );

    return NextResponse.json({
      success: true,
      message: `User ${fullName} (${role}) created successfully`,
      data: insertRes.rows[0],
    }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating user:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
