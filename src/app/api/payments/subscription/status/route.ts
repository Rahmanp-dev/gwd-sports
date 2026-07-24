import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import { Subscription } from '@/lib/models/Subscription';

/**
 * GET /api/payments/subscription/status
 *
 * Returns the current active (or most recent) subscription for the
 * authenticated student, including billing period details.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    await connectToDatabase();

    // Prefer active subscription; fall back to any recent subscription
    const subscription = await Subscription.findOne(
      {
        studentId: auth.user._id,
        ...(auth.academyId ? { academyId: auth.academyId } : {}),
      },
      null,
      { sort: { createdAt: -1 } }
    ).lean();

    if (!subscription) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No subscription found',
      });
    }

    return NextResponse.json({ success: true, data: subscription });
  } catch (error: any) {
    console.error('Subscription status error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}
