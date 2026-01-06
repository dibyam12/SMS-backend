// src/routes/student.router.js
import { Router } from "express";
import studentController from "../controllers/studentController.js";
import authMiddleware from "../middleware/auth.js";

const studentRouter = Router();

// Add auth middleware to all student routes
studentRouter.use(authMiddleware);

// POST /student/      -> create student + user
studentRouter.post("/", studentController.createStudent);

// GET /student/:id    -> single student with enrollment
studentRouter.get("/:id", studentController.getStudentById);

// PATCH /student/:id  -> update student fields
studentRouter.patch("/:id", studentController.updateStudent);

// DELETE /student/:id -> delete student
studentRouter.delete("/:id", studentController.deleteStudent);

// GET /student?grade_id=&section_id=&batch_id= -> list students in class
studentRouter.get("/", studentController.getStudentsByClass);

export default studentRouter;
