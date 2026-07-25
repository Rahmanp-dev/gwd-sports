"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/utils/constants";
import { useAppSelector } from "@/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  MoonStar,
  PlugZap,
  RefreshCw,
  Send,
  XCircle,
} from "lucide-react";

/**
 * Is the engine actually able to deliver anything?
 *
 * This screen exists to prevent one specific misreading. With no BSP
 * credentials the engine runs in no-op mode: every message is built, validated
 * and queued correctly, then recorded as "skipped" at the point of sending.
 * That is designed behaviour, but from the message log alone it is
 * indistinguishable from a system quietly failing. So there is one place that
 * says plainly: nothing has gone out yet, and here is why — and the why is
 * almost never in the code.
 */

interface Blocker {
  id: string;
  title: string;
  detail: string;
  owner: string;
}

interface HealthData {
  scope: "platform" | "academy";
  providers: {
    whatsapp: { name: string; connected: boolean };
    sms: { name: string | null; connected: boolean; note: string };
  };
  queue: { due: number; scheduled: number; held: number; stuck: number };
  last7Days: { byStatus: Record<string, number>; failed: number };
  activity: {
    lastQueuedAt: string | null;
    lastSentAt: string | null;
    everDelivered: boolean;
  };
  requiredTemplates: string[];
  blockers: Blocker[];
  schedulingConfig: {
    dailyBudget: number;
    paymentReserve: number;
    quietStartHour: number;
    quietEndHour: number;
  };
}

function formatWhen(iso: string | null): string {
  if (!iso) return "never";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "never";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function QueueTile({
  icon: Icon,
  label,
  value,
  hint,
  color,
  bg,
}: {
  icon: any;
  label: string;
  value: number;
  hint: string;
  color: string;
  bg: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <p className="mt-1 text-2xl font-extrabold" style={{ color }}>
        {value}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-slate-400">{hint}</p>
    </div>
  );
}

export function MessagingHealth() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token } = useAppSelector((s) => s.auth);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/academy/messages/health`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) setData(res.data.data);
      else setError(res.data?.message || "Failed to load delivery status");
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to load delivery status");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchHealth();
  }, [token, fetchHealth]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <Loader2 className="h-7 w-7 animate-spin text-red-500" />
        <p className="text-sm font-medium text-slate-500">
          Checking delivery status…
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertTriangle className="h-9 w-9 text-red-400" />
        <p className="text-sm text-slate-600">{error || "No data available"}</p>
        <Button variant="outline" size="sm" onClick={fetchHealth}>
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  const live = data.providers.whatsapp.connected;

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Delivery Status
          </h2>
          <p className="text-sm text-slate-500">
            Whether messages can actually reach a parent right now.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchHealth}
          className="gap-2 text-xs font-semibold"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* The headline verdict. Everything else on this screen is detail. */}
      <div
        className={`rounded-2xl border p-5 ${
          live
            ? "border-emerald-200 bg-emerald-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        <div className="flex items-start gap-3">
          {live ? (
            <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0 text-emerald-600" />
          ) : (
            <PlugZap className="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-600" />
          )}
          <div>
            <p
              className={`text-base font-bold ${
                live ? "text-emerald-900" : "text-amber-900"
              }`}
            >
              {live
                ? "WhatsApp is connected."
                : "Nothing is being delivered yet."}
            </p>
            <p
              className={`mt-1 text-sm leading-relaxed ${
                live ? "text-emerald-800/90" : "text-amber-900/90"
              }`}
            >
              {live
                ? `Messages are being handed to ${data.providers.whatsapp.name}. Delivery still depends on each template being approved by Meta.`
                : "The engine is building, validating and queueing messages correctly — there is simply no provider to hand them to, so sends are recorded as “skipped” rather than failed. Nothing here needs fixing in the code."}
            </p>
            {!data.activity.everDelivered && (
              <p className="mt-2 text-xs font-semibold text-amber-800">
                No message has ever been delivered from this account.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Blockers — the actual to-do list, none of which is code. */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          What is standing in the way
        </p>
        {data.blockers.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-3 py-6">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <p className="text-sm text-slate-600">
                Nothing outstanding. Messages should be going out.
              </p>
            </CardContent>
          </Card>
        ) : (
          data.blockers.map((blocker) => (
            <div
              key={blocker.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">
                    {blocker.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {blocker.detail}
                  </p>
                  <p className="mt-2 break-words rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[11px] text-slate-600">
                    {blocker.owner}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Queue */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Queue right now
        </p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <QueueTile
            icon={Send}
            label="Due"
            value={data.queue.due}
            hint="Waiting for the next run"
            color="#2563eb"
            bg="bg-blue-50 border-blue-100"
          />
          <QueueTile
            icon={Clock}
            label="Scheduled"
            value={data.queue.scheduled}
            hint="Due at a future time"
            color="#475569"
            bg="bg-slate-50 border-slate-200"
          />
          <QueueTile
            icon={MoonStar}
            label="Held back"
            value={data.queue.held}
            hint="Quiet hours or daily cap — not dropped"
            color="#d97706"
            bg="bg-amber-50 border-amber-100"
          />
          <QueueTile
            icon={XCircle}
            label="Stuck"
            value={data.queue.stuck}
            hint="Claimed by a run that died"
            color={data.queue.stuck > 0 ? "#dc2626" : "#94a3b8"}
            bg={
              data.queue.stuck > 0
                ? "bg-red-50 border-red-100"
                : "bg-slate-50 border-slate-200"
            }
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Templates */}
        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-3 p-5">
            <div>
              <p className="text-sm font-bold text-slate-900">
                Templates requiring Meta approval
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Approval status cannot be read back through the API, so this is
                the list to submit — not the list that has been accepted.
                Confirm each in the Interakt console.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.requiredTemplates.map((name) => (
                <Badge
                  key={name}
                  variant="outline"
                  className="border-slate-200 bg-slate-50 font-mono text-[10px] text-slate-600"
                >
                  {name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Channels + activity */}
        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-3 p-5">
            <p className="text-sm font-bold text-slate-900">Channels</p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-slate-500">WhatsApp</span>
                <Badge
                  variant="outline"
                  className={
                    data.providers.whatsapp.connected
                      ? "border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-[10px] text-amber-700"
                  }
                >
                  {data.providers.whatsapp.connected
                    ? data.providers.whatsapp.name
                    : "not connected"}
                </Badge>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">SMS fallback</span>
                  <Badge
                    variant="outline"
                    className={
                      data.providers.sms.connected
                        ? "border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700"
                        : "border-slate-200 bg-white text-[10px] text-slate-500"
                    }
                  >
                    {data.providers.sms.name ?? "not connected"}
                  </Badge>
                </div>
                <p className="mt-1.5 leading-snug text-slate-400">
                  {data.providers.sms.note}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Last message queued</span>
                <span className="font-medium text-slate-600">
                  {formatWhen(data.activity.lastQueuedAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last message sent</span>
                <span className="font-medium text-slate-600">
                  {formatWhen(data.activity.lastSentAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Failed in last 7 days</span>
                <span className="font-medium text-slate-600">
                  {data.last7Days.failed}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        Current limits: <strong>{data.schedulingConfig.dailyBudget}</strong>{" "}
        message(s) per parent per day, plus{" "}
        <strong>{data.schedulingConfig.paymentReserve}</strong> reserved for fee
        reminders. Quiet hours{" "}
        <strong>
          {data.schedulingConfig.quietStartHour}:00–
          {data.schedulingConfig.quietEndHour}:00 IST
        </strong>
        .
      </p>
    </div>
  );
}

export default MessagingHealth;
