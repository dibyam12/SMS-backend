// src/routes/notification.router.js
import { Router } from "express";
import notificationController from "../controllers/notificationController.js";
import authMiddleware from "../middleware/auth.js";

const notificationRouter = Router();

// Apply auth middleware to all notification routes
notificationRouter.use(authMiddleware);

// POST /notification/user    -> create for single user
notificationRouter.post("/user", notificationController.createUserNotification);

// POST /notification/role    -> create for role (student, parent, teacher, etc.)
notificationRouter.post("/role", notificationController.createRoleNotification);

// GET /notification?user_id=&role=&limit=&offset=
notificationRouter.get("/", notificationController.getNotificationsForUser);

// PATCH /notification/:id/read -> mark read
notificationRouter.patch("/:id/read", notificationController.markNotificationRead);

export default notificationRouter;
