import { NextRequest, NextResponse } from 'next/server';
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
      `SELECT s.*, c.name as company_name, c.code as company_code, c.phone as company_phone, c.address as company_address
       FROM students s
       LEFT JOIN companies c ON s.company_id = c.id
       WHERE s.id::text = $1 
       LIMIT 1`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const student = res.rows[0];
    if (authUser && authUser.role !== 'superadmin' && authUser.companyId && student.company_id !== authUser.companyId) {
      return NextResponse.json({ error: 'Access denied: student belongs to another school' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: student });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch student' }, { status: 500 });
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

    const check = await query(
      `SELECT * FROM students WHERE id::text = $1 LIMIT 1`,
      [id]
    );

    if (check.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const current = check.rows[0];

    if (authUser && authUser.role !== 'superadmin' && authUser.companyId && current.company_id !== authUser.companyId) {
      return NextResponse.json({ error: 'Access denied: student belongs to another school' }, { status: 403 });
    }

    const firstName = body.first_name !== undefined ? body.first_name : current.first_name;
    const middleName = body.middle_name !== undefined ? body.middle_name : current.middle_name;
    const lastName = body.last_name !== undefined ? body.last_name : current.last_name;
    const gender = body.gender !== undefined ? body.gender : current.gender;
    const dob = body.date_of_birth !== undefined ? body.date_of_birth : current.date_of_birth;
    const phone = body.phone !== undefined ? body.phone : current.phone;
    const email = body.email !== undefined ? body.email : current.email;
    const address = body.address !== undefined ? body.address : current.address;
    const photoUrl = body.photo_url !== undefined ? body.photo_url : current.photo_url;
    const companyId = body.company_id !== undefined ? body.company_id : current.company_id;

    const res = await query(
      `UPDATE students SET
        first_name = $1,
        middle_name = $2,
        last_name = $3,
        gender = $4,
        date_of_birth = $5,
        phone = $6,
        email = $7,
        address = $8,
        photo_url = $9,
        company_id = $10,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
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
        companyId,
        current.id,
      ]
    );

    const fullRes = await query(
      `SELECT s.*, c.name as company_name, c.code as company_code
       FROM students s
       LEFT JOIN companies c ON s.company_id = c.id
       WHERE s.id = $1`,
      [res.rows[0].id]
    );

    return NextResponse.json({ success: true, data: fullRes.rows[0] });
  } catch (err: any) {
    console.error('Error updating student:', err);
    return NextResponse.json({ error: err.message || 'Failed to update student' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(request);
    const { id } = params;

    if (authUser && authUser.role !== 'superadmin' && authUser.companyId) {
      const check = await query(`SELECT company_id FROM students WHERE id::text = $1`, [id]);
      if (check.rows.length === 0) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }
      if (check.rows[0].company_id !== authUser.companyId) {
        return NextResponse.json({ error: 'Access denied: student belongs to another school' }, { status: 403 });
      }
    }

    const res = await query(
      `DELETE FROM students WHERE id::text = $1 RETURNING first_name, last_name`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Student ${res.rows[0].first_name} ${res.rows[0].last_name} deleted successfully`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete student' }, { status: 500 });
  }
}
