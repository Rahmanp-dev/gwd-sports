import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAppDispatch } from "@/store";
import { clearError } from "@/store/slices/authSlice";

// Pages
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminPage from "@/pages/admin/AdminPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const AppRouter: React.FC = () => {
  const dispatch = useAppDispatch();

  // Clear errors when navigating to a new route
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Protected admin routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <Routes>
              <Route path="dashboard" element={<AdminPage />} />
              <Route
                path="*"
                element={<Navigate to="/admin/dashboard" replace />}
              />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
