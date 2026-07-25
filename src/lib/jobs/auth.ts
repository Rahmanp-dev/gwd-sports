import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Authenticates a cron/worker request.
 *
 * These endpoints send WhatsApp messages to real parents and cost real money, so
 * they must not be publicly callable. An unprotected /api/jobs/send-messages is
 * a way for anyone to burn your BSP quota and spam your customers.
 *
 * Accepts either:
 *   Authorization: Bearer <CRON_SECRET>   — external cron, Railway, GitHub Actions
 *   x-vercel-cron: 1                      — Vercel Cron, which cannot set headers
 *
 * NOTE ON VERCEL CRON: Vercel does not let you attach a custom Authorization
 * header to a cron invocation, and its `x-vercel-cron` header is only trustworthy
 * because Vercel strips client-supplied copies of it at the edge. If this app is
 * ever fronted by a different proxy, that header stops being proof of anything —
 * use the bearer secret instead.
 */
export type JobAuthResult = { ok: true } | { ok: false; response: NextResponse };

export function authorizeJobRequest(req: NextRequest): JobAuthResult {
  const secret = process.env.CRON_SECRET;

  // Vercel's own cron invocation.
  if (req.headers.get('x-vercel-cron') === '1') {
    return { ok: true };
  }

  if (!secret) {
    console.error(
      '[jobs] CRON_SECRET is not set. Refusing to run scheduled work, because the ' +
        'endpoint would be callable by anyone.'
    );
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, message: 'CRON_SECRET is not configured on this deployment' },
        { status: 503 }
      ),
    };
  }

  const header = req.headers.get('authorization') ?? '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!provided || !timingSafeEqual(provided, secret)) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { ok: true };
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
