"use client";

import React, { useCallback, useEffect, useState } from "react";
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
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Globe,
  Lock,
  ArrowLeft,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import apiService from "@/services/apiService";
import {
  RECORD_KINDS,
  RECORD_KIND_LABELS,
  RECORD_KIND_ICONS,
  RECORD_LEVELS,
  RECORD_LEVEL_LABELS,
  MAX_SUMMARY,
  type PassportRecordKind,
} from "@/lib/passport/records";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE COACH'S VIEW OF A STUDENT'S SPORTING RECORD
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Built as its own component rather than another branch inside the 1,700-line
 * trainer page, so the page gains three lines instead of three hundred.
 *
 * TWO THINGS THIS UI HAS TO GET RIGHT, because they are trust decisions rather
 * than layout decisions:
 *
 *  1. THE COACH MUST KNOW THEY ARE PUBLISHING. Every field here lands on
 *     /passport/<id>, which is an unauthenticated URL that gets forwarded into
 *     family WhatsApp groups. The banner and the per-field note say so before
 *     anything is typed, not in a tooltip afterwards. A coach who discovers
 *     later that their internal note went public will never trust the form
 *     again — and rightly.
 *
 *  2. ANOTHER ACADEMY'S ENTRIES ARE READ-ONLY, VISIBLY. A passport travels
 *     with the child. When a student transfers in, their previous academy's
 *     records come with them and must not be quietly editable. The server
 *     enforces it (see lib/passport/recordAccess.ts); this component renders
 *     the reason, so a locked row looks deliberate rather than broken.
 * ════════════════════════════════════════════════════════════════════════════
 */

interface RecordRow {
  id: string;
  kind: PassportRecordKind;
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
  canEdit?: boolean;
}

interface FormState {
  kind: PassportRecordKind;
  title: string;
  organisation: string;
  sport: string;
  level: string;
  result: string;
  startedOn: string;
  endedOn: string;
  location: string;
  summary: string;
}

const EMPTY: FormState = {
  kind: "tournament",
  title: "",
  organisation: "",
  sport: "",
  level: "",
  result: "",
  startedOn: "",
  endedOn: "",
  location: "",
  summary: "",
};

function toForm(record: RecordRow): FormState {
  return {
    kind: record.kind,
    title: record.title,
    organisation: record.organisation ?? "",
    sport: record.sport ?? "",
    level: record.level ?? "",
    result: record.result ?? "",
    startedOn: record.startedOn,
    endedOn: record.endedOn ?? "",
    location: record.location ?? "",
    summary: record.summary ?? "",
  };
}

const field =
  "bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-blue-500";
const selectCls =
  "flex h-10 w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

export function PassportRecordsDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The student's USER id — the same id every other trainer route takes. */
  studentId: string | null;
  studentName: string;
}) {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [passportId, setPassportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [mode, setMode] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [badField, setBadField] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setLoadError("");
    try {
      const res: any = await apiService.get(
        `/trainer/passport-records?studentId=${studentId}`,
      );
      if (res?.success) {
        setRecords(res.data?.records ?? []);
        setPassportId(res.data?.passportId ?? null);
      } else {
        setLoadError(res?.message || "Could not load the passport record.");
      }
    } catch (e: any) {
      setLoadError(
        e?.response?.data?.message || "Could not load the passport record.",
      );
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (open) {
      setMode("list");
      setEditingId(null);
      setBadField(null);
      void load();
    }
  }, [open, load]);

  const openAdd = () => {
    setForm(EMPTY);
    setEditingId(null);
    setBadField(null);
    setMode("form");
  };

  const openEdit = (record: RecordRow) => {
    setForm(toForm(record));
    setEditingId(record.id);
    setBadField(null);
    setMode("form");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;
    setSaving(true);
    setBadField(null);

    const payload = { studentId, ...form };

    try {
      const res: any = editingId
        ? await apiService.patch(
            `/trainer/passport-records/${editingId}`,
            payload,
          )
        : await apiService.post("/trainer/passport-records", payload);

      if (res?.success) {
        setRecords(res.data?.records ?? []);
        toast.success(res.message || "Saved to the Sports Passport.");
        setMode("list");
        setEditingId(null);
      } else {
        // The API names the offending field so the input can be marked rather
        // than the coach hunting through the form for what upset it.
        setBadField(res?.field ?? null);
        toast.error(res?.message || "Could not save that.");
      }
    } catch (e: any) {
      setBadField(e?.response?.data?.field ?? null);
      toast.error(e?.response?.data?.message || "Could not save that.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (record: RecordRow) => {
    if (!studentId) return;
    if (
      !window.confirm(
        `Remove "${record.title}" from ${studentName}'s Sports Passport?\n\nThis cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      const res: any = await apiService.delete(
        `/trainer/passport-records/${record.id}?studentId=${studentId}`,
      );
      if (res?.success) {
        setRecords(res.data?.records ?? []);
        toast.success("Removed from the Sports Passport.");
      } else {
        toast.error(res?.message || "Could not remove that.");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not remove that.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto border-gray-700 bg-gray-800 text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "form" && (
              <button
                type="button"
                onClick={() => setMode("list")}
                className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                aria-label="Back to the list"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            Sports Passport — {studentName}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {passportId ? (
              <span className="font-mono text-xs tracking-wider">
                {passportId}
              </span>
            ) : (
              "Tournaments, leagues, camps, trials and certifications."
            )}
          </DialogDescription>
        </DialogHeader>

        {/* The publishing contract, stated once, at the top, always. */}
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2.5">
          <Globe className="mt-0.5 h-4 w-4 flex-none text-amber-400" />
          <p className="text-xs leading-relaxed text-amber-100/90">
            Everything here appears on{" "}
            <strong className="font-semibold">
              {studentName}&rsquo;s public Passport page
            </strong>
            , which parents share. Write it for them to read. Keep coaching
            notes in Performance instead — those stay private.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading record…
          </div>
        ) : loadError ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-6 text-center">
            <p className="text-sm text-red-200">{loadError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={load}
              className="mt-3 border-gray-600 bg-transparent text-white hover:bg-gray-700"
            >
              Try again
            </Button>
          </div>
        ) : mode === "list" ? (
          <div className="space-y-3">
            {records.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-600 px-4 py-10 text-center">
                <CalendarDays className="mx-auto mb-2 h-7 w-7 text-gray-600" />
                <p className="text-sm font-medium text-gray-300">
                  Nothing recorded yet
                </p>
                <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-gray-500">
                  Add the tournaments, leagues and camps {studentName} has taken
                  part in. This is the part of the Passport parents actually
                  forward.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {records.map((record) => (
                  <li
                    key={record.id}
                    className="flex items-start gap-3 rounded-lg border border-gray-700 bg-gray-900/60 p-3"
                  >
                    <span className="mt-0.5 text-xl leading-none">
                      {record.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-semibold text-white">
                          {record.title}
                        </p>
                        {record.upcoming && (
                          <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-indigo-300">
                            Upcoming
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-400">
                        <span>{record.kindLabel}</span>
                        {record.levelLabel && (
                          <>
                            <span aria-hidden>·</span>
                            <span className="text-violet-300">
                              {record.levelLabel}
                            </span>
                          </>
                        )}
                        {record.result && (
                          <>
                            <span aria-hidden>·</span>
                            <span className="font-semibold text-amber-300">
                              {record.result}
                            </span>
                          </>
                        )}
                        <span aria-hidden>·</span>
                        <span>{record.startedOn}</span>
                      </div>
                      {record.academyName && !record.canEdit && (
                        <p className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-gray-500">
                          <Lock className="h-3 w-3" />
                          Recorded by {record.academyName} — read-only
                        </p>
                      )}
                    </div>

                    {record.canEdit && (
                      <div className="flex flex-none gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(record)}
                          className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-blue-300"
                          aria-label={`Edit ${record.title}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(record)}
                          className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-red-300"
                          aria-label={`Remove ${record.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <Button
              onClick={openAdd}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" /> Add to Passport
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3.5">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-gray-300">Type</Label>
                <select
                  value={form.kind}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      kind: e.target.value as PassportRecordKind,
                    })
                  }
                  className={selectCls}
                >
                  {RECORD_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {RECORD_KIND_ICONS[kind]} {RECORD_KIND_LABELS[kind]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-gray-300">Level</Label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  className={selectCls}
                >
                  <option value="">Not specified</option>
                  {RECORD_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {RECORD_LEVEL_LABELS[level]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-300">
                Title <span className="text-red-400">*</span>
              </Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="U-14 District Championship"
                className={`${field} ${badField === "title" ? "border-red-500" : ""}`}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-gray-300">Organised by</Label>
                <Input
                  value={form.organisation}
                  onChange={(e) =>
                    setForm({ ...form, organisation: e.target.value })
                  }
                  placeholder="Hyderabad District Cricket Association"
                  className={field}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-300">Result</Label>
                <Input
                  value={form.result}
                  onChange={(e) => setForm({ ...form, result: e.target.value })}
                  placeholder="Runners-up"
                  className={field}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-gray-300">
                  Date <span className="text-red-400">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.startedOn}
                  onChange={(e) =>
                    setForm({ ...form, startedOn: e.target.value })
                  }
                  className={`${field} ${badField === "startedOn" ? "border-red-500" : ""}`}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-300">
                  Ended{" "}
                  <span className="text-xs font-normal text-gray-500">
                    optional
                  </span>
                </Label>
                <Input
                  type="date"
                  value={form.endedOn}
                  onChange={(e) => setForm({ ...form, endedOn: e.target.value })}
                  className={`${field} ${badField === "endedOn" ? "border-red-500" : ""}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-gray-300">Sport</Label>
                <Input
                  value={form.sport}
                  onChange={(e) => setForm({ ...form, sport: e.target.value })}
                  placeholder="cricket"
                  className={field}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-300">Where</Label>
                <Input
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="Gymkhana Ground, Hyderabad"
                  className={field}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <Label className="text-gray-300">What happened</Label>
                <span className="text-[10px] text-gray-500">
                  {form.summary.length}/{MAX_SUMMARY}
                </span>
              </div>
              <Textarea
                value={form.summary}
                onChange={(e) =>
                  setForm({
                    ...form,
                    summary: e.target.value.slice(0, MAX_SUMMARY),
                  })
                }
                rows={3}
                placeholder="Opened the batting through the group stage and top-scored in the semi-final."
                className={field}
              />
              <p className="text-[11px] leading-relaxed text-gray-500">
                A sentence or two the parent will read. This one is the
                difference between a list of dates and something worth sharing.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode("list")}
                className="flex-1 border-gray-600 bg-transparent text-white hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Save changes" : "Add to Passport"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PassportRecordsDialog;
