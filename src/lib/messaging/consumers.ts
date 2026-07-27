import DomainEvent, { type IDomainEvent } from '@/lib/models/DomainEvent';
import OwnerAlert from '@/lib/models/OwnerAlert';
import { enqueueMessage, cancelQueuedMessages } from './enqueue';
import { renderWelcomePaymentLine, renderWelcomeLoginLine } from './templates';
import { formatInr } from '@/lib/payments/money';

/**
 * Event consumers. Drains the DomainEvent log and turns events into queued
 * messages.
 *
 * This is the other half of the interface Phase 1 built. `student.created` was
 * emitted with no consumer; this is the consumer.
 *
 * Claiming is atomic per event so overlapping cron ticks cannot double-send.
 * An event that produces no message is marked 'skipped', not 'failed' — "this
 * parent has no phone number" is a data problem to surface, not a system error
 * to retry forever.
 */

const MAX_EVENTS_PER_TICK = 200;
const MAX_EVENT_ATTEMPTS = 3;

export interface DispatchEventsResult {
  claimed: number;
  queued: number;
  duplicates: number;
  skipped: number;
  failed: number;
  details: Array<{ eventId: string; name: string; outcome: string; reason?: string }>;
}

export async function runEventDispatchTick(
  options: { now?: Date; limit?: number } = {}
): Promise<DispatchEventsResult> {
  const now = options.now ?? new Date();
  const limit = Math.min(options.limit ?? MAX_EVENTS_PER_TICK, MAX_EVENTS_PER_TICK);

  const result: DispatchEventsResult = {
    claimed: 0,
    queued: 0,
    duplicates: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };

  const pending = await DomainEvent.find({
    status: 'pending',
    availableAt: { $lte: now },
    name: {
      $in: [
        'student.created',
        'attendance.created',
        'achievement.created',
        'payment.settled',
        'payment.failed',
      ],
    },
  })
    .sort({ availableAt: 1 })
    .limit(limit);

  for (const event of pending) {
    // Atomic claim.
    const claimed = await DomainEvent.findOneAndUpdate(
      { _id: event._id, status: 'pending' },
      { $set: { status: 'processing' }, $inc: { attempts: 1 } },
      { new: true }
    );
    if (!claimed) continue;

    result.claimed++;

    try {
      const outcome = await handleEvent(claimed);

      claimed.status = outcome.status === 'failed' ? 'failed' : 'done';
      claimed.processedAt = new Date();
      claimed.lastError = outcome.reason ?? null;
      await claimed.save();

      if (outcome.status === 'queued') result.queued++;
      else if (outcome.status === 'duplicate') result.duplicates++;
      else if (outcome.status === 'skipped') result.skipped++;
      else result.failed++;

      result.details.push({
        eventId: String(claimed._id),
        name: claimed.name,
        outcome: outcome.status,
        reason: outcome.reason,
      });
    } catch (err: any) {
      const message = String(err?.message ?? err);
      const exhausted = claimed.attempts >= MAX_EVENT_ATTEMPTS;

      claimed.status = exhausted ? 'failed' : 'pending';
      claimed.lastError = message;
      // Back off before retrying so a systemic problem does not spin.
      claimed.availableAt = new Date(now.getTime() + 10 * 60_000);
      await claimed.save();

      result.failed++;
      result.details.push({
        eventId: String(claimed._id),
        name: claimed.name,
        outcome: exhausted ? 'failed' : 'retry_scheduled',
        reason: message,
      });
    }
  }

  return result;
}

type HandleOutcome = { status: 'queued' | 'duplicate' | 'skipped' | 'failed'; reason?: string };

async function handleEvent(event: IDomainEvent): Promise<HandleOutcome> {
  switch (event.name) {
    case 'student.created':
      return handleStudentCreated(event);
    case 'attendance.created':
      return handleAttendanceCreated(event);
    case 'achievement.created':
      return handleAchievementCreated(event);
    case 'payment.settled':
      return handlePaymentSettled(event);
    case 'payment.failed':
      return handlePaymentFailed(event);
    default:
      return { status: 'skipped', reason: `no consumer for ${event.name}` };
  }
}

/**
 * TRIGGER 1 — WELCOME MESSAGE
 *
 * Does three jobs in one send: introduces GWD, links the child's new Passport,
 * and carries the first payment link when a fee is due.
 *
 * PERSONALISED PER CHILD EVEN IN A BULK BATCH. The variables come from THIS
 * event's payload — which Phase 1 deliberately denormalised for exactly this
 * reason — and are then checked against the passport by enqueueMessage(). Two
 * siblings imported in the same batch produce two events and two independent
 * messages; there is no shared mutable state between them.
 */
async function handleStudentCreated(event: IDomainEvent): Promise<HandleOutcome> {
  const p = event.payload as Record<string, any>;

  if (!p.passportId || !p.passportUrl) {
    return { status: 'skipped', reason: 'Event payload is missing passport details.' };
  }

  // Independent of whether the parent could be messaged below — if a student
  // signed up with no usable phone, the owner finding out via WhatsApp is
  // more important, not less.
  await notifyOwnerOfNewStudent(event, p);

  if (!p.parentPhone) {
    return {
      status: 'skipped',
      reason: `No parent phone for ${p.studentName ?? 'student'} — cannot send a welcome.`,
    };
  }

  const isFeeDue = Boolean(p.isFeeDue && p.feeAmountPaise);
  const paymentLine = renderWelcomePaymentLine({
    isFeeDue,
    amountFormatted: isFeeDue ? formatInr(Number(p.feeAmountPaise)) : undefined,
    paymentUrl: isFeeDue ? p.paymentUrl : undefined,
  });

  const enqueued = await enqueueMessage({
    templateKey: 'welcome',
    recipientPhone: p.parentPhone,
    recipientName: p.parentName ?? null,
    academyId: p.academyId ?? event.academyId,
    passportId: p.passportId,
    studentUserId: p.studentUserId ?? null,
    sourceEventId: event._id as any,
    // One welcome per student per academy, forever.
    dedupeKey: `welcome:${p.passportId}:${p.academyId}`,
    variables: {
      // Falls back to a neutral greeting rather than an empty parameter, which
      // Meta rejects, or the child's name, which would read very oddly.
      parentGreetingName: p.parentName || 'there',
      academyName: p.academyName,
      childName: p.studentName,
      passportUrl: p.passportUrl,
      paymentLine,
      // The credentials the import issued. Only knowable at import time — the
      // password is hashed on save and cannot be recovered afterwards — so it
      // travels on the event rather than being looked up here.
      loginLine: renderWelcomeLoginLine({
        loginEmail: p.loginEmail,
        loginPassword: p.loginPassword,
        loginUrl: p.loginUrl,
      }),
    },
  });

  return toOutcome(enqueued);
}

/**
 * Tells the ACADEMY OWNER a student joined — item raised directly by the
 * owner: "updates on his number when some trigger happens". Best-effort and
 * silent on failure; a missing owner alert must never affect the parent-facing
 * welcome message this runs alongside.
 */
async function notifyOwnerOfNewStudent(event: IDomainEvent, p: Record<string, any>): Promise<void> {
  const ownerPhone = p.academyOwnerPhone;
  const academyId = p.academyId ?? event.academyId;
  if (!ownerPhone || !academyId) return;

  const sports: string[] = Array.isArray(p.sports) ? p.sports.filter(Boolean) : [];

  await enqueueMessage({
    templateKey: 'owner_new_student',
    recipientPhone: ownerPhone,
    recipientName: null,
    academyId,
    // Deliberately no passportId here — this message is ABOUT the student but
    // not addressed to their parent, so the cross-contamination guard (which
    // checks the recipient's own passport) does not apply and must not run.
    sourceEventId: event._id as any,
    dedupeKey: `owner_new_student:${p.passportId}:${academyId}`,
    variables: {
      academyName: p.academyName || 'your academy',
      childName: p.studentName || 'A student',
      parentName: p.parentName || 'not given',
      sportsLine: sports.length > 0 ? sports.join(', ') : 'not specified yet',
      passportUrl: p.passportUrl,
    },
  });
}

/**
 * TRIGGER 2 — ATTENDANCE CONFIRMATION
 *
 * "[Child name] checked in at [time] ✅"
 *
 * The producer is Phase 3 (QR check-in and the coach checklist). This consumer
 * is built now and will start working the moment those emit the event.
 */
async function handleAttendanceCreated(event: IDomainEvent): Promise<HandleOutcome> {
  const p = event.payload as Record<string, any>;

  if (!p.parentPhone) {
    return { status: 'skipped', reason: 'No parent phone on the attendance event.' };
  }
  if (!p.passportId || !p.studentName) {
    return { status: 'skipped', reason: 'Attendance event is missing student details.' };
  }
  // Absences are not announced. "Rohan was marked absent" arriving automatically
  // would cause more arguments than it resolves; that is a coach conversation.
  if (p.present === false) {
    return { status: 'skipped', reason: 'Attendance recorded as absent — no parent message.' };
  }

  const checkInTime = formatCheckInTime(p.checkedInAt ?? p.markedAt ?? event.createdAt);

  const enqueued = await enqueueMessage({
    templateKey: 'attendance_confirmation',
    recipientPhone: p.parentPhone,
    recipientName: p.parentName ?? null,
    academyId: p.academyId ?? event.academyId,
    passportId: p.passportId,
    studentUserId: p.studentUserId ?? null,
    sourceEventId: event._id as any,
    // One confirmation per student per dated session, so Mode A (parent QR) and
    // Mode B (coach checklist) marking the same session cannot both message.
    dedupeKey: p.sessionId
      ? `attendance:${p.passportId}:${p.sessionId}`
      : `attendance:${p.passportId}:${p.attendanceDate ?? ''}`,
    variables: {
      childName: p.studentName,
      checkInTime,
      academyName: p.academyName ?? 'your academy',
    },
  });

  return toOutcome(enqueued);
}

/**
 * TRIGGER 3 — ACHIEVEMENT
 *
 * "🏅 [Child] earned [badge] at [academy]!"
 *
 * The producer is Phase 5 (lib/performance/award.ts). This template sat in the
 * registry from Phase 2 with nothing able to send it.
 *
 * This is the one message in the set built to be FORWARDED — the template notes
 * call it "distribution and retention in one motion". That is also why the
 * achievement rules are strict: a badge every child earns in a fortnight is
 * forwarded by nobody, and still spends the parent's daily message budget.
 */
async function handleAchievementCreated(event: IDomainEvent): Promise<HandleOutcome> {
  const p = event.payload as Record<string, any>;

  if (!p.parentPhone) {
    return { status: 'skipped', reason: 'No parent phone on the achievement event.' };
  }
  if (!p.passportId || !p.studentName || !p.achievementName) {
    return { status: 'skipped', reason: 'Achievement event is missing required details.' };
  }
  if (!p.passportUrl) {
    return { status: 'skipped', reason: 'Achievement event has no passport URL to link to.' };
  }

  const enqueued = await enqueueMessage({
    templateKey: 'achievement',
    recipientPhone: p.parentPhone,
    recipientName: p.parentName ?? null,
    academyId: p.academyId ?? event.academyId,
    passportId: p.passportId,
    studentUserId: p.studentUserId ?? null,
    sourceEventId: event._id as any,
    // One message per badge per student, forever. The badge itself cannot be
    // re-earned, but a replayed event must not re-congratulate.
    dedupeKey: `achievement:${p.passportId}:${p.achievementKey}`,
    variables: {
      childName: p.studentName,
      achievementName: p.achievementName,
      academyName: p.academyName ?? 'your academy',
      passportUrl: p.passportUrl,
    },
  });

  return toOutcome(enqueued);
}

/**
 * A settled payment does two things.
 *
 * FIRST, it cancels any queued fee reminders for that student. Without this, a
 * parent who pays on the due date still receives the T+3 overdue chase three
 * days later. They have a receipt; we look broken. This is the kind of small
 * failure that costs more trust than a missing feature.
 *
 * SECOND, it confirms the payment. Handing money over and receiving nothing is
 * the single most anxious moment in the whole flow — especially on a passport
 * link, where the payer may have no account and no other way to check. The
 * cancellation alone used to be all this did.
 *
 * Cancellation runs FIRST and unconditionally: a missing phone number or
 * receipt URL must never leave a stale overdue reminder queued against a
 * student who has actually paid.
 */
async function handlePaymentSettled(event: IDomainEvent): Promise<HandleOutcome> {
  const p = event.payload as Record<string, any>;
  const passportId: string | undefined = p.passportId;

  if (!passportId) {
    return { status: 'skipped', reason: 'No passport on the payment event; nothing to cancel.' };
  }

  const cancelled = await cancelQueuedMessages({
    passportId,
    templateKeys: ['fee_reminder_t5', 'fee_due_today', 'fee_overdue_3'],
    reason: 'Fee was paid before this reminder was sent.',
  });

  // Independent of whether the parent receipt below succeeds — the owner asked
  // to know "if he receives a payment from a student", on every settlement
  // regardless of method (online, subscription, or cash entered by an admin).
  await notifyOwnerOfPayment(event, p);

  if (!p.parentPhone) {
    return {
      status: 'skipped',
      reason: `Payment settled — cancelled ${cancelled} reminder(s); no parent phone to confirm to.`,
    };
  }
  if (!p.receiptUrl) {
    return {
      status: 'skipped',
      reason: `Payment settled — cancelled ${cancelled} reminder(s); no receipt URL to link.`,
    };
  }

  const enqueued = await enqueueMessage({
    templateKey: 'payment_receipt',
    recipientPhone: p.parentPhone,
    recipientName: p.parentName ?? null,
    academyId: p.academyId ?? event.academyId,
    passportId,
    studentUserId: p.studentUserId ?? null,
    sourceEventId: event._id as any,
    /**
     * Keyed on the payment, not the student. Settlement can be reported twice —
     * once by the browser returning to /verify-payment and once by the webhook —
     * and a parent must not be thanked twice for one payment.
     */
    dedupeKey: `payment_receipt:${p.feePaymentId ?? passportId}`,
    variables: {
      childName: p.studentName ?? 'Your child',
      academyName: p.academyName ?? 'your academy',
      amount: p.amountFormatted ?? formatInr(Number(p.parentTotalPaise ?? 0)),
      receiptNumber: p.receiptNumber ?? '—',
      receiptUrl: p.receiptUrl,
    },
  });

  return toOutcome(enqueued);
}

/**
 * Tells the ACADEMY OWNER money came in, for any settlement method — online
 * checkout, an auto-billed subscription, or cash/UPI the owner entered
 * themselves. Best-effort, mirrors notifyOwnerOfNewStudent above.
 */
async function notifyOwnerOfPayment(event: IDomainEvent, p: Record<string, any>): Promise<void> {
  const ownerPhone = p.academyOwnerPhone;
  const academyId = p.academyId ?? event.academyId;
  if (!ownerPhone || !academyId || !p.receiptUrl) return;

  await enqueueMessage({
    templateKey: 'owner_payment_received',
    recipientPhone: ownerPhone,
    recipientName: null,
    academyId,
    sourceEventId: event._id as any,
    dedupeKey: `owner_payment_received:${p.feePaymentId ?? p.passportId}`,
    variables: {
      academyName: p.academyName || 'your academy',
      childName: p.studentName || 'A student',
      amountFormatted: p.amountFormatted ?? formatInr(Number(p.parentTotalPaise ?? 0)),
      receiptUrl: p.receiptUrl,
    },
  });
}

/**
 * TRIGGER — PAYMENT FAILURE
 *
 * No parent-facing message: Razorpay already shows the parent their own
 * checkout failed, and re-explaining a gateway decline over WhatsApp adds
 * nothing. What was actually missing is the owner ever finding out — a
 * failed payment used to vanish into `handleEvent`'s default 'skipped'
 * branch with nobody able to see it anywhere, dashboard included, because
 * this event name was not even in the dispatcher's claim query.
 */
async function handlePaymentFailed(event: IDomainEvent): Promise<HandleOutcome> {
  const p = event.payload as Record<string, any>;

  if (!event.academyId) {
    return { status: 'skipped', reason: 'Payment failed with no academy on the event — cannot alert an owner.' };
  }

  try {
    await OwnerAlert.create({
      academyId: event.academyId,
      type: 'payment_failed',
      severity: 'warning',
      passportId: p.passportId ?? null,
      studentUserId: null,
      studentName: p.studentName ?? null,
      parentPhone: p.parentPhone ?? null,
      title: `Payment failed${p.studentName ? ` for ${p.studentName}` : ''}`,
      body: `A payment attempt failed${p.method ? ` via ${p.method}` : ''}: ${p.reason ?? 'no reason given by the gateway'}.`,
      suggestedAction: 'The parent may retry from the same payment link — check with them if it keeps failing.',
      requiresOwnerDecision: false,
      // One alert per failed payment attempt, not one per retry of this event.
      dedupeKey: `payment_failed:${p.paymentId ?? String(event._id)}`,
    });
    return { status: 'queued' };
  } catch (err: any) {
    if (err?.code === 11000) return { status: 'duplicate' };
    throw err;
  }
}

function toOutcome(
  enqueued: { status: 'queued' | 'duplicate' | 'rejected'; reason?: string }
): HandleOutcome {
  if (enqueued.status === 'queued') return { status: 'queued' };
  if (enqueued.status === 'duplicate') return { status: 'duplicate' };
  // A rejection is a data or rendering problem the owner needs to see, not a
  // transient error worth retrying.
  return { status: 'skipped', reason: enqueued.reason };
}

/** "5:02 PM" in IST. Parents read a wall clock, not an ISO string. */
export function formatCheckInTime(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const ist = new Date(date.getTime() + 330 * 60_000);
  let hours = ist.getUTCHours();
  const minutes = String(ist.getUTCMinutes()).padStart(2, '0');
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${meridiem}`;
}
