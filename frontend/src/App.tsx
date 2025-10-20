import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAppDispatch } from "@/store";
import { clearError } from "@/store/slices/authSlice";

// Pages
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminPage from "@/pages/admin/AdminPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import LandingPage from "@/pages/LandingPage";

// Section Pages
import MGRLPage from "./pages/sections/MGRL/page";
import GalaxyEventsPage from "./pages/sections/GalaxyEvents/page";
import MGBCPage from "./pages/sections/MGBC/page";
import MGFCPage from "./pages/sections/MGFC/page";
import MgMunPage from "./pages/sections/MgMun/page";

const AppRouter: React.FC = () => {
  const dispatch = useAppDispatch();

  // Clear errors when navigating to a new route
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />

      {/* Programs Section - Main endpoint with sub-pages */}
      <Route path="/programs">
        <Route path="events" element={<GalaxyEventsPage />} />
        <Route path="basketball" element={<MGBCPage />} />
        <Route path="football" element={<MGFCPage />} />
        <Route path="mun" element={<MgMunPage />} />
        <Route path="racing-league" element={<MGRLPage />} />
      </Route>

      {/* Admin routes */}
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
