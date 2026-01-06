// src/controllers/notificationController.js
import notificationRepository from "../models/repositories/notification/notificationRepository.js";

const createUserNotification = async (req, res, next) => {
  try {
    const { title, message, target_user_id } = req.body;
    const notif = await notificationRepository.createUserNotification({
      title,
      message,
      target_user_id,
    });
    return res.status(201).json(notif);
  } catch (err) {
    return next(err);
  }
};

const createRoleNotification = async (req, res, next) => {
  try {
    const { title, message, target_role } = req.body;
    const notif = await notificationRepository.createRoleNotification({
      title,
      message,
      target_role,
    });
    return res.status(201).json(notif);
  } catch (err) {
    return next(err);
  }
};

const getNotificationsForUser = async (req, res, next) => {
  try {
    const { user_id, role, limit, offset } = req.query;
    const rows = await notificationRepository.getNotificationsForUser({
      user_id: Number(user_id),
      role,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notif = await notificationRepository.markNotificationRead(
      Number(id),
      true
    );
    if (!notif) return res.status(404).json({ message: "Notification not found" });
    return res.json(notif);
  } catch (err) {
    return next(err);
  }
};

const notificationController = {
  createUserNotification,
  createRoleNotification,
  getNotificationsForUser,
  markNotificationRead,
};

export default notificationController;
