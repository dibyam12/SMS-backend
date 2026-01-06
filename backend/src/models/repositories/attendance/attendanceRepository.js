// src/repositories/attendance/attendanceRepository.js
import pool from "../../../config/db.js";

const allowedStatuses = ["present", "absent", "late", "excused"];

// Create or upsert a single attendance record for a student+date
const markAttendance = async ({
  student_id,
  date,
  status,
  marked_by = null,
  note = null,
}) => {
  if (!allowedStatuses.includes(status)) {
    throw new Error("INVALID_ATTENDANCE_STATUS");
  }

  const result = await pool.query(
    `INSERT INTO attendance (
        student_id,
        date,
        status,
        marked_by,
        note
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (student_id, date)
      DO UPDATE SET
        status = EXCLUDED.status,
        marked_by = EXCLUDED.marked_by,
        note = EXCLUDED.note
      RETURNING *`,
    [student_id, date, status, marked_by, note]
  );

  return result.rows[0];
};

// Update by attendance id (partial)
const updateAttendance = async (id, updates) => {
  const fields = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (key === "status" && !allowedStatuses.includes(value)) {
      throw new Error("INVALID_ATTENDANCE_STATUS");
    }
    fields.push(`${key} = $${idx}`);
    values.push(value);
    idx += 1;
  }

  if (fields.length === 0) {
    const existing = await pool.query("SELECT * FROM attendance WHERE id = $1", [id]);
    return existing.rows[0] || null;
  }

  values.push(id);

  const result = await pool.query(
    `UPDATE attendance
     SET ${fields.join(", ")}
     WHERE id = $${idx}
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

// Delete attendance row
const deleteAttendance = async (id) => {
  const result = await pool.query(
    "DELETE FROM attendance WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rows[0] || null;
};

// Get attendance by id
const findById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM attendance WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
};

// Get attendance for one student over a date range
const findByStudentAndDateRange = async ({ student_id, from_date, to_date }) => {
  const result = await pool.query(
    `SELECT *
     FROM attendance
     WHERE student_id = $1
       AND date BETWEEN $2 AND $3
     ORDER BY date`,
    [student_id, from_date, to_date]
  );
  return result.rows;
};

// Get attendance for a class (grade+section+batch) on a given date
const findClassAttendanceByDate = async ({ grade_id, section_id, batch_id, date }) => {
  const result = await pool.query(
    `SELECT 
        a.*,
        s.id           AS student_id,
        s.roll_no,
        au.first_name,
        au.last_name
     FROM enrollments e
     JOIN students s   ON e.student_id = s.id
     JOIN app_users au ON s.user_id = au.id
     LEFT JOIN attendance a
       ON a.student_id = s.id AND a.date = $4
     WHERE e.grade_id = $1
       AND e.section_id = $2
       AND e.batch_id = $3
     ORDER BY s.roll_no`,
    [grade_id, section_id, batch_id, date]
  );
  return result.rows;
};

// Daily summary counts for a class
const getClassDailySummary = async ({ grade_id, section_id, batch_id, date }) => {
  const result = await pool.query(
    `SELECT 
        a.status,
        COUNT(*) AS count
     FROM enrollments e
     JOIN students s ON e.student_id = s.id
     LEFT JOIN attendance a 
       ON a.student_id = s.id AND a.date = $4
     WHERE e.grade_id = $1
       AND e.section_id = $2
       AND e.batch_id = $3
     GROUP BY a.status`,
    [grade_id, section_id, batch_id, date]
  );
  return result.rows;
};

const attendanceRepository = {
  allowedStatuses,
  markAttendance,
  updateAttendance,
  deleteAttendance,
  findById,
  findByStudentAndDateRange,
  findClassAttendanceByDate,
  getClassDailySummary,
};

export default attendanceRepository;
