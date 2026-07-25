"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/utils/constants";
import { useAppSelector } from "@/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  Clock,
  Loader2,
  Pencil,
  Plus,
  QrCode,
  RefreshCw,
  Users,
  X,
} from "lucide-react";

/**
 * Batch schedules.
 *
 * This screen exists because of a specific hole Phase 3 opened. The bulk import
 * creates a batch per sport with a name and nothing else, and until Phase 3
 * nothing read the schedule fields, so that was harmless. Now they compute the
 * QR check-in window — an unscheduled batch has a printed code accepted on any
 * day from 05:00 to 23:00. That is not what an owner taping a code to a wall
 * believes they are doing, so the gap is stated in plain words on every batch
 * that has it rather than being left to be discovered.
 */

/**
 * Two letters, not one: single initials collide on Tuesday/Thursday and
 * Saturday/Sunday, and a coach mis-setting a training day is exactly the error
 * that produces a QR code refusing scans on the evening it matters.
 */
const DAYS: { key: string; short: string }[] = [
  { key: "monday", short: "Mo" },
  { key: "tuesday", short: "Tu" },
  { key: "wednesday", short: "We" },
  { key: "thursday", short: "Th" },
  { key: "friday", short: "Fr" },
  { key: "saturday", short: "Sa" },
  { key: "sunday", short: "Su" },
];

interface Coach {
  _id: string;
  name: string;
}

interface Batch {
  _id: string;
  name: string;
  sport: string;
  daysOfWeek: string[];
  startTime: string | null;
  endTime: string | null;
  coaches: Coach[];
  studentCount: number;
  hasQrCode: boolean;
  isActive: boolean;
  scheduleGaps: string[];
}

interface Draft {
  name: string;
  sport: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  coaches: string[];
}

const EMPTY_DRAFT: Draft = {
  name: "",
  sport: "",
  daysOfWeek: [],
  startTime: "",
  endTime: "",
  coaches: [],
};

function draftFrom(batch: Batch): Draft {
  return {
    name: batch.name,
    sport: batch.sport,
    daysOfWeek: [...batch.daysOfWeek],
    startTime: batch.startTime ?? "",
    endTime: batch.endTime ?? "",
    coaches: batch.coaches.map((c) => c._id),
  };
}

export function BatchManagement() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [coachOptions, setCoachOptions] = useState<Coach[]>([]);
  const [unscheduled, setUnscheduled] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // null = nothing open, "new" = create form, otherwise the batch id.
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const { token } = useAppSelector((s) => s.auth);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/academy/batches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setBatches(res.data.data.batches || []);
        setCoachOptions(res.data.data.coachOptions || []);
        setUnscheduled(res.data.data.unscheduledCount || 0);
      } else {
        setError(res.data?.message || "Could not load batches");
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "Could not load batches");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchBatches();
  }, [token, fetchBatches]);

  const open = (batch: Batch | null) => {
    setEditing(batch ? batch._id : "new");
    setDraft(batch ? draftFrom(batch) : EMPTY_DRAFT);
    setFormError("");
  };

  const close = () => {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setFormError("");
  };

  const toggleDay = (day: string) => {
    setDraft((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  const toggleCoach = (coachId: string) => {
    setDraft((prev) => ({
      ...prev,
      coaches: prev.coaches.includes(coachId)
        ? prev.coaches.filter((c) => c !== coachId)
        : [...prev.coaches, coachId],
    }));
  };

  const save = async () => {
    setSaving(true);
    setFormError("");
    const body = {
      name: draft.name,
      sport: draft.sport,
      daysOfWeek: draft.daysOfWeek,
      startTime: draft.startTime,
      endTime: draft.endTime,
      coaches: draft.coaches,
    };
    try {
      const res =
        editing === "new"
          ? await axios.post(`${API_BASE_URL}/academy/batches`, body, {
              headers: { Authorization: `Bearer ${token}` },
            })
          : await axios.patch(
              `${API_BASE_URL}/academy/batches`,
              { batchId: editing, ...body },
              { headers: { Authorization: `Bearer ${token}` } },
            );
      if (res.data?.success) {
        close();
        fetchBatches();
      } else {
        setFormError(res.data?.message || "Could not save");
      }
    } catch (e: any) {
      setFormError(e.response?.data?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const setActive = async (batch: Batch, isActive: boolean) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/academy/batches`,
        { batchId: batch._id, isActive },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchBatches();
    } catch (e: any) {
      setError(e.response?.data?.message || "Could not update the batch");
    }
  };

  const editor = (
    <Card className="border-0 shadow-sm ring-2 ring-slate-900/10">
      <CardContent className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Batch name
            </label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Evening Seniors"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Sport
            </label>
            <Input
              value={draft.sport}
              onChange={(e) => setDraft({ ...draft, sport: e.target.value })}
              placeholder="cricket"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Training days
          </label>
          <div className="flex flex-wrap gap-1.5">
            {DAYS.map((day) => {
              const on = draft.daysOfWeek.includes(day.key);
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => toggleDay(day.key)}
                  title={day.key}
                  className={`h-9 w-11 rounded-lg border text-xs font-bold capitalize transition-colors ${
                    on
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {day.short}
                  <span className="sr-only">{day.key}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Starts
            </label>
            <Input
              type="time"
              value={draft.startTime}
              onChange={(e) => setDraft({ ...draft, startTime: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Ends
            </label>
            <Input
              type="time"
              value={draft.endTime}
              onChange={(e) => setDraft({ ...draft, endTime: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Coaches
          </label>
          {coachOptions.length === 0 ? (
            <p className="text-xs text-slate-400">
              No trainers at this academy yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {coachOptions.map((coach) => {
                const on = draft.coaches.includes(coach._id);
                return (
                  <button
                    key={coach._id}
                    type="button"
                    onClick={() => toggleCoach(coach._id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      on
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {coach.name}
                  </button>
                );
              })}
            </div>
          )}
          <p className="mt-1.5 text-[11px] text-slate-400">
            Only assigned coaches can mark this batch's register. Admins can
            always mark it.
          </p>
        </div>

        {formError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
            <p className="text-xs leading-relaxed text-red-700">{formError}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={save} disabled={saving} size="sm">
            {saving ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="mr-1.5 h-3.5 w-3.5" />
            )}
            {editing === "new" ? "Create batch" : "Save changes"}
          </Button>
          <Button variant="outline" size="sm" onClick={close} disabled={saving}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <Loader2 className="h-7 w-7 animate-spin text-red-500" />
        <p className="text-sm font-medium text-slate-500">Loading batches…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Batches &amp; schedule
          </h2>
          <p className="text-sm text-slate-500">
            When each batch trains. This is what the check-in code checks
            against.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchBatches}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" onClick={() => open(null)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New batch
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* The headline warning. An owner who imported their roster has every
          batch in this state and no reason to suspect it. */}
      {unscheduled > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <CalendarClock className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="text-sm text-amber-900">
            <p className="font-bold">
              {unscheduled} batch{unscheduled === 1 ? "" : "es"} have no
              schedule.
            </p>
            <p className="mt-0.5 leading-relaxed text-amber-800/90">
              Their check-in codes are accepted on any day of the week, from
              05:00 to 23:00. Batches created by the student import start this
              way — set the days and times to narrow it.
            </p>
          </div>
        </div>
      )}

      {editing === "new" && editor}

      {batches.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-14">
            <Users className="h-9 w-9 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No batches yet.</p>
            <p className="max-w-sm text-center text-xs text-slate-400">
              Batches are created automatically when you import students, or add
              one here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {batches.map((batch) =>
            editing === batch._id ? (
              <div key={batch._id}>{editor}</div>
            ) : (
              <Card
                key={batch._id}
                className={`border-0 shadow-sm transition-shadow hover:shadow-md ${
                  batch.isActive ? "" : "opacity-60"
                }`}
              >
                <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-slate-900">
                        {batch.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-slate-50 text-[10px] capitalize text-slate-600"
                      >
                        {batch.sport}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="gap-1 border-slate-200 text-[10px] text-slate-500"
                      >
                        <Users className="h-2.5 w-2.5" />
                        {batch.studentCount}
                      </Badge>
                      {batch.hasQrCode && (
                        <Badge
                          variant="outline"
                          className="gap-1 border-indigo-200 bg-indigo-50 text-[10px] text-indigo-600"
                        >
                          <QrCode className="h-2.5 w-2.5" /> code printed
                        </Badge>
                      )}
                      {!batch.isActive && (
                        <Badge
                          variant="outline"
                          className="border-slate-300 text-[10px] text-slate-500"
                        >
                          inactive
                        </Badge>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <CalendarClock className="h-3 w-3 text-slate-400" />
                        {batch.daysOfWeek.length > 0 ? (
                          <span className="capitalize">
                            {batch.daysOfWeek
                              .map((d) => d.slice(0, 3))
                              .join(", ")}
                          </span>
                        ) : (
                          <span className="text-amber-600">no days set</span>
                        )}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {batch.startTime && batch.endTime ? (
                          `${batch.startTime}–${batch.endTime}`
                        ) : (
                          <span className="text-amber-600">no times set</span>
                        )}
                      </span>
                      {batch.coaches.length > 0 && (
                        <span className="text-slate-400">
                          {batch.coaches.map((c) => c.name).join(", ")}
                        </span>
                      )}
                    </div>

                    {batch.scheduleGaps.length > 0 && batch.isActive && (
                      <ul className="mt-2 space-y-0.5">
                        {batch.scheduleGaps.map((gap) => (
                          <li
                            key={gap}
                            className="flex items-start gap-1.5 text-[11px] leading-snug text-amber-700"
                          >
                            <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                            {gap}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex flex-shrink-0 gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => open(batch)}
                      className="h-8 text-xs"
                    >
                      <Pencil className="mr-1.5 h-3 w-3" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActive(batch, !batch.isActive)}
                      className="h-8 text-xs"
                    >
                      {batch.isActive ? (
                        <X className="h-3 w-3" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      )}

      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
        Deactivating a batch stops its check-in code working. Students keep their
        attendance history — nothing is deleted.
      </p>
    </div>
  );
}

export default BatchManagement;
