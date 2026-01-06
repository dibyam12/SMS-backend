// src/repositories/userProfileRepository.js
import pool from "../../../config/db.js";

const allowedRoles = [
  "principal",
  "class_teacher",
  "teacher",
  "accountant",
  "admin",
  "parent",
  "student",
  "other_staff",
];

// Get base app_user by id
const findUserById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM app_users WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
};

// Get base app_user by email
const findUserByEmail = async (email) => {
  const result = await pool.query(
    "SELECT * FROM app_users WHERE email = $1",
    [email]
  );
  return result.rows[0] || null;
};

// Get base app_user by username
const findUserByUsername = async (username) => {
  const result = await pool.query(
    "SELECT * FROM app_users WHERE username = $1",
    [username]
  );
  return result.rows[0] || null;
};

// Get rich profile by user id (joins staff/parent/student if present)
const findFullProfileByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT 
        u.*,
        s.id          AS staff_id,
        s.staff_code,
        s.address     AS staff_address,
        s.gender      AS staff_gender,
        s.dob         AS staff_dob,
        s.qualification,
        s.staff_type,
        st.id         AS student_id,
        st.roll_no,
        st.gender     AS student_gender,
        st.dob        AS student_dob,
        st.address    AS student_address,
        st.admission_date,
        st.guardian_contact,
        st.is_scholarship,
        st.scholarship_percentage,
        st.bus_route_id,
        p.id          AS parent_id,
        p.relationship
     FROM app_users u
     LEFT JOIN staff   s  ON s.user_id = u.id
     LEFT JOIN students st ON st.user_id = u.id
     LEFT JOIN parents p  ON p.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

// List users by role with light profile info
const findUsersByRole = async (role) => {
  if (!allowedRoles.includes(role)) {
    throw new Error("INVALID_ROLE");
  }

  const result = await pool.query(
    `SELECT 
        u.id,
        u.email,
        u.username,
        u.first_name,
        u.last_name,
        u.role,
        u.is_active,
        u.is_staff
     FROM app_users u
     WHERE u.role = $1
     ORDER BY u.first_name, u.last_name`,
    [role]
  );
  return result.rows;
};

// Soft toggle is_active
const setUserActiveStatus = async (userId, isActive) => {
  const result = await pool.query(
    `UPDATE app_users
     SET is_active = $1
     WHERE id = $2
     RETURNING id, email, username, first_name, last_name, role, is_active, is_staff`,
    [isActive, userId]
  );
  return result.rows[0] || null;
};

// Promote/demote staff flag (not role)
const setUserStaffFlag = async (userId, isStaff) => {
  const result = await pool.query(
    `UPDATE app_users
     SET is_staff = $1
     WHERE id = $2
     RETURNING id, email, username, first_name, last_name, role, is_active, is_staff`,
    [isStaff, userId]
  );
  return result.rows[0] || null;
};

const userProfileRepository = {
  allowedRoles,
  findUserById,
  findUserByEmail,
  findUserByUsername,
  findFullProfileByUserId,
  findUsersByRole,
  setUserActiveStatus,
  setUserStaffFlag,
};

export default userProfileRepository;
