// src/repositories/user/staffRepository.js
import pool from "../../../config/db.js";

const allowedStaffTypes = [
  "principal",
  "class_teacher",
  "teacher",
  "accountant",
  "admin",
  "other_staff",
];

// Basic find by staff table id
const findById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM staff WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
};

// Find by linked app_users.id
const findByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT s.*, 
            a.email,
            a.username,
            a.first_name,
            a.last_name,
            a.role,
            a.is_active,
            a.is_staff
     FROM staff s
     JOIN app_users a ON s.user_id = a.id
     WHERE s.user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

// List all staff (all roles in staff table)
const findAllStaff = async () => {
  const result = await pool.query(
    `SELECT s.*, 
            a.email,
            a.username,
            a.first_name,
            a.last_name,
            a.role,
            a.is_active,
            a.is_staff
     FROM staff s
     JOIN app_users a ON s.user_id = a.id
     ORDER BY a.first_name, a.last_name`
  );
  return result.rows;
};

// List staff filtered by staff_type (principal, teacher, admin, etc.)
const findByStaffType = async (staffType) => {
  if (!allowedStaffTypes.includes(staffType)) {
    throw new Error("INVALID_STAFF_TYPE");
  }

  const result = await pool.query(
    `SELECT s.*, 
            a.email,
            a.username,
            a.first_name,
            a.last_name,
            a.role,
            a.is_active,
            a.is_staff
     FROM staff s
     JOIN app_users a ON s.user_id = a.id
     WHERE s.staff_type = $1`,
    [staffType]
  );
  return result.rows;
};

// Convenience helpers
const findAllTeachers = () => findByStaffType("teacher");
const findAllPrincipals = () => findByStaffType("principal");
const findAllClassTeachers = () => findByStaffType("class_teacher");
const findAllAccountants = () => findByStaffType("accountant");
const findAllAdmins = () => findByStaffType("admin");
const findAllOtherStaff = () => findByStaffType("other_staff");

// Create staff profile for an existing app_user
const createStaff = async ({
  user_id,
  staff_code,
  address,
  gender,
  dob,
  qualification,
  staff_type,
}) => {
  if (!allowedStaffTypes.includes(staff_type)) {
    throw new Error("INVALID_STAFF_TYPE");
  }

  const result = await pool.query(
    `INSERT INTO staff (
        user_id,
        staff_code,
        address,
        gender,
        dob,
        qualification,
        staff_type
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
    [
      user_id,
      staff_code,
      address,
      gender,
      dob,
      qualification,
      staff_type,
    ]
  );

  return result.rows[0];
};

// Update staff profile (partial update)
const updateStaff = async (id, updates) => {
  const fields = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (key === "staff_type" && !allowedStaffTypes.includes(value)) {
      throw new Error("INVALID_STAFF_TYPE");
    }
    fields.push(`${key} = $${idx}`);
    values.push(value);
    idx += 1;
  }

  if (fields.length === 0) {
    const existing = await pool.query("SELECT * FROM staff WHERE id = $1", [id]);
    return existing.rows[0] || null;
  }

  values.push(id);

  const result = await pool.query(
    `UPDATE staff
     SET ${fields.join(", ")}
     WHERE id = $${idx}
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

// Delete staff profile
const deleteStaff = async (id) => {
  const result = await pool.query(
    "DELETE FROM staff WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rows[0] || null;
};

const staffRepository = {
  allowedStaffTypes,
  findById,
  findByUserId,
  findAllStaff,
  findByStaffType,
  findAllTeachers,
  findAllPrincipals,
  findAllClassTeachers,
  findAllAccountants,
  findAllAdmins,
  findAllOtherStaff,
  createStaff,
  updateStaff,
  deleteStaff,
};

export default staffRepository;
