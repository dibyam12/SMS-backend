// src/routes/attendance.router.js
import { Router } from "express";
import attendanceController from "../controllers/attendanceController.js";
import authMiddleware from "../middleware/auth.js";

const attendanceRouter = Router();

// Apply auth middleware to all attendance routes
attendanceRouter.use(authMiddleware);

// POST /attendance        -> mark or upsert attendance
attendanceRouter.post("/", attendanceController.markAttendance);

// PATCH /attendance/:id   -> update existing record
attendanceRouter.patch("/:id", attendanceController.updateAttendance);

// GET /attendance/student/:studentId?from_date=&to_date=
attendanceRouter.get(
  "/student/:studentId",
  attendanceController.getStudentAttendance
);

// GET /attendance/class?grade_id=&section_id=&batch_id=&date=
attendanceRouter.get(
  "/class",
  attendanceController.getClassAttendanceByDate
);

// GET /attendance/class/summary?grade_id=&section_id=&batch_id=&date=
attendanceRouter.get(
  "/class/summary",
  attendanceController.getClassDailySummary
);

export default attendanceRouter;
