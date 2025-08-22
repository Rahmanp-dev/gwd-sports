import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppDispatch, useAppSelector } from '@/store';
import { setActiveTab } from '@/store/slices/uiSlice';

// Tab Components
import StudentsTab from '@/components/admin/students/StudentsTab';
// import TrainersTab from '@/components/admin/trainers/TrainersTab';
// import AcademiesTab from '@/components/admin/academies/AcademiesTab';
// import UsersTab from '@/components/admin/users/UsersTab';
import AdminDashboard from '@/components/admin/dashboard/AdminDashboard';

const AdminPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { activeTab } = useAppSelector((state) => state.ui);

  const handleTabChange = (value: string) => {
    dispatch(setActiveTab(value));
  };

  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/login" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/panel" element={
          <div className="space-y-6">
            {/* Page Header */}
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Management Panel
              </h1>
              <p className="text-gray-600 mt-1">
                Manage all aspects of your sports academy system
              </p>
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:grid-cols-4">
                <TabsTrigger 
                  value="students" 
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <span className="hidden sm:inline">👨‍🎓</span>
                  Students
                </TabsTrigger>
                <TabsTrigger 
                  value="trainers" 
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <span className="hidden sm:inline">🏃‍♂️</span>
                  Trainers
                </TabsTrigger>
                <TabsTrigger 
                  value="academies" 
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <span className="hidden sm:inline">🏫</span>
                  Academies
                </TabsTrigger>
                <TabsTrigger 
                  value="users" 
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <span className="hidden sm:inline">👥</span>
                  Users
                </TabsTrigger>
              </TabsList>

              <TabsContent value="students" className="space-y-6">
                <StudentsTab />
              </TabsContent>

                {/* 
              <TabsContent value="trainers" className="space-y-6">
                <TrainersTab />
              </TabsContent>

              <TabsContent value="academies" className="space-y-6">
                <AcademiesTab />
              </TabsContent>

              <TabsContent value="users" className="space-y-6">
                <UsersTab />
              </TabsContent>
               */}
            </Tabs>
          </div>
        } />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminPanel;