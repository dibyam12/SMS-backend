// src/controllers/userController.js
import userProfileRepository from "../models/repositories/user/userProfileRepository.js";
import userRepository from "../models/repositories/user/userRepository.js";

// GET /user/me
const getMe = async (req, res, next) => {
  try {
    const userId = req.user?.id; // set by auth middleware
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const profile = await userProfileRepository.findFullProfileByUserId(
      Number(userId)
    );

    if (!profile) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(profile);
  } catch (err) {
    return next(err);
  }
};

// PATCH /user/me
const updateMe = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { first_name, last_name, phone, profile_pic } = req.body;

    const updates = {
      first_name,
      last_name,
      phone,
      profile_pic,
    };

    Object.keys(updates).forEach(
      (k) => updates[k] === undefined && delete updates[k]
    );

    // Assuming userRepository has a generic updateUser (add it if missing)
    const updated = await userRepository.updateUser(Number(userId), updates);

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(updated);
  } catch (err) {
    return next(err);
  }
};

// (Optional) admin-only: list users by role
const listUsersByRole = async (req, res, next) => {
  try {
    const { role } = req.query;
    const rows = await userProfileRepository.findUsersByRole(role);
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
};

const userController = {
  getMe,
  updateMe,
  listUsersByRole, // optional
};

export default userController;
