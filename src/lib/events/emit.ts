import mongoose from 'mongoose';
import DomainEvent, { type DomainEventName } from '@/lib/models/DomainEvent';

export interface EmitEventInput {
  name: DomainEventName | string;
  academyId?: mongoose.Types.ObjectId | string | null;
  payload: Record<string, unknown>;
  /**
   * Idempotency key. When supplied, a second emit with the same key is a no-op.
   * Use it for anything a parent would notice twice — welcome messages, receipts.
   */
  dedupeKey?: string;
  /** Delay before a consumer may pick this up. Used for scheduled reminders. */
  availableAt?: Date;
}

export interface EmitResult {
  emitted: boolean;
  /** True when a dedupeKey collision meant this event already existed. */
  duplicate: boolean;
  eventId?: string;
}

/**
 * Appends an event to the internal event log.
 *
 * INTENTIONALLY NON-THROWING. Emission is a side effect of a business action
 * that has already succeeded — a student has been created, a payment has been
 * credited. If the event log write fails we must not roll back or fail the
 * caller's request; a missing welcome message is recoverable, a failed import
 * of 60 students is not. Failures are logged and surfaced by the event-log
 * health check instead.
 *
 * Phase 2's worker is the consumer. Until it exists these rows simply
 * accumulate as `pending`, which is exactly the intended interface point.
 */
export async function emitEvent(input: EmitEventInput): Promise<EmitResult> {
  try {
    const doc = await DomainEvent.create({
      name: input.name,
      academyId: input.academyId ? new mongoose.Types.ObjectId(String(input.academyId)) : null,
      payload: input.payload,
      dedupeKey: input.dedupeKey,
      availableAt: input.availableAt ?? new Date(),
      status: 'pending',
      attempts: 0,
    });
    return { emitted: true, duplicate: false, eventId: String(doc._id) };
  } catch (err: any) {
    // Duplicate key on dedupeKey — the event already exists. This is a success
    // from the caller's perspective: the intended effect is already recorded.
    if (err?.code === 11000) {
      return { emitted: false, duplicate: true };
    }
    console.error(`[events] failed to emit ${input.name}:`, err?.message || err);
    return { emitted: false, duplicate: false };
  }
}

/**
 * Emits many events in one round trip. Used by bulk import, where emitting 80
 * welcome events one await at a time would add seconds to the request.
 *
 * `ordered: false` means one duplicate key does not abort the rest of the batch.
 */
export async function emitEvents(inputs: EmitEventInput[]): Promise<{
  emitted: number;
  duplicates: number;
}> {
  if (inputs.length === 0) return { emitted: 0, duplicates: 0 };

  const docs = inputs.map((input) => ({
    name: input.name,
    academyId: input.academyId ? new mongoose.Types.ObjectId(String(input.academyId)) : null,
    payload: input.payload,
    dedupeKey: input.dedupeKey,
    availableAt: input.availableAt ?? new Date(),
    status: 'pending' as const,
    attempts: 0,
  }));

  try {
    const inserted = await DomainEvent.insertMany(docs, { ordered: false });
    return { emitted: inserted.length, duplicates: inputs.length - inserted.length };
  } catch (err: any) {
    // A partial bulk write: some inserted, some collided on dedupeKey.
    const insertedCount: number = err?.result?.nInserted ?? err?.insertedDocs?.length ?? 0;
    const writeErrors: any[] = err?.writeErrors ?? [];
    const duplicates = writeErrors.filter((e) => e?.err?.code === 11000 || e?.code === 11000).length;

    if (duplicates !== writeErrors.length) {
      console.error(
        `[events] bulk emit had ${writeErrors.length - duplicates} non-duplicate failures`
      );
    }
    return { emitted: insertedCount, duplicates };
  }
}
