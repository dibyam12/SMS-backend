// src/repositories/auditLogRepository.js
import pool from "../../config/db.js"; // adjust path if your db config is elsewhere

// Create one audit log entry
const createLog = async ({
  actor_user_id = null,
  action,
  target_table = null,
  target_id = null,
  ip_address = null,
  metadata = null, // plain JS object; will be stored as JSONB
}) => {
  const result = await pool.query(
    `INSERT INTO audit_logs (
        actor_user_id,
        action,
        target_table,
        target_id,
        ip_address,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
    [
      actor_user_id,
      action,
      target_table,
      target_id,
      ip_address,
      metadata ? JSON.stringify(metadata) : null,
    ]
  );

  return result.rows[0];
};

// Optional: fetch logs (for admin/debug tools)
const findLogs = async ({ limit = 50, offset = 0 } = {}) => {
  const result = await pool.query(
    `SELECT *
     FROM audit_logs
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
};

const findLogsByUser = async (actor_user_id, { limit = 50, offset = 0 } = {}) => {
  const result = await pool.query(
    `SELECT *
     FROM audit_logs
     WHERE actor_user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [actor_user_id, limit, offset]
  );
  return result.rows;
};

const auditLogRepository = {
  createLog,
  findLogs,
  findLogsByUser,
};

export default auditLogRepository;
