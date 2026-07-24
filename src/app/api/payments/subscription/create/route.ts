import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import { Academy } from '@/lib/models/Academy';
import { Subscription } from '@/lib/models/Subscription';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

/** Map plan types to their Razorpay plan IDs sourced from env. */
const PLAN_IDS: Record<string, string | undefined> = {
  monthly: process.env.RAZORPAY_PLAN_ID_MONTHLY,
  quarterly: process.env.RAZORPAY_PLAN_ID_QUARTERLY,
  yearly: process.env.RAZORPAY_PLAN_ID_YEARLY,
};

/** Total billing cycles per plan type. */
const TOTAL_COUNTS: Record<string, number> = {
  monthly: 12,
  quarterly: 4,
  yearly: 1,
};

export async function POST(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    await connectToDatabase();

    const { planType } = await req.json();

    if (!['monthly', 'quarterly', 'yearly'].includes(planType)) {
      return NextResponse.json({ success: false, message: 'Invalid plan type' }, { status: 400 });
    }

    const planId = PLAN_IDS[planType];
    if (!planId) {
      return NextResponse.json(
        { success: false, message: `Razorpay plan ID for '${planType}' is not configured` },
        { status: 503 }
      );
    }

    const academyId = auth.academyId;
    if (!academyId) {
      return NextResponse.json({ success: false, message: 'No academy linked to this account' }, { status: 400 });
    }

    // Cancel any existing active subscription before creating a new one
    const existing = await Subscription.findOne({
      studentId: auth.user._id,
      academyId,
      status: { $in: ['created', 'authenticated', 'active'] },
    });
    if (existing) {
      try {
        await razorpay.subscriptions.cancel(existing.razorpaySubscriptionId, false);
      } catch (cancelErr) {
        console.warn('Failed to cancel existing Razorpay subscription:', cancelErr);
      }
      existing.status = 'cancelled';
      await existing.save();
    }

    // Resolve amount from academy fee schedule
    const academy = await Academy.findById(academyId);
    const feeMap: Record<string, number> = {
      monthly: academy?.fees?.monthly || 0,
      quarterly: academy?.fees?.quarterly || 0,
      yearly: academy?.fees?.yearly || 0,
    };
    const amount = feeMap[planType];

    const subscriptionOptions = {
      plan_id: planId,
      total_count: TOTAL_COUNTS[planType],
      quantity: 1,
      notes: {
        studentId: auth.user._id.toString(),
        academyId: academyId.toString(),
        planType,
      },
    };

    const rzpSub = await razorpay.subscriptions.create(subscriptionOptions);

    const sub = await Subscription.create({
      studentId: auth.user._id,
      academyId,
      razorpaySubscriptionId: rzpSub.id,
      razorpayPlanId: planId,
      planType,
      status: rzpSub.status,
      amount,
    });

    return NextResponse.json({
      success: true,
      data: {
        subscription: sub,
        razorpaySubscriptionId: rzpSub.id,
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
      },
    });
  } catch (error: any) {
    console.error('Subscription create error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
