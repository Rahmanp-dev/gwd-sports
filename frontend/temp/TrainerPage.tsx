import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authService } from "@/services/authService";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout, setUser } from "@/store/slices/authSlice";
import {
  Calendar,
  Users,
  ClipboardList,
  TrendingUp,
  Activity,
  Award,
  Clock,
  MapPin,
  Search,
  Plus,
  Edit,
  FileText,
  BarChart3,
  Target,
  Dumbbell,
  Heart,
  Zap,
  Trophy,
  MessageSquare,
  Bell,
  Settings,
  Download,
  Upload,
  LogOut,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Filter,
} from "lucide-react";
import Footer from "@/components/landing/Footer";
import { toast } from "sonner";

export default function MGFCTrainerPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  // Mock trainer data
  const trainerData = {
    name: "Coach Rajesh Kumar",
    employeeId: "MGFC-TR-001",
    specialization: "Tactical & Technical Training",
    experience: "12 years",
    avatar: "/api/placeholder/150/150",
    certifications: [
      "UEFA B License",
      "Sports Science Degree",
      "First Aid Certified",
    ],
    stats: {
      totalPlayers: 45,
      activeTeams: 3,
      sessionsThisWeek: 12,
      attendanceRate: 92,
      avgPlayerImprovement: 15,
    },
    teams: [
      {
        name: "Blue Dragons",
        players: 15,
        class: "9th & 10th",
        nextSession: "Today, 4:00 PM",
        performance: "Excellent",
      },
      {
        name: "Red Eagles",
        players: 15,
        class: "7th & 8th",
        nextSession: "Tomorrow, 4:00 PM",
        performance: "Good",
      },
      {
        name: "Green Strikers",
        players: 15,
        class: "5th & 6th",
        nextSession: "Friday, 3:30 PM",
        performance: "Average",
      },
    ],
    todaySessions: [
      {
        team: "Blue Dragons",
        time: "4:00 PM - 6:00 PM",
        focus: "Tactical Formation",
        venue: "Main Ground",
        attendees: 14,
        totalPlayers: 15,
      },
      {
        team: "Junior Squad",
        time: "6:30 PM - 7:30 PM",
        focus: "Basic Skills",
        venue: "Practice Field",
        attendees: 12,
        totalPlayers: 12,
      },
    ],
    recentPlayers: [
      {
        name: "Rahul Sharma",
        rollNo: "MG2024001",
        position: "Midfielder",
        attendance: 95,
        performance: "Excellent",
        recentProgress: "+12%",
      },
      {
        name: "Arjun Patel",
        rollNo: "MG2024002",
        position: "Forward",
        attendance: 90,
        performance: "Good",
        recentProgress: "+8%",
      },
      {
        name: "Vikram Singh",
        rollNo: "MG2024003",
        position: "Defender",
        attendance: 88,
        performance: "Good",
        recentProgress: "+10%",
      },
      {
        name: "Aditya Gupta",
        rollNo: "MG2024004",
        position: "Goalkeeper",
        attendance: 92,
        performance: "Very Good",
        recentProgress: "+15%",
      },
    ],
    upcomingMatches: [
      {
        team: "Blue Dragons",
        opponent: "Red Eagles",
        date: "Nov 15, 2024",
        time: "4:00 PM",
        venue: "Main Ground",
        type: "League Match",
        status: "Confirmed",
      },
      {
        team: "Green Strikers",
        opponent: "City School FC",
        date: "Nov 18, 2024",
        time: "3:30 PM",
        venue: "City Stadium",
        type: "Friendly",
        status: "Confirmed",
      },
      {
        team: "Red Eagles",
        opponent: "State Champions",
        date: "Nov 22, 2024",
        time: "5:00 PM",
        venue: "State Ground",
        type: "Cup Match",
        status: "Pending",
      },
    ],
    trainingPlans: [
      {
        id: 1,
        title: "Pre-Season Conditioning",
        duration: "4 weeks",
        teams: ["All Teams"],
        status: "Active",
        completion: 65,
      },
      {
        id: 2,
        title: "Tactical Formation Training",
        duration: "2 weeks",
        teams: ["Blue Dragons", "Red Eagles"],
        status: "Active",
        completion: 40,
      },
      {
        id: 3,
        title: "Set-Piece Mastery",
        duration: "1 week",
        teams: ["Blue Dragons"],
        status: "Scheduled",
        completion: 0,
      },
    ],
    notifications: [
      {
        type: "urgent",
        message: "Medical clearance pending for 3 players",
        time: "2 hours ago",
      },
      {
        type: "info",
        message: "New training equipment arrived",
        time: "5 hours ago",
      },
      {
        type: "success",
        message: "Blue Dragons won the match 3-1",
        time: "1 day ago",
      },
    ],
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-green-600 to-blue-600 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-4 border-white">
                <AvatarImage src={trainerData.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-green-600 text-white text-xl font-bold">
                  {trainerData.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {trainerData.name}
                </h1>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge className="bg-white/20 text-white border-white/30">
                    {trainerData.employeeId}
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30">
                    {trainerData.specialization}
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30">
                    {trainerData.experience} Experience
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
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
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 bg-gray-800 border border-gray-700">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-blue-600"
            >
              Students
            </TabsTrigger>
            <TabsTrigger
              value="teams"
              className="data-[state=active]:bg-blue-600"
            >
              Attendance
            </TabsTrigger>
            <TabsTrigger
              value="training"
              className="data-[state=active]:bg-blue-600"
            >
              Performance
            </TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
            >
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-blue-600 to-blue-800 border-blue-500/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-200 text-sm">Total Players</p>
                        <h3 className="text-3xl font-bold text-white mt-1">
                          {trainerData.stats.totalPlayers}
                        </h3>
                      </div>
                      <Users className="h-10 w-10 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-green-600 to-green-800 border-green-500/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-200 text-sm">Active Teams</p>
                        <h3 className="text-3xl font-bold text-white mt-1">
                          {trainerData.stats.activeTeams}
                        </h3>
                      </div>
                      <Trophy className="h-10 w-10 text-green-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-purple-600 to-purple-800 border-purple-500/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-200 text-sm">Sessions/Week</p>
                        <h3 className="text-3xl font-bold text-white mt-1">
                          {trainerData.stats.sessionsThisWeek}
                        </h3>
                      </div>
                      <Activity className="h-10 w-10 text-purple-200" />
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
                          {trainerData.stats.attendanceRate}%
                        </h3>
                      </div>
                      <CheckCircle className="h-10 w-10 text-orange-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-pink-600 to-pink-800 border-pink-500/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-pink-200 text-sm">Improvement</p>
                        <h3 className="text-3xl font-bold text-white mt-1">
                          +{trainerData.stats.avgPlayerImprovement}%
                        </h3>
                      </div>
                      <TrendingUp className="h-10 w-10 text-pink-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Today's Sessions & Notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Today's Sessions */}
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-400" />
                      Today's Training Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {trainerData.todaySessions.map((session, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-blue-500/50 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="text-white font-semibold text-lg">
                              {session.team}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                              <Clock className="h-4 w-4" />
                              {session.time}
                            </div>
                          </div>
                          <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                            Today
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Target className="h-4 w-4 text-purple-400" />
                            <span>{session.focus}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <MapPin className="h-4 w-4 text-green-400" />
                            <span>{session.venue}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">
                              Attendance:
                            </span>
                            <span className="text-white font-semibold">
                              {session.attendees}/{session.totalPlayers}
                            </span>
                          </div>
                          <Progress
                            value={
                              (session.attendees / session.totalPlayers) * 100
                            }
                            className="h-2 mt-2"
                          />
                        </div>
                      </div>
                    ))}
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-green-600">
                      <Plus className="mr-2 h-4 w-4" />
                      Schedule New Session
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Notifications */}
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Bell className="h-5 w-5 text-orange-400" />
                      Recent Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {trainerData.notifications.map((notification, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          notification.type === "urgent"
                            ? "bg-red-500/10 border-red-500/20"
                            : notification.type === "success"
                              ? "bg-green-500/10 border-green-500/20"
                              : "bg-blue-500/10 border-blue-500/20"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {notification.type === "urgent" ? (
                            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                          ) : notification.type === "success" ? (
                            <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Bell className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="text-white text-sm">
                              {notification.message}
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      className="w-full border-gray-700"
                    >
                      View All Notifications
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Teams Overview & Training Plans */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Teams Overview */}
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-400" />
                      My Teams
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {trainerData.teams.map((team, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-green-500/50 transition-all"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-white font-semibold">
                              {team.name}
                            </h4>
                            <p className="text-sm text-gray-400">
                              {team.class}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`${
                              team.performance === "Excellent"
                                ? "text-green-400 border-green-500/50"
                                : team.performance === "Good"
                                  ? "text-blue-400 border-blue-500/50"
                                  : "text-yellow-400 border-yellow-500/50"
                            }`}
                          >
                            {team.performance}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Users className="h-4 w-4" />
                            {team.players} Players
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Clock className="h-4 w-4" />
                            {team.nextSession}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Training Plans */}
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-purple-400" />
                      Active Training Plans
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {trainerData.trainingPlans.map((plan) => (
                      <div
                        key={plan.id}
                        className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-semibold">
                            {plan.title}
                          </h4>
                          <Badge
                            className={`${
                              plan.status === "Active"
                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            }`}
                          >
                            {plan.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">
                          Duration: {plan.duration} • {plan.teams.join(", ")}
                        </p>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Progress</span>
                            <span className="text-white font-semibold">
                              {plan.completion}%
                            </span>
                          </div>
                          <Progress value={plan.completion} className="h-2" />
                        </div>
                      </div>
                    ))}
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Training Plan
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Upcoming Matches */}
            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    Upcoming Matches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {trainerData.upcomingMatches.map((match, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-yellow-500/50 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="text-white font-semibold">
                              {match.team}
                            </h4>
                            <p className="text-sm text-gray-400">
                              vs {match.opponent}
                            </p>
                          </div>
                          <Badge
                            className={`${
                              match.status === "Confirmed"
                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            }`}
                          >
                            {match.status}
                          </Badge>
                        </div>
                        <Badge className="mb-2 bg-blue-500/10 text-blue-400 border-blue-500/20">
                          {match.type}
                        </Badge>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Calendar className="h-4 w-4" />
                            {match.date}
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Clock className="h-4 w-4" />
                            {match.time}
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <MapPin className="h-4 w-4" />
                            {match.venue}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="space-y-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {trainerData.teams.map((team, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-green-500/50 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-1">
                            {team.name}
                          </h3>
                          <p className="text-gray-400">{team.class}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`${
                            team.performance === "Excellent"
                              ? "text-green-400 border-green-500/50"
                              : team.performance === "Good"
                                ? "text-blue-400 border-blue-500/50"
                                : "text-yellow-400 border-yellow-500/50"
                          }`}
                        >
                          {team.performance}
                        </Badge>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Users className="h-5 w-5" />
                            <span>Total Players</span>
                          </div>
                          <span className="text-white font-bold text-xl">
                            {team.players}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-400 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <Clock className="h-5 w-5 text-blue-400" />
                          <div>
                            <p className="text-sm text-gray-400">
                              Next Session
                            </p>
                            <p className="text-white font-semibold">
                              {team.nextSession}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            className="border-gray-700"
                            size="sm"
                          >
                            <Users className="h-4 w-4 mr-2" />
                            View Roster
                          </Button>
                          <Button
                            variant="outline"
                            className="border-gray-700"
                            size="sm"
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Statistics
                          </Button>
                        </div>

                        <Button className="w-full bg-gradient-to-r from-blue-600 to-green-600">
                          Manage Team
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Training Plans</CardTitle>
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Plan
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {trainerData.trainingPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="p-6 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">
                            {plan.title}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                              {plan.duration}
                            </Badge>
                            {plan.teams.map((team, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="border-gray-600"
                              >
                                {team}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Badge
                          className={`${
                            plan.status === "Active"
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                          }`}
                        >
                          {plan.status}
                        </Badge>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">
                            Overall Progress
                          </span>
                          <span className="text-white font-semibold">
                            {plan.completion}%
                          </span>
                        </div>
                        <Progress value={plan.completion} className="h-3" />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="border-gray-700"
                          size="sm"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Plan
                        </Button>
                        <Button
                          variant="outline"
                          className="border-gray-700"
                          size="sm"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          className="border-gray-700"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches" className="space-y-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    Match Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {trainerData.upcomingMatches.map((match, index) => (
                    <div
                      key={index}
                      className="p-6 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-yellow-500/50 transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">
                            {match.team} vs {match.opponent}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                              {match.type}
                            </Badge>
                            <Badge
                              className={`${
                                match.status === "Confirmed"
                                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                                  : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                              }`}
                            >
                              {match.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="border-gray-700"
                            size="sm"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            className="bg-gradient-to-r from-blue-600 to-green-600"
                            size="sm"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Calendar className="h-5 w-5 text-blue-400" />
                          <div>
                            <p className="text-xs text-gray-500">Date</p>
                            <p className="text-white font-semibold">
                              {match.date}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Clock className="h-5 w-5 text-green-400" />
                          <div>
                            <p className="text-xs text-gray-500">Time</p>
                            <p className="text-white font-semibold">
                              {match.time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <MapPin className="h-5 w-5 text-purple-400" />
                          <div>
                            <p className="text-xs text-gray-500">Venue</p>
                            <p className="text-white font-semibold">
                              {match.venue}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
