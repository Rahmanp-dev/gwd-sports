import { NextRequest } from 'next/server';
import { handleRazorpayWebhookRequest } from '@/lib/payments/webhookRoute';

/**
 * Legacy webhook path, kept because this URL is already registered in the
 * Razorpay dashboard (deploy note #2 in SYSTEM_ARCHITECTURE.md). It now
 * delegates to the same unified handler as /api/payments/webhook, so it handles
 * payment.* and refund.* events too rather than only subscription.*.
 *
 * Safe to repoint the dashboard at /api/payments/webhook and retire this path;
 * both behave identically. The subscription handling itself now lives in
 * src/lib/payments/webhook.ts.
 */
export async function POST(req: NextRequest) {
  return handleRazorpayWebhookRequest(req);
}
