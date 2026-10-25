import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const totalRes = await query(`SELECT COUNT(*) as count FROM students`);
    const totalStudents = parseInt(totalRes.rows[0].count, 10);

    const approvedRes = await query(`SELECT COUNT(*) as count FROM students WHERE status = 'Approved'`);
    const approvedApplications = parseInt(approvedRes.rows[0].count, 10);

    const pendingRes = await query(`SELECT COUNT(*) as count FROM students WHERE status = 'Pending'`);
    const pendingApplications = parseInt(pendingRes.rows[0].count, 10);

    const rejectedRes = await query(`SELECT COUNT(*) as count FROM students WHERE status = 'Rejected'`);
    const rejectedApplications = parseInt(rejectedRes.rows[0].count, 10);

    const newAdmissionsRes = await query(
      `SELECT COUNT(*) as count FROM students 
       WHERE created_at >= (CURRENT_TIMESTAMP - INTERVAL '30 days')`
    );
    const newAdmissions = parseInt(newAdmissionsRes.rows[0].count, 10);

    // Recent Student Registrations
    const recentRes = await query(
      `SELECT id, first_name, middle_name, last_name, gender, date_of_birth, phone, email, address, status, created_at 
       FROM students 
       ORDER BY created_at DESC 
       LIMIT 6`
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents,
        newAdmissions,
        approvedApplications,
        pendingApplications,
        rejectedApplications,
      },
      recentStudents: recentRes.rows,
    });
  } catch (err: any) {
    console.error('Error fetching dashboard statistics:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch dashboard metrics' }, { status: 500 });
  }
}
