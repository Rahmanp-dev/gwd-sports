"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Phone,
  Mail,
  BarChart3,
  PieChart,
  Wallet,
  Receipt,
  Users,
  Minus,
  Calendar,
} from "lucide-react";
import { useAppSelector } from "@/store";
import { API_BASE_URL } from "@/utils/constants";
import axios from "axios";
import {
  RecordCashPaymentDialog,
  type CashPaymentTarget,
} from "./RecordCashPaymentDialog";

function fmt(val: number): string {
  if (
    val === undefined ||
    val === null ||
    typeof val !== "number" ||
    isNaN(val)
  )
    return "₹0";
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${val.toLocaleString("en-IN")}`;
}

function GrowthBadge({ value }: { value: number }) {
  if (value === 0)
    return (
      <span className="text-xs text-slate-400 flex items-center gap-0.5">
        <Minus className="w-3 h-3" /> No change
      </span>
    );
  if (value > 0)
    return (
      <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
        <ArrowUpRight className="w-3 h-3" /> +{value}%
      </span>
    );
  return (
    <span className="text-xs text-red-500 font-bold flex items-center gap-0.5">
      <ArrowDownRight className="w-3 h-3" /> {value}%
    </span>
  );
}

// ─── Sparkline for daily data ───
function DailySparkline({ data }: { data: any[] }) {
  const safeData = data.map((d) => ({
    date: d.date,
    revenue: d.revenue ?? d.amount ?? 0,
  }));
  if (safeData.length === 0) return null;
  const maxVal = Math.max(...safeData.map((d) => d.revenue), 1);
  const w = 700;
  const h = 60;
  const points = safeData.map((d, i) => ({
    x: safeData.length > 1 ? (i / (safeData.length - 1)) * w : w / 2,
    y: h - (d.revenue / maxVal) * (h - 10),
  }));
  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  const areaD = `${pathD} L ${w} ${h} L 0 ${h} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h + 20}`}
      className="w-full"
      style={{ minHeight: 80 }}
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#spark-fill)" />
      <path
        d={pathD}
        fill="none"
        stroke="#ef4444"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {points.map(
        (p, i) =>
          safeData[i].revenue > 0 && (
            <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#dc2626" />
          ),
      )}
      {/* X-axis labels (every 5 days) */}
      {safeData.map((d, i) =>
        i % 5 === 0 ? (
          <text
            key={i}
            x={points[i].x}
            y={h + 14}
            textAnchor="middle"
            fontSize="8"
            fill="#9ca3af"
            fontFamily="system-ui"
          >
            {d.date}
          </text>
        ) : null,
      )}
    </svg>
  );
}

// ─── Donut Chart ───
function StatusDonut({
  success,
  pending,
  failed,
}: {
  success: number;
  pending: number;
  failed: number;
}) {
  const total = success + pending + failed;
  if (total === 0)
    return <p className="text-slate-400 text-sm text-center py-4">No data</p>;

  const segments = [
    { val: success, color: "#16a34a", label: "Success" },
    { val: pending, color: "#f59e0b", label: "Pending" },
    { val: failed, color: "#ef4444", label: "Failed" },
  ];

  const r = 60;
  const cx = 80;
  const cy = 80;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160">
        {segments.map((seg, i) => {
          const pct = seg.val / total;
          const dash = pct * circ;
          const el = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="20"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              className="transition-all duration-500"
            />
          );
          offset += dash;
          return el;
        })}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize="18"
          fontWeight="800"
          fill="#1f2937"
          fontFamily="system-ui"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fontSize="9"
          fill="#9ca3af"
          fontFamily="system-ui"
        >
          TRANSACTIONS
        </text>
      </svg>
      <div className="space-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: seg.color }}
            />
            <span className="text-xs text-slate-600 w-14">{seg.label}</span>
            <span className="text-xs font-bold text-slate-800">{seg.val}</span>
            <span className="text-[10px] text-slate-400">
              ({total > 0 ? Math.round((seg.val / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── KPI Card ───
function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  bg,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: React.ReactNode;
  color: string;
  bg: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-all group">
      <div
        className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity`}
        style={{ background: color }}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            {label}
          </p>
          <p
            className="text-2xl font-extrabold tracking-tight"
            style={{ color }}
          >
            {value}
          </p>
          {sub && <div className="mt-1.5">{sub}</div>}
        </div>
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-xl ${bg}`}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

// ═══════════ MAIN COMPONENT ═══════════
export interface FinanceDashboardProps {
  /**
   * The transaction ledger, injected by the parent and rendered high up —
   * directly beneath the defaulters list. Passed in rather than imported so
   * this file keeps owning layout while FeesManagement keeps owning the
   * ledger's data, filters and pagination. Optional: the dashboard is still
   * a complete screen without it.
   */
  ledgerSlot?: React.ReactNode;
  /**
   * Narrows every figure to one academy. Super admin only — the API ignores it
   * for an owner, who is always pinned to their own academy, so this can never
   * become a way to read another academy's books by editing a prop.
   *
   * Present so the platform-wide ledger and a per-academy finance tab are the
   * SAME component reading the SAME endpoint. Two implementations of
   * "collection rate" that drift apart is how a finance screen stops being
   * trusted.
   */
  academyId?: string | null;
  /** Shown instead of the default heading when scoped. */
  title?: string;
}

export function FinanceDashboard({
  ledgerSlot,
  academyId,
  title,
}: FinanceDashboardProps = {}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cashTarget, setCashTarget] = useState<CashPaymentTarget | null>(null);
  const { token } = useAppSelector((s) => s.auth);
  const API = API_BASE_URL;

  const fetchAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(
        `${API}/admin/finance-analytics${academyId ? `?academyId=${encodeURIComponent(academyId)}` : ""}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data?.success) setData(res.data.data);
      else setError("Failed to load finance analytics");
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to load finance analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAnalytics();
    // Refetches when the platform admin switches academy.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, academyId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        <p className="text-sm text-slate-500 font-medium">
          Loading Financial Analytics...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-slate-600">{error || "No data available"}</p>
        <Button variant="outline" size="sm" onClick={fetchAnalytics}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const summary = data?.summary || {
    lifetimeRevenue: 0,
    lifetimeCount: 0,
    monthlyRevenue: 0,
    monthGrowth: 0,
    quarterRevenue: 0,
    quarterGrowth: 0,
    collectionRate: 100,
    pendingRevenue: 0,
    pendingCount: 0,
    overdueRevenue: 0,
    overdueCount: 0,
  };
  const statusBreakdown = data?.statusBreakdown || {
    success: { count: 0, total: 0 },
    pending: { count: 0, total: 0 },
    failed: { count: 0, total: 0 },
  };
  const dailyTrend = data?.dailyTrend || [];
  const defaulters = data?.defaulters || [];

  return (
    <div className="space-y-6">
      <RecordCashPaymentDialog
        target={cashTarget}
        onClose={() => setCashTarget(null)}
        onRecorded={fetchAnalytics}
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-red-500" />
            {title ?? "Financial Command Center"}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Deep insights into every rupee — collected, pending, and overdue.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAnalytics}
          className="gap-2 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* KPI Hero Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          icon={Wallet}
          label="Lifetime Revenue"
          value={fmt(summary.lifetimeRevenue)}
          color="#16a34a"
          bg="bg-green-50"
          sub={
            <span className="text-[10px] text-slate-400">
              {summary.lifetimeCount} transactions
            </span>
          }
        />
        <KPICard
          icon={IndianRupee}
          label="This Month"
          value={fmt(summary.monthlyRevenue)}
          color="#2563eb"
          bg="bg-blue-50"
          sub={<GrowthBadge value={summary.monthGrowth} />}
        />
        <KPICard
          icon={Calendar}
          label="This Quarter"
          value={fmt(summary.quarterRevenue)}
          color="#7c3aed"
          bg="bg-violet-50"
          sub={<GrowthBadge value={summary.quarterGrowth} />}
        />
        <KPICard
          icon={CheckCircle}
          label="Collection Rate"
          value={`${summary.collectionRate}%`}
          color="#059669"
          bg="bg-emerald-50"
          sub={
            <span className="text-[10px] text-slate-400">success / total</span>
          }
        />
        <KPICard
          icon={AlertTriangle}
          label="Outstanding"
          value={fmt(summary.totalOutstanding)}
          color="#ea580c"
          bg="bg-orange-50"
          sub={
            <span className="text-[10px] text-slate-400">
              {summary.defaulterCount} students
            </span>
          }
        />
        <KPICard
          icon={Receipt}
          label="Avg Txn Value"
          value={fmt(summary.avgTransactionValue)}
          color="#0891b2"
          bg="bg-cyan-50"
          sub={<span className="text-[10px] text-slate-400">per payment</span>}
        />
      </div>

      {/*
        ══════════════════════════════════════════════════════════════════
        ACT ON IT, THEN CHECK IT
        ══════════════════════════════════════════════════════════════════

        Owner-directed reorder. What sat here before — Monthly Revenue,
        Revenue by Academy, Top Paying Students — was reporting: true, but
        nothing an owner does anything about on a Tuesday morning, and it
        pushed the two screens they open this tab FOR (who owes money, and
        did that payment land) below the fold.

        So: money owed first, status beside it, and the ledger immediately
        under both — close enough to the defaulters list that "call this
        parent" and "confirm what they paid" are one glance apart. Daily
        revenue stays, at the bottom, where a trend belongs.
      */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Defaulters / Overdue */}
        <Card className="border-0 shadow-sm transition-shadow hover:shadow-md border-l-4 border-l-red-400 lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <CardTitle className="text-base font-bold text-red-700">
                  Fee Defaulters
                </CardTitle>
              </div>
              <Badge variant="destructive" className="text-[10px] h-5">
                {summary.defaulterCount} students
              </Badge>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Students with outstanding dues — reach out now.
            </p>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {defaulters.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                <p className="text-sm font-medium text-emerald-600">
                  All fees clear!
                </p>
              </div>
            ) : (
              defaulters.map((d: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-red-50/50 border border-red-100 hover:bg-red-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {d.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] text-slate-400 truncate max-w-[100px]">
                        {d.academy}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[8px] h-3.5 capitalize border-slate-200"
                      >
                        {d.level || "—"}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-bold text-red-600">
                      {fmt(d.outstanding)}
                    </p>
                    <div className="flex gap-1 mt-0.5 justify-end items-center">
                      {d.phone && (
                        <a
                          href={`tel:${d.phone}`}
                          className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-green-600" />
                        </a>
                      )}
                      {d.email && (
                        <a
                          href={`mailto:${d.email}`}
                          className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5 text-blue-600" />
                        </a>
                      )}
                      {/* Most of these dues get settled in cash at the ground.
                          Without this the ledger never catches up with reality.
                          Sized for a thumb, not a mouse — this records real money. */}
                      {d.userId && (
                        <button
                          type="button"
                          onClick={() =>
                            setCashTarget({
                              userId: d.userId,
                              name: d.name,
                              outstanding: d.outstandingFees ?? d.outstanding,
                            })
                          }
                          className="ml-0.5 min-h-8 rounded-full bg-emerald-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 transition-colors hover:bg-emerald-200"
                        >
                          Mark paid
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Payment Status Donut */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 rounded-full bg-emerald-500" />
              <CardTitle className="text-base font-bold">
                Payment Status
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-center pt-2">
            <StatusDonut
              success={statusBreakdown.success.count}
              pending={statusBreakdown.pending.count}
              failed={statusBreakdown.failed.count}
            />
          </CardContent>
          <div className="px-6 pb-4 grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-green-50 border border-green-100">
              <p className="text-sm font-extrabold text-green-700">
                {fmt(statusBreakdown.success.total)}
              </p>
              <p className="text-[9px] text-green-500 uppercase font-semibold">
                Collected
              </p>
            </div>
            <div className="text-center p-2 rounded-lg bg-amber-50 border border-amber-100">
              <p className="text-sm font-extrabold text-amber-700">
                {fmt(statusBreakdown.pending.total)}
              </p>
              <p className="text-[9px] text-amber-500 uppercase font-semibold">
                Pending
              </p>
            </div>
            <div className="text-center p-2 rounded-lg bg-red-50 border border-red-100">
              <p className="text-sm font-extrabold text-red-700">
                {fmt(statusBreakdown.failed.total)}
              </p>
              <p className="text-[9px] text-red-500 uppercase font-semibold">
                Failed
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/*
        The ledger, rendered by the parent. It lives here rather than after
        the dashboard because the question it answers — "did that payment
        actually land?" — is the same question the defaulters list above
        provokes, and scrolling past three charts to get to it was the
        whole complaint.
      */}
      {ledgerSlot}

      {/* Daily Revenue Sparkline */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 rounded-full bg-rose-500" />
            <CardTitle className="text-base font-bold">
              Daily Revenue — Last 30 Days
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <DailySparkline data={dailyTrend} />
        </CardContent>
      </Card>
    </div>
  );
}
