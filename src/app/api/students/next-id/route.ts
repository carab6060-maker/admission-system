import { NextResponse } from 'next/server';
import { getNextStudentId } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const nextId = await getNextStudentId();
    return NextResponse.json({ nextId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
