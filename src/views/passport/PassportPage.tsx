"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/utils/constants";
import {
  Award,
  CalendarCheck,
  Flame,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  TrendingUp,
  Trophy,
} from "lucide-react";

/**
 * The Sports Passport, as a parent sees it.
 *
 * This is the page four of the six WhatsApp templates link to, and for most
 * parents it is the first thing they ever see of GWD. Three constraints follow
 * from that and drive every decision here:
 *
 *  1. It opens on a phone, from a text message, on Indian mobile data. Mobile
 *     first, no heavy assets, no client-side routing.
 *  2. The reader has no account and no context. Nothing here assumes they know
 *     what a Passport is, so the page says so.
 *  3. It gets forwarded. What is on screen is what the API allows a stranger to
 *     see — the filtering is server-side, in lib/passport-public.ts, not here.
 */

interface PublicPassport {
  passportId: string;
  studentName: string;
  photoUrl: string | null;
  sports: string[];
  age: number | null;
  currentAcademy: { name: string; sport: string | null } | null;
  memberSince: string | null;
  academyHistory: { academyName: string; joinedAt: string; leftAt: string | null }[];
  attendance: {
    recorded: number;
    present: number;
    rate: number | null;
    lastAttended: string | null;
    currentStreak: number;
    recent: { date: string; present: boolean }[];
  };
  achievements: {
    key: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: string;
    academyName: string | null;
  }[];
  progress: { categoryKey: string; label: string; percentage: number | null }[];
  /** Curated sporting history — see lib/passport/records.ts. */
  records: {
    id: string;
    kind: string;
    kindLabel: string;
    icon: string;
    title: string;
    organisation: string | null;
    sport: string | null;
    level: string | null;
    levelLabel: string | null;
    result: string | null;
    startedOn: string;
    endedOn: string | null;
    location: string | null;
    summary: string | null;
    academyName: string | null;
    upcoming: boolean;
  }[];
  highestLevel: { key: string; label: string } | null;
  isActive: boolean;
}

type PassportRecord = PublicPassport["records"][number];

/**
 * Result strings a coach types are free text, so they cannot be enumerated.
 * These three shapes cover what actually gets written and give the winning
 * ones visual weight — a parent scanning the page should find the gold first.
 */
function resultTone(result: string | null): string {
  if (!result) return "bg-slate-100 text-slate-600 ring-slate-200";
  const r = result.toLowerCase();
  if (/(winner|champion|1st|first|gold|selected|qualified)/.test(r)) {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }
  if (/(runner|2nd|second|silver|semi|final)/.test(r)) {
    return "bg-slate-100 text-slate-700 ring-slate-300";
  }
  return "bg-sky-50 text-sky-700 ring-sky-200";
}

/** "12 Apr 2026" or "12–14 Apr 2026" — a range reads as one event, not two. */
function dateRange(startedOn: string, endedOn: string | null): string {
  if (!endedOn || endedOn === startedOn) return prettyDate(startedOn);
  const a = new Date(`${startedOn}T00:00:00Z`);
  const b = new Date(`${endedOn}T00:00:00Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return prettyDate(startedOn);
  if (a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth()) {
    return `${a.getUTCDate()}–${prettyDate(endedOn)}`;
  }
  return `${shortDate(startedOn)} – ${prettyDate(endedOn)}`;
}

function yearOf(iso: string): string {
  return iso.slice(0, 4);
}

function prettyDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function shortDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function Stat({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: any;
  value: string;
  label: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
      <Icon className={`mx-auto mb-1.5 h-5 w-5 ${tone}`} />
      <p className="text-2xl font-extrabold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
    </div>
  );
}

/**
 * One entry in the sporting record.
 *
 * Laid out as a timeline rather than a list of cards because the question a
 * parent is asking — "what has my child actually done?" — is chronological, and
 * because a spine of connected dots reads as a career even when there are only
 * three of them. A grid of three cards reads as a thin page.
 */
function RecordEntry({ record, last }: { record: PassportRecord; last: boolean }) {
  /**
   * When the academy ran the event itself, `organisation` and `academyName` are
   * the same string and the row printed it twice — once as the organiser and
   * again as provenance ("MasterGrade Sports Academy, Kukatpally · MasterGrade
   * Sports Academy"). Provenance only earns its place when it says something
   * the reader does not already know.
   */
  const showProvenance =
    !!record.academyName &&
    record.academyName.toLowerCase() !== (record.organisation ?? "").toLowerCase();

  return (
    <li className="relative flex gap-3.5 pb-5 last:pb-0">
      {/* The spine. Stops at the last dot so the line never dangles. */}
      {!last && (
        <span
          aria-hidden
          className="absolute left-[19px] top-11 bottom-0 w-px bg-gradient-to-b from-slate-200 to-slate-100"
        />
      )}

      <span
        className={`relative z-10 flex h-10 w-10 flex-none items-center justify-center rounded-full text-lg ring-1 ${
          record.upcoming
            ? "bg-white text-slate-400 ring-slate-200 ring-dashed"
            : "bg-gradient-to-br from-slate-50 to-white text-slate-900 ring-slate-200 shadow-sm"
        }`}
      >
        {record.icon}
      </span>

      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="text-sm font-bold leading-snug text-slate-900">
            {record.title}
          </h3>
          {record.upcoming && (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-indigo-600 ring-1 ring-indigo-200">
              Upcoming
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
            {record.kindLabel}
          </span>
          {record.levelLabel && (
            <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700 ring-1 ring-violet-200">
              {record.levelLabel}
            </span>
          )}
          {record.result && (
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1 ${resultTone(
                record.result,
              )}`}
            >
              {record.result}
            </span>
          )}
        </div>

        {record.organisation && (
          <p className="mt-1.5 text-xs font-medium text-slate-600">
            {record.organisation}
          </p>
        )}

        {record.summary && (
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {record.summary}
          </p>
        )}

        <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[10px] text-slate-400">
          <span>{dateRange(record.startedOn, record.endedOn)}</span>
          {record.location && (
            <>
              <span aria-hidden>·</span>
              <span>{record.location}</span>
            </>
          )}
          {showProvenance && (
            <>
              <span aria-hidden>·</span>
              {/* Provenance. A Passport outlives any one academy, so a record
                  says who recorded it — the academy, never the individual. */}
              <span>{record.academyName}</span>
            </>
          )}
        </p>
      </div>
    </li>
  );
}

/** Groups the record into years so a long history stays scannable. */
function SportingRecord({ records }: { records: PassportRecord[] }) {
  const years: { year: string; rows: PassportRecord[] }[] = [];
  for (const record of records) {
    const year = yearOf(record.startedOn);
    const bucket = years.find((y) => y.year === year);
    if (bucket) bucket.rows.push(record);
    else years.push({ year, rows: [record] });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-bold text-slate-900">Sporting record</h2>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {records.length} {records.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      <div className="mt-4 space-y-5">
        {years.map((bucket) => (
          <div key={bucket.year}>
            <div className="mb-2.5 flex items-center gap-2.5">
              <span className="text-[11px] font-extrabold tracking-wider text-slate-900">
                {bucket.year}
              </span>
              <span className="h-px flex-1 bg-slate-100" />
            </div>
            <ul>
              {bucket.rows.map((record, i) => (
                <RecordEntry
                  key={record.id}
                  record={record}
                  last={i === bucket.rows.length - 1}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PassportPage({ passportId }: { passportId: string }) {
  const [data, setData] = useState<PublicPassport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/passport/${passportId}`);
      if (res.data?.success) setData(res.data.data);
      else setError(res.data?.message || "Could not load this Passport");
    } catch (e: any) {
      setError(e.response?.data?.message || "Could not load this Passport");
    } finally {
      setLoading(false);
    }
  }, [passportId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          <p className="text-sm text-slate-500">Loading Passport…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <Search className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <h1 className="text-lg font-bold text-slate-900">
            Passport not found
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            {error}
          </p>
          <p className="mt-3 font-mono text-xs text-slate-400">{passportId}</p>
        </div>
      </div>
    );
  }

  const { attendance } = data;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Identity header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 px-4 pb-16 pt-6 text-center">
        {/* For most parents this page IS GWD — they arrive from a WhatsApp
            message with no account and no prior context. The mark says who is
            vouching for the record before anything else loads. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          loading="eager"
          decoding="async"
          src="/gwdlogo.png"
          alt="GWD Sports"
          className="mx-auto mb-5 h-35 w-auto opacity-95"
        />
        <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white/20 bg-slate-700">
          {data.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              loading="lazy"
              decoding="async"
              src={data.photoUrl}
              alt={data.studentName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-2xl font-extrabold text-white/80">
              {initials(data.studentName)}
            </span>
          )}
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">
          {data.studentName}
        </h1>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
          {data.age !== null && <span>{data.age} years</span>}
          {data.sports.length > 0 && (
            <>
              <span className="text-slate-600">·</span>
              <span className="capitalize">{data.sports.join(", ")}</span>
            </>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
          {data.currentAcademy && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
              <MapPin className="h-3 w-3" />
              {data.currentAcademy.name}
            </span>
          )}
          {/* The single strongest level anywhere in the record. Rendered only
              when a coach actually entered one — the API returns null rather
              than defaulting, so this badge can never overstate a child. */}
          {data.highestLevel && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400/20 to-amber-300/10 px-3 py-1 text-xs font-bold text-amber-200 ring-1 ring-amber-300/30">
              <Trophy className="h-3 w-3" />
              {data.highestLevel.label} level
            </span>
          )}
        </div>
        <p className="mt-3 font-mono text-[11px] tracking-widest text-slate-500">
          {data.passportId}
        </p>
      </div>

      <div className="mx-auto -mt-10 w-full max-w-lg space-y-4 px-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Stat
            icon={TrendingUp}
            value={attendance.rate !== null ? `${attendance.rate}%` : "—"}
            label="Attendance"
            tone="text-emerald-500"
          />
          <Stat
            icon={CalendarCheck}
            value={String(attendance.present)}
            label="Sessions"
            tone="text-blue-500"
          />
          <Stat
            icon={Flame}
            value={String(attendance.currentStreak)}
            label="Streak"
            tone="text-orange-500"
          />
        </div>

        {/* The sporting record. Placed directly under the stats — above even
            achievements — because it answers the question the page exists to
            answer: what has this child actually done? Badges are the system's
            view of a student; this is the coach's, and it is the part a parent
            forwards. */}
        {data.records.length > 0 && <SportingRecord records={data.records} />}

        {/* Achievements — the reason gwd_achievement_v1 links here. Placed
            above attendance because a parent arriving from that message is
            looking for the badge they were just told about. */}
        {data.achievements.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold text-slate-900">Achievements</h2>
            <div className="mt-3 space-y-2.5">
              {data.achievements.map((achievement) => (
                <div key={achievement.key} className="flex items-start gap-3">
                  <span className="text-2xl leading-none">{achievement.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {achievement.name}
                    </p>
                    <p className="text-xs leading-relaxed text-slate-500">
                      {achievement.description}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {prettyDate(achievement.earnedAt)}
                      {achievement.academyName ? ` · ${achievement.academyName}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress — category percentages only. Individual scores are never
            published; see the whitelist in lib/passport-public.ts. */}
        {data.progress.some((p) => p.percentage !== null) && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold text-slate-900">Progress</h2>
            <div className="mt-3 space-y-3">
              {data.progress.map((area) => (
                <div key={area.categoryKey}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-slate-600">{area.label}</span>
                    <span className="font-semibold text-slate-500">
                      {area.percentage === null ? "—" : `${area.percentage}%`}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                      style={{ width: `${area.percentage ?? 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-snug text-slate-400">
              Each area is scored separately — a training drill and a match are
              never averaged together.
            </p>
          </div>
        )}

        {/* Recent sessions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold text-slate-900">Recent sessions</h2>
          {attendance.recent.length === 0 ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              No sessions recorded yet. Attendance appears here as soon as the
              coach marks the register.
            </p>
          ) : (
            <>
              <p className="mt-0.5 text-xs text-slate-400">
                Last attended {prettyDate(attendance.lastAttended)}
              </p>
              <div className="mt-3 space-y-1.5">
                {attendance.recent.map((session) => (
                  <div
                    key={`${session.date}-${session.present}`}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <span className="text-sm text-slate-600">
                      {shortDate(session.date)}
                    </span>
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        session.present ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      {session.present ? "Present" : "Absent"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* History — the reason a Passport exists */}
        {data.academyHistory.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold text-slate-900">Academies</h2>
            <div className="mt-3 space-y-3">
              {data.academyHistory.map((stint) => (
                <div key={`${stint.academyName}-${stint.joinedAt}`} className="flex gap-3">
                  <div className="mt-1 flex flex-col items-center">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        stint.leftAt ? "bg-slate-300" : "bg-emerald-500"
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1 pb-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {stint.academyName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {prettyDate(stint.joinedAt)} —{" "}
                      {stint.leftAt ? prettyDate(stint.leftAt) : "present"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {data.memberSince && (
              <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
                On GWD since {prettyDate(data.memberSince)}
              </p>
            )}
          </div>
        )}

        {/* What this is. The reader has no account and no context. */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start gap-3">
            <Award className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                What is a Sports Passport?
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                A permanent record of {data.studentName.split(" ")[0]}'s training
                — attendance, progress and achievements. It belongs to them, not
                to an academy: if they move, the record moves with them and
                nothing restarts.
              </p>
            </div>
          </div>
        </div>

        <p className="flex items-center justify-center gap-1.5 pt-2 text-center text-[11px] text-slate-400">
          <ShieldCheck className="h-3 w-3" />
          This page shows training information only. No contact, fee or medical
          details are published here.
        </p>
      </div>
    </div>
  );
}

export default PassportPage;
