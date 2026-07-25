import { describe, it, expect } from 'vitest';
import {
  evaluateAchievements,
  findCoachAwardable,
  COACH_AWARDABLE,
  type AchievementInput,
} from './achievements';
import { averageByCategory } from './taxonomy';

function input(overrides: Partial<AchievementInput> = {}): AchievementInput {
  return {
    categoryAverages: averageByCategory([]),
    attendance: { totalPresent: 0, currentStreak: 0 },
    alreadyEarned: [],
    ...overrides,
  };
}

/** Builds n evaluations in one category at a given percentage. */
function evals(category: string, count: number, percentage: number) {
  return Array.from({ length: count }, () => ({
    categoryKey: category,
    score: percentage,
    maxScore: 100,
  }));
}

const keys = (result: { key: string }[]) => result.map((c) => c.key).sort();

describe('attendance milestones', () => {
  it('awards nothing to a student who has just joined', () => {
    expect(evaluateAchievements(input())).toEqual([]);
  });

  it('awards the first badge inside a first month of training', () => {
    // A parent who receives nothing for eight weeks concludes the app does
    // nothing, so the first milestone is deliberately reachable.
    const result = evaluateAchievements(
      input({ attendance: { totalPresent: 10, currentStreak: 0 } })
    );
    expect(keys(result)).toContain('sessions_10');
  });

  it('awards every milestone passed, not just the highest', () => {
    const result = evaluateAchievements(
      input({ attendance: { totalPresent: 50, currentStreak: 0 } })
    );
    expect(keys(result)).toEqual(['sessions_10', 'sessions_25', 'sessions_50']);
  });

  it('keeps the top milestones rare', () => {
    const result = evaluateAchievements(
      input({ attendance: { totalPresent: 99, currentStreak: 0 } })
    );
    expect(keys(result)).not.toContain('sessions_100');
  });

  /**
   * Streaks measure something different from totals: turning up reliably
   * rather than turning up a lot.
   */
  it('treats streaks separately from totals', () => {
    const sporadic = evaluateAchievements(
      input({ attendance: { totalPresent: 30, currentStreak: 1 } })
    );
    const reliable = evaluateAchievements(
      input({ attendance: { totalPresent: 30, currentStreak: 10 } })
    );

    expect(keys(sporadic)).not.toContain('streak_5');
    expect(keys(reliable)).toContain('streak_5');
    expect(keys(reliable)).toContain('streak_10');
  });

  it('freezes the evidence at the moment of earning', () => {
    // "10 sessions in a row" must keep meaning that after the streak breaks.
    const result = evaluateAchievements(
      input({ attendance: { totalPresent: 12, currentStreak: 11 } })
    );
    const streak = result.find((c) => c.key === 'streak_10')!;
    expect(streak.evidence).toEqual({ streak: 11 });
  });
});

describe('a rule never fires twice', () => {
  /**
   * Without this the cron re-evaluates every tick, re-awards the same badge,
   * and the parent receives the same congratulations message every fifteen
   * minutes — while it consumes their daily message budget and starves the fee
   * reminder.
   */
  it('excludes everything already earned', () => {
    const result = evaluateAchievements(
      input({
        attendance: { totalPresent: 50, currentStreak: 0 },
        alreadyEarned: ['sessions_10', 'sessions_25'],
      })
    );
    expect(keys(result)).toEqual(['sessions_50']);
  });

  it('returns nothing when everything is already earned', () => {
    const result = evaluateAchievements(
      input({
        attendance: { totalPresent: 50, currentStreak: 0 },
        alreadyEarned: ['sessions_10', 'sessions_25', 'sessions_50'],
      })
    );
    expect(result).toEqual([]);
  });
});

describe('per-category mastery', () => {
  it('awards at 80% over at least three evaluations', () => {
    const result = evaluateAchievements(
      input({ categoryAverages: averageByCategory(evals('ssg', 3, 85) as any) })
    );
    expect(keys(result)).toContain('mastery_ssg');
  });

  /**
   * The evaluation minimum is the load-bearing half. Without it a coach's first
   * generous 9/10 mints a "mastery" badge and the parent gets a
   * congratulations message about one drill.
   */
  it('refuses to award on a single flattering score', () => {
    const result = evaluateAchievements(
      input({ categoryAverages: averageByCategory(evals('ssg', 1, 100) as any) })
    );
    expect(keys(result)).not.toContain('mastery_ssg');
  });

  it('refuses below the threshold', () => {
    const result = evaluateAchievements(
      input({ categoryAverages: averageByCategory(evals('ssg', 5, 79) as any) })
    );
    expect(keys(result)).not.toContain('mastery_ssg');
  });

  it('is per category, so one strong area does not unlock another', () => {
    const result = evaluateAchievements(
      input({ categoryAverages: averageByCategory(evals('technical', 4, 90) as any) })
    );
    expect(keys(result)).toContain('mastery_technical');
    expect(keys(result)).not.toContain('mastery_ssg');
    expect(keys(result)).not.toContain('mastery_match_play');
  });

  it('names the category and its numbers in the description', () => {
    const result = evaluateAchievements(
      input({ categoryAverages: averageByCategory(evals('match_play', 3, 90) as any) })
    );
    const mastery = result.find((c) => c.key === 'mastery_match_play')!;
    expect(mastery.name).toBe('Match Play Standout');
    expect(mastery.description).toContain('90%');
    expect(mastery.evidence).toMatchObject({ category: 'match_play', evaluations: 3 });
  });
});

describe('the all-round award', () => {
  it('requires all four categories above the threshold', () => {
    const records = [
      ...evals('tactical', 3, 75),
      ...evals('technical', 3, 75),
      ...evals('ssg', 3, 75),
      ...evals('match_play', 3, 75),
    ];
    const result = evaluateAchievements(
      input({ categoryAverages: averageByCategory(records as any) })
    );
    expect(keys(result)).toContain('all_round');
  });

  /**
   * An unassessed category BLOCKS this rather than being skipped: a child never
   * assessed on match play has not demonstrated all-round ability, and the
   * badge would be claiming something nobody measured.
   */
  it('is blocked by a category that was never assessed', () => {
    const records = [
      ...evals('tactical', 3, 95),
      ...evals('technical', 3, 95),
      ...evals('ssg', 3, 95),
    ];
    const result = evaluateAchievements(
      input({ categoryAverages: averageByCategory(records as any) })
    );
    expect(keys(result)).not.toContain('all_round');
  });

  it('is blocked by a single weak category', () => {
    const records = [
      ...evals('tactical', 3, 95),
      ...evals('technical', 3, 95),
      ...evals('ssg', 3, 95),
      ...evals('match_play', 3, 40),
    ];
    const result = evaluateAchievements(
      input({ categoryAverages: averageByCategory(records as any) })
    );
    expect(keys(result)).not.toContain('all_round');
  });

  it('records every category score as evidence', () => {
    const records = PERFORMANCE_ALL.flatMap((c) => evals(c, 3, 80));
    const result = evaluateAchievements(
      input({ categoryAverages: averageByCategory(records as any) })
    );
    const allRound = result.find((c) => c.key === 'all_round')!;
    expect(Object.keys(allRound.evidence).sort()).toEqual(
      ['match_play', 'ssg', 'tactical', 'technical'].sort()
    );
  });
});

const PERFORMANCE_ALL = ['tactical', 'technical', 'ssg', 'match_play'];

describe('coach-awarded achievements', () => {
  /**
   * A fixed list, not free text. These land on a public Passport that outlives
   * the academy and get forwarded into family group chats — a free-text field
   * there is an inside joke waiting to become permanent.
   */
  it('only recognises keys from the published list', () => {
    expect(findCoachAwardable('player_of_the_match')?.name).toBe('Player of the Match');
    expect(findCoachAwardable('lol_nice_try')).toBeNull();
    expect(findCoachAwardable(undefined)).toBeNull();
    expect(findCoachAwardable({ key: 'player_of_the_match' })).toBeNull();
  });

  it('every entry is complete and uniquely keyed', () => {
    const seen = new Set<string>();
    for (const award of COACH_AWARDABLE) {
      expect(award.name.length).toBeGreaterThan(0);
      expect(award.description.length).toBeGreaterThan(0);
      expect(award.icon.length).toBeGreaterThan(0);
      expect(seen.has(award.key)).toBe(false);
      seen.add(award.key);
    }
  });

  it('does not collide with any automatic key', () => {
    // A coach award sharing a key with a rule would be silently re-awarded, or
    // block the rule from ever firing.
    const automatic = evaluateAchievements(
      input({
        attendance: { totalPresent: 250, currentStreak: 20 },
        categoryAverages: averageByCategory(
          PERFORMANCE_ALL.flatMap((c) => evals(c, 3, 90)) as any
        ),
      })
    ).map((c) => c.key);

    for (const award of COACH_AWARDABLE) {
      expect(automatic).not.toContain(award.key);
    }
  });
});

describe('robustness', () => {
  it('survives missing category averages', () => {
    expect(() =>
      evaluateAchievements({
        categoryAverages: undefined as any,
        attendance: { totalPresent: 10, currentStreak: 0 },
        alreadyEarned: [],
      })
    ).not.toThrow();
  });

  it('survives a missing alreadyEarned list', () => {
    const result = evaluateAchievements({
      categoryAverages: averageByCategory([]),
      attendance: { totalPresent: 10, currentStreak: 0 },
      alreadyEarned: undefined as any,
    });
    expect(keys(result)).toContain('sessions_10');
  });
});
