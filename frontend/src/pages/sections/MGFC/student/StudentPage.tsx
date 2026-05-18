import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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

  const assignedTrainer = studentProfile?.trainers?.[0]?.name || "Not Assigned";
  const assignedTrainerPhone = studentProfile?.trainers?.[0]?.phone || "Not Assigned";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        const res = await fetch("http://localhost:3000/api/student/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success && data.data?.studentProfile) {
          setStudentProfile(data.data.studentProfile);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setProfileLoading(false);
      }
    };
    if (token) fetchProfile();
  }, [token]);

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
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center text-white">
        <div className="flex flex-col items-center">
          <Activity className="h-10 w-10 text-green-500 animate-spin mb-4" />
          <p>Loading Profile...</p>
        </div>
      </div>
    );
  }

  const realName = user?.name || "Student";
  const rollNumber = studentProfile?._id?.substring(0, 8).toUpperCase() || "N/A";
  const academyName = studentProfile?.academyId?.name || "Not in any academy";
  const position = studentProfile?.level || "beginner";
  const sports = studentProfile?.sports?.join(", ") || "None";
  const isCricket = studentProfile?.sports?.some((s: string) => s.toLowerCase() === 'cricket');

  // Fetch real metrics or fallback to deterministic random numbers for general stats
  const getLatestScore = (category: string) => {
    if (!studentProfile?.performance) return "N/A";
    const perfs = studentProfile.performance.filter((p: any) => p.category.toLowerCase() === category.toLowerCase());
    if (perfs.length === 0) return "N/A";
    const latest = perfs.sort((a: any, b: any) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime())[0];
    return latest.score;
  };

  let battingAvg = getLatestScore("batting average");
  let bowlingSR = getLatestScore("bowling strike rate");
  let fieldingScore = getLatestScore("fielding");

  const idHash = studentProfile?._id ? parseInt(studentProfile._id.substring(18, 24), 16) : 0;
  
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
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      location: "Main Stadium",
      type: "League Match"
    },
    {
      id: "up2",
      opponent: isCricket ? "Royal Strikers CC" : "City Football Club",
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      location: "Away Ground",
      type: "Friendly"
    }
  ];

  const recentMatches = [
    {
      id: "rec1",
      opponent: isCricket ? "Lions Cricket Club" : "Spartans FC",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      result: isCricket ? "Won by 4 wkts" : "Won 2-1",
      type: "League Match",
      won: true
    },
    {
      id: "rec2",
      opponent: isCricket ? "Warriors CC" : "United Academy",
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      result: isCricket ? "Lost by 15 runs" : "Draw 1-1",
      type: "Friendly",
      won: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="h-20 w-20 border-4 border-white shadow-xl">
                <AvatarFallback className="bg-gradient-to-br from-green-600 to-blue-600 text-white text-2xl font-bold">
                  {realName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1.5">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                  {realName}
                </h1>
                {/* Clean inline meta text block layout directly replacing old badge row */}
                <div className="text-sm md:text-base text-gray-100/90 font-medium flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>
                    <strong className="text-white font-bold">ID:</strong> {rollNumber}
                  </span>
                  <span className="text-white/40 hidden sm:inline select-none">•</span>
                  <span>
                    <strong className="text-white font-bold">Academy:</strong> {academyName}
                  </span>
                  <span className="text-white/40 hidden sm:inline select-none">•</span>
                  <span>
                    <strong className="text-white font-bold">Level:</strong> <span className="capitalize">{position}</span>
                  </span>
                  <span className="text-white/40 hidden sm:inline select-none">•</span>
                  <span>
                    <strong className="text-white font-bold">Sports:</strong> <span className="capitalize">{sports}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 self-start sm:self-auto">
              <Link to="/user/profile">
                <Button
                  variant="outline"
                  className="border-gray-500 text-black hover:bg-gray-200"
                >
                  <Users className="h-4 w-4 mr-2" />
                  My Profile
                </Button>
              </Link>
              <Button
                variant="outline"
                className="border-gray-500 text-black hover:bg-gray-200"
                onClick={() => navigate("/events/my-events")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                My Events
              </Button>
              <Button
                variant="outline"
                className="border-gray-500 text-black hover:bg-gray-200"
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
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 bg-gray-800 border border-gray-700">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-green-600"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="attendance"
              className="data-[state=active]:bg-green-600"
            >
              Attendance
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="data-[state=active]:bg-green-600"
            >
              Performance
            </TabsTrigger>
            <TabsTrigger
              value="kits"
              className="data-[state=active]:bg-green-600"
            >
              Kits
            </TabsTrigger>
            <TabsTrigger
              value="fees"
              className="data-[state=active]:bg-green-600"
            >
              Fees
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-green-600 to-green-800 border-green-500/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-200 text-sm">{isCricket ? "Batting Average" : "Matches Played"}</p>
                        <h3 className="text-3xl font-bold text-white mt-1">
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
                        <p className="text-blue-200 text-sm">{isCricket ? "Bowling Strike Rate" : "Goals Scored"}</p>
                        <h3 className="text-3xl font-bold text-white mt-1">
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
                        <p className="text-purple-200 text-sm">{isCricket ? "Fielding Rating" : "Assists"}</p>
                        <h3 className="text-3xl font-bold text-white mt-1">
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
                        <h3 className="text-3xl font-bold text-white mt-1">
                          {studentProfile?.attendance?.length ? `${(studentProfile.attendance.filter((a: any) => a.present).length / studentProfile.attendance.length * 100).toFixed(0)}%` : "N/A"}
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
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 h-full">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-green-400" />
                      Upcoming Matches
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {upcomingMatches.map(match => (
                      <div key={match.id} className="flex justify-between items-center p-3 bg-gray-800/80 rounded-lg border border-gray-700/50 hover:bg-gray-700 transition-colors">
                        <div>
                          <p className="text-white font-medium">{match.opponent}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] bg-gray-900 text-gray-300 border-gray-600">{match.type}</Badge>
                            <span className="text-xs text-gray-400">{match.location}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-semibold text-sm">{match.date}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Matches */}
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 h-full">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-blue-400" />
                      Recent Matches
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentMatches.map(match => (
                      <div key={match.id} className="flex justify-between items-center p-3 bg-gray-800/80 rounded-lg border border-gray-700/50 hover:bg-gray-700 transition-colors">
                        <div>
                          <p className="text-white font-medium">{match.opponent}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] bg-gray-900 text-gray-300 border-gray-600">{match.type}</Badge>
                            <span className="text-xs text-gray-400">{match.date}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={match.won ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}>
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
              <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-400" />
                    Trainer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-8 w-8 text-green-400" />
                      <div>
                        <p className="text-white font-semibold">Trainer</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-white">{assignedTrainer}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div className="flex items-center gap-3">
                      <Shield className="h-8 w-8 text-blue-400" />
                      <div>
                        <p className="text-white font-semibold">Contact Phone</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-white">{assignedTrainerPhone}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Summary Stats Panel */}
              <motion.div variants={itemVariants} className="lg:col-span-1 space-y-4">
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-green-400" />
                      Attendance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-5 bg-gray-950/40 rounded-xl border border-gray-800 text-center space-y-1">
                      <p className="text-gray-400 text-xs uppercase tracking-wider font-bold">Overall Attendance Rate</p>
                      <h4 className="text-4xl font-extrabold text-white">
                        {studentProfile?.attendance?.length 
                          ? `${((studentProfile.attendance.filter((a: any) => a.present).length / studentProfile.attendance.length) * 100).toFixed(0)}%` 
                          : "N/A"}
                      </h4>
                      <Progress 
                        value={studentProfile?.attendance?.length ? (studentProfile.attendance.filter((a: any) => a.present).length / studentProfile.attendance.length) * 100 : 0} 
                        className="h-2 mt-3 bg-gray-800 text-green-500"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl text-center">
                        <span className="text-xs text-gray-500 font-bold block mb-0.5">Total</span>
                        <span className="text-xl font-bold text-white">{studentProfile?.attendance?.length || 0}</span>
                      </div>
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                        <span className="text-xs text-green-500 font-bold block mb-0.5">Present</span>
                        <span className="text-xl font-bold text-green-400">
                          {studentProfile?.attendance?.filter((a: any) => a.present).length || 0}
                        </span>
                      </div>
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                        <span className="text-xs text-red-500 font-bold block mb-0.5">Absent</span>
                        <span className="text-xl font-bold text-red-400">
                          {studentProfile?.attendance?.filter((a: any) => !a.present).length || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Roster Logs Timeline Panel */}
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-400" />
                      Session History Tracking Logs
                    </CardTitle>
                    <Badge variant="outline" className="text-gray-400 border-gray-700 text-xs font-semibold">
                      Chronological Order
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {!studentProfile?.attendance || studentProfile.attendance.length === 0 ? (
                      <div className="text-center py-16 text-gray-500 border-2 border-dashed border-gray-800 rounded-xl">
                        <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-700" />
                        <p className="font-semibold text-gray-400">No active attendance logs generated</p>
                        <p className="text-xs text-gray-500 mt-1">Schedules and tracking parameters will show here upon instructor submission</p>
                      </div>
                    ) : (
                      [...studentProfile.attendance]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((log: any) => (
                          <div 
                            key={log._id}
                            className="p-4 bg-gray-900/40 rounded-xl border border-gray-800 hover:border-gray-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${
                                log.present 
                                  ? "bg-green-500/10 text-green-400 border-green-500/20" 
                                  : "bg-red-500/10 text-red-400 border-red-500/20"
                              }`}>
                                {log.present ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                              </div>

                              <div className="min-w-0 space-y-0.5">
                                <p className="text-white font-bold text-base">
                                  {new Date(log.date).toLocaleDateString("en-IN", {
                                    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                                  })}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <span className="font-medium">Marked By:</span>
                                  <span className="text-gray-400 font-semibold">{log.markedBy?.name || "Instructor"}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex-1 md:max-w-xs text-left md:text-right">
                              {log.remarks ? (
                                <span className="inline-block bg-gray-950/40 border border-gray-800/80 text-gray-400 text-xs px-3 py-1.5 rounded-lg italic truncate max-w-full">
                                  "{log.remarks}"
                                </span>
                              ) : (
                                <span className="text-gray-600 text-xs italic">No additional system comments entry</span>
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
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Summary Stats Card */}
              <motion.div variants={itemVariants} className="lg:col-span-1">
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 h-full">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-400" />
                      Evaluation Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20 text-center">
                      <p className="text-gray-400 text-xs uppercase tracking-wider font-bold">Total Evaluations</p>
                      <h4 className="text-4xl font-extrabold text-white mt-1">
                        {studentProfile?.performance?.length || 0}
                      </h4>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-400">Latest Performance Tier</p>
                      <div className="flex items-center justify-between p-3 bg-gray-900/40 rounded-lg border border-gray-800">
                        <span className="text-white text-sm font-medium capitalize">Current Level</span>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 capitalize">
                          {studentProfile?.level || "Beginner"}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-400">Primary Discipline Focus</p>
                      <div className="flex flex-wrap gap-1.5 p-3 bg-gray-900/40 rounded-lg border border-gray-800">
                        {studentProfile?.sports?.map((sport: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="bg-gray-800 text-gray-300 border-transparent capitalize text-xs">
                            {sport}
                          </Badge>
                        )) || <span className="text-gray-500 text-xs">No active tracks</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Dynamic Evaluation History Logs Timeline */}
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-400" />
                      Performance Logs History
                    </CardTitle>
                    <Badge variant="outline" className="text-gray-400 border-gray-700 text-xs font-semibold">
                      {studentProfile?.performance?.length || 0} Records
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {!studentProfile?.performance || studentProfile.performance.length === 0 ? (
                      <div className="text-center py-16 text-gray-500 border-2 border-dashed border-gray-800 rounded-xl">
                        <Activity className="h-12 w-12 mx-auto mb-3 text-gray-700" />
                        <p className="font-semibold text-gray-400">No performance records logged yet</p>
                        <p className="text-xs text-gray-500 mt-1">Evaluations appear here once submitted by your assigned instructor</p>
                      </div>
                    ) : (
                      studentProfile.performance.map((record: any) => {
                        const calculatedPercentage = Math.min(
                          Math.max(Math.round((record.score / record.maxScore) * 100), 0), 
                          100
                        );
                        
                        return (
                          <div 
                            key={record._id}
                            className="p-4 bg-gray-900/40 rounded-xl border border-gray-800 hover:border-gray-700 transition-all space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-white font-bold text-base capitalize">{record.sport}</span>
                                  <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px] uppercase font-bold tracking-wider px-1.5">
                                    {record.category || "General"}
                                  </Badge>
                                </div>
                                <p className="text-gray-500 text-xs flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Evaluated on {new Date(record.evaluatedAt).toLocaleDateString("en-IN", {
                                    day: "numeric", month: "short", year: "numeric"
                                  })}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-white font-extrabold text-lg">{record.score}</span>
                                <span className="text-gray-500 text-xs font-bold"> / {record.maxScore}</span>
                              </div>
                            </div>

                            {/* Score Completion Bar */}
                            <div className="space-y-1">
                              <Progress value={calculatedPercentage} className="h-2 bg-gray-800" />
                              <div className="flex justify-end text-[10px] text-gray-500 font-bold">
                                {calculatedPercentage}% Efficiency Rating
                              </div>
                            </div>

                            {/* Remarks Box */}
                            {record.remarks && (
                              <div className="bg-gray-950/50 rounded-lg p-3 border border-gray-800/60">
                                <p className="text-gray-400 text-xs italic leading-relaxed">
                                  "{record.remarks}"
                                </p>
                              </div>
                            )}

                            {/* Evaluator Footer */}
                            <div className="pt-2 border-t border-gray-800/40 flex items-center justify-between text-xs">
                              <span className="text-gray-500 font-medium">Evaluated By:</span>
                              <span className="text-blue-400 font-semibold flex items-center gap-1">
                                <Award className="h-3.5 w-3.5" />
                                {record.evaluatedBy?.name || "System Instructor"}
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

        </Tabs>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}