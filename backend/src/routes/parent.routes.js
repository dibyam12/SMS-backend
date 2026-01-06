// src/routes/parent.router.js
import { Router } from "express";
import parentController from "../controllers/parentController.js";
import authMiddleware from "../middleware/auth.js";

const parentRouter = Router();

// Apply auth middleware to all parent routes
parentRouter.use(authMiddleware);

// POST /parent/              -> create parent + links
parentRouter.post("/", parentController.createParent);

// GET /parent/:id            -> parent + user + students
parentRouter.get("/:id", parentController.getParentById);

// PATCH /parent/:id          -> update relationship / links
parentRouter.patch("/:id", parentController.updateParent);

// DELETE /parent/:id         -> delete parent
parentRouter.delete("/:id", parentController.deleteParent);

// GET /parent/:id/students   -> students of a parent
parentRouter.get("/:id/students", parentController.getStudentsForParent);

// GET /parent/student/:studentId -> parents of a student
parentRouter.get("/student/:studentId", parentController.getParentsForStudent);

export default parentRouter;
