import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IndianRupee, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Loader2, RefreshCw, AlertTriangle, CheckCircle, Clock, XCircle,
  Phone, Mail, BarChart3, PieChart, Wallet, Receipt, Users,
  Building2, Minus, Calendar,
} from "lucide-react";
import { useAppSelector } from "@/store";
import axios from "axios";

// ─── Helpers ───
function fmt(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${val.toLocaleString("en-IN")}`;
}

function GrowthBadge({ value }: { value: number }) {
  if (value === 0) return <span className="text-xs text-gray-400 flex items-center gap-0.5"><Minus className="w-3 h-3" /> No change</span>;
  if (value > 0) return <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" /> +{value}%</span>;
  return <span className="text-xs text-red-500 font-bold flex items-center gap-0.5"><ArrowDownRight className="w-3 h-3" /> {value}%</span>;
}

// ─── SVG Bar Chart ───
function RevenueBarChart({ data, height = 200 }: { data: { label: string; revenue: number; count: number }[]; height?: number }) {
  const maxVal = Math.max(...data.map(d => d.revenue), 1);
  const barW = Math.floor(800 / data.length) - 8;
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="relative">
      <svg viewBox={`0 0 800 ${height + 30}`} className="w-full" style={{ minHeight: height + 30 }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <g key={pct}>
            <line x1="0" y1={height - pct * height} x2="800" y2={height - pct * height} stroke="#f3f4f6" strokeWidth="1" />
            <text x="0" y={height - pct * height - 4} fontSize="9" fill="#9ca3af" fontFamily="system-ui">{fmt(maxVal * pct)}</text>
          </g>
        ))}

        {data.map((d, i) => {
          const barH = (d.revenue / maxVal) * (height - 20);
          const x = i * (barW + 8) + 20;
          const y = height - barH;
          const isHovered = hoveredIdx === i;

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              {/* Bar gradient */}
              <defs>
                <linearGradient id={`bar-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isHovered ? "#dc2626" : "#ef4444"} />
                  <stop offset="100%" stopColor={isHovered ? "#b91c1c" : "#dc2626"} />
                </linearGradient>
              </defs>
              <rect
                x={x} y={y} width={barW} height={barH}
                rx="4" fill={`url(#bar-grad-${i})`}
                opacity={isHovered ? 1 : 0.85}
                className="transition-all duration-200"
              />
              {/* Label */}
              <text x={x + barW / 2} y={height + 16} textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="system-ui" fontWeight={isHovered ? "700" : "400"}>
                {d.label}
              </text>
              {/* Tooltip */}
              {isHovered && (
                <g>
                  <rect x={x - 10} y={y - 40} width={barW + 20} height="32" rx="6" fill="#1f2937" opacity="0.95" />
                  <text x={x + barW / 2} y={y - 24} textAnchor="middle" fontSize="10" fill="#fff" fontFamily="system-ui" fontWeight="700">
                    {fmt(d.revenue)}
                  </text>
                  <text x={x + barW / 2} y={y - 13} textAnchor="middle" fontSize="8" fill="#9ca3af" fontFamily="system-ui">
                    {d.count} txns
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Sparkline for daily data ───
function DailySparkline({ data }: { data: { date: string; revenue: number }[] }) {
  const maxVal = Math.max(...data.map(d => d.revenue), 1);
  const w = 700;
  const h = 60;
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - (d.revenue / maxVal) * (h - 10),
  }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${w} ${h} L 0 ${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full" style={{ minHeight: 80 }}>
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#spark-fill)" />
      <path d={pathD} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round" />
      {points.map((p, i) => (
        data[i].revenue > 0 && <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#dc2626" />
      ))}
      {/* X-axis labels (every 5 days) */}
      {data.map((d, i) =>
        i % 5 === 0 ? (
          <text key={i} x={points[i].x} y={h + 14} textAnchor="middle" fontSize="8" fill="#9ca3af" fontFamily="system-ui">
            {d.date}
          </text>
        ) : null
      )}
    </svg>
  );
}

// ─── Donut Chart ───
function StatusDonut({ success, pending, failed }: { success: number; pending: number; failed: number }) {
  const total = success + pending + failed;
  if (total === 0) return <p className="text-gray-400 text-sm text-center py-4">No data</p>;

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
              cx={cx} cy={cy} r={r}
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
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="18" fontWeight="800" fill="#1f2937" fontFamily="system-ui">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#9ca3af" fontFamily="system-ui">
          TRANSACTIONS
        </text>
      </svg>
      <div className="space-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: seg.color }} />
            <span className="text-xs text-gray-600 w-14">{seg.label}</span>
            <span className="text-xs font-bold text-gray-800">{seg.val}</span>
            <span className="text-[10px] text-gray-400">({total > 0 ? Math.round((seg.val / total) * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── KPI Card ───
function KPICard({ icon: Icon, label, value, sub, color, bg }: { icon: any; label: string; value: string; sub?: React.ReactNode; color: string; bg: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all group">
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity`} style={{ background: color }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
          <p className="text-2xl font-extrabold tracking-tight" style={{ color }}>{value}</p>
          {sub && <div className="mt-1.5">{sub}</div>}
        </div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${bg}`}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}


// ═══════════ MAIN COMPONENT ═══════════
export function FinanceDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token } = useAppSelector((s) => s.auth);
  const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

  const fetchAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API}/admin/finance-analytics`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.success) setData(res.data.data);
      else setError("Failed to load finance analytics");
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to load finance analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchAnalytics(); }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        <p className="text-sm text-gray-500 font-medium">Loading Financial Analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-gray-600">{error || "No data available"}</p>
        <Button variant="outline" size="sm" onClick={fetchAnalytics}><RefreshCw className="w-4 h-4 mr-2" />Retry</Button>
      </div>
    );
  }

  const { summary, statusBreakdown, monthlyTrend, dailyTrend, academyRevenue, topPayers, defaulters } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-red-500" />
            Financial Command Center
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Deep insights into every rupee — collected, pending, and overdue.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAnalytics} className="gap-2 text-xs font-semibold">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* KPI Hero Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard icon={Wallet} label="Lifetime Revenue" value={fmt(summary.lifetimeRevenue)} color="#16a34a" bg="bg-green-50"
          sub={<span className="text-[10px] text-gray-400">{summary.lifetimeCount} transactions</span>} />
        <KPICard icon={IndianRupee} label="This Month" value={fmt(summary.monthlyRevenue)} color="#2563eb" bg="bg-blue-50"
          sub={<GrowthBadge value={summary.monthGrowth} />} />
        <KPICard icon={Calendar} label="This Quarter" value={fmt(summary.quarterRevenue)} color="#7c3aed" bg="bg-violet-50"
          sub={<GrowthBadge value={summary.quarterGrowth} />} />
        <KPICard icon={CheckCircle} label="Collection Rate" value={`${summary.collectionRate}%`} color="#059669" bg="bg-emerald-50"
          sub={<span className="text-[10px] text-gray-400">success / total</span>} />
        <KPICard icon={AlertTriangle} label="Outstanding" value={fmt(summary.totalOutstanding)} color="#ea580c" bg="bg-orange-50"
          sub={<span className="text-[10px] text-gray-400">{summary.defaulterCount} students</span>} />
        <KPICard icon={Receipt} label="Avg Txn Value" value={fmt(summary.avgTransactionValue)} color="#0891b2" bg="bg-cyan-50"
          sub={<span className="text-[10px] text-gray-400">per payment</span>} />
      </div>

      {/* Revenue Trend + Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 12-Month Revenue Chart */}
        <Card className="lg:col-span-2 border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 rounded-full bg-red-500" />
              <CardTitle className="text-base font-bold">Monthly Revenue — Last 12 Months</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <RevenueBarChart data={monthlyTrend} height={180} />
          </CardContent>
        </Card>

        {/* Payment Status Donut */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 rounded-full bg-emerald-500" />
              <CardTitle className="text-base font-bold">Payment Status</CardTitle>
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
              <p className="text-sm font-extrabold text-green-700">{fmt(statusBreakdown.success.total)}</p>
              <p className="text-[9px] text-green-500 uppercase font-semibold">Collected</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-amber-50 border border-amber-100">
              <p className="text-sm font-extrabold text-amber-700">{fmt(statusBreakdown.pending.total)}</p>
              <p className="text-[9px] text-amber-500 uppercase font-semibold">Pending</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-red-50 border border-red-100">
              <p className="text-sm font-extrabold text-red-700">{fmt(statusBreakdown.failed.total)}</p>
              <p className="text-[9px] text-red-500 uppercase font-semibold">Failed</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Daily Revenue Sparkline */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 rounded-full bg-rose-500" />
            <CardTitle className="text-base font-bold">Daily Revenue — Last 30 Days</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <DailySparkline data={dailyTrend} />
        </CardContent>
      </Card>

      {/* Academy Revenue + Top Payers + Defaulters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Academy Revenue */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 rounded-full bg-violet-500" />
              <CardTitle className="text-base font-bold">Revenue by Academy</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {academyRevenue.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No academy revenue data</p>
            ) : (
              academyRevenue.map((a: any, i: number) => {
                const maxR = academyRevenue[0]?.revenue || 1;
                const pct = Math.round((a.revenue / maxR) * 100);
                const colors = ["#ef4444", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6"];
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 truncate max-w-[140px]">{a.name}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-800">{fmt(a.revenue)}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                    </div>
                    <p className="text-[9px] text-gray-400 text-right">{a.count} payments</p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Top Payers */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 rounded-full bg-blue-500" />
              <CardTitle className="text-base font-bold">Top Paying Students</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {topPayers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No payment data</p>
            ) : (
              topPayers.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                      i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-600" : "bg-white text-gray-500 border"
                    }`}>
                      #{i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 truncate max-w-[120px]">{p.name}</p>
                      <p className="text-[9px] text-gray-400">{p.txnCount} payments</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-700">{fmt(p.totalPaid)}</p>
                    <div className="flex gap-1 mt-0.5 justify-end">
                      {p.phone && (
                        <a href={`tel:${p.phone}`} className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center hover:bg-green-100 transition-colors">
                          <Phone className="w-2.5 h-2.5 text-green-600" />
                        </a>
                      )}
                      {p.email && (
                        <a href={`mailto:${p.email}`} className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors">
                          <Mail className="w-2.5 h-2.5 text-blue-600" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Defaulters / Overdue */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-red-400">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <CardTitle className="text-base font-bold text-red-700">Fee Defaulters</CardTitle>
              </div>
              <Badge variant="destructive" className="text-[10px] h-5">{summary.defaulterCount} students</Badge>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">Students with outstanding dues — reach out now.</p>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {defaulters.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                <p className="text-sm font-medium text-emerald-600">All fees clear!</p>
              </div>
            ) : (
              defaulters.map((d: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-red-50/50 border border-red-100 hover:bg-red-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{d.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] text-gray-400 truncate max-w-[100px]">{d.academy}</span>
                      <Badge variant="outline" className="text-[8px] h-3.5 capitalize border-gray-200">{d.level || "—"}</Badge>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-bold text-red-600">{fmt(d.outstanding)}</p>
                    <div className="flex gap-1 mt-0.5 justify-end">
                      {d.phone && (
                        <a href={`tel:${d.phone}`} className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors">
                          <Phone className="w-2.5 h-2.5 text-green-600" />
                        </a>
                      )}
                      {d.email && (
                        <a href={`mailto:${d.email}`} className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors">
                          <Mail className="w-2.5 h-2.5 text-blue-600" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
