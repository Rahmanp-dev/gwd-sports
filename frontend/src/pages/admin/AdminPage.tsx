import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { CommandCenter } from "@/components/admin/dashboard/CommandCenter";

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

          {/* Dashboard Tab - Command Center */}
          <TabsContent value="dashboard" className="space-y-6">
            <CommandCenter />
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
