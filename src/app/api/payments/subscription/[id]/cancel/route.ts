import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import { Subscription } from '@/lib/models/Subscription';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

/**
 * DELETE /api/payments/subscription/[id]/cancel
 *
 * Cancels a subscription both in Razorpay (at period end) and locally.
 * Only the subscription owner can cancel their own subscription.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    await connectToDatabase();

    const { id } = await params;

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return NextResponse.json({ success: false, message: 'Subscription not found' }, { status: 404 });
    }

    // Ensure the authenticated user owns this subscription
    if (subscription.studentId.toString() !== auth.user._id.toString()) {
      return NextResponse.json({ success: false, message: 'Forbidden: not your subscription' }, { status: 403 });
    }

    // Guard: only cancel subscriptions that are in a cancellable state
    const cancellableStatuses = ['created', 'authenticated', 'active', 'paused'];
    if (!cancellableStatuses.includes(subscription.status)) {
      return NextResponse.json(
        { success: false, message: `Cannot cancel a subscription with status '${subscription.status}'` },
        { status: 400 }
      );
    }

    // Cancel at Razorpay — cancel_at_cycle_end=true means user retains access until period end
    await razorpay.subscriptions.cancel(subscription.razorpaySubscriptionId, true);

    subscription.status = 'cancelled';
    await subscription.save();

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully. Access continues until the end of the current billing period.',
      data: { id: subscription._id, status: subscription.status },
    });
  } catch (error: any) {
    console.error('Subscription cancel error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
