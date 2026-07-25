/**
 * ════════════════════════════════════════════════════════════════════════════
 * ACCOUNTS THAT EXIST BUT NOBODY OWNS
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Bulk import creates a User for every student, because a StudentProfile needs
 * one. `User.email` is required and uniquely indexed, so imported students get
 * a synthetic address — `gwd-7k2m9x@import.gwd.in` — and are flagged
 * `isImportedPlaceholder: true`.
 *
 * THE HOLE THIS CLOSES, flagged in Session 1 and open until now:
 *
 *  1. Those addresses are DERIVED FROM THE PASSPORT ID, which is public — it is
 *     printed in URLs, texted to parents and forwarded. Anyone holding a
 *     passport id can construct the account's email address.
 *  2. Nothing prevented running "forgot password" against one. On a deployment
 *     with email configured, that sends a working reset link for an account the
 *     attacker does not own — to a mailbox on a domain that may not even exist,
 *     but the token is minted and stored regardless.
 *  3. A placeholder has no password anybody chose, so login was never the main
 *     risk. The reset flow was.
 *
 * These accounts are placeholders for a RECORD, not credentials for a person.
 * A parent who wants real access registers properly and gets a real account.
 * Until then, no authentication path may treat one as a login.
 * ════════════════════════════════════════════════════════════════════════════
 */

/** The synthetic domain minted by lib/import/commit.ts. */
export const IMPORT_PLACEHOLDER_DOMAIN = '@import.gwd.in';

export interface PlaceholderCheckable {
  isImportedPlaceholder?: boolean | null;
  email?: string | null;
}

/**
 * Belt and braces: the flag is authoritative, but the domain check catches any
 * record written before the flag existed, or by a path that forgot to set it.
 * Getting this wrong fails open, so it checks both.
 */
export function isPlaceholderAccount(user: PlaceholderCheckable | null | undefined): boolean {
  if (!user) return false;
  if (user.isImportedPlaceholder === true) return true;
  return String(user.email ?? '')
    .toLowerCase()
    .endsWith(IMPORT_PLACEHOLDER_DOMAIN);
}

/**
 * What to tell the caller.
 *
 * Deliberately identical to the "no such account" message on the login path —
 * distinguishing them would confirm that a given passport id maps to a real
 * student, which is exactly what the public passport id must not reveal.
 */
export const PLACEHOLDER_LOGIN_MESSAGE = 'Invalid credentials';

/**
 * On the registration-facing paths a distinct message IS correct: the person is
 * holding their own child's details and needs to be told what to do next, not
 * stonewalled.
 */
export const PLACEHOLDER_SIGNUP_MESSAGE =
  'This student was added by their academy and does not have a login yet. Register with your own email address to create one.';
