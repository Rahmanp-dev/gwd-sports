/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE PERFORMANCE TAXONOMY — TWO LEVELS, BECAUSE ONE WAS WRONG
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Before this, `Performance.category` was a free-text string and the academy's
 * metric list was a flat `string[]` defaulting to
 * ["dribble","running","defending","strike","stamina"].
 *
 * THE BUG THAT CAUSED: the leaderboard averages `score/maxScore` across every
 * record a student has. With a flat list, a 7/10 for "stamina" measured in a
 * fitness drill and a 7/10 for "decision speed" judged in a match are added
 * together as if they mean the same thing. They do not. A coach who runs more
 * fitness tests than match play changes a child's headline number without
 * anything about the child changing, and a parent reads that as progress or
 * decline.
 *
 * So a metric now belongs to a CATEGORY, scores are only ever averaged within
 * one, and the four categories are the ones the brief asks for:
 *
 *   tactical    — decision-making: reading the game, positioning, awareness
 *   technical   — execution of the skill itself, usually in isolation
 *   ssg         — small-sided games: skill under pressure, in a live but
 *                 controlled setting
 *   match_play  — the full game. The only category measuring what actually
 *                 happens on a Saturday.
 *
 * WHY THE CATEGORIES ARE FIXED IN CODE AND THE METRICS ARE NOT: the four
 * categories are the assessment framework — a coaching decision that predates
 * this software and is the same at every academy. The metrics inside them are
 * local vocabulary, and academies genuinely differ. Fixed categories are what
 * make one academy's report comparable with another's, which a Passport that
 * survives a transfer depends on.
 * ════════════════════════════════════════════════════════════════════════════
 */

export const PERFORMANCE_CATEGORIES = ['tactical', 'technical', 'ssg', 'match_play'] as const;

export type PerformanceCategory = (typeof PERFORMANCE_CATEGORIES)[number];

export interface CategoryDefinition {
  key: PerformanceCategory;
  label: string;
  /** One line a coach can act on, shown next to the picker. */
  description: string;
  /** Sensible starting metrics. Academies may replace these. */
  defaultMetrics: string[];
}

export const CATEGORY_DEFINITIONS: Record<PerformanceCategory, CategoryDefinition> = {
  tactical: {
    key: 'tactical',
    label: 'Tactical',
    description: 'Decision-making — reading the game, positioning, awareness of space.',
    defaultMetrics: [
      'positioning',
      'decision making',
      'game awareness',
      'communication',
      'transition play',
    ],
  },
  technical: {
    key: 'technical',
    label: 'Technical',
    description: 'Execution of the skill itself, usually practised in isolation.',
    defaultMetrics: ['first touch', 'passing', 'shooting', 'dribbling', 'defending'],
  },
  ssg: {
    key: 'ssg',
    label: 'Small-Sided Games',
    description: 'Skill under pressure — live, but in a controlled setting.',
    defaultMetrics: [
      'pressing',
      'quick combinations',
      'one-v-one',
      'work rate',
      'composure under pressure',
    ],
  },
  match_play: {
    key: 'match_play',
    label: 'Match Play',
    description: 'The full game. The only category that measures a real Saturday.',
    defaultMetrics: [
      'impact on the game',
      'consistency',
      'discipline',
      'teamwork',
      'match fitness',
    ],
  },
};

export function isPerformanceCategory(value: unknown): value is PerformanceCategory {
  return PERFORMANCE_CATEGORIES.includes(String(value) as PerformanceCategory);
}

/**
 * Maps a legacy free-text category onto the new taxonomy.
 *
 * Every existing Performance record has one of these strings and no
 * categoryKey. Without a mapping they would either vanish from a
 * category-grouped view or all pile into one bucket, and a child's history
 * would appear to restart on the day this shipped.
 *
 * The mapping is deliberately conservative: anything not confidently
 * recognisable becomes `technical`, which is where an isolated skill drill
 * belongs and is the least likely to distort a tactical or match-play average.
 * A wrong guess in the other direction — inventing match-play scores — would be
 * worse, because match play is the number a parent cares about.
 */
const LEGACY_CATEGORY_MAP: Record<string, PerformanceCategory> = {
  // The old defaults, all isolated-skill drills.
  dribble: 'technical',
  dribbling: 'technical',
  running: 'technical',
  defending: 'technical',
  strike: 'technical',
  striking: 'technical',
  shooting: 'technical',
  stamina: 'technical',
  fitness: 'technical',
  technique: 'technical',
  passing: 'technical',

  // Words that unambiguously name the new categories.
  tactical: 'tactical',
  tactics: 'tactical',
  positioning: 'tactical',
  awareness: 'tactical',

  ssg: 'ssg',
  'small sided games': 'ssg',
  'small-sided games': 'ssg',
  'small sided': 'ssg',

  game: 'match_play',
  match: 'match_play',
  'match play': 'match_play',
  matchplay: 'match_play',
  'match_play': 'match_play',
  gameplay: 'match_play',
};

export const LEGACY_FALLBACK_CATEGORY: PerformanceCategory = 'technical';

export function categoryFromLegacy(raw: unknown): PerformanceCategory {
  const key = String(raw ?? '').trim().toLowerCase();
  if (!key) return LEGACY_FALLBACK_CATEGORY;
  if (isPerformanceCategory(key)) return key;
  return LEGACY_CATEGORY_MAP[key] ?? LEGACY_FALLBACK_CATEGORY;
}

/** Metric names are free-form vocabulary, but bounded and normalised. */
const MAX_METRIC_LENGTH = 40;

export function normaliseMetric(raw: unknown): string | null {
  const metric = String(raw ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  if (!metric || metric.length > MAX_METRIC_LENGTH) return null;
  return metric;
}

export interface PerformanceEntry {
  categoryKey: PerformanceCategory;
  metric: string;
  score: number;
  maxScore: number;
}

export type PerformanceValidation =
  | { ok: true; entry: PerformanceEntry }
  | { ok: false; reason: string };

/**
 * Validates one evaluation before it is written.
 *
 * `score <= maxScore` is the check that matters. Without it a coach fat-fingers
 * 70 out of 10 and that student tops the leaderboard forever — the aggregate
 * has no way to notice, because every value in it is individually plausible.
 */
export function validatePerformanceEntry(input: {
  categoryKey?: unknown;
  metric?: unknown;
  score?: unknown;
  maxScore?: unknown;
}): PerformanceValidation {
  const categoryKey = String(input.categoryKey ?? '').trim().toLowerCase();
  if (!isPerformanceCategory(categoryKey)) {
    return {
      ok: false,
      reason: `Category must be one of: ${PERFORMANCE_CATEGORIES.join(', ')}.`,
    };
  }

  const metric = normaliseMetric(input.metric);
  if (!metric) {
    return {
      ok: false,
      reason: `A metric is required, up to ${MAX_METRIC_LENGTH} characters.`,
    };
  }

  const score = Number(input.score);
  const maxScore = Number(input.maxScore);

  if (!Number.isFinite(score) || score < 0) {
    return { ok: false, reason: 'Score must be zero or more.' };
  }
  if (!Number.isFinite(maxScore) || maxScore <= 0) {
    return { ok: false, reason: 'Maximum score must be greater than zero.' };
  }
  if (score > maxScore) {
    return {
      ok: false,
      reason: `Score ${score} is higher than the maximum of ${maxScore}.`,
    };
  }

  return { ok: true, entry: { categoryKey, metric, score, maxScore } };
}

export interface CategoryAverage {
  categoryKey: PerformanceCategory;
  label: string;
  /** 0–100, or null when nothing has been recorded in this category. */
  percentage: number | null;
  evaluations: number;
}

/**
 * Averages performance WITHIN each category and never across them.
 *
 * The whole reason this module exists. Each record is normalised to a
 * percentage first, because `maxScore` varies between records — averaging raw
 * scores would weight a drill marked out of 100 forty times more heavily than
 * one marked out of 5, purely because of how a coach wrote it down.
 */
export function averageByCategory(
  records: { categoryKey?: unknown; category?: unknown; score: number; maxScore: number }[]
): CategoryAverage[] {
  const buckets = new Map<PerformanceCategory, { total: number; count: number }>();

  for (const record of records ?? []) {
    if (!Number.isFinite(record?.score) || !Number.isFinite(record?.maxScore)) continue;
    if (record.maxScore <= 0) continue;

    // Legacy rows carry only `category`; new rows carry `categoryKey`.
    const key = isPerformanceCategory(record.categoryKey)
      ? record.categoryKey
      : categoryFromLegacy(record.category);

    // A record above its own maximum is corrupt. Skipped rather than clamped:
    // clamping to 100% would silently reward the mistake.
    if (record.score > record.maxScore) continue;

    const bucket = buckets.get(key) ?? { total: 0, count: 0 };
    bucket.total += (record.score / record.maxScore) * 100;
    bucket.count += 1;
    buckets.set(key, bucket);
  }

  return PERFORMANCE_CATEGORIES.map((key) => {
    const bucket = buckets.get(key);
    return {
      categoryKey: key,
      label: CATEGORY_DEFINITIONS[key].label,
      percentage: bucket && bucket.count > 0 ? Math.round(bucket.total / bucket.count) : null,
      evaluations: bucket?.count ?? 0,
    };
  });
}

/**
 * A single headline figure, for the leaderboard.
 *
 * Averages the CATEGORY averages, not the raw records — so a coach who runs
 * twenty technical drills and one match-play assessment does not have the
 * technical number drown out everything else. Categories with no data are
 * excluded rather than counted as zero: a child who has never been assessed on
 * match play has not scored badly at it.
 */
export function overallScore(averages: CategoryAverage[]): number | null {
  const scored = averages.filter((a) => a.percentage !== null);
  if (scored.length === 0) return null;
  return Math.round(
    scored.reduce((sum, a) => sum + (a.percentage as number), 0) / scored.length
  );
}
