import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store';
import { logoutUser } from '@/store/slices/authSlice';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getInitials, formatDateTime } from '@/utils/helpers';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { sidebarCollapsed } = useAppSelector((state) => state.ui);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/admin/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Menu toggle and breadcrumb */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch(toggleSidebar())}
            className="lg:hidden"
          >
            ☰
          </Button>
          
          <div className="hidden sm:block">
            <h2 className="text-lg font-semibold text-gray-900">
              Admin Dashboard
            </h2>
            <p className="text-sm text-gray-500">
              Welcome back, {user?.name}
            </p>
          </div>
        </div>

        {/* Right side - User menu */}
        <div className="flex items-center space-x-4">
          {/* Current time */}
          <div className="hidden md:block text-sm text-gray-500">
            {formatDateTime(new Date().toISOString())}
          </div>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-500 text-white">
                    {user ? getInitials(user.name) : 'AD'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                  <p className="text-xs leading-none text-blue-600 font-medium">
                    {user?.role?.toUpperCase()}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                📊 Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/admin/panel')}>
                ⚙️ Management Panel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600"
              >
                🔓 Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};