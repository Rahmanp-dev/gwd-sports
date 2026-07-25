import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import OutboundMessage from '@/lib/models/OutboundMessage';

/**
 * Interakt delivery-status callbacks. This is what makes per-message
 * sent/delivered/read/failed tracking real rather than aspirational.
 *
 * Configure in the Interakt dashboard as the webhook URL, and set
 * INTERAKT_WEBHOOK_SECRET to the same value you put in the `?token=` query
 * parameter there.
 *
 * AUTHENTICATION IS BY SHARED TOKEN, NOT HMAC. Interakt's webhook does not sign
 * its payloads, so there is no signature to verify — a shared secret in the URL
 * is the mechanism available. That means the URL itself is a credential: it must
 * not be logged, shared, or committed.
 */

/** Interakt status strings → our lifecycle. */
const STATUS_MAP: Record<string, 'sent' | 'delivered' | 'read' | 'failed'> = {
  sent: 'sent',
  delivered: 'delivered',
  read: 'read',
  failed: 'failed',
  undelivered: 'failed',
  rejected: 'failed',
};

/**
 * Delivery status only ever moves forward. Interakt can deliver callbacks out of
 * order, and a late-arriving "sent" must not overwrite a "read" we already have.
 */
const STATUS_RANK: Record<string, number> = {
  queued: 0,
  sending: 1,
  sent: 2,
  delivered: 3,
  read: 4,
  failed: 5,
};

export async function POST(req: NextRequest) {
  const expected = process.env.INTERAKT_WEBHOOK_SECRET;

  if (!expected) {
    console.error('[interakt-webhook] INTERAKT_WEBHOOK_SECRET is not set; rejecting callbacks.');
    return NextResponse.json(
      { success: false, message: 'Webhook secret not configured' },
      { status: 503 }
    );
  }

  const provided =
    req.nextUrl.searchParams.get('token') ??
    req.headers.get('x-interakt-token') ??
    '';

  if (!tokenMatches(provided, expected)) {
    console.warn('[interakt-webhook] rejected a callback with a bad token');
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
  }

  try {
    await connectToDatabase();

    // Interakt nests the interesting fields differently across event types, so
    // read defensively rather than assuming one shape.
    const providerMessageId: string | undefined =
      payload?.data?.message?.id ?? payload?.message_id ?? payload?.id;

    const rawStatus: string = String(
      payload?.data?.message?.message_status ?? payload?.status ?? ''
    ).toLowerCase();

    if (!providerMessageId) {
      // Interakt also posts inbound-message and template-approval events that
      // carry no message id. Acknowledge without pretending we handled them.
      return NextResponse.json({ success: true, handled: false, reason: 'no message id' });
    }

    const mapped = STATUS_MAP[rawStatus];
    if (!mapped) {
      return NextResponse.json({
        success: true,
        handled: false,
        reason: `unmapped status "${rawStatus}"`,
      });
    }

    const message = await OutboundMessage.findOne({ providerMessageId });
    if (!message) {
      // Could be a message sent before this system existed, or from another
      // environment sharing the BSP account.
      return NextResponse.json({ success: true, handled: false, reason: 'unknown message' });
    }

    // Never move status backwards.
    if ((STATUS_RANK[mapped] ?? 0) <= (STATUS_RANK[message.status] ?? 0)) {
      return NextResponse.json({
        success: true,
        handled: false,
        reason: `ignored out-of-order ${mapped} after ${message.status}`,
      });
    }

    const now = new Date();
    message.status = mapped;
    if (mapped === 'sent' && !message.sentAt) message.sentAt = now;
    if (mapped === 'delivered') message.deliveredAt = now;
    if (mapped === 'read') message.readAt = now;
    if (mapped === 'failed') {
      message.failedAt = now;
      message.error =
        payload?.data?.message?.failure_reason ??
        payload?.failure_reason ??
        'Provider reported delivery failure';
    }
    await message.save();

    return NextResponse.json({ success: true, handled: true, status: mapped });
  } catch (error: any) {
    console.error('[interakt-webhook]', error);
    // 500 so Interakt retries rather than silently losing the status update.
    return NextResponse.json({ success: false, message: 'Processing failed' }, { status: 500 });
  }
}

function tokenMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
