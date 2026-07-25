"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/utils/constants";
import { useAppSelector } from "@/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Clock,
  Inbox,
  Loader2,
  MessageSquare,
  MoonStar,
  RefreshCw,
  Search,
  Send,
  Smartphone,
  XCircle,
} from "lucide-react";

/**
 * The message log — "why didn't this send?", answerable without reading code.
 *
 * Every row the engine has ever created is here, including the ones it chose
 * not to send. The explanation string on each row comes from the SERVER
 * (lib/messaging/explain.ts) rather than being reconstructed here, because the
 * wording is policy: a deferral is not a drop, and a skip for "no provider
 * connected" is an activation gap rather than a delivery failure. Those
 * sentences have to stay true when someone restyles this table.
 */

type MessageState =
  | "waiting"
  | "held"
  | "in_flight"
  | "landed"
  | "problem"
  | "stopped";

interface Explanation {
  state: MessageState;
  headline: string;
  detail: string;
  terminal: boolean;
}

/** Populated to `{ _id, name }` for a super admin, a bare id otherwise. */
type AcademyRef = string | { _id: string; name?: string } | null;

interface LogMessage {
  _id: string;
  academyId?: AcademyRef;
  passportId?: string | null;
  recipientPhone: string;
  recipientName?: string | null;
  channel: "whatsapp" | "sms";
  templateKey: string;
  bodyPreview?: string | null;
  priority: number;
  status: string;
  scheduledFor: string;
  sentOnLocalDate?: string | null;
  attempts: number;
  deferrals: number;
  lastDeferralReason?: string | null;
  provider?: string | null;
  providerMessageId?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  failedAt?: string | null;
  error?: string | null;
  fallbackForMessageId?: string | null;
  fallbackMessageId?: string | null;
  createdAt: string;
  explanation: Explanation;
}

interface Counts {
  all: number;
  byStatus: Record<string, number>;
  byGroup: Record<string, number>;
}

interface SchedulingConfig {
  dailyBudget: number;
  paymentReserve: number;
  quietStartHour: number;
  quietEndHour: number;
}

const STATE_STYLES: Record<
  MessageState,
  { dot: string; chip: string; icon: any }
> = {
  waiting: {
    dot: "bg-slate-400",
    chip: "bg-slate-100 text-slate-600 border-slate-200",
    icon: Clock,
  },
  held: {
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    icon: MoonStar,
  },
  in_flight: {
    dot: "bg-blue-500",
    chip: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Send,
  },
  landed: {
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCheck,
  },
  problem: {
    dot: "bg-red-500",
    chip: "bg-red-50 text-red-700 border-red-200",
    icon: XCircle,
  },
  stopped: {
    dot: "bg-violet-400",
    chip: "bg-violet-50 text-violet-700 border-violet-200",
    icon: MessageSquare,
  },
};

const FILTERS: { value: string; label: string; countKey: string }[] = [
  { value: "all", label: "All", countKey: "all" },
  { value: "pending", label: "Waiting to send", countKey: "pending" },
  { value: "sent", label: "Reached the parent", countKey: "sent" },
  { value: "problem", label: "Failed", countKey: "problem" },
  { value: "stopped", label: "Not sent on purpose", countKey: "stopped" },
];

const PRIORITY_LABELS: Record<number, string> = {
  1: "Payment",
  2: "Attendance",
  3: "Achievement",
  4: "Broadcast",
};

/** The academy's name when the API populated it, otherwise nothing to show. */
function academyName(ref: AcademyRef | undefined): string | null {
  if (!ref || typeof ref === "string") return null;
  return ref.name ?? null;
}

function formatWhen(iso?: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** The delivery timeline, only showing steps that actually happened. */
function Timeline({ message }: { message: LogMessage }) {
  const steps: { label: string; at?: string | null }[] = [
    { label: "Created", at: message.createdAt },
    { label: "Scheduled for", at: message.scheduledFor },
    { label: "Sent", at: message.sentAt },
    { label: "Delivered", at: message.deliveredAt },
    { label: "Read", at: message.readAt },
    { label: "Failed", at: message.failedAt },
  ].filter((step) => Boolean(step.at));

  return (
    <div className="space-y-1.5">
      {steps.map((step) => (
        <div
          key={step.label}
          className="flex items-center justify-between text-xs"
        >
          <span className="text-slate-400">{step.label}</span>
          <span className="font-medium text-slate-600">
            {formatWhen(step.at)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function MessageLog() {
  const [messages, setMessages] = useState<LogMessage[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [templates, setTemplates] = useState<{ key: string }[]>([]);
  const [config, setConfig] = useState<SchedulingConfig | null>(null);
  // Non-null only for a super admin. Its presence is what switches on the
  // academy filter and column, rather than a second role check in the client.
  const [academies, setAcademies] = useState<
    { _id: string; name: string }[] | null
  >(null);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [academyFilter, setAcademyFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { token } = useAppSelector((s) => s.auth);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/academy/messages`, {
        params: {
          status: statusFilter,
          templateKey: templateFilter,
          channel: channelFilter,
          academyId: academyFilter,
          q: appliedSearch || undefined,
          page,
          limit: 25,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        const data = res.data.data;
        setMessages(data.messages || []);
        setCounts(data.counts || null);
        setTemplates(data.templates || []);
        setConfig(data.schedulingConfig || null);
        setAcademies(data.academies ?? null);
        setPages(data.pagination?.pages || 1);
      } else {
        setError(res.data?.message || "Failed to load the message log");
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to load the message log");
    } finally {
      setLoading(false);
    }
  }, [
    token,
    statusFilter,
    templateFilter,
    channelFilter,
    academyFilter,
    appliedSearch,
    page,
  ]);

  useEffect(() => {
    if (token) fetchMessages();
  }, [token, fetchMessages]);

  // Any filter change invalidates the current page number — page 4 of "all" is
  // rarely page 4 of "failed".
  const changeFilter = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(search.trim());
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Message Log
          </h2>
          <p className="text-sm text-slate-500">
            Every message the system built for a parent — including the ones it
            decided not to send, and why.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchMessages}
          className="gap-2 text-xs font-semibold"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {config && (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Current limits: <strong>{config.dailyBudget}</strong> message(s) per
          parent per day, plus <strong>{config.paymentReserve}</strong> reserved
          for fee reminders. Quiet hours{" "}
          <strong>
            {config.quietStartHour}:00–{config.quietEndHour}:00 IST
          </strong>
          . Messages that hit a limit are held for a later slot, never dropped.
        </p>
      )}

      {/* Status chips. Counts ignore the active filter on purpose, so picking
          one chip does not hide the evidence for the others. */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const count =
            filter.countKey === "all"
              ? counts?.all
              : counts?.byGroup?.[filter.countKey];
          const active = statusFilter === filter.value;
          return (
            <button
              key={filter.value}
              onClick={() => changeFilter(setStatusFilter)(filter.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {filter.label}
              {count != null && (
                <span
                  className={`ml-1.5 ${active ? "text-slate-300" : "text-slate-400"}`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <form onSubmit={submitSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by child's name, parent's number or passport ID…"
            className="pl-9"
          />
        </form>
        <Select
          value={templateFilter}
          onValueChange={changeFilter(setTemplateFilter)}
        >
          <SelectTrigger className="sm:w-52">
            <SelectValue placeholder="All message types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All message types</SelectItem>
            {templates.map((t) => (
              <SelectItem key={t.key} value={t.key}>
                {t.key.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={channelFilter}
          onValueChange={changeFilter(setChannelFilter)}
        >
          <SelectTrigger className="sm:w-36">
            <SelectValue placeholder="All channels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
          </SelectContent>
        </Select>
        {/* Super admin only — the API returns this list to nobody else. */}
        {academies && (
          <Select
            value={academyFilter}
            onValueChange={changeFilter(setAcademyFilter)}
          >
            <SelectTrigger className="sm:w-48">
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
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="h-7 w-7 animate-spin text-red-500" />
          <p className="text-sm font-medium text-slate-500">
            Loading messages…
          </p>
        </div>
      ) : messages.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
            <Inbox className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">
              No messages match these filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {messages.map((message) => {
            const style =
              STATE_STYLES[message.explanation?.state] ?? STATE_STYLES.waiting;
            const StateIcon = style.icon;
            const open = expanded === message._id;

            return (
              <div
                key={message._id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-sm"
              >
                <button
                  onClick={() => setExpanded(open ? null : message._id)}
                  className="flex w-full items-start gap-3 p-3.5 text-left"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${style.dot}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {message.recipientName || message.recipientPhone}
                      </span>
                      <Badge
                        variant="outline"
                        className="h-5 bg-white text-[10px] font-medium capitalize"
                      >
                        {message.templateKey.replace(/_/g, " ")}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`h-5 gap-1 text-[10px] font-semibold ${style.chip}`}
                      >
                        <StateIcon className="h-2.5 w-2.5" />
                        {message.explanation?.headline || message.status}
                      </Badge>
                      {message.channel === "sms" && (
                        <Badge
                          variant="outline"
                          className="h-5 gap-1 border-slate-200 text-[10px] font-semibold text-slate-500"
                        >
                          <Smartphone className="h-2.5 w-2.5" /> SMS
                        </Badge>
                      )}
                      {academyName(message.academyId) && (
                        <Badge
                          variant="outline"
                          className="h-5 gap-1 border-indigo-200 bg-indigo-50 text-[10px] font-semibold text-indigo-600"
                        >
                          <Building2 className="h-2.5 w-2.5" />
                          {academyName(message.academyId)}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                      {message.explanation?.detail}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span className="hidden text-[11px] text-slate-400 sm:inline">
                      {formatWhen(message.createdAt)}
                    </span>
                    {open ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {open && (
                  <div className="grid gap-4 border-t border-slate-100 bg-slate-50/60 p-4 lg:grid-cols-2">
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          What the parent would see
                        </p>
                        <div className="mt-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-700">
                          {message.bodyPreview || (
                            <span className="italic text-slate-400">
                              No rendered preview stored for this message.
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Phone</span>
                          <span className="font-mono font-medium text-slate-600">
                            {message.recipientPhone}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Passport</span>
                          <span className="font-mono font-medium text-slate-600">
                            {message.passportId || "—"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Priority</span>
                          <span className="font-medium text-slate-600">
                            {PRIORITY_LABELS[message.priority] ||
                              message.priority}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Status</span>
                          <span className="font-medium text-slate-600">
                            {message.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Attempts</span>
                          <span className="font-medium text-slate-600">
                            {message.attempts}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Times held</span>
                          <span className="font-medium text-slate-600">
                            {message.deferrals}
                          </span>
                        </div>
                        {message.provider && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Provider</span>
                            <span className="font-medium text-slate-600">
                              {message.provider}
                            </span>
                          </div>
                        )}
                        {message.sentOnLocalDate && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Counted on</span>
                            <span className="font-medium text-slate-600">
                              {message.sentOnLocalDate}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Why it is in this state
                        </p>
                        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                          {message.explanation?.detail}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Timeline
                        </p>
                        <div className="mt-1.5">
                          <Timeline message={message} />
                        </div>
                      </div>
                      {message.error && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Raw provider message
                          </p>
                          <p className="mt-1 break-words rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-[11px] text-slate-600">
                            {message.error}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="text-xs"
          >
            Previous
          </Button>
          <span className="text-xs text-slate-400">
            Page {page} of {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages || loading}
            onClick={() => setPage((p) => Math.min(p + 1, pages))}
            className="text-xs"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export default MessageLog;
