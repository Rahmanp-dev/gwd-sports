import { describe, it, expect } from 'vitest';
import {
  validateBroadcastBody,
  dedupeByPhone,
  renderBroadcastPreview,
  BROADCAST_MAX_LENGTH,
  BROADCAST_MIN_LENGTH,
} from './broadcast';

/** Convenience: unwraps a successful validation or fails loudly. */
function accepted(input: string): string {
  const result = validateBroadcastBody(input);
  if (!result.ok) throw new Error(`expected acceptance, got: ${result.reason}`);
  return result.body;
}

function rejected(input: unknown): string {
  const result = validateBroadcastBody(input);
  if (result.ok) throw new Error('expected rejection, got acceptance');
  return result.reason;
}

describe('validateBroadcastBody — the passport-id guard', () => {
  /**
   * This is the check the whole module exists for. Every other template runs
   * assertVariablesBelongTo, which refuses to send if a variable references a
   * passport other than the message's own. A broadcast has no passport, so that
   * check cannot run — and without this one, a pasted "GWD-4P8QRT hasn't paid"
   * would go to every parent in the academy.
   */
  it('refuses a body containing a passport id', () => {
    const reason = rejected('Reminder: GWD-4P8QRT still owes this month.');
    expect(reason).toMatch(/GWD-4P8QRT/);
    expect(reason).toMatch(/privacy leak/i);
  });

  it('names the offending passport so the owner can find it', () => {
    expect(rejected('Please check GWD-7K2M9X before Sunday.')).toContain('GWD-7K2M9X');
  });

  it('catches a passport id embedded in a URL', () => {
    expect(() => accepted('See https://gwd.in/passport/GWD-7K2M9X for details')).toThrow();
  });

  it('does not false-positive on ordinary text that merely says GWD', () => {
    expect(accepted('Welcome to the GWD platform, everyone.')).toBeTruthy();
    expect(accepted('Our GWD-registered coaches will be present.')).toBeTruthy();
  });

  it('does not false-positive on the ambiguous characters excluded from the alphabet', () => {
    // The passport alphabet deliberately omits 0/1/I/L/O/U, so a token using
    // them is not a passport id and must not be rejected.
    expect(accepted('Bus route GWD-101ILO leaves at 7am sharp.')).toBeTruthy();
  });
});

describe('validateBroadcastBody — length and shape', () => {
  it('rejects a non-string', () => {
    expect(rejected(undefined)).toMatch(/required/i);
    expect(rejected(42)).toMatch(/required/i);
    expect(rejected(null)).toMatch(/required/i);
  });

  it('rejects a body under the minimum', () => {
    expect(rejected('ok')).toMatch(new RegExp(`${BROADCAST_MIN_LENGTH} characters`));
  });

  it('rejects a body over the maximum and says by how much', () => {
    const reason = rejected('a'.repeat(BROADCAST_MAX_LENGTH + 50));
    expect(reason).toMatch(new RegExp(`${BROADCAST_MAX_LENGTH + 50} characters`));
  });

  it('accepts a body exactly at the maximum', () => {
    expect(accepted('a'.repeat(BROADCAST_MAX_LENGTH))).toHaveLength(BROADCAST_MAX_LENGTH);
  });

  it('collapses newlines and tabs, because Meta rejects them in parameters', () => {
    const body = accepted('Practice cancelled.\n\nGround is waterlogged.\tSee you Tuesday.');
    expect(body).toBe('Practice cancelled. Ground is waterlogged. See you Tuesday.');
    expect(body).not.toMatch(/[\r\n\t]/);
  });

  it('normalises before measuring length, so the preview matches what is sent', () => {
    // Whitespace collapse must happen before the length check, or an owner can
    // be told they are over the limit by characters that will be removed.
    const padded = `${'a'.repeat(BROADCAST_MAX_LENGTH)}\n\n\n`;
    expect(accepted(padded)).toHaveLength(BROADCAST_MAX_LENGTH);
  });

  it('trims surrounding whitespace', () => {
    expect(accepted('   Training resumes Monday.   ')).toBe('Training resumes Monday.');
  });
});

describe('dedupeByPhone', () => {
  /**
   * Siblings share a parent's mobile. This is not cosmetic: the frequency cap
   * is applied per phone number, so a family with three children would receive
   * the announcement three times AND burn that parent's entire daily budget,
   * silently deferring the fee reminder meant for the same evening.
   */
  it('keeps one recipient per phone number', () => {
    const students = [
      { name: 'Rohan', parentPhoneE164: '+919876543210' },
      { name: 'Anaya', parentPhoneE164: '+919876543210' },
      { name: 'Vikram', parentPhoneE164: '+919812345678' },
    ];
    const unique = dedupeByPhone(students);
    expect(unique).toHaveLength(2);
    expect(unique.map((s) => s.name)).toEqual(['Rohan', 'Vikram']);
  });

  it('drops students with no parent number rather than queueing an empty send', () => {
    const students = [
      { name: 'Rohan', parentPhoneE164: '+919876543210' },
      { name: 'Ghost', parentPhoneE164: null },
      { name: 'Nobody' },
    ];
    expect(dedupeByPhone(students as any)).toHaveLength(1);
  });

  it('preserves order, so the first-listed sibling is the one addressed', () => {
    const students = [
      { name: 'A', parentPhoneE164: '+911' },
      { name: 'B', parentPhoneE164: '+912' },
      { name: 'C', parentPhoneE164: '+911' },
    ];
    expect(dedupeByPhone(students).map((s) => s.name)).toEqual(['A', 'B']);
  });

  it('handles an empty roster', () => {
    expect(dedupeByPhone([])).toEqual([]);
  });
});

describe('renderBroadcastPreview', () => {
  it('shows exactly what the handset will show, academy name included', () => {
    const preview = renderBroadcastPreview(
      'Practice cancelled this Sunday.',
      'MasterGrade Cricket'
    );
    expect(preview).toBe('Practice cancelled this Sunday. — MasterGrade Cricket');
  });

  it('is built from the same template the send path uses', () => {
    // If the broadcast template's plainText ever changes, this preview changes
    // with it — the owner cannot be shown one thing and send another.
    const body = accepted('Kit collection moved to Saturday morning.');
    expect(renderBroadcastPreview(body, 'Academy X')).toContain(body);
  });
});
