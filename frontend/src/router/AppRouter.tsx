import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { checkAuth } from '@/store/slices/authSlice';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleGuard } from '@/components/auth/RoleGuard';

// Pages
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminPanel from '@/pages/admin/AdminPanel';
import Home from '@/pages/public/Home';
import NotFound from '@/pages/public/NotFound';
import Unauthorized from '@/pages/errors/Unauthorized';

const AppRouter: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Check authentication status on app load
    dispatch(checkAuth());
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route 
          path="/admin/login" 
          element={
            isAuthenticated ? 
            <Navigate to="/admin/dashboard" replace /> : 
            <AdminLogin />
          } 
        />
        
        {/* Protected Admin Routes */}
        <Route path="/admin/*" element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['admin']}>
              <AdminPanel />
            </RoleGuard>
          </ProtectedRoute>
        } />

        {/* Error Routes */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;