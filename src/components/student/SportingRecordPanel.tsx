"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trophy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/utils/constants";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE STUDENT'S OWN VIEW OF THEIR SPORTING RECORD
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Coaches can now record tournaments, leagues, camps, trials and
 * certifications onto a student's Passport. Until this component, the only way
 * a student could SEE any of it was to open their own public passport link —
 * so the person the record is about was the last to know it existed, and a
 * coach entering it got no visible acknowledgement inside the product.
 *
 * Reads the PUBLIC passport endpoint on purpose rather than adding an
 * authenticated one. That endpoint is already the single place deciding what
 * a passport may disclose (lib/passport-public.ts, an explicit whitelist), and
 * a student is by definition allowed to see their own public page. Adding a
 * second, authenticated reader would mean two things to keep in step and a new
 * surface to get wrong.
 * ════════════════════════════════════════════════════════════════════════════
 */

interface RecordRow {
  id: string;
  kindLabel: string;
  icon: string;
  title: string;
  organisation: string | null;
  levelLabel: string | null;
  result: string | null;
  startedOn: string;
  endedOn: string | null;
  location: string | null;
  summary: string | null;
  upcoming: boolean;
}

function prettyDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function SportingRecordPanel({
  passportId,
}: {
  passportId: string | null;
}) {
  const [records, setRecords] = useState<RecordRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!passportId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/passport/${passportId}`);
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (data?.success) setRecords(data.data?.records ?? []);
        else setError("Couldn't load your sporting record.");
      } catch {
        if (!cancelled) setError("Couldn't reach the server.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [passportId, attempt]);

  // No passport means no record to show, and PassportCard already explains
  // why the passport is missing. Saying it twice on one screen is noise.
  if (!passportId) return null;

  return (
    <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-white flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-400" />
          Sporting Record
        </CardTitle>
        {records && records.length > 0 && (
          <span className="text-xs font-semibold text-gray-500">
            {records.length} {records.length === 1 ? "entry" : "entries"}
          </span>
        )}
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : error ? (
          <div className="py-6 text-center">
            <p className="text-sm text-gray-400">{error}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAttempt((n) => n + 1)}
              className="mt-3 border-gray-600 bg-transparent text-white hover:bg-gray-700"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Try again
            </Button>
          </div>
        ) : !records || records.length === 0 ? (
          <div className="py-8 text-center">
            <Trophy className="mx-auto mb-2 h-7 w-7 text-gray-600" />
            <p className="text-sm font-medium text-gray-300">
              Nothing recorded yet
            </p>
            {/* Framed as "your coach adds these" rather than "you have none",
                because the student cannot act on this themselves and being
                told they are empty-handed helps nobody. */}
            <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-gray-500">
              Tournaments, leagues and camps you take part in will appear here
              once your coach adds them.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {records.map((r) => (
              <li
                key={r.id}
                className="flex gap-3 rounded-xl border border-gray-700/60 bg-gray-900/40 p-3"
              >
                <span className="mt-0.5 text-xl leading-none">{r.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-semibold text-white">
                      {r.title}
                    </p>
                    {r.upcoming && (
                      <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-indigo-300">
                        Upcoming
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-400">
                    <span>{r.kindLabel}</span>
                    {r.levelLabel && (
                      <>
                        <span aria-hidden>·</span>
                        <span className="text-violet-300">{r.levelLabel}</span>
                      </>
                    )}
                    {r.result && (
                      <>
                        <span aria-hidden>·</span>
                        <span className="font-semibold text-amber-300">
                          {r.result}
                        </span>
                      </>
                    )}
                  </div>

                  {r.organisation && (
                    <p className="mt-1 text-xs text-gray-400">
                      {r.organisation}
                    </p>
                  )}
                  {r.summary && (
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                      {r.summary}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-gray-600">
                    {prettyDate(r.startedOn)}
                    {r.endedOn && r.endedOn !== r.startedOn
                      ? ` – ${prettyDate(r.endedOn)}`
                      : ""}
                    {r.location ? ` · ${r.location}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default SportingRecordPanel;
