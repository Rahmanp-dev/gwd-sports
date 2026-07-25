"use client";
import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/utils/constants";
import { useAppSelector } from "@/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Megaphone,
  MessageSquare,
  Send,
  Users,
} from "lucide-react";

/**
 * Owner-composed announcements.
 *
 * Two steps, always: compose → preview → confirm. A broadcast reaches every
 * parent at once and cannot be recalled, so the owner sees the exact rendered
 * text and the exact recipient count before anything is queued. The API
 * enforces the same thing — the confirm flag is not a UI convention.
 *
 * The reassurance in the footer is not marketing copy. Owners hesitate to use a
 * broadcast because they are afraid of spamming parents, and the thing that
 * actually protects against that — lowest priority, daily cap, quiet hours —
 * is invisible unless stated.
 */

const MAX_LENGTH = 600;

interface DryRun {
  preview: string;
  recipientCount: number;
  studentCount: number;
  unreachableStudents: number;
  academyName: string;
}

interface SendResult {
  queued: number;
  duplicates: number;
  rejected: { phone: string; reason: string }[];
  note: string;
}

export function BroadcastComposer() {
  const [message, setMessage] = useState("");
  const [dryRun, setDryRun] = useState<DryRun | null>(null);
  const [result, setResult] = useState<SendResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { token } = useAppSelector((s) => s.auth);

  const post = async (confirm: boolean) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        `${API_BASE_URL}/academy/broadcast`,
        { message, audience: "all", confirm },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.data?.success) {
        setError(res.data?.message || "Could not send the announcement");
        return;
      }
      if (confirm) {
        setResult(res.data.data);
        setDryRun(null);
        setMessage("");
      } else {
        setDryRun(res.data.data);
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "Could not send the announcement");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setDryRun(null);
    setResult(null);
    setError("");
  };

  // --- Sent confirmation --------------------------------------------------

  if (result) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Announcement queued
          </h2>
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0 text-emerald-500" />
              <div>
                <p className="text-base font-bold text-slate-900">
                  {result.queued} parent{result.queued === 1 ? "" : "s"} queued
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  {result.note}
                </p>
              </div>
            </div>

            {result.duplicates > 0 && (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                {result.duplicates} were already queued from an identical
                request and were not duplicated.
              </p>
            )}

            {result.rejected.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-xs font-semibold text-amber-800">
                  {result.rejected.length} could not be queued
                </p>
                <ul className="mt-1 space-y-0.5">
                  {result.rejected.slice(0, 5).map((r) => (
                    <li key={r.phone} className="text-[11px] text-amber-700">
                      <span className="font-mono">{r.phone}</span> — {r.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button variant="outline" size="sm" onClick={reset}>
              Write another
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Compose / confirm --------------------------------------------------

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Announcement
        </h2>
        <p className="text-sm text-slate-500">
          One message to every parent in your academy.
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="space-y-4 p-6">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="broadcast-body"
                className="text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Your message
              </label>
              <span
                className={`text-[11px] font-medium ${
                  message.length > MAX_LENGTH
                    ? "text-red-500"
                    : "text-slate-400"
                }`}
              >
                {message.length} / {MAX_LENGTH}
              </span>
            </div>
            <Textarea
              id="broadcast-body"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (dryRun) setDryRun(null);
              }}
              rows={5}
              placeholder="Practice is cancelled this Sunday because of the ground booking. Normal timings resume Tuesday."
              className="resize-none"
            />
            <p className="mt-1.5 text-[11px] leading-snug text-slate-400">
              Your academy's name is added automatically at the end. Don't
              include a specific child's name or passport ID — this goes to
              everyone.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
              <p className="text-xs leading-relaxed text-red-700">{error}</p>
            </div>
          )}

          {/* The confirm step. Nothing has been queued at this point. */}
          {dryRun ? (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Exactly what each parent will receive
                </p>
                <div className="mt-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-700">
                  {dryRun.preview}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="gap-1.5 border-blue-200 bg-blue-50 text-blue-700"
                >
                  <Users className="h-3 w-3" />
                  {dryRun.recipientCount} parent
                  {dryRun.recipientCount === 1 ? "" : "s"}
                </Badge>
                <Badge
                  variant="outline"
                  className="gap-1.5 border-slate-200 bg-white text-slate-600"
                >
                  <MessageSquare className="h-3 w-3" />
                  {dryRun.studentCount} student
                  {dryRun.studentCount === 1 ? "" : "s"}
                </Badge>
                {dryRun.unreachableStudents > 0 && (
                  <Badge
                    variant="outline"
                    className="gap-1.5 border-amber-200 bg-amber-50 text-amber-700"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {dryRun.unreachableStudents} with no number
                  </Badge>
                )}
              </div>

              {dryRun.recipientCount !== dryRun.studentCount && (
                <p className="text-[11px] leading-snug text-slate-500">
                  Fewer parents than students because siblings share a phone
                  number — each family receives this once.
                </p>
              )}

              {dryRun.recipientCount === 0 ? (
                <p className="text-xs font-medium text-amber-700">
                  Nobody to send to. Add parent mobile numbers to your students
                  first.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => post(true)}
                    disabled={loading}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send to {dryRun.recipientCount} parent
                    {dryRun.recipientCount === 1 ? "" : "s"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDryRun(null)}
                    disabled={loading}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Button
              onClick={() => post(false)}
              disabled={loading || message.trim().length === 0}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Megaphone className="h-4 w-4" />
              )}
              Preview and check recipients
            </Button>
          )}
        </CardContent>
      </Card>

      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-500">
        An announcement is the <strong>lowest priority</strong> message the
        system sends. It always yields to fee reminders and attendance
        confirmations, it counts against each parent's daily message limit, and
        it will never go out during quiet hours. You cannot accidentally spam a
        parent with this.
      </p>
    </div>
  );
}

export default BroadcastComposer;
