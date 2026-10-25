import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const res = await query(
      `SELECT * FROM students WHERE id::text = $1 LIMIT 1`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch student' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const firstName = body.first_name !== undefined ? body.first_name : current.first_name;
    const middleName = body.middle_name !== undefined ? body.middle_name : current.middle_name;
    const lastName = body.last_name !== undefined ? body.last_name : current.last_name;
    const gender = body.gender !== undefined ? body.gender : current.gender;
    const dob = body.date_of_birth !== undefined ? body.date_of_birth : current.date_of_birth;
    const phone = body.phone !== undefined ? body.phone : current.phone;
    const email = body.email !== undefined ? body.email : current.email;
    const address = body.address !== undefined ? body.address : current.address;
    const photoUrl = body.photo_url !== undefined ? body.photo_url : current.photo_url;
    const status = body.status !== undefined ? body.status : current.status;

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
        status = $10,
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
        status,
        current.id,
      ]
    );

    return NextResponse.json({ success: true, data: res.rows[0] });
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
    const { id } = params;
    const res = await query(
      `DELETE FROM students WHERE id::text = $1 RETURNING first_name, last_name`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
    }

    const name = `${res.rows[0].first_name} ${res.rows[0].last_name}`;
    return NextResponse.json({
      success: true,
      message: `Student ${name} deleted successfully`,
    });
  } catch (err: any) {
    console.error('Error deleting student:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete student' }, { status: 500 });
  }
}
