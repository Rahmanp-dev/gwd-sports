import { describe, it, expect } from 'vitest';
import {
  isPlaceholderAccount,
  IMPORT_PLACEHOLDER_DOMAIN,
  PLACEHOLDER_LOGIN_MESSAGE,
  PLACEHOLDER_SIGNUP_MESSAGE,
} from './placeholder';

describe('isPlaceholderAccount', () => {
  it('trusts the flag', () => {
    expect(isPlaceholderAccount({ isImportedPlaceholder: true, email: 'real@person.com' })).toBe(
      true
    );
  });

  /**
   * Belt and braces. The flag is authoritative, but a record written before it
   * existed — or by a path that forgot to set it — must still be caught.
   * Getting this wrong fails OPEN, which is why both are checked.
   */
  it('falls back to the synthetic domain when the flag is missing', () => {
    expect(isPlaceholderAccount({ email: 'gwd-7k2m9x@import.gwd.in' })).toBe(true);
    expect(isPlaceholderAccount({ isImportedPlaceholder: false, email: 'gwd-7k2m9x@import.gwd.in' })).toBe(
      true
    );
  });

  it('is case-insensitive, because emails are stored lowercased inconsistently', () => {
    expect(isPlaceholderAccount({ email: 'GWD-7K2M9X@IMPORT.GWD.IN' })).toBe(true);
  });

  it('catches the academy-branded variants', () => {
    // Imports now mint `<passport>@<academy-slug>.gwd.in` so a parent reading
    // their credentials sees their own academy rather than the word "import".
    expect(isPlaceholderAccount({ email: 'gwd-7k2m9x@mastergrade.gwd.in' })).toBe(true);
    expect(isPlaceholderAccount({ email: 'gwd-7k2m9x@mgfc-mumbai.gwd.in' })).toBe(true);
  });

  it('does not catch a real address at gwd.in itself', () => {
    // Staff mailboxes on the bare domain are genuine and must keep working.
    expect(isPlaceholderAccount({ email: 'coach@gwd.in' })).toBe(false);
  });

  it('leaves real accounts alone', () => {
    expect(isPlaceholderAccount({ email: 'meera@gmail.com' })).toBe(false);
    expect(isPlaceholderAccount({ isImportedPlaceholder: false, email: 'meera@gmail.com' })).toBe(
      false
    );
  });

  /**
   * A real address that merely CONTAINS the domain string must not be caught —
   * locking a genuine parent out of their own account is the failure mode on
   * the other side of this check.
   */
  it('matches the domain as a suffix, not a substring', () => {
    expect(isPlaceholderAccount({ email: 'someone@import.gwd.in.example.com' })).toBe(false);
    expect(isPlaceholderAccount({ email: 'import.gwd.in@gmail.com' })).toBe(false);
  });

  it('handles missing and malformed input rather than throwing', () => {
    expect(isPlaceholderAccount(null)).toBe(false);
    expect(isPlaceholderAccount(undefined)).toBe(false);
    expect(isPlaceholderAccount({})).toBe(false);
    expect(isPlaceholderAccount({ email: null })).toBe(false);
  });

  it('uses the domain the importer actually mints', () => {
    // Pinned against lib/import/commit.ts. If the importer's domain changes and
    // this does not, the guard silently stops matching.
    expect(IMPORT_PLACEHOLDER_DOMAIN).toBe('@import.gwd.in');
  });
});

describe('the messages', () => {
  /**
   * On the login path the message must be indistinguishable from "no such
   * account". Anything else confirms that a given passport id maps to a real
   * student — and passport ids are public, printed and forwarded.
   */
  it('does not leak existence on the login path', () => {
    expect(PLACEHOLDER_LOGIN_MESSAGE).toBe('Invalid credentials');
  });

  it('does tell a registering parent what to do', () => {
    // Different trade-off: this person is holding their own child's details.
    expect(PLACEHOLDER_SIGNUP_MESSAGE).toMatch(/register/i);
    expect(PLACEHOLDER_SIGNUP_MESSAGE).not.toBe(PLACEHOLDER_LOGIN_MESSAGE);
  });
});
