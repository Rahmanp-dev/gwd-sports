import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import Batch from '@/lib/models/Batch';

/**
 * The printed QR code for a batch.
 *
 * ONE CODE PER BATCH, NOT ONE PER STUDENT. A per-student code would have to be
 * distributed to sixty parents and reprinted whenever a child joined; a batch
 * code is printed once and taped to the wall. The student's identity comes from
 * their login on the check-in page, not from the code — the code only says
 * "which batch, which session".
 *
 * ROTATION IS THE SECURITY MODEL. The code is on a wall, so it WILL be
 * photographed. That is its lifecycle, not a breach. Two things contain it:
 * the check-in window (a photograph does nothing at 3am or on a rest day — see
 * lib/attendance/session.ts), and rotation, which lets an owner invalidate a
 * leaked code by reprinting rather than by rebuilding the roster.
 */

/** 32 hex chars from a CSPRNG. Not guessable, and short enough to print small. */
function generateToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

function checkInUrl(token: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gwd.in';
  return `${appUrl}/check-in/${token}`;
}

/** Loads a batch inside the caller's tenant. */
async function loadBatch(auth: any, batchId: string) {
  if (!batchId || !mongoose.Types.ObjectId.isValid(batchId)) {
    return { error: 'A valid batchId is required', status: 400 as const };
  }
  const filter: Record<string, unknown> = { _id: batchId };
  if (auth.user.role !== 'gwd_super_admin') {
    if (!auth.academyId) {
      return { error: 'Your account is not linked to an academy.', status: 403 as const };
    }
    filter.academyId = auth.academyId;
  }
  const batch = await Batch.findOne(filter);
  if (!batch) return { error: 'Batch not found', status: 404 as const };
  return { batch };
}

/**
 * The code for a batch, minting one on first use.
 *
 * Lazily created rather than generated for every batch at creation time,
 * because most batches are made by the bulk import and never have a code
 * printed for them.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const loaded = await loadBatch(auth, searchParams.get('batchId') ?? '');
    if ('error' in loaded) {
      return NextResponse.json({ success: false, message: loaded.error }, { status: loaded.status });
    }
    const batch = loaded.batch as any;

    if (!batch.qrToken) {
      batch.qrToken = generateToken();
      await batch.save();
    }

    return NextResponse.json({
      success: true,
      data: {
        batchId: String(batch._id),
        batchName: batch.name,
        sport: batch.sport,
        daysOfWeek: batch.daysOfWeek ?? [],
        startTime: batch.startTime ?? null,
        endTime: batch.endTime ?? null,
        token: batch.qrToken,
        checkInUrl: checkInUrl(batch.qrToken),
      },
    });
  } catch (error: any) {
    console.error('[academy/batches/qr GET]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

/**
 * Rotate the code. The old one stops working immediately.
 *
 * Deliberately destructive and deliberately not undoable: the reason to rotate
 * is that the previous code is out in the world, and an "undo" that brings it
 * back is not a feature. The owner must reprint.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const payload = await req.json().catch(() => ({}));
    const loaded = await loadBatch(auth, payload?.batchId ?? '');
    if ('error' in loaded) {
      return NextResponse.json({ success: false, message: loaded.error }, { status: loaded.status });
    }
    const batch = loaded.batch as any;

    batch.qrToken = generateToken();
    await batch.save();

    return NextResponse.json({
      success: true,
      data: {
        batchId: String(batch._id),
        token: batch.qrToken,
        checkInUrl: checkInUrl(batch.qrToken),
        note: 'The previous code stopped working the moment this was generated. Reprint and replace the one on the wall.',
      },
    });
  } catch (error: any) {
    console.error('[academy/batches/qr POST]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
