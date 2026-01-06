// src/repositories/userRepository.js
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

const findByEmail = async (email) => {
  const result = await pool.query(
    "SELECT * FROM app_users WHERE email = $1",
    [email]
  );
  return result.rows[0] || null;
};

const findByUsername = async (username) => {
  const result = await pool.query(
    "SELECT id FROM app_users WHERE username = $1",
    [username]
  );
  return result.rows[0] || null;
};

const createUser = async ({
  email,
  username,
  passwordHash,
  first_name,
  last_name,
  role,
  is_staff,
}) => {
  if (!allowedRoles.includes(role)) {
    throw new Error("INVALID_ROLE");
  }

  const result = await pool.query(
    `INSERT INTO app_users (
        email,
        username,
        password_hash,
        first_name,
        last_name,
        role,
        is_active,
        is_staff
      )
      VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7)
      RETURNING id, email, username, first_name, last_name, role, is_active, is_staff, created_at`,
    [email, username, passwordHash, first_name, last_name, role, is_staff]
  );

  return result.rows[0];
};
const userRepository = {
  allowedRoles,
  findByEmail,
  findByUsername,
  createUser,
};

export default userRepository;
