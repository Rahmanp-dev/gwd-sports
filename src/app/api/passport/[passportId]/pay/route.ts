import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Passport from '@/lib/models/Passport';
import StudentProfile from '@/lib/models/Student';
import Academy from '@/lib/models/Academy';
import { recordParentEngagement } from '@/lib/passport';
import { computeFeeSplit, configuredSplitConfig, percentToBps, paiseToRupees, formatInr, MoneyError } from '@/lib/payments/money';
import { resolveAmountDue, NoFeeConfiguredError } from '@/lib/payments/dues';
import { createFeeOrder, NothingDueError } from '@/lib/payments/createOrder';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PAYING A FEE WITHOUT AN ACCOUNT
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `/pay/<passportId>` is the link inside every fee reminder. It has no login,
 * and that is a deliberate decision rather than an oversight.
 *
 * WHY NO AUTH IS SAFE HERE:
 *
 *  1. The amount is never an input. It is resolved server-side by dues.ts from
 *     the student's own ledger, exactly as the authenticated route does — they
 *     share lib/payments/createOrder.ts. A caller can say WHO to pay for, never
 *     how much.
 *  2. Settlement does not depend on the browser. The authoritative path is the
 *     `payment.captured` webhook, which verifies Razorpay's signature. Nothing
 *     here trusts the client to confirm anything.
 *  3. Paying someone else's fee is not an attack. The worst a stranger with the
 *     link can do is settle a child's training fee for them.
 *
 * WHAT THE LINK DOES DISCLOSE, and the trade accepted: the student's first name
 * and the amount owed. That is strictly less than the fee reminder message
 * already contains, and that message went to the parent's phone. This is the
 * same model every payment link on the internet uses — the URL is the
 * credential. It is why the passport page deliberately withholds fee data: that
 * link gets forwarded, and this one is sent only to the person paying.
 * ════════════════════════════════════════════════════════════════════════════
 */

const PASSPORT_ID_PATTERN = /^GWD-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{6}$/;

async function resolveStudent(rawId: string) {
  const passportId = String(rawId ?? '').toUpperCase().trim();
  if (!PASSPORT_ID_PATTERN.test(passportId)) {
    return { error: 'That does not look like a Passport ID.', status: 400 as const };
  }

  const passport = await Passport.findOne({ passportId }).lean();
  if (!passport) {
    return { error: 'No Passport found with that ID.', status: 404 as const };
  }

  const profile = await StudentProfile.findOne({ passportId }).select(
    'userId academyId feeAmount feePeriod outstandingFees'
  );
  if (!profile) {
    return {
      error: 'This student is not currently enrolled at an academy, so there is nothing to pay.',
      status: 409 as const,
    };
  }

  const academy = profile.academyId
    ? await Academy.findById(profile.academyId).select('name platformFeePercent').lean()
    : null;

  return { passportId, passport: passport as any, profile, academy: academy as any };
}

/**
 * What is owed, and what the parent will actually be charged.
 *
 * Computes the split WITHOUT creating an order, so opening the link does not
 * litter Razorpay and the ledger with abandoned orders. The order is created
 * only when the parent presses pay.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ passportId: string }> }
) {
  // Captured outside the try so the catch can name which passport failed.
  let requested = 'unknown';

  try {
    await connectToDatabase();
    const { passportId: raw } = await params;
    requested = String(raw ?? 'unknown');

    const resolved = await resolveStudent(raw);
    if ('error' in resolved) {
      return NextResponse.json(
        { success: false, message: resolved.error },
        { status: resolved.status }
      );
    }

    const { passport, profile, academy, passportId } = resolved;

    // Opening a payment link is engagement, same as opening the passport.
    void recordParentEngagement(passportId);

    let due;
    try {
      due = await resolveAmountDue({
        studentUserId: profile.userId,
        academyId: profile.academyId,
        period: (profile.feePeriod as any) ?? 'monthly',
      });
    } catch (err) {
      if (err instanceof NoFeeConfiguredError) {
        return NextResponse.json({
          success: true,
          data: {
            passportId,
            studentName: passport.studentName,
            academyName: academy?.name ?? null,
            amountDue: null,
            message: 'Nothing is due right now.',
          },
        });
      }
      throw err;
    }

    const marginRateBps =
      academy && typeof academy.platformFeePercent === 'number'
        ? percentToBps(academy.platformFeePercent)
        : undefined;
    const split = computeFeeSplit(due.baseAmountPaise, configuredSplitConfig(marginRateBps));

    return NextResponse.json({
      success: true,
      data: {
        passportId,
        studentName: passport.studentName,
        academyName: academy?.name ?? null,
        period: due.period,
        amountDue: {
          // Itemised because a parent seeing a total larger than the fee their
          // academy quoted, with no explanation, does not pay — they phone the
          // academy, and the academy phones us.
          academyFee: paiseToRupees(split.academyAmountPaise),
          convenienceFee: paiseToRupees(split.convenienceFeePaise),
          total: paiseToRupees(split.parentTotalPaise),
          totalFormatted: formatInr(split.parentTotalPaise),
        },
      },
    });
  } catch (error: any) {
    if (error instanceof MoneyError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    /**
     * Log enough to diagnose without another reproduction. A bare
     * `console.error(error)` here produced a 500 whose only visible trace on the
     * client was "Could not load the fee" — true, useless, and unactionable.
     */
    console.error('[passport/pay GET] failed', {
      passportId: requested,
      name: error?.name,
      message: error?.message,
      stack: error?.stack?.split('\n').slice(0, 3).join(' | '),
    });
    return NextResponse.json(
      {
        success: false,
        message:
          'Could not work out what is due right now. This is usually a temporary database ' +
          'connection problem — please try again in a moment.',
      },
      { status: 500 }
    );
  }
}

/** Creates the Razorpay order. Settlement is the webhook's job, not this one's. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ passportId: string }> }
) {
  try {
    await connectToDatabase();
    const { passportId: raw } = await params;
    const resolved = await resolveStudent(raw);
    if ('error' in resolved) {
      return NextResponse.json(
        { success: false, message: resolved.error },
        { status: resolved.status }
      );
    }

    const { profile, passportId, passport } = resolved;

    const result = await createFeeOrder({
      studentUserId: profile.userId,
      academyId: profile.academyId,
      period: (profile.feePeriod as any) ?? 'monthly',
      description: 'Academy fees',
      // Marks the origin on the order, so a payment that arrives with no logged-in
      // user is identifiable in reconciliation rather than looking anomalous.
      extraNotes: { source: 'passport_link', passportId },
    });

    return NextResponse.json({
      success: true,
      data: {
        order: result.order,
        key_id: result.keyId,
        breakdown: result.breakdown,
        studentName: passport.studentName,
      },
    });
  } catch (error: any) {
    if (error instanceof NoFeeConfiguredError || error instanceof NothingDueError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 409 });
    }
    if (error instanceof MoneyError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    console.error('[passport/pay POST]', error);
    return NextResponse.json({ success: false, message: 'Could not start the payment' }, { status: 500 });
  }
}
