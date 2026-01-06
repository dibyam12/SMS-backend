// src/controllers/parentController.js
import parentRepository from "../models/repositories/user/parentRepository.js";
import userRepository from "../models/repositories/user/userRepository.js";

// Create parent user + parent profile +  links to students
const createParent = async (req, res, next) => {
  try {
    const {
      email,
      username,
      passwordHash, // assume already hashed
      first_name,
      last_name,
      phone,
      relationship,          // e.g., 'father', 'mother'
      student_ids = [],      // optional: [1,2,3]
      primary_student_id,    // optional: which student is primary
    } = req.body;

    // 1) create app_user with role=parent
    const user = await userRepository.createUser({
      email,
      username,
      passwordHash,
      first_name,
      last_name,
      role: "parent",
      is_staff: false,
    });

    // optional phone update if user table has phone column
    if (phone) {
      await userRepository.updateUser(user.id, { phone });
    }

    // 2) create parent profile
    const parent = await parentRepository.createParent({
      user_id: user.id,
      relationship,
    });

    // 3) link to students if provided
    const links = [];
    for (const sid of student_ids) {
      const is_primary_contact = primary_student_id
        ? Number(primary_student_id) === Number(sid)
        : false;

      const link = await parentRepository.addParentStudentLink({
        parent_id: parent.id,
        student_id: Number(sid),
        is_primary_contact,
      });
      links.push(link);
    }

    return res.status(201).json({
      user,
      parent,
      links,
    });
  } catch (err) {
    return next(err);
  }
};

// Get parent by id, including linked students
const getParentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const parent = await parentRepository.findById(Number(id));
    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    const parentUser = await parentRepository.findByUserId(parent.user_id);
    const students = await parentRepository.findStudentsByParentId(Number(id));

    return res.json({
      parent,
      user: parentUser,
      students,
    });
  } catch (err) {
    return next(err);
  }
};

// Update parent relationship and optionally linked students
const updateParent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { relationship, student_ids, primary_student_id } = req.body;

    const updates = {};
    if (relationship !== undefined) updates.relationship = relationship;

    const updatedParent = await parentRepository.updateParent(
      Number(id),
      updates
    );

    if (!updatedParent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    // If student_ids provided, reset links (simple approach)
    let links;
    if (Array.isArray(student_ids)) {
      // remove existing links
      const existing = await parentRepository.findStudentsByParentId(Number(id));
      for (const row of existing) {
        await parentRepository.removeParentStudentLink({
          parent_id: Number(id),
          student_id: row.student_id,
        });
      }

      // add new links
      links = [];
      for (const sid of student_ids) {
        const is_primary_contact = primary_student_id
          ? Number(primary_student_id) === Number(sid)
          : false;

        const link = await parentRepository.addParentStudentLink({
          parent_id: Number(id),
          student_id: Number(sid),
          is_primary_contact,
        });
        links.push(link);
      }
    }

    return res.json({
      parent: updatedParent,
      links,
    });
  } catch (err) {
    return next(err);
  }
};

// Delete parent (and links)
const deleteParent = async (req, res, next) => {
  try {
    const { id } = req.params;

    // remove links first
    const existing = await parentRepository.findStudentsByParentId(Number(id));
    for (const row of existing) {
      await parentRepository.removeParentStudentLink({
        parent_id: Number(id),
        student_id: row.student_id,
      });
    }

    const deleted = await parentRepository.deleteParent(Number(id));
    if (!deleted) {
      return res.status(404).json({ message: "Parent not found" });
    }

    return res.json({ message: "Parent deleted", id: deleted.id });
  } catch (err) {
    return next(err);
  }
};

// List parents for a specific student
const getParentsForStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const parents = await parentRepository.findParentsByStudentId(
      Number(studentId)
    );
    return res.json(parents);
  } catch (err) {
    return next(err);
  }
};

// List students for a parent (by parent id)
const getStudentsForParent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const students = await parentRepository.findStudentsByParentId(
      Number(id)
    );
    return res.json(students);
  } catch (err) {
    return next(err);
  }
};

const parentController = {
  createParent,
  getParentById,
  updateParent,
  deleteParent,
  getParentsForStudent,
  getStudentsForParent,
};

export default parentController;
