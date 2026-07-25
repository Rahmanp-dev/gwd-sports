import {
  PERFORMANCE_CATEGORIES,
  CATEGORY_DEFINITIONS,
  type CategoryAverage,
  type PerformanceCategory,
} from './taxonomy';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * WHAT EARNS A BADGE — PURE, SO THE RULES CAN BE ARGUED WITH
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Achievements exist for one commercial reason, stated in the Phase 2 template
 * notes: `gwd_achievement_v1` is "shareable — this is distribution and
 * retention in one motion". A parent forwards a badge to family; the family
 * sees the academy's name.
 *
 * That makes the rules load-bearing in a way that is easy to get wrong. Two
 * constraints follow:
 *
 *  1. **A badge must be hard enough to mean something.** If every child earns
 *     every badge in a fortnight, forwarding one says nothing, and the message
 *     becomes noise a parent learns to ignore — while still consuming their
 *     daily message budget and starving a fee reminder.
 *
 *  2. **A badge must never be revoked.** Achievements are earned at a moment
 *     and frozen with their evidence. A ten-session streak badge stays earned
 *     after the streak breaks; taking it back would be worse than never
 *     awarding it.
 *
 * The thresholds below are judgement, not science, and are stated here so they
 * can be changed with an argument rather than discovered in a switch statement.
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface AchievementDefinition {
  key: string;
  name: string;
  description: string;
  icon: string;
}

export interface AchievementCandidate extends AchievementDefinition {
  /** Frozen at the moment of earning — see rule 2 above. */
  evidence: Record<string, unknown>;
}

/** The state a rule is evaluated against. No database, no clock of its own. */
export interface AchievementInput {
  categoryAverages: CategoryAverage[];
  attendance: {
    /** Sessions attended, all time. */
    totalPresent: number;
    /** Consecutive attended sessions ending at the most recent record. */
    currentStreak: number;
  };
  /** Keys already earned, so a rule cannot re-fire. */
  alreadyEarned: string[];
}

// ---------------------------------------------------------------------------
// Attendance milestones
// ---------------------------------------------------------------------------

/**
 * Chosen so the first badge is reachable in a child's first month — a parent
 * who receives nothing for eight weeks concludes the app does nothing — while
 * the later ones take a season and stay rare.
 */
const SESSION_MILESTONES: { count: number; name: string; icon: string }[] = [
  { count: 10, name: 'Getting Started', icon: '🌱' },
  { count: 25, name: 'Regular', icon: '⭐' },
  { count: 50, name: 'Committed', icon: '🔥' },
  { count: 100, name: 'Centurion', icon: '💯' },
  { count: 250, name: 'Veteran', icon: '🏆' },
];

/**
 * Streaks are separate from totals because they measure something different:
 * turning up reliably rather than turning up a lot. A child who attends
 * sporadically for a year should not get the same badge as one who has not
 * missed a session since March.
 */
const STREAK_MILESTONES: { count: number; name: string; icon: string }[] = [
  { count: 5, name: 'On a Roll', icon: '🎯' },
  { count: 10, name: 'Never Misses', icon: '⚡' },
  { count: 20, name: 'Ever Present', icon: '🛡️' },
];

// ---------------------------------------------------------------------------
// Performance milestones
// ---------------------------------------------------------------------------

/**
 * 80% within a single category, over at least three evaluations.
 *
 * The evaluation minimum is the important half. Without it a coach's first
 * generous 9/10 mints a "mastery" badge, the parent gets a congratulations
 * message about a single drill, and the badge means nothing. Three is the point
 * at which one flattering session stops carrying the average.
 */
const MASTERY_THRESHOLD = 80;
const MASTERY_MIN_EVALUATIONS = 3;

/** Awarded once, and only for the full set — this is the season-long one. */
const ALL_ROUND_THRESHOLD = 70;

function masteryKey(category: PerformanceCategory): string {
  return `mastery_${category}`;
}

/**
 * Evaluates every rule against the current state and returns what is newly
 * earned. Never returns something already in `alreadyEarned`.
 */
export function evaluateAchievements(input: AchievementInput): AchievementCandidate[] {
  const earned = new Set(input.alreadyEarned ?? []);
  const candidates: AchievementCandidate[] = [];

  const push = (candidate: AchievementCandidate) => {
    if (!earned.has(candidate.key)) candidates.push(candidate);
  };

  // --- Attendance totals ---------------------------------------------------
  for (const milestone of SESSION_MILESTONES) {
    if (input.attendance.totalPresent >= milestone.count) {
      push({
        key: `sessions_${milestone.count}`,
        name: milestone.name,
        description: `Attended ${milestone.count} training sessions.`,
        icon: milestone.icon,
        evidence: { sessionsAttended: input.attendance.totalPresent },
      });
    }
  }

  // --- Streaks -------------------------------------------------------------
  for (const milestone of STREAK_MILESTONES) {
    if (input.attendance.currentStreak >= milestone.count) {
      push({
        key: `streak_${milestone.count}`,
        name: milestone.name,
        description: `Attended ${milestone.count} sessions in a row.`,
        icon: milestone.icon,
        evidence: { streak: input.attendance.currentStreak },
      });
    }
  }

  // --- Per-category mastery ------------------------------------------------
  for (const average of input.categoryAverages ?? []) {
    if (average.percentage === null) continue;
    if (average.evaluations < MASTERY_MIN_EVALUATIONS) continue;
    if (average.percentage < MASTERY_THRESHOLD) continue;

    push({
      key: masteryKey(average.categoryKey),
      name: `${CATEGORY_DEFINITIONS[average.categoryKey].label} Standout`,
      description: `Averaging ${average.percentage}% across ${average.evaluations} ${CATEGORY_DEFINITIONS[
        average.categoryKey
      ].label.toLowerCase()} assessments.`,
      icon: '🥇',
      evidence: {
        category: average.categoryKey,
        percentage: average.percentage,
        evaluations: average.evaluations,
      },
    });
  }

  // --- All-round -----------------------------------------------------------
  // Requires every category assessed AND all four above the threshold. A child
  // never assessed on match play has not demonstrated all-round ability, so an
  // unassessed category blocks this rather than being skipped.
  const assessed = (input.categoryAverages ?? []).filter((a) => a.percentage !== null);
  if (
    assessed.length === PERFORMANCE_CATEGORIES.length &&
    assessed.every((a) => (a.percentage as number) >= ALL_ROUND_THRESHOLD)
  ) {
    push({
      key: 'all_round',
      name: 'Complete Player',
      description: `Above ${ALL_ROUND_THRESHOLD}% in all four areas of the game.`,
      icon: '🌟',
      evidence: Object.fromEntries(
        assessed.map((a) => [a.categoryKey, a.percentage as number])
      ),
    });
  }

  return candidates;
}

/**
 * Everything a coach may award by hand.
 *
 * A fixed list rather than free text, on purpose. These appear on a public
 * Passport that outlives the academy, and get forwarded into family group
 * chats — a free-text field there is an inside joke waiting to become
 * permanent. Coaches who need to say something specific have the remarks field
 * on a performance record.
 */
export const COACH_AWARDABLE: AchievementDefinition[] = [
  {
    key: 'player_of_the_match',
    name: 'Player of the Match',
    description: 'Outstanding performance in a match.',
    icon: '🏅',
  },
  {
    key: 'most_improved',
    name: 'Most Improved',
    description: 'The biggest step forward this term.',
    icon: '📈',
  },
  {
    key: 'team_spirit',
    name: 'Team Spirit',
    description: 'Lifted everyone around them.',
    icon: '🤝',
  },
  {
    key: 'coaches_award',
    name: "Coach's Award",
    description: 'Recognised by their coach for exceptional commitment.',
    icon: '👏',
  },
];

export function findCoachAwardable(key: unknown): AchievementDefinition | null {
  return COACH_AWARDABLE.find((award) => award.key === String(key)) ?? null;
}
