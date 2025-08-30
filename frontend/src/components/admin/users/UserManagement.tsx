import React, { useState, useEffect } from 'react';
import { UserTable } from './UserTable';
import { UserForm } from './UserForm';
import { UserDetails } from './UserDetails';
import { UserStats } from './UserStats';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { User, UserFilters, UserFormData, UserUpdateData } from '@/types';
import { userService } from '@/services/userService';
import { UserPlus, BarChart3, Table } from 'lucide-react';
import { toast } from 'sonner';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // Fetch users based on filters
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await userService.getAllUsers(filters);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error: any) {
      toast.error('Failed to fetch users', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user statistics
  const fetchStats = async () => {
    setIsStatsLoading(true);
    try {
      const response = await userService.getUserStats();
      setStats(response.data);
    } catch (error: any) {
      toast.error('Failed to fetch user statistics', {
        description: error.message
      });
    } finally {
      setIsStatsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Fetch stats when stats view is toggled on
  useEffect(() => {
    if (showStats && !stats) {
      fetchStats();
    }
  }, [showStats, stats]);

  // Handle create/update user
  const handleUserSubmit = async (data: UserFormData) => {
    setIsLoading(true);
    try {
      if (selectedUser) {
        // Update existing user
        await userService.updateUser(selectedUser._id, data as UserUpdateData);
        toast.success('User updated successfully');
      } else {
        // Create new user
        await userService.createUser(data);
        toast.success('User created successfully');
      }
      
      setShowForm(false);
      setSelectedUser(null);
      fetchUsers(); // Refresh user list
    } catch (error: any) {
      toast.error(selectedUser ? 'Failed to update user' : 'Failed to create user', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsLoading(true);
    try {
      await userService.deleteUser(userToDelete);
      toast.success('User deleted successfully');
      fetchUsers(); // Refresh user list
    } catch (error: any) {
      toast.error('Failed to delete user', {
        description: error.message
      });
    } finally {
      setUserToDelete(null);
      setIsLoading(false);
    }
  };

  // Handle toggle user status
  const handleToggleUserStatus = async (userId: string) => {
    setIsLoading(true);
    try {
      await userService.toggleUserStatus(userId);
      toast.success('User status updated successfully');
      fetchUsers(); // Refresh user list
    } catch (error: any) {
      toast.error('Failed to update user status', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle view user details
  const handleViewUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const response = await userService.getUserById(userId);
      setSelectedUser(response.data.user);
      setShowDetails(true);
    } catch (error: any) {
      toast.error('Failed to fetch user details', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit user
  const handleEditUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const response = await userService.getUserById(userId);
      setSelectedUser(response.data.user);
      setShowForm(true);
      setShowDetails(false);
    } catch (error: any) {
      toast.error('Failed to fetch user details', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <h2 className="text-2xl font-bold">User Management</h2>
        
        <div className="flex gap-2">
          <Button
            variant={showStats ? "default" : "outline"}
            onClick={() => setShowStats(!showStats)}
            className="gap-1"
          >
            <BarChart3 className="h-4 w-4" />
            {showStats ? "Hide" : "View"} Statistics
          </Button>
          
          <Button onClick={() => {
            setSelectedUser(null);
            setShowForm(true);
          }} className="gap-1">
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Statistics Section */}
      {showStats && (
        <UserStats stats={stats} isLoading={isStatsLoading} />
      )}

      {/* User Table */}
      <UserTable 
        users={users}
        isLoading={isLoading}
        onViewUser={handleViewUser}
        onEditUser={handleEditUser}
        onDeleteUser={(userId) => setUserToDelete(userId)}
        onToggleUserStatus={handleToggleUserStatus}
        onFilterChange={setFilters}
        currentFilters={filters}
        pagination={pagination}
        onPageChange={(page) => setFilters({...filters, page})}
      />

      {/* User Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => {
        if (!open) setSelectedUser(null);
        setShowForm(open);
      }}>
        <DialogContent className="sm:max-w-2xl">
          <UserForm 
            user={selectedUser || undefined}
            onSubmit={handleUserSubmit}
            isLoading={isLoading}
            onCancel={() => {
              setShowForm(false);
              setSelectedUser(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={showDetails} onOpenChange={(open) => {
        setShowDetails(open);
        if (!open) setSelectedUser(null);
      }}>
        <DialogContent className="sm:max-w-2xl">
          {selectedUser && (
            <UserDetails 
              user={selectedUser}
              onClose={() => setShowDetails(false)}
              onEdit={() => {
                setShowDetails(false);
                setShowForm(true);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => {
        if (!open) setUserToDelete(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};