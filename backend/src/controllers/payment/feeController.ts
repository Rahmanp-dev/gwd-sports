import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import StudentProfile from "../../schemas/studentSchema";
import { FeePayment } from "../../schemas/feePaymentSchema";
import { logger } from "../../utils/logger";
import mongoose from "mongoose";

export class FeeController {
  // STUDENT APIs

  // 1. View Outstanding Fees
  static async getOutstandingFees(req: AuthRequest, res: Response) {
    try {
      const studentProfile = await StudentProfile.findOne({ userId: req.user!._id });
      if (!studentProfile) {
        return res.status(404).json({ success: false, message: "Student profile not found" });
      }

      // Calculate logic based on current month vs last payment
      const now = new Date();
      let isDue = false;
      const amountToPay = 500; // Baseline monthly fee (should ideally be fetched from Academy settings)

      if (studentProfile.feePayments.length > 0) {
        const lastPayment = studentProfile.feePayments[studentProfile.feePayments.length - 1];
        const lastPaymentDate = new Date(lastPayment.paymentDate);
        
        // If last payment was not in the current month/year, it's due
        if (
          lastPaymentDate.getMonth() !== now.getMonth() ||
          lastPaymentDate.getFullYear() !== now.getFullYear()
        ) {
          isDue = true;
        }
      } else {
        isDue = true; // First time payment
      }

      // Update outstanding dynamically if due and not matching DB
      if (isDue && studentProfile.outstandingFees === 0) {
        studentProfile.outstandingFees = amountToPay;
        await studentProfile.save();
      }

      res.status(200).json({
        success: true,
        data: {
          outstandingFees: studentProfile.outstandingFees,
          totalFeesPaid: studentProfile.totalFeesPaid,
          isDue,
          nextDueDate: new Date(now.getFullYear(), now.getMonth() + 1, 5), // 5th of next month
          lastPayment: studentProfile.feePayments[studentProfile.feePayments.length - 1] || null
        },
      });
    } catch (error) {
      logger.error(`Error fetching outstanding fees: ${error}`);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }

  // 2. Pay Outstanding Fees (Mocked simulation for full flow)
  static async payFees(req: AuthRequest, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { amount, transactionId } = req.body; // Mocked incoming payment success data
      const studentProfile = await StudentProfile.findOne({ userId: req.user!._id }).session(session);

      if (!studentProfile) throw new Error("Profile not found");

      // 1. Create independent Fee Payment record
      const feeRecord = new FeePayment({
        orderId: `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Razorpay Order ID mock
        paymentId: transactionId || `PAY-${Date.now()}`,
        amount,
        currency: "INR",
        status: "success",
        studentId: studentProfile._id,
      });
      await feeRecord.save({ session });

      // 2. Update Student Profile array
      studentProfile.feePayments.push({
        amount,
        paymentDate: new Date(),
        period: "monthly",
        status: "paid",
        transactionId: feeRecord.paymentId,
      });

      // 3. Adjust balances
      studentProfile.outstandingFees = Math.max(0, studentProfile.outstandingFees - amount);
      studentProfile.totalFeesPaid += amount;

      await studentProfile.save({ session });
      await session.commitTransaction();

      logger.info(`Payment successful for user ${req.user!._id} - Amount: ${amount}`);
      res.status(200).json({ success: true, message: "Payment processed successfully", data: feeRecord });
    } catch (error) {
      await session.abortTransaction();
      logger.error(`Payment processing error: ${error}`);
      res.status(500).json({ success: false, message: "Payment processing failed" });
    } finally {
      session.endSession();
    }
  }

  // 3. View all fees paid so far
  static async getMyFeeHistory(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const profile = await StudentProfile.findOne({ userId: req.user!._id });
      if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

      const payments = await FeePayment.find({ studentId: profile._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await FeePayment.countDocuments({ studentId: profile._id });

      res.status(200).json({
        success: true,
        data: {
          payments, 
          pagination: { total, page, pages: Math.ceil(total / limit) }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }

  // 4. Get payment by ID
  static async getFeePaymentById(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const payment = await FeePayment.findById(id).populate("studentId", "user academyId level");
        
        if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
        return res.status(200).json({ success: true, data: payment });
    } catch(err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
  }

  // ADMIN APIs
  
  // 1. View all fee payments with powerful filters
  static async getAllFeePayments(req: AuthRequest, res: Response) {
    try {
      const { status, minAmount, maxAmount, sortBy = "createdAt", order = "desc" } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const query: any = {};
      if (status) query.status = status;
      if (minAmount || maxAmount) {
        query.amount = {};
        if (minAmount) query.amount.$gte = Number(minAmount);
        if (maxAmount) query.amount.$lte = Number(maxAmount);
      }

      const sortOptions: any = { [sortBy as string]: order === "asc" ? 1 : -1 };

      const payments = await FeePayment.find(query)
        .populate({ path: "studentId", select: "totalFeesPaid outstandingFees level sports" })
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await FeePayment.countDocuments(query);

      res.status(200).json({
        success: true,
        data: {
          payments,
          pagination: { total, page, pages: Math.ceil(total / limit) }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }

  // 2. Get students with pending payments
  static async getPendingStudents(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const students = await StudentProfile.find({ outstandingFees: { $gt: 0 } })
        .populate("userId", "name email phone")
        .sort({ outstandingFees: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await StudentProfile.countDocuments({ outstandingFees: { $gt: 0 } });

      res.status(200).json({
        success: true,
        data: {
          students,
          pagination: { total, page, pages: Math.ceil(total / limit) }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }

  // 3. Admin fee override
  static async overrideStudentFees(req: AuthRequest, res: Response) {
    try {
      const { studentId } = req.params;
      const { outstandingFees, totalFeesPaid } = req.body;

      const student = await StudentProfile.findById(studentId);
      if (!student) return res.status(404).json({ success: false, message: "Student Profile not found" });

      if (outstandingFees !== undefined) student.outstandingFees = outstandingFees;
      if (totalFeesPaid !== undefined) student.totalFeesPaid = totalFeesPaid;

      await student.save();
      
      logger.info(`Admin ${req.user!._id} overrode fees for student ${studentId}`);
      res.status(200).json({ success: true, message: "Student fees overridden successfully", data: student });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
}