import { TEMPLATES } from '@/lib/messaging/templates';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * BROADCAST GUARDS — PURE, SO THEY CAN BE TESTED WITHOUT A DATABASE
 * ════════════════════════════════════════════════════════════════════════════
 *
 * A broadcast is the only message in this system an owner types themselves, and
 * the only one that goes to every parent at once. Both of those make it the
 * riskiest thing the engine can send: every other message is generated from a
 * template with variables validated against one specific student, and a mistake
 * reaches one family. A bad broadcast reaches all of them simultaneously and
 * cannot be recalled.
 *
 * So the checks below are stricter than the template validator, and they run
 * before anything is queued.
 * ════════════════════════════════════════════════════════════════════════════
 */

/** Same shape the cross-contamination check looks for inside variables. */
const PASSPORT_ID_PATTERN = /GWD-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{6}/g;

/**
 * Meta's per-parameter ceiling is well above this. The limit here is editorial:
 * a WhatsApp message long enough to be truncated in the notification shade gets
 * ignored, and an owner writing an essay wants email.
 */
export const BROADCAST_MAX_LENGTH = 600;
export const BROADCAST_MIN_LENGTH = 10;

export type BroadcastRejection =
  | { ok: true; body: string }
  | { ok: false; reason: string };

/**
 * Validates an owner-composed broadcast body.
 *
 * The passport-id check is the one that matters and is easy to miss. Every
 * other template runs `assertVariablesBelongTo`, which refuses to send if a
 * variable mentions a passport other than the message's own. A broadcast has no
 * passport — it is about nobody in particular — so that check cannot run, and a
 * pasted "GWD-4P8QRT hasn't paid" would go to every parent in the academy with
 * one family's identifier in it. Rejecting outright is the only safe answer;
 * there is no correct way to send one child's identifier to sixty parents.
 */
export function validateBroadcastBody(input: unknown): BroadcastRejection {
  if (typeof input !== 'string') {
    return { ok: false, reason: 'A message body is required.' };
  }

  // Meta rejects parameters containing newlines or tabs, and the template layer
  // collapses them. Doing it here too means the preview an owner approves is
  // character-for-character what their parents receive.
  const body = input.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();

  if (body.length < BROADCAST_MIN_LENGTH) {
    return {
      ok: false,
      reason: `Too short — write at least ${BROADCAST_MIN_LENGTH} characters so parents know what it is about.`,
    };
  }

  if (body.length > BROADCAST_MAX_LENGTH) {
    return {
      ok: false,
      reason:
        `Too long (${body.length} characters, limit ${BROADCAST_MAX_LENGTH}). A WhatsApp message ` +
        'that gets truncated in the notification shade is a message nobody reads.',
    };
  }

  const passports = body.match(PASSPORT_ID_PATTERN);
  if (passports) {
    return {
      ok: false,
      reason:
        `This mentions passport ${passports[0]}, and a broadcast goes to every parent. ` +
        "Sending one child's identifier to the whole academy is a privacy leak — message that " +
        'parent directly instead.',
    };
  }

  return { ok: true, body };
}

/**
 * Reduces a roster to one recipient per phone number.
 *
 * Siblings at the same academy share a parent's mobile. Without this, a family
 * with three children receives the same announcement three times, and — because
 * the frequency cap is applied per phone number — the second and third would
 * consume that parent's entire daily budget, silently deferring the fee
 * reminder that was meant to go out the same evening.
 */
export function dedupeByPhone<T extends { parentPhoneE164?: string | null }>(
  students: T[]
): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];
  for (const student of students) {
    const phone = student.parentPhoneE164;
    if (!phone || seen.has(phone)) continue;
    seen.add(phone);
    unique.push(student);
  }
  return unique;
}

/** Exactly what a parent's handset will show, for the confirm step. */
export function renderBroadcastPreview(body: string, academyName: string): string {
  return TEMPLATES.broadcast.plainText({ messageBody: body, academyName });
}
