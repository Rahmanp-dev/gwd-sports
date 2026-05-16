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
  const avatarSafe = "/api/placeholder/150/150";

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-4 border-white">
                <AvatarImage src={avatarSafe} />
                <AvatarFallback className="bg-gradient-to-br from-green-600 to-blue-600 text-white text-xl font-bold">
                  {realName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {realName}
                </h1>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge className="bg-white/20 text-white border-white/30">
                    ID: {rollNumber}
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30">
                    Academy: {academyName}
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30">
                    Level: {position}
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30">
                    Sports: {sports}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex md:flex gap-2">
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
            {/* <TabsTrigger
              value="achievements"
              className="data-[state=active]:bg-green-600"
            >
              Achievements
            </TabsTrigger> */}
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
                        <p className="text-green-200 text-sm">Matches Played</p>
                        <h3 className="text-3xl font-bold text-white mt-1">
                          N/A
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
                        <p className="text-blue-200 text-sm">Goals Scored</p>
                        <h3 className="text-3xl font-bold text-white mt-1">
                          N/A
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
                        <p className="text-purple-200 text-sm">Assists</p>
                        <h3 className="text-3xl font-bold text-white mt-1">
                          N/A
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
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-green-400" />
                      Upcoming Matches
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-400 text-sm">No upcoming matches scheduled.</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Matches */}
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-blue-400" />
                      Recent Matches
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-400 text-sm">No recent matches.</p>
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
                          <p className="text-white font-semibold">
                            Clean Sheets
                          </p>
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
            gg
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Goals Scored</span>
                        <span className="text-white font-semibold">
                          {/* {studentData.stats.goalsScored} */}
                        </span>
                      </div>
                      <Progress value={53} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Assists</span>
                        <span className="text-white font-semibold">
                          {/* {studentData.stats.assists} */}
                        </span>
                      </div>
                      <Progress value={80} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Attendance Rate</span>
                        <span className="text-white font-semibold">
                          {/* {studentData.stats.attendance}% */}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Skill Rating</span>
                        <span className="text-white font-semibold flex items-center gap-1">
                          {/* {studentData.stats.skillRating} */}
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        </span>
                      </div>
                      <Progress value={90} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Season Highlights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <div className="flex items-center gap-3">
                        <Trophy className="h-8 w-8 text-green-400" />
                        <div>
                          <p className="text-white font-semibold">Total Wins</p>
                          <p className="text-sm text-gray-400">This Season</p>
                        </div>
                      </div>
                      <span className="text-3xl font-bold text-white">12</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <div className="flex items-center gap-3">
                        <Shield className="h-8 w-8 text-blue-400" />
                        <div>
                          <p className="text-white font-semibold">
                            Clean Sheets
                          </p>
                          <p className="text-sm text-gray-400">
                            Defensive Record
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-purple-400" />
                        <div>
                          <p className="text-white font-semibold">Win Rate</p>
                          <p className="text-sm text-gray-400">
                            Success Percentage
                          </p>
                        </div>
                      </div>
                      <span className="text-3xl font-bold text-white">80%</span>
                    </div>
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
