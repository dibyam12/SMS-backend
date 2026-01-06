// src/routes/router.js
import express from "express";
import userRouter from "./user.routes.js";
import studentRouter from "./student.routes.js";
import parentRouter from "./parent.routes.js";
import staffRouter from "./staff.routes.js";
import attendanceRouter from "./attendance.routes.js";
import feeRouter from "./fee.routes.js";
import notificationRouter from "./notification.routes.js";
import healthRouter from "./health.routes.js";
import adminRouter from "./admin.routes.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "API route working" });
});

// Auth + user-related
router.use("/user", userRouter);

// Core entities
router.use("/student", studentRouter);
router.use("/parent", parentRouter);
router.use("/staff", staffRouter);

// Attendance, fees, notifications
router.use("/attendance", attendanceRouter);
router.use("/fee", feeRouter);
router.use("/notification", notificationRouter);

// Health (for developers / monitoring)
router.use("/health", healthRouter);

// Admin routes
router.use("/admin", adminRouter);

export default router;
