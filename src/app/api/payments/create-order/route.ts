import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import Razorpay from 'razorpay';
import { FeePayment } from '@/lib/models/FeePayment';
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
    const baseAmount = body.baseAmount || body.amount;
    const currency = body.currency || "INR";
    const description = body.description;
    const kitId = body.kitId;
    const period = body.period;

    if (!baseAmount) {
      return NextResponse.json({ success: false, message: 'baseAmount or amount is required' }, { status: 400 });
    }

    const academyId = auth.academyId;
    
    let transfers: any[] = [];
    let platformFee = 0;
    let gatewayFee = 0;
    let transferAmount = baseAmount;
    let totalAmount = baseAmount;
    
    if (academyId) {
      const academy = await Academy.findById(academyId);
      if (academy) {
        const platformFeePercent = academy.platformFeePercent || 1;
        platformFee = (baseAmount * platformFeePercent) / 100;
        gatewayFee = (baseAmount + platformFee) * 0.0236;
        
        totalAmount = baseAmount + platformFee + gatewayFee;
        transferAmount = baseAmount;
        
        if (academy.rzp_account) {
          transfers = [{
            account: academy.rzp_account,
            amount: Math.round(transferAmount * 100),
            currency,
            on_hold: false
          }];
        }
      } else {
        gatewayFee = baseAmount * 0.0236;
        totalAmount = baseAmount + gatewayFee;
      }
    } else {
      gatewayFee = baseAmount * 0.0236;
      totalAmount = baseAmount + gatewayFee;
    }

    const orderOptions: any = {
      amount: Math.round(totalAmount * 100),
      currency,
      receipt: `receipt_${Date.now()}_${auth.user._id.toString().substring(0, 5)}`,
      notes: {
        userId: auth.user._id.toString(),
        academyId: academyId ? academyId.toString() : '',
        description: description || 'Academy Fees',
        kitId: kitId || '',
        period: period || '',
        baseAmount: baseAmount.toString(),
        platformFee: platformFee.toString(),
        gatewayFee: gatewayFee.toString(),
        transferAmount: transferAmount.toString()
      }
    };

    if (transfers.length > 0) {
      orderOptions.transfers = transfers;
    }

    const order = await razorpay.orders.create(orderOptions);

    await FeePayment.create({
      orderId: order.id,
      amount: totalAmount,
      baseAmount: baseAmount,
      platformFee: platformFee,
      gatewayFee: gatewayFee,
      currency,
      status: "pending",
      receipt: orderOptions.receipt,
      studentId: auth.user._id,
      academyId: academyId || undefined
    });

    return NextResponse.json({
      success: true,
      data: {
        order,
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ''
      }
    });
  } catch (error: any) {
    console.error("Razorpay Create Order Error:", error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create order' }, { status: 500 });
  }
}
