// src/controllers/staffController.js
import staffRepository from "../models/repositories/user/staffRepository.js";
import userRepository from "../models/repositories/user/userRepository.js";

// Create staff + user
const createStaff = async (req, res, next) => {
  try {
    const {
      email,
      username,
      passwordHash,
      first_name,
      last_name,
      role,          // one of allowed staff roles (principal, teacher, admin, etc.)
      is_staff = true,
      staff_code,
      address,
      gender,
      dob,
      qualification,
      staff_type,    // principal, class_teacher, teacher, accountant, admin, other_staff
    } = req.body;

    const user = await userRepository.createUser({
      email,
      username,
      passwordHash,
      first_name,
      last_name,
      role,
      is_staff,
    });

    const staff = await staffRepository.createStaff({
      user_id: user.id,
      staff_code,
      address,
      gender,
      dob,
      qualification,
      staff_type,
    });

    return res.status(201).json({ user, staff });
  } catch (err) {
    return next(err);
  }
};

const getStaffById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const staff = await staffRepository.findById(Number(id));
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    return res.json(staff);
  } catch (err) {
    return next(err);
  }
};

const updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = {
      staff_code: req.body.staff_code,
      address: req.body.address,
      gender: req.body.gender,
      dob: req.body.dob,
      qualification: req.body.qualification,
      staff_type: req.body.staff_type,
    };
    Object.keys(updates).forEach(
      (k) => updates[k] === undefined && delete updates[k]
    );
    const updated = await staffRepository.updateStaff(Number(id), updates);
    if (!updated) return res.status(404).json({ message: "Staff not found" });
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
};

const deleteStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await staffRepository.deleteStaff(Number(id));
    if (!deleted) return res.status(404).json({ message: "Staff not found" });
    return res.json({ message: "Staff deleted", id: deleted.id });
  } catch (err) {
    return next(err);
  }
};

const listStaff = async (req, res, next) => {
  try {
    const { staff_type } = req.query;
    let list;
    if (staff_type) {
      list = await staffRepository.findByStaffType(staff_type);
    } else {
      list = await staffRepository.findAllStaff();
    }
    return res.json(list);
  } catch (err) {
    return next(err);
  }
};

const staffController = {
  createStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  listStaff,
};

export default staffController;
