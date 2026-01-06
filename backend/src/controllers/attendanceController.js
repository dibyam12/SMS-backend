// src/controllers/attendanceController.js
import attendanceRepository from "../models/repositories/attendance/attendanceRepository.js";

const markAttendance = async (req, res, next) => {
  try {
    const {
      student_id,
      date,
      status,
      marked_by,
      note,
    } = req.body;

    const record = await attendanceRepository.markAttendance({
      student_id,
      date,
      status,
      marked_by,
      note,
    });

    return res.status(201).json(record);
  } catch (err) {
    return next(err);
  }
};

const updateAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = {
      status: req.body.status,
      note: req.body.note,
    };
    Object.keys(updates).forEach(
      (k) => updates[k] === undefined && delete updates[k]
    );
    const updated = await attendanceRepository.updateAttendance(
      Number(id),
      updates
    );
    if (!updated) return res.status(404).json({ message: "Record not found" });
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
};

const getStudentAttendance = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { from_date, to_date } = req.query;
    const rows = await attendanceRepository.findByStudentAndDateRange({
      student_id: Number(studentId),
      from_date,
      to_date,
    });
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
};

const getClassAttendanceByDate = async (req, res, next) => {
  try {
    const { grade_id, section_id, batch_id, date } = req.query;
    const rows = await attendanceRepository.findClassAttendanceByDate({
      grade_id: Number(grade_id),
      section_id: Number(section_id),
      batch_id: Number(batch_id),
      date,
    });
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
};

const getClassDailySummary = async (req, res, next) => {
  try {
    const { grade_id, section_id, batch_id, date } = req.query;
    const rows = await attendanceRepository.getClassDailySummary({
      grade_id: Number(grade_id),
      section_id: Number(section_id),
      batch_id: Number(batch_id),
      date,
    });
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
};

const attendanceController = {
  markAttendance,
  updateAttendance,
  getStudentAttendance,
  getClassAttendanceByDate,
  getClassDailySummary,
};

export default attendanceController;
