import { NextRequest } from 'next/server';
import { handleRazorpayWebhookRequest } from '@/lib/payments/webhookRoute';

/**
 * Unified Razorpay webhook endpoint. Configure THIS url in the Razorpay
 * dashboard and subscribe to, at minimum:
 *
 *   payment.captured        settles a one-time fee payment server-side
 *   payment.failed          marks the attempt failed
 *   order.paid              belt-and-braces alongside payment.captured
 *   refund.created          records refunds against the original payment
 *   refund.processed
 *   subscription.charged    records a recurring charge
 *   subscription.activated / .authenticated / .halted / .cancelled
 *   subscription.paused / .completed
 */
export async function POST(req: NextRequest) {
  return handleRazorpayWebhookRequest(req);
}
