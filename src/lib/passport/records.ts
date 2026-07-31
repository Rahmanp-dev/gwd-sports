/**
 * ════════════════════════════════════════════════════════════════════════════
 * PASSPORT RECORDS — the sporting history a coach curates
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Attendance says a child turned up. Performance says how they scored on a
 * drill. Neither answers the question a parent actually asks a passport link to
 * answer — "what has my child actually *done*?" Tournaments played, leagues
 * entered, camps completed, trials attended, certifications earned. That is the
 * record this module governs.
 *
 * WHY THESE LIVE ON THE PASSPORT, NOT ON StudentProfile
 *
 * A district championship a child played in April happened to *the child*. It
 * did not happen to their current enrolment. If these lived on StudentProfile
 * they would vanish the day the family moved academy — which is precisely the
 * failure the Passport model exists to prevent (see the header of
 * models/Passport.ts, rule 3). So a record is written onto the global Passport
 * with the recording academy denormalised into it, exactly as `academyHistory`
 * and `Achievement.academyName` already do.
 *
 * WHY `summary` IS NAMED `summary` AND NOT `notes`
 *
 * lib/passport-public.ts withholds coach remarks on purpose: a register note
 * like "distracted today, sent home early" is written for the academy, and
 * publishing it changes what coaches are willing to write down. A field called
 * "notes" invites exactly that kind of private writing. This one is called a
 * summary, is capped short, and the coach-facing form states above the box that
 * it appears on the public passport — so the contract is visible at the moment
 * of typing rather than discovered afterwards.
 *
 * EVERYTHING HERE IS PUBLIC. A passport link gets forwarded into family group
 * chats. Do not add a field to this shape that you would not put on a poster.
 * ════════════════════════════════════════════════════════════════════════════
 */

export const RECORD_KINDS = [
  'tournament',
  'league',
  'camp',
  'trial',
  'certification',
  'milestone',
] as const;

export type PassportRecordKind = (typeof RECORD_KINDS)[number];

export const RECORD_KIND_LABELS: Record<PassportRecordKind, string> = {
  tournament: 'Tournament',
  league: 'League',
  camp: 'Training camp',
  trial: 'Trial / selection',
  certification: 'Certification',
  milestone: 'Milestone',
};

/** Icons are part of the public payload so the passport and the coach's list agree. */
export const RECORD_KIND_ICONS: Record<PassportRecordKind, string> = {
  tournament: '🏆',
  league: '🏅',
  camp: '⛺',
  trial: '🎯',
  certification: '📜',
  milestone: '⭐',
};

/**
 * The competitive level. Ordered deliberately — a passport that can say
 * "state" means more than one that can only say "played a match", and an
 * ordered enum lets the page badge the highest level a child has reached.
 */
export const RECORD_LEVELS = [
  'academy',
  'school',
  'club',
  'district',
  'state',
  'national',
  'international',
] as const;

export type PassportRecordLevel = (typeof RECORD_LEVELS)[number];

export const RECORD_LEVEL_LABELS: Record<PassportRecordLevel, string> = {
  academy: 'Academy',
  school: 'School',
  club: 'Club',
  district: 'District',
  state: 'State',
  national: 'National',
  international: 'International',
};

export const MAX_TITLE = 120;
export const MAX_ORG = 120;
export const MAX_RESULT = 80;
export const MAX_LOCATION = 120;
export const MAX_SUMMARY = 400;

/** A coach entering a date in 2027 has almost certainly typed the year wrong. */
const MAX_FUTURE_DAYS = 730;
/** Nothing before this is a plausible junior sporting record; it's a typo. */
const MIN_YEAR = 1990;

export interface PassportRecordInput {
  kind?: unknown;
  title?: unknown;
  organisation?: unknown;
  sport?: unknown;
  level?: unknown;
  result?: unknown;
  startedOn?: unknown;
  endedOn?: unknown;
  location?: unknown;
  summary?: unknown;
}

export interface CleanPassportRecord {
  kind: PassportRecordKind;
  title: string;
  organisation: string | null;
  sport: string | null;
  level: PassportRecordLevel | null;
  result: string | null;
  startedOn: Date;
  endedOn: Date | null;
  location: string | null;
  summary: string | null;
}

export type ValidationResult =
  | { ok: true; record: CleanPassportRecord }
  | { ok: false; field: string; reason: string };

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const d = new Date(value as any);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isRecordKind(value: unknown): value is PassportRecordKind {
  return typeof value === 'string' && (RECORD_KINDS as readonly string[]).includes(value);
}

export function isRecordLevel(value: unknown): value is PassportRecordLevel {
  return typeof value === 'string' && (RECORD_LEVELS as readonly string[]).includes(value);
}

/**
 * Validates one record from an untrusted request body.
 *
 * Rejects rather than coerces on anything that changes meaning. A silently
 * defaulted date would put a child's district final in the wrong year on a page
 * their family shows people — better to make the coach fix it.
 */
export function validateRecord(
  input: PassportRecordInput,
  now: Date = new Date()
): ValidationResult {
  if (!isRecordKind(input.kind)) {
    return { ok: false, field: 'kind', reason: `Choose one of: ${RECORD_KINDS.join(', ')}.` };
  }

  const title = text(input.title, MAX_TITLE);
  if (!title || title.length < 2) {
    return { ok: false, field: 'title', reason: 'Give the record a title.' };
  }

  const startedOn = parseDate(input.startedOn);
  if (!startedOn) {
    return { ok: false, field: 'startedOn', reason: 'A valid date is required.' };
  }
  if (startedOn.getUTCFullYear() < MIN_YEAR) {
    return { ok: false, field: 'startedOn', reason: `That year looks wrong — use ${MIN_YEAR} or later.` };
  }
  const horizon = new Date(now.getTime() + MAX_FUTURE_DAYS * 86_400_000);
  if (startedOn.getTime() > horizon.getTime()) {
    return { ok: false, field: 'startedOn', reason: 'That date is too far in the future.' };
  }

  let endedOn: Date | null = null;
  if (input.endedOn !== undefined && input.endedOn !== null && input.endedOn !== '') {
    endedOn = parseDate(input.endedOn);
    if (!endedOn) {
      return { ok: false, field: 'endedOn', reason: 'That end date is not a valid date.' };
    }
    if (endedOn.getTime() < startedOn.getTime()) {
      return { ok: false, field: 'endedOn', reason: 'The end date cannot be before the start date.' };
    }
  }

  if (input.level !== undefined && input.level !== null && input.level !== '' && !isRecordLevel(input.level)) {
    return { ok: false, field: 'level', reason: `Choose one of: ${RECORD_LEVELS.join(', ')}.` };
  }

  return {
    ok: true,
    record: {
      kind: input.kind,
      title,
      organisation: text(input.organisation, MAX_ORG),
      sport: text(input.sport, 60)?.toLowerCase() ?? null,
      level: isRecordLevel(input.level) ? input.level : null,
      result: text(input.result, MAX_RESULT),
      startedOn,
      endedOn,
      location: text(input.location, MAX_LOCATION),
      summary: text(input.summary, MAX_SUMMARY),
    },
  };
}

/** The shape the public passport publishes. Ids and author are NOT included. */
export interface PublicPassportRecord {
  id: string;
  kind: PassportRecordKind;
  kindLabel: string;
  icon: string;
  title: string;
  organisation: string | null;
  sport: string | null;
  level: PassportRecordLevel | null;
  levelLabel: string | null;
  result: string | null;
  startedOn: string;
  endedOn: string | null;
  location: string | null;
  summary: string | null;
  /** Which academy recorded it. Provenance — a Passport outlives any academy. */
  academyName: string | null;
  /** True when the record's start date has not arrived yet. */
  upcoming: boolean;
}

function dateKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
    d.getUTCDate()
  ).padStart(2, '0')}`;
}

/**
 * Projects stored records to the public shape, newest first.
 *
 * `recordedBy` is dropped: naming the individual coach who typed an entry on a
 * page that gets forwarded to strangers serves the reader nothing and exposes
 * staff. The academy is named instead, which is the accountable party.
 */
export function toPublicRecords(
  rows: any[] | null | undefined,
  now: Date = new Date()
): PublicPassportRecord[] {
  return (rows ?? [])
    .filter((row) => row && isRecordKind(row.kind) && row.title && row.startedOn)
    .map((row) => {
      const started = new Date(row.startedOn);
      const ended = row.endedOn ? new Date(row.endedOn) : null;
      const level: PassportRecordLevel | null = isRecordLevel(row.level) ? row.level : null;
      return {
        id: String(row._id ?? ''),
        kind: row.kind as PassportRecordKind,
        kindLabel: RECORD_KIND_LABELS[row.kind as PassportRecordKind],
        icon: RECORD_KIND_ICONS[row.kind as PassportRecordKind],
        title: String(row.title),
        organisation: row.organisation ?? null,
        sport: row.sport ?? null,
        level,
        levelLabel: level ? RECORD_LEVEL_LABELS[level] : null,
        result: row.result ?? null,
        startedOn: dateKey(started),
        endedOn: ended && !Number.isNaN(ended.getTime()) ? dateKey(ended) : null,
        location: row.location ?? null,
        summary: row.summary ?? null,
        academyName: row.academyName ?? null,
        upcoming: started.getTime() > now.getTime(),
      };
    })
    .sort((a, b) => b.startedOn.localeCompare(a.startedOn));
}

/**
 * The single highest competitive level in a set of records.
 *
 * Drives the one badge on the passport header that a parent screenshots. Null
 * when nothing is levelled, rather than defaulting to "academy" — claiming a
 * level nobody entered is the kind of invented credential this codebase
 * refuses to generate anywhere else.
 */
export function highestLevel(
  rows: { level?: PassportRecordLevel | string | null }[] | null | undefined
): PassportRecordLevel | null {
  let best = -1;
  for (const row of rows ?? []) {
    if (!isRecordLevel(row?.level)) continue;
    const idx = RECORD_LEVELS.indexOf(row.level);
    if (idx > best) best = idx;
  }
  return best >= 0 ? RECORD_LEVELS[best] : null;
}
