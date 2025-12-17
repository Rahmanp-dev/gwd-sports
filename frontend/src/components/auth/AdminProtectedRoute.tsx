import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({
  children,
}) => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  const { user } = useAppSelector((state) => state.auth);
  console.log(user);

  // Show nothing while checking auth
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (user?.role !== "admin" || !isAuthenticated) {
    return <Navigate to="/user/auth" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};
