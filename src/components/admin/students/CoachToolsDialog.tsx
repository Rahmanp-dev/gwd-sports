"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  TrendingUp,
  CalendarCheck,
  Trophy,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/utils/constants";
import { useAppSelector } from "@/store";
import { CATEGORY_DEFINITIONS } from "@/lib/performance/taxonomy";
import { PassportRecordsDialog } from "@/components/trainer/PassportRecordsDialog";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE COACH'S TOOLKIT, FOR THE OWNER
 * ════════════════════════════════════════════════════════════════════════════
 *
 * An owner could already see every student and edit their fees, level and
 * parent details — but could not do the two things that actually happen at a
 * session: mark a register and record an evaluation. On a small academy the
 * owner IS the coach most evenings, and on a bigger one they are the person
 * covering when a coach is ill. They were the one role that could see the
 * problem and not fix it.
 *
 * NOTHING NEW WAS NEEDED ON THE SERVER. `/api/trainer/mark-attendance` and
 * `/api/trainer/add-performance` have always accepted `['trainer', 'admin']`
 * and scope their writes by `auth.academyId`, so an owner acting here is
 * already correctly confined to their own students. The gap was purely that
 * no screen ever called them as an owner.
 *
 * ONE DIALOG, THREE JOBS, because that is how the moment actually goes: you
 * open a student to mark them present, notice they had a good session, and log
 * it while you are there. Making that three separate screens is how the second
 * and third things stop happening.
 * ════════════════════════════════════════════════════════════════════════════
 */

type Mode = "menu" | "attendance" | "performance";

const CATEGORY_KEYS = Object.keys(
  CATEGORY_DEFINITIONS,
) as (keyof typeof CATEGORY_DEFINITIONS)[];

export function CoachToolsDialog({
  open,
  onOpenChange,
  student,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Needs the USER id — the same id every trainer endpoint takes. */
  student: { userId: string; name: string; sports?: string[] } | null;
  /** Lets the parent refresh its list after a write. */
  onDone?: () => void;
}) {
  const { token } = useAppSelector((s) => s.auth);
  const [mode, setMode] = useState<Mode>("menu");
  const [busy, setBusy] = useState(false);
  const [passportOpen, setPassportOpen] = useState(false);

  const [attendance, setAttendance] = useState({
    date: new Date().toISOString().split("T")[0],
    present: true,
    remarks: "",
  });

  const [perf, setPerf] = useState({
    sport: "",
    categoryKey: "technical" as string,
    metric: "",
    score: "",
    maxScore: "10",
    remarks: "",
  });

  React.useEffect(() => {
    if (open) {
      setMode("menu");
      setAttendance({
        date: new Date().toISOString().split("T")[0],
        present: true,
        remarks: "",
      });
      setPerf((p) => ({
        ...p,
        sport: student?.sports?.[0] ?? "",
        metric: "",
        score: "",
      }));
    }
  }, [open, student]);

  const post = async (path: string, body: unknown) => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    return res.json().catch(() => null);
  };

  const submitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    setBusy(true);
    try {
      const data = await post("/trainer/mark-attendance", {
        studentId: student.userId,
        date: attendance.date,
        present: attendance.present,
        remarks: attendance.remarks,
      });
      if (data?.success) {
        toast.success(
          attendance.present
            ? `${student.name} marked present`
            : `${student.name} marked absent`,
        );
        setMode("menu");
        onDone?.();
      } else {
        toast.error(data?.message || "Could not save that.");
      }
    } catch {
      toast.error("Network error. Nothing was saved.");
    } finally {
      setBusy(false);
    }
  };

  const submitPerformance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    const score = Number(perf.score);
    const max = Number(perf.maxScore);
    // Checked here as well as on the server so the owner is told before a
    // round trip, and told which number is wrong.
    if (!Number.isFinite(score) || !Number.isFinite(max) || max <= 0) {
      toast.error("Enter a score and a maximum.");
      return;
    }
    if (score < 0 || score > max) {
      toast.error(`Score must be between 0 and ${max}.`);
      return;
    }

    setBusy(true);
    try {
      const data = await post("/trainer/add-performance", {
        studentId: student.userId,
        sport: perf.sport,
        categoryKey: perf.categoryKey,
        metric: perf.metric,
        score,
        maxScore: max,
        remarks: perf.remarks,
      });
      if (data?.success) {
        const awarded: string[] = data.data?.achievementsAwarded ?? [];
        toast.success(
          awarded.length
            ? `Saved — and ${student.name} earned ${awarded.join(", ")}`
            : `Evaluation saved for ${student.name}`,
        );
        setMode("menu");
        onDone?.();
      } else {
        toast.error(data?.message || "Could not save that.");
      }
    } catch {
      toast.error("Network error. Nothing was saved.");
    } finally {
      setBusy(false);
    }
  };

  const field = "bg-background";

  return (
    <>
      <Dialog open={open && !passportOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {mode !== "menu" && (
                <button
                  type="button"
                  onClick={() => setMode("menu")}
                  className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              {student?.name ?? "Student"}
            </DialogTitle>
            <DialogDescription>
              {mode === "menu"
                ? "Everything a coach can do, from here."
                : mode === "attendance"
                  ? "Mark this session."
                  : "Record an evaluation."}
            </DialogDescription>
          </DialogHeader>

          {mode === "menu" && (
            <div className="grid gap-2.5">
              <button
                type="button"
                onClick={() => setMode("attendance")}
                className="flex items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:border-emerald-400 hover:bg-emerald-50/50"
              >
                <CalendarCheck className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    Mark attendance
                  </span>
                  <span className="block text-xs text-slate-500">
                    Present or absent for a given date, with a note.
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode("performance")}
                className="flex items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:border-blue-400 hover:bg-blue-50/50"
              >
                <TrendingUp className="h-5 w-5 flex-shrink-0 text-blue-600" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    Log performance
                  </span>
                  <span className="block text-xs text-slate-500">
                    A scored evaluation against a category and metric.
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPassportOpen(true)}
                className="flex items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:border-amber-400 hover:bg-amber-50/50"
              >
                <Trophy className="h-5 w-5 flex-shrink-0 text-amber-600" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    Sports Passport
                  </span>
                  <span className="block text-xs text-slate-500">
                    Tournaments, leagues, camps and trials.
                  </span>
                </span>
              </button>
            </div>
          )}

          {mode === "attendance" && (
            <form onSubmit={submitAttendance} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={attendance.date}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) =>
                    setAttendance({ ...attendance, date: e.target.value })
                  }
                  className={field}
                  required
                />
              </div>

              {/* Two large targets rather than a switch. This gets used on a
                  phone at the side of a pitch, and a mis-tap here writes the
                  wrong thing to a child's record. */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    setAttendance({ ...attendance, present: true })
                  }
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 transition-all ${
                    attendance.present
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 text-slate-400 hover:border-slate-300"
                  }`}
                >
                  <CheckCircle2 className="h-6 w-6" />
                  <span className="text-sm font-bold">Present</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAttendance({ ...attendance, present: false })
                  }
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 transition-all ${
                    !attendance.present
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-slate-200 text-slate-400 hover:border-slate-300"
                  }`}
                >
                  <XCircle className="h-6 w-6" />
                  <span className="text-sm font-bold">Absent</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <Label>
                  Note{" "}
                  <span className="text-xs font-normal text-slate-400">
                    optional
                  </span>
                </Label>
                <Input
                  value={attendance.remarks}
                  onChange={(e) =>
                    setAttendance({ ...attendance, remarks: e.target.value })
                  }
                  placeholder="Late, left early, injured…"
                  className={field}
                />
                {/* Says where this ends up, because the same word means
                    different things on the two forms in this dialog. */}
                <p className="text-[11px] text-slate-400">
                  Internal. Register notes are never shown on the public
                  Passport.
                </p>
              </div>

              <Button type="submit" disabled={busy} className="w-full">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save attendance
              </Button>
            </form>
          )}

          {mode === "performance" && (
            <form onSubmit={submitPerformance} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Sport</Label>
                  <Input
                    value={perf.sport}
                    onChange={(e) =>
                      setPerf({ ...perf, sport: e.target.value })
                    }
                    placeholder="cricket"
                    className={field}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <select
                    value={perf.categoryKey}
                    onChange={(e) =>
                      setPerf({ ...perf, categoryKey: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {CATEGORY_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {CATEGORY_DEFINITIONS[k].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Metric</Label>
                <Input
                  value={perf.metric}
                  onChange={(e) => setPerf({ ...perf, metric: e.target.value })}
                  placeholder="Front-foot drive, positioning under pressure…"
                  className={field}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Score</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={perf.score}
                    onChange={(e) =>
                      setPerf({ ...perf, score: e.target.value })
                    }
                    className={field}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Out of</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={perf.maxScore}
                    onChange={(e) =>
                      setPerf({ ...perf, maxScore: e.target.value })
                    }
                    className={field}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>
                  Remarks{" "}
                  <span className="text-xs font-normal text-slate-400">
                    optional
                  </span>
                </Label>
                <Textarea
                  rows={2}
                  value={perf.remarks}
                  onChange={(e) =>
                    setPerf({ ...perf, remarks: e.target.value })
                  }
                  placeholder="What you actually saw."
                  className={field}
                />
                <p className="text-[11px] text-slate-400">
                  Internal. Only the category average reaches the public
                  Passport, never an individual score or remark.
                </p>
              </div>

              <Button type="submit" disabled={busy} className="w-full">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save evaluation
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Reuses the coach's own passport editor rather than a second copy —
          one place enforces who may edit another academy's records. */}
      <PassportRecordsDialog
        open={passportOpen}
        onOpenChange={(o) => {
          setPassportOpen(o);
          if (!o) onDone?.();
        }}
        studentId={student?.userId ?? null}
        studentName={student?.name ?? "this student"}
      />
    </>
  );
}

export default CoachToolsDialog;
