const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
const fs = require('fs');
const path = require('path');

neonConfig.webSocketConstructor = ws;

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('DATABASE_URL=')) {
        return trimmed.substring('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
      }
    }
  }
  return 'postgresql://neondb_owner:npg_iF4cqv6kOnJt@ep-wispy-silence-b4twibe9-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
}

async function run() {
  const connectionString = getDatabaseUrl();
  console.log('Connecting to Neon PostgreSQL for Multi-Company Migration...');

  const pool = new Pool({ connectionString });

  try {
    // 1. Create companies table
    console.log('Creating companies table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        logo_url TEXT,
        currency VARCHAR(10) DEFAULT 'USD',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_companies_code ON companies(code);
    `);

    // 2. Seed initial companies
    console.log('Seeding initial companies / schools...');
    const seedCompanies = [
      {
        name: 'Al-Nour Academy',
        code: 'ALN-01',
        phone: '+252 61 5551122',
        email: 'info@alnouracademy.edu',
        address: 'KM4, Hodan District, Mogadishu',
        currency: 'USD'
      },
      {
        name: 'Daru-Salaam International School',
        code: 'DSI-02',
        phone: '+252 61 7773344',
        email: 'admissions@darusalaamschool.edu',
        address: 'Wadajir District, Mogadishu',
        currency: 'USD'
      },
      {
        name: 'Hodan Higher Institute',
        code: 'HOD-03',
        phone: '+252 61 8884455',
        email: 'contact@hodaninstitute.edu',
        address: 'Taleex, Hodan District, Mogadishu',
        currency: 'USD'
      }
    ];

    for (const c of seedCompanies) {
      await pool.query(
        `INSERT INTO companies (name, code, phone, email, address, currency)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (code) DO NOTHING`,
        [c.name, c.code, c.phone, c.email, c.address, c.currency]
      );
    }

    const compRes = await pool.query(`SELECT id, name, code FROM companies ORDER BY created_at ASC`);
    const companies = compRes.rows;
    const defaultCompanyId = companies[0].id;
    console.log(`Found/Seeded ${companies.length} companies. Default Company ID: ${defaultCompanyId}`);

    // 3. Add company_id to students table
    console.log('Adding company_id to students table...');
    await pool.query(`
      ALTER TABLE students ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_students_company ON students(company_id);
    `);
    // Assign existing students to companies
    await pool.query(
      `UPDATE students SET company_id = $1 WHERE company_id IS NULL`,
      [defaultCompanyId]
    );

    // Spread some students to the 2nd company for rich demo data if available
    if (companies[1]) {
      await pool.query(
        `UPDATE students SET company_id = $1 WHERE id IN (SELECT id FROM students ORDER BY created_at DESC LIMIT 2)`,
        [companies[1].id]
      );
    }

    // 4. Add company_id to payments table
    console.log('Adding company_id to payments table...');
    await pool.query(`
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_payments_company ON payments(company_id);
    `);
    // Backfill payment company_id from student's company_id
    await pool.query(`
      UPDATE payments p
      SET company_id = s.company_id
      FROM students s
      WHERE p.student_id = s.id AND p.company_id IS NULL;
    `);
    await pool.query(
      `UPDATE payments SET company_id = $1 WHERE company_id IS NULL`,
      [defaultCompanyId]
    );

    // 5. Add company_id to users table
    console.log('Adding company_id to users table...');
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
    `);
    // Superadmin has NULL company_id (can access all), while normal admins/staff can be tied to default company
    await pool.query(
      `UPDATE users SET company_id = $1 WHERE role != 'superadmin' AND company_id IS NULL`,
      [defaultCompanyId]
    );

    console.log('Multi-Company migration completed successfully!');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
