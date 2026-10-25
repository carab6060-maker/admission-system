# Student Admission Management System (EduAdmit)

A clean, modern, and fully functional **Student Admission Management System** built with **Next.js 14**, **React 18**, **Tailwind CSS**, and **PostgreSQL (Neon)**. Designed using the exact layout, typography, sidebar structure, and professional appearance established in the Dental and Car Rental management systems.

---

## 🌟 Key Features

### 1. Admissions Dashboard (`/dashboard`)
- **Real-Time Database KPIs**:
  - **Total Students**
  - **New Admissions** (admissions recorded within last 30 days)
  - **Approved Applications**
  - **Pending Applications**
  - **Rejected Applications**
- **Recent Student Registrations**: Live list with student ID, full name, class, parent info, admission date, and admission status.
- **Class / Grade Distribution**: Visual breakdown of enrollment numbers across grade levels.
- **Manual & Auto Refresh**: Instant stats sync button.

### 2. Student Registration (`/dashboard/register`)
- **Auto-Generated Student ID**: Sequential format (e.g. `STU-2026-0001`, `STU-2026-0002`, `STU-2026-0007`) fetched from the database.
- **Comprehensive Fields**:
  - Student ID (auto-generated, with regenerate option)
  - Full Legal Name
  - Gender (Male, Female, Other)
  - Date of Birth (with dynamic age calculator)
  - Student Phone Number
  - Student Email (optional)
  - Parent / Guardian Name & Phone Number
  - Residential Address
  - Class / Grade Applying For (Kindergarten, Pre-K, Grade 1 to 12)
  - Previous School Attended (optional)
  - Admission Date (defaults to today)
  - Student Photo (optional image link)
  - Initial Application Status (Pending / Approved / Rejected)
  - Special remarks / notes
- **Form Actions**:
  - **Save Student**: Complete client and database validation with toast feedback.
  - **Clear Form**: Resets fields and requests the next fresh ID.
  - **Cancel**: Safe return to student directory.
  - **Post-Registration Banner**: Quick link to view or print the official admission slip right after saving.

### 3. Student Management & Records (`/dashboard/students`)
- **Full Directory View**: Paginated list of registered students with student photo/avatar badges.
- **Search**: Instant search across Student ID, Student Name, Phone, and Parent Name.
- **Filters**:
  - Filter by Class / Grade (Kindergarten through Grade 12)
  - Filter by Admission Status (All, Pending, Approved, Rejected)
  - Quick status count pills.
- **Interactive Student Details Modal**: Comprehensive dossier of student bio, contact, parent details, and notes.
- **Edit Student Modal**: In-place editing of all student and guardian fields with real database persistence.
- **Delete Student**: Destructive action with confirmation dialog modal.
- **Print Official Admission Slip**: High-resolution admission certificate / slip with institution header, student photo, admission details, stamp section, and print button (`window.print()`).

### 4. Admission Status Workflow
- Every student application tracks status: `Pending`, `Approved`, or `Rejected`.
- Authorized staff can update status in 1 click directly via the inline status dropdown in the table or inside the detail/edit modals.
- Updating status automatically updates dashboard statistics and charts in real time.

---

## 🎨 Design & Layout
- **Theme**: SaaS theme (`#F4F6FB` light page background, `#FFFFFF` crisp cards, `#161938` dark sidebar with blue `#2563EB` active indicators).
- **Collapsible Sidebar**: Clean sidebar with expand/collapse toggle (`w-64` expanded, `w-[72px]` collapsed).
- **Accordion Navigation**: Sub-sections expand **only on click**, never automatically.
- **Responsive Design**: Mobile drawer overlay with hamburger trigger on the top bar.
- **Toast Notifications**: Built-in non-intrusive feedback toasts for success, warnings, and errors.

---

## 🗄️ Database & Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS + Custom CSS Design System
- **Database**: PostgreSQL (Neon Serverless with WebSocket pooling)
- **Database Driver**: `pg` & `@neondatabase/serverless`
- **Authentication**: JWT token with bcrypt password hashing

### Database Schema (`students` table)
```sql
CREATE TABLE students (
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
```

---

## 🚀 Getting Started

### 1. Environment Configuration
The database URL and JWT secret are configured in `.env.local`:
```env
DATABASE_URL="postgresql://neondb_owner:npg_iabStVkHd71T@ep-blue-sunset-b5mp00gl-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="student-admission-mgmt-secure-key-2026-production"
```

### 2. Run Database Migration (Already Executed & Seeded)
```bash
npm run db:migrate
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Build & Run Production Server
```bash
npm run build
npm run start
```

---

## 🔐 Default Login Credentials

You can sign in to the portal using the database admin account:
- **Username / Email**: `admin` (or `carab`)
- **Password**: `admin123`
