import { normalizePhone } from '@/lib/phone';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * CHANGING A USER'S EMAIL OR PHONE — what may change, who may change it, and
 * everything that has to move with it
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `PUT /api/admin/users/[id]` used to take the request body wholesale, drop
 * `password` and `refreshTokens`, and `$set` the rest onto the User. Three
 * things were wrong with that, in increasing order of severity.
 *
 * 1. NO FIELD ALLOWLIST. `role` was writable, so any academy admin could POST
 *    `{"role":"gwd_super_admin"}` at their own id and take over the platform.
 *    `academyId` was writable too, which moves a user between tenants.
 *
 * 2. NO TENANT SCOPING. The DELETE handler immediately below it had careful
 *    academy scoping added; PUT never got the same treatment, so an academy
 *    admin could edit ANY user on the platform by id — another academy's
 *    owner included.
 *
 * 3. NO CASCADE. This is the part that looks harmless and is not. A parent's
 *    phone number is stored in four places on purpose, because the systems
 *    that read it must not have to join across collections at send time:
 *
 *      User.phone                      the account
 *      StudentProfile.parentPhone      the academy's enrolment record
 *      StudentProfile.parentPhoneE164  the normalised form messaging reads
 *      Passport.parentPhone            the child's permanent record
 *      Passport.identityKey            `${phone}::${normalised name}` — UNIQUE
 *
 *    Writing only the first leaves attendance confirmations, fee reminders,
 *    the weekly digest and every broadcast still addressed to the old number.
 *    Nothing errors. The parent simply stops hearing from the academy, and the
 *    academy has no way to notice.
 *
 *    Worse, `identityKey` is uniquely indexed and is what makes "never create a
 *    second Passport for the same child" a database guarantee. Leave it stale
 *    and the next import carrying the new number no longer matches — so the
 *    child gets a duplicate Passport with a fresh, empty history.
 *
 * This module is the pure half: what a change means and whether it is allowed.
 * The write half is applyIdentityChange.ts, which needs a database.
 * ════════════════════════════════════════════════════════════════════════════
 */

/**
 * Fields an academy admin may write on a user in their own academy.
 *
 * `sports` is here because the existing admin form edits it for trainers —
 * leaving it out would have silently stopped that saving, trading one bug for
 * another. It is safe: it grants no access, it only labels what someone
 * coaches.
 */
export const ADMIN_WRITABLE = ['name', 'email', 'phone', 'sports', 'isActive'] as const;

/**
 * Additionally writable by a platform admin. `role` and `academyId` are here
 * and nowhere else: they are the two fields that decide what somebody can see,
 * so they are the two an academy admin must never be able to set.
 */
export const SUPER_ADMIN_WRITABLE = [...ADMIN_WRITABLE, 'role', 'academyId'] as const;

export type WritableField = (typeof SUPER_ADMIN_WRITABLE)[number];

export function writableFieldsFor(role: string): readonly WritableField[] {
  return role === 'gwd_super_admin' ? SUPER_ADMIN_WRITABLE : ADMIN_WRITABLE;
}

/**
 * Reduces an untrusted body to the fields this actor may write.
 *
 * Returns the rejected keys as well as the accepted ones. Silently dropping a
 * field an admin thought they were setting is how "I changed it and it didn't
 * save" bug reports are born — the route reports them back.
 */
export function pickWritable(
  body: Record<string, unknown>,
  actorRole: string
): { updates: Record<string, unknown>; rejected: string[] } {
  const allowed = writableFieldsFor(actorRole);
  const updates: Record<string, unknown> = {};
  const rejected: string[] = [];

  for (const [key, value] of Object.entries(body ?? {})) {
    if ((allowed as readonly string[]).includes(key)) updates[key] = value;
    else rejected.push(key);
  }
  return { updates, rejected };
}

/** RFC-shaped enough for a login identifier; deliberately not a full grammar. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type FieldError = { field: string; reason: string };

export interface NormalisedIdentity {
  name?: string;
  email?: string;
  phone?: string;
  /** E.164, derived from `phone`. What messaging and the passport key use. */
  phoneE164?: string;
  /**
   * The national form, e.g. "98765 43210".
   *
   * Carried separately because the two phone columns on StudentProfile are NOT
   * the same format: `parentPhoneE164` is functional and E.164, `parentPhone`
   * is what the import path writes as `phone.national` and is displayed.
   * Writing E.164 into both would work but would drift from every row the
   * importer has ever created.
   */
  phoneNational?: string;
  isActive?: boolean;
  sports?: string[];
  role?: string;
  academyId?: string | null;
}

export type NormaliseResult =
  | { ok: true; value: NormalisedIdentity }
  | { ok: false; errors: FieldError[] };

const ROLES = ['student', 'trainer', 'admin', 'gwd_super_admin'] as const;

/**
 * Validates and canonicalises the accepted fields.
 *
 * Email is lowercased and trimmed — an admin typing `Rahul@Example.COM` must
 * not create an account that fails to match the login form's lowercase input.
 * Phone goes through the same normaliser the import path uses, so a number
 * entered here and the same number entered on an import produce one key rather
 * than two.
 */
export function normaliseIdentity(updates: Record<string, unknown>): NormaliseResult {
  const errors: FieldError[] = [];
  const value: NormalisedIdentity = {};

  if ('name' in updates) {
    const name = String(updates.name ?? '').trim().replace(/\s+/g, ' ');
    if (name.length < 2) errors.push({ field: 'name', reason: 'Name is too short.' });
    else value.name = name;
  }

  if ('email' in updates) {
    const raw = String(updates.email ?? '').trim().toLowerCase();
    if (!raw) errors.push({ field: 'email', reason: 'Email cannot be empty.' });
    else if (!EMAIL.test(raw)) errors.push({ field: 'email', reason: 'That is not a valid email address.' });
    else value.email = raw;
  }

  if ('phone' in updates) {
    const raw = updates.phone;
    // An empty phone is a deliberate clear, not an error — a trainer may have
    // no number on file. But it cannot be cleared for someone whose passport
    // key depends on it; the write half enforces that, where it can see.
    if (raw === '' || raw === null) {
      value.phone = '';
    } else {
      const parsed = normalizePhone(raw);
      if (!parsed) {
        errors.push({
          field: 'phone',
          reason: 'Enter a 10-digit Indian mobile number.',
        });
      } else {
        value.phone = parsed.e164;
        value.phoneE164 = parsed.e164;
        value.phoneNational = parsed.national;
      }
    }
  }

  if ('isActive' in updates) {
    value.isActive = Boolean(updates.isActive);
  }

  if ('sports' in updates) {
    const raw = updates.sports;
    if (!Array.isArray(raw)) {
      errors.push({ field: 'sports', reason: 'Sports must be a list.' });
    } else {
      // Deduped and lowercased to match how every other writer stores them.
      value.sports = [
        ...new Set(
          raw
            .map((s) => String(s ?? '').trim().toLowerCase())
            .filter(Boolean)
        ),
      ];
    }
  }

  if ('role' in updates) {
    const role = String(updates.role ?? '');
    if (!(ROLES as readonly string[]).includes(role)) {
      errors.push({ field: 'role', reason: `Role must be one of: ${ROLES.join(', ')}.` });
    } else value.role = role;
  }

  if ('academyId' in updates) {
    const raw = updates.academyId;
    value.academyId = raw === null || raw === '' ? null : String(raw);
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, value };
}

export interface IdentityDiff {
  emailChanged: boolean;
  phoneChanged: boolean;
  nameChanged: boolean;
  /** True when the Passport identity key must be rebuilt — phone OR name. */
  identityKeyAffected: boolean;
}

/**
 * What actually changed, against the stored values.
 *
 * `identityKeyAffected` covers NAME as well as phone, because the key is built
 * from both. Renaming a student without rebuilding it strands the passport in
 * exactly the same way a phone change does — a subtler bug, since nobody
 * expects a spelling correction to break duplicate detection.
 */
export function diffIdentity(
  current: { name?: string | null; email?: string | null; phone?: string | null },
  next: NormalisedIdentity
): IdentityDiff {
  const emailChanged =
    next.email !== undefined &&
    next.email !== String(current.email ?? '').trim().toLowerCase();

  const phoneChanged =
    next.phone !== undefined && next.phone !== String(current.phone ?? '').trim();

  const nameChanged =
    next.name !== undefined && next.name !== String(current.name ?? '').trim();

  return {
    emailChanged,
    phoneChanged,
    nameChanged,
    identityKeyAffected: phoneChanged || nameChanged,
  };
}
