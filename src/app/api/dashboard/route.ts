import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id')?.trim() || '';

    const conditions: string[] = [];
    const params: any[] = [];

    if (companyId && companyId !== 'All') {
      params.push(companyId);
      conditions.push(`company_id::text = $1`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const totalRes = await query(`SELECT COUNT(*) as count FROM students ${whereClause}`, params);
    const totalStudents = parseInt(totalRes.rows[0].count, 10);

    const maleCond = [...conditions, `LOWER(gender) = 'male'`];
    const maleRes = await query(`SELECT COUNT(*) as count FROM students WHERE ${maleCond.join(' AND ')}`, params);
    const maleStudents = parseInt(maleRes.rows[0].count, 10);

    const femaleCond = [...conditions, `LOWER(gender) = 'female'`];
    const femaleRes = await query(`SELECT COUNT(*) as count FROM students WHERE ${femaleCond.join(' AND ')}`, params);
    const femaleStudents = parseInt(femaleRes.rows[0].count, 10);

    const newAdmCond = [...conditions, `created_at >= (CURRENT_TIMESTAMP - INTERVAL '30 days')`];
    const newAdmissionsRes = await query(
      `SELECT COUNT(*) as count FROM students WHERE ${newAdmCond.join(' AND ')}`,
      params
    );
    const newAdmissions = parseInt(newAdmissionsRes.rows[0].count, 10);

    // Recent Student Registrations with company info
    const sCond = companyId && companyId !== 'All' ? `WHERE s.company_id::text = $1` : '';
    const recentRes = await query(
      `SELECT 
        s.id, 
        s.first_name, 
        s.middle_name, 
        s.last_name, 
        s.gender, 
        s.date_of_birth, 
        s.phone, 
        s.email, 
        s.address, 
        s.photo_url, 
        s.created_at,
        c.name as company_name,
        c.code as company_code
       FROM students s
       LEFT JOIN companies c ON s.company_id = c.id
       ${sCond}
       ORDER BY s.created_at DESC 
       LIMIT 6`,
      params
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
