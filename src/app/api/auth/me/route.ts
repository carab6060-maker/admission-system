import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    const res = await query(
      `SELECT id, username, email, full_name, role, company_id FROM users WHERE id = $1 LIMIT 1`,
      [payload.userId]
    );

    if (res.rows.length > 0) {
      const u = res.rows[0];
      return NextResponse.json({
        user: {
          id: u.id,
          username: u.username,
          email: u.email,
          fullName: u.full_name,
          role: u.role,
          companyId: u.company_id || null,
        },
      });
    }

    return NextResponse.json({
      user: {
        id: payload.userId,
        username: payload.username || 'admin',
        email: payload.email,
        fullName: payload.fullName || 'Administrator',
        role: payload.role || 'admin',
      },
    });
  } catch {
    return NextResponse.json({
      user: {
        id: payload.userId,
        username: payload.username || 'admin',
        email: payload.email,
        fullName: payload.fullName || 'Administrator',
        role: payload.role || 'admin',
      },
    });
  }
}
