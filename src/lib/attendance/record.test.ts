import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * DomainEvent is the only thing in this module that touches the database, so it
 * is the only thing mocked. Everything else — the precedence rules, the upsert
 * matching, the decision to emit — runs for real.
 */
const created: any[] = [];
let nextCreateError: any = null;

vi.mock('@/lib/models/DomainEvent', () => ({
  default: {
    create: vi.fn(async (doc: any) => {
      if (nextCreateError) {
        const err = nextCreateError;
        nextCreateError = null;
        throw err;
      }
      // Stand in for the unique sparse index on dedupeKey.
      if (created.some((existing) => existing.dedupeKey === doc.dedupeKey)) {
        const err: any = new Error('duplicate key');
        err.code = 11000;
        throw err;
      }
      created.push(doc);
      return doc;
    }),
  },
}));

const { recordAttendance } = await import('./record');
const { resolveSession } = await import('./session');

const IST = 330;
function ist(day: number, hour: number, minute = 0): Date {
  return new Date(Date.UTC(2026, 6, day, hour, minute) - IST * 60_000);
}

const BATCH = {
  id: '507f1f77bcf86cd799439011',
  daysOfWeek: ['monday'],
  startTime: '17:00',
  endTime: '18:30',
};

const SESSION = resolveSession(BATCH, ist(20, 17, 30));

/** A stand-in for the hydrated StudentProfile document. */
function makeProfile(attendance: any[] = []) {
  return {
    _id: '507f1f77bcf86cd799439022',
    userId: '507f1f77bcf86cd799439033',
    academyId: '507f1f77bcf86cd799439044',
    passportId: 'GWD-7K2M9X',
    parentName: 'Meera',
    parentPhoneE164: '+919876543210',
    attendance,
  };
}

function target(profile: any) {
  return { profile, studentName: 'Rohan Sharma', academyName: 'MasterGrade Cricket' };
}

beforeEach(() => {
  created.length = 0;
  nextCreateError = null;
});

describe('one write path, one record per session', () => {
  it('creates a row and emits an event for a present mark', async () => {
    const profile = makeProfile();
    const result = await recordAttendance({
      target: target(profile),
      session: SESSION,
      date: ist(20, 17, 30),
      present: true,
      source: 'coach',
      markedBy: 'coach1',
    });

    expect(result).toMatchObject({ status: 'recorded', created: true, eventEmitted: true });
    expect(profile.attendance).toHaveLength(1);
    expect(profile.attendance[0].sessionId).toBe(SESSION.sessionId);
    expect(created).toHaveLength(1);
  });

  /**
   * The dual-mode payoff, and the failure it prevents: a parent scanning at the
   * gate and a coach ticking the same child ten minutes later must produce ONE
   * record and ONE message, not two of each.
   */
  it('a parent scan then a coach tick is one row and one message', async () => {
    const profile = makeProfile();

    const scan = await recordAttendance({
      target: target(profile),
      session: SESSION,
      date: ist(20, 17, 5),
      present: true,
      source: 'self_qr',
      markedBy: 'student1',
      checkedInAt: ist(20, 17, 5),
    });

    const tick = await recordAttendance({
      target: target(profile),
      session: SESSION,
      date: ist(20, 17, 30),
      present: true,
      source: 'coach',
      markedBy: 'coach1',
    });

    expect(scan.status).toBe('recorded');
    expect(tick.status).toBe('recorded');
    if (scan.status !== 'recorded' || tick.status !== 'recorded') return;
    expect(scan.eventEmitted).toBe(true);
    // The second event collides on dedupeKey — the guarantee working, not a bug.
    expect(tick.eventEmitted).toBe(false);
    expect(profile.attendance).toHaveLength(1);
    expect(created).toHaveLength(1);
  });

  it('the coach mark overwrites a parent self-check-in', async () => {
    const profile = makeProfile();
    await recordAttendance({
      target: target(profile),
      session: SESSION,
      present: true,
      source: 'self_qr',
      markedBy: 'student1',
    });
    await recordAttendance({
      target: target(profile),
      session: SESSION,
      present: false,
      source: 'coach',
      markedBy: 'coach1',
      remarks: 'left early, did not train',
    });

    expect(profile.attendance).toHaveLength(1);
    expect(profile.attendance[0].present).toBe(false);
    expect(profile.attendance[0].source).toBe('coach');
    expect(profile.attendance[0].remarks).toBe('left early, did not train');
  });

  /**
   * The reverse is refused. A parent must not be able to quietly flip an
   * absence the coach recorded — the coach is the one who can see the child.
   */
  it('a parent cannot overturn the coach', async () => {
    const profile = makeProfile();
    await recordAttendance({
      target: target(profile),
      session: SESSION,
      present: false,
      source: 'coach',
      markedBy: 'coach1',
    });

    const result = await recordAttendance({
      target: target(profile),
      session: SESSION,
      present: true,
      source: 'self_qr',
      markedBy: 'student1',
    });

    expect(result.status).toBe('refused');
    if (result.status !== 'refused') return;
    expect(result.reason).toMatch(/coach has already marked/i);
    expect(profile.attendance[0].present).toBe(false);
  });
});

describe('absences', () => {
  /**
   * Two rules in one. Absences are never messaged to a parent — an automated
   * "Rohan was marked absent" causes more arguments than it resolves. And an
   * absence must NOT consume the dedupe key, or a coach correcting a mistake to
   * "present" would silently never send the confirmation.
   */
  it('does not emit an event, and leaves the dedupe key unused', async () => {
    const profile = makeProfile();

    const absent = await recordAttendance({
      target: target(profile),
      session: SESSION,
      present: false,
      source: 'coach',
      markedBy: 'coach1',
    });
    expect(absent.status).toBe('recorded');
    if (absent.status !== 'recorded') return;
    expect(absent.eventEmitted).toBe(false);
    expect(created).toHaveLength(0);

    // The correction still notifies.
    const corrected = await recordAttendance({
      target: target(profile),
      session: SESSION,
      present: true,
      source: 'coach',
      markedBy: 'coach1',
    });
    expect(corrected.status).toBe('recorded');
    if (corrected.status !== 'recorded') return;
    expect(corrected.eventEmitted).toBe(true);
    expect(profile.attendance).toHaveLength(1);
  });
});

describe('rows written before dated sessions existed', () => {
  it('updates a legacy same-day row rather than creating a second one', async () => {
    const profile = makeProfile([
      { date: ist(20, 12, 0), present: false, markedBy: 'coach1' },
    ]);

    await recordAttendance({
      target: target(profile),
      session: SESSION,
      date: ist(20, 17, 30),
      present: true,
      source: 'coach',
      markedBy: 'coach1',
    });

    expect(profile.attendance).toHaveLength(1);
    expect(profile.attendance[0].present).toBe(true);
    // The legacy row is upgraded in place, so future marks match on session.
    expect(profile.attendance[0].sessionId).toBe(SESSION.sessionId);
  });

  it('does not touch a legacy row from a different day', async () => {
    const profile = makeProfile([
      { date: ist(19, 12, 0), present: true, markedBy: 'coach1' },
    ]);

    await recordAttendance({
      target: target(profile),
      session: SESSION,
      date: ist(20, 17, 30),
      present: true,
      source: 'coach',
      markedBy: 'coach1',
    });

    expect(profile.attendance).toHaveLength(2);
  });
});

describe('marks with no batch context', () => {
  it('records and dedupes on the calendar date', async () => {
    const profile = makeProfile();

    const first = await recordAttendance({
      target: target(profile),
      session: null,
      date: ist(20, 17, 0),
      present: true,
      source: 'coach',
      markedBy: 'coach1',
    });
    const second = await recordAttendance({
      target: target(profile),
      session: null,
      date: ist(20, 19, 0),
      present: true,
      source: 'coach',
      markedBy: 'coach1',
    });

    expect(first.status).toBe('recorded');
    if (first.status !== 'recorded') return;
    expect(first.sessionId).toBeNull();
    expect(first.eventEmitted).toBe(true);
    // Same day, so the second mark is the same record and the same message.
    expect(second.status === 'recorded' && second.eventEmitted).toBe(false);
    expect(profile.attendance).toHaveLength(1);
  });
});

describe('the event payload', () => {
  it('carries everything the message needs, denormalised', async () => {
    const profile = makeProfile();
    await recordAttendance({
      target: target(profile),
      session: SESSION,
      date: ist(20, 17, 30),
      present: true,
      source: 'self_qr',
      markedBy: 'student1',
      checkedInAt: ist(20, 17, 5),
    });

    const event = created[0];
    expect(event.name).toBe('attendance.created');
    expect(event.dedupeKey).toBe(`attendance.created:GWD-7K2M9X:${SESSION.sessionId}`);
    // The consumer must render from the payload alone, with no database reads.
    expect(event.payload).toMatchObject({
      passportId: 'GWD-7K2M9X',
      studentName: 'Rohan Sharma',
      parentPhone: '+919876543210',
      parentName: 'Meera',
      academyName: 'MasterGrade Cricket',
      sessionId: SESSION.sessionId,
      attendanceDate: '2026-07-20',
      present: true,
      source: 'self_qr',
    });
    expect(event.payload.checkedInAt).toBe(ist(20, 17, 5).toISOString());
  });
});

describe('failure handling', () => {
  it('a duplicate event is a success, not an error', async () => {
    const profile = makeProfile();
    nextCreateError = Object.assign(new Error('dup'), { code: 11000 });

    const result = await recordAttendance({
      target: target(profile),
      session: SESSION,
      present: true,
      source: 'coach',
      markedBy: 'coach1',
    });

    expect(result.status).toBe('recorded');
    if (result.status !== 'recorded') return;
    expect(result.eventEmitted).toBe(false);
  });

  it('any other write failure propagates rather than silently losing the message', async () => {
    const profile = makeProfile();
    nextCreateError = new Error('mongo is down');

    await expect(
      recordAttendance({
        target: target(profile),
        session: SESSION,
        present: true,
        source: 'coach',
        markedBy: 'coach1',
      })
    ).rejects.toThrow('mongo is down');
  });
});
