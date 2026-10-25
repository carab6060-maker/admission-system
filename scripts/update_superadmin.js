const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
neonConfig.webSocketConstructor = ws;

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_iF4cqv6kOnJt@ep-wispy-silence-b4twibe9-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function update() {
  const pool = new Pool({ connectionString });
  try {
    await pool.query(`UPDATE users SET role = 'superadmin' WHERE username = 'carab' OR username = 'superadmin'`);
    console.log('Successfully confirmed superadmin roles in database.');
    const res = await pool.query(`SELECT username, email, role, is_active FROM users`);
    console.log(res.rows);
  } catch (err) {
    console.error('Error updating users:', err);
  } finally {
    await pool.end();
  }
}

update();
