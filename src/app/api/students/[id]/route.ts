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
      `SELECT * FROM students WHERE id::text = $1 OR student_id = $1 LIMIT 1`,
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

    // Check if student exists
    const check = await query(
      `SELECT * FROM students WHERE id::text = $1 OR student_id = $1 LIMIT 1`,
      [id]
    );

    if (check.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const current = check.rows[0];

    // If only status update is passed
    const status = body.status !== undefined ? body.status : current.status;
    const fullName = body.full_name !== undefined ? body.full_name : current.full_name;
    const gender = body.gender !== undefined ? body.gender : current.gender;
    const dob = body.date_of_birth !== undefined ? body.date_of_birth : current.date_of_birth;
    const phone = body.phone !== undefined ? body.phone : current.phone;
    const parentName = body.parent_name !== undefined ? body.parent_name : current.parent_name;
    const parentPhone = body.parent_phone !== undefined ? body.parent_phone : current.parent_phone;
    const email = body.email !== undefined ? body.email : current.email;
    const address = body.address !== undefined ? body.address : current.address;
    const gradeApplying = body.grade_applying !== undefined ? body.grade_applying : current.grade_applying;
    const previousSchool = body.previous_school !== undefined ? body.previous_school : current.previous_school;
    const admissionDate = body.admission_date !== undefined ? body.admission_date : current.admission_date;
    const photoUrl = body.photo_url !== undefined ? body.photo_url : current.photo_url;
    const notes = body.notes !== undefined ? body.notes : current.notes;

    const res = await query(
      `UPDATE students SET
        full_name = $1,
        gender = $2,
        date_of_birth = $3,
        phone = $4,
        parent_name = $5,
        parent_phone = $6,
        email = $7,
        address = $8,
        grade_applying = $9,
        previous_school = $10,
        admission_date = $11,
        photo_url = $12,
        status = $13,
        notes = $14,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $15
       RETURNING *`,
      [
        fullName,
        gender,
        dob,
        phone,
        parentName,
        parentPhone,
        email,
        address,
        gradeApplying,
        previousSchool,
        admissionDate,
        photoUrl,
        status,
        notes,
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
      `DELETE FROM students WHERE id::text = $1 OR student_id = $1 RETURNING student_id, full_name`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Student ${res.rows[0].student_id} (${res.rows[0].full_name}) deleted successfully`,
    });
  } catch (err: any) {
    console.error('Error deleting student:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete student' }, { status: 500 });
  }
}
