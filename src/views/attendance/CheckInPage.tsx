"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/utils/constants";
import { useAppSelector } from "@/store";
import { Button } from "@/components/ui/button";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  QrCode,
  XCircle,
} from "lucide-react";

/**
 * What a parent sees after scanning the QR code on the academy wall.
 *
 * Designed for someone standing at a gate holding a child's bag: one line of
 * confirmation, one big button, no navigation. The preview call runs first so
 * the page can say *whose* attendance is about to be marked — a parent tapping
 * "check in" should never have to wonder whether it registered the right child.
 */

interface Preview {
  studentName: string;
  batchName: string;
  sport: string;
  session: { sessionId: string; date: string; weekday: string };
  canCheckIn: boolean;
  opensAt: string;
  closesAt: string;
  reason: string | null;
  alreadyCheckedIn: { present: boolean; source: string } | null;
}

function timeIst(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

/**
 * Sends the reader back to their dashboard once the scan is finished.
 *
 * This page is reached from a QR code at the gate, so it opens as a standalone
 * tab with no navigation of its own — after checking in, the previous copy just
 * said "you can close this page", which leaves a parent stranded on a dead end
 * holding their phone. The countdown is visible and cancellable rather than an
 * abrupt jump, because a redirect nobody expected feels like a bug.
 */
function ReturnCountdown({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState(seconds);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (cancelled) return;
    if (left <= 0) {
      window.location.href = "/portal/student";
      return;
    }
    const timer = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [left, cancelled]);

  if (cancelled) {
    return (
      <a
        href="/portal/student"
        className="mt-4 block text-xs font-semibold text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
      >
        Go to my dashboard
      </a>
    );
  }

  return (
    <div className="mt-4">
      <p className="text-xs text-slate-500">
        Taking you to your dashboard in{" "}
        <span className="font-mono font-bold text-slate-700">{left}</span>…
      </p>
      <button
        type="button"
        onClick={() => setCancelled(true)}
        className="mt-1 text-[11px] font-semibold text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
      >
        Stay on this page
      </button>
    </div>
  );
}

export function CheckInPage({ token }: { token: string }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ studentName: string; batchName: string } | null>(
    null,
  );

  const { token: authToken } = useAppSelector((s) => s.auth);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/attendance/check-in`, {
        params: { token },
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.data?.success) setPreview(res.data.data);
      else setError(res.data?.message || "Could not read this code");
    } catch (e: any) {
      setError(e.response?.data?.message || "Could not read this code");
    } finally {
      setLoading(false);
    }
  }, [token, authToken]);

  useEffect(() => {
    if (authToken) load();
    else setLoading(false);
  }, [authToken, load]);

  const checkIn = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await axios.post(
        `${API_BASE_URL}/attendance/check-in`,
        { token },
        { headers: { Authorization: `Bearer ${authToken}` } },
      );
      if (res.data?.success) {
        setDone({
          studentName: res.data.data.studentName,
          batchName: res.data.data.batchName,
        });
      } else {
        setError(res.data?.message || "Could not check in");
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "Could not check in");
    } finally {
      setSubmitting(false);
    }
  };

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {children}
      </div>
    </div>
  );

  if (!authToken) {
    return (
      <Shell>
        <div className="text-center">
          <QrCode className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <h1 className="text-lg font-bold text-slate-900">Sign in to check in</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            Check-in uses your child's account, so we know exactly who is being
            marked present.
          </p>
          <Button
            className="mt-4 w-full"
            onClick={() => {
              // Return here after signing in, so the scan is not wasted.
              window.location.href = `/user/auth?redirect=${encodeURIComponent(
                window.location.pathname,
              )}`;
            }}
          >
            Sign in
          </Button>
        </div>
      </Shell>
    );
  }

  if (loading) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
          <p className="text-sm text-slate-500">Reading the code…</p>
        </div>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell>
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
          <h1 className="text-xl font-extrabold text-slate-900">
            {done.studentName} is checked in
          </h1>
          <p className="mt-1 text-sm text-slate-500">{done.batchName}</p>
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-500">
            Your coach will confirm the register at the end of the session.
          </p>
          <ReturnCountdown seconds={5} />
        </div>
      </Shell>
    );
  }

  if (error && !preview) {
    return (
      <Shell>
        <div className="text-center">
          <XCircle className="mx-auto mb-3 h-10 w-10 text-red-400" />
          <h1 className="text-lg font-bold text-slate-900">Can't check in</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{error}</p>
        </div>
      </Shell>
    );
  }

  if (!preview) return null;

  return (
    <Shell>
      <div className="text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {preview.batchName} · {preview.sport}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
          {preview.studentName}
        </h1>
        <p className="mt-0.5 text-sm capitalize text-slate-500">
          {preview.session.weekday}, {preview.session.date}
        </p>
      </div>

      <div className="mt-5">
        {preview.alreadyCheckedIn ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
            <CheckCircle2 className="mx-auto mb-1.5 h-6 w-6 text-emerald-500" />
            <p className="text-sm font-semibold text-emerald-900">
              Already marked{" "}
              {preview.alreadyCheckedIn.present ? "present" : "absent"} for this
              session
            </p>
            <p className="mt-0.5 text-xs text-emerald-800/80">
              {preview.alreadyCheckedIn.source === "coach"
                ? "Your coach marked the register."
                : "You scanned in earlier."}
            </p>
            {/* Also a terminal state — there is nothing to do on this page, so
                it should not be a dead end either. */}
            <ReturnCountdown seconds={5} />
          </div>
        ) : preview.canCheckIn ? (
          <>
            <Button
              onClick={checkIn}
              disabled={submitting}
              className="h-14 w-full bg-emerald-600 text-base font-bold hover:bg-emerald-700"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-5 w-5" />
              )}
              Check in
            </Button>
            <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <Clock className="h-3 w-3" />
              Open until {timeIst(preview.closesAt)}
            </p>
          </>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
            <CalendarClock className="mx-auto mb-1.5 h-6 w-6 text-amber-500" />
            <p className="text-sm leading-relaxed text-amber-900">
              {preview.reason}
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700">
          {error}
        </p>
      )}
    </Shell>
  );
}

export default CheckInPage;
