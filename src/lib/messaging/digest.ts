import StudentProfile from '@/lib/models/Student';
import Passport from '@/lib/models/Passport';
import { Academy } from '@/lib/models/Academy';
import { enqueueMessage } from './enqueue';
import { renderAchievementLine } from './templates';
import {
  configFromEnv,
  localDateKey,
  toLocalParts,
  fromLocalParts,
  type SchedulingConfig,
} from './scheduling';
import { currentCycleDueDate } from './reminders';
import { appUrl as resolveAppUrl } from '@/lib/appUrl';

/**
 * TRIGGER 3 — WEEKLY PROGRESS DIGEST
 *
 * Sunday evening, one message per student: attendance for the week, any
 * achievement, the upcoming fee date, and one link to the full Passport.
 *
 * The point is to reinforce value in weeks where nothing notable happened. A
 * platform that only speaks up when it wants money gets muted; this is the
 * message that makes the rest of them welcome.
 *
 * Priority is ACHIEVEMENT tier, so it yields to fee reminders and attendance
 * confirmations. On a busy Sunday it may be deferred to Monday — acceptable, and
 * far better than pushing a parent over their daily cap.
 */

export interface DigestTickResult {
  studentsChecked: number;
  queued: number;
  skipped: number;
  details: Array<{ passportId: string; outcome: string; reason?: string }>;
}

/**
 * Guard so a misconfigured cron cannot fire the digest on a Tuesday.
 * 0 = Sunday, in the parent's local timezone.
 */
export function isDigestDay(now: Date, config: SchedulingConfig): boolean {
  const parts = toLocalParts(now, config.timezoneOffsetMinutes);
  const localMidnight = Date.UTC(parts.year, parts.month, parts.day);
  return new Date(localMidnight).getUTCDay() === 0;
}

export async function runWeeklyDigestTick(
  options: { now?: Date; academyId?: string; force?: boolean } = {}
): Promise<DigestTickResult> {
  const now = options.now ?? new Date();
  const config = configFromEnv();

  const result: DigestTickResult = { studentsChecked: 0, queued: 0, skipped: 0, details: [] };

  if (!options.force && !isDigestDay(now, config)) {
    return result;
  }

  const query: Record<string, unknown> = {
    isActive: true,
    parentPhoneE164: { $ne: null, $exists: true },
    passportId: { $ne: null, $exists: true },
  };
  if (options.academyId) query.academyId = options.academyId;

  const students = await StudentProfile.find(query)
    .select(
      'passportId academyId userId parentPhoneE164 parentName attendance performance feeDueDayOfMonth'
    )
    .lean();

  const academyIds = [...new Set(students.map((s: any) => String(s.academyId)).filter(Boolean))];
  const academies = await Academy.find({ _id: { $in: academyIds } }).select('name').lean();
  const academyById = new Map(academies.map((a: any) => [String(a._id), a]));

  const passportIds = students.map((s: any) => s.passportId).filter(Boolean);
  const passports = await Passport.find({ passportId: { $in: passportIds } })
    .select('passportId studentName')
    .lean();
  const passportById = new Map(passports.map((p: any) => [p.passportId, p]));

  const weekStart = startOfDigestWeek(now, config);
  const weekKey = localDateKey(weekStart, config.timezoneOffsetMinutes);
  const appUrl = resolveAppUrl();

  for (const student of students as any[]) {
    result.studentsChecked++;

    const academy = academyById.get(String(student.academyId));
    const passport = passportById.get(student.passportId);
    if (!academy || !passport) {
      result.skipped++;
      continue;
    }

    const attendance = summariseWeekAttendance(student.attendance ?? [], weekStart, now);

    /**
     * A student with no sessions at all this week gets no digest.
     *
     * "Attendance: 0 of 0 sessions" is a worse message than silence — it reads as
     * a system with nothing to say, and on a holiday week it would go to every
     * parent at once.
     */
    if (attendance.total === 0) {
      result.skipped++;
      result.details.push({
        passportId: student.passportId,
        outcome: 'skipped',
        reason: 'No sessions scheduled or recorded this week.',
      });
      continue;
    }

    const achievement = latestAchievementThisWeek(student.performance ?? [], weekStart, now);
    const dueDate = currentCycleDueDate(now, student.feeDueDayOfMonth ?? 5, config);

    const enqueued = await enqueueMessage({
      templateKey: 'weekly_digest',
      recipientPhone: student.parentPhoneE164,
      recipientName: student.parentName ?? null,
      academyId: student.academyId,
      passportId: student.passportId,
      studentUserId: student.userId,
      // One digest per student per week, even if the cron fires twice.
      dedupeKey: `weekly_digest:${student.passportId}:${weekKey}`,
      variables: {
        childName: passport.studentName,
        academyName: academy.name,
        attendanceSummary: `${attendance.present} of ${attendance.total} sessions (${attendance.percent}%)`,
        achievementLine: renderAchievementLine(achievement),
        nextFeeDue: formatShortDate(nextDueAfter(dueDate, now, config), config),
        passportUrl: `${appUrl}/passport/${student.passportId}`,
      },
    });

    if (enqueued.status === 'queued') result.queued++;
    else result.skipped++;

    result.details.push({
      passportId: student.passportId,
      outcome: enqueued.status,
      reason: enqueued.status === 'rejected' ? enqueued.reason : undefined,
    });
  }

  return result;
}

/** Monday 00:00 local of the week being reported on. */
export function startOfDigestWeek(now: Date, config: SchedulingConfig): Date {
  const parts = toLocalParts(now, config.timezoneOffsetMinutes);
  const localMidnight = new Date(Date.UTC(parts.year, parts.month, parts.day));
  const weekday = localMidnight.getUTCDay(); // 0 = Sunday
  // Sunday is the END of the reported week, so step back six days from Sunday.
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;

  return fromLocalParts(
    { year: parts.year, month: parts.month, day: parts.day - daysSinceMonday, hour: 0 },
    config.timezoneOffsetMinutes
  );
}

export interface WeekAttendance {
  present: number;
  total: number;
  percent: number;
}

export function summariseWeekAttendance(
  records: Array<{ date: Date | string; present: boolean }>,
  weekStart: Date,
  weekEnd: Date
): WeekAttendance {
  let present = 0;
  let total = 0;

  for (const record of records) {
    const date = record.date instanceof Date ? record.date : new Date(record.date);
    if (Number.isNaN(date.getTime())) continue;
    if (date < weekStart || date > weekEnd) continue;

    total++;
    if (record.present) present++;
  }

  return {
    present,
    total,
    percent: total === 0 ? 0 : Math.round((present / total) * 100),
  };
}

export function latestAchievementThisWeek(
  performance: Array<{ category?: string; sport?: string; score?: number; maxScore?: number; evaluatedAt?: Date | string; remarks?: string }>,
  weekStart: Date,
  weekEnd: Date
): string | null {
  const inWeek = performance
    .map((entry) => ({
      ...entry,
      at: entry.evaluatedAt
        ? entry.evaluatedAt instanceof Date
          ? entry.evaluatedAt
          : new Date(entry.evaluatedAt)
        : null,
    }))
    .filter((entry) => entry.at && entry.at >= weekStart && entry.at <= weekEnd)
    .sort((a, b) => (b.at as Date).getTime() - (a.at as Date).getTime());

  const best = inWeek[0];
  if (!best) return null;

  // Prefer the coach's own words; fall back to the score.
  if (best.remarks && best.remarks.trim().length > 0) {
    return best.remarks.trim().slice(0, 120);
  }
  if (typeof best.score === 'number' && typeof best.maxScore === 'number' && best.maxScore > 0) {
    return `${best.category ?? best.sport ?? 'Assessment'} ${best.score}/${best.maxScore}`;
  }
  return null;
}

/** If this cycle's due date has passed, the digest should point at the next one. */
function nextDueAfter(dueDate: Date, now: Date, config: SchedulingConfig): Date {
  if (dueDate >= now) return dueDate;
  const parts = toLocalParts(dueDate, config.timezoneOffsetMinutes);
  return fromLocalParts(
    { year: parts.year, month: parts.month + 1, day: parts.day, hour: 0 },
    config.timezoneOffsetMinutes
  );
}

function formatShortDate(date: Date, config: SchedulingConfig): string {
  const parts = toLocalParts(date, config.timezoneOffsetMinutes);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parts.day} ${months[parts.month]} ${parts.year}`;
}
