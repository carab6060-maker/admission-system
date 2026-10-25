import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim().toLowerCase() || '';

    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(
        `(LOWER(c.name) LIKE $${params.length} OR LOWER(c.code) LIKE $${params.length} OR LOWER(COALESCE(c.email, '')) LIKE $${params.length})`
      );
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        c.id,
        c.name,
        c.code,
        c.phone,
        c.email,
        c.address,
        c.logo_url,
        c.currency,
        c.is_active,
        c.created_at,
        c.updated_at,
        COUNT(DISTINCT s.id)::int as total_students,
        COUNT(DISTINCT u.id)::int as total_users,
        COALESCE(SUM(p.amount), 0)::float as total_revenue
      FROM companies c
      LEFT JOIN students s ON s.company_id = c.id
      LEFT JOIN users u ON u.company_id = c.id
      LEFT JOIN payments p ON p.company_id = c.id
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.created_at ASC
    `;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err: any) {
    console.error('Error fetching companies:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = body.name?.trim();
    const code = body.code?.trim().toUpperCase();
    const phone = body.phone?.trim() || null;
    const email = body.email?.trim() || null;
    const address = body.address?.trim() || null;
    const logoUrl = body.logo_url?.trim() || null;
    const currency = body.currency?.trim() || 'USD';
    const isActive = body.is_active !== undefined ? Boolean(body.is_active) : true;

    if (!name) {
      return NextResponse.json({ error: 'Company/Institution name is required' }, { status: 400 });
    }
    if (!code) {
      return NextResponse.json({ error: 'Company short code is required (e.g. ALN-01)' }, { status: 400 });
    }

    // Check code uniqueness
    const codeCheck = await query(`SELECT id FROM companies WHERE UPPER(code) = $1`, [code]);
    if (codeCheck.rows.length > 0) {
      return NextResponse.json({ error: `Company code "${code}" already exists` }, { status: 409 });
    }

    const insertRes = await query(
      `INSERT INTO companies (
        name, code, phone, email, address, logo_url, currency, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [name, code, phone, email, address, logoUrl, currency, isActive]
    );

    return NextResponse.json({
      success: true,
      message: `Company "${name}" created successfully`,
      data: insertRes.rows[0],
    }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating company:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create company' },
      { status: 500 }
    );
  }
}
