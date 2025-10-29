import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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

export default function MGFCStudentPage() {
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Mock student data
  const studentData = {
    name: "Rahul Sharma",
    rollNumber: "MG2024001",
    class: "Class 10-A",
    position: "Midfielder",
    jerseyNumber: "10",
    avatar: "/api/placeholder/150/150",
    teamName: "Blue Dragons",
    stats: {
      matchesPlayed: 15,
      goalsScored: 8,
      assists: 12,
      cleanSheets: 5,
      attendance: 95,
      skillRating: 4.5,
    },
    achievements: [
      { title: "Best Player of the Month", date: "October 2024", icon: "🏆" },
      { title: "Hat-trick Hero", date: "September 2024", icon: "⚽" },
      { title: "Perfect Attendance", date: "August 2024", icon: "✓" },
      { title: "Team Captain", date: "July 2024", icon: "👑" },
    ],
    upcomingMatches: [
      {
        opponent: "Red Eagles",
        date: "Nov 15, 2024",
        time: "4:00 PM",
        venue: "Main Ground",
        type: "League Match",
      },
      {
        opponent: "Green Strikers",
        date: "Nov 22, 2024",
        time: "3:30 PM",
        venue: "City Stadium",
        type: "Cup Quarter-Final",
      },
      {
        opponent: "Yellow Thunders",
        date: "Nov 29, 2024",
        time: "4:00 PM",
        venue: "Main Ground",
        type: "League Match",
      },
    ],
    trainingSchedule: [
      {
        day: "Monday",
        time: "4:00 PM - 6:00 PM",
        focus: "Technical Skills",
        coach: "Coach Patel",
      },
      {
        day: "Wednesday",
        time: "4:00 PM - 6:00 PM",
        focus: "Tactical Training",
        coach: "Coach Kumar",
      },
      {
        day: "Friday",
        time: "4:00 PM - 6:00 PM",
        focus: "Physical Fitness",
        coach: "Coach Singh",
      },
      {
        day: "Saturday",
        time: "9:00 AM - 11:00 AM",
        focus: "Match Practice",
        coach: "Head Coach",
      },
    ],
    recentMatches: [
      {
        opponent: "White Knights",
        result: "Won",
        score: "3-1",
        date: "Nov 8, 2024",
        playerPerformance: "Excellent",
      },
      {
        opponent: "Purple Panthers",
        result: "Won",
        score: "2-0",
        date: "Nov 1, 2024",
        playerPerformance: "Good",
      },
      {
        opponent: "Orange Tigers",
        result: "Draw",
        score: "1-1",
        date: "Oct 25, 2024",
        playerPerformance: "Average",
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
      <div className="bg-gradient-to-r from-green-600 to-blue-600 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-4 border-white">
                <AvatarImage src={studentData.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-green-600 to-blue-600 text-white text-xl font-bold">
                  {studentData.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {studentData.name}
                </h1>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge className="bg-white/20 text-white border-white/30">
                    {studentData.rollNumber}
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30">
                    {studentData.class}
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30">
                    #{studentData.jerseyNumber} - {studentData.position}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="hidden md:flex gap-2">
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
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
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-gray-800 border border-gray-700">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-green-600"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="data-[state=active]:bg-green-600"
            >
              Statistics
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="data-[state=active]:bg-green-600"
            >
              Schedule
            </TabsTrigger>
            <TabsTrigger
              value="achievements"
              className="data-[state=active]:bg-green-600"
            >
              Achievements
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-green-600"
            >
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
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
                          {studentData.stats.matchesPlayed}
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
                          {studentData.stats.goalsScored}
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
                          {studentData.stats.assists}
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
                          {studentData.stats.attendance}%
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
                    {studentData.upcomingMatches.map((match, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-green-500/50 transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-white font-semibold">
                              vs {match.opponent}
                            </h4>
                            <Badge className="mt-1 bg-green-500/10 text-green-400 border-green-500/20">
                              {match.type}
                            </Badge>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-orange-400 border-orange-500/50"
                          >
                            Upcoming
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Calendar className="h-4 w-4" />
                            {match.date}
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Clock className="h-4 w-4" />
                            {match.time}
                          </div>
                          <div className="flex items-center gap-2 text-gray-400 col-span-2">
                            <MapPin className="h-4 w-4" />
                            {match.venue}
                          </div>
                        </div>
                      </div>
                    ))}
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
                    {studentData.recentMatches.map((match, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-white font-semibold">
                              vs {match.opponent}
                            </h4>
                            <Badge
                              className={`mt-1 ${
                                match.result === "Won"
                                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                                  : match.result === "Draw"
                                    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                    : "bg-red-500/10 text-red-400 border-red-500/20"
                              }`}
                            >
                              {match.result}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-white">
                              {match.score}
                            </p>
                            <p className="text-xs text-gray-400">
                              {match.date}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">
                              Your Performance:
                            </span>
                            <Badge
                              variant="outline"
                              className={`${
                                match.playerPerformance === "Excellent"
                                  ? "text-green-400 border-green-500/50"
                                  : match.playerPerformance === "Good"
                                    ? "text-blue-400 border-blue-500/50"
                                    : "text-yellow-400 border-yellow-500/50"
                              }`}
                            >
                              {match.playerPerformance}
                            </Badge>
                          </div>
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
                    Weekly Training Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {studentData.trainingSchedule.map((session, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-all"
                      >
                        <h4 className="text-white font-semibold mb-2">
                          {session.day}
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Clock className="h-4 w-4" />
                            {session.time}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Target className="h-4 w-4" />
                            {session.focus}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Users className="h-4 w-4" />
                            {session.coach}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-6">
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
                          {studentData.stats.goalsScored}
                        </span>
                      </div>
                      <Progress value={53} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Assists</span>
                        <span className="text-white font-semibold">
                          {studentData.stats.assists}
                        </span>
                      </div>
                      <Progress value={80} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Attendance Rate</span>
                        <span className="text-white font-semibold">
                          {studentData.stats.attendance}%
                        </span>
                      </div>
                      <Progress
                        value={studentData.stats.attendance}
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Skill Rating</span>
                        <span className="text-white font-semibold flex items-center gap-1">
                          {studentData.stats.skillRating}
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
                      <span className="text-3xl font-bold text-white">
                        {studentData.stats.cleanSheets}
                      </span>
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

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Full Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      ...studentData.upcomingMatches,
                      ...studentData.recentMatches,
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-green-500/50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-xs text-gray-400">
                                {item.date?.split(",")[0] || "Nov"}
                              </p>
                              <p className="text-2xl font-bold text-white">
                                {item.date?.split(" ")[1]?.replace(",", "") ||
                                  "15"}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-white font-semibold">
                                vs {item.opponent}
                              </h4>
                              <p className="text-sm text-gray-400">
                                {"Main Ground"}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-green-600 to-blue-600"
                          >
                            View Details
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {studentData.achievements.map((achievement, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-yellow-500/50 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="text-5xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-1">
                            {achievement.title}
                          </h3>
                          <p className="text-gray-400 text-sm mb-3">
                            {achievement.date}
                          </p>
                          <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                            Achievement Unlocked
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-center mb-4">
                      <Avatar className="h-24 w-24 border-4 border-green-500">
                        <AvatarImage src={studentData.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-green-600 to-blue-600 text-white text-2xl font-bold">
                          {studentData.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-gray-400 text-sm">Full Name</p>
                        <p className="text-white font-semibold">
                          {studentData.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Roll Number</p>
                        <p className="text-white font-semibold">
                          {studentData.rollNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Class</p>
                        <p className="text-white font-semibold">
                          {studentData.class}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Position</p>
                        <p className="text-white font-semibold">
                          {studentData.position}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Jersey Number</p>
                        <p className="text-white font-semibold">
                          #{studentData.jerseyNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Team</p>
                        <p className="text-white font-semibold">
                          {studentData.teamName}
                        </p>
                      </div>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-green-600 to-blue-600 mt-4">
                      Edit Profile
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants} className="lg:col-span-2">
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        className="h-20 flex-col gap-2 border-gray-700 hover:border-green-500"
                      >
                        <Download className="h-6 w-6" />
                        <span>Download ID Card</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex-col gap-2 border-gray-700 hover:border-blue-500"
                      >
                        <Upload className="h-6 w-6" />
                        <span>Submit Medical Form</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex-col gap-2 border-gray-700 hover:border-purple-500"
                      >
                        <Bell className="h-6 w-6" />
                        <span>Notifications</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex-col gap-2 border-gray-700 hover:border-orange-500"
                      >
                        <Settings className="h-6 w-6" />
                        <span>Settings</span>
                      </Button>
                    </div>

                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="text-white font-semibold mb-1">
                            Important Notice
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Please submit your medical fitness certificate
                            before the next match. Contact the sports
                            coordinator for more details.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full mt-6 border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
