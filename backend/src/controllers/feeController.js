// src/controllers/feeController.js
import feeRepository from "../models/repositories/fees/feeRepository.js";

// Fee heads
const createFeeHead = async (req, res, next) => {
  try {
    const head = await feeRepository.createFeeHead(req.body);
    return res.status(201).json(head);
  } catch (err) {
    return next(err);
  }
};

const updateFeeHead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const head = await feeRepository.updateFeeHead(Number(id), req.body);
    if (!head) return res.status(404).json({ message: "Fee head not found" });
    return res.json(head);
  } catch (err) {
    return next(err);
  }
};

const listFeeHeads = async (req, res, next) => {
  try {
    const heads = await feeRepository.listFeeHeads();
    return res.json(heads);
  } catch (err) {
    return next(err);
  }
};

// Student fees
const assignStudentFee = async (req, res, next) => {
  try {
    const fee = await feeRepository.assignStudentFee(req.body);
    return res.status(201).json(fee);
  } catch (err) {
    return next(err);
  }
};

const updateStudentFee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fee = await feeRepository.updateStudentFee(Number(id), req.body);
    if (!fee) return res.status(404).json({ message: "Student fee not found" });
    return res.json(fee);
  } catch (err) {
    return next(err);
  }
};

const listStudentFees = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const rows = await feeRepository.findStudentFeesByStudentId(
      Number(studentId)
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
};

// Payments
const createPayment = async (req, res, next) => {
  try {
    const payment = await feeRepository.createPayment(req.body);
    return res.status(201).json(payment);
  } catch (err) {
    return next(err);
  }
};

const listPaymentsByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const rows = await feeRepository.findPaymentsByStudentId(Number(studentId));
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
};

const feeController = {
  createFeeHead,
  updateFeeHead,
  listFeeHeads,
  assignStudentFee,
  updateStudentFee,
  listStudentFees,
  createPayment,
  listPaymentsByStudent,
};

export default feeController;
