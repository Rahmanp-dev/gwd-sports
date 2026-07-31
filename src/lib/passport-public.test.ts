import { describe, it, expect } from 'vitest';
import { toPublicPassport, summariseAttendance, ageFrom } from './passport-public';

const NOW = new Date(Date.UTC(2026, 6, 20, 6, 30)); // 20 Jul 2026, noon IST

function ist(day: number, hour = 12, month = 6): Date {
  return new Date(Date.UTC(2026, month, day, hour) - 330 * 60_000);
}

/**
 * A passport carrying every sensitive field the model can hold, so the
 * whitelist is tested against the worst case rather than a tidy fixture.
 */
function fullPassport(overrides: any = {}) {
  return {
    _id: 'mongoid-passport',
    passportId: 'GWD-7K2M9X',
    studentName: 'Rohan Sharma',
    dateOfBirth: new Date(Date.UTC(2012, 3, 15)),
    photoUrl: 'https://cdn.gwd.in/rohan.jpg',
    parentName: 'Meera Sharma',
    parentPhone: '+919876543210',
    identityKey: '+919876543210::rohan sharma',
    sports: ['cricket'],
    currentAcademyId: 'mongoid-academy',
    currentStudentProfileId: 'mongoid-profile',
    academyHistory: [
      {
        academyId: 'a1',
        academyName: 'Sunrise Cricket',
        joinedAt: ist(10, 12, 0),
        leftAt: ist(20, 12, 5),
      },
      {
        academyId: 'a2',
        academyName: 'MasterGrade Cricket',
        joinedAt: ist(1, 12, 6),
        leftAt: null,
      },
    ],
    parentFirstEngagedAt: ist(2),
    parentLastEngagedAt: ist(19),
    isActive: true,
    ...overrides,
  };
}

function fullProfile(overrides: any = {}) {
  return {
    _id: 'mongoid-profile',
    userId: 'mongoid-user',
    academyId: 'mongoid-academy',
    sports: ['cricket'],
    parentPhoneE164: '+919876543210',
    parentName: 'Meera Sharma',
    feeAmount: 3000,
    outstandingFees: 6000,
    totalFeesPaid: 12000,
    feeDueDayOfMonth: 5,
    medicalInfo: {
      allergies: ['peanuts'],
      medications: ['inhaler'],
      emergencyContact: { name: 'Meera', phone: '+919876543210', relation: 'mother' },
    },
    attendance: [],
    kits: [],
    performance: [],
    ...overrides,
  };
}

describe('the public projection is a whitelist', () => {
  /**
   * The single most important test in this file. The passport URL is texted to
   * parents, gets forwarded and screenshotted, and has no login in front of it.
   * Anything that reaches this output should be assumed to reach strangers.
   */
  it('leaks no contact details, finances, medical info or internal ids', () => {
    const view = toPublicPassport({
      passport: fullPassport(),
      profile: fullProfile(),
      academyName: 'MasterGrade Cricket',
      now: NOW,
    });

    const serialised = JSON.stringify(view);

    // Contact details — also the QR check-in identity key.
    expect(serialised).not.toContain('9876543210');
    expect(serialised).not.toContain('Meera');
    // Money. A forwarded link must not disclose a family's finances.
    expect(serialised).not.toContain('6000');
    expect(serialised).not.toContain('3000');
    expect(serialised).not.toContain('12000');
    // Health.
    expect(serialised).not.toContain('peanuts');
    expect(serialised).not.toContain('inhaler');
    // Internal identifiers.
    expect(serialised).not.toContain('mongoid');
    expect(serialised).not.toContain('identityKey');
    // The dedupe key would reconstruct the parent's phone.
    expect(serialised).not.toContain('::');
  });

  it('emits exactly the agreed keys — a new model field cannot slip through', () => {
    const view = toPublicPassport({
      passport: fullPassport(),
      profile: fullProfile(),
      academyName: 'MasterGrade Cricket',
      now: NOW,
    });

    expect(Object.keys(view).sort()).toEqual(
      [
        'academyHistory',
        'achievements',
        'age',
        'attendance',
        'currentAcademy',
        'highestLevel',
        'isActive',
        'memberSince',
        'passportId',
        'photoUrl',
        'progress',
        'records',
        'sports',
        'studentName',
      ].sort()
    );
  });

  it('publishes sporting records but never the coach who entered them', () => {
    const view = toPublicPassport({
      passport: fullPassport({
        records: [
          {
            _id: 'rec1',
            kind: 'tournament',
            title: 'U-14 District Championship',
            level: 'district',
            startedOn: ist(12, 12, 3),
            academyName: 'MasterGrade Cricket',
            academyId: 'a2',
            recordedBy: 'mongoid-coach-rajesh',
            summary: 'Reached the semi-final.',
          },
          {
            _id: 'rec2',
            kind: 'camp',
            title: 'Summer Skills Camp',
            startedOn: ist(1, 12, 5),
            academyName: 'MasterGrade Cricket',
            recordedBy: 'mongoid-coach-rajesh',
          },
        ],
      }),
      profile: fullProfile(),
      academyName: 'MasterGrade Cricket',
      now: NOW,
    });

    expect(view.records).toHaveLength(2);
    expect(view.records[0].title).toBe('Summer Skills Camp'); // newest first

    const serialised = JSON.stringify(view).toLowerCase();
    expect(serialised).not.toContain('mongoid-coach-rajesh');
    expect(serialised).not.toContain('recordedby');
    // The summary IS published — a coach writes it knowing that.
    expect(serialised).toContain('reached the semi-final');
  });

  it('derives the highest level reached, and invents one when there is none', () => {
    const withLevels = toPublicPassport({
      passport: fullPassport({
        records: [
          { _id: 'r1', kind: 'tournament', title: 'A', level: 'district', startedOn: ist(1) },
          { _id: 'r2', kind: 'tournament', title: 'B', level: 'state', startedOn: ist(2) },
        ],
      }),
      profile: null,
      academyName: 'MasterGrade Cricket',
      now: NOW,
    });
    expect(withLevels.highestLevel).toEqual({ key: 'state', label: 'State' });

    const withoutLevels = toPublicPassport({
      passport: fullPassport({
        records: [{ _id: 'r1', kind: 'camp', title: 'A', startedOn: ist(1) }],
      }),
      profile: null,
      academyName: 'MasterGrade Cricket',
      now: NOW,
    });
    expect(withoutLevels.highestLevel).toBeNull();
  });

  it('returns an empty record list for a passport that has none', () => {
    const view = toPublicPassport({
      passport: fullPassport(),
      profile: null,
      academyName: null,
      now: NOW,
    });
    expect(view.records).toEqual([]);
    expect(view.highestLevel).toBeNull();
  });

  it('shows an age, never a date of birth', () => {
    const view = toPublicPassport({
      passport: fullPassport(),
      profile: null,
      academyName: null,
      now: NOW,
    });
    expect(view.age).toBe(14);
    expect(JSON.stringify(view)).not.toContain('2012');
  });

  it('does still show what the page is for', () => {
    const view = toPublicPassport({
      passport: fullPassport(),
      profile: fullProfile(),
      academyName: 'MasterGrade Cricket',
      now: NOW,
    });
    expect(view.studentName).toBe('Rohan Sharma');
    expect(view.sports).toEqual(['cricket']);
    expect(view.currentAcademy).toEqual({ name: 'MasterGrade Cricket', sport: 'cricket' });
    expect(view.photoUrl).toBe('https://cdn.gwd.in/rohan.jpg');
  });
});

describe('achievements and progress on a public page', () => {
  const achievements = [
    {
      key: 'streak_10',
      name: 'Never Misses',
      description: 'Attended 10 sessions in a row.',
      icon: '⚡',
      earnedAt: ist(15),
      academyName: 'MasterGrade Cricket',
      // Internal. Includes a coach's private note.
      evidence: { streak: 11, note: 'told his mum he wants to quit but keeps turning up' },
      awardedBy: 'coach-mongo-id',
      source: 'automatic',
      _id: 'mongoid-achievement',
    },
  ];

  it('shows the badge but not its evidence', () => {
    /**
     * The evidence blob exists so a badge keeps meaning what it meant when
     * earned. It is internal — and a coach's award note lives in it, written
     * for the academy rather than for a page that gets forwarded.
     */
    const view = toPublicPassport({
      passport: fullPassport(),
      profile: fullProfile(),
      academyName: 'MasterGrade Cricket',
      achievements,
      now: NOW,
    });

    expect(view.achievements).toHaveLength(1);
    expect(view.achievements[0].name).toBe('Never Misses');

    const serialised = JSON.stringify(view);
    expect(serialised).not.toContain('wants to quit');
    expect(serialised).not.toContain('coach-mongo-id');
    expect(serialised).not.toContain('mongoid-achievement');
  });

  /**
   * Category percentages are published; individual evaluations are not. A "3/10
   * for composure under pressure" attached to a named child on a forwardable
   * page is something a parent would rightly object to — and a coach who knows
   * raw scores go public stops recording honest ones.
   */
  it('publishes category percentages but never a single evaluation', () => {
    const view = toPublicPassport({
      passport: fullPassport(),
      profile: fullProfile({
        performance: [
          {
            categoryKey: 'ssg',
            metric: 'composure under pressure',
            score: 3,
            maxScore: 10,
            remarks: 'panicked badly, needs work before the trial',
            evaluatedBy: 'coach-mongo-id',
          },
        ],
      }),
      academyName: 'MasterGrade Cricket',
      now: NOW,
    });

    const ssg = view.progress.find((p) => p.categoryKey === 'ssg')!;
    expect(ssg.percentage).toBe(30);

    const serialised = JSON.stringify(view);
    expect(serialised).not.toContain('panicked');
    expect(serialised).not.toContain('composure under pressure');
    expect(serialised).not.toContain('maxScore');
  });

  it('reports all four areas, with null where nothing was assessed', () => {
    const view = toPublicPassport({
      passport: fullPassport(),
      profile: fullProfile(),
      academyName: null,
      now: NOW,
    });
    expect(view.progress).toHaveLength(4);
    expect(view.progress.every((p) => p.percentage === null)).toBe(true);
  });

  it('handles a student with no achievements', () => {
    const view = toPublicPassport({
      passport: fullPassport(),
      profile: fullProfile(),
      academyName: null,
      achievements: null,
      now: NOW,
    });
    expect(view.achievements).toEqual([]);
  });

  it('keeps a badge earned at a previous academy', () => {
    // A Passport outlives an academy — see models/Achievement.ts.
    const view = toPublicPassport({
      passport: fullPassport(),
      profile: fullProfile(),
      academyName: 'MasterGrade Cricket',
      achievements: [
        {
          key: 'sessions_50',
          name: 'Committed',
          description: 'Attended 50 training sessions.',
          icon: '🔥',
          earnedAt: ist(10, 12, 0),
          academyName: 'Sunrise Cricket',
        },
      ],
      now: NOW,
    });
    expect(view.achievements[0].academyName).toBe('Sunrise Cricket');
  });
});

describe('academy history', () => {
  it('is newest first, with dates only', () => {
    const view = toPublicPassport({
      passport: fullPassport(),
      profile: null,
      academyName: null,
      now: NOW,
    });
    expect(view.academyHistory.map((s) => s.academyName)).toEqual([
      'MasterGrade Cricket',
      'Sunrise Cricket',
    ]);
    expect(view.academyHistory[0].leftAt).toBeNull();
  });

  it('memberSince is the earliest stint, not the current one', () => {
    // The point of a passport is that a transfer does not restart the record.
    const view = toPublicPassport({
      passport: fullPassport(),
      profile: null,
      academyName: null,
      now: NOW,
    });
    expect(view.memberSince).toBe('2026-01-10');
  });

  it('survives an empty or malformed history', () => {
    const view = toPublicPassport({
      passport: fullPassport({ academyHistory: [{ academyName: null }] }),
      profile: null,
      academyName: null,
      now: NOW,
    });
    expect(view.academyHistory).toEqual([]);
    expect(view.memberSince).toBeNull();
  });
});

describe('summariseAttendance', () => {
  it('handles a student with no attendance yet', () => {
    const summary = summariseAttendance([], NOW);
    expect(summary).toMatchObject({
      recorded: 0,
      present: 0,
      rate: null,
      lastAttended: null,
      currentStreak: 0,
      recent: [],
    });
  });

  it('computes a rate over the last 90 days', () => {
    const rows = [
      { date: ist(18), present: true },
      { date: ist(17), present: true },
      { date: ist(16), present: false },
      { date: ist(15), present: true },
    ] as any;
    const summary = summariseAttendance(rows, NOW);
    expect(summary.recorded).toBe(4);
    expect(summary.present).toBe(3);
    expect(summary.rate).toBe(75);
  });

  it('excludes sessions older than the window from the rate', () => {
    const rows = [
      { date: ist(18), present: true },
      { date: new Date(Date.UTC(2025, 0, 5)), present: false },
    ] as any;
    const summary = summariseAttendance(rows, NOW);
    expect(summary.recorded).toBe(1);
    expect(summary.rate).toBe(100);
  });

  it('counts the streak over all history, not just the window', () => {
    // A four-month perfect streak must not reset because the window moved.
    const rows = [
      { date: ist(18), present: true },
      { date: ist(17), present: true },
      { date: new Date(Date.UTC(2026, 0, 10)), present: true },
      { date: new Date(Date.UTC(2026, 0, 3)), present: false },
    ] as any;
    expect(summariseAttendance(rows, NOW).currentStreak).toBe(3);
  });

  it('breaks the streak on the most recent absence', () => {
    const rows = [
      { date: ist(18), present: false },
      { date: ist(17), present: true },
    ] as any;
    expect(summariseAttendance(rows, NOW).currentStreak).toBe(0);
  });

  it('reports the last attended date, skipping absences', () => {
    const rows = [
      { date: ist(18), present: false },
      { date: ist(16), present: true },
    ] as any;
    expect(summariseAttendance(rows, NOW).lastAttended).toBe('2026-07-16');
  });

  /**
   * Coach remarks are for the academy. Surfacing "distracted today, sent home
   * early" on a forwardable public page changes what coaches are willing to
   * write down, and the register stops being honest.
   */
  it('drops coach remarks and who marked the register', () => {
    const rows = [
      {
        date: ist(18),
        present: true,
        remarks: 'distracted today, sent home early',
        markedBy: 'coach-mongo-id',
        source: 'coach',
        sessionId: 'batch1:2026-07-18',
      },
    ] as any;
    const serialised = JSON.stringify(summariseAttendance(rows, NOW));
    expect(serialised).not.toContain('distracted');
    expect(serialised).not.toContain('coach-mongo-id');
    expect(serialised).not.toContain('batch1');
  });

  it('caps the recent list and orders it newest first', () => {
    const rows = Array.from({ length: 30 }, (_, i) => ({
      date: ist(19 - (i % 19)),
      present: true,
    })) as any;
    const summary = summariseAttendance(rows, NOW);
    expect(summary.recent).toHaveLength(12);
    expect(summary.recent[0].date >= summary.recent[11].date).toBe(true);
  });

  it('ignores malformed rows rather than throwing', () => {
    const rows = [
      { date: null, present: true },
      { date: new Date('nonsense'), present: true },
      { date: ist(18), present: true },
    ] as any;
    expect(summariseAttendance(rows, NOW).recorded).toBe(1);
  });

  it('tolerates a missing attendance array', () => {
    expect(summariseAttendance(undefined, NOW).recorded).toBe(0);
    expect(summariseAttendance(null, NOW).recorded).toBe(0);
  });
});

describe('ageFrom', () => {
  it('returns whole years', () => {
    expect(ageFrom(new Date(Date.UTC(2012, 3, 15)), NOW)).toBe(14);
  });

  it('does not round up before the birthday', () => {
    expect(ageFrom(new Date(Date.UTC(2012, 7, 15)), NOW)).toBe(13);
  });

  it('handles a birthday earlier today', () => {
    expect(ageFrom(new Date(Date.UTC(2012, 6, 20)), NOW)).toBe(14);
  });

  it('returns null rather than guessing', () => {
    expect(ageFrom(null, NOW)).toBeNull();
    expect(ageFrom(undefined, NOW)).toBeNull();
    expect(ageFrom(new Date('nonsense'), NOW)).toBeNull();
  });

  it('rejects an implausible age rather than displaying it', () => {
    expect(ageFrom(new Date(Date.UTC(1850, 0, 1)), NOW)).toBeNull();
    expect(ageFrom(new Date(Date.UTC(2030, 0, 1)), NOW)).toBeNull();
  });
});
