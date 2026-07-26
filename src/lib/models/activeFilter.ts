/**
 * ════════════════════════════════════════════════════════════════════════════
 * "ACTIVE" MEANS "NOT DEACTIVATED", NOT "isActive === true"
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Mongoose schema defaults are applied when a document is created THROUGH
 * MONGOOSE. A row written by a bulk import, a direct driver insert, a migration
 * or an older code path can be missing `isActive` entirely — and in MongoDB a
 * missing field does NOT match `{ isActive: true }`.
 *
 * That is not theoretical. A live student's profile had no `isActive` field, so
 * `findOne({ userId, isActive: true })` returned null and they were told
 * "Only a student account can check in" while signed in as exactly that. The
 * same record was also invisible to their coach's attendance register, which
 * filters batch members the same way.
 *
 * `{ $ne: false }` matches `true` and matches missing, and excludes only a
 * record somebody deliberately switched off — which is what every one of these
 * call sites actually means. Preferred over backfilling the data because it
 * also protects every row written by any future path that forgets the field.
 * ════════════════════════════════════════════════════════════════════════════
 */
export const ACTIVE: { $ne: false } = { $ne: false };
