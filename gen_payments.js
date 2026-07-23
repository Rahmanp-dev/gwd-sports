const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// 1. /api/payments/verify-payment/route.ts
const verifyPaymentRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import { FeePayment } from '@/lib/models/FeePayment';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, message: 'Missing required signatures' }, { status: 400 });
    }

    const payment = await FeePayment.findOne({ orderId: razorpay_order_id });
    if (!payment) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      payment.status = 'success';
      payment.paymentId = razorpay_payment_id;
      payment.signature = razorpay_signature;
      await payment.save();
      return NextResponse.json({ success: true, message: 'Payment verified successfully' });
    } else {
      payment.status = 'failed';
      await payment.save();
      return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to verify payment' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/payments/verify-payment');
fs.writeFileSync('src/app/api/payments/verify-payment/route.ts', verifyPaymentRoute);

// 2. /api/payments/outstanding/route.ts
const outstandingRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const userId = (req as any).user._id;
    const studentProfile = await StudentProfile.findOne({ userId });
    
    if (!studentProfile) return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 });

    const now = new Date();
    let isDue = false;
    const amountToPay = 500; 

    if (studentProfile.feePayments.length > 0) {
      const lastPayment = studentProfile.feePayments[studentProfile.feePayments.length - 1];
      const lastPaymentDate = new Date(lastPayment.paymentDate);
      if (lastPaymentDate.getMonth() !== now.getMonth() || lastPaymentDate.getFullYear() !== now.getFullYear()) {
        isDue = true;
      }
    } else {
      isDue = true;
    }

    if (isDue && studentProfile.outstandingFees === 0) {
      studentProfile.outstandingFees = amountToPay;
      await studentProfile.save();
    }

    return NextResponse.json({
      success: true,
      data: {
        outstandingFees: studentProfile.outstandingFees,
        totalFeesPaid: studentProfile.totalFeesPaid,
        isDue,
        nextDueDate: new Date(now.getFullYear(), now.getMonth() + 1, 5),
        lastPayment: studentProfile.feePayments[studentProfile.feePayments.length - 1] || null
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/payments/outstanding');
fs.writeFileSync('src/app/api/payments/outstanding/route.ts', outstandingRoute);

// 3. /api/payments/pay/route.ts
const payRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';
import { FeePayment } from '@/lib/models/FeePayment';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) {
       await session.abortTransaction();
       session.endSession();
       return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const userId = (req as any).user._id;
    const { amount, transactionId } = await req.json();
    const studentProfile = await StudentProfile.findOne({ userId }).session(session);

    if (!studentProfile) throw new Error('Profile not found');

    const feeRecord = new FeePayment({
      orderId: \`ORDER-\${Date.now()}-\${Math.floor(Math.random() * 1000)}\`,
      paymentId: transactionId || \`PAY-\${Date.now()}\`,
      amount,
      currency: 'INR',
      status: 'success',
      studentId: studentProfile._id,
    });
    await feeRecord.save({ session });

    studentProfile.feePayments.push({
      amount,
      paymentDate: new Date(),
      period: 'monthly',
      status: 'paid',
      transactionId: feeRecord.paymentId,
    });

    studentProfile.outstandingFees = Math.max(0, studentProfile.outstandingFees - amount);
    studentProfile.totalFeesPaid += amount;

    await studentProfile.save({ session });
    await session.commitTransaction();

    return NextResponse.json({ success: true, message: 'Payment processed successfully', data: feeRecord });
  } catch (error: any) {
    await session.abortTransaction();
    return NextResponse.json({ success: false, message: 'Payment processing failed' }, { status: 500 });
  } finally {
    session.endSession();
  }
}
`;

ensureDir('src/app/api/payments/pay');
fs.writeFileSync('src/app/api/payments/pay/route.ts', payRoute);

// 4. /api/payments/history/route.ts
const historyRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import { FeePayment } from '@/lib/models/FeePayment';

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const userId = (req as any).user._id;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limitNum = parseInt(searchParams.get('limit') || '10');

    const payments = await FeePayment.find({ studentId: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limitNum)
      .limit(limitNum);

    const total = await FeePayment.countDocuments({ studentId: userId });

    return NextResponse.json({
      success: true,
      data: { payments, pagination: { total, page, pages: Math.ceil(total / limitNum) } }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/payments/history');
fs.writeFileSync('src/app/api/payments/history/route.ts', historyRoute);

// 5. /api/payments/transactions/[id]/route.ts
const transactionsIdRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import { FeePayment } from '@/lib/models/FeePayment';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const payment = await FeePayment.findById(params.id).populate('studentId', 'user academyId level');
    if (!payment) return NextResponse.json({ success: false, message: 'Payment not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: payment });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/payments/transactions/[id]');
fs.writeFileSync('src/app/api/payments/transactions/[id]/route.ts', transactionsIdRoute);


// 6. /api/payments/admin/all/route.ts
const adminAllRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import { FeePayment } from '@/lib/models/FeePayment';

export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limitNum = parseInt(searchParams.get('limit') || '10');

    const query: any = {};
    if (status) query.status = status;
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = Number(minAmount);
      if (maxAmount) query.amount.$lte = Number(maxAmount);
    }
    if (search) {
      query.$or = [
        { paymentId: { $regex: search, $options: 'i' } },
        { orderId: { $regex: search, $options: 'i' } },
        { receipt: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions: any = { [sortBy]: order === 'asc' ? 1 : -1 };

    const payments = await FeePayment.find(query)
      .populate({ path: 'studentId', select: 'totalFeesPaid outstandingFees level sports' })
      .sort(sortOptions)
      .skip((page - 1) * limitNum)
      .limit(limitNum);

    const total = await FeePayment.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: { payments, pagination: { total, page, pages: Math.ceil(total / limitNum) } }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/payments/admin/all');
fs.writeFileSync('src/app/api/payments/admin/all/route.ts', adminAllRoute);

// 7. /api/payments/admin/defaulters/route.ts
const adminDefaultersRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';

export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limitNum = parseInt(searchParams.get('limit') || '10');

    const students = await StudentProfile.find({ outstandingFees: { $gt: 0 } })
      .populate('userId', 'name email phone')
      .sort({ outstandingFees: -1 })
      .skip((page - 1) * limitNum)
      .limit(limitNum);

    const total = await StudentProfile.countDocuments({ outstandingFees: { $gt: 0 } });

    return NextResponse.json({
      success: true,
      data: { students, pagination: { total, page, pages: Math.ceil(total / limitNum) } }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/payments/admin/defaulters');
fs.writeFileSync('src/app/api/payments/admin/defaulters/route.ts', adminDefaultersRoute);

// 8. /api/payments/admin/override/[studentId]/route.ts
const adminOverrideRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';

export async function PATCH(req: NextRequest, { params }: { params: { studentId: string } }) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { outstandingFees, totalFeesPaid } = await req.json();

    const student = await StudentProfile.findById(params.studentId);
    if (!student) return NextResponse.json({ success: false, message: 'Student Profile not found' }, { status: 404 });

    if (outstandingFees !== undefined) student.outstandingFees = outstandingFees;
    if (totalFeesPaid !== undefined) student.totalFeesPaid = totalFeesPaid;

    await student.save();

    return NextResponse.json({ success: true, message: 'Student fees overridden successfully', data: student });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/payments/admin/override/[studentId]');
fs.writeFileSync('src/app/api/payments/admin/override/[studentId]/route.ts', adminOverrideRoute);

