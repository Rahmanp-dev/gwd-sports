import mongoose, { Schema, Document } from 'mongoose';

/**
 * One outbound message to one parent. This collection is simultaneously the
 * queue, the scheduler, and the delivery-tracking ledger.
 *
 * WHY MONGO AND NOT BULL/REDIS: there was no Redis in this stack and adding it
 * would mean new infrastructure for a workload measured in hundreds of messages
 * a day. More importantly, delivery status tracking per message is a hard
 * requirement — sent/delivered/read/failed has to be queryable and durable — so
 * a persisted row per message was needed regardless. Given that row exists, a
 * separate queue would just be a second source of truth to keep in sync.
 *
 * The queue semantics live in three fields:
 *   scheduledFor  — the earliest moment this may be sent
 *   priority      — who wins a contested daily budget slot (lower = higher)
 *   status        — 'queued' is claimable, everything else is not
 */

/**
 * Priority order, from the brief: payment reminders beat attendance
 * confirmations, which beat achievements, which beat general broadcasts.
 * Numeric so that sorting is the whole implementation.
 */
export const MESSAGE_PRIORITY = {
  PAYMENT: 1,
  ATTENDANCE: 2,
  ACHIEVEMENT: 3,
  BROADCAST: 4,
} as const;

export type MessagePriority = (typeof MESSAGE_PRIORITY)[keyof typeof MESSAGE_PRIORITY];

export type MessageStatus =
  | 'queued'      // waiting for its scheduledFor, or for a budget slot
  | 'sending'     // claimed by a worker; guards against double-send
  | 'sent'        // handed to the BSP, provider accepted it
  | 'delivered'   // BSP confirms it reached the handset
  | 'read'        // parent opened it
  | 'failed'      // permanently failed after retries, or rejected outright
  | 'cancelled'   // superseded before sending (e.g. fee paid before the reminder went out)
  | 'skipped';    // intentionally not sent (no provider configured, cap policy)

export type MessageChannel = 'whatsapp' | 'sms';

export interface IOutboundMessage extends Document {
  academyId?: mongoose.Types.ObjectId | null;

  /**
   * The student this message is ABOUT. Central to the anti-cross-contamination
   * check: rendered variables are validated against this passport before send,
   * so a template loop bug cannot send one child's name to another's parent.
   */
  passportId?: string | null;
  studentUserId?: mongoose.Types.ObjectId | null;

  /** E.164. The frequency cap is applied per this value. */
  recipientPhone: string;
  recipientName?: string | null;

  channel: MessageChannel;
  templateKey: string;
  /** Ordered variable values, positional as the BSP template expects. */
  variables: string[];
  /** Named variables kept alongside for debugging and validation. */
  variableMap: Record<string, string>;
  /** Rendered plain text, for SMS fallback and for the audit trail. */
  bodyPreview?: string | null;

  priority: number;
  status: MessageStatus;

  /** Earliest permitted send time. Deferral moves this forward. */
  scheduledFor: Date;
  /**
   * Parent-local day this message counted against, "YYYY-MM-DD". Only set once
   * sent. Budget queries group on it, so the cap follows the parent's calendar
   * day rather than UTC's.
   */
  sentOnLocalDate?: string | null;

  attempts: number;
  /** How many times this was pushed for lack of a budget slot. */
  deferrals: number;
  lastDeferralReason?: string | null;

  provider?: string | null;
  providerMessageId?: string | null;

  sentAt?: Date | null;
  deliveredAt?: Date | null;
  readAt?: Date | null;
  failedAt?: Date | null;
  error?: string | null;

  /** Set on an SMS that exists because a WhatsApp message failed. */
  fallbackForMessageId?: mongoose.Types.ObjectId | null;
  /** Set on the WhatsApp message once a fallback SMS has been raised. */
  fallbackMessageId?: mongoose.Types.ObjectId | null;

  /** The DomainEvent that caused this, when there was one. */
  sourceEventId?: mongoose.Types.ObjectId | null;

  /**
   * Idempotency. Unique sparse, so the same trigger firing twice — a replayed
   * event, a re-run cron, a double-clicked import — cannot message a parent
   * twice about the same thing.
   */
  dedupeKey?: string;

  createdAt: Date;
  updatedAt: Date;
}

const outboundMessageSchema = new Schema<IOutboundMessage>(
  {
    academyId: { type: Schema.Types.ObjectId, ref: 'Academy', default: null },

    passportId: { type: String, default: null, uppercase: true, trim: true },
    studentUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    recipientPhone: { type: String, required: true, trim: true },
    recipientName: { type: String, default: null, trim: true },

    channel: { type: String, enum: ['whatsapp', 'sms'], default: 'whatsapp' },
    templateKey: { type: String, required: true },
    variables: { type: [String], default: [] },
    variableMap: { type: Schema.Types.Mixed, default: {} },
    bodyPreview: { type: String, default: null },

    priority: { type: Number, required: true, min: 1, max: 4 },
    status: {
      type: String,
      enum: [
        'queued',
        'sending',
        'sent',
        'delivered',
        'read',
        'failed',
        'cancelled',
        'skipped',
      ],
      default: 'queued',
    },

    scheduledFor: { type: Date, required: true, default: Date.now },
    sentOnLocalDate: { type: String, default: null },

    attempts: { type: Number, default: 0 },
    deferrals: { type: Number, default: 0 },
    lastDeferralReason: { type: String, default: null },

    provider: { type: String, default: null },
    providerMessageId: { type: String, default: null },

    sentAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    error: { type: String, default: null },

    fallbackForMessageId: { type: Schema.Types.ObjectId, ref: 'OutboundMessage', default: null },
    fallbackMessageId: { type: Schema.Types.ObjectId, ref: 'OutboundMessage', default: null },

    sourceEventId: { type: Schema.Types.ObjectId, ref: 'DomainEvent', default: null },

    dedupeKey: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

// The worker's claim query: due, queued, best priority first.
outboundMessageSchema.index({ status: 1, scheduledFor: 1, priority: 1 });
// The frequency-cap query: how many went to this parent on this local day.
outboundMessageSchema.index({ recipientPhone: 1, sentOnLocalDate: 1 });
// Provider status callbacks arrive keyed on the provider's own id.
outboundMessageSchema.index({ providerMessageId: 1 }, { sparse: true });
// Per-academy message log for the owner dashboard.
outboundMessageSchema.index({ academyId: 1, createdAt: -1 });
outboundMessageSchema.index({ passportId: 1, createdAt: -1 });

export const OutboundMessage: mongoose.Model<IOutboundMessage> =
  (mongoose.models.OutboundMessage as mongoose.Model<IOutboundMessage>) ||
  mongoose.model<IOutboundMessage>('OutboundMessage', outboundMessageSchema);

export default OutboundMessage;
