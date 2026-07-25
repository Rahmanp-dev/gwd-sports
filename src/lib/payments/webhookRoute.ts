import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, handleWebhookEvent } from './webhook';

/**
 * Shared Razorpay webhook request handler.
 *
 * Mounted at two paths: /api/payments/webhook (the one to configure going
 * forward, it handles every event type) and /api/payments/subscription/webhook
 * (kept alive because that URL is already registered in the Razorpay dashboard —
 * changing it there is a manual step and payments must not break in between).
 *
 * STATUS CODE POLICY — deliberate, and different from the previous handler:
 *
 *   200  processed, or a recognised event we intentionally ignore
 *   401  bad or missing signature — do not pretend this succeeded
 *   503  RAZORPAY_WEBHOOK_SECRET is not configured on this deployment
 *   500  processing failed — Razorpay SHOULD retry
 *
 * The old handler answered 200 to everything including signature failures and
 * internal errors. That made a missing webhook secret invisible (the dashboard
 * showed 100% delivery success while every event was being dropped) and turned
 * transient database errors into permanently lost payments. A retry storm is a
 * far cheaper failure than a lost payment.
 */
export async function handleRazorpayWebhookRequest(req: NextRequest): Promise<NextResponse> {
  // Raw body, unparsed — the HMAC is over exact bytes.
  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature');

  const check = verifyWebhookSignature(rawBody, signature);
  if (!check.ok) {
    if (check.reason === 'not_configured') {
      console.error(
        '[webhook] RAZORPAY_WEBHOOK_SECRET is not set. Every Razorpay webhook is ' +
          'being rejected, which means captured payments are not being settled ' +
          'server-side. Set it in the deployment environment.'
      );
      return NextResponse.json(
        { success: false, message: 'Webhook secret not configured' },
        { status: 503 }
      );
    }
    console.warn(`[webhook] signature rejected: ${check.reason}`);
    return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    // Malformed body will never become valid on retry — acknowledge it.
    console.error('[webhook] signature valid but body is not JSON');
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 200 });
  }

  try {
    const outcome = await handleWebhookEvent(payload);
    console.log(
      `[webhook] ${outcome.event}: ${outcome.handled ? 'handled' : 'not handled'}` +
        (outcome.detail ? ` (${outcome.detail})` : '')
    );
    return NextResponse.json({ success: true, ...outcome }, { status: 200 });
  } catch (err: any) {
    console.error(`[webhook] processing failed for ${payload?.event}:`, err?.message || err);
    // 500 so Razorpay redelivers. Settlement is idempotent, so a redelivery of
    // an event that partially succeeded is safe.
    return NextResponse.json(
      { success: false, message: 'Processing failed, retry expected' },
      { status: 500 }
    );
  }
}
