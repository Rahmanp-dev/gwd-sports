import mongoose from 'mongoose';
import OutboundMessage, { type IOutboundMessage } from '@/lib/models/OutboundMessage';
import Passport from '@/lib/models/Passport';
import {
  validateAndRender,
  assertVariablesBelongTo,
  getTemplate,
  TemplateValidationError,
  type PassportIdentity,
} from './templates';
import { nextAllowedSendTime, configFromEnv } from './scheduling';
import { phoneKey } from '@/lib/phone';

/**
 * Puts a message on the queue.
 *
 * VALIDATION HAPPENS HERE, AT ENQUEUE TIME, AND AGAIN AT SEND TIME.
 *
 * Validating twice is deliberate. Enqueue-time validation fails loudly next to
 * the code that made the mistake, where the stack trace is useful. Send-time
 * validation is the actual safety gate, because a message can sit in the queue
 * for hours and the world can change underneath it — a student transfers, a name
 * is corrected, a fee is paid. Only one of these could be dropped, and it is not
 * the one at send time.
 */
export interface EnqueueInput {
  templateKey: string;
  recipientPhone: string;
  recipientName?: string | null;
  variables: Record<string, unknown>;

  academyId?: mongoose.Types.ObjectId | string | null;
  passportId?: string | null;
  studentUserId?: mongoose.Types.ObjectId | string | null;

  /** Earliest send time. Defaults to now, nudged out of quiet hours. */
  scheduledFor?: Date;
  /** Overrides the template's default priority. Rarely needed. */
  priority?: number;
  dedupeKey?: string;
  sourceEventId?: mongoose.Types.ObjectId | string | null;
  /**
   * Identity to validate the variables against. When omitted and passportId is
   * given, it is loaded from the database.
   */
  identity?: PassportIdentity;
}

export type EnqueueResult =
  | { status: 'queued'; messageId: string }
  | { status: 'duplicate' }
  | { status: 'rejected'; reason: string };

export async function enqueueMessage(input: EnqueueInput): Promise<EnqueueResult> {
  const template = getTemplate(input.templateKey);

  const phone = phoneKey(input.recipientPhone);
  if (!phone) {
    return {
      status: 'rejected',
      reason: `Cannot message "${input.recipientPhone}" — not a valid Indian mobile number.`,
    };
  }

  let rendered;
  try {
    rendered = validateAndRender(input.templateKey, input.variables);
  } catch (err) {
    if (err instanceof TemplateValidationError) {
      return { status: 'rejected', reason: err.message };
    }
    throw err;
  }

  // Cross-contamination check, when we know which student this is about.
  if (input.passportId) {
    const identity =
      input.identity ??
      (await loadIdentity(input.passportId));

    if (!identity) {
      return {
        status: 'rejected',
        reason: `Passport ${input.passportId} not found — cannot verify this message belongs to the right student.`,
      };
    }

    try {
      assertVariablesBelongTo(rendered, identity);
    } catch (err) {
      if (err instanceof TemplateValidationError) {
        return { status: 'rejected', reason: err.message };
      }
      throw err;
    }
  }

  const config = configFromEnv();
  // Never queue something for the middle of the night; the worker would only
  // defer it anyway, and this keeps scheduledFor honest in the admin UI.
  const scheduledFor = nextAllowedSendTime(input.scheduledFor ?? new Date(), config);

  try {
    const message = await OutboundMessage.create({
      academyId: input.academyId ? new mongoose.Types.ObjectId(String(input.academyId)) : null,
      passportId: input.passportId ?? null,
      studentUserId: input.studentUserId
        ? new mongoose.Types.ObjectId(String(input.studentUserId))
        : null,

      recipientPhone: phone,
      recipientName: input.recipientName ?? null,

      channel: 'whatsapp',
      templateKey: input.templateKey,
      variables: rendered.variables,
      variableMap: rendered.variableMap,
      bodyPreview: rendered.plainText,

      priority: input.priority ?? template.priority,
      status: 'queued',
      scheduledFor,

      dedupeKey: input.dedupeKey,
      sourceEventId: input.sourceEventId
        ? new mongoose.Types.ObjectId(String(input.sourceEventId))
        : null,
    });

    await mirrorToPlatformOwner(input, phone, rendered, scheduledFor);

    return { status: 'queued', messageId: String(message._id) };
  } catch (err: any) {
    if (err?.code === 11000) {
      // dedupeKey collision: this message already exists. From the caller's
      // point of view the intent is already recorded, which is success.
      return { status: 'duplicate' };
    }
    throw err;
  }
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * SHADOW COPY TO THE PLATFORM OWNER
 * ════════════════════════════════════════════════════════════════════════════
 *
 * "what message that is being sent to parents shall be sent to me so that I
 * know messages were really sent" — the platform owner (GWD), not the academy
 * owner, wants a copy of every real parent-facing message on their own phone
 * while a new academy is being onboarded and trusted. Controlled entirely by
 * PLATFORM_OWNER_WHATSAPP_PHONE — unset by default, and unset again once
 * confidence in the pipeline no longer needs a manual echo.
 *
 * Sends the exact same rendered template, so what lands on the owner's phone
 * is verbatim what the parent received — not a paraphrase that could hide a
 * rendering bug the real send has.
 *
 * NEVER for another owner-facing template (the `owner_` prefix) — those
 * already go to an owner (the academy's), mirroring them to a second owner is
 * noise, not verification.
 *
 * Deliberately non-throwing and best-effort: a shadow copy failing must never
 * take down the real send it is meant to be verifying.
 */
async function mirrorToPlatformOwner(
  input: EnqueueInput,
  originalPhone: string,
  rendered: ReturnType<typeof validateAndRender>,
  scheduledFor: Date
): Promise<void> {
  const ccNumber = process.env.PLATFORM_OWNER_WHATSAPP_PHONE;
  if (!ccNumber) return;
  if (input.templateKey.startsWith('owner_')) return;

  // Without a dedupeKey to derive from, a copy here has no protection against
  // a retried event or cron re-run producing a second, third, fourth copy —
  // so it is skipped rather than sent unprotected. Every current producer
  // (welcome, fee reminders, digest, achievement, payment receipt) sets one.
  if (!input.dedupeKey) return;

  try {
    const ccPhone = phoneKey(ccNumber);
    if (!ccPhone || ccPhone === originalPhone) return;

    await OutboundMessage.create({
      academyId: input.academyId ? new mongoose.Types.ObjectId(String(input.academyId)) : null,
      passportId: input.passportId ?? null,
      studentUserId: null,

      recipientPhone: ccPhone,
      recipientName: `[COPY — sent to ${input.recipientName || originalPhone}]`,

      channel: 'whatsapp',
      templateKey: input.templateKey,
      variables: rendered.variables,
      variableMap: rendered.variableMap,
      bodyPreview: rendered.plainText,

      priority: input.priority ?? rendered.template.priority,
      status: 'queued',
      scheduledFor,

      // Derived from the real message's own dedupeKey so a retried event
      // cannot double-copy.
      dedupeKey: `${input.dedupeKey}::platform-cc`,
      sourceEventId: input.sourceEventId
        ? new mongoose.Types.ObjectId(String(input.sourceEventId))
        : null,
    });
  } catch (err: any) {
    if (err?.code === 11000) return;
    console.error('[messaging] platform-owner shadow copy failed:', err?.message || err);
  }
}

async function loadIdentity(passportId: string): Promise<PassportIdentity | null> {
  const passport = await Passport.findOne({ passportId: passportId.toUpperCase() })
    .select('passportId studentName')
    .lean<{ passportId: string; studentName: string } | null>();

  return passport ? { passportId: passport.passportId, studentName: passport.studentName } : null;
}

/**
 * Cancels queued messages that are no longer appropriate.
 *
 * The case that matters: a parent pays before the T+3 overdue reminder goes out.
 * Sending it anyway is the kind of small failure that costs more trust than a
 * missing feature — the parent has a receipt and we are still chasing them.
 *
 * Only touches 'queued' messages; anything already sent is history.
 */
export async function cancelQueuedMessages(filter: {
  passportId?: string;
  templateKeys?: string[];
  reason: string;
}): Promise<number> {
  const query: Record<string, unknown> = { status: 'queued' };
  if (filter.passportId) query.passportId = filter.passportId.toUpperCase();
  if (filter.templateKeys?.length) query.templateKey = { $in: filter.templateKeys };

  const result = await OutboundMessage.updateMany(query, {
    $set: { status: 'cancelled', error: filter.reason },
  });

  return result.modifiedCount ?? 0;
}

export type { IOutboundMessage };
