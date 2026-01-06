// src/repositories/dev/healthRepository.js
import pool from "../../../config/db.js";

// Simple "SELECT 1" ping
const ping = async () => {
  const result = await pool.query("SELECT 1 AS ok");
  return result.rows[0];
};

// Check that key tables are reachable and return row counts
const getCoreTableStats = async () => {
  const queries = [
    "SELECT 'app_users'   AS table, COUNT(*) AS count FROM app_users",
    "SELECT 'students'    AS table, COUNT(*) AS count FROM students",
    "SELECT 'staff'       AS table, COUNT(*) AS count FROM staff",
    "SELECT 'parents'     AS table, COUNT(*) AS count FROM parents",
    "SELECT 'enrollments' AS table, COUNT(*) AS count FROM enrollments",
    "SELECT 'attendance'  AS table, COUNT(*) AS count FROM attendance",
    "SELECT 'fee_heads'   AS table, COUNT(*) AS count FROM fee_heads",
    "SELECT 'student_fees' AS table, COUNT(*) AS count FROM student_fees",
    "SELECT 'payments'    AS table, COUNT(*) AS count FROM payments",
  ];

  const client = await pool.connect();
  try {
    const results = [];
    for (const q of queries) {
      const res = await client.query(q);
      results.push(res.rows[0]);
    }
    return results;
  } finally {
    client.release();
  }
};

// Basic DB info (version, current time)
const getDbInfo = async () => {
  const result = await pool.query(
    `SELECT
       version()      AS db_version,
       current_database() AS db_name,
       now()          AS server_time`
  );
  return result.rows[0];
};

// Used for readiness/liveness endpoints
const getHealthSummary = async () => {
  const [pingResult, dbInfo, coreStats] = await Promise.all([
    ping(),
    getDbInfo(),
    getCoreTableStats(),
  ]);

  return {
    status: pingResult?.ok === 1 ? "ok" : "degraded",
    db: dbInfo,
    tables: coreStats,
  };
};

const healthRepository = {
  ping,
  getCoreTableStats,
  getDbInfo,
  getHealthSummary,
};

export default healthRepository;
