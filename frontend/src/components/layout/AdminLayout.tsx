import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppSelector, useAppDispatch } from '@/store';
import { setSidebarCollapsed } from '@/store/slices/uiSlice';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { sidebarCollapsed } = useAppSelector((state) => state.ui);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        dispatch(setSidebarCollapsed(true));
      } else {
        dispatch(setSidebarCollapsed(false));
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => dispatch(setSidebarCollapsed(true))}
        />
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className={`transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-64'
      }`}>
        <Header />
        
        <main className="p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};