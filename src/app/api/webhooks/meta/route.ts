import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import OutboundMessage from '@/lib/models/OutboundMessage';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * META WHATSAPP CLOUD API — DELIVERY STATUS CALLBACKS
 * ════════════════════════════════════════════════════════════════════════════
 *
 * This replaces the Interakt webhook. The security model is genuinely better,
 * and the difference matters:
 *
 *   Interakt did not sign its payloads, so authentication was a shared token in
 *   the query string — which made the URL itself a credential that could leak
 *   through logs, referrers or a screenshot.
 *
 *   Meta signs every delivery with HMAC-SHA256 over the RAW request body using
 *   the app secret (`X-Hub-Signature-256`). We verify the payload, not the
 *   caller, so the URL is not sensitive and a replayed body cannot be forged.
 *
 * TWO METHODS, BOTH REQUIRED:
 *   GET  — one-time verification handshake when you save the callback URL in
 *          the Meta dashboard. Meta sends hub.verify_token and expects
 *          hub.challenge echoed back as plain text.
 *   POST — the actual status events.
 *
 * THE RAW BODY MATTERS. The signature is computed over the exact bytes Meta
 * sent, so this reads `req.text()` and parses afterwards. Calling `req.json()`
 * first and re-serialising produces a different byte string — different key
 * order, different whitespace — and every signature check fails.
 * ════════════════════════════════════════════════════════════════════════════
 */

/** Meta status strings → our lifecycle. */
const STATUS_MAP: Record<string, 'sent' | 'delivered' | 'read' | 'failed'> = {
  sent: 'sent',
  delivered: 'delivered',
  read: 'read',
  failed: 'failed',
};

/**
 * Delivery status only ever moves forward. Meta can deliver callbacks out of
 * order, and a late "sent" must not overwrite a "read" we already recorded.
 */
const STATUS_RANK: Record<string, number> = {
  queued: 0,
  sending: 1,
  sent: 2,
  delivered: 3,
  read: 4,
  failed: 5,
};

/**
 * Webhook verification handshake. Meta calls this once, when you click "Verify
 * and save" on the callback URL, and expects the challenge back as plain text —
 * not JSON. Returning JSON here is the usual reason setup fails.
 */
export async function GET(req: NextRequest) {
  const expected = process.env.META_WHATSAPP_VERIFY_TOKEN;
  if (!expected) {
    console.error('[meta-webhook] META_WHATSAPP_VERIFY_TOKEN is not set.');
    return new NextResponse('Not configured', { status: 503 });
  }

  const params = req.nextUrl.searchParams;
  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');

  if (mode === 'subscribe' && token && safeEqual(token, expected)) {
    return new NextResponse(challenge ?? '', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  console.warn('[meta-webhook] verification rejected: bad mode or token');
  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(req: NextRequest) {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error('[meta-webhook] META_APP_SECRET is not set; rejecting callbacks.');
    return NextResponse.json(
      { success: false, message: 'Webhook secret not configured' },
      { status: 503 }
    );
  }

  // Raw bytes, before any parsing. See the header.
  const rawBody = await req.text();

  const signature = req.headers.get('x-hub-signature-256') ?? '';
  if (!verifySignature(rawBody, signature, appSecret)) {
    console.warn('[meta-webhook] rejected a callback with a bad signature');
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
  }

  try {
    await connectToDatabase();

    /**
     * Meta batches events: entry[] → changes[] → value.statuses[]. A single
     * delivery can carry several statuses for several messages, so all of them
     * are processed rather than just the first.
     */
    const statuses: any[] = [];
    for (const entry of payload?.entry ?? []) {
      for (const change of entry?.changes ?? []) {
        for (const status of change?.value?.statuses ?? []) {
          statuses.push(status);
        }
      }
    }

    if (statuses.length === 0) {
      // Inbound messages and template-approval events also land here and carry
      // no statuses. Acknowledge without pretending we handled them.
      return NextResponse.json({ success: true, handled: 0, reason: 'no status events' });
    }

    let handled = 0;

    for (const status of statuses) {
      const providerMessageId: string | undefined = status?.id;
      const mapped = STATUS_MAP[String(status?.status ?? '').toLowerCase()];
      if (!providerMessageId || !mapped) continue;

      const message = await OutboundMessage.findOne({ providerMessageId });
      // Could be from another environment sharing the same WhatsApp number.
      if (!message) continue;

      if ((STATUS_RANK[mapped] ?? 0) <= (STATUS_RANK[message.status] ?? 0)) continue;

      const now = new Date();
      message.status = mapped;
      if (mapped === 'sent' && !message.sentAt) message.sentAt = now;
      if (mapped === 'delivered') message.deliveredAt = now;
      if (mapped === 'read') message.readAt = now;
      if (mapped === 'failed') {
        message.failedAt = now;
        const err = status?.errors?.[0];
        message.error = err
          ? `${err.code ?? ''} ${err.title ?? ''} ${err.error_data?.details ?? ''}`.trim()
          : 'Provider reported delivery failure';
      }
      await message.save();
      handled++;
    }

    return NextResponse.json({ success: true, handled });
  } catch (error: any) {
    console.error('[meta-webhook]', error);
    // 500 so Meta retries rather than silently losing the status update.
    return NextResponse.json({ success: false, message: 'Processing failed' }, { status: 500 });
  }
}

function verifySignature(rawBody: string, header: string, appSecret: string): boolean {
  if (!header.startsWith('sha256=')) return false;
  const expected = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody, 'utf8')
    .digest('hex');
  return safeEqual(header.slice('sha256='.length), expected);
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
