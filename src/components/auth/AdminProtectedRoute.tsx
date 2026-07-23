"use client";
import React from "react";
import { Navigate, useLocation } from "@/lib/router-shim";
import { useAppSelector } from "@/store";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({
  children,
}) => {
  const [mounted, setMounted] = React.useState(false);
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Return consistent loading state during SSR and initial client hydration
  if (!mounted || isLoading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-sm font-medium">Loading...</div>;
  }

  if (user?.role !== "admin" || !isAuthenticated) {
    return (
      <Navigate to="/user/auth" state={{ from: location.pathname }} replace />
    );
  }

  return <>{children}</>;
};
