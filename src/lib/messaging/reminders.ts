import StudentProfile from '@/lib/models/Student';
import Passport from '@/lib/models/Passport';
import { Academy } from '@/lib/models/Academy';
import OwnerAlert from '@/lib/models/OwnerAlert';
import { enqueueMessage } from './enqueue';
import { renderFeeOpeningLine } from './templates';
import { computeFeeSplit, configuredSplitConfig, percentToBps, formatInr } from '@/lib/payments/money';
import { localDateKey, configFromEnv, fromLocalParts, toLocalParts } from './scheduling';
import { appUrl as resolveAppUrl } from '@/lib/appUrl';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PARENT-FACING FEE REMINDER CADENCE
 *
 *   T-5 days   WhatsApp to parent, with the payment link
 *   Due date   WhatsApp to parent, same link
 *   T+3 days   WhatsApp to parent  AND  a flag on the owner's dashboard
 *   T+7 days   OWNER DASHBOARD ONLY. No further automated parent message.
 *   T+15 days  OWNER DASHBOARD, marked as a decision point.
 *
 * THIS IS NOT THE ACADEMY'S SUBSCRIPTION BILLING. That is a B2B flow and can be
 * firmer and fully automated. This one touches a child's participation, so the
 * automation stays soft and the final call belongs to a human.
 *
 * TWO RULES THAT MUST NOT BE "IMPROVED" LATER:
 *
 *  1. After T+3 the platform stops messaging the parent. Escalation past that
 *     point is the owner's relationship to manage, and a fourth automated chase
 *     is how a number gets blocked.
 *
 *  2. The system NEVER restricts a student's access, attendance, or passport for
 *     non-payment. T+15 raises a decision point and stops. Barring a child from
 *     practice over a late fee has consequences the platform cannot see. If you
 *     are here to add automatic suspension, that is a product decision that has
 *     to be made explicitly, not a gap to fill in.
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface ReminderTickResult {
  studentsChecked: number;
  remindersQueued: number;
  alertsRaised: number;
  skipped: number;
  details: Array<{
    passportId: string;
    stage: string;
    outcome: string;
    reason?: string;
  }>;
}

type Stage = 't5' | 'due' | 'overdue3' | 'overdue7' | 'overdue15';

/**
 * Runs the daily reminder sweep. Idempotent: dedupe keys are scoped to the
 * student, the stage, and the billing cycle, so running it twice in one day —
 * or re-running it after a failure — cannot double-message anyone.
 */
export async function runReminderTick(
  options: { now?: Date; academyId?: string } = {}
): Promise<ReminderTickResult> {
  const now = options.now ?? new Date();
  const config = configFromEnv();

  const result: ReminderTickResult = {
    studentsChecked: 0,
    remindersQueued: 0,
    alertsRaised: 0,
    skipped: 0,
    details: [],
  };

  const query: Record<string, unknown> = {
    isActive: true,
    parentPhoneE164: { $ne: null, $exists: true },
    passportId: { $ne: null, $exists: true },
  };
  if (options.academyId) query.academyId = options.academyId;

  const students = await StudentProfile.find(query)
    .select(
      'passportId academyId userId parentPhoneE164 parentName feeAmount feePeriod feeDueDayOfMonth outstandingFees'
    )
    .lean();

  // Academy names and fee percentages, fetched once rather than per student.
  const academyIds = [...new Set(students.map((s: any) => String(s.academyId)).filter(Boolean))];
  const academies = await Academy.find({ _id: { $in: academyIds } })
    .select('name platformFeePercent fees')
    .lean();
  const academyById = new Map(academies.map((a: any) => [String(a._id), a]));

  const passportIds = students.map((s: any) => s.passportId).filter(Boolean);
  const passports = await Passport.find({ passportId: { $in: passportIds } })
    .select('passportId studentName')
    .lean();
  const passportById = new Map(passports.map((p: any) => [p.passportId, p]));

  for (const student of students as any[]) {
    result.studentsChecked++;

    const academy = academyById.get(String(student.academyId));
    const passport = passportById.get(student.passportId);

    if (!academy || !passport) {
      result.skipped++;
      continue;
    }

    /**
     * Due day resolution, most specific first.
     *
     * This was `student.feeDueDayOfMonth ?? 5` — a hardcoded 5th of the month
     * for every academy on the platform, and the per-student field was not
     * editable in any admin screen, so in practice EVERY reminder cadence ran
     * on the 5th whether or not that was when the academy actually collected.
     * An academy billing on the 1st chased its parents four days late, every
     * month, with no way to change it.
     *
     * The academy-level setting is the one an owner can actually reach
     * (Branding → Fee structure); the per-student value still wins where it is
     * set, for a family on an individual arrangement.
     */
    const dueDay =
      student.feeDueDayOfMonth ?? (academy as any)?.fees?.dueDayOfMonth ?? 5;
    const dueDate = currentCycleDueDate(now, dueDay, config);
    const stage = stageFor(now, dueDate, config.timezoneOffsetMinutes);
    if (!stage) {
      result.skipped++;
      continue;
    }

    // What is actually owed. No fee configured means nothing to chase.
    const baseRupees =
      typeof student.outstandingFees === 'number' && student.outstandingFees > 0
        ? student.outstandingFees
        : typeof student.feeAmount === 'number' && student.feeAmount > 0
          ? student.feeAmount
          : academy.fees?.[student.feePeriod ?? 'monthly'];

    if (!baseRupees || baseRupees <= 0) {
      result.skipped++;
      result.details.push({
        passportId: student.passportId,
        stage,
        outcome: 'skipped',
        reason: 'No fee configured for this student.',
      });
      continue;
    }

    // The parent-facing total, including the disclosed convenience fee — the same
    // figure the payment page will charge. Quoting the bare academy fee here and
    // then charging more at checkout is how trust gets lost.
    const split = computeFeeSplit(
      Math.round(baseRupees * 100),
      configuredSplitConfig(
        typeof academy.platformFeePercent === 'number'
          ? percentToBps(academy.platformFeePercent)
          : undefined
      )
    );

    const cycleKey = localDateKey(dueDate, config.timezoneOffsetMinutes);
    const appUrl = resolveAppUrl();

    // ---- Stages that message the parent --------------------------------
    if (stage === 't5' || stage === 'due' || stage === 'overdue3') {
      const templateKey =
        stage === 't5' ? 'fee_reminder_t5' : stage === 'due' ? 'fee_due_today' : 'fee_overdue_3';

      const enqueued = await enqueueMessage({
        templateKey,
        recipientPhone: student.parentPhoneE164,
        recipientName: student.parentName ?? null,
        academyId: student.academyId,
        passportId: student.passportId,
        studentUserId: student.userId,
        // Stage + cycle scoped: one message per stage per billing cycle.
        dedupeKey: `${templateKey}:${student.passportId}:${cycleKey}`,
        variables: {
          openingLine: renderFeeOpeningLine(stage),
          childName: passport.studentName,
          amount: formatInr(split.parentTotalPaise),
          dueDate: formatDueDate(dueDate, config),
          paymentUrl: `${appUrl}/pay/${student.passportId}`,
        },
      });

      if (enqueued.status === 'queued') result.remindersQueued++;
      else result.skipped++;

      result.details.push({
        passportId: student.passportId,
        stage,
        outcome: enqueued.status,
        reason: enqueued.status === 'rejected' ? enqueued.reason : undefined,
      });
    }

    // ---- Stages that raise an owner alert -------------------------------
    // T+3 raises an alert IN ADDITION to the parent message above.
    if (stage === 'overdue3' || stage === 'overdue7' || stage === 'overdue15') {
      const raised = await raiseOverdueAlert({
        stage,
        academyId: student.academyId,
        passportId: student.passportId,
        studentUserId: student.userId,
        studentName: passport.studentName,
        parentPhone: student.parentPhoneE164,
        amountPaise: split.parentTotalPaise,
        cycleKey,
        daysOverdue: daysBetween(dueDate, now, config.timezoneOffsetMinutes),
      });
      if (raised) result.alertsRaised++;
    }
  }

  return result;
}

/** India, +05:30. Every date boundary in the cadence is a local one. */
const DEFAULT_OFFSET_MINUTES = 330;

/**
 * Which cadence stage today falls on, relative to the due date. Returns null on
 * every other day — the sweep runs daily and most students are not at a
 * boundary.
 */
export function stageFor(
  now: Date,
  dueDate: Date,
  offsetMinutes: number = DEFAULT_OFFSET_MINUTES
): Stage | null {
  const days = daysBetween(dueDate, now, offsetMinutes);

  if (days === -5) return 't5';
  if (days === 0) return 'due';
  if (days === 3) return 'overdue3';
  if (days === 7) return 'overdue7';
  if (days === 15) return 'overdue15';
  return null;
}

/**
 * Whole days from `from` to `to`, normalised to LOCAL midnight so a reminder does
 * not depend on the hour the cron happens to run.
 *
 * MUST BE LOCAL, NOT UTC. A due date at IST midnight is 18:30 UTC on the
 * PREVIOUS day, so normalising to UTC midnight put every date boundary one day
 * out and shifted the whole cadence: the "due today" message would have gone out
 * the day before the fee was actually due, and every overdue stage with it.
 */
export function daysBetween(
  from: Date,
  to: Date,
  offsetMinutes: number = DEFAULT_OFFSET_MINUTES
): number {
  const localMidnight = (date: Date) => {
    const parts = toLocalParts(date, offsetMinutes);
    return Date.UTC(parts.year, parts.month, parts.day);
  };
  return Math.round((localMidnight(to) - localMidnight(from)) / 86_400_000);
}

/**
 * The due date of the cycle currently in play.
 *
 * Before this month's due day, the relevant date is this month's. On or after it,
 * we are in the overdue window of this month's date until next month's arrives —
 * so this returns the most recent due date that has not yet been superseded.
 */
export function currentCycleDueDate(
  now: Date,
  dueDayOfMonth: number,
  config: { timezoneOffsetMinutes: number }
): Date {
  const parts = toLocalParts(now, config.timezoneOffsetMinutes);
  // Day-of-month is capped at 28 in the schema, so this never lands on a date
  // that does not exist in February.
  const day = Math.min(Math.max(dueDayOfMonth, 1), 28);

  const thisMonth = fromLocalParts(
    { year: parts.year, month: parts.month, day, hour: 0 },
    config.timezoneOffsetMinutes
  );

  // Within 20 days after the due date, keep chasing this cycle. Beyond that the
  // next cycle's reminder takes over and this one is the owner's problem.
  if (daysBetween(thisMonth, now, config.timezoneOffsetMinutes) >= -20) return thisMonth;

  return fromLocalParts(
    { year: parts.year, month: parts.month - 1, day, hour: 0 },
    config.timezoneOffsetMinutes
  );
}

function formatDueDate(date: Date, config: { timezoneOffsetMinutes: number }): string {
  const parts = toLocalParts(date, config.timezoneOffsetMinutes);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${parts.day} ${months[parts.month]} ${parts.year}`;
}

/**
 * Raises the owner-facing alert for an overdue stage.
 *
 * The three stages differ in what they ASK OF THE OWNER, which is the whole
 * design: T+3 is informational because the parent was also messaged; T+7 asks
 * for a phone call because the platform has deliberately stopped messaging; T+15
 * hands over a decision the platform refuses to make.
 */
async function raiseOverdueAlert(input: {
  stage: 'overdue3' | 'overdue7' | 'overdue15';
  academyId: any;
  passportId: string;
  studentUserId: any;
  studentName: string;
  parentPhone: string;
  amountPaise: number;
  cycleKey: string;
  daysOverdue: number;
}): Promise<boolean> {
  const amount = formatInr(input.amountPaise);

  const copy: Record<
    typeof input.stage,
    { type: any; severity: any; title: string; body: string; action: string; decision: boolean }
  > = {
    overdue3: {
      type: 'fee_overdue_3',
      severity: 'warning',
      title: `${input.studentName}'s fee is 3 days overdue`,
      body: `${amount} is outstanding. The parent has been sent a WhatsApp reminder.`,
      action: 'No action needed yet — the automated reminder has gone out.',
      decision: false,
    },
    overdue7: {
      type: 'fee_overdue_7',
      severity: 'warning',
      title: `${input.studentName}'s fee is 7 days overdue — time for a personal call`,
      body:
        `${amount} is outstanding. NO further automated message will be sent to this parent. ` +
        `A fourth automated chase is how a number gets blocked, so the follow-up from here is yours.`,
      action: `Call ${input.parentPhone} personally.`,
      decision: false,
    },
    overdue15: {
      type: 'fee_overdue_15',
      severity: 'critical',
      title: `${input.studentName}'s fee is 15 days overdue — your decision`,
      body:
        `${amount} is outstanding and automated reminders stopped at day 3. GWD has NOT ` +
        `restricted this student's access, attendance or passport, and will not do so ` +
        `automatically — barring a child from practice over a late fee is a relationship ` +
        `decision, not a system rule.`,
      action:
        'Decide how to proceed: waive, arrange a payment plan, keep chasing, or pause enrolment yourself.',
      decision: true,
    },
  };

  const chosen = copy[input.stage];

  try {
    await OwnerAlert.create({
      academyId: input.academyId,
      type: chosen.type,
      severity: chosen.severity,
      passportId: input.passportId,
      studentUserId: input.studentUserId,
      studentName: input.studentName,
      parentPhone: input.parentPhone,
      title: chosen.title,
      body: chosen.body,
      suggestedAction: chosen.action,
      requiresOwnerDecision: chosen.decision,
      amountPaise: input.amountPaise,
      daysOverdue: input.daysOverdue,
      // One alert per student per stage per cycle.
      dedupeKey: `${chosen.type}:${input.passportId}:${input.cycleKey}`,
    });
    return true;
  } catch (err: any) {
    if (err?.code === 11000) return false; // already raised
    throw err;
  }
}
