"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/utils/constants";
import { useAppSelector } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Bell,
  Building2,
  CheckCircle2,
  Clock,
  IndianRupee,
  Loader2,
  Phone,
  RefreshCw,
  ShieldQuestion,
  Inbox,
} from "lucide-react";

/**
 * The owner's alert feed.
 *
 * This screen is the other half of a deliberate product rule. The fee cadence
 * messages a parent at T-5, the due date and T+3, and then STOPS. T+7 and T+15
 * have no parent-facing template at all — they surface here instead, because a
 * fourth automated chase is how an academy's number gets blocked.
 *
 * So this list is not a notification centre. It is the place where the platform
 * says "I have gone as far as I am willing to go on my own." The UI leans on
 * that: a decision-point alert is styled to demand a human, and nothing on this
 * screen restricts a student's access, because the system never does that.
 */

/** Populated to `{ _id, name }` for a super admin, a bare id otherwise. */
type AcademyRef = string | { _id: string; name?: string } | null;

interface OwnerAlert {
  _id: string;
  academyId?: AcademyRef;
  type: string;
  severity: "info" | "warning" | "critical";
  passportId?: string | null;
  studentName?: string | null;
  parentPhone?: string | null;
  title: string;
  body: string;
  suggestedAction?: string | null;
  requiresOwnerDecision: boolean;
  amountPaise?: number | null;
  daysOverdue?: number | null;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

interface AlertCounts {
  total: number;
  critical: number;
  warning: number;
  awaitingDecision: number;
  unacknowledged: number;
}

const SEVERITY_STYLES: Record<
  OwnerAlert["severity"],
  { border: string; chip: string; icon: string; label: string }
> = {
  critical: {
    border: "border-l-red-500",
    chip: "bg-red-100 text-red-700 border-red-200",
    icon: "text-red-500",
    label: "Critical",
  },
  warning: {
    border: "border-l-amber-500",
    chip: "bg-amber-100 text-amber-700 border-amber-200",
    icon: "text-amber-500",
    label: "Warning",
  },
  info: {
    border: "border-l-blue-500",
    chip: "bg-blue-100 text-blue-700 border-blue-200",
    icon: "text-blue-500",
    label: "Info",
  },
};

/** Human labels for the alert types the backend can raise. */
const TYPE_LABELS: Record<string, string> = {
  fee_overdue_3: "Fee overdue — 3 days",
  fee_overdue_7: "Fee overdue — 7 days",
  fee_overdue_15: "Fee overdue — 15 days",
  message_delivery_failed: "Message delivery failed",
  student_missing_contact: "Student has no contact number",
  payment_reconciliation_mismatch: "Payment reconciliation mismatch",
};

/** The academy's name when the API populated it, otherwise nothing to show. */
function academyName(ref: AcademyRef | undefined): string | null {
  if (!ref || typeof ref === "string") return null;
  return ref.name ?? null;
}

function formatRupees(paise?: number | null): string {
  if (paise == null) return "—";
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CountTile({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: any;
  label: string;
  value: number;
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
    </div>
  );
}

export function AlertFeed() {
  const [alerts, setAlerts] = useState<OwnerAlert[]>([]);
  const [counts, setCounts] = useState<AlertCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [includeResolved, setIncludeResolved] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Non-null only for a super admin. Presence switches on the academy filter
  // and per-alert attribution, rather than a second role check in the client.
  const [academies, setAcademies] = useState<
    { _id: string; name: string }[] | null
  >(null);
  const [academyFilter, setAcademyFilter] = useState("all");

  const { token } = useAppSelector((s) => s.auth);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/academy/alerts`, {
        params: {
          includeResolved: includeResolved ? "true" : undefined,
          academyId: academyFilter,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setAlerts(res.data.data.alerts || []);
        setCounts(res.data.data.counts || null);
        setAcademies(res.data.data.academies ?? null);
      } else {
        setError(res.data?.message || "Failed to load alerts");
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, [token, includeResolved, academyFilter]);

  useEffect(() => {
    if (token) fetchAlerts();
  }, [token, fetchAlerts]);

  /**
   * Acknowledging says "I have seen this". Resolving says "I have dealt with
   * it". Neither triggers anything else — resolving a T+15 fee alert does not
   * restrict the student, and is not meant to.
   */
  const act = async (alertId: string, action: "acknowledge" | "resolve") => {
    setBusyId(alertId);
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/academy/alerts`,
        { alertId, action },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data?.success) {
        const updated: OwnerAlert = res.data.data.alert;
        setAlerts((prev) =>
          action === "resolve" && !includeResolved
            ? prev.filter((a) => a._id !== alertId)
            : prev.map((a) =>
                a._id === alertId
                  ? // PATCH does not populate, so its academyId is a bare id.
                    // Keeping the row's own reference preserves the academy
                    // name in the super admin's feed.
                    { ...a, ...updated, academyId: a.academyId }
                  : a,
              ),
        );
        setCounts((prev) =>
          prev
            ? {
                ...prev,
                unacknowledged: Math.max(prev.unacknowledged - 1, 0),
                awaitingDecision:
                  action === "resolve"
                    ? Math.max(prev.awaitingDecision - 1, 0)
                    : prev.awaitingDecision,
              }
            : prev,
        );
      } else {
        setError(res.data?.message || "Could not update the alert");
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "Could not update the alert");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        <p className="text-sm font-medium text-slate-500">Loading alerts…</p>
      </div>
    );
  }

  const decisionPoints = alerts.filter(
    (a) => a.requiresOwnerDecision && !a.resolvedAt,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Alerts
          </h2>
          <p className="text-sm text-slate-500">
            Things the platform will not decide on its own.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {/* Super admin only — the API returns this list to nobody else. */}
          {academies && (
            <Select value={academyFilter} onValueChange={setAcademyFilter}>
              <SelectTrigger className="h-9 w-48 text-xs">
                <SelectValue placeholder="All academies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All academies</SelectItem>
                {academies.map((a) => (
                  <SelectItem key={a._id} value={a._id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex items-center gap-2">
            <Switch
              id="include-resolved"
              checked={includeResolved}
              onCheckedChange={setIncludeResolved}
            />
            <Label
              htmlFor="include-resolved"
              className="text-xs font-medium text-slate-500"
            >
              Show resolved
            </Label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAlerts}
            className="gap-2 text-xs font-semibold"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {counts && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <CountTile
            icon={Bell}
            label="Open"
            value={counts.total}
            color="#475569"
            bg="bg-slate-50 border-slate-200"
          />
          <CountTile
            icon={AlertTriangle}
            label="Critical"
            value={counts.critical}
            color="#dc2626"
            bg="bg-red-50 border-red-100"
          />
          <CountTile
            icon={ShieldQuestion}
            label="Awaiting your call"
            value={counts.awaitingDecision}
            color="#ea580c"
            bg="bg-orange-50 border-orange-100"
          />
          <CountTile
            icon={Clock}
            label="Unread"
            value={counts.unacknowledged}
            color="#2563eb"
            bg="bg-blue-50 border-blue-100"
          />
        </div>
      )}

      {/*
        The decision-point banner. These are the alerts where the platform has
        deliberately stopped and handed over. Repeating the rule in the UI is
        intentional — an owner who does not know the system stopped messaging
        will assume it is still chasing on their behalf.
      */}
      {decisionPoints.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <ShieldQuestion className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500" />
            <div className="text-sm text-orange-900">
              <p className="font-bold">
                {decisionPoints.length} case
                {decisionPoints.length === 1 ? "" : "s"} need a human decision.
              </p>
              <p className="mt-0.5 text-orange-800/90">
                Automated reminders have already stopped for these parents. The
                platform will not chase further, and it will never restrict a
                student's attendance or Passport over an unpaid fee — that call
                is yours to make offline.
              </p>
            </div>
          </div>
        </div>
      )}

      {alerts.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
            <Inbox className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">
              Nothing needs your attention.
            </p>
            <p className="max-w-sm text-center text-xs text-slate-400">
              Fee escalations, delivery failures and students with no contact
              number all land here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const style = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.info;
            const resolved = Boolean(alert.resolvedAt);
            return (
              <Card
                key={alert._id}
                className={`border-0 border-l-4 shadow-sm transition-shadow hover:shadow-md ${style.border} ${
                  resolved ? "opacity-60" : ""
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base font-bold text-slate-900">
                          {alert.title}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={`h-5 text-[10px] font-semibold uppercase ${style.chip}`}
                        >
                          {style.label}
                        </Badge>
                        {alert.requiresOwnerDecision && !resolved && (
                          <Badge className="h-5 border-orange-200 bg-orange-100 text-[10px] font-semibold uppercase text-orange-700 hover:bg-orange-100">
                            Your decision
                          </Badge>
                        )}
                        {resolved && (
                          <Badge
                            variant="outline"
                            className="h-5 border-emerald-200 bg-emerald-50 text-[10px] font-semibold uppercase text-emerald-600"
                          >
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-400">
                        <span>
                          {TYPE_LABELS[alert.type] || alert.type} ·{" "}
                          {formatWhen(alert.createdAt)}
                        </span>
                        {/* Without this, a platform-wide feed is a list of
                            student names with no way to tell which academy is
                            being asked to act. */}
                        {academyName(alert.academyId) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-600">
                            <Building2 className="h-2.5 w-2.5" />
                            {academyName(alert.academyId)}
                          </span>
                        )}
                      </p>
                    </div>
                    {alert.amountPaise != null && (
                      <div className="text-right">
                        <p className="flex items-center justify-end gap-0.5 text-lg font-extrabold text-slate-900">
                          <IndianRupee className="h-4 w-4 text-slate-400" />
                          {formatRupees(alert.amountPaise).replace("₹", "")}
                        </p>
                        {alert.daysOverdue != null && (
                          <p className="text-[10px] font-semibold uppercase text-red-500">
                            {alert.daysOverdue} days overdue
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm leading-relaxed text-slate-600">
                    {alert.body}
                  </p>

                  {(alert.studentName || alert.passportId || alert.parentPhone) && (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {alert.studentName && (
                        <span className="font-semibold text-slate-700">
                          {alert.studentName}
                        </span>
                      )}
                      {alert.passportId && (
                        <Badge
                          variant="outline"
                          className="h-5 bg-white font-mono text-[10px]"
                        >
                          {alert.passportId}
                        </Badge>
                      )}
                      {alert.parentPhone && (
                        <a
                          href={`tel:${alert.parentPhone}`}
                          className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 font-medium text-green-700 transition-colors hover:bg-green-100"
                        >
                          <Phone className="h-3 w-3" />
                          {alert.parentPhone}
                        </a>
                      )}
                    </div>
                  )}

                  {alert.suggestedAction && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Suggested next step
                      </p>
                      <p className="mt-0.5 text-sm text-slate-700">
                        {alert.suggestedAction}
                      </p>
                    </div>
                  )}

                  {!resolved && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {!alert.acknowledgedAt && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busyId === alert._id}
                          onClick={() => act(alert._id, "acknowledge")}
                          className="h-8 gap-1.5 text-xs"
                        >
                          {busyId === alert._id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          Mark as seen
                        </Button>
                      )}
                      <Button
                        size="sm"
                        disabled={busyId === alert._id}
                        onClick={() => act(alert._id, "resolve")}
                        className="h-8 gap-1.5 bg-emerald-600 text-xs hover:bg-emerald-700"
                      >
                        {busyId === alert._id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
                        I've handled this
                      </Button>
                      {alert.acknowledgedAt && (
                        <span className="text-[11px] text-slate-400">
                          Seen {formatWhen(alert.acknowledgedAt)}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AlertFeed;
