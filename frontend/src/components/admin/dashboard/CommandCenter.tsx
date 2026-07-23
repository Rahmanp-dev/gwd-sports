import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  AlertTriangle,
  GraduationCap,
  Activity,
  Medal,
  Building2,
  UserCheck,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Loader2,
  Phone,
  Mail,
  CalendarDays,
  Minus,
  Trophy,
  BookOpen,
} from "lucide-react";
import { useAppSelector } from "@/store";
import axios from "axios";

interface DashboardData {
  students: {
    total: number;
    active: number;
    enrolled: number;
    unenrolled: number;
    growth: number;
    byLevel: { _id: string; count: number }[];
  };
  attendance: {
    rate: number;
    trend: {
      month: string;
      rate: number;
      totalRecords: number;
      presentCount: number;
    }[];
  };
  finance: {
    monthlyRevenue: number;
    lastMonthRevenue: number;
    revenueGrowth: number;
    totalRevenue: number;
    pendingAmount: number;
    pendingCount: number;
    feeOverdueCount: number;
    totalOutstanding: number;
  };
  trainers: {
    total: number;
    active: number;
    topTrainers: any[];
    sportDistribution: { _id: string; count: number }[];
  };
  academies: { total: number; active: number };
  dropOff: { count: number; students: any[] };
  recentActivity: { newStudents: any[]; recentPayments: any[] };
}

function formatCurrency(val: number): string {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${val}`;
}

function GrowthIndicator({ value }: { value: number }) {
  if (value === 0)
    return (
      <span className="text-xs text-gray-400 flex items-center gap-0.5">
        <Minus className="w-3 h-3" /> No change
      </span>
    );
  if (value > 0)
    return (
      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
        <ArrowUpRight className="w-3 h-3" /> ↑ {value}%
      </span>
    );
  return (
    <span className="text-xs text-red-500 font-semibold flex items-center gap-0.5">
      <ArrowDownRight className="w-3 h-3" /> ↓ {Math.abs(value)}%
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  iconBg,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: React.ReactNode;
  color: string;
  iconBg: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow group">
      <div
        className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity"
        style={{ background: color }}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
            {label}
          </p>
          <p
            className="text-3xl font-extrabold tracking-tight"
            style={{ color }}
          >
            {value}
          </p>
          {sub && <div className="mt-1.5">{sub}</div>}
        </div>
        <div
          className={`flex items-center justify-center w-11 h-11 rounded-xl ${iconBg}`}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function MiniBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-24 capitalize truncate">
        {label}
      </span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-6 text-right">
        {value}
      </span>
    </div>
  );
}

export function CommandCenter() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dropOffOpen, setDropOffOpen] = useState(false);
  const { token } = useAppSelector((s) => s.auth);
  const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

  // Leaderboard state
  const [leaders, setLeaders] = useState<any[]>([]);
  const [leadersLoading, setLeadersLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) setData(res.data.data);
      else setError("Failed to load dashboard");
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    setLeadersLoading(true);
    try {
      const res = await axios.get(`${API}/admin/students/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) setLeaders(res.data.data.topPerformers || []);
    } catch (err) {
      console.error("Failed to fetch leaderboard", err);
    } finally {
      setLeadersLoading(false);
    }
  };

  const handleStudentClick = async (id: string) => {
    setSelectedStudent(id);
    setDetailsLoading(true);
    try {
      const res = await axios.get(`${API}/admin/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) setStudentDetails(res.data.data.student);
    } catch (err) {
      console.error("Failed to fetch student details", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboard();
      fetchLeaderboard();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        <p className="text-sm text-gray-500 font-medium">
          Loading Command Center...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-gray-600">{error || "No data available"}</p>
        <Button variant="outline" size="sm" onClick={fetchDashboard}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const maxSport =
    data.trainers.sportDistribution.length > 0
      ? Math.max(...data.trainers.sportDistribution.map((s) => s.count))
      : 1;
  const maxLevel =
    data.students.byLevel.length > 0
      ? Math.max(...data.students.byLevel.map((l) => l.count))
      : 1;
  const sportColors = [
    "#ef4444",
    "#3b82f6",
    "#f59e0b",
    "#10b981",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Your Command Center
          </h2>
          <p className="text-sm text-gray-500">
            Real-time dashboard — complete visibility at a glance.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDashboard}
          className="gap-2 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={GraduationCap}
          label="Active Students"
          value={data.students.active}
          color="#dc2626"
          iconBg="bg-red-50"
          sub={<GrowthIndicator value={data.students.growth} />}
        />
        <StatCard
          icon={UserCheck}
          label="Attendance Rate"
          value={`${data.attendance.rate}%`}
          color="#16a34a"
          iconBg="bg-green-50"
          sub={<span className="text-xs text-gray-400">Last 30 days</span>}
        />
        <StatCard
          icon={IndianRupee}
          label="Revenue / Month"
          value={formatCurrency(data.finance.monthlyRevenue)}
          color="#2563eb"
          iconBg="bg-blue-50"
          sub={<GrowthIndicator value={data.finance.revenueGrowth} />}
        />
        <StatCard
          icon={AlertTriangle}
          label="Fee Overdue"
          value={data.finance.feeOverdueCount}
          color="#ea580c"
          iconBg="bg-orange-50"
          sub={
            <span className="text-xs text-gray-400">
              Outstanding: {formatCurrency(data.finance.totalOutstanding)}
            </span>
          }
        />
      </div>

      {/* Leaderboard + Popular Sports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 rounded-full bg-amber-500" />
                <CardTitle className="text-base font-bold">
                  Top Performers Leaderboard
                </CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchLeaderboard}
                className="text-xs gap-1.5 h-8"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {leadersLoading ? (
              <div className="text-center py-8 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Loading leaderboard...
              </div>
            ) : leaders.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Trophy className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                No performance records found.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {leaders.map((student, idx) => (
                  <div
                    key={student._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 border border-gray-100 cursor-pointer hover:bg-white hover:shadow-sm hover:border-gray-200 transition-all group"
                    onClick={() => handleStudentClick(student._id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm shadow-sm ${
                          idx === 0
                            ? "bg-gradient-to-br from-yellow-300 to-amber-400 text-white ring-2 ring-yellow-200"
                            : idx === 1
                              ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white ring-2 ring-gray-200"
                              : idx === 2
                                ? "bg-gradient-to-br from-orange-300 to-orange-400 text-white ring-2 ring-orange-200"
                                : "bg-white text-gray-500 border border-gray-200"
                        }`}
                      >
                        {idx < 3 ? (
                          <Medal className="w-4 h-4" />
                        ) : (
                          `#${idx + 1}`
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                          {student.studentName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge
                            variant="outline"
                            className="text-[9px] h-4 py-0 uppercase bg-white font-semibold"
                          >
                            {student.level || "Beginner"}
                          </Badge>
                          <span className="text-[10px] text-gray-400">
                            {student.academyName || "Global"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1 font-bold text-gray-900">
                        <Activity className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-base">{student.avgScore}</span>
                        <span className="text-[10px] text-gray-400 font-normal">
                          / 100
                        </span>
                      </div>
                      <p className="text-[9px] text-gray-400 font-semibold uppercase mt-0.5">
                        {student.totalEvals} Evaluations
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Sports sidebar */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 rounded-full bg-indigo-500" />
              <CardTitle className="text-base font-bold">
                Popular Sports
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.trainers.sportDistribution.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                No sport data yet
              </p>
            ) : (
              data.trainers.sportDistribution.map((s, i) => {
                const pct =
                  maxSport > 0 ? Math.round((s.count / maxSport) * 100) : 0;
                return (
                  <div key={s._id} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {s._id}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">
                        {s.count} trainers
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: sportColors[i % sportColors.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Three Column: Live Student | Financial | Trainer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live Student Count */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 rounded-full bg-red-500" />
              <CardTitle className="text-base font-bold">
                Live Student Count
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-xl font-extrabold text-emerald-600">
                  {data.students.active}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-emerald-500 font-semibold">
                  Active
                </p>
              </div>
              <div className="text-center p-3 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-xl font-extrabold text-blue-600">
                  {data.students.enrolled}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-blue-500 font-semibold">
                  Enrolled
                </p>
              </div>
              <div className="text-center p-3 rounded-xl bg-amber-50 border border-amber-100">
                <p className="text-xl font-extrabold text-amber-600">
                  {data.dropOff.count}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-amber-500 font-semibold">
                  At-Risk
                </p>
              </div>
            </div>
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                By Level
              </p>
              {data.students.byLevel.map((lvl, i) => (
                <MiniBar
                  key={lvl._id}
                  label={lvl._id || "unset"}
                  value={lvl.count}
                  max={maxLevel}
                  color={sportColors[i % sportColors.length]}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Financial Snapshot */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 rounded-full bg-blue-500" />
              <CardTitle className="text-base font-bold">
                Financial Snapshot
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-xs text-blue-500 font-semibold mb-0.5">
                  Total Revenue
                </p>
                <p className="text-lg font-extrabold text-blue-700">
                  {formatCurrency(data.finance.totalRevenue)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
                <p className="text-xs text-orange-500 font-semibold mb-0.5">
                  Pending
                </p>
                <p className="text-lg font-extrabold text-orange-700">
                  {formatCurrency(data.finance.pendingAmount)}
                </p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-red-50 border border-red-100">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-red-500 font-semibold">
                    Outstanding Fees
                  </p>
                  <p className="text-lg font-extrabold text-red-700">
                    {formatCurrency(data.finance.totalOutstanding)}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-red-200 text-red-600 text-xs"
                >
                  {data.finance.feeOverdueCount} students
                </Badge>
              </div>
            </div>
            {data.recentActivity.recentPayments.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Recent Payments
                </p>
                {data.recentActivity.recentPayments
                  .slice(0, 3)
                  .map((p: any) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-center text-xs bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <span className="text-gray-500 font-mono truncate max-w-[120px]">
                        {p.receipt || "—"}
                      </span>
                      <span className="font-bold text-gray-800">
                        ₹{p.amount}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trainer Overview */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 rounded-full bg-violet-500" />
              <CardTitle className="text-base font-bold">
                Trainer Overview
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-3 rounded-xl bg-violet-50 border border-violet-100">
                <p className="text-xl font-extrabold text-violet-600">
                  {data.trainers.active}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-violet-500 font-semibold">
                  Active
                </p>
              </div>
              <div className="text-center p-3 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-xl font-extrabold text-gray-700">
                  {data.academies.active}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                  Academies
                </p>
              </div>
            </div>
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Sports Covered
              </p>
              {data.trainers.sportDistribution.slice(0, 5).map((s, i) => (
                <MiniBar
                  key={s._id}
                  label={s._id}
                  value={s.count}
                  max={maxSport}
                  color={sportColors[i % sportColors.length]}
                />
              ))}
            </div>
            {data.trainers.topTrainers.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Top Trainers
                </p>
                {data.trainers.topTrainers.slice(0, 3).map((t: any) => (
                  <div
                    key={t._id}
                    className="flex justify-between items-center text-xs bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <span className="text-gray-700 font-semibold truncate max-w-[140px]">
                      {t.name}
                    </span>
                    <Badge variant="outline" className="text-[10px] h-5">
                      {t.studentCount} students
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance & Drop-off Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance Section */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 rounded-full bg-emerald-500" />
              <CardTitle className="text-base font-bold">
                Attendance — No More Paper Registers
              </CardTitle>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Know exactly who showed up, who didn't, and who's at risk.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  title: "Daily Mark System",
                  desc: "Trainers mark attendance with one tap. Present/absent with notes.",
                  color: "border-l-red-500",
                },
                {
                  title: "Drop-off Detection",
                  desc: `${data.dropOff.count} students absent 7+ days. Act before they leave.`,
                  color: "border-l-amber-500",
                },
                {
                  title: "Monthly Reports",
                  desc: `${data.attendance.rate}% avg attendance rate this month across all students.`,
                  color: "border-l-emerald-500",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className={`p-3 rounded-xl bg-white border border-gray-100 border-l-4 ${item.color}`}
                >
                  <p className="text-sm font-bold text-gray-800 mb-1">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
            {data.attendance.trend.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Monthly Trend
                </p>
                <div className="flex items-end gap-1.5 h-20">
                  {data.attendance.trend.map((t) => (
                    <div
                      key={t.month}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <span className="text-[9px] font-bold text-gray-600">
                        {t.rate}%
                      </span>
                      <div
                        className="w-full rounded-t-md bg-emerald-100 relative"
                        style={{ height: `${Math.max(t.rate * 0.6, 4)}px` }}
                      >
                        <div
                          className="absolute inset-0 rounded-t-md bg-emerald-500"
                          style={{ height: `${t.rate}%` }}
                        />
                      </div>
                      <span className="text-[8px] text-gray-400">
                        {t.month.split("-")[1]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Drop-off Alert */}
        <Card className="border-0 shadow-sm border-l-4 border-l-red-400">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <CardTitle className="text-base font-bold text-red-700">
                  Drop-off Alerts
                </CardTitle>
              </div>
              <Badge variant="destructive" className="text-xs">
                {data.dropOff.count} at risk
              </Badge>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Students absent 7+ days — act before they leave.
            </p>
          </CardHeader>
          <CardContent>
            {data.dropOff.students.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <UserCheck className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                <p className="text-sm font-medium text-emerald-600">
                  All students are active!
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {data.dropOff.students.slice(0, 8).map((s: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 border border-red-100 hover:bg-red-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {s.studentName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {s.academyName && (
                          <span className="text-[10px] text-gray-400">
                            {s.academyName}
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className="text-[9px] h-4 capitalize border-red-200 text-red-500"
                        >
                          {s.level || "—"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-xs font-bold text-red-600">
                        {Math.round(s.daysSinceLastAttendance)}d ago
                      </p>
                      <div className="flex gap-1.5 mt-1 justify-end">
                        {s.phone && (
                          <a
                            href={`tel:${s.phone}`}
                            className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors"
                          >
                            <Phone className="w-3 h-3 text-green-600" />
                          </a>
                        )}
                        {s.email && (
                          <a
                            href={`mailto:${s.email}`}
                            className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors"
                          >
                            <Mail className="w-3 h-3 text-blue-600" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {data.dropOff.students.length > 8 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-red-500"
                    onClick={() => setDropOffOpen(true)}
                  >
                    View all {data.dropOff.count} at-risk students →
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent New Students */}
      {data.recentActivity.newStudents.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 rounded-full bg-cyan-500" />
              <CardTitle className="text-base font-bold">
                Recent Enrollments
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {data.recentActivity.newStudents.map((s: any) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-cyan-50/50 border border-cyan-100"
                >
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {s.name}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">
                    {s.email}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge
                      variant="outline"
                      className="text-[9px] h-4 capitalize"
                    >
                      {s.level}
                    </Badge>
                    <span className="text-[9px] text-gray-400">
                      {new Date(s.joinedAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Drop-off Dialog */}
      <Dialog open={dropOffOpen} onOpenChange={setDropOffOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" /> All At-Risk
              Students
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {data.dropOff.students.map((s: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border"
              >
                <div>
                  <p className="text-sm font-semibold">{s.studentName}</p>
                  <p className="text-xs text-gray-400">
                    {s.email} • {s.academyName || "No Academy"}
                  </p>
                </div>
                <Badge variant="destructive" className="text-xs">
                  {Math.round(s.daysSinceLastAttendance)}d absent
                </Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Detail Dialog */}
      <Dialog
        open={!!selectedStudent}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedStudent(null);
            setStudentDetails(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-red-500" /> Student
              Overview
            </DialogTitle>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-red-500" />
            </div>
          ) : studentDetails ? (
            <div className="space-y-5">
              {/* Student Info Header */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">
                  {studentDetails.userId?.name}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {studentDetails.userId?.email} •{" "}
                  {studentDetails.userId?.phone}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  <Badge className="bg-red-100 text-red-700 border-red-200 capitalize text-xs">
                    {studentDetails.level}
                  </Badge>
                  {studentDetails.sports?.map((sport: string) => (
                    <Badge
                      key={sport}
                      variant="outline"
                      className="capitalize text-xs"
                    >
                      {sport}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Performance History */}
              <div>
                <h4 className="font-bold text-gray-800 text-sm border-b pb-2 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" /> Performance
                  History
                </h4>
                {!studentDetails.performance ||
                studentDetails.performance.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">
                    No performance records available.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {studentDetails.performance.map((perf: any) => (
                      <div
                        key={perf._id}
                        className="p-3.5 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-bold text-gray-900 capitalize">
                              {perf.category}
                            </span>
                            <span className="text-[10px] text-gray-400 ml-2 font-medium">
                              {new Date(perf.evaluatedAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>
                          <div className="text-sm font-extrabold text-gray-900">
                            {perf.score}{" "}
                            <span className="text-gray-400 font-normal text-xs">
                              / {perf.maxScore}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${(perf.score / perf.maxScore) * 100}%`,
                              background:
                                perf.score / perf.maxScore >= 0.8
                                  ? "#16a34a"
                                  : perf.score / perf.maxScore >= 0.5
                                    ? "#2563eb"
                                    : "#ea580c",
                            }}
                          />
                        </div>
                        {perf.remarks && (
                          <p className="text-xs text-gray-500 italic leading-relaxed">
                            "{perf.remarks}"
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                          Evaluated by: {perf.evaluatedBy?.name || "Unknown"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center py-8 text-gray-400">
              Could not load student details.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
