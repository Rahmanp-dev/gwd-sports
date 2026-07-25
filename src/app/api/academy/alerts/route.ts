import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import OwnerAlert from '@/lib/models/OwnerAlert';

/**
 * Owner-facing alert feed. This is the "dashboard" channel from the
 * communication design — owner-only, never sent to a parent.
 *
 * The T+7 and T+15 fee stages surface here and nowhere else, because past T+3 the
 * platform deliberately stops messaging parents and hands the follow-up to the
 * owner.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const includeResolved = searchParams.get('includeResolved') === 'true';
    const limit = Math.min(Number(searchParams.get('limit') ?? 100), 200);

    const filter: Record<string, unknown> = {};
    // Tenant isolation: super admins see everything, owners see their own.
    if (auth.user.role !== 'gwd_super_admin') {
      if (!auth.academyId) {
        return NextResponse.json(
          { success: false, message: 'Your account is not linked to an academy.' },
          { status: 403 }
        );
      }
      filter.academyId = auth.academyId;
    }
    if (!includeResolved) filter.resolvedAt = null;

    const alerts = await OwnerAlert.find(filter)
      .sort({ severity: 1, createdAt: -1 })
      .limit(limit)
      .lean();

    const counts = {
      total: alerts.length,
      critical: alerts.filter((a: any) => a.severity === 'critical').length,
      warning: alerts.filter((a: any) => a.severity === 'warning').length,
      // The ones where the platform is explicitly refusing to act on its own.
      awaitingDecision: alerts.filter((a: any) => a.requiresOwnerDecision && !a.resolvedAt).length,
      unacknowledged: alerts.filter((a: any) => !a.acknowledgedAt).length,
    };

    return NextResponse.json({ success: true, data: { alerts, counts } });
  } catch (error: any) {
    console.error('[academy/alerts]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

/**
 * Acknowledge or resolve an alert.
 *
 * Body: { alertId, action: 'acknowledge' | 'resolve' }
 *
 * Resolving records that the OWNER dealt with it. It deliberately does not
 * trigger any enforcement — there is no system action attached to resolving a
 * T+15 fee alert, by design.
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const { alertId, action } = await req.json().catch(() => ({}));

    if (!alertId || !mongoose.Types.ObjectId.isValid(alertId)) {
      return NextResponse.json(
        { success: false, message: 'A valid alertId is required' },
        { status: 400 }
      );
    }
    if (!['acknowledge', 'resolve'].includes(action)) {
      return NextResponse.json(
        { success: false, message: "action must be 'acknowledge' or 'resolve'" },
        { status: 400 }
      );
    }

    const filter: Record<string, unknown> = { _id: alertId };
    if (auth.user.role !== 'gwd_super_admin') {
      filter.academyId = auth.academyId;
    }

    const now = new Date();
    const update =
      action === 'resolve'
        ? { acknowledgedAt: now, acknowledgedBy: auth.user._id, resolvedAt: now }
        : { acknowledgedAt: now, acknowledgedBy: auth.user._id };

    const alert = await OwnerAlert.findOneAndUpdate(filter, { $set: update }, { new: true });
    if (!alert) {
      return NextResponse.json({ success: false, message: 'Alert not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { alert } });
  } catch (error: any) {
    console.error('[academy/alerts PATCH]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
