import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import { validateRecord, toPublicRecords } from '@/lib/passport/records';
import { resolvePassportForActor, canMutate } from '@/lib/passport/recordAccess';

/**
 * Passport records for one student — list and create.
 *
 * Authorisation is entirely delegated to resolvePassportForActor(); read its
 * header before changing anything here. The short version: a coach reaches a
 * Passport only through a StudentProfile scoped to their own academy, never by
 * passing a passportId directly.
 */

/** GET /api/trainer/passport-records?studentId=<userId> */
export async function GET(req: NextRequest) {
  try {
    const auth = await roleMiddleware(req, ['trainer', 'admin']);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const studentId = new URL(req.url).searchParams.get('studentId') ?? '';
    const actor = { userId: auth.user._id, role: auth.user.role, academyId: auth.academyId };

    const resolved = await resolvePassportForActor(studentId, actor);
    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, message: resolved.message },
        { status: resolved.status }
      );
    }

    const rows = (resolved.passport.records ?? []).map((r: any) =>
      typeof r.toObject === 'function' ? r.toObject() : r
    );

    /**
     * The coach's list is the public projection plus one extra flag per row:
     * whether THIS caller may edit it. Computing it here rather than in the
     * browser means the UI cannot get it wrong, and the button simply does not
     * render for another academy's entries.
     */
    const editable = new Set(
      rows
        .filter((r: any) => canMutate(r, actor, resolved.academyId))
        .map((r: any) => String(r._id))
    );

    const records = toPublicRecords(rows).map((record) => ({
      ...record,
      canEdit: editable.has(record.id),
    }));

    return NextResponse.json({
      success: true,
      data: { passportId: resolved.passport.passportId, records },
    });
  } catch (error: any) {
    console.error('[trainer/passport-records GET]', error?.message || error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

/** POST /api/trainer/passport-records  { studentId, ...record } */
export async function POST(req: NextRequest) {
  try {
    const auth = await roleMiddleware(req, ['trainer', 'admin']);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const body = await req.json().catch(() => ({}));
    const actor = { userId: auth.user._id, role: auth.user.role, academyId: auth.academyId };

    const resolved = await resolvePassportForActor(String(body.studentId ?? ''), actor);
    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, message: resolved.message },
        { status: resolved.status }
      );
    }

    const validated = validateRecord(body);
    if (!validated.ok) {
      // The field name is returned so the form can mark the offending input
      // rather than showing a general failure the coach has to hunt through.
      return NextResponse.json(
        { success: false, message: validated.reason, field: validated.field },
        { status: 400 }
      );
    }

    resolved.passport.records.push({
      ...validated.record,
      academyId: resolved.academyId,
      academyName: resolved.academyName,
      recordedBy: actor.userId,
      recordedAt: new Date(),
      updatedAt: null,
    } as any);

    await resolved.passport.save();

    const rows = resolved.passport.records.map((r: any) =>
      typeof r.toObject === 'function' ? r.toObject() : r
    );

    return NextResponse.json({
      success: true,
      message: 'Added to the Sports Passport.',
      data: {
        records: toPublicRecords(rows).map((record) => ({ ...record, canEdit: true })),
      },
    });
  } catch (error: any) {
    console.error('[trainer/passport-records POST]', error?.message || error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
