import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  CalendarDays,
  MonitorSmartphone,
  CreditCard,
  Package,
  LogOut,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { UserManagement } from "@/components/admin/users/UserManagement";
import { StudentManagement } from "@/components/admin/students/StudentManagement";
import { EventManagement } from "@/components/admin/events/EventManagement";
import { TrainerManagement } from "@/components/admin/trainers/TrainerManagement";
import { AcademyManagement } from "@/components/admin/academies/AcademyManagement";
import { LandingPageManagement } from "@/components/admin/landing/LandingPageManagement";
import { FeesManagement } from "@/components/admin/fees/FeesManagement";
import { KitsManagement } from "@/components/admin/kits/KitsManagement";
import { SettingsManagement } from "@/components/admin/settings/SettingsManagement";
import { SPORTS_LIST } from "@/utils/constants";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Trophy, Activity, Medal } from "lucide-react";
import axios from "axios";

function LeaderboardList() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const { token } = useAppSelector((state) => state.auth);

  const handleStudentClick = async (id: string) => {
    setSelectedStudent(id);
    setDetailsLoading(true);
    try {
      const res = await axios.get(`http://localhost:3000/api/admin/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setStudentDetails(res.data.data.student);
      }
    } catch (err) {
      console.error("Failed to fetch student details", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/admin/students/leaderboard", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success) {
          setLeaders(res.data.data.topPerformers || []);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchLeaderboard();
  }, [token]);

  if (loading) return <div className="text-center py-4 text-gray-500">Loading leaderboard...</div>;
  if (!leaders.length) return <div className="text-center py-4 text-gray-500">No performance records found.</div>;

  return (
    <>
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {leaders.map((student, idx) => (
          <div 
            key={student._id} 
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => handleStudentClick(student._id)}
          >
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold shadow-sm ${
                idx === 0 ? "bg-yellow-100 text-yellow-600 border border-yellow-300" :
                idx === 1 ? "bg-gray-200 text-gray-600 border border-gray-300" :
                idx === 2 ? "bg-orange-100 text-orange-600 border border-orange-300" :
                "bg-blue-50 text-blue-600 border border-blue-200"
              }`}>
                {idx < 3 ? <Medal className="w-4 h-4" /> : `#${idx + 1}`}
              </div>
              <div>
                <p className="font-semibold text-gray-900 hover:underline">{student.studentName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px] h-4 py-0 uppercase bg-white">
                    {student.level || "Beginner"}
                  </Badge>
                  <span className="text-xs text-gray-500">{student.academyName || "Global"}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 font-bold text-gray-900">
                <Activity className="w-4 h-4 text-green-500" />
                {student.avgScore} <span className="text-xs text-gray-500 font-normal">/ 100</span>
              </div>
              <p className="text-[10px] text-gray-500 font-medium uppercase mt-0.5">{student.totalEvals} Evaluations</p>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Overview</DialogTitle>
          </DialogHeader>
          
          {detailsLoading ? (
            <div className="flex justify-center items-center py-8">
              <Activity className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : studentDetails ? (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{studentDetails.userId?.name}</h3>
                  <p className="text-sm text-gray-500">{studentDetails.userId?.email} • {studentDetails.userId?.phone}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary" className="capitalize">{studentDetails.level}</Badge>
                    {studentDetails.sports?.map((sport: string) => (
                      <Badge key={sport} variant="outline" className="capitalize">{sport}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 border-b pb-2 mb-3">Performance History</h4>
                {(!studentDetails.performance || studentDetails.performance.length === 0) ? (
                  <p className="text-sm text-gray-500">No performance records available.</p>
                ) : (
                  <div className="space-y-3">
                    {studentDetails.performance.map((perf: any) => (
                      <div key={perf._id} className="bg-gray-50 p-3 rounded-lg border">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-semibold text-gray-900 capitalize">{perf.category}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(perf.evaluatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-gray-900">
                            {perf.score} <span className="text-gray-500 font-normal">/ {perf.maxScore}</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                          <div
                            className="bg-primary h-1.5 rounded-full"
                            style={{ width: `${(perf.score / perf.maxScore) * 100}%` }}
                          ></div>
                        </div>
                        {perf.remarks && (
                          <p className="text-sm text-gray-600 italic">"{perf.remarks}"</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">Evaluated by: {perf.evaluatedBy?.name || 'Unknown'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center py-4 text-gray-500">Could not load student details.</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AdminPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with user info and logout */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            MasterGrade Admin
          </h1>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium">{user?.name || "Admin"}</p>
              <p className="text-xs text-gray-500">{user?.role || "admin"}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <div className="bg-white p-2 rounded-lg shadow-sm overflow-x-auto">
            <TabsList className="h-auto justify-start gap-2">
              <TabsTrigger
                value="dashboard"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>

              <TabsTrigger
                value="users"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>

              <TabsTrigger
                value="students"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                Students
              </TabsTrigger>

              <TabsTrigger
                value="trainers"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Trainers
              </TabsTrigger>

              <TabsTrigger
                value="academies"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Academies
              </TabsTrigger>

              <TabsTrigger
                value="events"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Events
              </TabsTrigger>

              <TabsTrigger
                value="landingPage"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <MonitorSmartphone className="h-4 w-4 mr-2" />
                Landing Page
              </TabsTrigger>

              <TabsTrigger
                value="fees"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Fees
              </TabsTrigger>

              <TabsTrigger
                value="kits"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Package className="h-4 w-4 mr-2" />
                Kits
              </TabsTrigger>

              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6 flex flex-col">
                  <span className="text-muted-foreground text-sm mb-2">
                    Total Students
                  </span>
                  <span className="text-3xl font-bold">120</span>
                  <span className="text-green-600 text-sm mt-2">
                    ↑ 12% from last month
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex flex-col">
                  <span className="text-muted-foreground text-sm mb-2">
                    Total Trainers
                  </span>
                  <span className="text-3xl font-bold">24</span>
                  <span className="text-green-600 text-sm mt-2">
                    ↑ 5% from last month
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex flex-col">
                  <span className="text-muted-foreground text-sm mb-2">
                    Academies
                  </span>
                  <span className="text-3xl font-bold">8</span>
                  <span className="text-gray-500 text-sm mt-2">
                    No change from last month
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex flex-col">
                  <span className="text-muted-foreground text-sm mb-2">
                    Active Users
                  </span>
                  <span className="text-3xl font-bold">156</span>
                  <span className="text-green-600 text-sm mt-2">
                    ↑ 8% from last month
                  </span>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="col-span-2">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Top Performers Leaderboard</h3>
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Refresh</Button>
                  </div>
                  <div className="space-y-4">
                    <LeaderboardList />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Popular Sports</h3>
                  <div className="space-y-3">
                    {SPORTS_LIST.slice(0, 5).map((sport, index) => (
                      <div
                        key={sport}
                        className="flex justify-between items-center"
                      >
                        <span>{sport}</span>
                        <div className="w-1/2 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${100 - index * 15}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardContent className="pt-6">
                <UserManagement />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card>
              <CardContent className="p-6">
                <StudentManagement />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trainers Tab */}
          <TabsContent value="trainers">
            <Card>
              <CardContent className="p-6">
                <TrainerManagement />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Academies Tab */}
          <TabsContent value="academies">
            <Card>
              <CardContent className="p-6">
                <AcademyManagement />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card>
              <CardContent className="p-6">
                <EventManagement />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Landing Page Tab */}
          <TabsContent value="landingPage">
            <Card>
              <CardContent className="p-6">
                <LandingPageManagement />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fees Tab */}
          <TabsContent value="fees">
            <Card>
              <CardContent className="p-6">
                <FeesManagement />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Kits Tab */}
          <TabsContent value="kits">
            <Card>
              <CardContent className="p-6">
                <KitsManagement />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardContent className="p-6">
                <SettingsManagement />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-6 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} MasterGrade Admin. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
