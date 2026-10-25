import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Total Students
    const totalRes = await query(`SELECT COUNT(*) as count FROM students`);
    const totalStudents = parseInt(totalRes.rows[0].count, 10);

    // Approved Applications
    const approvedRes = await query(`SELECT COUNT(*) as count FROM students WHERE status = 'Approved'`);
    const approvedApplications = parseInt(approvedRes.rows[0].count, 10);

    // Pending Applications
    const pendingRes = await query(`SELECT COUNT(*) as count FROM students WHERE status = 'Pending'`);
    const pendingApplications = parseInt(pendingRes.rows[0].count, 10);

    // Rejected Applications
    const rejectedRes = await query(`SELECT COUNT(*) as count FROM students WHERE status = 'Rejected'`);
    const rejectedApplications = parseInt(rejectedRes.rows[0].count, 10);

    // New Admissions (registered in the last 30 days or recent admissions)
    const newAdmissionsRes = await query(
      `SELECT COUNT(*) as count FROM students 
       WHERE admission_date >= (CURRENT_DATE - INTERVAL '30 days')
          OR created_at >= (CURRENT_TIMESTAMP - INTERVAL '30 days')`
    );
    const newAdmissions = parseInt(newAdmissionsRes.rows[0].count, 10);

    // Recent Student Registrations
    const recentRes = await query(
      `SELECT id, student_id, full_name, gender, grade_applying, admission_date, status, phone, parent_name, created_at 
       FROM students 
       ORDER BY created_at DESC 
       LIMIT 6`
    );

    // Grade Distribution Breakdown
    const gradeRes = await query(
      `SELECT grade_applying, COUNT(*) as count 
       FROM students 
       GROUP BY grade_applying 
       ORDER BY count DESC 
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
      gradeDistribution: gradeRes.rows,
    });
  } catch (err: any) {
    console.error('Error fetching dashboard statistics:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch dashboard metrics' }, { status: 500 });
  }
}
