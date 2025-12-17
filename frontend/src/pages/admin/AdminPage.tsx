import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Building,
  Calendar,
  LogOut,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { UserManagement } from "@/components/admin/users/UserManagement";
import { StudentManagement } from "@/components/admin/students/StudentManagement";
import { EventManagement } from "@/components/admin/events/EventManagement";
import { TrainerManagement } from "@/components/admin/trainers/TrainerManagement";
import { SPORTS_LIST } from "@/utils/constants";
import { AcademyManagement } from "@/components/admin/academies/AcademyManagement";
import { LandingPageManagement } from "@/components/admin/landing/LandingPageManagement";

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
        <Tabs defaultValue="users" className="space-y-6">
          <div className="bg-white p-2 rounded-lg shadow-sm overflow-x-auto">
            <TabsList className="h-auto justify-start gap-2">
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
                <Building className="h-4 w-4 mr-2" />
                Academies
              </TabsTrigger>
              <TabsTrigger
                value="events"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Events
              </TabsTrigger>
              <TabsTrigger
                value="landingPage"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Landing Page
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
                  <h3 className="font-semibold mb-4">Recent Activities</h3>
                  <div className="space-y-4">
                    {/* Placeholder for recent activities */}
                    <div className="flex justify-between py-2 border-b">
                      <div>
                        <p className="font-medium">New student registered</p>
                        <p className="text-sm text-muted-foreground">
                          John Smith joined as a student
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        2 hours ago
                      </p>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <div>
                        <p className="font-medium">Event created</p>
                        <p className="text-sm text-muted-foreground">
                          Summer training camp was created
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">Yesterday</p>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <div>
                        <p className="font-medium">New trainer hired</p>
                        <p className="text-sm text-muted-foreground">
                          Michael Jordan joined as a trainer
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        2 days ago
                      </p>
                    </div>
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
