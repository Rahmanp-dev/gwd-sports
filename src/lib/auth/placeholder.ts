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
 * WHAT THIS FLAG MEANS: the address is synthetic and cannot receive mail. It
 * does NOT mean "cannot log in" — the import issues each account a real, random
 * password which the parent receives in their welcome message.
 *
 * WHAT IT GATES: the email-based recovery flows, and only those.
 *
 *  1. The address is DERIVED FROM THE PASSPORT ID, which is public — printed on
 *     the passport page, texted to parents, forwarded into group chats. Anyone
 *     holding a passport id can construct it.
 *  2. Nothing prevented running "forgot password" against one. That mints and
 *     stores a working reset token for an account the requester does not own,
 *     addressed to a mailbox that does not exist.
 *  3. Login is safe because it is protected by the password itself, like any
 *     other account. Password RESET is not, because it bypasses the password.
 * ════════════════════════════════════════════════════════════════════════════
 */

/**
 * Synthetic addresses live under a `.gwd.in` subdomain — historically
 * `@import.gwd.in`, now `@<academy-slug>.gwd.in` so a parent reading their
 * credentials sees their own academy. Both are matched.
 */
export const IMPORT_PLACEHOLDER_DOMAIN = '@import.gwd.in';
export const IMPORT_PLACEHOLDER_SUFFIX = '.gwd.in';

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

  const email = String(user.email ?? '').toLowerCase();
  if (email.endsWith(IMPORT_PLACEHOLDER_DOMAIN)) return true;

  // Academy-branded variants: `<passport>@<slug>.gwd.in`. Only the host part is
  // considered, so a real address like `someone@notgwd.in` is untouched.
  const host = email.slice(email.lastIndexOf('@') + 1);
  return Boolean(host) && host !== 'gwd.in' && host.endsWith(IMPORT_PLACEHOLDER_SUFFIX);
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
