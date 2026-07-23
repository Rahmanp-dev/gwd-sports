import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import Razorpay from 'razorpay';
import { FeePayment } from '@/lib/models/FeePayment';
import { StudentProfile } from '@/lib/models/Student';
import { Academy } from '@/lib/models/Academy';
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

export async function POST(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    
    await connectToDatabase();
    const body = await req.json();
    const { amount, baseAmount, currency = "INR", description, kitId, period } = body;

    if (!amount) {
      return NextResponse.json({ success: false, message: 'Amount is required' }, { status: 400 });
    }


    const studentProfile = await StudentProfile.findOne({ userId: auth.user._id });
    const academyId = studentProfile?.academyId;
    
    let transfers: any[] = [];
    if (academyId) {
      const academy = await Academy.findById(academyId);
      if (academy && academy.rzp_account) {
        // Auto-Split Engine: Academy gets 100% of the base fee (minus GWD/Razorpay fees which Razorpay handles from the main account, or per the commercial agreement).
        // If baseAmount = 3000, Academy gets 300000 paise.
        const transferAmount = baseAmount || amount;
        transfers = [{
          account: academy.rzp_account,
          amount: Math.round(transferAmount * 100),
          currency,
          on_hold: false
        }];
      }
    }

    const orderOptions: any = {
      amount: Math.round(amount * 100), // convert to paise
      currency,
      receipt: `receipt_${Date.now()}_${auth.user._id.toString().substring(0, 5)}`,
      notes: {
        userId: auth.user._id.toString(),
        academyId: academyId ? academyId.toString() : '',
        description: description || 'Academy Fees',
        kitId: kitId || '',
        period: period || ''
      }
    };

    if (transfers.length > 0) {
      orderOptions.transfers = transfers;
    }

    const order = await razorpay.orders.create(orderOptions);

    // Save to FeePayment collection
    await FeePayment.create({
      orderId: order.id,
      amount: amount,
      currency,
      status: "pending",
      receipt: orderOptions.receipt,
      studentId: auth.user._id,
      academyId: academyId || undefined
    });

    return NextResponse.json({
      success: true,
      data: order
    });
  } catch (error: any) {
    console.error("Razorpay Create Order Error:", error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create order' }, { status: 500 });
  }
}
