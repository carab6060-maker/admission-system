const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
const bcrypt = require('bcryptjs');

neonConfig.webSocketConstructor = ws;

const connectionString = 'postgresql://neondb_owner:npg_iF4cqv6kOnJt@ep-wispy-silence-b4twibe9-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const pool = new Pool({ connectionString });

async function seedCompanyAdmins() {
  try {
    const hash = bcrypt.hashSync('admin123', 10);
    const compRes = await pool.query('SELECT id, name, code FROM companies ORDER BY created_at ASC');
    const comps = compRes.rows;

    const usersToAdd = [
      {
        username: 'alnour',
        email: 'admin@alnouracademy.edu',
        full_name: 'Al-Nour Academy Admin',
        role: 'admin',
        company_id: comps[0]?.id
      },
      {
        username: 'darusalaam',
        email: 'admin@darusalaamschool.edu',
        full_name: 'Daru-Salaam Admin',
        role: 'admin',
        company_id: comps[1]?.id
      },
      {
        username: 'hodan',
        email: 'admin@hodaninstitute.edu',
        full_name: 'Hodan Institute Admin',
        role: 'admin',
        company_id: comps[2]?.id
      }
    ];

    for (const u of usersToAdd) {
      if (!u.company_id) continue;
      await pool.query(
        `INSERT INTO users (username, email, password_hash, full_name, role, company_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (username) DO UPDATE SET company_id = $6, password_hash = $3`,
        [u.username, u.email, hash, u.full_name, u.role, u.company_id]
      );
    }

    const allUsers = await pool.query(
      `SELECT u.username, u.email, u.full_name, u.role, c.name as company_name 
       FROM users u 
       LEFT JOIN companies c ON u.company_id = c.id 
       ORDER BY u.role DESC, u.created_at ASC`
    );
    console.log('ALL_USERS_START');
    console.log(JSON.stringify(allUsers.rows, null, 2));
    console.log('ALL_USERS_END');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

seedCompanyAdmins();
