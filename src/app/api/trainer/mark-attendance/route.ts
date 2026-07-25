import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';
import Batch from '@/lib/models/Batch';
import Academy from '@/lib/models/Academy';
import mongoose from 'mongoose';
import { recordAttendance } from '@/lib/attendance/record';
import { resolveSession, coachMarkInstant } from '@/lib/attendance/session';

/**
 * Mark one student's attendance for one day.
 *
 * Phase 3 changed the inside of this route without changing its contract. It
 * previously mutated the attendance array directly and told nobody; it now goes
 * through the shared recorder, which means it emits `attendance.created`. That
 * event has had a consumer waiting for it since Phase 2 — the attendance
 * confirmation message to the parent — which until now was listening to
 * silence.
 *
 * The batch is resolved from the student's own `batchId` when they have one, so
 * a single mark lands on the same dated session the coach's checklist and the
 * parent's QR scan would produce, and the three cannot double-message.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await roleMiddleware(req, ['trainer', 'admin']);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const trainerId = auth.user._id;
    const { studentId, date, present, remarks } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json({ success: false, message: 'Invalid student ID' }, { status: 400 });
    }

    /**
     * TENANT ISOLATION: scope the lookup to the caller's academy.
     *
     * This previously looked up the profile by userId alone, so a coach at
     * academy A could mark attendance for a student at academy B just by
     * supplying their id — a cross-tenant write. Super admins are exempt.
     */
    const studentFilter: Record<string, unknown> = { userId: studentId };
    if (auth.user.role !== 'gwd_super_admin') {
      if (!auth.academyId) {
        return NextResponse.json(
          { success: false, message: 'No academy assigned to your account' },
          { status: 403 }
        );
      }
      studentFilter.academyId = auth.academyId;
    }

    const student = await StudentProfile.findOne(studentFilter).populate('userId', 'name');
    if (!student) {
      // Deliberately indistinguishable from "does not exist" so this cannot be
      // used to probe which students belong to other academies.
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    // A bare "2026-07-20" is stored at IST midday rather than UTC midnight,
    // which would render as the previous day for a local reader.
    const attendanceDate =
      (typeof date === 'string' ? coachMarkInstant(date.slice(0, 10)) : null) ??
      new Date(date);

    if (Number.isNaN(attendanceDate.getTime())) {
      return NextResponse.json({ success: false, message: 'Invalid date' }, { status: 400 });
    }

    // No batch on the student means no dated session — the record still writes,
    // it just dedupes on the calendar date instead. Better than refusing to
    // mark attendance for a student nobody has assigned to a batch yet.
    const batch = student.batchId ? await Batch.findById(student.batchId).lean() : null;
    const session = batch
      ? resolveSession(
          {
            id: String((batch as any)._id),
            daysOfWeek: (batch as any).daysOfWeek,
            startTime: (batch as any).startTime,
            endTime: (batch as any).endTime,
          },
          attendanceDate
        )
      : null;

    const academy = student.academyId
      ? await Academy.findById(student.academyId).select('name').lean()
      : null;

    const result = await recordAttendance({
      target: {
        profile: student,
        studentName: (student.userId as any)?.name ?? 'your child',
        academyName: (academy as any)?.name ?? 'your academy',
      },
      session,
      date: attendanceDate,
      present: Boolean(present),
      source: 'coach',
      markedBy: trainerId,
      remarks,
    });

    if (result.status === 'refused') {
      return NextResponse.json({ success: false, message: result.reason }, { status: 409 });
    }

    await student.save();

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully',
      data: { sessionId: result.sessionId, parentNotified: result.eventEmitted },
    });
  } catch (error: any) {
    console.error('[trainer/mark-attendance]', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
