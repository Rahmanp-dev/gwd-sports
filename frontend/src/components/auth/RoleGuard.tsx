import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/store';
import type { User } from '@/types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: User['role'][];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { user } = useAppSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!allowedRoles.includes(user.role as User['role'])) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};