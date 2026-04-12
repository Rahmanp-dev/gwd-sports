import { Router } from "express";
import { createOrder, verifyPayment } from "../../controllers/payment";
import { FeeController } from "../../controllers/payment/feeController";
import { authMiddleware, roleMiddleware } from "../../middleware/auth";

const router = Router();

// Secure all routes
router.use(authMiddleware);

// /api/payments
router.post("/create-order", authMiddleware, createOrder);
router.post("/verify-payment", authMiddleware, verifyPayment);

// ============ STUDENT ROUTES ============
// Fetch outstanding dues
router.get("/outstanding", roleMiddleware(["student"]), FeeController.getOutstandingFees);

// Pay outstanding
router.post("/pay", roleMiddleware(["student"]), FeeController.payFees);

// My fee history
router.get("/history", roleMiddleware(["student"]), FeeController.getMyFeeHistory);

// Get single transaction (Shared with Admin)
router.get("/transactions/:id", roleMiddleware(["student", "admin"]), FeeController.getFeePaymentById);

// ============ ADMIN ROUTES ============
// Get all global payments
router.get("/admin/all", roleMiddleware(["admin"]), FeeController.getAllFeePayments);

// Get defaulters (pending fees > 0)
router.get("/admin/defaulters", roleMiddleware(["admin"]), FeeController.getPendingStudents);

// Override student fees directly
router.patch("/admin/override/:studentId", roleMiddleware(["admin"]), FeeController.overrideStudentFees);

export default router;