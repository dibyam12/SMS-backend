// src/repositories/parentRepository.js
import pool from "../../../config/db.js";

// ---- Core parent queries ----

// Find parent row by parent.id
const findById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM parents WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
};

// Find parent by linked app_users.id
const findByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT p.*,
            a.email,
            a.username,
            a.first_name,
            a.last_name,
            a.phone,
            a.role
     FROM parents p
     JOIN app_users a ON p.user_id = a.id
     WHERE p.user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

// Create new parent profile for existing app_user
const createParent = async ({ user_id, relationship }) => {
  const result = await pool.query(
    `INSERT INTO parents (
        user_id,
        relationship
      )
      VALUES ($1, $2)
      RETURNING *`,
    [user_id, relationship]
  );
  return result.rows[0];
};

// Update parent (e.g., relationship)
const updateParent = async (id, updates) => {
  const fields = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = $${idx}`);
    values.push(value);
    idx += 1;
  }

  if (fields.length === 0) {
    const existing = await pool.query("SELECT * FROM parents WHERE id = $1", [id]);
    return existing.rows[0] || null;
  }

  values.push(id);

  const result = await pool.query(
    `UPDATE parents
     SET ${fields.join(", ")}
     WHERE id = $${idx}
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

// Delete parent row
const deleteParent = async (id) => {
  const result = await pool.query(
    "DELETE FROM parents WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rows[0] || null;
};

// ---- Parent ↔ Student link (parent_students) ----

// Link parent to student
const addParentStudentLink = async ({
  parent_id,
  student_id,
  is_primary_contact = false,
}) => {
  const result = await pool.query(
    `INSERT INTO parent_students (
        parent_id,
        student_id,
        is_primary_contact
      )
      VALUES ($1, $2, $3)
      ON CONFLICT (parent_id, student_id)
      DO UPDATE SET is_primary_contact = EXCLUDED.is_primary_contact
      RETURNING *`,
    [parent_id, student_id, is_primary_contact]
  );
  return result.rows[0];
};

// Remove link between parent and student
const removeParentStudentLink = async ({ parent_id, student_id }) => {
  const result = await pool.query(
    `DELETE FROM parent_students
     WHERE parent_id = $1 AND student_id = $2
     RETURNING id`,
    [parent_id, student_id]
  );
  return result.rows[0] || null;
};

// Get all students for a given parent (with basic student + user info)
const findStudentsByParentId = async (parentId) => {
  const result = await pool.query(
    `SELECT 
        ps.id AS parent_student_id,
        ps.is_primary_contact,
        s.id AS student_id,
        s.roll_no,
        s.gender,
        s.dob,
        s.address,
        s.admission_date,
        s.guardian_contact,
        au.id AS student_user_id,
        au.first_name,
        au.last_name,
        au.email,
        au.phone
     FROM parent_students ps
     JOIN students s ON ps.student_id = s.id
     JOIN app_users au ON s.user_id = au.id
     WHERE ps.parent_id = $1`,
    [parentId]
  );
  return result.rows;
};

// Get all parents for a given student (with parent user info)
const findParentsByStudentId = async (studentId) => {
  const result = await pool.query(
    `SELECT 
        ps.id AS parent_student_id,
        ps.is_primary_contact,
        p.id AS parent_id,
        p.relationship,
        au.id AS parent_user_id,
        au.first_name,
        au.last_name,
        au.email,
        au.phone
     FROM parent_students ps
     JOIN parents p ON ps.parent_id = p.id
     JOIN app_users au ON p.user_id = au.id
     WHERE ps.student_id = $1`,
    [studentId]
  );
  return result.rows;
};

const parentRepository = {
  findById,
  findByUserId,
  createParent,
  updateParent,
  deleteParent,
  addParentStudentLink,
  removeParentStudentLink,
  findStudentsByParentId,
  findParentsByStudentId,
};

export default parentRepository;
