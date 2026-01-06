// src/routes/admin.router.js
import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import userController from "../controllers/userController.js";

const adminRouter = Router();


adminRouter.get(
  "/users",
  authMiddleware,
  requireAdmin,
  userController.listUsersByRole
);

// add more admin-only endpoints here

export default adminRouter;
