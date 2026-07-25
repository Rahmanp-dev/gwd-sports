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
  isActive: boolean;
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
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 px-4 pb-16 pt-10 text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white/20 bg-slate-700">
          {data.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
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
        {data.currentAcademy && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
            <MapPin className="h-3 w-3" />
            {data.currentAcademy.name}
          </p>
        )}
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
