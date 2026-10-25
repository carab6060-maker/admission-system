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
  console.log('Connecting to Neon PostgreSQL for Accounting Migration...');

  const pool = new Pool({ connectionString });

  try {
    // 1. Create payments table
    console.log('Creating payments table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        receipt_no VARCHAR(50) UNIQUE NOT NULL,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        amount NUMERIC(10, 2) NOT NULL,
        fee_type VARCHAR(100) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
        reference_no VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
      CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date DESC);
      CREATE INDEX IF NOT EXISTS idx_payments_receipt ON payments(receipt_no);
    `);
    console.log('Payments table created successfully.');

    // 2. Fetch students to seed realistic payments
    const studentsRes = await pool.query(`SELECT id, first_name, last_name FROM students ORDER BY created_at ASC`);
    const students = studentsRes.rows;

    if (students.length > 0) {
      console.log(`Found ${students.length} students. Checking existing payments...`);
      const existingPayments = await pool.query(`SELECT COUNT(*) as count FROM payments`);
      
      if (parseInt(existingPayments.rows[0].count, 10) === 0) {
        console.log('Seeding initial student fee payments...');
        
        const samplePayments = [
          {
            receipt_no: 'RCP-2026-0001',
            student_id: students[0].id,
            amount: 150.00,
            fee_type: 'Admission Fee',
            payment_method: 'Zaad Service',
            payment_date: '2026-10-20',
            reference_no: 'ZD-8492019',
            notes: 'Full admission registration fee paid via Zaad'
          },
          {
            receipt_no: 'RCP-2026-0002',
            student_id: students[0].id,
            amount: 80.00,
            fee_type: 'Tuition Fee',
            payment_method: 'Zaad Service',
            payment_date: '2026-10-22',
            reference_no: 'ZD-8501142',
            notes: 'First month tuition fee'
          },
          {
            receipt_no: 'RCP-2026-0003',
            student_id: students[1] ? students[1].id : students[0].id,
            amount: 150.00,
            fee_type: 'Admission Fee',
            payment_method: 'EVC Plus',
            payment_date: '2026-10-21',
            reference_no: 'EVC-991204',
            notes: 'New enrollment payment'
          },
          {
            receipt_no: 'RCP-2026-0004',
            student_id: students[2] ? students[2].id : students[0].id,
            amount: 45.00,
            fee_type: 'ID & Books Fee',
            payment_method: 'Cash',
            payment_date: '2026-10-23',
            reference_no: 'CSH-0042',
            notes: 'Student ID card and course books'
          },
          {
            receipt_no: 'RCP-2026-0005',
            student_id: students[3] ? students[3].id : students[0].id,
            amount: 150.00,
            fee_type: 'Admission Fee',
            payment_method: 'Edahab',
            payment_date: '2026-10-24',
            reference_no: 'ED-319024',
            notes: 'Admission processing fee'
          },
          {
            receipt_no: 'RCP-2026-0006',
            student_id: students[4] ? students[4].id : students[0].id,
            amount: 200.00,
            fee_type: 'Tuition Fee',
            payment_method: 'Bank Transfer',
            payment_date: '2026-10-25',
            reference_no: 'IBS-9402194',
            notes: 'Semester tuition installment paid via IBS Bank'
          }
        ];

        for (const p of samplePayments) {
          await pool.query(
            `INSERT INTO payments (
              receipt_no, student_id, amount, fee_type, payment_method,
              payment_date, reference_no, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (receipt_no) DO NOTHING`,
            [
              p.receipt_no,
              p.student_id,
              p.amount,
              p.fee_type,
              p.payment_method,
              p.payment_date,
              p.reference_no,
              p.notes
            ]
          );
        }
        console.log(`Seeded ${samplePayments.length} initial payment records.`);
      } else {
        console.log('Payments already seeded.');
      }
    }

    console.log('Accounting migration finished successfully!');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
