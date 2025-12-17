import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAppDispatch } from "@/store";
import { clearError } from "@/store/slices/authSlice";

// Admin Pages
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminPage from "@/pages/admin/AdminPage";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";

// User Pages
import UserAuth from "@/pages/user/UserAuth";
import UserProfile from "@/pages/user/UserProfile";
import { UserProtectedRoute } from "@/components/auth/UserProtectedRoute";

// Event Pages
import MyEventsPage from "@/pages/events/MyEventsPage";
import EventPage from "@/pages/events/EventPage";
import EventDetailsPage from "@/pages/events/EventDetailsPage";

// Public Pages
import LandingPage from "@/pages/LandingPage";

// Section Pages
import MGRLPage from "@/pages/sections/MGRL/page";
import GalaxyEventsPage from "@/pages/sections/GalaxyEvents/page";
import MGBCPage from "@/pages/sections/MGBC/page";
import MGFCPage from "@/pages/sections/MGFC/page";
import MgMunPage from "@/pages/sections/MgMun/page";

// MGFC Sub-Pages
import MGFCStudentPage from "@/pages/sections/MGFC/student/StudentPage";
import MGFCTrainerPage from "@/pages/sections/MGFC/trainer/TrainerPage";
import StudentRegister from "@/pages/sections/MGFC/student/StudentAuth";
import StudentCreate from "@/pages/sections/MGFC/student/StudentCreate";
import StudentComplete from "@/pages/sections/MGFC/student/StudentComplete";
// Static pages
import NotFoundPage from "@/pages/static/NotFound";
import ContactPage from "@/pages/static/Contact";
import AboutPage from "@/pages/static/About";
import PrivacyPolicyPage from "@/pages/static/PrivacyPolicy";
import TermsAndConditionsPage from "@/pages/static/TermsAndConditions";

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

      {/* Public routes */}
      <Route path="/events" element={<EventPage />} />
      <Route path="/events/:eventId" element={<EventDetailsPage />} />

      {/* Programs Section - Main endpoint with sub-pages */}
      <Route path="/programs">
        <Route path="galaxy-events" element={<GalaxyEventsPage />} />
        <Route path="basketball" element={<MGBCPage />} />
        <Route path="football" element={<MGFCPage />} />
        <Route path="mun" element={<MgMunPage />} />
        <Route path="racing-league" element={<MGRLPage />} />
      </Route>

      {/* MGFC Section */}
      <Route path="/mgfc">
        <Route path="student" element={<MGFCStudentPage />} />
        <Route path="student/register" element={<StudentRegister />} />
        <Route path="student/register/create" element={<StudentCreate />} />
        <Route path="student/register/complete" element={<StudentComplete />} />
        <Route path="trainer" element={<MGFCTrainerPage />} />
      </Route>

      {/* User routes */}
      <Route path="/user/auth" element={<UserAuth />} />

      {/* Protected user routes */}
      <Route
        path="/user/profile"
        element={
          <UserProtectedRoute>
            <UserProfile />
          </UserProtectedRoute>
        }
      />
      <Route
        path="/events/my-events"
        element={
          <UserProtectedRoute>
            <MyEventsPage />
          </UserProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Protected admin routes */}
      <Route
        path="/admin/*"
        element={
          <AdminProtectedRoute>
            <Routes>
              <Route path="dashboard" element={<AdminPage />} />
              <Route
                path="*"
                element={<Navigate to="/admin/dashboard" replace />}
              />
            </Routes>
          </AdminProtectedRoute>
        }
      />

      <Route path="/not-found" element={<NotFoundPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route
        path="/terms-and-conditions"
        element={<TermsAndConditionsPage />}
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
};

export default AppRouter;
