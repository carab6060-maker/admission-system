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
  return 'postgresql://neondb_owner:npg_iF4cqv6kOnJt@ep-wispy-silence-b4twibe9-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
}

async function runMigration() {
  const connectionString = getDatabaseUrl();
  console.log('Connecting to Neon PostgreSQL database...');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to Neon PostgreSQL successfully!');

    // Ensure pgcrypto
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    // 1. Users table
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

    const adminHash = bcrypt.hashSync('admin123', 10);
    await client.query(`
      INSERT INTO users (username, email, password_hash, full_name, role)
      VALUES 
        ('admin', 'admin@admissions.edu', $1, 'System Administrator', 'admin'),
        ('carab', 'carab6060@gmail.com', $1, 'carab', 'admin'),
        ('superadmin', 'superadmin@admissions.edu', $1, 'Super Administrator', 'superadmin')
      ON CONFLICT (username) DO NOTHING;
    `, [adminHash]);

    // 2. Recreate students table without parent, student_id, and academic record
    console.log('Migrating students table to new streamlined schema...');
    await client.query(`DROP TABLE IF EXISTS students CASCADE;`);

    await client.query(`
      CREATE TABLE students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name VARCHAR(100) NOT NULL,
        middle_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        gender VARCHAR(20) NOT NULL,
        date_of_birth DATE NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        address TEXT NOT NULL,
        photo_url TEXT,
        status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX idx_students_status ON students(status);
      CREATE INDEX idx_students_created ON students(created_at DESC);
      CREATE INDEX idx_students_names ON students(first_name, last_name);
    `);

    console.log('Seeding initial student records...');
    const seedStudents = [
      {
        first_name: 'Amina',
        middle_name: 'Ali',
        last_name: 'Hassan',
        gender: 'Female',
        date_of_birth: '2012-04-15',
        phone: '+252 61 5123456',
        email: 'amina.hassan@example.com',
        address: 'Hodan District, Mogadishu',
        status: 'Approved'
      },
      {
        first_name: 'Liban',
        middle_name: 'Mohamed',
        last_name: 'Jama',
        gender: 'Male',
        date_of_birth: '2010-08-22',
        phone: '+252 61 5234567',
        email: 'liban.jama@example.com',
        address: 'Wadajir, Airport Road, Mogadishu',
        status: 'Approved'
      },
      {
        first_name: 'Safia',
        middle_name: 'Abdi',
        last_name: 'Nur',
        gender: 'Female',
        date_of_birth: '2014-01-10',
        phone: '+252 61 5345678',
        email: 'safia.nur@example.com',
        address: 'Hamar Weyne, Ocean View, Mogadishu',
        status: 'Pending'
      },
      {
        first_name: 'Khadar',
        middle_name: 'Ahmed',
        last_name: 'Shire',
        gender: 'Male',
        date_of_birth: '2011-11-05',
        phone: '+252 61 5456789',
        email: 'khadar.shire@example.com',
        address: 'Yaqshid, General Daud St, Mogadishu',
        status: 'Pending'
      },
      {
        first_name: 'Maryan',
        middle_name: 'Yusuf',
        last_name: 'Omar',
        gender: 'Female',
        date_of_birth: '2013-06-30',
        phone: '+252 61 5567890',
        email: 'maryan.omar@example.com',
        address: 'Hawl Wadag, Bakara Area, Mogadishu',
        status: 'Rejected'
      }
    ];

    for (const s of seedStudents) {
      await client.query(`
        INSERT INTO students (
          first_name, middle_name, last_name, gender, date_of_birth,
          phone, email, address, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
      `, [
        s.first_name, s.middle_name, s.last_name, s.gender, s.date_of_birth,
        s.phone, s.email, s.address, s.status
      ]);
    }

    const finalCount = await client.query('SELECT count(*) FROM students');
    console.log(`Students table migrated and ready with ${finalCount.rows[0].count} students.`);

  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
