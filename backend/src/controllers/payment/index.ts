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

    if (!amount) {
      res.status(400).json({ success: false, message: "Amount is required" });
      return;
    }

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      res.status(500).json({ success: false, message: "Error generating Razorpay order" });
      return;
    }

    const newPayment = await FeePayment.create({
      orderId: order.id,
      amount: Number(order.amount) / 100, // Save back as rupees
      currency: order.currency,
      status: "pending",
      receipt: options.receipt,
      studentId, // Optional reference
    });

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
