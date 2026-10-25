const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

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
  return null;
}

async function runMigration() {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    console.error('Error: DATABASE_URL not found.');
    process.exit(1);
  }

  console.log('Connecting to Neon PostgreSQL database...');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to Neon PostgreSQL successfully!');

    // Ensure pgcrypto extension for gen_random_uuid
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    // 1. Ensure users table exists
    console.log('Ensuring users table exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(100) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'admin',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default admin accounts (password: admin123)
    const adminHash = bcrypt.hashSync('admin123', 10);
    await client.query(`
      INSERT INTO users (username, email, password_hash, full_name, role)
      VALUES 
        ('admin', 'admin@admissions.edu', $1, 'System Administrator', 'admin'),
        ('carab', 'carab6060@gmail.com', $1, 'carab', 'admin'),
        ('superadmin', 'superadmin@admissions.edu', $1, 'Super Administrator', 'superadmin')
      ON CONFLICT (username) DO NOTHING;
    `, [adminHash]);
    console.log('Admin accounts verified in users table.');

    // 2. Ensure students table exists
    console.log('Ensuring students table exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        gender VARCHAR(20) NOT NULL,
        date_of_birth DATE NOT NULL,
        phone VARCHAR(50) NOT NULL,
        parent_name VARCHAR(255) NOT NULL,
        parent_phone VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        address TEXT NOT NULL,
        grade_applying VARCHAR(50) NOT NULL,
        previous_school VARCHAR(255),
        admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
        photo_url TEXT,
        status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
      CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
      CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade_applying);
      CREATE INDEX IF NOT EXISTS idx_students_created ON students(created_at DESC);
    `);

    // Seed students if table is empty
    const countRes = await client.query('SELECT count(*) FROM students');
    const count = parseInt(countRes.rows[0].count, 10);
    console.log(`Current students in database: ${count}`);

    if (count === 0) {
      console.log('Seeding initial student records...');
      const seedStudents = [
        {
          student_id: 'STU-2026-0001',
          full_name: 'Amina Ali Hassan',
          gender: 'Female',
          date_of_birth: '2012-04-15',
          phone: '+252 61 5123456',
          parent_name: 'Ali Hassan Warsame',
          parent_phone: '+252 61 9876543',
          email: 'amina.hassan@example.com',
          address: 'Hodan District, Mogadishu',
          grade_applying: 'Grade 8',
          previous_school: 'Mogadishu Primary School',
          admission_date: '2026-10-15',
          status: 'Approved',
          notes: 'High academic performance in entrance test.'
        },
        {
          student_id: 'STU-2026-0002',
          full_name: 'Liban Mohamed Jama',
          gender: 'Male',
          date_of_birth: '2010-08-22',
          phone: '+252 61 5234567',
          parent_name: 'Mohamed Jama Farah',
          parent_phone: '+252 61 9765432',
          email: 'liban.jama@example.com',
          address: 'Wadajir, Airport Road',
          grade_applying: 'Grade 10',
          previous_school: 'Banadir Horizon Academy',
          admission_date: '2026-10-18',
          status: 'Approved',
          notes: 'Transfer applicant from Banadir Horizon.'
        },
        {
          student_id: 'STU-2026-0003',
          full_name: 'Safia Abdi Nur',
          gender: 'Female',
          date_of_birth: '2014-01-10',
          phone: '+252 61 5345678',
          parent_name: 'Abdi Nur Osman',
          parent_phone: '+252 61 9654321',
          email: 'safia.nur@example.com',
          address: 'Hamar Weyne, Ocean View',
          grade_applying: 'Grade 6',
          previous_school: 'Sunrise Junior School',
          admission_date: '2026-10-22',
          status: 'Pending',
          notes: 'Awaiting birth certificate verification.'
        },
        {
          student_id: 'STU-2026-0004',
          full_name: 'Khadar Ahmed Shire',
          gender: 'Male',
          date_of_birth: '2011-11-05',
          phone: '+252 61 5456789',
          parent_name: 'Ahmed Shire Rage',
          parent_phone: '+252 61 9543210',
          email: 'khadar.shire@example.com',
          address: 'Yaqshid, General Daud St',
          grade_applying: 'Grade 9',
          previous_school: 'Al-Hikma Academy',
          admission_date: '2026-10-24',
          status: 'Pending',
          notes: 'Application submitted recently. Pending interview.'
        },
        {
          student_id: 'STU-2026-0005',
          full_name: 'Maryan Yusuf Omar',
          gender: 'Female',
          date_of_birth: '2013-06-30',
          phone: '+252 61 5567890',
          parent_name: 'Yusuf Omar Gedi',
          parent_phone: '+252 61 9432109',
          email: '',
          address: 'Hawl Wadag, Bakara Area',
          grade_applying: 'Grade 7',
          previous_school: 'Global Somali School',
          admission_date: '2026-10-10',
          status: 'Rejected',
          notes: 'Capacity for Grade 7 reached.'
        }
      ];

      for (const s of seedStudents) {
        await client.query(`
          INSERT INTO students (
            student_id, full_name, gender, date_of_birth, phone,
            parent_name, parent_phone, email, address,
            grade_applying, previous_school, admission_date, status, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (student_id) DO NOTHING;
        `, [
          s.student_id, s.full_name, s.gender, s.date_of_birth, s.phone,
          s.parent_name, s.parent_phone, s.email, s.address,
          s.grade_applying, s.previous_school, s.admission_date, s.status, s.notes
        ]);
      }
      console.log('Seeded initial students successfully.');
    }

    const finalCount = await client.query('SELECT count(*) FROM students');
    console.log(`Database is ready with ${finalCount.rows[0].count} students.`);

  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
