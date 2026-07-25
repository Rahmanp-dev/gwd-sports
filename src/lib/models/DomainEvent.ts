import mongoose, { Schema, Document } from 'mongoose';

/**
 * The internal event log. Every meaningful platform occurrence is appended here.
 *
 * This is deliberately a PERSISTED log rather than an in-process EventEmitter.
 * Phase 2's communication engine consumes these to send WhatsApp messages, and
 * an in-memory emitter would drop events on deploy, crash, or cold start — which
 * for a welcome message or a payment reminder means a parent silently never
 * hears from us. A collection also gives replay, an audit trail of what was
 * sent and why, and back-pressure handling for free.
 *
 * It doubles as the Phase 2 job queue: `status` + `availableAt` are what a
 * worker polls on.
 */
export type DomainEventName =
  | 'student.created'
  | 'payment.settled'
  | 'payment.failed'
  | 'attendance.created'
  | 'achievement.created'
  | 'fee.due'
  | 'fee.overdue';

export interface IDomainEvent extends Document {
  name: DomainEventName | string;
  /** Null for platform-global events. Every tenant-scoped event carries this. */
  academyId?: mongoose.Types.ObjectId | null;
  payload: Record<string, unknown>;

  status: 'pending' | 'processing' | 'done' | 'failed' | 'skipped';
  attempts: number;
  lastError?: string;
  /** Worker only picks up events whose availableAt has passed (enables backoff). */
  availableAt: Date;
  processedAt?: Date;

  /**
   * Optional idempotency key. A unique sparse index means emitting the "same"
   * event twice (e.g. a re-run import, a webhook replay) cannot produce two
   * messages to a parent.
   */
  dedupeKey?: string;

  createdAt: Date;
  updatedAt: Date;
}

const domainEventSchema = new Schema<IDomainEvent>(
  {
    name: { type: String, required: true, index: true },
    academyId: { type: Schema.Types.ObjectId, ref: 'Academy', default: null },
    payload: { type: Schema.Types.Mixed, default: {} },

    status: {
      type: String,
      enum: ['pending', 'processing', 'done', 'failed', 'skipped'],
      default: 'pending',
    },
    attempts: { type: Number, default: 0 },
    lastError: { type: String },
    availableAt: { type: Date, default: Date.now },
    processedAt: { type: Date },

    dedupeKey: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

// The worker's claim query: pending events that are due, oldest first.
domainEventSchema.index({ status: 1, availableAt: 1 });
domainEventSchema.index({ academyId: 1, name: 1, createdAt: -1 });

export const DomainEvent =
  mongoose.models.DomainEvent || mongoose.model<IDomainEvent>('DomainEvent', domainEventSchema);

export default DomainEvent;
