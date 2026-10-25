import { Pool, neonConfig, QueryResult, QueryResultRow } from '@neondatabase/serverless';
import ws from 'ws';

// Route Neon queries through WebSockets over HTTPS (port 443)
neonConfig.webSocketConstructor = ws;

const FALLBACK_DATABASE_URL =
  'postgresql://neondb_owner:npg_iF4cqv6kOnJt@ep-wispy-silence-b4twibe9-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

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
