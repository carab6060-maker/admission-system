import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const companyId = searchParams.get('company_id')?.trim() || '';

    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conditions.push(
        `(LOWER(s.first_name) LIKE $${params.length} 
          OR LOWER(s.middle_name) LIKE $${params.length} 
          OR LOWER(s.last_name) LIKE $${params.length} 
          OR LOWER(s.phone) LIKE $${params.length} 
          OR LOWER(COALESCE(s.email, '')) LIKE $${params.length} 
          OR LOWER(s.address) LIKE $${params.length})`
      );
    }

    if (companyId && companyId !== 'All') {
      params.push(companyId);
      conditions.push(`s.company_id::text = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT 
        s.*,
        c.name as company_name,
        c.code as company_code
      FROM students s
      LEFT JOIN companies c ON s.company_id = c.id
      ${whereClause} 
      ORDER BY s.created_at DESC
    `;

    const result = await query(sql, params);
    return NextResponse.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err: any) {
    console.error('Error fetching students:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const firstName = body.first_name?.trim();
    const middleName = body.middle_name?.trim();
    const lastName = body.last_name?.trim();
    const gender = body.gender?.trim();
    const dob = body.date_of_birth?.trim();
    const phone = body.phone?.trim();
    const address = body.address?.trim();
    const email = body.email?.trim() || null;
    const photoUrl = body.photo_url?.trim() || null;

    let companyId = body.company_id?.trim();
    if (!companyId) {
      const compRes = await query(`SELECT id FROM companies WHERE is_active = true ORDER BY created_at ASC LIMIT 1`);
      if (compRes.rows.length > 0) {
        companyId = compRes.rows[0].id;
      }
    }

    // Field validations
    if (!firstName) return NextResponse.json({ error: 'First name is required' }, { status: 400 });
    if (!middleName) return NextResponse.json({ error: 'Middle name is required' }, { status: 400 });
    if (!lastName) return NextResponse.json({ error: 'Last name is required' }, { status: 400 });
    if (!gender) return NextResponse.json({ error: 'Gender is required' }, { status: 400 });
    if (!dob) return NextResponse.json({ error: 'Date of birth is required' }, { status: 400 });
    if (!phone) return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    if (!address) return NextResponse.json({ error: 'Residential address is required' }, { status: 400 });

    const res = await query(
      `INSERT INTO students (
        first_name, middle_name, last_name, gender, date_of_birth,
        phone, email, address, photo_url, company_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [firstName, middleName, lastName, gender, dob, phone, email, address, photoUrl, companyId]
    );

    const fullRes = await query(
      `SELECT s.*, c.name as company_name, c.code as company_code
       FROM students s
       LEFT JOIN companies c ON s.company_id = c.id
       WHERE s.id = $1`,
      [res.rows[0].id]
    );

    return NextResponse.json({
      success: true,
      message: 'Student registered successfully',
      data: fullRes.rows[0],
    }, { status: 201 });
  } catch (err: any) {
    console.error('Error registering student:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to register student' },
      { status: 500 }
    );
  }
}
