import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserStatsResponse } from '@/types';
import { Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale,
  PointElement,
  LineElement,
  Title
} from 'chart.js';
import { Users, UserCheck, UserMinus, UserPlus } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

interface UserStatsProps {
  stats: UserStatsResponse['data'];
  isLoading: boolean;
}

export const UserStats: React.FC<UserStatsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="h-40 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Prepare role distribution data
  const roleData = {
    labels: stats.usersByRole?.map(role => role._id.charAt(0).toUpperCase() + role._id.slice(1)) || [],
    datasets: [
      {
        data: stats.usersByRole?.map(role => role.count) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',   // Red for admin
          'rgba(54, 162, 235, 0.7)',   // Blue for trainer
          'rgba(75, 192, 192, 0.7)',   // Green for student
          'rgba(201, 203, 207, 0.7)'   // Grey for user
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(75, 192, 192)',
          'rgb(201, 203, 207)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const statusData = {
    labels: ['Active', 'Inactive'],
    datasets: [
      {
        data: [stats.activeUsers, stats.inactiveUsers],
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',   // Green for active
          'rgba(255, 159, 64, 0.7)',   // Orange for inactive
        ],
        borderColor: [
          'rgb(75, 192, 192)',
          'rgb(255, 159, 64)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground">All registered users</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeUsers}</div>
          <p className="text-xs text-muted-foreground">
            {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% of total users
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
          <UserMinus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.inactiveUsers}</div>
          <p className="text-xs text-muted-foreground">
            {Math.round((stats.inactiveUsers / stats.totalUsers) * 100)}% of total users
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">New This Month</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.newUsersThisMonth}</div>
          <p className="text-xs text-muted-foreground">
            {stats.newUsersThisMonth > 0 
              ? `+${Math.round((stats.newUsersThisMonth / stats.totalUsers) * 100)}% growth` 
              : 'No growth'}
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>User Roles Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex justify-center">
            <Doughnut 
              data={roleData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                  }
                }
              }} 
            />
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>User Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex justify-center">
            <Doughnut 
              data={statusData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                  }
                }
              }} 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};