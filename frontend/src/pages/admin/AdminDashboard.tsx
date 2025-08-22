import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAppSelector, useAppDispatch } from '@/store';
import { setActiveTab } from '@/store/slices/uiSlice';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/utils/helpers';

// Mock service for dashboard stats (replace with actual service)
const dashboardService = {
  getStats: async () => ({
    success: true,
    data: {
      totalStudents: 1245,
      activeStudents: 1120,
      totalTrainers: 85,
      activeTrainers: 78,
      totalAcademies: 12,
      totalUsers: 2156,
      totalRevenue: 125000,
      monthlyRevenue: 15000,
      recentActivities: [
        {
          id: '1',
          type: 'student_enrolled',
          message: 'John Doe enrolled in Basketball Academy',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'trainer_joined',
          message: 'Sarah Wilson joined as Tennis trainer',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          type: 'academy_created',
          message: 'New Swimming Academy created',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: '4',
          type: 'payment_received',
          message: 'Monthly payment received from Elite Sports',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
        },
      ],
    },
  }),
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
  });

  const handleNavigateToTab = (tab: string) => {
    dispatch(setActiveTab(tab));
    navigate('/admin/panel');
  };

  const stats = statsData?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-blue-100">
          Here's what's happening in your sports academy management system today.
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Students Stats */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleNavigateToTab('students')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalStudents || 0}</p>
                <p className="text-sm text-green-600">
                  {stats?.activeStudents || 0} active
                </p>
              </div>
              <div className="text-4xl">👨‍🎓</div>
            </div>
          </CardContent>
        </Card>

        {/* Trainers Stats */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleNavigateToTab('trainers')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Trainers</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalTrainers || 0}</p>
                <p className="text-sm text-green-600">
                  {stats?.activeTrainers || 0} active
                </p>
              </div>
              <div className="text-4xl">🏃‍♂️</div>
            </div>
          </CardContent>
        </Card>

        {/* Academies Stats */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleNavigateToTab('academies')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Academies</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalAcademies || 0}</p>
                <p className="text-sm text-blue-600">
                  Active & Running
                </p>
              </div>
              <div className="text-4xl">🏫</div>
            </div>
          </CardContent>
        </Card>

        {/* Users Stats */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleNavigateToTab('users')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                <p className="text-sm text-purple-600">
                  All Roles
                </p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💰 Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatCurrency(stats?.totalRevenue || 0)}
            </div>
            <p className="text-sm text-gray-600">
              All-time revenue from academy operations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {formatCurrency(stats?.monthlyRevenue || 0)}
            </div>
            <p className="text-sm text-gray-600">
              Revenue generated this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              onClick={() => handleNavigateToTab('students')} 
              className="h-16 flex flex-col gap-1"
              variant="outline"
            >
              <span className="text-2xl">👨‍🎓</span>
              <span>Manage Students</span>
            </Button>
            <Button 
              onClick={() => handleNavigateToTab('trainers')} 
              className="h-16 flex flex-col gap-1"
              variant="outline"
            >
              <span className="text-2xl">🏃‍♂️</span>
              <span>Manage Trainers</span>
            </Button>
            <Button 
              onClick={() => handleNavigateToTab('academies')} 
              className="h-16 flex flex-col gap-1"
              variant="outline"
            >
              <span className="text-2xl">🏫</span>
              <span>Manage Academies</span>
            </Button>
            <Button 
              onClick={() => handleNavigateToTab('users')} 
              className="h-16 flex flex-col gap-1"
              variant="outline"
            >
              <span className="text-2xl">👥</span>
              <span>Manage Users</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recentActivities?.map((activity: any) => (
              <div key={activity.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {activity.type.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;