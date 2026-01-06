// src/repositories/fees/feeRepository.js
import pool from "../../../config/db.js";

// ---------- Fee heads ----------

const createFeeHead = async ({ name, description = null }) => {
  const result = await pool.query(
    `INSERT INTO fee_heads (name, description)
     VALUES ($1, $2)
     RETURNING *`,
    [name, description]
  );
  return result.rows[0];
};

const updateFeeHead = async (id, updates) => {
  const fields = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = $${idx}`);
    values.push(value);
    idx += 1;
  }

  if (fields.length === 0) {
    const existing = await pool.query("SELECT * FROM fee_heads WHERE id = $1", [id]);
    return existing.rows[0] || null;
  }

  values.push(id);

  const result = await pool.query(
    `UPDATE fee_heads
     SET ${fields.join(", ")}
     WHERE id = $${idx}
     RETURNING *`,
    values
  );
  return result.rows[0] || null;
};

const deleteFeeHead = async (id) => {
  const result = await pool.query(
    "DELETE FROM fee_heads WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rows[0] || null;
};

const findFeeHeadById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM fee_heads WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
};

const listFeeHeads = async () => {
  const result = await pool.query(
    "SELECT * FROM fee_heads ORDER BY name"
  );
  return result.rows;
};

// ---------- Student fees (invoices) ----------

const assignStudentFee = async ({
  student_id,
  fee_head_id,
  amount,
  due_date = null,
}) => {
  const result = await pool.query(
    `INSERT INTO student_fees (
        student_id,
        fee_head_id,
        amount,
        due_date
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
    [student_id, fee_head_id, amount, due_date]
  );
  return result.rows[0];
};

const markStudentFeePaidFlag = async (id, is_paid = true) => {
  const result = await pool.query(
    `UPDATE student_fees
     SET is_paid = $1
     WHERE id = $2
     RETURNING *`,
    [is_paid, id]
  );
  return result.rows[0] || null;
};

const updateStudentFee = async (id, updates) => {
  const fields = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = $${idx}`);
    values.push(value);
    idx += 1;
  }

  if (fields.length === 0) {
    const existing = await pool.query(
      "SELECT * FROM student_fees WHERE id = $1",
      [id]
    );
    return existing.rows[0] || null;
  }

  values.push(id);

  const result = await pool.query(
    `UPDATE student_fees
     SET ${fields.join(", ")}
     WHERE id = $${idx}
     RETURNING *`,
    values
  );
  return result.rows[0] || null;
};

const deleteStudentFee = async (id) => {
  const result = await pool.query(
    "DELETE FROM student_fees WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rows[0] || null;
};

const findStudentFeesByStudentId = async (student_id) => {
  const result = await pool.query(
    `SELECT sf.*,
            fh.name       AS fee_head_name,
            fh.description AS fee_head_description
     FROM student_fees sf
     JOIN fee_heads fh ON sf.fee_head_id = fh.id
     WHERE sf.student_id = $1
     ORDER BY sf.due_date NULLS LAST, sf.created_at`,
    [student_id]
  );
  return result.rows;
};

const findOutstandingFeesByStudentId = async (student_id) => {
  const result = await pool.query(
    `SELECT sf.*,
            fh.name       AS fee_head_name
     FROM student_fees sf
     JOIN fee_heads fh ON sf.fee_head_id = fh.id
     WHERE sf.student_id = $1
       AND sf.is_paid = FALSE
     ORDER BY sf.due_date NULLS LAST`,
    [student_id]
  );
  return result.rows;
};

// ---------- Payments ----------

const createPayment = async ({
  student_fee_id = null,
  student_id = null,
  amount,
  method = null,
  transaction_ref = null,
}) => {
  const result = await pool.query(
    `INSERT INTO payments (
        student_fee_id,
        student_id,
        amount,
        method,
        transaction_ref
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
    [student_fee_id, student_id, amount, method, transaction_ref]
  );
  return result.rows[0];
};

const findPaymentsByStudentId = async (student_id) => {
  const result = await pool.query(
    `SELECT p.*,
            sf.fee_head_id,
            fh.name AS fee_head_name
     FROM payments p
     LEFT JOIN student_fees sf ON p.student_fee_id = sf.id
     LEFT JOIN fee_heads fh     ON sf.fee_head_id = fh.id
     WHERE p.student_id = $1
     ORDER BY p.paid_on DESC`,
    [student_id]
  );
  return result.rows;
};

const findPaymentsByDateRange = async ({ from_date, to_date }) => {
  const result = await pool.query(
    `SELECT *
     FROM payments
     WHERE paid_on::date BETWEEN $1 AND $2
     ORDER BY paid_on DESC`,
    [from_date, to_date]
  );
  return result.rows;
};

// Total paid by student (optionally by fee head)
const getStudentPaidTotal = async ({ student_id, fee_head_id = null }) => {
  let query = `
    SELECT COALESCE(SUM(p.amount), 0) AS total_paid
    FROM payments p
    LEFT JOIN student_fees sf ON p.student_fee_id = sf.id
    WHERE p.student_id = $1`;
  const params = [student_id];

  if (fee_head_id) {
    query += " AND sf.fee_head_id = $2";
    params.push(fee_head_id);
  }

  const result = await pool.query(query, params);
  return result.rows[0];
};

const feeRepository = {
  // Fee heads
  createFeeHead,
  updateFeeHead,
  deleteFeeHead,
  findFeeHeadById,
  listFeeHeads,

  // Student fees
  assignStudentFee,
  markStudentFeePaidFlag,
  updateStudentFee,
  deleteStudentFee,
  findStudentFeesByStudentId,
  findOutstandingFeesByStudentId,

  // Payments
  createPayment,
  findPaymentsByStudentId,
  findPaymentsByDateRange,
  getStudentPaidTotal,
};

export default feeRepository;
