"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/utils/constants";
import { useAppSelector } from "@/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  AlertTriangle,
  Award,
  CalendarCheck,
  IndianRupee,
  Loader2,
  Package,
  Phone,
  QrCode,
} from "lucide-react";

/**
 * One student, everything a coach needs — the four P0 "view student X in
 * trainer page" items, plus achievements.
 *
 * One request rather than four, because a coach opens a student to look at all
 * of it and four round trips on academy wifi is four chances to see a spinner.
 */

interface CategoryAverage {
  categoryKey: string;
  label: string;
  percentage: number | null;
  evaluations: number;
}

interface Detail {
  student: {
    userId: string;
    name: string;
    passportId: string | null;
    level: string | null;
    sports: string[];
    parentName: string | null;
    parentPhone: string | null;
    batch: { name: string; sport: string } | null;
  };
  performance: {
    categoryAverages: CategoryAverage[];
    overall: number | null;
    records: {
      categoryKey: string;
      categoryLabel: string;
      metric: string | null;
      score: number;
      maxScore: number;
      percentage: number | null;
      remarks: string | null;
      evaluatedAt: string;
      inferredCategory: boolean;
    }[];
  };
  attendance: {
    total: number;
    present: number;
    rate: number | null;
    records: { date: string; present: boolean; source: string; remarks: string | null }[];
  };
  fees: {
    feeAmount: number | null;
    feePeriod: string | null;
    outstanding: number;
    totalPaid: number;
    dueDayOfMonth: number | null;
    recentPayments: { amount: number; status: string; paidAt: string | null }[];
  };
  kits: { kitName: string; status: string; requestedAt: string | null }[];
  achievements: {
    key: string;
    name: string;
    description: string;
    icon: string;
    source: string;
    earnedAt: string;
  }[];
  awardable: { key: string; name: string; description: string; icon: string }[];
}

function when(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Colour maps to how a coach should read the number, not to the number itself. */
function toneFor(percentage: number | null): string {
  if (percentage === null) return "bg-gray-600";
  if (percentage >= 80) return "bg-emerald-500";
  if (percentage >= 60) return "bg-blue-500";
  if (percentage >= 40) return "bg-amber-500";
  return "bg-red-500";
}

export function StudentDetail({ studentUserId }: { studentUserId: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [awarding, setAwarding] = useState<string | null>(null);
  const [awardNote, setAwardNote] = useState("");

  const { token } = useAppSelector((s) => s.auth);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/trainer/student-detail`, {
        params: { studentUserId },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) setDetail(res.data.data);
      else setError(res.data?.message || "Could not load this student");
    } catch (e: any) {
      setError(e.response?.data?.message || "Could not load this student");
    } finally {
      setLoading(false);
    }
  }, [studentUserId, token]);

  useEffect(() => {
    if (token && studentUserId) load();
  }, [token, studentUserId, load]);

  const award = async (key: string) => {
    setAwarding(key);
    setError("");
    try {
      const res = await axios.post(
        `${API_BASE_URL}/trainer/student-detail`,
        { studentUserId, achievementKey: key, note: awardNote || undefined },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data?.success) {
        setAwardNote("");
        load();
      } else {
        setError(res.data?.message || "Could not award that");
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "Could not award that");
    } finally {
      setAwarding(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="rounded-xl border border-red-800/50 bg-red-950/40 px-4 py-3">
        <p className="text-sm text-red-200">{error}</p>
      </div>
    );
  }

  if (!detail) return null;

  const { student, performance, attendance, fees, kits, achievements } = detail;
  const alreadyEarned = new Set(achievements.map((a) => a.key));

  return (
    <div className="space-y-4">
      {/* Identity */}
      <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">{student.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
              {student.passportId && (
                <span className="font-mono">{student.passportId}</span>
              )}
              {student.level && <span className="capitalize">{student.level}</span>}
              {student.batch && <span>{student.batch.name}</span>}
            </div>
          </div>
          {student.parentPhone && (
            <a
              href={`tel:${student.parentPhone}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-950/50 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-900/50"
            >
              <Phone className="h-3 w-3" />
              {student.parentName || "Parent"}
            </a>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800/50 bg-red-950/40 px-3 py-2">
          <p className="text-xs text-red-200">{error}</p>
        </div>
      )}

      <Tabs defaultValue="performance" className="space-y-4">
        {/* Five triggers at 375px is ~70px each. Wrap to three columns on a
            phone instead, with h-auto so the second row is not clipped. */}
        <TabsList className="grid h-auto w-full grid-cols-3 sm:grid-cols-5 bg-gray-800 text-xs">
          <TabsTrigger value="performance" className="data-[state=active]:bg-blue-600">
            Performance
          </TabsTrigger>
          <TabsTrigger value="attendance" className="data-[state=active]:bg-blue-600">
            Attendance
          </TabsTrigger>
          <TabsTrigger value="fees" className="data-[state=active]:bg-blue-600">
            Fees
          </TabsTrigger>
          <TabsTrigger value="kits" className="data-[state=active]:bg-blue-600">
            Kits
          </TabsTrigger>
          <TabsTrigger value="awards" className="data-[state=active]:bg-blue-600">
            Awards
          </TabsTrigger>
        </TabsList>

        {/* PERFORMANCE */}
        <TabsContent value="performance" className="space-y-3">
          <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                By area of the game
              </span>
              {performance.overall !== null && (
                <span className="text-sm font-bold text-white">
                  {performance.overall}% overall
                </span>
              )}
            </div>
            <div className="space-y-2.5">
              {performance.categoryAverages.map((average) => (
                <div key={average.categoryKey}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-gray-300">{average.label}</span>
                    <span className="text-gray-400">
                      {average.percentage === null
                        ? "not assessed"
                        : `${average.percentage}% · ${average.evaluations} assessment${average.evaluations === 1 ? "" : "s"}`}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-700">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${toneFor(average.percentage)}`}
                      style={{ width: `${average.percentage ?? 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 border-t border-gray-700 pt-2 text-[11px] leading-snug text-gray-500">
              Scores are averaged within each area only. A technical drill and a
              match-play assessment measure different things and are never mixed.
            </p>
          </div>

          {performance.records.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">
              No evaluations recorded yet.
            </p>
          ) : (
            <div className="space-y-2">
              {performance.records.map((record, index) => (
                <div
                  key={`${record.evaluatedAt}-${index}`}
                  className="rounded-lg border border-gray-700 bg-gray-800/60 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-semibold capitalize text-white">
                          {record.metric || "—"}
                        </span>
                        <Badge
                          variant="outline"
                          className="h-4 border-gray-600 text-[9px] text-gray-400"
                        >
                          {record.categoryLabel}
                        </Badge>
                        {record.inferredCategory && (
                          // Honest about a guess: this record predates the
                          // taxonomy and its category was inferred.
                          <Badge
                            variant="outline"
                            className="h-4 border-amber-800 bg-amber-950/40 text-[9px] text-amber-400"
                          >
                            inferred
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-[10px] text-gray-500">
                        {when(record.evaluatedAt)}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-sm font-bold text-white">
                      {record.score}
                      <span className="text-xs font-normal text-gray-500">
                        /{record.maxScore}
                      </span>
                    </span>
                  </div>
                  {record.remarks && (
                    <p className="mt-1.5 text-xs italic leading-relaxed text-gray-400">
                      "{record.remarks}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ATTENDANCE */}
        <TabsContent value="attendance" className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Rate", value: attendance.rate !== null ? `${attendance.rate}%` : "—" },
              { label: "Present", value: String(attendance.present) },
              { label: "Recorded", value: String(attendance.total) },
            ].map((tile) => (
              <div
                key={tile.label}
                className="rounded-xl border border-gray-700 bg-gray-800 p-3 text-center"
              >
                <p className="text-xl font-extrabold text-white">{tile.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-500">
                  {tile.label}
                </p>
              </div>
            ))}
          </div>
          {attendance.records.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">
              No attendance recorded yet.
            </p>
          ) : (
            <div className="space-y-1.5">
              {attendance.records.map((record, index) => (
                <div
                  key={`${record.date}-${index}`}
                  className="flex items-center justify-between rounded-lg bg-gray-800/60 px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-sm text-gray-300">
                    {when(record.date)}
                    {record.source === "self_qr" && (
                      <QrCode className="h-3 w-3 text-blue-400" />
                    )}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      record.present ? "text-emerald-400" : "text-gray-500"
                    }`}
                  >
                    {record.present ? "Present" : "Absent"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* FEES */}
        <TabsContent value="fees" className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-gray-700 bg-gray-800 p-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-500">
                Outstanding
              </p>
              <p
                className={`text-xl font-extrabold ${
                  fees.outstanding > 0 ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                ₹{fees.outstanding.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="rounded-xl border border-gray-700 bg-gray-800 p-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-500">
                Paid to date
              </p>
              <p className="text-xl font-extrabold text-white">
                ₹{fees.totalPaid.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-gray-700 bg-gray-800 p-3 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Fee</span>
              <span className="text-gray-300">
                {fees.feeAmount ? `₹${fees.feeAmount.toLocaleString("en-IN")}` : "not set"}
                {fees.feePeriod ? ` / ${fees.feePeriod}` : ""}
              </span>
            </div>
            {fees.dueDayOfMonth && (
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Due on</span>
                <span className="text-gray-300">day {fees.dueDayOfMonth}</span>
              </div>
            )}
          </div>
          {fees.recentPayments.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-gray-500">
                Recent payments
              </p>
              {fees.recentPayments.map((payment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-gray-800/60 px-3 py-2 text-xs"
                >
                  <span className="text-gray-400">{when(payment.paidAt)}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-white">
                      ₹{payment.amount?.toLocaleString("en-IN")}
                    </span>
                    <Badge
                      variant="outline"
                      className="h-4 border-gray-600 text-[9px] capitalize text-gray-400"
                    >
                      {payment.status}
                    </Badge>
                  </span>
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] leading-snug text-gray-500">
            Shown so you know not to ask. Fees are collected by the academy, not
            by coaches.
          </p>
        </TabsContent>

        {/* KITS */}
        <TabsContent value="kits">
          {kits.length === 0 ? (
            <div className="py-10 text-center">
              <Package className="mx-auto mb-2 h-8 w-8 text-gray-600" />
              <p className="text-sm text-gray-500">No kit records.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {kits.map((kit, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{kit.kitName}</p>
                    <p className="text-[10px] text-gray-500">
                      {when(kit.requestedAt)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] capitalize ${
                      kit.status === "delivered"
                        ? "border-emerald-800 bg-emerald-950/40 text-emerald-400"
                        : "border-gray-600 text-gray-400"
                    }`}
                  >
                    {kit.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* AWARDS */}
        <TabsContent value="awards" className="space-y-3">
          {achievements.length > 0 && (
            <div className="space-y-2">
              {achievements.map((achievement) => (
                <div
                  key={achievement.key}
                  className="flex items-start gap-3 rounded-lg border border-gray-700 bg-gray-800/60 p-3"
                >
                  <span className="text-2xl leading-none">{achievement.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">
                      {achievement.name}
                    </p>
                    <p className="text-xs text-gray-400">{achievement.description}</p>
                    <p className="mt-0.5 text-[10px] text-gray-500">
                      {when(achievement.earnedAt)}
                      {achievement.source === "automatic" ? " · earned" : " · awarded"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Give an award
            </p>
            <p className="mt-1 text-[11px] leading-snug text-gray-500">
              The parent gets a message they can forward, and it goes on the
              student's Passport permanently. It cannot be taken back.
            </p>
            <div className="mt-3 space-y-2">
              {detail.awardable.map((option) => {
                const earned = alreadyEarned.has(option.key);
                return (
                  <button
                    key={option.key}
                    disabled={earned || awarding !== null}
                    onClick={() => award(option.key)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      earned
                        ? "cursor-not-allowed border-gray-700 bg-gray-800/40 opacity-50"
                        : "border-gray-700 bg-gray-800/60 hover:border-blue-600 hover:bg-gray-700/60"
                    }`}
                  >
                    <span className="text-xl leading-none">{option.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-white">
                        {option.name}
                      </span>
                      <span className="block text-[11px] text-gray-500">
                        {earned ? "Already awarded" : option.description}
                      </span>
                    </span>
                    {awarding === option.key && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default StudentDetail;
