// src/routes/fee.router.js
import { Router } from "express";
import feeController from "../controllers/feeController.js";

const feeRouter = Router();

import authMiddleware from "../middleware/auth.js";

// Apply auth middleware to all fee routes
feeRouter.use(authMiddleware);

// Fee heads
// POST /fee/head
feeRouter.post("/head", feeController.createFeeHead);
// PATCH /fee/head/:id
feeRouter.patch("/head/:id", feeController.updateFeeHead);
// GET /fee/head
feeRouter.get("/head", feeController.listFeeHeads);

// Student fees
// POST /fee/student
feeRouter.post("/student", feeController.assignStudentFee);
// PATCH /fee/student/:id
feeRouter.patch("/student/:id", feeController.updateStudentFee);
// GET /fee/student/:studentId
feeRouter.get("/student/:studentId", feeController.listStudentFees);

// Payments
// POST /fee/payment
feeRouter.post("/payment", feeController.createPayment);
// GET /fee/payment/student/:studentId
feeRouter.get("/payment/student/:studentId", feeController.listPaymentsByStudent);

export default feeRouter;
