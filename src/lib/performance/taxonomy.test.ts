import { describe, it, expect } from 'vitest';
import {
  PERFORMANCE_CATEGORIES,
  CATEGORY_DEFINITIONS,
  categoryFromLegacy,
  validatePerformanceEntry,
  averageByCategory,
  overallScore,
  normaliseMetric,
  isPerformanceCategory,
  LEGACY_FALLBACK_CATEGORY,
} from './taxonomy';

function accepted(input: any) {
  const result = validatePerformanceEntry(input);
  if (!result.ok) throw new Error(`expected acceptance, got: ${result.reason}`);
  return result.entry;
}

function rejected(input: any): string {
  const result = validatePerformanceEntry(input);
  if (result.ok) throw new Error('expected rejection, got acceptance');
  return result.reason;
}

describe('the four categories', () => {
  it('are exactly the ones the brief asks for', () => {
    expect(PERFORMANCE_CATEGORIES).toEqual(['tactical', 'technical', 'ssg', 'match_play']);
  });

  it('each carry a label, a description and starting metrics', () => {
    for (const key of PERFORMANCE_CATEGORIES) {
      const def = CATEGORY_DEFINITIONS[key];
      expect(def.label.length).toBeGreaterThan(0);
      expect(def.description.length).toBeGreaterThan(0);
      expect(def.defaultMetrics.length).toBeGreaterThan(0);
    }
  });

  it('recognises its own keys and nothing else', () => {
    expect(isPerformanceCategory('ssg')).toBe(true);
    expect(isPerformanceCategory('fitness')).toBe(false);
    expect(isPerformanceCategory(null)).toBe(false);
  });
});

describe('legacy categories are mapped, not dropped', () => {
  /**
   * Every existing Performance record has a free-text category and no
   * categoryKey. Without mapping, a child's history would appear to restart on
   * the day this shipped.
   */
  it('maps the old default metrics to technical', () => {
    for (const legacy of ['dribble', 'running', 'defending', 'strike', 'stamina']) {
      expect(categoryFromLegacy(legacy)).toBe('technical');
    }
  });

  it('recognises words that unambiguously name a category', () => {
    expect(categoryFromLegacy('tactical')).toBe('tactical');
    expect(categoryFromLegacy('small sided games')).toBe('ssg');
    expect(categoryFromLegacy('match play')).toBe('match_play');
    expect(categoryFromLegacy('game')).toBe('match_play');
  });

  it('is case and whitespace insensitive', () => {
    expect(categoryFromLegacy('  Small-Sided Games ')).toBe('ssg');
    expect(categoryFromLegacy('MATCH PLAY')).toBe('match_play');
  });

  /**
   * Conservative on purpose. An unrecognised drill becomes technical, which is
   * where an isolated skill belongs. Guessing "match play" would be worse —
   * that is the number a parent actually cares about, and inventing scores in
   * it is the more damaging error.
   */
  it('falls back to technical rather than guessing match play', () => {
    expect(categoryFromLegacy('quantum footwork')).toBe(LEGACY_FALLBACK_CATEGORY);
    expect(LEGACY_FALLBACK_CATEGORY).toBe('technical');
    expect(categoryFromLegacy('')).toBe('technical');
    expect(categoryFromLegacy(undefined)).toBe('technical');
  });
});

describe('validatePerformanceEntry', () => {
  const valid = { categoryKey: 'ssg', metric: 'pressing', score: 7, maxScore: 10 };

  it('accepts a well-formed evaluation', () => {
    expect(accepted(valid)).toEqual({
      categoryKey: 'ssg',
      metric: 'pressing',
      score: 7,
      maxScore: 10,
    });
  });

  it('normalises the metric', () => {
    expect(accepted({ ...valid, metric: '  Quick   Combinations ' }).metric).toBe(
      'quick combinations'
    );
  });

  it('rejects a category outside the taxonomy', () => {
    // Free text was the old behaviour and is exactly what made scores
    // incomparable.
    expect(rejected({ ...valid, categoryKey: 'fitness' })).toMatch(/must be one of/);
    expect(rejected({ ...valid, categoryKey: '' })).toMatch(/must be one of/);
  });

  it('rejects a missing or oversized metric', () => {
    expect(rejected({ ...valid, metric: '' })).toMatch(/metric is required/);
    expect(rejected({ ...valid, metric: 'x'.repeat(41) })).toMatch(/metric is required/);
  });

  /**
   * The check that matters most. Without it a coach fat-fingers 70 out of 10,
   * and that student tops the leaderboard forever — the aggregate cannot
   * notice, because every value in it is individually plausible.
   */
  it('rejects a score above its own maximum', () => {
    expect(rejected({ ...valid, score: 70, maxScore: 10 })).toMatch(/higher than the maximum/);
  });

  it('accepts a perfect score', () => {
    expect(accepted({ ...valid, score: 10, maxScore: 10 }).score).toBe(10);
  });

  it('accepts zero, which is a real assessment', () => {
    expect(accepted({ ...valid, score: 0 }).score).toBe(0);
  });

  it('rejects negative and non-finite values', () => {
    expect(rejected({ ...valid, score: -1 })).toMatch(/zero or more/);
    expect(rejected({ ...valid, score: 'many' })).toMatch(/zero or more/);
    expect(rejected({ ...valid, maxScore: 0 })).toMatch(/greater than zero/);
    expect(rejected({ ...valid, maxScore: Infinity })).toMatch(/greater than zero/);
  });
});

describe('averageByCategory — the bug this module exists to fix', () => {
  it('never averages across categories', () => {
    const records = [
      { categoryKey: 'technical', score: 10, maxScore: 10 },
      { categoryKey: 'match_play', score: 2, maxScore: 10 },
    ] as any;

    const averages = averageByCategory(records);
    const technical = averages.find((a) => a.categoryKey === 'technical')!;
    const match = averages.find((a) => a.categoryKey === 'match_play')!;

    expect(technical.percentage).toBe(100);
    expect(match.percentage).toBe(20);
  });

  /**
   * Records carry different maxima because coaches write them differently.
   * Averaging raw scores would weight a drill marked out of 100 forty times
   * more heavily than one marked out of 5.
   */
  it('normalises to a percentage before averaging', () => {
    const records = [
      { categoryKey: 'ssg', score: 80, maxScore: 100 },
      { categoryKey: 'ssg', score: 4, maxScore: 5 },
    ] as any;
    expect(averageByCategory(records).find((a) => a.categoryKey === 'ssg')!.percentage).toBe(80);
  });

  it('returns null, not zero, for a category never assessed', () => {
    // A child who has never been assessed on match play has not scored badly.
    const averages = averageByCategory([
      { categoryKey: 'technical', score: 5, maxScore: 10 },
    ] as any);
    const match = averages.find((a) => a.categoryKey === 'match_play')!;
    expect(match.percentage).toBeNull();
    expect(match.evaluations).toBe(0);
  });

  it('always returns all four categories, in order', () => {
    expect(averageByCategory([]).map((a) => a.categoryKey)).toEqual([
      'tactical',
      'technical',
      'ssg',
      'match_play',
    ]);
  });

  it('routes legacy records through the mapping', () => {
    const records = [
      { category: 'dribble', score: 6, maxScore: 10 },
      { category: 'match play', score: 9, maxScore: 10 },
    ] as any;
    const averages = averageByCategory(records);
    expect(averages.find((a) => a.categoryKey === 'technical')!.percentage).toBe(60);
    expect(averages.find((a) => a.categoryKey === 'match_play')!.percentage).toBe(90);
  });

  it('prefers categoryKey over a stale legacy category on the same record', () => {
    const records = [
      { categoryKey: 'ssg', category: 'dribble', score: 5, maxScore: 10 },
    ] as any;
    const averages = averageByCategory(records);
    expect(averages.find((a) => a.categoryKey === 'ssg')!.evaluations).toBe(1);
    expect(averages.find((a) => a.categoryKey === 'technical')!.evaluations).toBe(0);
  });

  it('skips corrupt records rather than clamping them', () => {
    // Clamping a 70/10 to 100% silently rewards the mistake.
    const records = [
      { categoryKey: 'ssg', score: 70, maxScore: 10 },
      { categoryKey: 'ssg', score: 5, maxScore: 10 },
    ] as any;
    const ssg = averageByCategory(records).find((a) => a.categoryKey === 'ssg')!;
    expect(ssg.evaluations).toBe(1);
    expect(ssg.percentage).toBe(50);
  });

  it('survives malformed input', () => {
    const records = [
      { categoryKey: 'ssg', score: NaN, maxScore: 10 },
      { categoryKey: 'ssg', score: 5, maxScore: 0 },
      null,
    ] as any;
    expect(() => averageByCategory(records)).not.toThrow();
    expect(averageByCategory(records).every((a) => a.percentage === null)).toBe(true);
  });
});

describe('overallScore', () => {
  /**
   * Averages the category averages, not the raw records — otherwise a coach who
   * runs twenty technical drills and one match assessment has the technical
   * number drown out everything else.
   */
  it('weights each assessed category equally', () => {
    const records = [
      ...Array.from({ length: 20 }, () => ({
        categoryKey: 'technical',
        score: 10,
        maxScore: 10,
      })),
      { categoryKey: 'match_play', score: 0, maxScore: 10 },
    ] as any;

    expect(overallScore(averageByCategory(records))).toBe(50);
  });

  it('excludes unassessed categories rather than scoring them zero', () => {
    const records = [{ categoryKey: 'ssg', score: 8, maxScore: 10 }] as any;
    expect(overallScore(averageByCategory(records))).toBe(80);
  });

  it('returns null when nothing has been assessed', () => {
    expect(overallScore(averageByCategory([]))).toBeNull();
  });
});

describe('normaliseMetric', () => {
  it('collapses whitespace and lowercases', () => {
    expect(normaliseMetric('  First   Touch ')).toBe('first touch');
  });

  it('rejects empty and oversized names', () => {
    expect(normaliseMetric('   ')).toBeNull();
    expect(normaliseMetric('x'.repeat(41))).toBeNull();
    expect(normaliseMetric(null)).toBeNull();
  });
});
