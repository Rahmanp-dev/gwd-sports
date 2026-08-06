"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Users,
  IndianRupee,
  ArrowUpRight,
  Plus,
  MapPin,
  Activity,
  Zap,
  Globe,
  Settings,
  Search,
  ExternalLink,
  Power,
  RefreshCw,
  LogOut,
  TrendingUp,
  Sliders,
  DollarSign,
  UserCheck,
  Server,
  Layers,
  ShieldCheck,
  CheckCircle2,
  X,
  ChevronRight,
  Filter,
  MessagesSquare,
} from "lucide-react";
import { CommunicationCenter } from "@/components/admin/messaging/CommunicationCenter";
import AcademyInsightsPanel from "@/components/admin/academies/AcademyInsightsPanel";
import { FinanceDashboard } from "@/components/admin/fees/FinanceDashboard";
import EcosystemProfileEditor, {
  ecosystemProfileFromAcademy,
  ecosystemProfileToUpdate,
  emptyEcosystemProfile,
  type EcosystemProfile,
} from "@/components/academy/EcosystemProfileEditor";
import {
  academyService,
  Academy,
  CreateAcademyDTO,
} from "@/services/academyService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import apiService from "@/services/apiService";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { toastUtils } from "@/utils/toast";

export default function SuperAdminDashboard() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [academies, setAcademies] = useState<Academy[]>([]);
  /**
   * Which academy the revenue tab is scoped to. Null = the whole platform.
   * The master ledger is still the default view; this narrows it.
   */
  const [financeAcademyId, setFinanceAcademyId] = useState<string | null>(null);
  const [financeData, setFinanceData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "tenants" | "revenue" | "users" | "comms" | "health"
  >("tenants");

  // New Academy Modal State
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [newAcademy, setNewAcademy] = useState<CreateAcademyDTO>({
    name: "",
    slug: "",
    location: "",
    capacity: 500,
    platformFeePercent: 1.0,
    adminEmail: "",
    adminPassword: "",
    adminName: "",
    adminPhone: "",
    sports: ["Football", "Cricket", "Basketball"],
    coordinatesLat: undefined,
    coordinatesLng: undefined,
    ecosystemScore: 50,
    coachName: "",
    verificationStatus: "pending",
    gwdFoundingAcademy: false,
  });

  // Edit Fee Modal State
  const [editingFeeAcademyId, setEditingFeeAcademyId] = useState<string | null>(
    null,
  );
  const [newFeePercent, setNewFeePercent] = useState<number>(1.0);

  // Edit Coords Modal State
  const [editingCoordsAcademy, setEditingCoordsAcademy] = useState<any | null>(
    null,
  );
  const [editLat, setEditLat] = useState<string>("");
  const [editLng, setEditLng] = useState<string>("");
  const [editScore, setEditScore] = useState<number>(50);
  const [editStatus, setEditStatus] = useState<
    "pending" | "verified" | "founding"
  >("pending");
  const [editFounding, setEditFounding] = useState<boolean>(false);
  const [editAchievements, setEditAchievements] = useState<string>("");
  const [isSavingCoords, setIsSavingCoords] = useState<boolean>(false);

  // Which academy's usage panel is open, if any.
  const [insightsFor, setInsightsFor] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Star players / teams shown on the ecosystem map. Same editor the owner
  // gets in their own settings, so the two cannot disagree about the shape.
  const [editEcosystem, setEditEcosystem] = useState<EcosystemProfile>(
    emptyEcosystemProfile(),
  );

  const handleOpenCoordsModal = (academy: any) => {
    setEditingCoordsAcademy(academy);
    setEditLat(
      academy.coordinates?.lat !== undefined
        ? String(academy.coordinates.lat)
        : "",
    );
    setEditLng(
      academy.coordinates?.lng !== undefined
        ? String(academy.coordinates.lng)
        : "",
    );
    setEditScore(academy.ecosystemScore || 50);
    setEditStatus(academy.verificationStatus || "pending");
    setEditFounding(academy.gwdFoundingAcademy || false);
    setEditAchievements(
      Array.isArray(academy.achievements)
        ? academy.achievements.join(", ")
        : "",
    );
    setEditEcosystem(ecosystemProfileFromAcademy(academy));
  };

  const handleSaveCoords = async () => {
    if (!editingCoordsAcademy) return;
    setIsSavingCoords(true);
    try {
      await academyService.updateAcademy(
        editingCoordsAcademy._id,
        {
          coordinates: {
            lat: editLat ? parseFloat(editLat) : undefined,
            lng: editLng ? parseFloat(editLng) : undefined,
          },
          ecosystemScore: editScore,
          verificationStatus: editStatus,
          gwdFoundingAcademy: editFounding,
          achievements: editAchievements
            ? editAchievements
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          // coachName / establishedYear / starPlayers / registeredTeams all
          // come from the shared editor now — the two loose fields above it
          // used to own are inside this payload.
          ...ecosystemProfileToUpdate(editEcosystem),
        } as any,
        { superAdmin: true },
      );
      toastUtils.success(
        "Map Pin Updated",
        "Academy map coordinates and ecosystem status saved.",
      );
      setEditingCoordsAcademy(null);
      fetchAcademies();
    } catch (error) {
      toastUtils.error(
        "Failed to update coordinates",
        "Could not save ecosystem data.",
      );
    } finally {
      setIsSavingCoords(false);
    }
  };

  // Fetch Academies
  const fetchAcademies = async () => {
    setIsLoading(true);
    try {
      const response = await academyService.getAllAcademies(
        { limit: 100 },
        { superAdmin: true },
      );
      if (response?.data?.academies) {
        setAcademies(response.data.academies);
      }
    } catch (error) {
      toastUtils.error(
        "Failed to load academies",
        "Check your connection or permissions.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFinanceAnalytics = async () => {
    try {
      const data: any = await apiService.get("/admin/finance-analytics");
      if (data?.success && data?.data) {
        setFinanceData(data.data);
      } else if (data?.summary) {
        setFinanceData(data); // In case apiService unpacks directly
      }
    } catch (e) {
      console.error("Failed to fetch finance analytics:", e);
    }
  };

  const fetchTransactions = async () => {
    try {
      const data: any = await apiService.get("/payments/admin/all?limit=20");
      if (data?.success && data?.data?.payments) {
        setTransactions(data.data.payments);
      }
    } catch (e) {
      console.error("Failed to fetch transactions:", e);
    }
  };

  const fetchUsers = async () => {
    setIsUsersLoading(true);
    try {
      const data: any = await apiService.get("/admin/users?limit=100");
      if (data?.success && data?.data?.users) {
        setUsers(data.data.users);
      }
    } catch (e) {
      console.error("Failed to fetch users:", e);
    } finally {
      setIsUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademies();
    fetchFinanceAnalytics();
    fetchTransactions();
    fetchUsers();
  }, []);

  // Filtered Academies
  const filteredAcademies = academies.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.slug && a.slug.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.location &&
        a.location.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // Global Metrics
  const activeCount = academies.filter((a) => a.isActive).length;
  const totalCapacity = academies.reduce(
    (acc, a) => acc + (a.capacity || 0),
    0,
  );
  const totalGMV = financeData?.summary?.lifetimeRevenue || 0;
  const estimatedPlatformRev = financeData?.summary?.lifetimePlatformFee || 0;

  // Handlers
  const handleDeployAcademy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newAcademy.name ||
      !newAcademy.slug ||
      !newAcademy.adminEmail ||
      !newAcademy.adminPassword ||
      !newAcademy.adminName ||
      !newAcademy.adminPhone
    ) {
      toastUtils.error(
        "Missing Fields",
        "Please fill out all required academy and admin fields.",
      );
      return;
    }

    setIsDeploying(true);
    try {
      const res = await academyService.createAcademy(newAcademy);
      if (res?.success) {
        toastUtils.success(
          "Academy Deployed",
          `${newAcademy.name} is now active at /${newAcademy.slug}`,
        );
        setIsDeployModalOpen(false);
        setNewAcademy({
          name: "",
          slug: "",
          location: "",
          capacity: 500,
          platformFeePercent: 1.0,
          adminEmail: "",
          adminPassword: "",
          adminName: "",
          adminPhone: "",
          sports: ["Football", "Cricket"],
        });
        fetchAcademies();
      }
    } catch (err: any) {
      toastUtils.error(
        "Deployment Error",
        err.message || "Failed to deploy academy.",
      );
    } finally {
      setIsDeploying(false);
    }
  };

  const handleToggleFreezeTenant = async (
    id: string,
    currentStatus: boolean,
  ) => {
    try {
      const res = await academyService.updateAcademy(
        id,
        { isActive: !currentStatus },
        { superAdmin: true },
      );
      if (res?.success) {
        toastUtils.success(
          !currentStatus ? "Tenant Activated" : "Tenant Deactivated",
          `Status updated successfully.`,
        );
        fetchAcademies();
      }
    } catch (err: any) {
      toastUtils.error("Update Failed", "Could not change tenant status.");
    }
  };

  const handleUpdateFee = async (id: string) => {
    try {
      const res = await academyService.updateAcademy(
        id,
        { platformFeePercent: newFeePercent },
        { superAdmin: true },
      );
      if (res?.success) {
        toastUtils.success(
          "Fee Schedule Updated",
          `Platform fee updated to ${newFeePercent}%.`,
        );
        setEditingFeeAcademyId(null);
        fetchAcademies();
      }
    } catch (err: any) {
      toastUtils.error("Update Failed", "Could not update platform fee.");
    }
  };

  const handleEnterTenantPortal = (slug: string) => {
    toastUtils.info("Opening Tenant Portal", `Navigating to /${slug}...`);
    window.open(`/${slug}`, "_blank");
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-slate-900 font-sans antialiased selection:bg-blue-500 selection:text-white pb-16">
      {/* APPLE-STYLE PRISTINE HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-slate-900 tracking-tight">
                  GWD Command Center
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-medium">
                  Super Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal">
                Sovereign Ecosystem Control
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Platform Online</span>
            </div>

            <div className="text-right hidden md:block border-l border-slate-200 pl-4">
              <p className="text-xs font-semibold text-slate-900">
                {user?.name || "Administrator"}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                {user?.email || "superadmin@gwd.in"}
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        {/* APPLE-STYLE METRIC METRICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Metric 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                Active Tenants
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-semibold text-slate-900 tracking-tight">
                {academies.length}
              </span>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {activeCount} Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
              Multi-tenant isolated hubs
            </p>
          </div>

          {/* Metric 2 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                Global Capacity
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-semibold text-slate-900 tracking-tight">
                {totalCapacity.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                Athletes Max
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
              Cross-academy student limit
            </p>
          </div>

          {/* Metric 3 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                Gross Volume (GMV)
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-semibold text-slate-900 tracking-tight">
                ₹{(totalGMV / 100000).toFixed(1)}L
              </span>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Monthly
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
              Direct settlement flow
            </p>
          </div>

          {/* Metric 4 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                Platform Revenue (1%)
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-semibold text-slate-900 tracking-tight">
                ₹{estimatedPlatformRev.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                1% Commission
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
              Automated platform cut
            </p>
          </div>
        </div>

        {/* APPLE SEGMENTED CONTROL TABS */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-200/60 p-1.5 rounded-2xl">
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab("tenants")}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "tenants"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 inline mr-1.5" />
              Academies & Tenants ({academies.length})
            </button>

            <button
              onClick={() => setActiveTab("revenue")}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "revenue"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 inline mr-1.5" />
              Revenue & Fees
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "users"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 inline mr-1.5" />
              Global User Directory
            </button>

            {/* Platform-wide comms. The same components the academy admin
                sees — the APIs already widen to every tenant for this role and
                add academy attribution, so nothing here is a second
                implementation. */}
            <button
              onClick={() => setActiveTab("comms")}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "comms"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MessagesSquare className="w-3.5 h-3.5 inline mr-1.5" />
              Communications
            </button>

            <button
              onClick={() => setActiveTab("health")}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "health"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Server className="w-3.5 h-3.5 inline mr-1.5" />
              System Diagnostics
            </button>
          </div>

          <Button
            onClick={() => setIsDeployModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm text-xs font-medium px-4 h-9"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Deploy New Academy
          </Button>
        </div>

        {/* TAB 1: ACADEMIES DATA TABLE */}
        {activeTab === "tenants" && (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="relative w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <Input
                  placeholder="Filter by academy, slug, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs rounded-xl focus-visible:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <RefreshCw
                  className={`w-3.5 h-3.5 cursor-pointer hover:text-slate-900 ${isLoading ? "animate-spin" : ""}`}
                  onClick={fetchAcademies}
                />
                <span>{filteredAcademies.length} Academies Listed</span>
              </div>
            </div>

            {/* DATA TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-3.5">Academy / Tenant</th>
                      <th className="px-6 py-3.5">Route Slug</th>
                      <th className="px-6 py-3.5">Location</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Platform Cut</th>
                      <th className="px-6 py-3.5 text-right">
                        Tenant Portal Access
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredAcademies.map((academy, i) => (
                      <tr
                        key={academy._id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        {/* Name & Logo */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {academy.theme?.logoUrl ? (
                              <img
                                src={academy.theme.logoUrl}
                                alt=""
                                className="w-8 h-8 rounded-lg bg-slate-100 p-0.5 object-contain border border-slate-200"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs">
                                {academy.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-900">
                                {academy.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                ID: {academy._id.substring(0, 8)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Slug */}
                        <td className="px-6 py-4 font-mono text-blue-600 font-medium">
                          /{academy.slug}
                        </td>

                        {/* Location */}
                        <td className="px-6 py-4 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{academy.location || "Main Campus"}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {academy.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{" "}
                              Live
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Platform Cut */}
                        <td className="px-6 py-4">
                          {editingFeeAcademyId === academy._id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                step="0.1"
                                value={newFeePercent}
                                onChange={(e) =>
                                  setNewFeePercent(parseFloat(e.target.value))
                                }
                                className="w-16 h-7 bg-white border-slate-300 text-xs text-slate-900"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleUpdateFee(academy._id)}
                                className="h-7 text-[11px] bg-emerald-600 text-white px-2"
                              >
                                Save
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">
                                {academy.platformFeePercent
                                  ? `${academy.platformFeePercent}%`
                                  : "1.0%"}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingFeeAcademyId(academy._id);
                                  setNewFeePercent(
                                    academy.platformFeePercent || 1.0,
                                  );
                                }}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Tenant Controls */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {/* Usage & engagement — is this owner actually
                                using what we sold them? */}
                            <Button
                              size="sm"
                              onClick={() =>
                                setInsightsFor({
                                  id: academy._id,
                                  name: academy.name,
                                })
                              }
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 h-8 text-xs font-medium rounded-xl"
                            >
                              <Activity className="w-3.5 h-3.5 mr-1" />
                              Usage
                            </Button>

                            {/* Pin Map Coordinates */}
                            <Button
                              size="sm"
                              onClick={() => handleOpenCoordsModal(academy)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 h-8 text-xs font-medium rounded-xl"
                            >
                              <MapPin className="w-3.5 h-3.5 mr-1" />
                              Pin Map
                            </Button>

                            {/* Enter Portal */}
                            <Button
                              size="sm"
                              onClick={() =>
                                handleEnterTenantPortal(academy.slug || "")
                              }
                              className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 h-8 text-xs font-medium rounded-xl"
                            >
                              <ExternalLink className="w-3.5 h-3.5 mr-1" />
                              Portal View
                            </Button>

                            {/* Freeze/Activate */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleToggleFreezeTenant(
                                  academy._id,
                                  academy.isActive,
                                )
                              }
                              className={`h-8 text-xs font-medium rounded-xl ${
                                academy.isActive
                                  ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              <Power className="w-3.5 h-3.5 mr-1" />
                              {academy.isActive ? "Deactivate" : "Activate"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredAcademies.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                  No academies found matching search criteria.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: REVENUE AUDIT */}
        {activeTab === "revenue" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Platform Revenue Governance
              </h3>
              <p className="text-xs text-slate-500">
                Overview of platform fee cuts and total transaction throughput
                across tenant hubs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 font-medium">
                  Gross Merchandise Value (GMV)
                </p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">
                  ₹{totalGMV.toLocaleString()}
                </p>
                <p className="text-xs text-emerald-600 mt-2">
                  100% Direct Tenant Settlement
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 font-medium">
                  Platform Fee Commission (Collected)
                </p>
                <p className="text-2xl font-semibold text-purple-600 mt-1">
                  ₹{estimatedPlatformRev.toLocaleString()}
                </p>
                <p className="text-xs text-purple-600 mt-2">
                  Aggregated across all tenants
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 font-medium">
                  Billing Status
                </p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">
                  {activeCount} Hubs
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  All Tenants Active
                </p>
              </div>
            </div>

            {/* TRANSACTION LEDGER */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Global Transaction Ledger
                </h3>
                <span className="text-[11px] font-medium text-slate-500">
                  Latest 20 Transactions
                </span>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-6 py-3.5">Transaction / Receipt</th>
                        <th className="px-6 py-3.5">Tenant & User</th>
                        <th className="px-6 py-3.5">Total Amount</th>
                        <th className="px-6 py-3.5">Platform Cut</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {transactions.map((tx) => (
                        <tr
                          key={tx._id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-900">
                              {tx.receipt || tx.orderId}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {tx.paymentId || "Pending"}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-slate-700">
                              {academies.find((a) => a._id === tx.academyId)
                                ?.name || "Global Platform"}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Student:{" "}
                              {tx.studentId?.email ||
                                tx.studentId?.name ||
                                (typeof tx.studentId === "object"
                                  ? tx.studentId._id?.toString() || "Unknown"
                                  : tx.studentId) ||
                                "Unknown"}
                            </p>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-900">
                            ₹{tx.amount?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 font-medium text-purple-600">
                            ₹
                            {tx.platformFee
                              ? tx.platformFee.toLocaleString()
                              : "0"}
                          </td>
                          <td className="px-6 py-4">
                            {tx.status === "success" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Captured
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {new Date(tx.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              },
                            )}
                          </td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-8 text-center text-slate-400 text-xs"
                          >
                            No transactions found on the platform.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GLOBAL DIRECTORY */}
        {activeTab === "revenue" && (
          <div className="mt-6 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            {/*
              PER-ACADEMY BOOKS, beside the platform-wide numbers above.

              Renders the SAME FinanceDashboard an owner sees on their own Fees
              tab, scoped by academyId. Reusing it rather than building a second
              finance screen means "collection rate" and "outstanding" are
              computed once — two implementations that drift apart is how a
              finance screen stops being trusted, and a platform admin
              comparing their number against an owner's is the exact moment
              that would surface.
            */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Per-academy books
                </h3>
                <p className="text-xs text-slate-500">
                  The same view the academy&rsquo;s own owner sees — their
                  share, their defaulters, their collection rate.
                </p>
              </div>
              <select
                value={financeAcademyId ?? ""}
                onChange={(e) => setFinanceAcademyId(e.target.value || null)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700"
              >
                <option value="">Select an academy…</option>
                {academies.map((a: any) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {financeAcademyId ? (
              <FinanceDashboard
                key={financeAcademyId}
                academyId={financeAcademyId}
                title={
                  academies.find((a: any) => a._id === financeAcademyId)
                    ?.name ?? "Academy finances"
                }
              />
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                <p className="text-sm font-medium text-slate-600">
                  Pick an academy to see its books
                </p>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-400">
                  Nothing is loaded until you choose one — a full financial
                  aggregation per academy is not something to run for every
                  tenant on page load.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Master Athlete & User Directory
                </h3>
                <p className="text-xs text-slate-500">
                  Cross-tenant lookup for students, trainers, and academy
                  administrators.
                </p>
              </div>
              <Button
                onClick={fetchUsers}
                disabled={isUsersLoading}
                variant="outline"
                size="sm"
                className="h-8 text-xs"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 mr-1 ${isUsersLoading ? "animate-spin" : ""}`}
                />
                Refresh Directory
              </Button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden mt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-3.5">User</th>
                      <th className="px-6 py-3.5">Role</th>
                      <th className="px-6 py-3.5">Contact</th>
                      <th className="px-6 py-3.5">Tenant / Academy</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {users.map((u) => (
                      <tr
                        key={u._id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">
                            {u.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            ID: {u._id.substring(0, 8)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider
                            ${
                              u.role === "gwd_super_admin"
                                ? "bg-purple-100 text-purple-700"
                                : u.role === "academy_admin"
                                  ? "bg-blue-100 text-blue-700"
                                  : u.role === "trainer"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {u.role.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-slate-700">{u.email}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {u.phone || "N/A"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-700">
                            {u.academyId
                              ? academies.find(
                                  (a) =>
                                    a._id ===
                                    (typeof u.academyId === "object"
                                      ? u.academyId._id
                                      : u.academyId),
                                )?.name || "Unknown"
                              : "Global"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && !isUsersLoading && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-8 text-center text-slate-400 text-xs"
                        >
                          No users found in directory.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SYSTEM HEALTH */}
        {activeTab === "comms" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <CommunicationCenter />
          </div>
        )}

        {activeTab === "health" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">
                System Infrastructure
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500">Database Engine:</span>
                  <span className="font-semibold text-slate-900">
                    MongoDB Local
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500">Payment Gateway:</span>
                  <span className="font-semibold text-slate-900">
                    Razorpay API v2
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Platform Settings
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500">
                    New Tenant Registrations:
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[11px] font-medium">
                    Enabled
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* DEPLOY NEW ACADEMY APPLE MODAL */}
      <AnimatePresence>
        {isDeployModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    Deploy New Academy
                  </h3>
                  <p className="text-xs text-slate-500">
                    Provision a new isolated tenant environment
                  </p>
                </div>
                <button
                  onClick={() => setIsDeployModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={handleDeployAcademy}
                className="space-y-4 text-xs font-sans"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-600 mb-1 block">
                      Academy Name
                    </Label>
                    <Input
                      placeholder="e.g. Metro Sports Academy"
                      value={newAcademy.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        const slug = name
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-|-$/g, "");
                        setNewAcademy({ ...newAcademy, name, slug });
                      }}
                      className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-slate-600 mb-1 block">
                      Route Slug (/[slug])
                    </Label>
                    <Input
                      placeholder="e.g. metro-sports"
                      value={newAcademy.slug}
                      onChange={(e) =>
                        setNewAcademy({ ...newAcademy, slug: e.target.value })
                      }
                      className="bg-slate-50 border-slate-200 text-blue-600 font-mono rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-600 mb-1 block">
                      Location / City
                    </Label>
                    <Input
                      placeholder="e.g. Hyderabad, TS"
                      value={newAcademy.location}
                      onChange={(e) =>
                        setNewAcademy({
                          ...newAcademy,
                          location: e.target.value,
                        })
                      }
                      className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-600 mb-1 block">
                      Capacity Limit
                    </Label>
                    <Input
                      type="number"
                      placeholder="500"
                      value={newAcademy.capacity}
                      onChange={(e) =>
                        setNewAcademy({
                          ...newAcademy,
                          capacity: parseInt(e.target.value),
                        })
                      }
                      className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-blue-600 mb-2">
                    Initial Admin Account Credentials
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-600 mb-1 block">
                        Admin Full Name
                      </Label>
                      <Input
                        placeholder="e.g. Rahul Sharma"
                        value={newAcademy.adminName}
                        onChange={(e) =>
                          setNewAcademy({
                            ...newAcademy,
                            adminName: e.target.value,
                          })
                        }
                        className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-slate-600 mb-1 block">
                        Admin Phone
                      </Label>
                      <Input
                        type="tel"
                        placeholder="+919876543210"
                        value={newAcademy.adminPhone}
                        onChange={(e) =>
                          setNewAcademy({
                            ...newAcademy,
                            adminPhone: e.target.value,
                          })
                        }
                        className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-slate-600 mb-1 block">
                        Admin Email
                      </Label>
                      <Input
                        type="email"
                        placeholder="admin@academy.com"
                        value={newAcademy.adminEmail}
                        onChange={(e) =>
                          setNewAcademy({
                            ...newAcademy,
                            adminEmail: e.target.value,
                          })
                        }
                        className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-slate-600 mb-1 block">
                        Admin Password
                      </Label>
                      <Input
                        type="password"
                        placeholder="GwdAdmin123!"
                        value={newAcademy.adminPassword}
                        onChange={(e) =>
                          setNewAcademy({
                            ...newAcademy,
                            adminPassword: e.target.value,
                          })
                        }
                        className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-emerald-600 mb-2">
                    📍 Ecosystem Map & Leaderboard
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-600 mb-1 block">
                        Latitude
                      </Label>
                      <Input
                        type="number"
                        step="0.0001"
                        placeholder="e.g. 17.4485"
                        value={newAcademy.coordinatesLat || ""}
                        onChange={(e) =>
                          setNewAcademy({
                            ...newAcademy,
                            coordinatesLat:
                              parseFloat(e.target.value) || undefined,
                          })
                        }
                        className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl font-mono text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-600 mb-1 block">
                        Longitude
                      </Label>
                      <Input
                        type="number"
                        step="0.0001"
                        placeholder="e.g. 78.3908"
                        value={newAcademy.coordinatesLng || ""}
                        onChange={(e) =>
                          setNewAcademy({
                            ...newAcademy,
                            coordinatesLng:
                              parseFloat(e.target.value) || undefined,
                          })
                        }
                        className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl font-mono text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-600 mb-1 block">
                        Ecosystem Score (0-100)
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="50"
                        value={newAcademy.ecosystemScore || ""}
                        onChange={(e) =>
                          setNewAcademy({
                            ...newAcademy,
                            ecosystemScore: parseInt(e.target.value) || 0,
                          })
                        }
                        className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-600 mb-1 block">
                        Head Coach Name
                      </Label>
                      <Input
                        placeholder="e.g. Coach Lucky Rao"
                        value={newAcademy.coachName || ""}
                        onChange={(e) =>
                          setNewAcademy({
                            ...newAcademy,
                            coachName: e.target.value,
                          })
                        }
                        className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <Label className="text-slate-600 mb-1 block">
                        Verification Status
                      </Label>
                      <select
                        value={newAcademy.verificationStatus || "pending"}
                        onChange={(e) =>
                          setNewAcademy({
                            ...newAcademy,
                            verificationStatus: e.target.value as any,
                          })
                        }
                        className="w-full h-9 px-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs"
                      >
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="founding">GWD Founding</option>
                      </select>
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newAcademy.gwdFoundingAcademy || false}
                          onChange={(e) =>
                            setNewAcademy({
                              ...newAcademy,
                              gwdFoundingAcademy: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-slate-300 text-blue-600"
                        />
                        <span className="text-xs text-slate-600 font-medium">
                          GWD Founding Academy Badge
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsDeployModalOpen(false)}
                    className="text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isDeploying}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium px-5"
                  >
                    {isDeploying ? "Deploying..." : "Deploy Academy"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* EDIT MAP PIN COORDINATES MODAL */}
        {editingCoordsAcademy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    Map Pin & Ecosystem Settings
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editingCoordsAcademy.name}
                  </p>
                </div>
                <button
                  onClick={() => setEditingCoordsAcademy(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">
                      Latitude (lat)
                    </label>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="e.g. 17.4485"
                      value={editLat}
                      onChange={(e) => setEditLat(e.target.value)}
                      className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">
                      Longitude (lng)
                    </label>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="e.g. 78.3908"
                      value={editLng}
                      onChange={(e) => setEditLng(e.target.value)}
                      className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">
                      Ecosystem Score (0-100)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={editScore}
                      onChange={(e) =>
                        setEditScore(parseInt(e.target.value) || 0)
                      }
                      className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">
                      Verification Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs font-medium"
                    >
                      <option value="pending">Pending</option>
                      <option value="verified">Verified</option>
                      <option value="founding">GWD Founding</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">
                    Public Achievements (comma-separated)
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. District Semifinalist, State Champions 2024"
                    value={editAchievements}
                    onChange={(e) => setEditAchievements(e.target.value)}
                    className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl text-xs"
                  />
                </div>

                {/*
                  Head coach, established year, star players and teams — the
                  same editor the academy owner uses in their own settings, so
                  GWD and the owner are never editing two different shapes of
                  the same map profile.
                */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <EcosystemProfileEditor
                    value={editEcosystem}
                    onChange={setEditEcosystem}
                    disabled={isSavingCoords}
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <input
                      type="checkbox"
                      checked={editFounding}
                      onChange={(e) => setEditFounding(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600"
                    />
                    <span className="text-xs text-slate-700 font-semibold">
                      GWD Founding Member Badge
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingCoordsAcademy(null)}
                  className="text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveCoords}
                  disabled={isSavingCoords}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium px-5"
                >
                  {isSavingCoords ? "Saving..." : "Save Pin Coordinates"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {insightsFor && (
        <AcademyInsightsPanel
          academyId={insightsFor.id}
          academyName={insightsFor.name}
          onClose={() => setInsightsFor(null)}
        />
      )}
    </div>
  );
}
