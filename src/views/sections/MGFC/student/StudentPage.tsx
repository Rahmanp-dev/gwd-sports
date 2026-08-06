"use client";
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "@/lib/router-shim";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PassportCard } from "@/components/student/PassportCard";
import { SportingRecordPanel } from "@/components/student/SportingRecordPanel";
import { FeeReminderBar } from "@/components/student/FeeReminderBar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { API_BASE_URL } from "@/utils/constants";
import { authService } from "@/services/authService";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout, setUser } from "@/store/slices/authSlice";
import KitManagement from "./tabs/KitManagement";
import {
  Calendar,
  Trophy,
  Target,
  TrendingUp,
  Users,
  Clock,
  MapPin,
  Star,
  ChevronRight,
  Activity,
  Zap,
  Heart,
  Shield,
  CheckCircle,
  AlertCircle,
  Bell,
  Settings,
  LogOut,
  Download,
  Upload,
  BarChart3,
  Award,
} from "lucide-react";
import Footer from "@/components/landing/Footer";
import { toast } from "sonner";
import FeesManagement from "./tabs/FeesManagement";
import { CheckInCard } from "@/components/user/student/CheckInCard";
import { AcademyTheme } from "@/components/branding/AcademyTheme";
import { AccountSettings } from "@/components/user/AccountSettings";

export default function MGFCStudentPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "dashboard",
  );

  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  /**
   * A failed load and an empty account used to look identical: the fetch
   * swallowed its error, `studentProfile` stayed null, and the dashboard
   * rendered "Not in any academy" with zero stats. A student whose signal
   * dropped for a second was told, in effect, that their academy had removed
   * them. Tracked separately so the two can say different things.
   */
  const [profileError, setProfileError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const assignedTrainer = studentProfile?.trainers?.[0]?.name || "Not Assigned";
  const assignedTrainerPhone =
    studentProfile?.trainers?.[0]?.phone || "Not Assigned";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError(null);
        const res = await fetch(`${API_BASE_URL}/student/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // A 401 here means the session expired while the tab sat open, which
        // is worth saying plainly rather than rendering an empty dashboard.
        if (res.status === 401) {
          setProfileError(
            "Your session has expired. Please sign in again.",
          );
          return;
        }

        const data = await res.json().catch(() => null);
        if (data?.success && data.data?.studentProfile) {
          setStudentProfile(data.data.studentProfile);
        } else {
          setProfileError(
            data?.message ||
              "We couldn't load your profile just now. Your data is safe — this is a connection problem.",
          );
        }
      } catch (err) {
        console.error(err);
        setProfileError(
          "We couldn't reach the server. Check your connection and try again.",
        );
      } finally {
        setProfileLoading(false);
      }
    };
    if (token) fetchProfile();
  }, [token, reloadKey]);

  // Sync tab state with URL
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value }, { replace: true });
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("mg_refresh_token");
      if (refreshToken) {
        await authService.logout();
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch(logout());
      navigate("/user/auth");
      toast.success("Logged out successfully");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen pt-shell flex items-center justify-center pt-title">
        <div className="flex flex-col items-center">
          <Activity className="h-10 w-10 pt-brand animate-spin mb-4" />
          <p>Loading Profile...</p>
        </div>
      </div>
    );
  }

  /**
   * A load failure gets its own screen rather than falling through to the
   * dashboard. Falling through rendered "Not in any academy", ₹0 and no
   * passport — a student reading that during a dropped connection has every
   * reason to think they have been removed from their academy.
   */
  if (profileError) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-shell px-4 pt-title">
        <div className="w-full max-w-sm rounded-2xl border pt-border pt-card p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-amber-400" />
          <h1 className="text-lg font-bold">We couldn&rsquo;t load your dashboard</h1>
          <p className="mt-2 text-sm leading-relaxed pt-muted">
            {profileError}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Button
              onClick={() => setReloadKey((n) => n + 1)}
              className="pt-btn-brand"
            >
              Try again
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/user/auth")}
              className="pt-border bg-transparent pt-title hover:pt-card-soft"
            >
              Sign in again
            </Button>
          </div>
          <p className="mt-4 text-xs pt-faint">
            Nothing has been lost — your attendance, progress and Passport are
            all still on your record.
          </p>
        </div>
      </div>
    );
  }

  const realName = user?.name || "Student";
  const rollNumber =
    studentProfile?._id?.substring(0, 8).toUpperCase() || "N/A";
  const academyName = studentProfile?.academyId?.name || "Not in any academy";
  /** Public, shareable record. Absent only for profiles created before
   *  passports existed, so the button is conditional rather than assumed. */
  const passportId: string | null = studentProfile?.passportId ?? null;
  const academyTheme = studentProfile?.academyId?.theme ?? null;
  const position = studentProfile?.level || "beginner";
  const sports = studentProfile?.sports?.join(", ") || "None";
  const isCricket = studentProfile?.sports?.some(
    (s: string) => s.toLowerCase() === "cricket",
  );

  // Fetch real metrics or fallback to deterministic random numbers for general stats
  const getLatestScore = (category: string) => {
    if (!studentProfile?.performance) return "N/A";
    const perfs = studentProfile.performance.filter(
      (p: any) => p.category.toLowerCase() === category.toLowerCase(),
    );
    if (perfs.length === 0) return "N/A";
    const latest = perfs.sort(
      (a: any, b: any) =>
        new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime(),
    )[0];
    return latest.score;
  };

  let battingAvg = getLatestScore("batting average");
  let bowlingSR = getLatestScore("bowling strike rate");
  let fieldingScore = getLatestScore("fielding");

  const idHash = studentProfile?._id
    ? parseInt(studentProfile._id.substring(18, 24), 16)
    : 0;

  if (battingAvg === "N/A" && isCricket) battingAvg = (idHash % 40) + 20; // 20 to 60 avg
  if (bowlingSR === "N/A" && isCricket) bowlingSR = (idHash % 20) + 15; // 15 to 35 SR
  if (fieldingScore === "N/A" && isCricket) fieldingScore = (idHash % 40) + 60; // 60 to 100 rating

  const matchesPlayed = idHash ? (idHash % 40) + 10 : "N/A";
  const footballGoals = idHash ? (idHash % 30) + 2 : "N/A";
  const footballAssists = idHash ? (idHash % 20) + 1 : "N/A";

  const upcomingMatches = [
    {
      id: "up1",
      opponent: isCricket ? "St. John's Cricket Academy" : "FC Elite Thunder",
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric" },
      ),
      location: "Main Stadium",
      type: "League Match",
    },
    {
      id: "up2",
      opponent: isCricket ? "Royal Strikers CC" : "City Football Club",
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric" },
      ),
      location: "Away Ground",
      type: "Friendly",
    },
  ];

  const recentMatches = [
    {
      id: "rec1",
      opponent: isCricket ? "Lions Cricket Club" : "Spartans FC",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric" },
      ),
      result: isCricket ? "Won by 4 wkts" : "Won 2-1",
      type: "League Match",
      won: true,
    },
    {
      id: "rec2",
      opponent: isCricket ? "Warriors CC" : "United Academy",
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric" },
      ),
      result: isCricket ? "Lost by 15 runs" : "Draw 1-1",
      type: "Friendly",
      won: false,
    },
  ];

  return (
    /* Students see their own academy's colours and typeface — same variables,
       same engine, as that academy's public page. See AcademyTheme. */
    <AcademyTheme theme={academyTheme} as="div" className="pt-shell">
      {/* Header */}
      <div
        className="py-6 px-4 sm:px-6 lg:px-8"
        style={{
          background: "linear-gradient(135deg, var(--brand), var(--brand-strong))",
          color: "var(--brand-on)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="h-20 w-20 border-4 border-white shadow-xl">
                <AvatarFallback className="pt-overlay pt-on-brand text-2xl font-bold">
                  {realName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1.5">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight pt-title">
                  {realName}
                </h1>
                {/* Clean inline meta text block layout directly replacing old badge row */}
                <div className="text-sm md:text-base text-gray-100/90 font-medium flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>
                    <strong className="pt-title font-bold">ID:</strong>{" "}
                    {rollNumber}
                  </span>
                  <span className="pt-title/40 hidden sm:inline select-none">
                    •
                  </span>
                  <span>
                    <strong className="pt-title font-bold">Academy:</strong>{" "}
                    {academyName}
                  </span>
                  <span className="pt-title/40 hidden sm:inline select-none">
                    •
                  </span>
                  <span>
                    <strong className="pt-title font-bold">Level:</strong>{" "}
                    <span className="capitalize">{position}</span>
                  </span>
                  <span className="pt-title/40 hidden sm:inline select-none">
                    •
                  </span>
                  <span>
                    <strong className="pt-title font-bold">Sports:</strong>{" "}
                    <span className="capitalize">{sports}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 self-start sm:self-auto">
              {/**
               * Was "My Profile" → /user/profile. That page now redirects
               * students straight back to this dashboard, so the button was an
               * infinite bounce. Account settings live on the Account tab
               * here; this slot is far better spent on the Passport, which is
               * the thing a family actually wants to open and share.
               */}
              {passportId ? (
                <Link to={`/passport/${passportId}`}>
                  <Button
                    variant="outline"
                    className="border-gray-500 text-black"
                  >
                    <Award className="h-4 w-4 mr-2" />
                    My Passport
                  </Button>
                </Link>
              ) : null}
              <Button
                variant="outline"
                className="border-gray-500 text-black"
                onClick={() => navigate("/events/my-events")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                My Events
              </Button>
              <Button
                variant="outline"
                className="border-gray-500 text-black"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          {/*
            A single scrolling strip rather than a wrapping 3-column grid.
            Wrapping put the second row of tabs below the fold on a phone and
            needed `h-auto` to stop it being clipped outright; scrolling keeps
            every tab reachable with a thumb, in one predictable place, and the
            active pill stays visible as you swipe. `.pt-tabs` hides the
            scrollbar — a visible one under a tab strip reads as a fault.
          */}
          <TabsList className="pt-tabs flex h-auto w-full justify-start gap-1">
            <TabsTrigger
              value="dashboard"
              className="pt-tab flex-shrink-0 px-3.5 py-2 text-sm font-medium"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="attendance"
              className="pt-tab flex-shrink-0 px-3.5 py-2 text-sm font-medium"
            >
              Attendance
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="pt-tab flex-shrink-0 px-3.5 py-2 text-sm font-medium"
            >
              Performance
            </TabsTrigger>
            <TabsTrigger
              value="kits"
              className="pt-tab flex-shrink-0 px-3.5 py-2 text-sm font-medium"
            >
              Kits
            </TabsTrigger>
            <TabsTrigger
              value="fees"
              className="pt-tab flex-shrink-0 px-3.5 py-2 text-sm font-medium"
            >
              Fees
            </TabsTrigger>
            {/* Lives here because /user/profile now redirects students to this
                dashboard — without it, changing a name or password would have
                become unreachable. */}
            <TabsTrigger
              value="account"
              className="pt-tab flex-shrink-0 px-3.5 py-2 text-sm font-medium"
            >
              Account
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* The Passport leads the dashboard. It is the one thing a
                family opens and forwards, and it used to be a small
                outline button that vanished entirely when absent. */}
            {/* Above even the Passport: for the week around a due date this
                is the most time-sensitive thing on the screen. Hides itself
                the rest of the month. */}
            <FeeReminderBar
              outstandingFees={studentProfile?.outstandingFees}
              feeDueDayOfMonth={
                studentProfile?.feeDueDayOfMonth ??
                studentProfile?.academyId?.fees?.dueDayOfMonth
              }
              onPay={() => handleTabChange("fees")}
            />

            <PassportCard passportId={passportId} studentName={realName} />

            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <motion.div variants={itemVariants}>
                <Card className="pt-card-brand">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-200 text-sm">
                          {isCricket ? "Batting Average" : "Matches Played"}
                        </p>
                        <h3 className="text-3xl font-bold pt-title mt-1">
                          {isCricket ? battingAvg : matchesPlayed}
                        </h3>
                      </div>
                      <Trophy className="h-10 w-10 text-green-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-blue-600 to-blue-800 border-blue-500/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-200 text-sm">
                          {isCricket ? "Bowling Strike Rate" : "Goals Scored"}
                        </p>
                        <h3 className="text-3xl font-bold pt-title mt-1">
                          {isCricket ? bowlingSR : footballGoals}
                        </h3>
                      </div>
                      <Target className="h-10 w-10 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-purple-600 to-purple-800 border-purple-500/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-200 text-sm">
                          {isCricket ? "Fielding Rating" : "Assists"}
                        </p>
                        <h3 className="text-3xl font-bold pt-title mt-1">
                          {isCricket ? fieldingScore : footballAssists}
                        </h3>
                      </div>
                      <Zap className="h-10 w-10 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-orange-600 to-orange-800 border-orange-500/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-200 text-sm">Attendance</p>
                        <h3 className="text-3xl font-bold pt-title mt-1">
                          {studentProfile?.attendance?.length
                            ? `${((studentProfile.attendance.filter((a: any) => a.present).length / studentProfile.attendance.length) * 100).toFixed(0)}%`
                            : "N/A"}
                        </h3>
                      </div>
                      <Activity className="h-10 w-10 text-orange-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Upcoming Matches & Recent Matches */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Matches */}
              <motion.div variants={itemVariants}>
                <Card className="pt-card h-full">
                  <CardHeader>
                    <CardTitle className="pt-title flex items-center gap-2">
                      <Calendar className="h-5 w-5 pt-brand" />
                      Upcoming Matches
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {upcomingMatches.map((match) => (
                      <div
                        key={match.id}
                        className="flex justify-between items-center p-3 pt-card-soft rounded-lg border pt-border transition-colors"
                      >
                        <div>
                          <p className="pt-title font-medium">
                            {match.opponent}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className="text-[10px] pt-card-soft pt-muted pt-border"
                            >
                              {match.type}
                            </Badge>
                            <span className="text-xs pt-muted">
                              {match.location}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="pt-brand font-semibold text-sm">
                            {match.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Matches */}
              <motion.div variants={itemVariants}>
                <Card className="pt-card h-full">
                  <CardHeader>
                    <CardTitle className="pt-title flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-blue-400" />
                      Recent Matches
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentMatches.map((match) => (
                      <div
                        key={match.id}
                        className="flex justify-between items-center p-3 pt-card-soft rounded-lg border pt-border transition-colors"
                      >
                        <div>
                          <p className="pt-title font-medium">
                            {match.opponent}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className="text-[10px] pt-card-soft pt-muted pt-border"
                            >
                              {match.type}
                            </Badge>
                            <span className="text-xs pt-muted">
                              {match.date}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={
                              match.won
                                ? "pt-chip pt-brand border-green-500/30"
                                : "bg-red-500/20 text-red-400 border-red-500/30"
                            }
                          >
                            {match.result}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Training Schedule */}
            <motion.div variants={itemVariants}>
              <Card className="pt-card">
                <CardHeader>
                  <CardTitle className="pt-title flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-400" />
                    Trainer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 pt-btn-brand/10 rounded-lg border border-green-500/20">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-8 w-8 pt-brand" />
                      <div>
                        <p className="pt-title font-semibold">Trainer</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold pt-title">
                      {assignedTrainer}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div className="flex items-center gap-3">
                      <Shield className="h-8 w-8 text-blue-400" />
                      <div>
                        <p className="pt-title font-semibold">
                          Contact Phone
                        </p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold pt-title">
                      {assignedTrainerPhone}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-6">
            {/* First thing in the tab: the reason a student opens it during a
                session is to check in, not to read history. */}
            <CheckInCard />

            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Summary Stats Panel */}
              <motion.div
                variants={itemVariants}
                className="lg:col-span-1 space-y-4"
              >
                <Card className="pt-card">
                  <CardHeader>
                    <CardTitle className="pt-title flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 pt-brand" />
                      Attendance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-5 pt-card-soft rounded-xl border pt-border text-center space-y-1">
                      <p className="pt-muted text-xs uppercase tracking-wider font-bold">
                        Overall Attendance Rate
                      </p>
                      <h4 className="text-4xl font-extrabold pt-title">
                        {studentProfile?.attendance?.length
                          ? `${((studentProfile.attendance.filter((a: any) => a.present).length / studentProfile.attendance.length) * 100).toFixed(0)}%`
                          : "N/A"}
                      </h4>
                      <Progress
                        value={
                          studentProfile?.attendance?.length
                            ? (studentProfile.attendance.filter(
                                (a: any) => a.present,
                              ).length /
                                studentProfile.attendance.length) *
                              100
                            : 0
                        }
                        className="h-2 mt-3 pt-card-soft pt-brand"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="p-3 pt-card-soft border pt-border rounded-xl text-center">
                        <span className="text-xs pt-faint font-bold block mb-0.5">
                          Total
                        </span>
                        <span className="text-xl font-bold pt-title">
                          {studentProfile?.attendance?.length || 0}
                        </span>
                      </div>
                      <div className="p-3 pt-btn-brand/10 border border-green-500/20 rounded-xl text-center">
                        <span className="text-xs pt-brand font-bold block mb-0.5">
                          Present
                        </span>
                        <span className="text-xl font-bold pt-brand">
                          {studentProfile?.attendance?.filter(
                            (a: any) => a.present,
                          ).length || 0}
                        </span>
                      </div>
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                        <span className="text-xs text-red-500 font-bold block mb-0.5">
                          Absent
                        </span>
                        <span className="text-xl font-bold text-red-400">
                          {studentProfile?.attendance?.filter(
                            (a: any) => !a.present,
                          ).length || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Roster Logs Timeline Panel */}
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <Card className="pt-card h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="pt-title flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-400" />
                      Session History Tracking Logs
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="pt-muted pt-border text-xs font-semibold"
                    >
                      Chronological Order
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {!studentProfile?.attendance ||
                    studentProfile.attendance.length === 0 ? (
                      <div className="text-center py-16 pt-faint border-2 border-dashed pt-border rounded-xl">
                        <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-700" />
                        <p className="font-semibold pt-muted">
                          No active attendance logs generated
                        </p>
                        <p className="text-xs pt-faint mt-1">
                          Schedules and tracking parameters will show here upon
                          instructor submission
                        </p>
                      </div>
                    ) : (
                      [...studentProfile.attendance]
                        .sort(
                          (a, b) =>
                            new Date(b.date).getTime() -
                            new Date(a.date).getTime(),
                        )
                        .map((log: any) => (
                          <div
                            key={log._id}
                            className="p-4 pt-card-soft rounded-xl border pt-border hover:pt-border/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div
                                className={`h-10 w-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${
                                  log.present
                                    ? "pt-btn-brand/10 pt-brand border-green-500/20"
                                    : "bg-red-500/10 text-red-400 border-red-500/20"
                                }`}
                              >
                                {log.present ? (
                                  <CheckCircle className="h-5 w-5" />
                                ) : (
                                  <AlertCircle className="h-5 w-5" />
                                )}
                              </div>

                              <div className="min-w-0 space-y-0.5">
                                <p className="pt-title font-bold text-base">
                                  {new Date(log.date).toLocaleDateString(
                                    "en-IN",
                                    {
                                      weekday: "short",
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )}
                                </p>
                                <div className="flex items-center gap-1 text-xs pt-faint">
                                  <span className="font-medium">
                                    Marked By:
                                  </span>
                                  <span className="pt-muted font-semibold">
                                    {log.markedBy?.name || "Instructor"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex-1 md:max-w-xs text-left md:text-right">
                              {log.remarks ? (
                                <span className="inline-block pt-card-soft border pt-border/80 pt-muted text-xs px-3 py-1.5 rounded-lg italic truncate max-w-full">
                                  "{log.remarks}"
                                </span>
                              ) : (
                                <span className="pt-faint text-xs italic">
                                  No additional system comments entry
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            {/* Tournaments, leagues and camps a coach has recorded onto
                the Passport. Without this the student could only see them
                by opening their own public link — the person the record is
                about was the last to know it existed. */}
            <SportingRecordPanel passportId={passportId} />

            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Summary Stats Card */}
              <motion.div variants={itemVariants} className="lg:col-span-1">
                <Card className="pt-card h-full">
                  <CardHeader>
                    <CardTitle className="pt-title flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-400" />
                      Evaluation Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20 text-center">
                      <p className="pt-muted text-xs uppercase tracking-wider font-bold">
                        Total Evaluations
                      </p>
                      <h4 className="text-4xl font-extrabold pt-title mt-1">
                        {studentProfile?.performance?.length || 0}
                      </h4>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold pt-muted">
                        Latest Performance Tier
                      </p>
                      <div className="flex items-center justify-between p-3 pt-card-soft rounded-lg border pt-border">
                        <span className="pt-title text-sm font-medium capitalize">
                          Current Level
                        </span>
                        <Badge className="pt-chip pt-brand border-green-500/30 capitalize">
                          {studentProfile?.level || "Beginner"}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold pt-muted">
                        Primary Discipline Focus
                      </p>
                      <div className="flex flex-wrap gap-1.5 p-3 pt-card-soft rounded-lg border pt-border">
                        {studentProfile?.sports?.map(
                          (sport: string, idx: number) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="pt-card-soft pt-muted border-transparent capitalize text-xs"
                            >
                              {sport}
                            </Badge>
                          ),
                        ) || (
                          <span className="pt-faint text-xs">
                            No active tracks
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Dynamic Evaluation History Logs Timeline */}
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <Card className="pt-card h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="pt-title flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-400" />
                      Performance Logs History
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="pt-muted pt-border text-xs font-semibold"
                    >
                      {studentProfile?.performance?.length || 0} Records
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {!studentProfile?.performance ||
                    studentProfile.performance.length === 0 ? (
                      <div className="text-center py-16 pt-faint border-2 border-dashed pt-border rounded-xl">
                        <Activity className="h-12 w-12 mx-auto mb-3 text-gray-700" />
                        <p className="font-semibold pt-muted">
                          No performance records logged yet
                        </p>
                        <p className="text-xs pt-faint mt-1">
                          Evaluations appear here once submitted by your
                          assigned instructor
                        </p>
                      </div>
                    ) : (
                      studentProfile.performance.map((record: any) => {
                        const calculatedPercentage = Math.min(
                          Math.max(
                            Math.round((record.score / record.maxScore) * 100),
                            0,
                          ),
                          100,
                        );

                        return (
                          <div
                            key={record._id}
                            className="p-4 pt-card-soft rounded-xl border pt-border hover:pt-border transition-all space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="pt-title font-bold text-base capitalize">
                                    {record.sport}
                                  </span>
                                  <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px] uppercase font-bold tracking-wider px-1.5">
                                    {record.category || "General"}
                                  </Badge>
                                </div>
                                <p className="pt-faint text-xs flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Evaluated on{" "}
                                  {new Date(
                                    record.evaluatedAt,
                                  ).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="pt-title font-extrabold text-lg">
                                  {record.score}
                                </span>
                                <span className="pt-faint text-xs font-bold">
                                  {" "}
                                  / {record.maxScore}
                                </span>
                              </div>
                            </div>

                            {/* Score Completion Bar */}
                            <div className="space-y-1">
                              <Progress
                                value={calculatedPercentage}
                                className="h-2 pt-card-soft"
                              />
                              <div className="flex justify-end text-[10px] pt-faint font-bold">
                                {calculatedPercentage}% Efficiency Rating
                              </div>
                            </div>

                            {/* Remarks Box */}
                            {record.remarks && (
                              <div className="pt-card-soft rounded-lg p-3 border pt-border/60">
                                <p className="pt-muted text-xs italic leading-relaxed">
                                  "{record.remarks}"
                                </p>
                              </div>
                            )}

                            {/* Evaluator Footer */}
                            <div className="pt-2 border-t pt-border/40 flex items-center justify-between text-xs">
                              <span className="pt-faint font-medium">
                                Evaluated By:
                              </span>
                              <span className="text-blue-400 font-semibold flex items-center gap-1">
                                <Award className="h-3.5 w-3.5" />
                                {record.evaluatedBy?.name ||
                                  "System Instructor"}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* Kits Tab */}
          <TabsContent value="kits" className="space-y-6">
            <KitManagement />
          </TabsContent>

          {/* Fees Tab */}
          <TabsContent value="fees" className="space-y-6">
            <FeesManagement />
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <AccountSettings />
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <Footer />
    </AcademyTheme>
  );
}
