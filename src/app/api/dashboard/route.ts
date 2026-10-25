import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const totalRes = await query(`SELECT COUNT(*) as count FROM students`);
    const totalStudents = parseInt(totalRes.rows[0].count, 10);

    const maleRes = await query(`SELECT COUNT(*) as count FROM students WHERE LOWER(gender) = 'male'`);
    const maleStudents = parseInt(maleRes.rows[0].count, 10);

    const femaleRes = await query(`SELECT COUNT(*) as count FROM students WHERE LOWER(gender) = 'female'`);
    const femaleStudents = parseInt(femaleRes.rows[0].count, 10);

    const newAdmissionsRes = await query(
      `SELECT COUNT(*) as count FROM students 
       WHERE created_at >= (CURRENT_TIMESTAMP - INTERVAL '30 days')`
    );
    const newAdmissions = parseInt(newAdmissionsRes.rows[0].count, 10);

    // Recent Student Registrations
    const recentRes = await query(
      `SELECT id, first_name, middle_name, last_name, gender, date_of_birth, phone, email, address, photo_url, created_at 
       FROM students 
       ORDER BY created_at DESC 
       LIMIT 6`
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents,
        newAdmissions,
        maleStudents,
        femaleStudents,
      },
      recentStudents: recentRes.rows,
    });
  } catch (err: any) {
    console.error('Error fetching dashboard statistics:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch dashboard metrics' }, { status: 500 });
  }
}
