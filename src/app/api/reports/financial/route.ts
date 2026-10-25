import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const customStart = searchParams.get('start_date');
    const customEnd = searchParams.get('end_date');

    let dateCondition = '';
    const params: any[] = [];

    if (customStart && customEnd) {
      params.push(customStart, customEnd);
      dateCondition = `WHERE p.payment_date >= $1 AND p.payment_date <= $2`;
    } else {
      switch (period) {
        case 'today':
          dateCondition = `WHERE p.payment_date = CURRENT_DATE`;
          break;
        case '7days':
          dateCondition = `WHERE p.payment_date >= (CURRENT_DATE - INTERVAL '7 days')`;
          break;
        case 'month':
          dateCondition = `WHERE date_trunc('month', p.payment_date) = date_trunc('month', CURRENT_DATE)`;
          break;
        case 'year':
          dateCondition = `WHERE date_trunc('year', p.payment_date) = date_trunc('year', CURRENT_DATE)`;
          break;
        case 'all':
        default:
          dateCondition = '';
          break;
      }
    }

    // 1. Overall Summary
    const summarySql = `
      SELECT 
        COALESCE(SUM(p.amount), 0)::float as total_revenue,
        COUNT(*)::int as transaction_count,
        COUNT(DISTINCT p.student_id)::int as unique_students,
        COALESCE(AVG(p.amount), 0)::float as average_payment
      FROM payments p
      ${dateCondition}
    `;
    const summaryRes = await query(summarySql, params);
    const summary = summaryRes.rows[0];
    const totalRev = summary.total_revenue || 0;

    // 2. Breakdown by Fee Type
    const feeTypeSql = `
      SELECT 
        p.fee_type,
        SUM(p.amount)::float as total,
        COUNT(*)::int as count
      FROM payments p
      ${dateCondition}
      GROUP BY p.fee_type
      ORDER BY total DESC
    `;
    const feeTypeRes = await query(feeTypeSql, params);
    const byFeeType = feeTypeRes.rows.map((row) => ({
      ...row,
      percentage: totalRev > 0 ? Math.round((row.total / totalRev) * 100) : 0,
    }));

    // 3. Breakdown by Payment Method
    const methodSql = `
      SELECT 
        p.payment_method,
        SUM(p.amount)::float as total,
        COUNT(*)::int as count
      FROM payments p
      ${dateCondition}
      GROUP BY p.payment_method
      ORDER BY total DESC
    `;
    const methodRes = await query(methodSql, params);
    const byPaymentMethod = methodRes.rows.map((row) => ({
      ...row,
      percentage: totalRev > 0 ? Math.round((row.total / totalRev) * 100) : 0,
    }));

    // 4. Daily timeline / trend
    const trendSql = `
      SELECT 
        TO_CHAR(p.payment_date, 'YYYY-MM-DD') as date_label,
        SUM(p.amount)::float as total,
        COUNT(*)::int as count
      FROM payments p
      ${dateCondition}
      GROUP BY TO_CHAR(p.payment_date, 'YYYY-MM-DD')
      ORDER BY date_label ASC
    `;
    const trendRes = await query(trendSql, params);

    // 5. Full transactions list for this period
    const listSql = `
      SELECT 
        p.id,
        p.receipt_no,
        p.amount::float as amount,
        p.fee_type,
        p.payment_method,
        p.payment_date,
        p.reference_no,
        p.notes,
        s.first_name,
        s.middle_name,
        s.last_name,
        s.phone as student_phone
      FROM payments p
      JOIN students s ON p.student_id = s.id
      ${dateCondition}
      ORDER BY p.payment_date DESC, p.created_at DESC
    `;
    const listRes = await query(listSql, params);

    return NextResponse.json({
      success: true,
      period,
      summary: {
        totalRevenue: summary.total_revenue,
        transactionCount: summary.transaction_count,
        uniqueStudents: summary.unique_students,
        averagePayment: Math.round(summary.average_payment * 100) / 100,
      },
      byFeeType,
      byPaymentMethod,
      dailyTrend: trendRes.rows,
      transactions: listRes.rows,
    });
  } catch (err: any) {
    console.error('Error fetching financial report:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch financial report' },
      { status: 500 }
    );
  }
}
