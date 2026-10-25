import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';

    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conditions.push(
        `(LOWER(first_name) LIKE $${params.length} OR LOWER(middle_name) LIKE $${params.length} OR LOWER(last_name) LIKE $${params.length} OR LOWER(phone) LIKE $${params.length} OR LOWER(email) LIKE $${params.length} OR LOWER(address) LIKE $${params.length})`
      );
    }

    if (status && status !== 'All') {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM students ${whereClause} ORDER BY created_at DESC`;

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
    const status = body.status?.trim() || 'Pending';

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
        phone, email, address, photo_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        firstName,
        middleName,
        lastName,
        gender,
        dob,
        phone,
        email,
        address,
        photoUrl,
        status,
      ]
    );

    return NextResponse.json({ success: true, data: res.rows[0] }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating student:', err);
    return NextResponse.json({ error: err.message || 'Failed to save student admission' }, { status: 500 });
  }
}
