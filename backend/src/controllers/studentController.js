// src/controllers/studentController.js
import studentRepository from "../models/repositories/user/studentRepository.js";
import userRepository from "../models/repositories/user/userRepository.js";

// Create student + user in one go 
const createStudent = async (req, res, next) => {
  try {
    const {
      email,
      username,
      passwordHash, // assume password already hashed in service/middleware
      first_name,
      last_name,
      roll_no,
      gender,
      dob,
      address,
      admission_date,
      guardian_contact,
      is_scholarship,
      scholarship_percentage,
      bus_route_id,
    } = req.body;

    // 1) create app_user with role=student
    const user = await userRepository.createUser({
      email,
      username,
      passwordHash,
      first_name,
      last_name,
      role: "student",
      is_staff: false,
    });

    // 2) create student profile
    const student = await studentRepository.createStudent({
      user_id: user.id,
      roll_no,
      gender,
      dob,
      address,
      admission_date,
      guardian_contact,
      is_scholarship,
      scholarship_percentage,
      bus_route_id,
    });

    return res.status(201).json({
      user,
      student,
    });
  } catch (err) {
    return next(err);
  }
};

// Get a student by id (with enrollment info)
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await studentRepository.findWithEnrollment(Number(id));

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.json(student);
  } catch (err) {
    return next(err);
  }
};

// Update student core fields
const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updates = {
      roll_no: req.body.roll_no,
      gender: req.body.gender,
      dob: req.body.dob,
      address: req.body.address,
      admission_date: req.body.admission_date,
      guardian_contact: req.body.guardian_contact,
      is_scholarship: req.body.is_scholarship,
      scholarship_percentage: req.body.scholarship_percentage,
      bus_route_id: req.body.bus_route_id,
    };

    // remove undefined keys so partial updates work cleanly
    Object.keys(updates).forEach(
      (key) => updates[key] === undefined && delete updates[key]
    );

    const updated = await studentRepository.updateStudent(Number(id), updates);

    if (!updated) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.json(updated);
  } catch (err) {
    return next(err);
  }
};

// Delete student
const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await studentRepository.deleteStudent(Number(id));

    if (!deleted) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Optionally also delete user; keep it simple for now
    return res.json({ message: "Student deleted", id: deleted.id });
  } catch (err) {
    return next(err);
  }
};

// List students for future expansion (e.g., pagination/filter by grade)
// here kept simple: just by grade/section/batch using enrollment
const getStudentsByClass = async (req, res, next) => {
  try {
    const { grade_id, section_id, batch_id } = req.query;

    const result = await studentRepository.findByClass({
      grade_id: Number(grade_id),
      section_id: Number(section_id),
      batch_id: Number(batch_id),
    });

    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

const studentController = {
  createStudent,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentsByClass,
};

export default studentController;
