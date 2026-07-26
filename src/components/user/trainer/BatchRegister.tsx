"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/utils/constants";
import { useAppSelector } from "@/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCheck,
  Loader2,
  QrCode,
  RefreshCw,
  Users,
  X,
} from "lucide-react";

/**
 * The coach's one-click register.
 *
 * The design goal is that marking a full batch takes one glance and one tap
 * per exception. So: everyone starts PRESENT. A coach marks the two children
 * who did not turn up and saves — rather than tapping twenty times to record a
 * normal evening. Attendance registers are overwhelmingly "everyone came", and
 * a UI that charges twenty taps for the common case is a UI that gets filled in
 * from memory on the drive home, if at all.
 *
 * Children whose parent already scanned the QR at the gate arrive pre-ticked
 * and labelled. That is the dual-mode payoff: the coach confirms a list instead
 * of building one.
 */

interface RosterEntry {
  studentUserId: string;
  name: string;
  passportId: string | null;
  hasParentPhone: boolean;
  marked: {
    present: boolean;
    source: "coach" | "self_qr";
    checkedInAt: string | null;
  } | null;
}

interface BatchSummary {
  _id: string;
  name: string;
  sport: string;
  daysOfWeek: string[];
  startTime: string | null;
  endTime: string | null;
  studentCount: number;
  meetsToday: boolean;
}

interface SessionInfo {
  sessionId: string;
  date: string;
  weekday: string;
  isScheduledDay: boolean;
}

/** Today in IST as YYYY-MM-DD, so the coach's device timezone cannot shift it. */
function todayIst(): string {
  const now = new Date();
  const shifted = new Date(now.getTime() + 330 * 60_000);
  return shifted.toISOString().slice(0, 10);
}

export function BatchRegister() {
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [batchId, setBatchId] = useState<string>("");
  const [date, setDate] = useState<string>(todayIst());

  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [session, setSession] = useState<SessionInfo | null>(null);
  // studentUserId -> present. Seeded from the roster, then owned by the coach.
  const [marks, setMarks] = useState<Record<string, boolean>>({});

  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<{ updated: number; notified: number } | null>(
    null,
  );

  const { token } = useAppSelector((s) => s.auth);

  const fetchBatches = useCallback(async () => {
    setLoadingBatches(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/trainer/batches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        const list: BatchSummary[] = res.data.data.batches || [];
        setBatches(list);
        // Default to a batch that actually meets today — that is the one the
        // coach opened this screen to mark.
        if (!batchId && list.length > 0) {
          setBatchId((list.find((b) => b.meetsToday) ?? list[0])._id);
        }
      } else {
        setError(res.data?.message || "Could not load your batches");
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "Could not load your batches");
    } finally {
      setLoadingBatches(false);
    }
  }, [token, batchId]);

  const fetchRoster = useCallback(async () => {
    if (!batchId) return;
    setLoadingRoster(true);
    setError("");
    setSaved(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/trainer/batch-attendance`, {
        params: { batchId, date },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        const entries: RosterEntry[] = res.data.data.roster || [];
        setRoster(entries);
        setSession(res.data.data.session);
        // Everyone defaults to present. An already-marked child keeps whatever
        // the previous save or their parent's scan recorded.
        setMarks(
          Object.fromEntries(
            entries.map((e) => [e.studentUserId, e.marked ? e.marked.present : true]),
          ),
        );
      } else {
        setError(res.data?.message || "Could not load the roster");
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "Could not load the roster");
    } finally {
      setLoadingRoster(false);
    }
  }, [batchId, date, token]);

  useEffect(() => {
    if (token) fetchBatches();
    // fetchBatches depends on batchId only to seed a default once; re-running
    // it on every batch change would refetch the list pointlessly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (token && batchId) fetchRoster();
  }, [token, batchId, date, fetchRoster]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await axios.post(
        `${API_BASE_URL}/trainer/batch-attendance`,
        {
          batchId,
          date,
          marks: roster.map((entry) => ({
            studentUserId: entry.studentUserId,
            present: marks[entry.studentUserId] ?? true,
          })),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data?.success) {
        setSaved({
          updated: res.data.data.updated,
          notified: res.data.data.parentsNotified,
        });
        fetchRoster();
      } else {
        setError(res.data?.message || "Could not save the register");
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "Could not save the register");
    } finally {
      setSaving(false);
    }
  };

  const presentCount = roster.filter(
    (e) => marks[e.studentUserId] ?? true,
  ).length;
  const selectedBatch = batches.find((b) => b._id === batchId);

  if (loadingBatches) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
        <p className="text-sm text-gray-400">Loading your batches…</p>
      </div>
    );
  }

  if (batches.length === 0) {
    /**
     * This is the single most common reason a coach reports "I have no
     * attendance screen". The feature is not missing or switched off — there is
     * simply no Batch with this coach in its `coaches` array, which is also the
     * state every newly onboarded academy starts in. So say what to do about
     * it, by name, rather than leaving a dead end.
     */
    return (
      <div className="rounded-xl border border-gray-700 bg-gray-800 p-8 text-center">
        <Users className="mx-auto mb-3 h-9 w-9 text-gray-600" />
        <p className="text-sm font-medium text-gray-300">
          You are not assigned to any batch yet.
        </p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-gray-500">
          Attendance is marked per batch, so this screen stays empty until you
          are on one. Ask an academy admin to open{" "}
          <span className="font-semibold text-gray-400">
            Admin dashboard → Check-in
          </span>
          , create a batch for the sessions you coach, and add you to its
          coaches. Your register and its QR code appear here straight after.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Batch + date */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
            Batch
          </label>
          <select
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            {batches.map((batch) => (
              <option key={batch._id} value={batch._id}>
                {batch.name} · {batch.sport} ({batch.studentCount})
                {batch.meetsToday ? "" : " — not today"}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:w-44">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
            Date
          </label>
          <input
            type="date"
            value={date}
            max={todayIst()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
        <Button
          variant="outline"
          onClick={fetchRoster}
          disabled={loadingRoster}
          className="border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {session && !session.isScheduledDay && selectedBatch && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-800/50 bg-amber-950/40 px-3 py-2.5">
          <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
          <p className="text-xs leading-relaxed text-amber-200">
            {selectedBatch.name} does not normally train on {session.weekday}s.
            You can still mark this as a one-off session.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-800/50 bg-red-950/40 px-3 py-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
          <p className="text-xs leading-relaxed text-red-200">{error}</p>
        </div>
      )}

      {saved && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-800/50 bg-emerald-950/40 px-3 py-2.5">
          <CheckCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
          <p className="text-xs leading-relaxed text-emerald-200">
            Register saved — {saved.updated} student
            {saved.updated === 1 ? "" : "s"} recorded
            {saved.notified > 0
              ? `, ${saved.notified} parent${saved.notified === 1 ? "" : "s"} queued for a check-in message.`
              : "."}
          </p>
        </div>
      )}

      {loadingRoster ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      ) : roster.length === 0 ? (
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-8 text-center">
          <Users className="mx-auto mb-3 h-9 w-9 text-gray-600" />
          <p className="text-sm text-gray-400">
            No students in this batch yet.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              <span className="font-bold text-white">{presentCount}</span> of{" "}
              {roster.length} present
            </p>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setMarks(
                    Object.fromEntries(roster.map((e) => [e.studentUserId, true])),
                  )
                }
                className="rounded-lg border border-gray-700 px-2.5 py-1 text-[11px] font-semibold text-gray-300 hover:bg-gray-700"
              >
                All present
              </button>
              <button
                onClick={() =>
                  setMarks(
                    Object.fromEntries(roster.map((e) => [e.studentUserId, false])),
                  )
                }
                className="rounded-lg border border-gray-700 px-2.5 py-1 text-[11px] font-semibold text-gray-300 hover:bg-gray-700"
              >
                All absent
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {roster.map((entry) => {
              const present = marks[entry.studentUserId] ?? true;
              const selfCheckedIn = entry.marked?.source === "self_qr";
              return (
                <button
                  key={entry.studentUserId}
                  onClick={() =>
                    setMarks((prev) => ({
                      ...prev,
                      [entry.studentUserId]: !present,
                    }))
                  }
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                    present
                      ? "border-emerald-800/60 bg-emerald-950/30"
                      : "border-gray-700 bg-gray-800/60"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {entry.name}
                      </span>
                      {selfCheckedIn && (
                        <Badge
                          variant="outline"
                          className="h-5 gap-1 border-blue-700 bg-blue-950/50 text-[10px] text-blue-300"
                        >
                          <QrCode className="h-2.5 w-2.5" /> Scanned in
                        </Badge>
                      )}
                      {!entry.hasParentPhone && (
                        <Badge
                          variant="outline"
                          className="h-5 border-gray-700 text-[10px] text-gray-500"
                        >
                          no parent number
                        </Badge>
                      )}
                    </div>
                    {entry.passportId && (
                      <p className="mt-0.5 font-mono text-[10px] text-gray-500">
                        {entry.passportId}
                      </p>
                    )}
                  </div>
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                      present
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {present ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <Button
            onClick={save}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="mr-2 h-4 w-4" />
            )}
            Save register
          </Button>
          <p className="text-center text-[11px] leading-relaxed text-gray-500">
            Parents of students marked present get a check-in message. Absences
            are never messaged — that is a conversation, not a notification.
          </p>
        </>
      )}
    </div>
  );
}

export default BatchRegister;
