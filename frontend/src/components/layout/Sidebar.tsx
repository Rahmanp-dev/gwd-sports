import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/utils/helpers';
import { useAppSelector, useAppDispatch } from '@/store';
import { setSidebarCollapsed } from '@/store/slices/uiSlice';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { APP_NAME } from '@/utils/constants';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: '📊',
    description: 'Overview & Analytics'
  },
  {
    name: 'Management Panel',
    href: '/admin/panel',
    icon: '⚙️',
    description: 'Manage Students, Trainers & More'
  },
  {
    name: 'Students',
    href: '/admin/panel?tab=students',
    icon: '👨‍🎓',
    description: 'Student Management'
  },
  {
    name: 'Trainers',
    href: '/admin/panel?tab=trainers',
    icon: '🏃‍♂️',
    description: 'Trainer Management'
  },
  {
    name: 'Academies',
    href: '/admin/panel?tab=academies',
    icon: '🏫',
    description: 'Academy Management'
  },
  {
    name: 'Users',
    href: '/admin/panel?tab=users',
    icon: '👥',
    description: 'User Management'
  },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { sidebarCollapsed } = useAppSelector((state) => state.ui);

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href.split('?')[0]);
  };

  return (
    <>
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0",
        sidebarCollapsed ? "-translate-x-full" : "translate-x-0"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900 truncate">
            {APP_NAME}
          </h1>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => dispatch(setSidebarCollapsed(true))}
          >
            ✕
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors",
                "hover:bg-gray-100 hover:text-gray-900",
                isActive(item.href)
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-700"
              )}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  dispatch(setSidebarCollapsed(true));
                }
              }}
            >
              <span className="text-lg mr-3" role="img" aria-label={item.name}>
                {item.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{item.name}</div>
                <div className="text-xs text-gray-500 truncate">
                  {item.description}
                </div>
              </div>
            </Link>
          ))}
        </nav>

        <Separator />

        {/* Footer */}
        <div className="p-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 text-center">
              Admin Panel v1.0<br />
              © 2024 MasterGrade
            </p>
          </div>
        </div>
      </div>
    </>
  );
};