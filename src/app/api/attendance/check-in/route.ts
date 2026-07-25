import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import Batch from '@/lib/models/Batch';
import Academy from '@/lib/models/Academy';
import StudentProfile from '@/lib/models/Student';
import { recordAttendance } from '@/lib/attendance/record';
import { resolveSession, validateCheckIn } from '@/lib/attendance/session';

/**
 * Parent QR self-check-in.
 *
 * The parent scans the code taped to the wall, which opens /check-in/<token>.
 * The page requires them to be logged in, and THAT is what identifies the
 * child — never the token. The token only answers "which batch". A token that
 * carried student identity would mean one photographed code could check in
 * anybody.
 *
 * Three things have to be true for a scan to count, and each rejects for a
 * different reason the parent can act on:
 *
 *   1. The token resolves to a real, active batch.
 *   2. The scan falls inside the window around a scheduled session — this is
 *      what makes a photographed code useless at 3am. See session.ts.
 *   3. The logged-in student is actually in that batch. Otherwise a parent at
 *      the same academy could check in from any batch's code.
 *
 * GET is a preview: it resolves the batch and the window WITHOUT recording
 * anything, so the page can say "you're about to check Rohan into Evening
 * Cricket" before the parent commits. POST records.
 */

async function resolveContext(req: NextRequest, token: string) {
  const auth = await authMiddleware(req);
  if (auth?.error) return { error: auth.error, status: auth.status };

  if (!token || !/^[a-f0-9]{32}$/i.test(token)) {
    return { error: 'This check-in code is not valid.', status: 400 as const };
  }

  const batch = await Batch.findOne({ qrToken: token, isActive: true }).lean();
  if (!batch) {
    // Also the path a ROTATED code takes. Said plainly, because the parent's
    // next move is to look for the new printed code rather than to retry.
    return {
      error: 'This check-in code is no longer active. Ask your coach for the current one.',
      status: 404 as const,
    };
  }

  /**
   * The student is whoever is logged in. A parent logged in as themselves
   * cannot check anyone in — the account IS the identity, so there is nothing
   * to spoof in the request body.
   */
  const profile = await StudentProfile.findOne({
    userId: auth.user._id,
    isActive: true,
  }).populate('userId', 'name');

  if (!profile) {
    return {
      error: 'Only a student account can check in. Please sign in as your child.',
      status: 403 as const,
    };
  }

  if (String(profile.batchId ?? '') !== String((batch as any)._id)) {
    return {
      error: 'You are not in this batch. Check you have scanned the right code.',
      status: 403 as const,
    };
  }

  return { auth, batch: batch as any, profile };
}

function sessionBatch(batch: any) {
  return {
    id: String(batch._id),
    daysOfWeek: batch.daysOfWeek,
    startTime: batch.startTime,
    endTime: batch.endTime,
  };
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const ctx = await resolveContext(req, searchParams.get('token') ?? '');
    if ('error' in ctx) {
      return NextResponse.json({ success: false, message: ctx.error }, { status: ctx.status });
    }

    const now = new Date();
    const verdict = validateCheckIn(sessionBatch(ctx.batch), now);
    const session = resolveSession(sessionBatch(ctx.batch), now);

    const already = (ctx.profile.attendance ?? []).find(
      (row: any) => row.sessionId === session.sessionId
    );

    return NextResponse.json({
      success: true,
      data: {
        studentName: (ctx.profile.userId as any)?.name ?? 'Student',
        batchName: ctx.batch.name,
        sport: ctx.batch.sport,
        session: { sessionId: session.sessionId, date: session.date, weekday: session.weekday },
        canCheckIn: verdict.ok && !already,
        // Present even when canCheckIn is true, so the page can show the window
        // rather than only complaining once it has closed.
        opensAt: session.opensAt.toISOString(),
        closesAt: session.closesAt.toISOString(),
        reason: verdict.ok ? null : verdict.reason,
        alreadyCheckedIn: already
          ? { present: already.present, source: already.source ?? 'coach' }
          : null,
      },
    });
  } catch (error: any) {
    console.error('[attendance/check-in GET]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const payload = await req.json().catch(() => ({}));
    const ctx = await resolveContext(req, payload?.token ?? '');
    if ('error' in ctx) {
      return NextResponse.json({ success: false, message: ctx.error }, { status: ctx.status });
    }

    const now = new Date();
    const verdict = validateCheckIn(sessionBatch(ctx.batch), now);
    if (!verdict.ok) {
      return NextResponse.json(
        { success: false, message: verdict.reason, code: verdict.code },
        { status: 409 }
      );
    }

    const academy = await Academy.findById(ctx.profile.academyId).select('name').lean();

    const result = await recordAttendance({
      target: {
        profile: ctx.profile,
        studentName: (ctx.profile.userId as any)?.name ?? 'your child',
        academyName: (academy as any)?.name ?? 'your academy',
      },
      session: verdict.session,
      date: now,
      present: true,
      source: 'self_qr',
      // The student's own account, because that is literally who acted. The
      // `source` field is what tells this apart from a coach's mark.
      markedBy: ctx.profile.userId?._id ?? ctx.profile.userId,
      checkedInAt: now,
    });

    if (result.status === 'refused') {
      return NextResponse.json({ success: false, message: result.reason }, { status: 409 });
    }

    await ctx.profile.save();

    return NextResponse.json({
      success: true,
      data: {
        studentName: (ctx.profile.userId as any)?.name ?? 'Student',
        batchName: ctx.batch.name,
        sessionId: result.sessionId,
        checkedInAt: now.toISOString(),
        // False when this session already produced an event — a second scan is
        // harmless and must not read as a failure.
        parentNotified: result.eventEmitted,
      },
    });
  } catch (error: any) {
    console.error('[attendance/check-in POST]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
