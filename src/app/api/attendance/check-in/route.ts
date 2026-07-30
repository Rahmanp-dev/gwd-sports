import { NextRequest, NextResponse } from 'next/server';
import { ACTIVE } from '@/lib/models/activeFilter';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import Batch from '@/lib/models/Batch';
import Academy from '@/lib/models/Academy';
import StudentProfile from '@/lib/models/Student';
import { ensureRoleProfile } from '@/lib/auth/ensureRoleProfile';
import { recordAttendance } from '@/lib/attendance/record';
import { resolveSession, validateCheckIn } from '@/lib/attendance/session';
import {
  evaluateGeofence,
  normaliseRadius,
  resolveGeofenceCentre,
} from '@/lib/attendance/geofence';

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

  const batch = await Batch.findOne({ qrToken: token, isActive: ACTIVE }).lean();
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
   *
   * Self-heal first: an account with `role: 'student'` but no StudentProfile
   * row was rejected here with "sign in as your child", which is actively
   * misleading — they WERE signed in as the student. Accounts created through
   * the admin Users tab had no profile row for exactly this reason. Building
   * it here matches what the profile routes already do.
   */
  if (auth.user.role === 'student') {
    await ensureRoleProfile({
      userId: auth.user._id,
      role: 'student',
      academyId: auth.academyId ?? null,
    });
  }

  const profile = await StudentProfile.findOne({
    userId: auth.user._id,
    isActive: ACTIVE,
  }).populate('userId', 'name');

  if (!profile) {
    /**
     * Distinguish the two cases. Telling a coach or an admin to "sign in as
     * your child" when they are simply on the wrong account type is fine;
     * telling a student the same thing when their record is missing sends them
     * chasing a login they already have.
     */
    return {
      error:
        auth.user.role === 'student'
          ? 'Your student record could not be found. Ask your academy to check your enrolment.'
          : 'Only a student account can check in. Please sign in as your child.',
      status: 403 as const,
    };
  }

  /**
   * Batch membership, with an academy-level fallback.
   *
   * Requiring an exact `batchId` match meant any student not yet assigned to a
   * batch — which is every student until an admin does it — was refused at the
   * gate while physically standing in front of the correct code. That reads as
   * the feature being broken.
   *
   * So: an exact batch match passes, and otherwise a student of the SAME
   * ACADEMY as the batch passes too. The security property that matters is
   * preserved — a stranger, or a student from another academy, still cannot
   * check in on a photographed code, because the account is the identity and
   * the tenant must match.
   */
  const sameBatch = String(profile.batchId ?? '') === String((batch as any)._id);
  const sameAcademy =
    Boolean(profile.academyId) &&
    String(profile.academyId) === String((batch as any).academyId ?? '');

  if (!sameBatch && !sameAcademy) {
    return {
      error: 'You are not in this batch. Check you have scanned the right code.',
      status: 403 as const,
    };
  }

  /**
   * Loaded here rather than only in POST so GET can tell the page whether a
   * location will be required — the page needs that BEFORE the parent presses
   * the button, or the permission prompt appears at the worst possible moment
   * and the first tap always fails. Also saves POST a second round trip for
   * the academy name.
   */
  const academy = await Academy.findById(profile.academyId)
    .select('name coordinates attendanceGeofence')
    .lean();

  return { auth, batch: batch as any, profile, academy: academy as any };
}

/** The geofence config for an academy, with the centre already resolved. */
function geofenceFor(academy: any) {
  const cfg = academy?.attendanceGeofence ?? {};
  const centre = resolveGeofenceCentre(
    cfg.lat !== undefined && cfg.lng !== undefined ? { lat: cfg.lat, lng: cfg.lng } : null,
    academy?.coordinates ?? null,
  );
  return {
    enabled: Boolean(cfg.enabled),
    radiusMeters: normaliseRadius(cfg.radiusMeters),
    centre,
  };
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
    const geofence = geofenceFor(ctx.academy);

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
        /**
         * Whether the page must obtain a location before POSTing.
         *
         * `enabled && centre` rather than just `enabled`: with the fence on but
         * no ground set, the server fails open (see evaluateGeofence), so
         * demanding a location the parent's answer cannot affect would be a
         * pointless permission prompt.
         */
        locationRequired: Boolean(geofence.enabled && geofence.centre),
        geofenceRadiusMeters: geofence.centre ? geofence.radiusMeters : null,
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

    /**
     * The geofence, checked AFTER the session window.
     *
     * Order matters for the message the parent reads: "training isn't on right
     * now" is more useful than "you're not at the ground" when both are true,
     * and asking for location permission to then reject on time would be a
     * prompt for nothing.
     *
     * The coordinates are client-supplied and therefore spoofable — see the
     * header of lib/attendance/geofence.ts. This is a deterrent, not proof;
     * the coach's own register remains the authoritative path.
     */
    const geofence = geofenceFor(ctx.academy);
    const location = payload?.location;
    const geoVerdict = evaluateGeofence(
      geofence,
      location
        ? {
            lat: Number(location.lat),
            lng: Number(location.lng),
            accuracy: location.accuracy === undefined ? null : Number(location.accuracy),
          }
        : null,
    );

    if (!geoVerdict.ok) {
      return NextResponse.json(
        {
          success: false,
          message: geoVerdict.reason,
          code: geoVerdict.code,
          data: {
            distanceMeters: geoVerdict.distanceMeters ?? null,
            allowedMeters: geoVerdict.allowedMeters ?? null,
          },
        },
        { status: 403 },
      );
    }

    const result = await recordAttendance({
      target: {
        profile: ctx.profile,
        studentName: (ctx.profile.userId as any)?.name ?? 'your child',
        academyName: ctx.academy?.name ?? 'your academy',
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
