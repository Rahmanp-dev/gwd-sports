import { describe, it, expect } from 'vitest';
import {
  pickWritable,
  normaliseIdentity,
  diffIdentity,
  writableFieldsFor,
  ADMIN_WRITABLE,
} from './identityChange';

/**
 * The allowlist is the fix for a privilege-escalation hole: the previous
 * handler `$set` whatever arrived, so `{"role":"gwd_super_admin"}` posted at
 * your own id took over the platform. These are the tests that must never be
 * quietly relaxed.
 */
describe('pickWritable — the escalation guard', () => {
  it('refuses role and academyId from an academy admin', () => {
    const { updates, rejected } = pickWritable(
      { name: 'Rahul', role: 'gwd_super_admin', academyId: 'other-academy' },
      'admin'
    );
    expect(updates).toEqual({ name: 'Rahul' });
    expect(rejected.sort()).toEqual(['academyId', 'role']);
  });

  it('allows role and academyId for a platform admin', () => {
    const { updates, rejected } = pickWritable(
      { role: 'trainer', academyId: 'a1' },
      'gwd_super_admin'
    );
    expect(updates).toEqual({ role: 'trainer', academyId: 'a1' });
    expect(rejected).toEqual([]);
  });

  it('never lets credentials through, for anyone', () => {
    const { updates, rejected } = pickWritable(
      { password: 'hunter2', refreshTokens: ['x'], passwordHash: 'y', email: 'a@b.co' },
      'gwd_super_admin'
    );
    expect(updates).toEqual({ email: 'a@b.co' });
    expect(rejected.sort()).toEqual(['passwordHash', 'password', 'refreshTokens'].sort());
  });

  it('reports what it dropped rather than silently ignoring it', () => {
    const { rejected } = pickWritable({ nonsense: 1, alsoNonsense: 2 }, 'admin');
    expect(rejected.sort()).toEqual(['alsoNonsense', 'nonsense']);
  });

  it('survives a null or empty body', () => {
    expect(pickWritable(null as any, 'admin')).toEqual({ updates: {}, rejected: [] });
    expect(pickWritable({}, 'admin')).toEqual({ updates: {}, rejected: [] });
  });

  it('does not expose role or academyId in the academy-admin allowlist at all', () => {
    expect(writableFieldsFor('admin')).toEqual(ADMIN_WRITABLE);
    expect(ADMIN_WRITABLE).not.toContain('role');
    expect(ADMIN_WRITABLE).not.toContain('academyId');
  });
});

describe('normaliseIdentity', () => {
  it('lowercases and trims email so it matches what the login form sends', () => {
    const r = normaliseIdentity({ email: '  Rahul@Example.COM ' });
    expect(r.ok && r.value.email).toBe('rahul@example.com');
  });

  it('rejects a malformed email rather than storing an unusable login', () => {
    for (const bad of ['', 'nope', 'a@b', 'a b@c.com', '@example.com']) {
      const r = normaliseIdentity({ email: bad });
      expect(r.ok, `expected ${JSON.stringify(bad)} to fail`).toBe(false);
    }
  });

  it('normalises a phone to E.164 through the same path imports use', () => {
    for (const raw of ['9876543210', '+91 98765 43210', '09876543210', '0091-9876543210']) {
      const r = normaliseIdentity({ phone: raw });
      expect(r.ok && r.value.phone, raw).toBe('+919876543210');
    }
  });

  it('carries the national form separately from E.164', () => {
    // StudentProfile stores BOTH: parentPhoneE164 is functional, parentPhone is
    // the displayed national form that lib/import/commit.ts writes. Collapsing
    // them would drift from every row the importer has created.
    const r = normaliseIdentity({ phone: '+919876543210' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.phoneE164).toBe('+919876543210');
    expect(r.value.phoneNational).toBeTruthy();
    expect(r.value.phoneNational).not.toBe(r.value.phoneE164);
  });

  it('rejects a number it cannot confidently interpret', () => {
    for (const bad of ['12345', '1234567890', 'abcdefghij']) {
      expect(normaliseIdentity({ phone: bad }).ok, bad).toBe(false);
    }
  });

  it('treats an empty phone as a deliberate clear, not an error', () => {
    const r = normaliseIdentity({ phone: '' });
    expect(r.ok && r.value.phone).toBe('');
  });

  it('rejects an unknown role', () => {
    expect(normaliseIdentity({ role: 'root' }).ok).toBe(false);
    expect(normaliseIdentity({ role: 'trainer' }).ok).toBe(true);
  });

  it('collects every problem, not just the first', () => {
    const r = normaliseIdentity({ email: 'bad', phone: '123', name: 'x' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => e.field).sort()).toEqual(['email', 'name', 'phone']);
  });

  it('leaves untouched fields absent so a partial edit stays partial', () => {
    const r = normaliseIdentity({ name: 'Rahul Verma' });
    expect(r.ok && Object.keys(r.value)).toEqual(['name']);
  });
});

describe('diffIdentity — what has to cascade', () => {
  const current = { name: 'Rohan Sharma', email: 'rohan@x.com', phone: '+919876543210' };

  it('spots a real phone change', () => {
    const d = diffIdentity(current, { phone: '+919999888877' });
    expect(d.phoneChanged).toBe(true);
    expect(d.identityKeyAffected).toBe(true);
  });

  it('does not treat a no-op resubmit as a change', () => {
    const d = diffIdentity(current, {
      name: 'Rohan Sharma',
      email: 'rohan@x.com',
      phone: '+919876543210',
    });
    expect(d).toEqual({
      emailChanged: false,
      phoneChanged: false,
      nameChanged: false,
      identityKeyAffected: false,
    });
  });

  it('flags a NAME change as affecting the passport key', () => {
    // The subtle one. identityKey is `${phone}::${normalised name}`, so a
    // spelling correction strands duplicate detection exactly as a phone
    // change does — and nobody expects that.
    const d = diffIdentity(current, { name: 'Rohan Sharmaa' });
    expect(d.nameChanged).toBe(true);
    expect(d.identityKeyAffected).toBe(true);
  });

  it('compares email case-insensitively against what is stored', () => {
    const d = diffIdentity({ ...current, email: 'Rohan@X.com' }, { email: 'rohan@x.com' });
    expect(d.emailChanged).toBe(false);
  });

  it('handles a user with nothing on file yet', () => {
    const d = diffIdentity({}, { phone: '+919876543210' });
    expect(d.phoneChanged).toBe(true);
  });
});
