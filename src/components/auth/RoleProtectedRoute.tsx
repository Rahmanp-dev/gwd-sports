"use client";

import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "@/lib/router-shim";
import { useAppSelector } from "@/store";

export type AppRole = "student" | "trainer" | "admin" | "gwd_super_admin" | "user";

const ROLE_HOME: Record<string, string> = {
  student: "/mgfc/student",
  trainer: "/mgfc/trainer",
  admin: "/admin/dashboard",
  gwd_super_admin: "/admin/dashboard",
  user: "/user/profile",
};

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
}

export function RoleProtectedRoute({
  children,
  allowedRoles,
}: RoleProtectedRouteProps) {
  const [mounted, setMounted] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user, token } = useAppSelector((state) => state.auth);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-sm font-medium">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated || !token || !user) {
    return (
      <Navigate
        to="/user/auth"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  const role = user.role as AppRole;
  if (!allowedRoles.includes(role)) {
    const fallback = ROLE_HOME[role] || "/user/profile";
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}

export function getRoleHomePath(role?: string | null): string {
  if (!role) return "/user/auth";
  return ROLE_HOME[role] || "/user/profile";
}
