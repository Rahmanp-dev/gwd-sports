import type { IAttendance } from '@/lib/models/Student';
import { sessionDateKey } from '@/lib/attendance/session';
import { averageByCategory } from '@/lib/performance/taxonomy';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * WHAT A PUBLIC PASSPORT MAY SHOW — PURE, AND THE SECURITY BOUNDARY
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `/passport/<id>` is open to anyone holding the link, and that is deliberate:
 * the URL is sent over WhatsApp to a parent who has no account and, on the day
 * they are onboarded, no reason to make one. Putting a login in front of it
 * would defeat the entire activation funnel Phase 1 measures.
 *
 * The consequence is that the link IS the audience. A passport id is 31^6 ≈ 887
 * million combinations so it will not be enumerated, but it gets forwarded,
 * screenshotted, and pasted into family group chats. Everything this module
 * emits should be assumed to end up in front of strangers.
 *
 * SAFE, and the point of the page:
 *   student name, photo, sports, current academy, attendance record,
 *   achievements, academy history
 *
 * DELIBERATELY WITHHELD, whatever the caller asks for:
 *   parent phone and name   — contact details, and the QR check-in identity key
 *   fee amounts and dues    — a forwarded link must not disclose a family's
 *                             finances; the /pay page is where money appears,
 *                             because that link is sent to the payer alone
 *   medical info            — allergies, medications, emergency contacts
 *   email, address, ids     — including the internal Mongo _id and userId
 *   siblings                — one passport is one child
 *
 * This is a whitelist, not a blacklist. A `delete` list silently starts leaking
 * the day someone adds a field to the model.
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface PublicAttendanceSummary {
  /** Sessions recorded in the window, present or absent. */
  recorded: number;
  present: number;
  /** Whole-number percentage, or null when there is nothing to divide by. */
  rate: number | null;
  /** Most recent attended session, "YYYY-MM-DD". */
  lastAttended: string | null;
  /** Consecutive attended sessions ending at the most recent record. */
  currentStreak: number;
  /** Newest first, capped. Dates only — no coach names or remarks. */
  recent: { date: string; present: boolean }[];
}

/** How much history the page shows. A parent scrolling a year of rows is lost. */
const RECENT_LIMIT = 12;
const SUMMARY_WINDOW_DAYS = 90;

/**
 * Reduces raw attendance rows to what a parent should see.
 *
 * Remarks are dropped on purpose. A coach's "distracted today, sent home early"
 * is a note to the academy, written in the expectation that the academy reads
 * it — surfacing it on a forwardable public page changes what coaches are
 * willing to write down, and the register stops being honest.
 */
export function summariseAttendance(
  rows: IAttendance[] | undefined | null,
  now: Date = new Date()
): PublicAttendanceSummary {
  const all = (rows ?? [])
    .filter((row) => row?.date)
    .map((row) => ({
      date: new Date(row.date),
      present: Boolean(row.present),
    }))
    .filter((row) => !Number.isNaN(row.date.getTime()))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const cutoff = new Date(now.getTime() - SUMMARY_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const inWindow = all.filter((row) => row.date.getTime() >= cutoff.getTime());

  const present = inWindow.filter((row) => row.present).length;
  const recorded = inWindow.length;

  // Streak runs over ALL history, not the window — a parent whose child has
  // attended every session for four months should not see the streak reset
  // because the window moved.
  let currentStreak = 0;
  for (const row of all) {
    if (!row.present) break;
    currentStreak++;
  }

  const lastAttendedRow = all.find((row) => row.present);

  return {
    recorded,
    present,
    rate: recorded > 0 ? Math.round((present / recorded) * 100) : null,
    lastAttended: lastAttendedRow ? sessionDateKey(lastAttendedRow.date) : null,
    currentStreak,
    recent: all.slice(0, RECENT_LIMIT).map((row) => ({
      date: sessionDateKey(row.date),
      present: row.present,
    })),
  };
}

export interface PublicAchievement {
  key: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  /** Where it was earned. Provenance — a Passport outlives any academy. */
  academyName: string | null;
}

export interface PublicPassport {
  passportId: string;
  studentName: string;
  photoUrl: string | null;
  sports: string[];
  /** Age, not date of birth — a birth date is an identity document field. */
  age: number | null;
  currentAcademy: { name: string; sport: string | null } | null;
  memberSince: string | null;
  academyHistory: { academyName: string; joinedAt: string; leftAt: string | null }[];
  attendance: PublicAttendanceSummary;
  achievements: PublicAchievement[];
  /**
   * Per-category percentages only. Individual evaluations are NOT published:
   * a single "3/10 for composure under pressure" attached to a named child on a
   * forwardable page is a thing a parent would rightly object to, and a coach
   * who knows raw scores go public stops recording honest ones.
   */
  progress: { categoryKey: string; label: string; percentage: number | null }[];
  isActive: boolean;
}

/** Whole years. Returns null rather than guessing from a missing birth date. */
export function ageFrom(dateOfBirth: Date | null | undefined, now: Date = new Date()): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - dob.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < dob.getUTCDate())) {
    age--;
  }
  return age >= 0 && age < 120 ? age : null;
}

/**
 * Builds the public view. Every field is copied explicitly — see the header on
 * why this is a whitelist.
 */
export function toPublicPassport(input: {
  passport: any;
  profile?: any | null;
  academyName?: string | null;
  achievements?: any[] | null;
  now?: Date;
}): PublicPassport {
  const { passport, profile, academyName } = input;
  const now = input.now ?? new Date();

  const stints = (passport.academyHistory ?? [])
    .filter((stint: any) => stint?.academyName && stint?.joinedAt)
    .sort(
      (a: any, b: any) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
    );

  const earliest = stints.length > 0 ? stints[stints.length - 1].joinedAt : null;

  return {
    passportId: passport.passportId,
    studentName: passport.studentName,
    photoUrl: passport.photoUrl ?? null,
    sports: passport.sports ?? [],
    age: ageFrom(passport.dateOfBirth, now),
    currentAcademy: academyName
      ? { name: academyName, sport: profile?.sports?.[0] ?? null }
      : null,
    memberSince: earliest ? sessionDateKey(new Date(earliest)) : null,
    academyHistory: stints.map((stint: any) => ({
      academyName: stint.academyName,
      joinedAt: sessionDateKey(new Date(stint.joinedAt)),
      leftAt: stint.leftAt ? sessionDateKey(new Date(stint.leftAt)) : null,
    })),
    attendance: summariseAttendance(profile?.attendance, now),
    achievements: summariseAchievements(input.achievements),
    progress: averageByCategory((profile?.performance ?? []) as any).map((average) => ({
      categoryKey: average.categoryKey,
      label: average.label,
      percentage: average.percentage,
    })),
    isActive: passport.isActive !== false,
  };
}

/**
 * Achievements, newest first.
 *
 * The evidence blob is deliberately dropped. It exists so a badge keeps meaning
 * what it meant when earned, but it is internal — and a coach's manual award
 * note lives in it, which was written for the academy rather than for a page
 * that gets forwarded.
 */
export function summariseAchievements(rows: any[] | null | undefined): PublicAchievement[] {
  return (rows ?? [])
    .filter((row) => row?.key && row?.name)
    .map((row) => ({
      key: String(row.key),
      name: String(row.name),
      description: String(row.description ?? ''),
      icon: String(row.icon ?? '🏅'),
      earnedAt: row.earnedAt ? sessionDateKey(new Date(row.earnedAt)) : '',
      academyName: row.academyName ?? null,
    }))
    .sort((a, b) => b.earnedAt.localeCompare(a.earnedAt));
}
