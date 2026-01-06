// src/repositories/notification/notificationRepository.js
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

// -------- Device tokens (for mobile push) --------

const upsertDeviceToken = async ({ user_id, token, platform = null }) => {
  const result = await pool.query(
    `INSERT INTO device_tokens (user_id, token, platform)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, token)
     DO UPDATE SET
       platform = EXCLUDED.platform,
       last_seen = now()
     RETURNING *`,
    [user_id, token, platform]
  );
  return result.rows[0];
};

const deleteDeviceToken = async ({ user_id, token }) => {
  const result = await pool.query(
    `DELETE FROM device_tokens
     WHERE user_id = $1 AND token = $2
     RETURNING id`,
    [user_id, token]
  );
  return result.rows[0] || null;
};

const getDeviceTokensByUserId = async (user_id) => {
  const result = await pool.query(
    `SELECT * FROM device_tokens
     WHERE user_id = $1`,
    [user_id]
  );
  return result.rows;
};

const getDeviceTokensByUserIds = async (userIds) => {
  if (!userIds || userIds.length === 0) return [];
  const result = await pool.query(
    `SELECT * FROM device_tokens
     WHERE user_id = ANY($1)`,
    [userIds]
  );
  return result.rows;
};

// -------- Notifications table (desktop + mobile) --------

// Create notification for single user
const createUserNotification = async ({ title, message, target_user_id }) => {
  const result = await pool.query(
    `INSERT INTO notifications (
        title,
        message,
        target_user_id
      )
      VALUES ($1, $2, $3)
      RETURNING *`,
    [title, message, target_user_id]
  );
  return result.rows[0];
};

// Create notification for a whole role (principal, teacher, parent, student, admin, etc.)
const createRoleNotification = async ({ title, message, target_role }) => {
  if (!allowedRoles.includes(target_role)) {
    throw new Error("INVALID_ROLE");
  }

  const result = await pool.query(
    `INSERT INTO notifications (
        title,
        message,
        target_role
      )
      VALUES ($1, $2, $3)
      RETURNING *`,
    [title, message, target_role]
  );
  return result.rows[0];
};

// Mark notification as read
const markNotificationRead = async (id, is_read = true) => {
  const result = await pool.query(
    `UPDATE notifications
     SET is_read = $1
     WHERE id = $2
     RETURNING *`,
    [is_read, id]
  );
  return result.rows[0] || null;
};

// Get notifications for a user (direct + role-based)
const getNotificationsForUser = async ({ user_id, role, limit = 50, offset = 0 }) => {
  if (!allowedRoles.includes(role)) {
    throw new Error("INVALID_ROLE");
  }

  const result = await pool.query(
    `SELECT n.*
     FROM notifications n
     WHERE (n.target_user_id = $1 OR n.target_role = $2)
     ORDER BY n.created_at DESC
     LIMIT $3 OFFSET $4`,
    [user_id, role, limit, offset]
  );
  return result.rows;
};

// Unread count for a user (for badges)
const getUnreadCountForUser = async ({ user_id, role }) => {
  if (!allowedRoles.includes(role)) {
    throw new Error("INVALID_ROLE");
  }

  const result = await pool.query(
    `SELECT COUNT(*) AS unread_count
     FROM notifications n
     WHERE (n.target_user_id = $1 OR n.target_role = $2)
       AND n.is_read = FALSE`,
    [user_id, role]
  );
  return result.rows[0];
};

// Helper to fetch all user_ids for a role (for push tokens fan-out)
const getUserIdsByRole = async (role) => {
  if (!allowedRoles.includes(role)) {
    throw new Error("INVALID_ROLE");
  }

  const result = await pool.query(
    `SELECT id
     FROM app_users
     WHERE role = $1 AND is_active = TRUE`,
    [role]
  );
  return result.rows.map((r) => r.id);
};

const notificationRepository = {
  allowedRoles,

  // Device tokens
  upsertDeviceToken,
  deleteDeviceToken,
  getDeviceTokensByUserId,
  getDeviceTokensByUserIds,

  // Notifications
  createUserNotification,
  createRoleNotification,
  markNotificationRead,
  getNotificationsForUser,
  getUnreadCountForUser,

  // Helpers
  getUserIdsByRole,
};

export default notificationRepository;
