"use client";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SetupChecklist } from "@/components/admin/dashboard/SetupChecklist";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBrand } from "@/hooks/useBrand";
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
  Settings,
  Palette,
  MessagesSquare,
  UploadCloud,
  QrCode,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/store/slices/authSlice";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * EVERY TAB IS CODE-SPLIT
 * ════════════════════════════════════════════════════════════════════════════
 *
 * These fifteen panels used to be static imports. An admin opening the
 * dashboard downloaded all of them — the student table, the event manager, the
 * fee ledger, the branding studio, the whole super-admin console — to look at
 * one tab. First Load JS for /admin/dashboard was 511 kB.
 *
 * Radix already unmounts inactive tab content, so nothing was RENDERING. The
 * cost was purely that a static import puts the module in the entry bundle
 * whether it runs or not.
 *
 * `ssr: false` because every one of these is a client-only screen that fetches
 * on mount — server-rendering a spinner and then hydrating it is work with no
 * output. This page is behind a login, so there is nothing to serve to a
 * crawler either.
 * ════════════════════════════════════════════════════════════════════════════
 */
const PanelFallback = () => (
  <div className="flex items-center justify-center py-16">
    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
  </div>
);

/** Every panel here takes no props, so this is deliberately not generic. */
const lazyPanel = (
  loader: () => Promise<{ default: React.ComponentType<Record<string, never>> }>,
) => dynamic(loader, { loading: PanelFallback, ssr: false });

const UserManagement = lazyPanel(() =>
  import("@/components/admin/users/UserManagement").then((m) => ({ default: m.UserManagement })),
);
const StudentManagement = lazyPanel(() =>
  import("@/components/admin/students/StudentManagement").then((m) => ({ default: m.StudentManagement })),
);
const EventManagement = lazyPanel(() =>
  import("@/components/admin/events/EventManagement").then((m) => ({ default: m.EventManagement })),
);
const TrainerManagement = lazyPanel(() =>
  import("@/components/admin/trainers/TrainerManagement").then((m) => ({ default: m.TrainerManagement })),
);
const LandingPageManagement = lazyPanel(() =>
  import("@/components/admin/landing/LandingPageManagement").then((m) => ({ default: m.LandingPageManagement })),
);
const FeesManagement = lazyPanel(() =>
  import("@/components/admin/fees/FeesManagement").then((m) => ({ default: m.FeesManagement })),
);
const KitsManagement = lazyPanel(() =>
  import("@/components/admin/kits/KitsManagement").then((m) => ({ default: m.KitsManagement })),
);
const SettingsManagement = lazyPanel(() =>
  import("@/components/admin/settings/SettingsManagement").then((m) => ({ default: m.SettingsManagement })),
);
const AcademyBrandingPanel = lazyPanel(() =>
  import("@/components/branding/AcademyBrandingPanel").then((m) => ({ default: m.AcademyBrandingPanel })),
);
const CommunicationCenter = lazyPanel(() =>
  import("@/components/admin/messaging/CommunicationCenter").then((m) => ({ default: m.CommunicationCenter })),
);
const OnboardingCenter = lazyPanel(() =>
  import("@/components/admin/import/OnboardingCenter").then((m) => ({ default: m.OnboardingCenter })),
);
const AttendanceCenter = lazyPanel(() =>
  import("@/components/admin/attendance/AttendanceCenter").then((m) => ({ default: m.AttendanceCenter })),
);

/**
 * The overview is the DEFAULT tab, so it is deliberately NOT lazy — splitting
 * the one panel that always renders would only add a round trip and a spinner
 * to the first paint.
 */
import { CommandCenter } from "@/components/admin/dashboard/CommandCenter";
import CommandPalette, { type PaletteItem } from "@/components/admin/CommandPalette";

/**
 * ⌘K targets, keyed on what an owner is TRYING TO DO.
 *
 * The keywords matter more than the labels. Someone chasing a payment types
 * "who hasn't paid", not "Fees"; someone about to run a session types
 * "register", not "Check-in". Matching only the tab names would mean the
 * palette can only find things you had already located.
 */
const PALETTE_ITEMS: PaletteItem[] = [
  {
    id: "dashboard",
    label: "Overview",
    hint: "Today at a glance",
    keywords: ["home", "summary", "dashboard", "start"],
  },
  {
    id: "fees",
    label: "Fees & payments",
    hint: "Who has paid, who owes, record a cash payment",
    keywords: [
      "money", "paid", "unpaid", "due", "overdue", "defaulter",
      "who hasnt paid", "who has not paid", "collect", "cash", "receipt", "revenue",
    ],
  },
  {
    id: "students",
    label: "Students",
    hint: "Roster, profiles, passports",
    keywords: ["roster", "children", "kids", "players", "passport", "enrol", "enroll"],
  },
  {
    id: "import",
    label: "Import students",
    hint: "Add your roster from a photo, WhatsApp list or spreadsheet",
    keywords: ["bulk", "csv", "spreadsheet", "excel", "upload", "add students", "register photo"],
  },
  {
    id: "trainers",
    label: "Trainers",
    hint: "Coaches and who they look after",
    keywords: ["coach", "coaches", "staff", "assign"],
  },
  {
    id: "checkin",
    label: "Check-in",
    hint: "QR codes and the attendance register",
    keywords: [
      "attendance", "qr", "register", "present", "absent", "scan", "mark",
      // Batches live here rather than in a tab of their own.
      "batch", "group", "timing", "session",
    ],
  },
  {
    id: "comms",
    label: "Messages",
    hint: "WhatsApp delivery, alerts, announcements",
    keywords: [
      "whatsapp", "message", "send", "announcement", "broadcast",
      "alert", "delivery", "notify", "parents",
    ],
  },
  {
    id: "events",
    label: "Events",
    hint: "Matches, tournaments and camps",
    keywords: ["match", "tournament", "camp", "fixture", "calendar"],
  },
  {
    id: "branding",
    label: "Look & feel",
    hint: "Your public homepage, colours and content",
    keywords: [
      "theme", "colour", "color", "logo", "homepage", "website", "landing",
      "design", "gallery", "video", "tagline", "geofence", "attendance location",
      // Batches are managed under Check-in, not their own tab — so route the
      // word people actually use to where the thing actually lives.
    ],
  },
  {
    id: "landingPage",
    label: "Landing page",
    hint: "What visitors see",
    keywords: ["public", "site", "web", "page"],
  },
  {
    id: "kits",
    label: "Kits",
    hint: "Kit issue and sizes",
    keywords: ["kit", "uniform", "jersey", "size"],
  },
  {
    id: "users",
    label: "Users",
    hint: "Accounts and access",
    keywords: ["account", "login", "access", "permission", "admin", "delete user"],
  },
  {
    id: "settings",
    label: "Settings",
    hint: "Academy details and configuration",
    keywords: ["config", "setup", "detail", "profile", "fees due day"],
  },
];

/**
 * Super admins never see the tabbed layout at all — this returns early below.
 * Splitting it keeps the whole platform console out of an academy admin's
 * bundle, which is the single largest component here.
 */
const SuperAdminDashboard = lazyPanel(() => import("@/views/admin/SuperAdminDashboard"));

export default function AdminPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  // Controlled so the setup checklist's "Fix" links can jump to the right tab.
  const [activeTab, setActiveTab] = useState("dashboard");
  // The academy's own name, not the platform's — five branches will run under
  // one deployment, so a build-time constant cannot be right for all of them.
  const brand = useBrand();

  const handleLogout = () => {
    dispatch(logout());
  };

  if (user?.role === "gwd_super_admin" as any) {
    return <SuperAdminDashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with user info and logout */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center gap-3">
          <h1 className="min-w-0 truncate text-xl sm:text-2xl font-bold text-gray-900">
            {brand.name} Admin
          </h1>
          <div className="flex shrink-0 items-center gap-3">
            {/*
              Thirteen tabs is a good map and a bad way to travel. The palette
              is keyed on what an owner is trying to DO ("who hasn't paid")
              rather than on the tab names they would have to already know.
            */}
            <CommandPalette items={PALETTE_ITEMS} onSelect={setActiveTab} />
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
          {/* States the consequence of anything still unconfigured — the fee
              schedule in particular, without which parents cannot pay at all. */}
          <SetupChecklist onNavigate={setActiveTab} />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/*
              On a phone, 13 tabs in one overflow-x-auto row (below) means
              the very first thing an owner does every session is hunt for a
              tab that's scrolled off-screen, with no hint one exists. A
              native <select> is the standard mobile pattern here — no new
              dependency, full keyboard/screen-reader support for free, and
              it drives the exact same activeTab state as the tab strip, so
              nothing about tab content or routing changes.
            */}
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm sm:hidden"
              aria-label="Dashboard section"
            >
              <option value="dashboard">Overview</option>
              <option value="fees">Fees</option>
              <option value="users">Users</option>
              <option value="students">Students</option>
              <option value="import">Import</option>
              <option value="trainers">Trainers</option>
              <option value="events">Events</option>
              <option value="landingPage">Landing Page</option>
              <option value="kits">Kits</option>
              <option value="checkin">Check-in</option>
              <option value="comms">Comms</option>
              <option value="branding">Branding</option>
              <option value="settings">Settings</option>
            </select>

            <div className="hidden bg-white p-2 rounded-lg shadow-sm overflow-x-auto sm:block">
            <TabsList className="h-auto justify-start gap-2">
              <TabsTrigger
                value="dashboard"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>

              {/* Money second, immediately after Overview. An academy owner
                  opens this dashboard to answer "who has paid" far more often
                  than to manage users or import a roster. */}
              <TabsTrigger
                value="fees"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Fees
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

              {/* Sits next to Students on purpose: importing a roster is a
                  student-management job, not a settings job. */}
              <TabsTrigger
                value="import"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <UploadCloud className="h-4 w-4 mr-2" />
                Import
              </TabsTrigger>

              <TabsTrigger
                value="trainers"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Trainers
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
                value="kits"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Package className="h-4 w-4 mr-2" />
                Kits
              </TabsTrigger>

              <TabsTrigger
                value="checkin"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Check-in
              </TabsTrigger>

              <TabsTrigger
                value="comms"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <MessagesSquare className="h-4 w-4 mr-2" />
                Comms
              </TabsTrigger>

              <TabsTrigger
                value="branding"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Palette className="h-4 w-4 mr-2" />
                Branding
              </TabsTrigger>

              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Settings className="h-4 w-4 mr-2" />
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

          {/* Import Tab — bulk onboarding + parent activation */}
          <TabsContent value="import">
            <Card>
              <CardContent className="p-6">
                <OnboardingCenter />
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

          {/* Check-in Tab — batch schedules + the QR codes they drive */}
          <TabsContent value="checkin">
            <Card>
              <CardContent className="p-6">
                <AttendanceCenter />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comms Tab — alert feed + message log */}
          <TabsContent value="comms">
            <Card>
              <CardContent className="p-6">
                <CommunicationCenter />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Tab — the same editor a super admin uses to onboard an
              academy, so both sides of the handover behave identically. */}
          <TabsContent value="branding">
            <Card>
              <CardContent className="p-6">
                <AcademyBrandingPanel />
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
          © {new Date().getFullYear()} {brand.name} Admin. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
