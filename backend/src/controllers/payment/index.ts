import { Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { FeePayment } from "../../schemas/feePaymentSchema";
import env from "../../config/env";
import { logger } from "../../utils/logger";

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, currency = "INR", receipt, studentId } = req.body;
    const user = (req as any).user;

    console.log("=== BACKEND DEBUG: CREATE ORDER ===");
    console.log("Req Body:", req.body);
    console.log("Authenticated User from Token:", user ? { _id: user._id, role: user.role } : "No User");
    console.log("Student ID extracted from body:", studentId);

    if (!amount) {
      res.status(400).json({ success: false, message: "Amount is required" });
      return;
    }

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: {
        app_name: env.APP_NAME || "MasterGrade",
        app_id: env.APP_ID || "MG_1",
        student_id: studentId ? studentId.toString() : "",
        description: "Academy Fees Payment",
      }
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      res.status(500).json({ success: false, message: "Error generating Razorpay order" });
      return;
    }

    console.log("Creating FeePayment with studentId (Which might actually be a plain User_id):", studentId);

    const newPayment = await FeePayment.create({
      orderId: order.id,
      amount: Number(order.amount) / 100, // Save back as rupees
      currency: order.currency,
      status: "pending",
      receipt: options.receipt,
      // ! for now this function is only for students paying fees, so we can assume the studentId is the user ID of the authenticated user. In future, we need to refactor this to be more flexible. 
      studentId: user && user.role === 'student' ? user._id : studentId, // Map the user's ID
    });
    
    console.log("Newly Saved FeePayment DB Record:", newPayment);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error: any) {
    logger.error("Create order failed:", error);
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
};

export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ success: false, message: "Missing required signatures" });
      return;
    }

    const payment = await FeePayment.findOne({ orderId: razorpay_order_id });

    if (!payment) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      payment.status = "success";
      payment.paymentId = razorpay_payment_id;
      payment.signature = razorpay_signature;
      await payment.save();

      res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      payment.status = "failed";
      await payment.save();
      
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (error: any) {
    logger.error("Verify payment failed:", error);
    res.status(500).json({ success: false, message: "Failed to verify payment" });
  }
};
