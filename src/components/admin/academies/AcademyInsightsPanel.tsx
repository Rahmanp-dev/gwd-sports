"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CalendarCheck,
  Check,
  Loader2,
  MessageSquare,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import apiService from "@/services/apiService";
import { Card, CardContent } from "@/components/ui/card";

/**
 * The per-academy usage picture, for GWD rather than for the academy.
 *
 * Answers one question — "is this owner actually using what we sold them?" —
 * and is deliberately built from windows (last 7/30 days) rather than
 * lifetime totals, because a roster imported once and abandoned looks
 * identical to a thriving academy on any total. See lib/admin/academyInsights.
 */

interface Props {
  academyId: string;
  academyName: string;
  onClose: () => void;
}

const BAND_STYLES: Record<string, { label: string; className: string }> = {
  thriving: { label: "Thriving", className: "bg-emerald-100 text-emerald-700" },
  healthy: { label: "Healthy", className: "bg-blue-100 text-blue-700" },
  at_risk: { label: "At risk", className: "bg-amber-100 text-amber-700" },
  dormant: { label: "Dormant", className: "bg-red-100 text-red-700" },
};

const inr = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const ago = (value: string | null) => {
  if (!value) return "never";
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
};

export default function AcademyInsightsPanel({
  academyId,
  academyName,
  onClose,
}: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res: any = await apiService.get(`/admin/academies/${academyId}/insights`);
      setData(res?.data ?? null);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Could not load usage data.");
    } finally {
      setLoading(false);
    }
  }, [academyId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-slate-900">
              {academyName}
            </h3>
            <p className="text-xs text-slate-500">Platform usage &amp; engagement</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <div className="px-6 py-10 text-center text-sm text-red-600">{error}</div>
        ) : data ? (
          <div className="space-y-5 p-6">
            {/* ── Engagement verdict ──────────────────────────────────── */}
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {data.engagement.score}
                  </span>
                  <span className="text-sm text-slate-400">/ 100</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                      BAND_STYLES[data.engagement.band]?.className ?? ""
                    }`}
                  >
                    {BAND_STYLES[data.engagement.band]?.label ?? data.engagement.band}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  Owner last signed in {ago(data.owner.lastLogin)}
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {data.engagement.signals.map((s: any) => (
                  <div
                    key={s.label}
                    className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2"
                  >
                    {s.ok ? (
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800">{s.label}</p>
                      <p className="text-[11px] text-slate-500">{s.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Money ───────────────────────────────────────────────── */}
            <Card className="border-slate-200 shadow-none">
              <CardContent className="p-4">
                <p className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <Banknote className="h-3 w-3" /> Collection (last 30 days)
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Metric
                    label="Through GWD"
                    value={inr(data.money.onlinePaise30d)}
                    sub={`${data.money.onlineCount30d} payment(s)`}
                  />
                  <Metric
                    label="Marked offline"
                    value={inr(data.money.offlinePaise30d)}
                    sub={`${data.money.offlineCount30d} entry(s)`}
                  />
                  <Metric
                    label="Online share (lifetime)"
                    value={
                      data.money.onlineSharePct === null
                        ? "—"
                        : `${data.money.onlineSharePct}%`
                    }
                    sub={`Last payment ${ago(data.money.lastPaymentAt)}`}
                  />
                </div>
                {data.money.onlineSharePct !== null && data.money.onlineSharePct < 40 && (
                  <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
                    Most of this academy&rsquo;s money is collected outside GWD and
                    recorded afterwards. They are using the platform as a ledger,
                    not as a payment rail.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* ── Roster & coaching ───────────────────────────────────── */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-slate-200 shadow-none">
                <CardContent className="p-4">
                  <p className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    <Users className="h-3 w-3" /> Roster
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Metric label="Students" value={String(data.roster.students)} sub={`${data.roster.activeStudents} active`} />
                    <Metric label="Trainers" value={String(data.roster.trainers)} />
                    <Metric
                      label="Updated (7d)"
                      value={String(data.roster.profilesUpdated7d)}
                      sub={`${data.roster.profilesUpdated30d} in 30d`}
                    />
                    <Metric label="New (30d)" value={String(data.roster.newStudents30d)} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-none">
                <CardContent className="p-4">
                  <p className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    <CalendarCheck className="h-3 w-3" /> Coaching activity
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Metric
                      label="Attendance (30d)"
                      value={String(data.coaching.attendanceMarks30d)}
                      sub={`Last ${ago(data.coaching.lastAttendanceAt)}`}
                    />
                    <Metric
                      label="Performance (30d)"
                      value={String(data.coaching.performanceEntries30d)}
                      sub={`Last ${ago(data.coaching.lastPerformanceAt)}`}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Messaging & alerts ──────────────────────────────────── */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-slate-200 shadow-none">
                <CardContent className="p-4">
                  <p className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    <MessageSquare className="h-3 w-3" /> Parent messaging (30d)
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <Metric label="Sent" value={String(data.messaging.sent30d)} />
                    <Metric label="Failed" value={String(data.messaging.failed30d)} />
                    <Metric label="Queued" value={String(data.messaging.queued)} />
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    Last sent {ago(data.messaging.lastSentAt)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-none">
                <CardContent className="p-4">
                  <p className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    <TrendingUp className="h-3 w-3" /> Open owner alerts
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Metric label="Open" value={String(data.alerts.open)} />
                    <Metric
                      label="Needs decision"
                      value={String(data.alerts.requiringDecision)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-3 text-[11px] leading-relaxed text-slate-500">
              Owner: {data.owner.name ?? "—"} · {data.owner.email ?? "—"} ·{" "}
              {data.owner.phone ?? "—"}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="text-xl font-extrabold text-slate-900">{value}</p>
      {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}
