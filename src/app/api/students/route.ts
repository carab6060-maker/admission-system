import { NextRequest, NextResponse } from 'next/server';
import { query, getNextStudentId } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const grade = searchParams.get('grade')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';

    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conditions.push(
        `(LOWER(student_id) LIKE $${params.length} OR LOWER(full_name) LIKE $${params.length} OR LOWER(phone) LIKE $${params.length} OR LOWER(parent_name) LIKE $${params.length})`
      );
    }

    if (grade && grade !== 'All') {
      params.push(grade);
      conditions.push(`grade_applying = $${params.length}`);
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

    const fullName = body.full_name?.trim();
    const gender = body.gender?.trim();
    const dob = body.date_of_birth?.trim();
    const phone = body.phone?.trim();
    const parentName = body.parent_name?.trim();
    const parentPhone = body.parent_phone?.trim();
    const gradeApplying = body.grade_applying?.trim();
    const address = body.address?.trim();
    const admissionDate = body.admission_date?.trim() || new Date().toISOString().slice(0, 10);
    const status = body.status?.trim() || 'Pending';
    const email = body.email?.trim() || null;
    const previousSchool = body.previous_school?.trim() || null;
    const photoUrl = body.photo_url?.trim() || null;
    const notes = body.notes?.trim() || null;

    // Field validations
    if (!fullName) return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    if (!gender) return NextResponse.json({ error: 'Gender is required' }, { status: 400 });
    if (!dob) return NextResponse.json({ error: 'Date of birth is required' }, { status: 400 });
    if (!phone) return NextResponse.json({ error: 'Student phone number is required' }, { status: 400 });
    if (!parentName) return NextResponse.json({ error: 'Parent/Guardian name is required' }, { status: 400 });
    if (!parentPhone) return NextResponse.json({ error: 'Parent/Guardian phone is required' }, { status: 400 });
    if (!gradeApplying) return NextResponse.json({ error: 'Grade/Class applying for is required' }, { status: 400 });
    if (!address) return NextResponse.json({ error: 'Residential address is required' }, { status: 400 });

    let studentId = body.student_id?.trim();
    if (!studentId) {
      studentId = await getNextStudentId();
    }

    // Insert student
    const res = await query(
      `INSERT INTO students (
        student_id, full_name, gender, date_of_birth, phone,
        parent_name, parent_phone, email, address,
        grade_applying, previous_school, admission_date, photo_url,
        status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        studentId,
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
      ]
    );

    return NextResponse.json({ success: true, data: res.rows[0] }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating student:', err);
    if (err.code === '23505') {
      return NextResponse.json({ error: 'A student with this Student ID or email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: err.message || 'Failed to save student admission' }, { status: 500 });
  }
}
