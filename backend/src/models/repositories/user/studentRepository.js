// src/repositories/user/studentRepository.js
import pool from "../../../config/db.js";

// Find student core row by id
const findById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM students WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
};

// Find student (join with app_users) by user id
const findByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT s.*, a.email, a.username, a.first_name, a.last_name, a.role
     FROM students s
     JOIN app_users a ON s.user_id = a.id
     WHERE s.user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

// Find student by roll number
const findByRollNo = async (rollNo) => {
  const result = await pool.query(
    "SELECT * FROM students WHERE roll_no = $1",
    [rollNo]
  );
  return result.rows[0] || null;
};

const findByClass = async ({ grade_id, section_id, batch_id }) => {
  const result = await pool.query(
    `SELECT 
        s.*,
        e.id AS enrollment_id,
        e.grade_id,
        e.section_id,
        e.batch_id,
        au.first_name,
        au.last_name,
        au.email
     FROM enrollments e
     JOIN students s   ON e.student_id = s.id
     JOIN app_users au ON s.user_id = au.id
     WHERE e.grade_id = $1
       AND e.section_id = $2
       AND e.batch_id = $3
     ORDER BY s.roll_no`,
    [grade_id, section_id, batch_id]
  );
  return result.rows;
};

// Create a new student profile for an existing app_user
const createStudent = async ({
  user_id,
  roll_no,
  gender,
  dob,
  address,
  admission_date,
  guardian_contact,
  is_scholarship = false,
  scholarship_percentage = null,
  bus_route_id = null,
}) => {
  const result = await pool.query(
    `INSERT INTO students (
        user_id,
        roll_no,
        gender,
        dob,
        address,
        admission_date,
        guardian_contact,
        is_scholarship,
        scholarship_percentage,
        bus_route_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
    [
      user_id,
      roll_no,
      gender,
      dob,
      address,
      admission_date,
      guardian_contact,
      is_scholarship,
      scholarship_percentage,
      bus_route_id,
    ]
  );

  return result.rows[0];
};

// Update basic fields of a student
const updateStudent = async (id, updates) => {
  const fields = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = $${idx}`);
    values.push(value);
    idx += 1;
  }

  if (fields.length === 0) {
    const result = await pool.query("SELECT * FROM students WHERE id = $1", [id]);
    return result.rows[0] || null;
  }

  values.push(id);

  const result = await pool.query(
    `UPDATE students
     SET ${fields.join(", ")}
     WHERE id = $${idx}
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

// Delete student row
const deleteStudent = async (id) => {
  const result = await pool.query(
    "DELETE FROM students WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rows[0] || null;
};

// Get student with current enrollment (grade/section/batch)
const findWithEnrollment = async (studentId) => {
  const result = await pool.query(
    `SELECT 
       s.*,
       e.id AS enrollment_id,
       e.grade_id,
       e.section_id,
       e.batch_id,
       e.status AS enrollment_status
     FROM students s
     LEFT JOIN enrollments e ON e.student_id = s.id
     WHERE s.id = $1`,
    [studentId]
  );
  return result.rows[0] || null;
};

const studentRepository = {
  findById,
  findByUserId,
  findByRollNo,
  createStudent,
  updateStudent,
  deleteStudent,
  findWithEnrollment,
  findByClass,
};

export default studentRepository;
