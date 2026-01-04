import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
});

const schemaQueries =[ `
-- =============================================
-- BipulSikshya Niketan School Management System
-- Updated PostgreSQL Schema 
-- Fully aligned with business plan + real-time features
-- =============================================

-- 1) Enum for user roles (fixed typo)
CREATE TYPE user_role AS ENUM (
  'principal',
  'class_teacher',
  'teacher',
  'accountant',
  'admin',
  'parent',
  'student',
  'other_staff'
);`,
`
-- 2) Core users table
CREATE TABLE IF NOT EXISTS app_users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username VARCHAR(150) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(150),
  last_name VARCHAR(150),
  role user_role NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_staff BOOLEAN DEFAULT FALSE,
  profile_pic VARCHAR(1024),
  phone VARCHAR(32),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_users_email ON app_users(email);
CREATE INDEX idx_app_users_role ON app_users(role);
`,`
-- 3) Academic batches
CREATE TABLE IF NOT EXISTS batches (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  batch_start VARCHAR(50) NOT NULL,   -- e.g., "2025"
  batch_end VARCHAR(50) NOT NULL,     -- e.g., "2026"
  name VARCHAR(100) GENERATED ALWAYS AS (batch_start || '-' || batch_end) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(batch_start, batch_end)
);
`,`
-- 4) Grades (Nursery to Grade 10)
CREATE TABLE IF NOT EXISTS grades (
  id SMALLINT PRIMARY KEY,            -- -2=Nursery, -1=LKG, 0=UKG, 1=Grade 1 ... 10=Grade 10
  name VARCHAR(50) NOT NULL,
  ordinal SMALLINT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`,`
-- 5) Sections (A, B, C per grade & batch)
CREATE TABLE IF NOT EXISTS sections (
  id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  grade_id SMALLINT NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
  batch_id INT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  name CHAR(1) NOT NULL,              -- 'A', 'B', 'C' etc.
  class_teacher_id BIGINT REFERENCES app_users(id),
  UNIQUE(grade_id, batch_id, name)
);
`,`
-- 6) Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  grade_id SMALLINT NOT NULL REFERENCES grades(id) ON DELETE RESTRICT,
  code VARCHAR(30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name, grade_id)
);
`,`
-- 7) Staff profile
CREATE TABLE IF NOT EXISTS staff (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES app_users(id) ON DELETE CASCADE,
  staff_code VARCHAR(50) UNIQUE,
  address TEXT,
  gender VARCHAR(20),
  dob DATE,
  qualification VARCHAR(255),
  staff_type user_role NOT NULL CHECK (staff_type IN ('principal','class_teacher','teacher','accountant','admin','other_staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`,`
-- 8) Staff → Subjects (many-to-many)
CREATE TABLE IF NOT EXISTS staff_subjects (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  staff_id BIGINT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  assigned_from TIMESTAMPTZ DEFAULT now(),
  assigned_to TIMESTAMPTZ,
  UNIQUE(staff_id, subject_id, assigned_from)
);
`,`
-- 9) Students
CREATE TABLE IF NOT EXISTS students (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES app_users(id) ON DELETE CASCADE,
  roll_no VARCHAR(50) UNIQUE,
  gender VARCHAR(20),
  dob DATE,
  address TEXT,
  admission_date DATE,
  guardian_contact VARCHAR(100),
  is_scholarship BOOLEAN DEFAULT FALSE,
  scholarship_percentage SMALLINT CHECK (scholarship_percentage BETWEEN 0 AND 100),
  bus_route_id INT,                   -- references bus_routes (added later)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_students_roll ON students(roll_no);
`,`
-- 10) Parents
CREATE TABLE IF NOT EXISTS parents (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES app_users(id) ON DELETE CASCADE,
  relationship VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`,`
-- Parent ↔ Student (many-to-many)
CREATE TABLE IF NOT EXISTS parent_students (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_id BIGINT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  is_primary_contact BOOLEAN DEFAULT FALSE,
  UNIQUE(parent_id, student_id)
);
`,`
-- 11) Enrollments (student in grade/section/batch)
CREATE TABLE IF NOT EXISTS enrollments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  grade_id SMALLINT NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
  section_id SMALLINT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  batch_id INT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  enrolled_on TIMESTAMPTZ NOT NULL DEFAULT now(),
  status VARCHAR(30) DEFAULT 'active',
  UNIQUE(student_id, batch_id)
);
`,`
-- 12) Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present','absent','late','excused')),
  marked_by BIGINT REFERENCES app_users(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, date)
);
`,`
-- 13) Exams
CREATE TABLE IF NOT EXISTS exams (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  grade_id SMALLINT REFERENCES grades(id),
  batch_id INT REFERENCES batches(id),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`,`
-- 14) Marks
CREATE TABLE IF NOT EXISTS marks (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exam_id BIGINT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  internal_mark INT CHECK (internal_mark >= 0),
  exam_mark INT CHECK (exam_mark >= 0),
  total_mark INT GENERATED ALWAYS AS (COALESCE(internal_mark,0) + COALESCE(exam_mark,0)) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, exam_id, subject_id)
);
`,`
-- 15) Fee heads & student fees
CREATE TABLE IF NOT EXISTS fee_heads (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`,`
CREATE TABLE IF NOT EXISTS student_fees (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fee_head_id BIGINT NOT NULL REFERENCES fee_heads(id) ON DELETE RESTRICT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  due_date DATE,
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`,`
CREATE TABLE IF NOT EXISTS payments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_fee_id BIGINT REFERENCES student_fees(id) ON DELETE SET NULL,
  student_id BIGINT REFERENCES students(id),
  amount NUMERIC(12,2) NOT NULL,
  paid_on TIMESTAMPTZ NOT NULL DEFAULT now(),
  method VARCHAR(50),
  transaction_ref VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`,`
-- 16) Bus / Transport
CREATE TABLE IF NOT EXISTS bus_routes (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  route_name VARCHAR(100) NOT NULL,
  monthly_fee NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Link in students table (already added bus_route_id above)
`,`

-- 17) Extracurricular Events
CREATE TABLE IF NOT EXISTS events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  location VARCHAR(100),               -- e.g., 'Swimming Pool', 'Futsal Court', 'Auditorium'
  created_by BIGINT REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
`,`
CREATE TABLE IF NOT EXISTS event_registrations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, event_id)
);
`,`
-- 18) Real-time Chat (WebSockets support)
CREATE TABLE IF NOT EXISTS chat_rooms (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('class','section','private','group')),
  grade_id SMALLINT REFERENCES grades(id),
  section_id SMALLINT REFERENCES sections(id),
  name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now()
);
`,`
-- 21) File uploads metadata
CREATE TABLE IF NOT EXISTS uploaded_files (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_user_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
  purpose VARCHAR(100),
  url VARCHAR(2000) NOT NULL,
  filename VARCHAR(255),
  mime_type VARCHAR(100),
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`,`
CREATE TABLE IF NOT EXISTS messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id BIGINT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id BIGINT NOT NULL REFERENCES app_users(id),
  content TEXT,
  file_id BIGINT REFERENCES uploaded_files(id),
  sent_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_room_sent ON messages(room_id, sent_at DESC);
`,`
-- 19) Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title VARCHAR(255),
  message TEXT NOT NULL,
  target_role user_role,
  target_user_id BIGINT REFERENCES app_users(id),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`,`
-- 20) Leaves
CREATE TABLE IF NOT EXISTS staff_leaves (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  staff_id BIGINT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(30) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
`,`
CREATE TABLE IF NOT EXISTS student_leaves (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(30) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
`,`
-- 22) Push notification tokens
CREATE TABLE IF NOT EXISTS device_tokens (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform VARCHAR(20),
  last_seen TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token)
);
`,`
-- 23) Audit log
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id BIGINT REFERENCES app_users(id),
  action VARCHAR(200) NOT NULL,
  target_table VARCHAR(100),
  target_id BIGINT,
  ip_address VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`,`
-- 24) Updated_at trigger function
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`,

`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_app_users_updated_at') THEN
      CREATE TRIGGER trg_app_users_updated_at BEFORE UPDATE ON app_users FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
    END IF;
  END $$;`,

`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_app_users_updated_at') THEN
        CREATE TRIGGER trg_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
    END IF;
  END $$;`,

`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_app_users_updated_at') THEN
        CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
    END IF;
  END $$;`,

`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_app_users_updated_at') THEN
      CREATE TRIGGER trg_staff_leaves_updated_at BEFORE UPDATE ON staff_leaves FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();  
    END IF;
  END $$;`,
  
`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_app_users_updated_at') THEN
        CREATE TRIGGER trg_student_leaves_updated_at BEFORE UPDATE ON student_leaves FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
    END IF;
  END $$;`,
  
  `
-- Apply triggers
-- CREATE TRIGGER trg_app_users_updated_at BEFORE UPDATE ON app_users FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
-- CREATE TRIGGER trg_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
-- CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
-- CREATE TRIGGER trg_staff_leaves_updated_at BEFORE UPDATE ON staff_leaves FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
-- CREATE TRIGGER trg_student_leaves_updated_at BEFORE UPDATE ON student_leaves FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- =============================================
-- END OF SCHEMA
-- =============================================
`];
(async () => {
  const client = await pool.connect();
  try {
    console.log('Starting database initialization...');
    await client.query('BEGIN');
    
    for (const query of schemaQueries) {
      console.log(`Executing: ${query.substring(0, 50)}...`); // Log snippet for progress
      await client.query(query);
    }
    
    await client.query('COMMIT');
    console.log('Database schema created/updated successfully!');
    console.log('Next: Insert initial data (e.g., grades from Nursery to 10).');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during schema creation:', err.message);
    console.error('Stack:', err.stack);
    if (err.code) console.error('PostgreSQL Error Code:', err.code); // e.g., '42P07' for duplicate
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    console.log('Connection pool closed.');
  }
})();
