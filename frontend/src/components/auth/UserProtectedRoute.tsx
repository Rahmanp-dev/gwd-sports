import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/store";

interface UserProtectedRouteProps {
  children: React.ReactNode;
}

export const UserProtectedRoute = ({ children }: UserProtectedRouteProps) => {
  const { isAuthenticated, user, token } = useAppSelector((state) => state.auth);

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