"use client";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "@/lib/router-shim";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { authService } from "@/services/authService";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/store/slices/authSlice";
import {
  Calendar,
  Users,
  ClipboardList,
  TrendingUp,
  Activity,
  Clock,
  MapPin,
  Star,
  Plus,
  Edit,
  FileText,
  BarChart3,
  Target,
  Dumbbell,
  Trophy,
  Bell,
  Download,
  LogOut,
  CheckCircle,
  AlertCircle,
  Award,
  Briefcase,
  DollarSign,
  Shield,
  MoreVertical,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Footer from "@/components/landing/Footer";
import { toast } from "sonner";

interface DetailedStudent {
  _id: string;
  userId: string;
  level: string;
  sports: string[];
  isActive: boolean;
  user?: {
    _id?: string;
    name: string;
    email: string;
    phone: string;
  };
  performance?: any[];
  attendance?: any[];
}

interface TrainerProfile {
  _id: string;
  userId: string;
  academyId: string | null;
  sports: string[];
  students: string[];
  specializations: string[];
  qualifications: {
    _id: string;
    certification: string;
    issuedBy: string;
    issuedDate: string;
    expiryDate?: string;
    certificateUrl?: string;
  }[];
  experience: {
    _id: string;
    organization: string;
    position: string;
    startDate: string;
    endDate?: string;
    description: string;
  }[];
  hourlyRate?: number;
  availability: {
    days: string[];
    timeSlots: { start: string; end: string; _id: string }[];
  };
  rating: {
    average: number;
    totalReviews: number;
  };
  joinedDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  sports: string[];
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
}

export default function MGFCTrainerPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("overview");
  const [trainerProfile, setTrainerProfile] = useState<TrainerProfile | null>(
    null,
  );
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [detailedStudents, setDetailedStudents] = useState<DetailedStudent[]>(
    [],
  );
  const [fetchingStudents, setFetchingStudents] = useState(false);

  // Performance metrics fetched from Admin Settings
  const [performanceMetrics, setPerformanceMetrics] = useState<string[]>([]);
  const [isAddPerformanceOpen, setIsAddPerformanceOpen] = useState(false);
  const [selectedStudentForPerformance, setSelectedStudentForPerformance] =
    useState<DetailedStudent | null>(null);
  const [addPerformanceForm, setAddPerformanceForm] = useState({
    sport: "",
    category: "",
    score: "",
    maxScore: "100",
    remarks: "",
  });
  const [submittingPerformance, setSubmittingPerformance] = useState(false);
  const [isViewPerformanceOpen, setIsViewPerformanceOpen] = useState(false);
  const [editingPerformance, setEditingPerformance] = useState<any>(null);

  // Attendance functionality
  const [isAddAttendanceOpen, setIsAddAttendanceOpen] = useState(false);
  const [selectedStudentForAttendance, setSelectedStudentForAttendance] =
    useState<DetailedStudent | null>(null);
  const [addAttendanceForm, setAddAttendanceForm] = useState({
    date: new Date().toISOString().split("T")[0],
    present: true,
    remarks: "",
  });
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  useEffect(() => {
    // Fetch settings for dynamic metrics
    const fetchSettings = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/admin/settings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        console.log("Fetched settings:", data);
        console.log("Fetched settings:", data.data);
        if (data.success && data.data?.performanceMetrics) {
          setPerformanceMetrics(data.data.settings.performanceMetrics);
          if (data.data.settings.performanceMetrics.length > 0) {
            setAddPerformanceForm((prev) => ({
              ...prev,
              category: data.data.settings.performanceMetrics[0],
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };
    if (token) fetchSettings();
  }, [token]);

  useEffect(() => {
    if (
      activeTab === "students" &&
      trainerProfile?.userId &&
      detailedStudents.length === 0
    ) {
      const fetchStudents = async () => {
        try {
          setFetchingStudents(true);
          const res = await fetch(
            `http://localhost:3000/api/trainer/students?trainerId=${trainerProfile.userId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          const data = await res.json();
          if (data.success) {
            setDetailedStudents(data.data.students || []);
          }
        } catch (err) {
          console.error(err);
          toast.error("Failed to load students");
        } finally {
          setFetchingStudents(false);
        }
      };
      fetchStudents();
    }
  }, [activeTab, trainerProfile?.userId, token, detailedStudents.length]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setProfileLoading(true);
        const [trainerRes, userRes] = await Promise.all([
          fetch("http://localhost:3000/api/trainer/profile", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3000/api/user/profile", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const trainerData = await trainerRes.json();
        const userData = await userRes.json();

        if (trainerData.success && trainerData.data?.trainerProfile) {
          setTrainerProfile(trainerData.data.trainerProfile);
        }
        if (userData.success && userData.data?.user) {
          setUserProfile(userData.data.user);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load profile");
      } finally {
        setProfileLoading(false);
      }
    };
    if (token) fetchProfiles();
  }, [token]);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("mg_refresh_token");
      if (refreshToken) await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch(logout());
      navigate("/user/auth");
      toast.success("Logged out successfully");
    }
  };

  const handleOpenAddPerformance = (student: DetailedStudent) => {
    setSelectedStudentForPerformance(student);
    setAddPerformanceForm({
      sport: student.sports?.[0] || trainerSports?.[0] || "",
      category: performanceMetrics[0] || "general",
      score: "",
      maxScore: "100",
      remarks: "",
    });
    setIsAddPerformanceOpen(true);
  };

  const handleAddPerformanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPerformance) return;

    try {
      setSubmittingPerformance(true);
      const res = await fetch(
        "http://localhost:3000/api/trainer/add-performance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            studentId: selectedStudentForPerformance.userId,
            sport: addPerformanceForm.sport,
            category: addPerformanceForm.category,
            score: Number(addPerformanceForm.score),
            maxScore: Number(addPerformanceForm.maxScore),
            remarks: addPerformanceForm.remarks,
          }),
        },
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Performance record added successfully!");
        setIsAddPerformanceOpen(false);
      } else {
        toast.error(data.message || "Failed to add performance");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error adding performance");
    } finally {
      setSubmittingPerformance(false);
    }
  };

  const handleOpenAddAttendance = (student: DetailedStudent) => {
    setSelectedStudentForAttendance(student);
    setAddAttendanceForm({
      date: new Date().toISOString().split("T")[0],
      present: true,
      remarks: "",
    });
    setIsAddAttendanceOpen(true);
  };

  const handleAddAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForAttendance) return;

    try {
      setSubmittingAttendance(true);
      const res = await fetch(
        "http://localhost:3000/api/trainer/mark-attendance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            studentId: selectedStudentForAttendance.userId,
            date: addAttendanceForm.date,
            present: addAttendanceForm.present,
            remarks: addAttendanceForm.remarks,
          }),
        },
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Attendance marked successfully!");
        setIsAddAttendanceOpen(false);
      } else {
        toast.error(data.message || "Failed to mark attendance");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error marking attendance");
    } finally {
      setSubmittingAttendance(false);
    }
  };

  const handleDeletePerformance = async (
    studentId: string,
    performanceId: string,
  ) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this performance record?",
      )
    )
      return;
    try {
      const res = await fetch(
        `http://localhost:3000/api/trainer/performance/${studentId}/${performanceId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Performance record deleted");
        setDetailedStudents((prev) =>
          prev.map((s) => {
            if (s.user?._id === studentId) {
              return {
                ...s,
                performance: s.performance?.filter(
                  (p: any) => p._id !== performanceId,
                ),
              };
            }
            return s;
          }),
        );
        if (
          selectedStudentForPerformance &&
          selectedStudentForPerformance.user?._id === studentId
        ) {
          setSelectedStudentForPerformance({
            ...selectedStudentForPerformance,
            performance: selectedStudentForPerformance.performance?.filter(
              (p: any) => p._id !== performanceId,
            ),
          });
        }
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const handleEditPerformanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerformance || !selectedStudentForPerformance) return;
    try {
      const res = await fetch(
        `http://localhost:3000/api/trainer/performance/${selectedStudentForPerformance.user?._id}/${editingPerformance._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            category: editingPerformance.category,
            score: Number(editingPerformance.score),
            remarks: editingPerformance.remarks,
          }),
        },
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Performance record updated");
        setEditingPerformance(null);
        setDetailedStudents((prev) =>
          prev.map((s) => {
            if (s.user?._id === selectedStudentForPerformance.user?._id) {
              return {
                ...s,
                performance: s.performance?.map((p: any) =>
                  p._id === editingPerformance._id ? data.data.performance : p,
                ),
              };
            }
            return s;
          }),
        );
        setSelectedStudentForPerformance((prev) =>
          prev
            ? {
                ...prev,
                performance: prev.performance?.map((p: any) =>
                  p._id === editingPerformance._id ? data.data.performance : p,
                ),
              }
            : null,
        );
      } else {
        toast.error(data.message || "Failed to update");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center text-white">
        <div className="flex flex-col items-center">
          <Activity className="h-10 w-10 text-blue-500 animate-spin mb-4" />
          <p>Loading Profile...</p>
        </div>
      </div>
    );
  }

  // Derived display values
  const realName = userProfile?.name || user?.name || "Trainer";
  const trainerEmail = userProfile?.email || "—";
  const trainerPhone = userProfile?.phone || "—";
  const trainerSports = trainerProfile?.sports || userProfile?.sports || [];
  const academyName = trainerProfile?.academyId
    ? trainerProfile.academyId
    : "Not in any academy";
  const specializations = trainerProfile?.specializations || [];
  const qualifications = trainerProfile?.qualifications || [];
  const experience = trainerProfile?.experience || [];
  const students = trainerProfile?.students || [];
  const availability = trainerProfile?.availability;
  const rating = trainerProfile?.rating;
  const hourlyRate = trainerProfile?.hourlyRate;
  const joinedDate = trainerProfile?.joinedDate
    ? new Date(trainerProfile.joinedDate).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";
  const trainerIdShort =
    trainerProfile?._id?.substring(0, 8).toUpperCase() || "—";

  const dayLabel = (day: string) =>
    day.charAt(0).toUpperCase() + day.slice(1, 3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-green-600 to-blue-600 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-4 border-white">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-green-600 text-white text-xl font-bold">
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
                    ID: {trainerIdShort}
                  </Badge>
                  {typeof academyName === "string" ? (
                    <Badge className="bg-white/20 text-white border-white/30">
                      {academyName}
                    </Badge>
                  ) : null}
                  {trainerProfile?.isActive ? (
                    <Badge className="bg-green-500/30 text-white border-green-300/40">
                      Active
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/30 text-white border-red-300/40">
                      Inactive
                    </Badge>
                  )}
                  {hourlyRate !== undefined && (
                    <Badge className="bg-white/20 text-white border-white/30">
                      ₹{hourlyRate}/hr
                    </Badge>
                  )}
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
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 border border-gray-700">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-blue-600"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="students"
              className="data-[state=active]:bg-blue-600"
            >
              Students
            </TabsTrigger>
            <TabsTrigger
              value="availability"
              className="data-[state=active]:bg-blue-600"
            >
              Availability
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
                <Card className="bg-gradient-to-br from-blue-600 to-blue-800 border-blue-500/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-200 text-sm">Total Students</p>
                        <h3 className="text-3xl font-bold text-white mt-1">
                          {students.length}
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
                        <p className="text-green-200 text-sm">Sports</p>
                        <h3 className="text-3xl font-bold text-white mt-1">
                          {trainerSports.length}
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
                        <p className="text-purple-200 text-sm">Rating</p>
                        <h3 className="text-3xl font-bold text-white mt-1">
                          {rating?.average ? rating.average.toFixed(1) : "N/A"}
                        </h3>
                        {rating?.totalReviews ? (
                          <p className="text-purple-300 text-xs mt-1">
                            {rating.totalReviews} reviews
                          </p>
                        ) : null}
                      </div>
                      <Star className="h-10 w-10 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-orange-600 to-orange-800 border-orange-500/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-200 text-sm">
                          Qualifications
                        </p>
                        <h3 className="text-3xl font-bold text-white mt-1">
                          {qualifications.length}
                        </h3>
                      </div>
                      <Award className="h-10 w-10 text-orange-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Info + Sports + Specializations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Info */}
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-400" />
                      Trainer Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Name</span>
                      <span className="text-white font-medium">{realName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Email</span>
                      <span className="text-white font-medium">
                        {trainerEmail}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Phone</span>
                      <span className="text-white font-medium">
                        {trainerPhone}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Joined</span>
                      <span className="text-white font-medium">
                        {joinedDate}
                      </span>
                    </div>
                    {hourlyRate !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Hourly Rate</span>
                        <span className="text-white font-medium">
                          ₹{hourlyRate}/hr
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Academy</span>
                      <span className="text-white font-medium">
                        {typeof academyName === "string" ? academyName : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Status</span>
                      <Badge
                        className={
                          trainerProfile?.isActive
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }
                      >
                        {trainerProfile?.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Sports & Specializations */}
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Dumbbell className="h-5 w-5 text-green-400" />
                      Sports & Specializations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Sports</p>
                      <div className="flex flex-wrap gap-2">
                        {trainerSports.length > 0 ? (
                          trainerSports.map((s, i) => (
                            <Badge
                              key={i}
                              className="bg-green-500/10 text-green-400 border-green-500/20 capitalize"
                            >
                              {s}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">
                            None listed
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-2">
                        Specializations
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {specializations.length > 0 ? (
                          specializations.map((s, i) => (
                            <Badge
                              key={i}
                              className="bg-blue-500/10 text-blue-400 border-blue-500/20"
                            >
                              {s}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">
                            None listed
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Qualifications */}
            {qualifications.length > 0 && (
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Shield className="h-5 w-5 text-yellow-400" />
                      Qualifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {qualifications.map((q) => (
                      <div
                        key={q._id}
                        className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-white font-semibold">
                              {q.certification}
                            </p>
                            <p className="text-gray-400 text-sm mt-1">
                              Issued by: {q.issuedBy}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              {new Date(q.issuedDate).toLocaleDateString(
                                "en-IN",
                              )}
                              {q.expiryDate &&
                                ` → ${new Date(q.expiryDate).toLocaleDateString("en-IN")}`}
                            </p>
                          </div>
                          {q.certificateUrl && (
                            <a
                              href={q.certificateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-xs underline"
                            >
                              View
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Experience */}
            {experience.length > 0 && (
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-purple-400" />
                      Experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {experience.map((exp) => (
                      <div
                        key={exp._id}
                        className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                      >
                        <p className="text-white font-semibold">
                          {exp.position}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          {exp.organization}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(exp.startDate).toLocaleDateString("en-IN")}
                          {" → "}
                          {exp.endDate
                            ? new Date(exp.endDate).toLocaleDateString("en-IN")
                            : "Present"}
                        </p>
                        {exp.description && (
                          <p className="text-gray-400 text-sm mt-2">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-400" />
                    My Students ({detailedStudents.length || students.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {fetchingStudents ? (
                    <div className="flex flex-col justify-center items-center py-8 gap-2">
                      <Activity className="h-6 w-6 text-green-500 animate-spin" />
                      <p className="text-gray-400 text-xs">
                        Loading students...
                      </p>
                    </div>
                  ) : detailedStudents.length === 0 ? (
                    <p className="text-gray-400 text-sm">
                      No students assigned yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {detailedStudents.map((student, index) => (
                        <div
                          key={student._id || index}
                          className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-green-600 text-white text-sm font-bold">
                                {(student.user?.name || "S")
                                  .charAt(0)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-white font-medium text-base mb-0.5">
                                {student.user?.name || `Student #${index + 1}`}
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="text-gray-400 text-xs">
                                  {student.user?.email}
                                </p>
                                {student.level && (
                                  <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] px-1.5 py-0 h-4 uppercase">
                                    {student.level}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"
                              >
                                <MoreVertical className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-gray-800 border-gray-700 text-white min-w-[160px]"
                            >
                              <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer py-2">
                                <FileText className="mr-2 h-4 w-4 text-gray-400" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="hover:bg-gray-700 cursor-pointer py-2 text-green-400 focus:text-green-300 focus:bg-gray-700"
                                onClick={() => handleOpenAddAttendance(student)}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Add Attendance
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="hover:bg-gray-700 cursor-pointer py-2 text-blue-400 focus:text-blue-300 focus:bg-gray-700"
                                onClick={() =>
                                  handleOpenAddPerformance(student)
                                }
                              >
                                <TrendingUp className="mr-2 h-4 w-4" />
                                Add Performance
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="hover:bg-gray-700 cursor-pointer py-2 text-purple-400 focus:text-purple-300 focus:bg-gray-700"
                                onClick={() => {
                                  setSelectedStudentForPerformance(student);
                                  setIsViewPerformanceOpen(true);
                                }}
                              >
                                <Activity className="mr-2 h-4 w-4" />
                                View/Edit Performances
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Availability Tab */}
          <TabsContent value="availability" className="space-y-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Available Days */}
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-400" />
                      Available Days
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {availability?.days && availability.days.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {[
                          "monday",
                          "tuesday",
                          "wednesday",
                          "thursday",
                          "friday",
                          "saturday",
                          "sunday",
                        ].map((day) => (
                          <Badge
                            key={day}
                            className={
                              availability.days.includes(day)
                                ? "bg-green-500/20 text-green-400 border-green-500/40"
                                : "bg-gray-700/50 text-gray-500 border-gray-600/40"
                            }
                          >
                            {dayLabel(day)}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">
                        No availability set.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Time Slots */}
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Clock className="h-5 w-5 text-purple-400" />
                      Time Slots
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {availability?.timeSlots &&
                    availability.timeSlots.length > 0 ? (
                      availability.timeSlots.map((slot, i) => (
                        <div
                          key={slot._id || i}
                          className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                        >
                          <Clock className="h-4 w-4 text-purple-400" />
                          <span className="text-white font-medium">
                            {slot.start} — {slot.end}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-sm">
                        No time slots set.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Performance Dialog */}
      <Dialog
        open={isAddPerformanceOpen}
        onOpenChange={setIsAddPerformanceOpen}
      >
        <DialogContent className="bg-gray-900 border border-gray-700 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Performance Record</DialogTitle>
            <DialogDescription className="text-gray-400">
              Evaluate and add metrics for{" "}
              {selectedStudentForPerformance?.user?.name || "this student"}.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleAddPerformanceSubmit}
            className="space-y-4 py-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sport" className="text-gray-300">
                  Sport
                </Label>
                <Input
                  id="sport"
                  required
                  value={addPerformanceForm.sport}
                  onChange={(e) =>
                    setAddPerformanceForm((prev) => ({
                      ...prev,
                      sport: e.target.value,
                    }))
                  }
                  className="bg-gray-800 border-gray-700 text-white focus-visible:ring-blue-500"
                  placeholder="e.g. Football"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-gray-300">
                  Metric / Category
                </Label>
                <select
                  id="category"
                  required
                  value={addPerformanceForm.category}
                  onChange={(e) =>
                    setAddPerformanceForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="flex h-10 w-full items-center justify-between rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                >
                  {performanceMetrics.map((opt) => (
                    <option
                      key={opt}
                      value={opt}
                      className="bg-gray-800 text-white capitalize"
                    >
                      {opt}
                    </option>
                  ))}
                  {performanceMetrics.length === 0 && (
                    <option value="general" className="bg-gray-800">
                      General
                    </option>
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="score" className="text-gray-300">
                  Score
                </Label>
                <Input
                  id="score"
                  type="number"
                  required
                  min="0"
                  step="0.1"
                  value={addPerformanceForm.score}
                  onChange={(e) =>
                    setAddPerformanceForm((prev) => ({
                      ...prev,
                      score: e.target.value,
                    }))
                  }
                  className="bg-gray-800 border-gray-700 text-white focus-visible:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxScore" className="text-gray-300">
                  Max Score
                </Label>
                <Input
                  id="maxScore"
                  type="number"
                  required
                  min="1"
                  step="0.1"
                  value={addPerformanceForm.maxScore}
                  onChange={(e) =>
                    setAddPerformanceForm((prev) => ({
                      ...prev,
                      maxScore: e.target.value,
                    }))
                  }
                  className="bg-gray-800 border-gray-700 text-white focus-visible:ring-blue-500"
                  placeholder="100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks" className="text-gray-300">
                Remarks / Feedback
              </Label>
              <textarea
                id="remarks"
                required
                minLength={5}
                value={addPerformanceForm.remarks}
                onChange={(e) =>
                  setAddPerformanceForm((prev) => ({
                    ...prev,
                    remarks: e.target.value,
                  }))
                }
                className="flex min-h-[80px] w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white resize-none"
                placeholder="Needs improvement in..."
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddPerformanceOpen(false)}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingPerformance}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {submittingPerformance ? (
                  <Activity className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Save Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View/Edit Performances Dialog */}
      <Dialog
        open={isViewPerformanceOpen}
        onOpenChange={setIsViewPerformanceOpen}
      >
        <DialogContent className="bg-gray-900 border border-gray-700 text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Performances - {selectedStudentForPerformance?.user?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {!selectedStudentForPerformance?.performance ||
            selectedStudentForPerformance.performance.length === 0 ? (
              <p className="text-gray-400 text-sm">
                No performance records found.
              </p>
            ) : (
              selectedStudentForPerformance.performance.map((perf: any) => (
                <div
                  key={perf._id}
                  className="p-3 bg-gray-800 rounded-lg border border-gray-700 text-sm relative"
                >
                  {editingPerformance?._id === perf._id ? (
                    <form
                      onSubmit={handleEditPerformanceSubmit}
                      className="space-y-3"
                    >
                      <div>
                        <Label className="text-xs text-gray-400">
                          Category
                        </Label>
                        <select
                          className="w-full p-2 border border-gray-600 bg-gray-700 rounded-md text-white mt-1"
                          value={editingPerformance.category}
                          onChange={(e) =>
                            setEditingPerformance({
                              ...editingPerformance,
                              category: e.target.value,
                            })
                          }
                        >
                          {performanceMetrics.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-400">Score</Label>
                        <Input
                          type="number"
                          className="bg-gray-700 border-gray-600 text-white mt-1"
                          value={editingPerformance.score}
                          onChange={(e) =>
                            setEditingPerformance({
                              ...editingPerformance,
                              score: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-400">Remarks</Label>
                        <Input
                          className="bg-gray-700 border-gray-600 text-white mt-1"
                          value={editingPerformance.remarks}
                          onChange={(e) =>
                            setEditingPerformance({
                              ...editingPerformance,
                              remarks: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="flex justify-end gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          onClick={() => setEditingPerformance(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          type="submit"
                        >
                          Save
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-white capitalize">
                            {perf.category}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(perf.evaluatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 hover:bg-gray-700"
                            onClick={() => setEditingPerformance(perf)}
                          >
                            <Edit2 className="h-3.5 w-3.5 text-blue-400" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 hover:bg-gray-700"
                            onClick={() =>
                              handleDeletePerformance(
                                selectedStudentForPerformance.user?._id || "",
                                perf._id,
                              )
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1 text-gray-300">
                          <span>
                            Score: {perf.score} / {perf.maxScore}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{
                              width: `${(perf.score / perf.maxScore) * 100}%`,
                            }}
                          ></div>
                        </div>
                        {perf.remarks && (
                          <p className="mt-2 text-gray-400 italic font-light text-xs">
                            "{perf.remarks}"
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Attendance Dialog */}
      <Dialog open={isAddAttendanceOpen} onOpenChange={setIsAddAttendanceOpen}>
        <DialogContent className="bg-gray-900 border border-gray-700 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Mark Attendance</DialogTitle>
            <DialogDescription className="text-gray-400">
              Record attendance for{" "}
              {selectedStudentForAttendance?.user?.name || "this student"}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAttendanceSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="attendanceDate" className="text-gray-300">
                Date
              </Label>
              <Input
                id="attendanceDate"
                type="date"
                required
                value={addAttendanceForm.date}
                onChange={(e) =>
                  setAddAttendanceForm((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
                className="bg-gray-800 border-gray-700 text-white focus-visible:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Status</Label>
              <div className="flex items-center gap-4 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setAddAttendanceForm((prev) => ({ ...prev, present: true }))
                  }
                  className={`flex-1 border-gray-700 ${addAttendanceForm.present ? "bg-green-600/20 text-green-400 border-green-500/50 hover:bg-green-600/30" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
                >
                  <CheckCircle
                    className={`h-4 w-4 mr-2 ${addAttendanceForm.present ? "text-green-400" : ""}`}
                  />
                  Present
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setAddAttendanceForm((prev) => ({
                      ...prev,
                      present: false,
                    }))
                  }
                  className={`flex-1 border-gray-700 ${!addAttendanceForm.present ? "bg-red-600/20 text-red-400 border-red-500/50 hover:bg-red-600/30" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
                >
                  <AlertCircle
                    className={`h-4 w-4 mr-2 ${!addAttendanceForm.present ? "text-red-400" : ""}`}
                  />
                  Absent
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="attendanceRemarks" className="text-gray-300">
                Remarks (Optional)
              </Label>
              <textarea
                id="attendanceRemarks"
                maxLength={500}
                value={addAttendanceForm.remarks}
                onChange={(e) =>
                  setAddAttendanceForm((prev) => ({
                    ...prev,
                    remarks: e.target.value,
                  }))
                }
                className="flex min-h-[80px] w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white resize-none"
                placeholder="Any notes..."
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddAttendanceOpen(false)}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingAttendance}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {submittingAttendance ? (
                  <Activity className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Save Attendance
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
