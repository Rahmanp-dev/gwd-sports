import mongoose from 'mongoose';
import DomainEvent from '@/lib/models/DomainEvent';
import type { AttendanceSource, IAttendance } from '@/lib/models/Student';
import { sessionDateKey, type ResolvedSession } from '@/lib/attendance/session';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * ONE WRITE PATH FOR BOTH ATTENDANCE MODES
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The parent's QR scan and the coach's checklist mark the same thing. If they
 * had separate write paths, the two would drift — one would emit the event and
 * the other would not, one would dedupe and the other would double-message a
 * parent about a single evening. Everything that writes an attendance row goes
 * through `recordAttendance`.
 *
 * TWO PRECEDENCE RULES, both deliberate:
 *
 *  1. The coach's mark wins. A coach ticking the register overwrites a parent's
 *     self-check-in, because the coach is the one who can see the child. The
 *     reverse is refused: a parent scanning after the coach has already marked
 *     them absent cannot quietly flip it to present.
 *
 *  2. The event fires once per student per session, and only for a PRESENT
 *     mark. Absences are never messaged to a parent (an automated "Rohan was
 *     marked absent" causes more arguments than it resolves), and burning the
 *     dedupe key on an absence would mean a coach correcting a mistake to
 *     "present" never sends the confirmation.
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface AttendanceTarget {
  /** The hydrated StudentProfile document. Saved by the caller, not here. */
  profile: any;
  studentName: string;
  academyName: string;
}

export interface RecordAttendanceInput {
  target: AttendanceTarget;
  /** Null for a mark with no batch context — the legacy single-student path. */
  session: ResolvedSession | null;
  /** Used only when `session` is null. */
  date?: Date;
  present: boolean;
  source: AttendanceSource;
  /** The user whose action this was. For a self check-in, the student. */
  markedBy: mongoose.Types.ObjectId | string;
  remarks?: string | null;
  /** When the parent scanned. Defaults to now for a self check-in. */
  checkedInAt?: Date;
  now?: Date;
}

export type RecordAttendanceResult =
  | { status: 'recorded'; created: boolean; eventEmitted: boolean; sessionId: string | null }
  | { status: 'refused'; reason: string };

/**
 * Finds the row this mark should update.
 *
 * Prefers the session id, because that is exact. Falls back to matching the
 * calendar date, which is what pre-Phase-3 rows have — without that fallback, a
 * coach re-marking a day they had already marked before this feature shipped
 * would create a second row for the same day rather than updating the first.
 */
function findExistingRow(profile: any, sessionId: string | null, date: Date): any {
  const rows = profile.attendance ?? [];
  if (sessionId) {
    const bySession = rows.find((row: IAttendance) => row.sessionId === sessionId);
    if (bySession) return bySession;
  }
  const dayKey = sessionDateKey(date);
  return rows.find(
    (row: IAttendance) => !row.sessionId && sessionDateKey(new Date(row.date)) === dayKey
  );
}

export async function recordAttendance(
  input: RecordAttendanceInput
): Promise<RecordAttendanceResult> {
  const { target, session, present, source, markedBy, remarks } = input;
  const now = input.now ?? new Date();
  const profile = target.profile;

  const date = input.date ?? now;
  const sessionId = session?.sessionId ?? null;

  const existing = findExistingRow(profile, sessionId, date);

  // Precedence rule 1. A parent cannot overturn the coach's word.
  if (existing && source === 'self_qr' && existing.source === 'coach') {
    return {
      status: 'refused',
      reason: 'Your coach has already marked the register for this session.',
    };
  }

  const created = !existing;

  if (existing) {
    existing.present = present;
    existing.markedBy = markedBy as any;
    existing.date = date;
    existing.source = source;
    if (sessionId) existing.sessionId = sessionId;
    if (session) existing.batchId = new mongoose.Types.ObjectId(session.batchId);
    if (input.checkedInAt) existing.checkedInAt = input.checkedInAt;
    if (remarks !== undefined && remarks !== null) existing.remarks = remarks;
  } else {
    profile.attendance.push({
      date,
      present,
      markedBy,
      source,
      ...(sessionId ? { sessionId } : {}),
      ...(session ? { batchId: new mongoose.Types.ObjectId(session.batchId) } : {}),
      ...(input.checkedInAt ? { checkedInAt: input.checkedInAt } : {}),
      ...(remarks ? { remarks } : {}),
    });
  }

  // Precedence rule 2. Absences are not announced, and must not consume the
  // dedupe key that a later correction to "present" depends on.
  let eventEmitted = false;
  if (present) {
    eventEmitted = await emitAttendanceCreated({
      target,
      session,
      date,
      source,
      checkedInAt: input.checkedInAt ?? (source === 'self_qr' ? now : undefined),
    });
  }

  return { status: 'recorded', created, eventEmitted, sessionId };
}

/**
 * THE attendance.created EVENT — PHASE 2'S INTERFACE POINT
 *
 * The consumer must render its message from this payload ALONE, without a
 * database round trip — the same rule Phase 1's student.created event follows,
 * and for the same reason: a message worker that re-reads four collections to
 * fill in a template is where "personalised per child" quietly becomes "the
 * same name on every message". So names travel denormalised.
 *
 * `dedupeKey` is the session, so the two modes marking one evening cannot
 * produce two messages. Returns whether an event was actually written — a
 * duplicate is a success, not a failure.
 */
async function emitAttendanceCreated(input: {
  target: AttendanceTarget;
  session: ResolvedSession | null;
  date: Date;
  source: AttendanceSource;
  checkedInAt?: Date;
}): Promise<boolean> {
  const { target, session, date, source, checkedInAt } = input;
  const profile = target.profile;

  const attendanceDate = session?.date ?? sessionDateKey(date);
  const dedupeKey = `attendance.created:${profile.passportId ?? profile._id}:${
    session?.sessionId ?? attendanceDate
  }`;

  try {
    await DomainEvent.create({
      name: 'attendance.created',
      academyId: profile.academyId ?? null,
      dedupeKey,
      payload: {
        eventVersion: 1,

        // Identity
        passportId: profile.passportId ?? null,
        studentUserId: String(profile.userId),
        studentProfileId: String(profile._id),
        studentName: target.studentName,

        // Parent — the message recipient
        parentName: profile.parentName ?? null,
        parentPhone: profile.parentPhoneE164 ?? null,

        // Context for the message
        academyId: profile.academyId ? String(profile.academyId) : null,
        academyName: target.academyName,

        // The session
        sessionId: session?.sessionId ?? null,
        batchId: session?.batchId ?? (profile.batchId ? String(profile.batchId) : null),
        attendanceDate,
        present: true,
        source,
        checkedInAt: (checkedInAt ?? date).toISOString(),
        markedAt: new Date().toISOString(),
      },
    });
    return true;
  } catch (err: any) {
    // 11000 is the unique index on dedupeKey doing its job: this session has
    // already produced an event. Not an error — it is the guarantee working.
    if (err?.code === 11000) return false;
    throw err;
  }
}
