"use client";
import React, { useState, useEffect } from "react";
import { Navigate } from "@/lib/router-shim";
import { useAppSelector } from "@/store";

interface UserProtectedRouteProps {
  children: React.ReactNode;
}

export const UserProtectedRoute = ({ children }: UserProtectedRouteProps) => {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, user, token } = useAppSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-sm font-medium">Loading...</div>;
  }

  // Check if user is authenticated and has a token
  if (!isAuthenticated || !token || !user) {
    return <Navigate to="/user/auth" replace />;
  }

  // Redirect admin users to admin dashboard
  if (user.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};
