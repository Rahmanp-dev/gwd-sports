import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';
import Batch from '@/lib/models/Batch';
import Academy from '@/lib/models/Academy';
import { recordAttendance } from '@/lib/attendance/record';
import { evaluateAndAward } from '@/lib/performance/award';
import {
  resolveSession,
  isScheduledDay,
  sessionDateKey,
  coachMarkInstant,
} from '@/lib/attendance/session';

/**
 * The coach's one-click register.
 *
 * GET returns tonight's roster with whatever has already been marked — by an
 * earlier save, or by a parent's QR scan at the gate — already filled in. That
 * pre-fill is the whole point of the dual-mode design: by the time the coach
 * opens this, the parents who scanned are already ticked, and the coach is
 * confirming a list rather than building one.
 *
 * POST takes the whole roster in one request. Not one request per child: a
 * coach on academy wifi with twenty students would fire twenty requests, and a
 * partial failure halfway through leaves a register that is neither marked nor
 * unmarked, with no way to tell which.
 */

/** A defensive ceiling. No real batch has this many children in it. */
const MAX_MARKS_PER_REQUEST = 300;

/** Loads the batch, enforcing tenant isolation and coach assignment. */
async function loadBatch(auth: any, batchId: string) {
  if (!batchId || !mongoose.Types.ObjectId.isValid(batchId)) {
    return { error: 'A valid batchId is required', status: 400 as const };
  }

  const filter: Record<string, unknown> = { _id: batchId };
  if (auth.user.role !== 'gwd_super_admin') {
    if (!auth.academyId) {
      return { error: 'No academy assigned to your account', status: 403 as const };
    }
    filter.academyId = auth.academyId;
  }

  const batch = await Batch.findOne(filter).lean();
  if (!batch) {
    // Indistinguishable from "does not exist", so this cannot be used to probe
    // which batches belong to other academies.
    return { error: 'Batch not found', status: 404 as const };
  }

  /**
   * A trainer may only mark the batches they coach. An admin may mark any batch
   * in their own academy — they cover for absent coaches, and blocking that
   * would mean the register goes unmarked on exactly the evenings it matters.
   */
  if (auth.user.role === 'trainer') {
    const coaches = ((batch as any).coaches ?? []).map((id: any) => String(id));
    if (!coaches.includes(String(auth.user._id))) {
      return { error: 'You are not assigned to this batch', status: 403 as const };
    }
  }

  return { batch };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await roleMiddleware(req, ['trainer', 'admin']);
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

    const dateParam = searchParams.get('date');
    const at = dateParam ? coachMarkInstant(dateParam) : new Date();
    if (!at) {
      return NextResponse.json(
        { success: false, message: 'date must be YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const session = resolveSession(
      {
        id: String(batch._id),
        daysOfWeek: batch.daysOfWeek,
        startTime: batch.startTime,
        endTime: batch.endTime,
      },
      at
    );

    const students = await StudentProfile.find({ batchId: batch._id, isActive: true })
      .select('userId passportId attendance parentPhoneE164')
      .populate('userId', 'name')
      .lean();

    const roster = (students as any[])
      .map((student) => {
        const marked = (student.attendance ?? []).find(
          (row: any) =>
            row.sessionId === session.sessionId ||
            (!row.sessionId && sessionDateKey(new Date(row.date)) === session.date)
        );

        return {
          studentUserId: String(student.userId?._id ?? student.userId),
          studentProfileId: String(student._id),
          name: student.userId?.name ?? 'Unnamed student',
          passportId: student.passportId ?? null,
          hasParentPhone: Boolean(student.parentPhoneE164),
          marked: marked
            ? {
                present: marked.present,
                source: marked.source ?? 'coach',
                checkedInAt: marked.checkedInAt ?? null,
              }
            : null,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      success: true,
      data: {
        batch: {
          _id: String(batch._id),
          name: batch.name,
          sport: batch.sport,
          startTime: batch.startTime ?? null,
          endTime: batch.endTime ?? null,
          daysOfWeek: batch.daysOfWeek ?? [],
        },
        session: {
          sessionId: session.sessionId,
          date: session.date,
          weekday: session.weekday,
          // Surfaced rather than enforced: a coach running a one-off extra
          // practice on an unscheduled day should be able to mark it. The UI
          // notes it; nothing blocks it.
          isScheduledDay: isScheduledDay(
            { id: String(batch._id), daysOfWeek: batch.daysOfWeek },
            session
          ),
        },
        roster,
        counts: {
          total: roster.length,
          marked: roster.filter((r) => r.marked).length,
          present: roster.filter((r) => r.marked?.present).length,
          selfCheckedIn: roster.filter((r) => r.marked?.source === 'self_qr').length,
        },
      },
    });
  } catch (error: any) {
    console.error('[trainer/batch-attendance GET]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await roleMiddleware(req, ['trainer', 'admin']);
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

    const at = payload?.date ? coachMarkInstant(String(payload.date)) : new Date();
    if (!at) {
      return NextResponse.json(
        { success: false, message: 'date must be YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const marks = Array.isArray(payload?.marks) ? payload.marks : null;
    if (!marks || marks.length === 0) {
      return NextResponse.json(
        { success: false, message: 'marks must be a non-empty array' },
        { status: 400 }
      );
    }
    if (marks.length > MAX_MARKS_PER_REQUEST) {
      return NextResponse.json(
        { success: false, message: `At most ${MAX_MARKS_PER_REQUEST} students per request` },
        { status: 400 }
      );
    }

    const session = resolveSession(
      {
        id: String(batch._id),
        daysOfWeek: batch.daysOfWeek,
        startTime: batch.startTime,
        endTime: batch.endTime,
      },
      at
    );

    const academy = await Academy.findById(batch.academyId).select('name').lean();
    const academyName = (academy as any)?.name ?? 'your academy';

    const ids = marks
      .map((mark: any) => mark?.studentUserId)
      .filter((id: any) => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id));

    // Scoped to THIS batch, so a mark for a student in another batch — or
    // another academy — silently resolves to nothing rather than being written.
    const students = await StudentProfile.find({
      batchId: batch._id,
      userId: { $in: ids },
    }).populate('userId', 'name');

    const byUserId = new Map(
      students.map((student: any) => [String(student.userId?._id ?? student.userId), student])
    );

    let updated = 0;
    let notified = 0;
    const skipped: { studentUserId: string; reason: string }[] = [];

    for (const mark of marks) {
      const studentUserId = String(mark?.studentUserId ?? '');
      const student = byUserId.get(studentUserId);
      if (!student) {
        skipped.push({ studentUserId, reason: 'Not a student in this batch' });
        continue;
      }

      const result = await recordAttendance({
        target: {
          profile: student,
          studentName: (student.userId as any)?.name ?? 'your child',
          academyName,
        },
        session,
        date: at,
        present: Boolean(mark?.present),
        source: 'coach',
        markedBy: auth.user._id,
        remarks: mark?.remarks ?? null,
      });

      if (result.status === 'refused') {
        skipped.push({ studentUserId, reason: result.reason });
        continue;
      }

      await student.save();
      updated++;
      if (result.eventEmitted) notified++;

      // A mark can cross a session or streak milestone. Failure here must never
      // fail the register — the attendance is already saved, and a missed badge
      // is picked up on the next session.
      if (student.passportId) {
        try {
          await evaluateAndAward({ passportId: student.passportId });
        } catch (err: any) {
          console.error('[batch-attendance] achievement evaluation failed:', err?.message || err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        date: session.date,
        updated,
        // "Notified" counts events emitted, not messages delivered. A parent
        // with no phone number, or one already at their daily cap, still shows
        // as marked here — the message log is where delivery is answered.
        parentsNotified: notified,
        skipped,
      },
    });
  } catch (error: any) {
    console.error('[trainer/batch-attendance POST]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
