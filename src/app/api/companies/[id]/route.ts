import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(request);
    const { id } = params;

    if (authUser && authUser.role !== 'superadmin' && authUser.companyId !== id) {
      return NextResponse.json({ error: 'Access denied to this school' }, { status: 403 });
    }

    const res = await query(
      `SELECT 
        c.*,
        COUNT(DISTINCT s.id)::int as total_students,
        COUNT(DISTINCT u.id)::int as total_users,
        COALESCE(SUM(p.amount), 0)::float as total_revenue
      FROM companies c
      LEFT JOIN students s ON s.company_id = c.id
      LEFT JOIN users u ON u.company_id = c.id
      LEFT JOIN payments p ON p.company_id = c.id
      WHERE c.id::text = $1
      GROUP BY c.id
      LIMIT 1`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch company' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(request);
    if (authUser && authUser.role !== 'superadmin') {
      return NextResponse.json({ error: 'Only Super Admin can update school details' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();

    const check = await query(`SELECT * FROM companies WHERE id::text = $1 LIMIT 1`, [id]);
    if (check.rows.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const current = check.rows[0];

    // Check code uniqueness if changed
    if (body.code && body.code.toUpperCase() !== current.code.toUpperCase()) {
      const codeCheck = await query(
        `SELECT id FROM companies WHERE UPPER(code) = $1 AND id::text != $2`,
        [body.code.toUpperCase(), id]
      );
      if (codeCheck.rows.length > 0) {
        return NextResponse.json({ error: 'Company code is already taken' }, { status: 409 });
      }
    }

    const name = body.name !== undefined ? body.name.trim() : current.name;
    const code = body.code !== undefined ? body.code.trim().toUpperCase() : current.code;
    const phone = body.phone !== undefined ? body.phone.trim() : current.phone;
    const email = body.email !== undefined ? body.email.trim() : current.email;
    const address = body.address !== undefined ? body.address.trim() : current.address;
    const logoUrl = body.logo_url !== undefined ? body.logo_url.trim() : current.logo_url;
    const currency = body.currency !== undefined ? body.currency.trim() : current.currency;
    const isActive = body.is_active !== undefined ? Boolean(body.is_active) : current.is_active;

    const updateRes = await query(
      `UPDATE companies SET
        name = $1,
        code = $2,
        phone = $3,
        email = $4,
        address = $5,
        logo_url = $6,
        currency = $7,
        is_active = $8,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [name, code, phone, email, address, logoUrl, currency, isActive, current.id]
    );

    return NextResponse.json({
      success: true,
      message: `Company "${name}" updated successfully`,
      data: updateRes.rows[0],
    });
  } catch (err: any) {
    console.error('Error updating company:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update company' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(request);
    if (authUser && authUser.role !== 'superadmin') {
      return NextResponse.json({ error: 'Only Super Admin can delete a school/company' }, { status: 403 });
    }

    const { id } = params;

    const countCheck = await query(`SELECT COUNT(*) as count FROM companies`);
    if (parseInt(countCheck.rows[0].count, 10) <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the only existing company in the system.' },
        { status: 403 }
      );
    }

    const deleteRes = await query(`DELETE FROM companies WHERE id::text = $1 RETURNING name`, [id]);
    if (deleteRes.rows.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Company "${deleteRes.rows[0].name}" deleted successfully`,
    });
  } catch (err: any) {
    console.error('Error deleting company:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete company' },
      { status: 500 }
    );
  }
}
