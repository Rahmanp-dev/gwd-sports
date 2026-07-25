import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import { Subscription } from '@/lib/models/Subscription';
import { FeePayment } from '@/lib/models/FeePayment';
import User from '@/lib/models/User';
import { settlePayment, markPaymentFailed } from './settle';
import { emitEvent } from '@/lib/events/emit';

export type SignatureCheck =
  | { ok: true }
  | { ok: false; reason: 'not_configured' | 'mismatch' | 'missing_header' };

/**
 * Verifies Razorpay's webhook signature against the RAW request body.
 *
 * The body must be the exact bytes Razorpay sent — parsing and re-serialising
 * JSON changes key order and whitespace and breaks the HMAC.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): SignatureCheck {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

  // Distinguished from a mismatch on purpose. An unset secret made every
  // comparison fail while the old handler still returned HTTP 200, so Razorpay's
  // dashboard showed every delivery as successful and every subscription event
  // was silently discarded. That failure mode must be loud.
  if (!secret) {
    return { ok: false, reason: 'not_configured' };
  }
  if (!signatureHeader) {
    return { ok: false, reason: 'missing_header' };
  }

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  const a = Buffer.from(signatureHeader, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) {
    return { ok: false, reason: 'mismatch' };
  }
  // Constant-time compare so the endpoint cannot be used as a signature oracle.
  return crypto.timingSafeEqual(a, b) ? { ok: true } : { ok: false, reason: 'mismatch' };
}

export interface WebhookOutcome {
  event: string;
  handled: boolean;
  detail?: string;
}

/**
 * Dispatches a verified Razorpay webhook.
 *
 * Throws on unexpected processing failure so the route can answer 5xx and let
 * Razorpay retry. The previous handler swallowed everything and always answered
 * 200, which turned any transient database hiccup into a permanently lost
 * payment record.
 */
export async function handleWebhookEvent(payload: any): Promise<WebhookOutcome> {
  const event: string = payload?.event || '';
  await connectToDatabase();

  const paymentEntity = payload?.payload?.payment?.entity;
  const orderEntity = payload?.payload?.order?.entity;
  const subscriptionEntity = payload?.payload?.subscription?.entity;
  const refundEntity = payload?.payload?.refund?.entity;

  switch (event) {
    /**
     * The authoritative settlement signal. Fires regardless of whether the
     * parent's browser ever returns to our site, which is the whole point.
     */
    case 'payment.captured':
    case 'order.paid': {
      const entity = paymentEntity ?? null;
      const paymentId: string | undefined = entity?.id;
      const orderId: string | undefined = entity?.order_id ?? orderEntity?.id;

      if (!paymentId) {
        return { event, handled: false, detail: 'no payment id in payload' };
      }

      const result = await settlePayment({
        orderId,
        paymentId,
        paymentEntity: entity,
        source: 'webhook',
      });

      return {
        event,
        handled: result.outcome !== 'not_found',
        detail: result.outcome,
      };
    }

    case 'payment.failed': {
      const paymentId: string | undefined = paymentEntity?.id;
      const orderId: string | undefined = paymentEntity?.order_id;
      await markPaymentFailed(
        { orderId, paymentId },
        paymentEntity?.error_description || 'payment failed at gateway'
      );

      await emitEvent({
        name: 'payment.failed',
        academyId: null,
        payload: {
          orderId: orderId ?? null,
          paymentId: paymentId ?? null,
          reason: paymentEntity?.error_description ?? null,
          method: paymentEntity?.method ?? null,
        },
        dedupeKey: paymentId ? `payment.failed:${paymentId}` : undefined,
      });

      return { event, handled: true };
    }

    /**
     * Refunds: recorded here so the ledger reflects reality. The proportional
     * split reversal itself is Phase 4 work — this records the fact and the
     * amount so nothing is lost in the meantime.
     */
    case 'refund.created':
    case 'refund.processed': {
      const paymentId: string | undefined = refundEntity?.payment_id;
      const refundedPaise: number = refundEntity?.amount ?? 0;
      if (!paymentId) return { event, handled: false, detail: 'no payment id' };

      const payment = await FeePayment.findOne({ paymentId });
      if (!payment) return { event, handled: false, detail: 'payment not found' };

      const alreadyRefunded = payment.refundedTotalPaise || 0;
      const totalRefunded = alreadyRefunded + refundedPaise;
      const capturedPaise = payment.parentTotalPaise ?? 0;

      payment.refundedTotalPaise = totalRefunded;
      payment.status =
        capturedPaise > 0 && totalRefunded >= capturedPaise ? 'refunded' : 'partially_refunded';
      await payment.save();

      return { event, handled: true, detail: `refunded ${totalRefunded} paise` };
    }

    case 'subscription.charged': {
      if (!subscriptionEntity || !paymentEntity) {
        return { event, handled: false, detail: 'incomplete payload' };
      }
      return handleSubscriptionCharged(subscriptionEntity, paymentEntity);
    }

    case 'subscription.authenticated':
      return updateSubscriptionStatus(event, subscriptionEntity, 'authenticated');
    case 'subscription.activated':
      return updateSubscriptionStatus(event, subscriptionEntity, 'active');
    case 'subscription.paused':
      return updateSubscriptionStatus(event, subscriptionEntity, 'paused');
    case 'subscription.halted':
      return updateSubscriptionStatus(event, subscriptionEntity, 'halted');
    case 'subscription.cancelled':
      return updateSubscriptionStatus(event, subscriptionEntity, 'cancelled');
    case 'subscription.completed':
      return updateSubscriptionStatus(event, subscriptionEntity, 'completed');

    default:
      // Razorpay sends many events we do not subscribe to semantically.
      // Acknowledge without pretending we acted on them.
      return { event, handled: false, detail: 'unhandled event type' };
  }
}

async function updateSubscriptionStatus(
  event: string,
  subscriptionEntity: any,
  status: string
): Promise<WebhookOutcome> {
  if (!subscriptionEntity?.id) {
    return { event, handled: false, detail: 'no subscription id' };
  }
  const updated = await Subscription.findOneAndUpdate(
    { razorpaySubscriptionId: subscriptionEntity.id },
    { status },
    { new: true }
  );
  return {
    event,
    handled: Boolean(updated),
    detail: updated ? `status → ${status}` : 'subscription not found',
  };
}

async function handleSubscriptionCharged(
  subscriptionEntity: any,
  paymentEntity: any
): Promise<WebhookOutcome> {
  const rzpSubId: string = subscriptionEntity.id;
  const sub = await Subscription.findOne({ razorpaySubscriptionId: rzpSubId });
  if (!sub) {
    return { event: 'subscription.charged', handled: false, detail: 'subscription not found' };
  }

  sub.status = 'active';
  if (subscriptionEntity.current_start) sub.currentStart = new Date(subscriptionEntity.current_start * 1000);
  if (subscriptionEntity.current_end) sub.currentEnd = new Date(subscriptionEntity.current_end * 1000);
  if (subscriptionEntity.charge_at) sub.nextBillingAt = new Date(subscriptionEntity.charge_at * 1000);
  await sub.save();

  const paymentId: string = paymentEntity.id;
  const capturedPaise: number = paymentEntity.amount;

  const existing = await FeePayment.findOne({ paymentId });
  if (existing) {
    return { event: 'subscription.charged', handled: true, detail: 'already recorded' };
  }

  const period = formatBillingPeriod(sub.currentStart, sub.currentEnd);

  /**
   * KNOWN GAP, FLAGGED RATHER THAN GUESSED: a subscription charge is recorded
   * with the full captured amount as the academy's portion and zero GWD margin,
   * because Razorpay Subscriptions charge a fixed plan amount that was never
   * grossed up through computeFeeSplit(). Splitting recurring revenue correctly
   * requires the plan amounts themselves to be created with the convenience fee
   * baked in — a Razorpay plan configuration decision, not something that can be
   * back-derived here without inventing numbers. Phase 4 addresses it.
   */
  await FeePayment.create({
    orderId: paymentId,
    paymentId,
    amount: capturedPaise / 100,
    baseAmount: capturedPaise / 100,
    platformFee: 0,
    gatewayFee: 0,
    parentTotalPaise: capturedPaise,
    academyAmountPaise: capturedPaise,
    gatewayFeePaise: 0,
    gwdNetPaise: 0,
    gatewayFeeActualPaise: typeof paymentEntity.fee === 'number' ? paymentEntity.fee : undefined,
    currency: paymentEntity.currency || 'INR',
    status: 'success',
    settledAt: new Date(),
    settlementStrategy: 'razorpay_subscription',
    transferStatus: 'not_applicable',
    studentId: sub.studentId,
    academyId: sub.academyId,
    description: `Subscription charge – ${sub.planType}`,
    period,
  });

  await emitEvent({
    name: 'payment.settled',
    academyId: sub.academyId,
    payload: {
      studentUserId: String(sub.studentId),
      paymentId,
      parentTotalPaise: capturedPaise,
      period,
      source: 'subscription',
    },
    dedupeKey: `payment.settled:${paymentId}`,
  });

  // Receipt email is best-effort; a failed email must not fail the webhook and
  // cause Razorpay to redeliver a charge we have already recorded.
  try {
    const student = await User.findById(sub.studentId).select('email name');
    if (student?.email) {
      const { sendPaymentReceiptEmail } = await import('@/lib/email');
      await sendPaymentReceiptEmail({
        to: student.email,
        name: student.name || 'Student',
        academyName: 'GWD Sports',
        amount: capturedPaise / 100,
        period,
        orderId: paymentId,
        date: new Date().toLocaleDateString('en-IN'),
      });
    }
  } catch (emailErr) {
    console.warn('[webhook] receipt email failed (non-fatal):', emailErr);
  }

  return { event: 'subscription.charged', handled: true, detail: 'recorded' };
}

function formatBillingPeriod(start?: Date, end?: Date): string {
  const fmt = (d?: Date) =>
    d ? d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '?';
  return `${fmt(start)} – ${fmt(end)}`;
}
