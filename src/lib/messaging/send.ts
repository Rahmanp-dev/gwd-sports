import mongoose from 'mongoose';
import OutboundMessage, { type IOutboundMessage } from '@/lib/models/OutboundMessage';
import OwnerAlert from '@/lib/models/OwnerAlert';
import Passport from '@/lib/models/Passport';
import {
  planDispatch,
  budgetKey,
  localDateKey,
  configFromEnv,
  type DispatchCandidate,
  type SchedulingConfig,
} from './scheduling';
import {
  getTemplate,
  validateAndRender,
  assertVariablesBelongTo,
  TemplateValidationError,
} from './templates';
import { resolveWhatsAppProvider, resolveSmsProvider } from './providers';

/**
 * The send worker. Runs on a cron tick (see /api/jobs/*).
 *
 * Shape of one tick:
 *   1. Read due, queued messages, best priority first.
 *   2. Ask the pure planner which may send now (frequency cap, priority, quiet
 *      hours). Deferred messages get their scheduledFor pushed — never dropped.
 *   3. Re-validate each sender against live data, then hand it to the BSP.
 *   4. Record the outcome; raise an SMS fallback on permanent WhatsApp failure.
 *
 * The scheduling DECISION is pure and tested in scheduling.test.ts. This file is
 * only the I/O around it.
 */

/** Bounded per tick so one run cannot hold a serverless function open forever. */
const MAX_MESSAGES_PER_TICK = 100;
const MAX_ATTEMPTS = 3;

export interface SendTickResult {
  considered: number;
  sent: number;
  deferred: number;
  failed: number;
  skipped: number;
  cancelled: number;
  fallbacksRaised: number;
  details: Array<{
    messageId: string;
    templateKey: string;
    outcome: string;
    reason?: string;
  }>;
}

export async function runSendTick(options: { now?: Date; limit?: number } = {}): Promise<SendTickResult> {
  const now = options.now ?? new Date();
  const config = configFromEnv();
  const limit = Math.min(options.limit ?? MAX_MESSAGES_PER_TICK, MAX_MESSAGES_PER_TICK);

  const result: SendTickResult = {
    considered: 0,
    sent: 0,
    deferred: 0,
    failed: 0,
    skipped: 0,
    cancelled: 0,
    fallbacksRaised: 0,
    details: [],
  };

  const due = await OutboundMessage.find({
    status: 'queued',
    scheduledFor: { $lte: now },
  })
    .sort({ priority: 1, scheduledFor: 1 })
    .limit(limit);

  if (due.length === 0) return result;
  result.considered = due.length;

  // Today's spend for every parent involved, from the database.
  const sentCounts = await loadSentCounts(
    due.map((message) => message.recipientPhone),
    now,
    config
  );

  const candidates: DispatchCandidate[] = due.map((message) => ({
    id: String(message._id),
    recipientPhone: message.recipientPhone,
    priority: message.priority,
    scheduledFor: message.scheduledFor,
    templateKey: message.templateKey,
  }));

  const plan = planDispatch({ now, candidates, sentCounts, config });
  const byId = new Map(due.map((message) => [String(message._id), message]));

  for (const decision of plan) {
    const message = byId.get(decision.id);
    if (!message) continue;

    if (decision.action === 'defer') {
      message.scheduledFor = decision.deferTo;
      message.deferrals = (message.deferrals ?? 0) + 1;
      message.lastDeferralReason = decision.reason;
      await message.save();

      result.deferred++;
      result.details.push({
        messageId: decision.id,
        templateKey: message.templateKey,
        outcome: 'deferred',
        reason: decision.reason,
      });
      continue;
    }

    const outcome = await sendOne(message, now, config);
    result.details.push({
      messageId: decision.id,
      templateKey: message.templateKey,
      outcome: outcome.outcome,
      reason: outcome.reason,
    });

    switch (outcome.outcome) {
      case 'sent':
        result.sent++;
        break;
      case 'failed':
        result.failed++;
        if (outcome.fallbackRaised) result.fallbacksRaised++;
        break;
      case 'skipped':
        result.skipped++;
        break;
      case 'cancelled':
        result.cancelled++;
        break;
      case 'requeued':
        result.deferred++;
        break;
    }
  }

  return result;
}

/**
 * Counts messages already sent to each phone on the relevant parent-local day.
 *
 * Only 'sent'/'delivered'/'read' count. A failed message did not reach the
 * parent, so charging it against the cap would silence a parent because of OUR
 * outage. A cancelled or skipped one never went out at all.
 */
async function loadSentCounts(
  phones: string[],
  now: Date,
  config: SchedulingConfig
): Promise<Record<string, number>> {
  const unique = [...new Set(phones)];
  if (unique.length === 0) return {};

  const localDate = localDateKey(now, config.timezoneOffsetMinutes);

  const rows = await OutboundMessage.aggregate<{ _id: string; count: number }>([
    {
      $match: {
        recipientPhone: { $in: unique },
        sentOnLocalDate: localDate,
        status: { $in: ['sent', 'delivered', 'read'] },
      },
    },
    { $group: { _id: '$recipientPhone', count: { $sum: 1 } } },
  ]);

  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[budgetKey(row._id, localDate)] = row.count;
  }
  return counts;
}

type SendOneOutcome = {
  outcome: 'sent' | 'failed' | 'skipped' | 'cancelled' | 'requeued';
  reason?: string;
  fallbackRaised?: boolean;
};

async function sendOne(
  message: IOutboundMessage,
  now: Date,
  config: SchedulingConfig
): Promise<SendOneOutcome> {
  // Claim the message atomically. Without this, two overlapping cron ticks —
  // which happens whenever a tick runs long — would both send it.
  const claimed = await OutboundMessage.findOneAndUpdate(
    { _id: message._id, status: 'queued' },
    { $set: { status: 'sending' }, $inc: { attempts: 1 } },
    { new: true }
  );
  if (!claimed) {
    return { outcome: 'skipped', reason: 'already claimed by another worker' };
  }

  /**
   * SEND-TIME REVALIDATION. The message may have been sitting in the queue for
   * hours, and this is the last gate before a parent sees it.
   */
  try {
    const rendered = validateAndRender(claimed.templateKey, claimed.variableMap);

    if (claimed.passportId) {
      const passport = await Passport.findOne({ passportId: claimed.passportId })
        .select('passportId studentName isActive')
        .lean<{ passportId: string; studentName: string; isActive: boolean } | null>();

      if (!passport) {
        return finalizeFailure(claimed, 'Passport no longer exists', false);
      }

      // The student's name may have been corrected since enqueue. Re-checking
      // against live data is the point: stale variables are exactly how the
      // wrong name reaches a parent.
      assertVariablesBelongTo(rendered, {
        passportId: passport.passportId,
        studentName: passport.studentName,
      });
    }

    const template = getTemplate(claimed.templateKey);
    const provider = resolveWhatsAppProvider();

    const providerResult = await provider.sendTemplate({
      toPhoneE164: claimed.recipientPhone,
      templateName: template.interaktTemplateName,
      languageCode: template.languageCode,
      bodyValues: rendered.variables,
      plainText: rendered.plainText,
    });

    claimed.provider = provider.name;

    if (providerResult.outcome === 'accepted') {
      claimed.status = 'sent';
      claimed.sentAt = now;
      // Stamped here, not at query time, so the cap always bills the message to
      // the day it actually went out.
      claimed.sentOnLocalDate = localDateKey(now, config.timezoneOffsetMinutes);
      claimed.providerMessageId = providerResult.providerMessageId ?? null;
      claimed.error = null;
      await claimed.save();
      return { outcome: 'sent' };
    }

    if (providerResult.outcome === 'not_configured') {
      // No BSP wired up. Not a failure of this message — recorded as skipped so
      // it is distinguishable from a genuine delivery problem, and so the
      // activation dashboard can say "queued, awaiting provider".
      claimed.status = 'skipped';
      claimed.error = providerResult.error ?? 'No WhatsApp provider configured';
      await claimed.save();
      return { outcome: 'skipped', reason: claimed.error };
    }

    if (providerResult.retryable && claimed.attempts < MAX_ATTEMPTS) {
      // Exponential-ish backoff, bounded.
      const backoffMinutes = 5 * Math.pow(3, claimed.attempts - 1);
      claimed.status = 'queued';
      claimed.scheduledFor = new Date(now.getTime() + backoffMinutes * 60_000);
      claimed.error = providerResult.error ?? 'transient provider failure';
      await claimed.save();
      return { outcome: 'requeued', reason: claimed.error };
    }

    return finalizeFailure(
      claimed,
      providerResult.error ?? 'provider rejected the message',
      true
    );
  } catch (err) {
    if (err instanceof TemplateValidationError) {
      // A validation failure is permanent — retrying renders the same bad text.
      // Fail hard and tell the owner, rather than sending something wrong.
      return finalizeFailure(claimed, err.message, false);
    }
    // Unexpected error: requeue if attempts remain, so a transient database
    // blip does not permanently lose a parent's message.
    if (claimed.attempts < MAX_ATTEMPTS) {
      claimed.status = 'queued';
      claimed.scheduledFor = new Date(now.getTime() + 10 * 60_000);
      claimed.error = String((err as any)?.message ?? err);
      await claimed.save();
      return { outcome: 'requeued', reason: claimed.error };
    }
    return finalizeFailure(claimed, String((err as any)?.message ?? err), false);
  }
}

/**
 * Marks a message permanently failed, raises an SMS fallback when appropriate,
 * and tells the owner.
 */
async function finalizeFailure(
  message: IOutboundMessage,
  error: string,
  attemptSmsFallback: boolean
): Promise<SendOneOutcome> {
  message.status = 'failed';
  message.failedAt = new Date();
  message.error = error;
  await message.save();

  let fallbackRaised = false;
  if (attemptSmsFallback && message.channel === 'whatsapp') {
    fallbackRaised = await raiseSmsFallback(message);
  }

  await raiseDeliveryFailureAlert(message, error, fallbackRaised);
  return { outcome: 'failed', reason: error, fallbackRaised };
}

/**
 * Creates an SMS fallback message for a failed WhatsApp send.
 *
 * The fallback row is created EVEN WHEN NO SMS PROVIDER IS CONFIGURED, as a
 * 'skipped' record. That is intentional: it makes the gap visible in the message
 * log and in the owner's alerts, rather than silently doing nothing. Right now
 * MSG91 lacks DLT template ids, so this always records as skipped — see
 * Msg91SmsProvider.
 */
async function raiseSmsFallback(message: IOutboundMessage): Promise<boolean> {
  const sms = resolveSmsProvider();
  const text = message.bodyPreview ?? '';

  if (!text) return false;

  try {
    const fallback = await OutboundMessage.create({
      academyId: message.academyId ?? null,
      passportId: message.passportId ?? null,
      studentUserId: message.studentUserId ?? null,
      recipientPhone: message.recipientPhone,
      recipientName: message.recipientName ?? null,
      channel: 'sms',
      templateKey: message.templateKey,
      variables: message.variables,
      variableMap: message.variableMap,
      bodyPreview: text,
      // Inherits priority: an undelivered fee reminder is still a fee reminder.
      priority: message.priority,
      status: 'queued',
      scheduledFor: new Date(),
      fallbackForMessageId: message._id as mongoose.Types.ObjectId,
      dedupeKey: `sms_fallback:${String(message._id)}`,
    });

    message.fallbackMessageId = fallback._id as mongoose.Types.ObjectId;
    await message.save();

    if (!sms) {
      fallback.status = 'skipped';
      fallback.error =
        'No SMS provider configured. Indian SMS also requires a DLT-registered template.';
      await fallback.save();
      return true;
    }

    const smsResult = await sms.sendText({ toPhoneE164: message.recipientPhone, text });
    fallback.provider = sms.name;

    if (smsResult.outcome === 'accepted') {
      fallback.status = 'sent';
      fallback.sentAt = new Date();
      fallback.providerMessageId = smsResult.providerMessageId ?? null;
    } else if (smsResult.outcome === 'not_configured') {
      fallback.status = 'skipped';
      fallback.error = smsResult.error ?? 'SMS not configured';
    } else {
      fallback.status = 'failed';
      fallback.failedAt = new Date();
      fallback.error = smsResult.error ?? 'SMS send failed';
    }
    await fallback.save();
    return true;
  } catch (err: any) {
    if (err?.code === 11000) return true; // fallback already exists
    console.error('[messaging] SMS fallback failed to record:', err?.message || err);
    return false;
  }
}

/**
 * Tells the owner a message could not be delivered.
 *
 * Only for messages tied to a specific student — a failed broadcast is noise, a
 * failed fee reminder means a parent does not know they owe money.
 */
async function raiseDeliveryFailureAlert(
  message: IOutboundMessage,
  error: string,
  fallbackRaised: boolean
): Promise<void> {
  if (!message.academyId || !message.passportId) return;

  try {
    await OwnerAlert.create({
      academyId: message.academyId,
      type: 'message_delivery_failed',
      severity: message.priority === 1 ? 'critical' : 'warning',
      passportId: message.passportId,
      studentUserId: message.studentUserId ?? null,
      studentName: message.variableMap?.childName ?? null,
      parentPhone: message.recipientPhone,
      title: `Message to ${message.variableMap?.childName ?? 'a parent'} could not be delivered`,
      body:
        `The "${message.templateKey}" WhatsApp message to ${message.recipientPhone} failed: ${error}.` +
        (fallbackRaised ? ' An SMS fallback was attempted.' : ''),
      suggestedAction:
        'Check the number is on WhatsApp, or contact the parent directly.',
      requiresOwnerDecision: false,
      // One alert per message, not one per retry.
      dedupeKey: `message_delivery_failed:${String(message._id)}`,
    });
  } catch (err: any) {
    if (err?.code !== 11000) {
      console.error('[messaging] could not raise delivery alert:', err?.message || err);
    }
  }
}
