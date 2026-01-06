// src/routes/staff.router.js
import { Router } from "express";
import staffController from "../controllers/staffController.js";
import authMiddleware from "../middleware/auth.js";

const staffRouter = Router();

// Apply auth middleware to all staff routes
staffRouter.use(authMiddleware);

staffRouter.post("/", staffController.createStaff);
staffRouter.get("/", staffController.listStaff);
staffRouter.get("/:id", staffController.getStaffById);
staffRouter.patch("/:id", staffController.updateStaff);
staffRouter.delete("/:id", staffController.deleteStaff);

export default staffRouter;
