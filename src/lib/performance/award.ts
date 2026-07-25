import mongoose from 'mongoose';
import Achievement from '@/lib/models/Achievement';
import DomainEvent from '@/lib/models/DomainEvent';
import StudentProfile from '@/lib/models/Student';
import Academy from '@/lib/models/Academy';
import { averageByCategory } from './taxonomy';
import {
  evaluateAchievements,
  type AchievementCandidate,
  type AchievementDefinition,
} from './achievements';
import { summariseAttendance } from '@/lib/passport-public';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * AWARDING — ONE PATH, AND THE PRODUCER `gwd_achievement_v1` NEVER HAD
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `gwd_achievement_v1` has existed in the template registry since Phase 2 with
 * nothing able to send it — the third dead path in this codebase, after
 * `attendance.created` having no producer and the passport link 404ing. This
 * module is its producer.
 *
 * Both the automatic rules and a coach's manual award funnel through
 * `awardAchievement`, for the same reason both attendance modes share one
 * recorder: two write paths drift, and here the drift would be a parent getting
 * a WhatsApp message for one kind of badge and silence for the other.
 *
 * IDEMPOTENCY IS AT TWO LEVELS AND BOTH ARE NEEDED. `Achievement.dedupeKey`
 * stops the same badge being stored twice; `DomainEvent.dedupeKey` stops a
 * second message if the achievement row was written but the event write failed
 * and the whole thing is retried.
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface AwardContext {
  passportId: string;
  studentUserId?: mongoose.Types.ObjectId | string | null;
  studentName: string;
  academyId?: mongoose.Types.ObjectId | string | null;
  academyName: string;
  parentPhone?: string | null;
  parentName?: string | null;
}

export type AwardOutcome =
  | { status: 'awarded'; achievementId: string; eventEmitted: boolean }
  | { status: 'duplicate' };

/**
 * Writes one achievement and emits its event.
 *
 * The event carries the denormalised name, academy and passport URL because the
 * consumer must render from the payload alone — the same rule Phases 1 and 3
 * follow, and for the same reason: a worker that re-reads four collections to
 * fill a template is where "personalised per child" becomes "the same name on
 * every message".
 */
export async function awardAchievement(input: {
  context: AwardContext;
  definition: AchievementDefinition;
  evidence?: Record<string, unknown>;
  source: 'automatic' | 'coach_awarded';
  awardedBy?: mongoose.Types.ObjectId | string | null;
  now?: Date;
}): Promise<AwardOutcome> {
  const { context, definition, source } = input;
  const now = input.now ?? new Date();
  const dedupeKey = `achievement:${context.passportId}:${definition.key}`;

  let achievement;
  try {
    achievement = await Achievement.create({
      passportId: context.passportId,
      key: definition.key,
      name: definition.name,
      description: definition.description,
      icon: definition.icon,
      source,
      awardedBy: input.awardedBy ?? null,
      academyId: context.academyId ?? null,
      academyName: context.academyName,
      studentUserId: context.studentUserId ?? null,
      evidence: input.evidence ?? {},
      earnedAt: now,
      dedupeKey,
    });
  } catch (err: any) {
    // The unique index doing its job: this passport already has this badge.
    if (err?.code === 11000) return { status: 'duplicate' };
    throw err;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gwd.in';

  let eventEmitted = false;
  // No parent phone means nothing to send. The badge is still earned and still
  // appears on the Passport — it simply cannot be announced.
  if (context.parentPhone) {
    try {
      await DomainEvent.create({
        name: 'achievement.created',
        academyId: context.academyId ?? null,
        dedupeKey,
        payload: {
          eventVersion: 1,
          passportId: context.passportId,
          studentUserId: context.studentUserId ? String(context.studentUserId) : null,
          studentName: context.studentName,
          parentName: context.parentName ?? null,
          parentPhone: context.parentPhone,
          academyId: context.academyId ? String(context.academyId) : null,
          academyName: context.academyName,
          achievementKey: definition.key,
          achievementName: definition.name,
          achievementDescription: definition.description,
          passportUrl: `${appUrl}/passport/${context.passportId}`,
          earnedAt: now.toISOString(),
          source,
        },
      });
      eventEmitted = true;
    } catch (err: any) {
      // A duplicate event is the guarantee working, not a failure.
      if (err?.code !== 11000) throw err;
    }
  }

  return { status: 'awarded', achievementId: String(achievement._id), eventEmitted };
}

/**
 * Re-evaluates the automatic rules for one student and awards whatever is newly
 * earned.
 *
 * Called after a performance record or an attendance mark, both of which can
 * cross a threshold. Safe to call as often as you like — the rules exclude what
 * is already earned, and the two dedupe keys catch anything that slips past a
 * race.
 */
export async function evaluateAndAward(input: {
  passportId: string;
  now?: Date;
}): Promise<{ awarded: AchievementCandidate[]; notified: number }> {
  const now = input.now ?? new Date();
  const passportId = input.passportId.toUpperCase();

  const profile = await StudentProfile.findOne({ passportId })
    .select('userId academyId attendance performance parentPhoneE164 parentName passportId')
    .populate('userId', 'name');

  if (!profile) return { awarded: [], notified: 0 };

  const [academy, existing] = await Promise.all([
    profile.academyId
      ? Academy.findById(profile.academyId).select('name').lean()
      : null,
    Achievement.find({ passportId }).select('key').lean(),
  ]);

  const attendance = summariseAttendance(profile.attendance as any, now);

  const candidates = evaluateAchievements({
    categoryAverages: averageByCategory((profile.performance ?? []) as any),
    attendance: {
      // Deliberately all-time, not the 90-day window the passport page shows —
      // a hundred-session badge counts a hundred sessions, whenever they were.
      totalPresent: (profile.attendance ?? []).filter((row: any) => row.present).length,
      currentStreak: attendance.currentStreak,
    },
    alreadyEarned: (existing as any[]).map((row) => row.key),
  });

  const context: AwardContext = {
    passportId,
    studentUserId: (profile.userId as any)?._id ?? profile.userId,
    studentName: (profile.userId as any)?.name ?? 'your child',
    academyId: profile.academyId ?? null,
    academyName: (academy as any)?.name ?? 'your academy',
    parentPhone: profile.parentPhoneE164 ?? null,
    parentName: profile.parentName ?? null,
  };

  const awarded: AchievementCandidate[] = [];
  let notified = 0;

  for (const candidate of candidates) {
    const outcome = await awardAchievement({
      context,
      definition: candidate,
      evidence: candidate.evidence,
      source: 'automatic',
      now,
    });
    if (outcome.status === 'awarded') {
      awarded.push(candidate);
      if (outcome.eventEmitted) notified++;
    }
  }

  return { awarded, notified };
}
