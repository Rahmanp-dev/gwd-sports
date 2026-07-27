import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import { FeePayment } from '@/lib/models/FeePayment';
import { Academy } from '@/lib/models/Academy';
import {
  computeFeeSplit,
  configuredSplitConfig,
  percentToBps,
  paiseToRupees,
  formatInr,
} from '@/lib/payments/money';
import { resolveAmountDue, type FeePeriod } from '@/lib/payments/dues';
import { resolveSettlementStrategy } from '@/lib/payments/settlement';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * ONE ORDER-CREATION PATH, SHARED BY EVERY CALLER
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Extracted from /api/payments/create-order when the public /pay/<passportId>
 * page needed the same behaviour. Duplicating it was not an option: this is the
 * code that decides what a parent is charged, how much the academy receives and
 * what GWD keeps. Two copies of that drift, and the drift is money — one path
 * gets a fee-model fix and the other quietly keeps charging the old split.
 *
 * WHAT THIS FUNCTION DOES NOT DO: authorise the caller. Each route decides who
 * is allowed to ask, because the answer genuinely differs — an admin may
 * collect on anyone's behalf, a student only for themselves, and the public
 * payment link deliberately requires no account at all. What is common, and
 * enforced here, is that THE AMOUNT IS ALWAYS DERIVED SERVER-SIDE. A caller can
 * say who to charge, never how much.
 * ════════════════════════════════════════════════════════════════════════════
 */

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export interface CreateFeeOrderInput {
  studentUserId: mongoose.Types.ObjectId | string;
  academyId?: mongoose.Types.ObjectId | string | null;
  period?: FeePeriod;
  description?: string;
  /**
   * Pre-validated paise, for the admin ad-hoc path ONLY. Routes must run this
   * through validateAdminSuppliedAmount first; it is typed as paise so a raw
   * rupee figure from a request body cannot be passed in by accident.
   */
  overrideBaseAmountPaise?: number;
  /** Recorded on the order for the audit trail. */
  amountSource?: string;
  /** Free-form, merged into the Razorpay order notes. */
  extraNotes?: Record<string, string>;
}

export interface CreateFeeOrderResult {
  order: any;
  keyId: string;
  breakdown: {
    academyFee: number;
    convenienceFee: number;
    total: number;
    totalFormatted: string;
    period: FeePeriod;
  };
}

export async function createFeeOrder(
  input: CreateFeeOrderInput
): Promise<CreateFeeOrderResult> {
  const period: FeePeriod = input.period ?? 'monthly';
  const { studentUserId } = input;

  // ---- How much -----------------------------------------------------------
  let baseAmountPaise: number;
  let amountSource: string;

  if (input.overrideBaseAmountPaise !== undefined) {
    baseAmountPaise = input.overrideBaseAmountPaise;
    amountSource = input.amountSource ?? 'admin_supplied';
  } else {
    const due = await resolveAmountDue({
      studentUserId,
      academyId: input.academyId,
      period,
    });
    baseAmountPaise = due.baseAmountPaise;
    amountSource = due.source;
  }

  if (baseAmountPaise <= 0) {
    throw new NothingDueError('Nothing is currently due for this student');
  }

  // ---- Reuse a still-open order rather than mint a duplicate --------------
  //
  // Nothing server-side stopped a parent double-tapping "Pay" on a slow
  // connection (or reopening the same WhatsApp link) from creating two live
  // Razorpay orders for the same fee — the only guard was a React `paying`
  // flag on the button, which a page reload resets. Two orders for the same
  // fee is a real risk of a parent actually completing both. Skipped for the
  // admin ad-hoc path (`overrideBaseAmountPaise`), where a second charge in
  // the same period may be genuinely intended.
  if (input.overrideBaseAmountPaise === undefined) {
    const reused = await reuseOpenOrder({ studentUserId, period, baseAmountPaise });
    if (reused) return reused;
  }

  // ---- Split --------------------------------------------------------------
  const academy = input.academyId ? await Academy.findById(input.academyId) : null;
  const marginRateBps =
    academy && typeof academy.platformFeePercent === 'number'
      ? percentToBps(academy.platformFeePercent)
      : undefined;

  const split = computeFeeSplit(baseAmountPaise, configuredSplitConfig(marginRateBps));

  // ---- Settlement ---------------------------------------------------------
  const strategy = resolveSettlementStrategy(academy);
  const settlementInstruction = strategy.buildOrderInstruction({
    split,
    academyRzpAccount: academy?.rzp_account,
    currency: 'INR',
  });

  const receipt = `rcpt_${Date.now()}_${String(studentUserId).slice(-5)}`;

  const order = await razorpay.orders.create({
    // Razorpay takes paise. The split is already integer paise, so there is no
    // float multiplication anywhere in this path.
    amount: split.parentTotalPaise,
    currency: 'INR',
    receipt,
    notes: {
      studentUserId: String(studentUserId),
      academyId: input.academyId ? String(input.academyId) : '',
      description: input.description || 'Academy Fees',
      period,
      amountSource,
      academyAmountPaise: String(split.academyAmountPaise),
      gatewayFeePaise: String(split.gatewayFeePaise),
      gwdNetPaise: String(split.gwdNetPaise),
      settlementStrategy: strategy.name,
      ...(input.extraNotes ?? {}),
    },
    ...settlementInstruction.orderFields,
  } as any);

  await FeePayment.create({
    orderId: order.id,
    // Legacy rupee fields, derived — kept so existing dashboards keep working.
    amount: paiseToRupees(split.parentTotalPaise),
    baseAmount: paiseToRupees(split.academyAmountPaise),
    platformFee: paiseToRupees(split.gwdNetPaise),
    gatewayFee: paiseToRupees(split.gatewayFeePaise),
    // Exact paise — the source of truth for reconciliation.
    parentTotalPaise: split.parentTotalPaise,
    academyAmountPaise: split.academyAmountPaise,
    gatewayFeePaise: split.gatewayFeePaise,
    gwdNetPaise: split.gwdNetPaise,
    currency: 'INR',
    status: 'pending',
    receipt,
    studentId: studentUserId,
    academyId: input.academyId || undefined,
    settlementStrategy: strategy.name,
    transferStatus: settlementInstruction.transferStatus,
    description: input.description,
    period,
  });

  return {
    order,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
    breakdown: {
      academyFee: paiseToRupees(split.academyAmountPaise),
      convenienceFee: paiseToRupees(split.convenienceFeePaise),
      total: paiseToRupees(split.parentTotalPaise),
      totalFormatted: formatInr(split.parentTotalPaise),
      period,
    },
  };
}

/**
 * A Razorpay order stays payable against until it's actually paid — retrying
 * checkout on the same order_id is the normal, supported flow, not a hack.
 * 24 hours bounds how stale a "reused" order can be (a fee schedule or period
 * could change by the next day) without punishing a parent who just closed
 * the checkout modal and came back five minutes later.
 */
const PENDING_ORDER_REUSE_WINDOW_MS = 24 * 60 * 60 * 1000;

async function reuseOpenOrder(input: {
  studentUserId: mongoose.Types.ObjectId | string;
  period: FeePeriod;
  baseAmountPaise: number;
}): Promise<CreateFeeOrderResult | null> {
  const candidate = await FeePayment.findOne({
    studentId: input.studentUserId,
    period: input.period,
    status: 'pending',
    // academyAmountPaise IS the base amount computeFeeSplit was given — see
    // money.ts's computeFeeSplit, which sets it verbatim from its input.
    academyAmountPaise: input.baseAmountPaise,
    createdAt: { $gte: new Date(Date.now() - PENDING_ORDER_REUSE_WINDOW_MS) },
  }).sort({ createdAt: -1 });

  if (!candidate) return null;

  try {
    const order = await razorpay.orders.fetch(candidate.orderId);
    // 'paid' can arrive here if the webhook settled it a moment after this
    // process read `status: 'pending'` from Mongo — a genuine race, not a
    // bug. Falling through to mint a fresh order is correct in that case.
    if (order.status === 'paid') return null;

    return {
      order,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
      breakdown: {
        academyFee: paiseToRupees(candidate.academyAmountPaise ?? 0),
        convenienceFee: paiseToRupees(
          (candidate.parentTotalPaise ?? 0) - (candidate.academyAmountPaise ?? 0)
        ),
        total: paiseToRupees(candidate.parentTotalPaise ?? 0),
        totalFormatted: formatInr(candidate.parentTotalPaise ?? 0),
        period: input.period,
      },
    };
  } catch (err: any) {
    // Razorpay couldn't find/return the order (deleted, API hiccup) — treat
    // as "nothing to reuse" and let the caller mint a fresh one.
    console.error('[createOrder] could not reuse pending order, minting a new one:', err?.message || err);
    return null;
  }
}

/** Distinct from NoFeeConfiguredError: a fee exists, but nothing is owed now. */
export class NothingDueError extends Error {}
