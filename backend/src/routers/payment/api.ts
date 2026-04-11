import { Router } from "express";
import { createOrder, verifyPayment } from "../../controllers/payment";
import { authMiddleware } from "../../middleware/auth"; // Optional if auth is needed

const router = Router();

// /api/payments
router.post("/create-order", authMiddleware, createOrder);
router.post("/verify-payment", authMiddleware, verifyPayment);

export default router;