import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(request);
    const { id } = params;
    const res = await query(
      `SELECT id, username, email, full_name, role, is_active, company_id, created_at, updated_at 
       FROM users 
       WHERE id::text = $1 
       LIMIT 1`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = res.rows[0];
    if (authUser && authUser.role !== 'superadmin' && authUser.companyId && user.company_id !== authUser.companyId) {
      return NextResponse.json({ error: 'Access denied: user belongs to another school' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(request);
    const { id } = params;
    const body = await request.json();

    const check = await query(`SELECT * FROM users WHERE id::text = $1 LIMIT 1`, [id]);
    if (check.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const current = check.rows[0];

    // Isolation check
    if (authUser && authUser.role !== 'superadmin' && authUser.companyId) {
      if (current.company_id !== authUser.companyId || current.role === 'superadmin') {
        return NextResponse.json({ error: 'Access denied: user belongs to another school' }, { status: 403 });
      }
      if (body.role === 'superadmin') {
        return NextResponse.json({ error: 'Only Super Admin can promote a user to Super Admin' }, { status: 403 });
      }
    }

    // Check email uniqueness if modified
    if (body.email && body.email.toLowerCase() !== current.email.toLowerCase()) {
      const emailCheck = await query(
        `SELECT id FROM users WHERE LOWER(email) = $1 AND id::text != $2`,
        [body.email.toLowerCase(), id]
      );
      if (emailCheck.rows.length > 0) {
        return NextResponse.json({ error: 'This email is already in use by another user' }, { status: 409 });
      }
    }

    // Check username uniqueness if modified
    if (body.username && body.username.toLowerCase() !== current.username?.toLowerCase()) {
      const userCheck = await query(
        `SELECT id FROM users WHERE LOWER(username) = $1 AND id::text != $2`,
        [body.username.toLowerCase(), id]
      );
      if (userCheck.rows.length > 0) {
        return NextResponse.json({ error: 'This username is already taken' }, { status: 409 });
      }
    }

    const username = body.username !== undefined ? body.username.trim().toLowerCase() : current.username;
    const email = body.email !== undefined ? body.email.trim().toLowerCase() : current.email;
    const fullName = body.full_name !== undefined ? body.full_name.trim() : current.full_name;
    const role = body.role !== undefined ? body.role.trim().toLowerCase() : current.role;
    const isActive = body.is_active !== undefined ? Boolean(body.is_active) : current.is_active;

    let passwordHash = current.password_hash;
    if (body.password && body.password.trim().length >= 6) {
      passwordHash = await bcrypt.hash(body.password.trim(), 10);
    }

    let companyId = current.company_id;
    const isSuperAdmin = Boolean(
      authUser && (
        authUser.role === 'superadmin' || 
        authUser.username === 'superadmin' || 
        authUser.username === 'carab'
      )
    );
    if (isSuperAdmin && body.company_id !== undefined) {
      companyId = body.company_id || null;
    }

    const updateRes = await query(
      `UPDATE users SET
        username = $1,
        email = $2,
        full_name = $3,
        role = $4,
        is_active = $5,
        password_hash = $6,
        company_id = $7,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING id, username, email, full_name, role, is_active, company_id, created_at, updated_at`,
      [username, email, fullName, role, isActive, passwordHash, companyId, current.id]
    );

    return NextResponse.json({
      success: true,
      message: `User ${fullName} updated successfully`,
      data: updateRes.rows[0],
    });
  } catch (err: any) {
    console.error('Error updating user:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(request);
    const { id } = params;

    const check = await query(`SELECT * FROM users WHERE id::text = $1 LIMIT 1`, [id]);
    if (check.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = check.rows[0];

    // Isolation check
    if (authUser && authUser.role !== 'superadmin' && authUser.companyId) {
      if (user.company_id !== authUser.companyId || user.role === 'superadmin') {
        return NextResponse.json({ error: 'Access denied: cannot delete this user' }, { status: 403 });
      }
    }

    // Protection: Prevent deleting primary accounts
    if (user.username === 'superadmin' || user.username === 'carab') {
      return NextResponse.json(
        { error: `The primary account "${user.username}" cannot be deleted.` },
        { status: 403 }
      );
    }

    // Protection: Prevent deleting if last superadmin
    if (user.role === 'superadmin') {
      const superCount = await query(`SELECT COUNT(*) as count FROM users WHERE role = 'superadmin'`);
      if (parseInt(superCount.rows[0].count, 10) <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the only remaining Super Admin account.' },
          { status: 403 }
        );
      }
    }

    await query(`DELETE FROM users WHERE id::text = $1`, [id]);

    return NextResponse.json({
      success: true,
      message: `User "${user.full_name}" has been deleted successfully.`,
    });
  } catch (err: any) {
    console.error('Error deleting user:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
