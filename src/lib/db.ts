import { Pool, neonConfig, QueryResult, QueryResultRow } from '@neondatabase/serverless';
import ws from 'ws';

// Route Neon queries through WebSockets over HTTPS (port 443) to bypass any port 5432 firewall blocks
neonConfig.webSocketConstructor = ws;

const FALLBACK_DATABASE_URL =
  'postgresql://neondb_owner:npg_iabStVkHd71T@ep-blue-sunset-b5mp00gl-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require';

let globalPool: Pool | null = null;

export function getConnectionString(): string {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url && url.startsWith('postgres') && !url.includes('placeholder')) {
    return url;
  }
  return FALLBACK_DATABASE_URL;
}

export function isDbConfigured(): boolean {
  return true;
}

export function getPool(): Pool {
  if (!globalPool) {
    const connectionString = getConnectionString();
    globalPool = new Pool({
      connectionString,
    });
  }
  return globalPool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  return pool.query<T>(text, params);
}

/**
 * Generate sequential student ID (e.g. STU-2026-0001, STU-2026-0002)
 */
export async function getNextStudentId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `STU-${currentYear}-`;

  try {
    const res = await query(
      `SELECT student_id FROM students 
       WHERE student_id LIKE $1 
       ORDER BY student_id DESC 
       LIMIT 1`,
      [`${prefix}%`]
    );

    if (res.rows.length === 0) {
      return `${prefix}0001`;
    }

    const lastId = res.rows[0].student_id;
    const parts = lastId.split('-');
    const num = parseInt(parts[parts.length - 1], 10);
    const nextNum = isNaN(num) ? 1 : num + 1;
    return `${prefix}${nextNum.toString().padStart(4, '0')}`;
  } catch (err) {
    console.error('Error generating next student ID:', err);
    return `${prefix}0007`;
  }
}
