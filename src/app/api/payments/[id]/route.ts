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
      `SELECT 
        p.id,
        p.receipt_no,
        p.student_id,
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
        s.photo_url as student_photo
      FROM payments p
      JOIN students s ON p.student_id = s.id
      WHERE p.id::text = $1
      LIMIT 1`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch payment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const res = await query(
      `DELETE FROM payments WHERE id::text = $1 RETURNING receipt_no`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Payment ${res.rows[0].receipt_no} deleted successfully`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to delete payment' },
      { status: 500 }
    );
  }
}
