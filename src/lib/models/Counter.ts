import mongoose, { Schema, Document } from 'mongoose';

/**
 * Atomic, gapless sequence counters.
 *
 * Exists for receipt numbering, where "no gaps" is a real requirement rather
 * than a preference. Two settlements landing in the same millisecond — the
 * client verify call and the Razorpay webhook for two different payments — must
 * not receive the same number, and `findOneAndUpdate` with `$inc` and `upsert`
 * is the one operation MongoDB guarantees is atomic for this.
 *
 * NOT a general-purpose id generator. Anything that does not need a gapless
 * human-readable series should use an ObjectId, which needs no round trip and
 * no coordination.
 */
export interface ICounter extends Document {
  /** Scope of the series, e.g. "receipt:MGFC:2627". */
  key: string;
  value: number;
  updatedAt: Date;
}

const counterSchema = new Schema<ICounter>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export const Counter: mongoose.Model<ICounter> =
  (mongoose.models.Counter as mongoose.Model<ICounter>) ||
  mongoose.model<ICounter>('Counter', counterSchema);

/**
 * Returns the next value in a series, allocating the counter if it is new.
 *
 * The `$inc`-with-`upsert` is deliberate and load-bearing: a read-then-write
 * would let two concurrent settlements read 41 and both write 42, producing a
 * duplicate receipt number that a parent could reasonably treat as evidence of
 * a double charge.
 */
export async function nextInSequence(key: string): Promise<number> {
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return counter.value;
}

export default Counter;
