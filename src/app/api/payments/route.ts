import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const feeType = searchParams.get('fee_type')?.trim() || '';
    const paymentMethod = searchParams.get('payment_method')?.trim() || '';
    const studentId = searchParams.get('student_id')?.trim() || '';
    const companyId = searchParams.get('company_id')?.trim() || '';
    const startDate = searchParams.get('start_date')?.trim() || '';
    const endDate = searchParams.get('end_date')?.trim() || '';

    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conditions.push(
        `(LOWER(p.receipt_no) LIKE $${params.length} 
          OR LOWER(COALESCE(p.reference_no, '')) LIKE $${params.length} 
          OR LOWER(s.first_name) LIKE $${params.length} 
          OR LOWER(s.middle_name) LIKE $${params.length} 
          OR LOWER(s.last_name) LIKE $${params.length} 
          OR LOWER(s.phone) LIKE $${params.length})`
      );
    }

    if (feeType && feeType !== 'All') {
      params.push(feeType);
      conditions.push(`p.fee_type = $${params.length}`);
    }

    if (paymentMethod && paymentMethod !== 'All') {
      params.push(paymentMethod);
      conditions.push(`p.payment_method = $${params.length}`);
    }

    if (studentId) {
      params.push(studentId);
      conditions.push(`p.student_id::text = $${params.length}`);
    }

    if (companyId && companyId !== 'All') {
      params.push(companyId);
      conditions.push(`p.company_id::text = $${params.length}`);
    }

    if (startDate) {
      params.push(startDate);
      conditions.push(`p.payment_date >= $${params.length}`);
    }

    if (endDate) {
      params.push(endDate);
      conditions.push(`p.payment_date <= $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        p.id,
        p.receipt_no,
        p.student_id,
        p.company_id,
        p.amount::float as amount,
        p.fee_type,
        p.payment_method,
        p.payment_date,
        p.reference_no,
        p.notes,
        p.created_at,
        s.first_name,
        s.middle_name,
        s.last_name,
        s.phone as student_phone,
        s.email as student_email,
        s.address as student_address,
        s.photo_url as student_photo,
        c.name as company_name,
        c.code as company_code
      FROM payments p
      JOIN students s ON p.student_id = s.id
      LEFT JOIN companies c ON p.company_id = c.id
      ${whereClause}
      ORDER BY p.payment_date DESC, p.created_at DESC
    `;

    const result = await query(sql, params);

    // Summary metrics (filtered by company if provided)
    let metricsFilter = '';
    const mParams: any[] = [];
    if (companyId && companyId !== 'All') {
      mParams.push(companyId);
      metricsFilter = `WHERE company_id::text = $1`;
    }

    const metricsSql = `
      SELECT 
        COALESCE(SUM(amount), 0)::float as total_amount,
        COUNT(*)::int as total_count,
        COALESCE(SUM(CASE WHEN payment_date = CURRENT_DATE THEN amount ELSE 0 END), 0)::float as today_amount,
        COALESCE(SUM(CASE WHEN date_trunc('month', payment_date) = date_trunc('month', CURRENT_DATE) THEN amount ELSE 0 END), 0)::float as month_amount
      FROM payments
      ${metricsFilter}
    `;
    const metricsResult = await query(metricsSql, mParams);
    const metrics = metricsResult.rows[0];

    return NextResponse.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
      metrics: {
        totalAmount: metrics.total_amount,
        totalCount: metrics.total_count,
        todayAmount: metrics.today_amount,
        monthAmount: metrics.month_amount,
      },
    });
  } catch (err: any) {
    console.error('Error fetching payments:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const studentId = body.student_id?.trim();
    const amount = parseFloat(body.amount);
    const feeType = body.fee_type?.trim();
    const paymentMethod = body.payment_method?.trim();
    const paymentDate = body.payment_date?.trim() || new Date().toISOString().slice(0, 10);
    const referenceNo = body.reference_no?.trim() || null;
    const notes = body.notes?.trim() || null;

    if (!studentId) {
      return NextResponse.json({ error: 'Please select a student' }, { status: 400 });
    }
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }
    if (!feeType) {
      return NextResponse.json({ error: 'Fee type is required' }, { status: 400 });
    }
    if (!paymentMethod) {
      return NextResponse.json({ error: 'Payment method is required' }, { status: 400 });
    }

    // Check student existence & fetch company_id
    const studentCheck = await query(
      `SELECT id, first_name, middle_name, last_name, phone, company_id FROM students WHERE id::text = $1`,
      [studentId]
    );
    if (studentCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
    }

    const student = studentCheck.rows[0];
    let companyId = body.company_id?.trim() || student.company_id;
    if (!companyId) {
      const compRes = await query(`SELECT id FROM companies WHERE is_active = true ORDER BY created_at ASC LIMIT 1`);
      companyId = compRes.rows[0]?.id || null;
    }

    // Generate unique sequential receipt number e.g. RCP-2026-0007
    const countRes = await query(`SELECT COUNT(*) as count FROM payments`);
    const nextNum = parseInt(countRes.rows[0].count, 10) + 1;
    const year = new Date().getFullYear();
    const receiptNo = `RCP-${year}-${String(nextNum).padStart(4, '0')}`;

    const insertRes = await query(
      `INSERT INTO payments (
        receipt_no, student_id, company_id, amount, fee_type, payment_method,
        payment_date, reference_no, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        receiptNo,
        studentId,
        companyId,
        amount,
        feeType,
        paymentMethod,
        paymentDate,
        referenceNo,
        notes,
      ]
    );

    const newPayment = insertRes.rows[0];

    // Return with joined student and company info
    const fullRes = await query(
      `SELECT 
        p.id,
        p.receipt_no,
        p.student_id,
        p.company_id,
        p.amount::float as amount,
        p.fee_type,
        p.payment_method,
        p.payment_date,
        p.reference_no,
        p.notes,
        p.created_at,
        s.first_name,
        s.middle_name,
        s.last_name,
        s.phone as student_phone,
        s.email as student_email,
        s.address as student_address,
        s.photo_url as student_photo,
        c.name as company_name,
        c.code as company_code
      FROM payments p
      JOIN students s ON p.student_id = s.id
      LEFT JOIN companies c ON p.company_id = c.id
      WHERE p.id = $1`,
      [newPayment.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully',
      data: fullRes.rows[0],
    }, { status: 201 });
  } catch (err: any) {
    console.error('Error recording payment:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to record payment' },
      { status: 500 }
    );
  }
}
