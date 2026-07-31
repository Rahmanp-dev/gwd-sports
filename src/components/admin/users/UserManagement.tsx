"use client";
import React, { useState, useEffect, useCallback } from "react";
import { UserTable } from "./UserTable";
import { UserForm } from "./UserForm";
import { UserDetails } from "./UserDetails";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { User, UserFilters, UserFormData, UserUpdateData } from "@/types";
import { userService } from "@/services/userService";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Enhanced error extraction function
  const extractErrorMessage = (error: any): string => {
    console.log("Full error object:", error);

    // Try to get the actual error response
    const response = error?.response || error;
    const data = response?.data || response;

    // Check if it's a validation error with specific field errors
    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      const firstError = data.errors[0];

      // Return the specific validation message
      if (firstError?.message) {
        return firstError.message;
      }

      // Fallback to constructing message from error details
      if (firstError?.path && firstError?.code) {
        const fieldName = Array.isArray(firstError.path)
          ? firstError.path[firstError.path.length - 1]
          : firstError.path;
        return `Invalid ${fieldName}: ${firstError.code}`;
      }
    }

    // Check for general error message in various formats
    if (data?.message && data.message !== "Invalid request data") {
      return data.message;
    }

    // Check error message in different locations
    if (error?.message && error.message !== "Invalid request data") {
      return error.message;
    }

    // Last resort - return a generic message
    return "An unexpected error occurred. Please check your input and try again.";
  };

  // Fetch users based on filters
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await userService.getAllUsers(filters);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      toast.error("Failed to fetch users", {
        description: errorMessage,
        style: {
          background: "#fef2f2",
          borderColor: "#fecaca",
          color: "#991b1b",
        },
        className: "border-l-4 border-l-red-500",
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle create/update user
  const handleUserSubmit = async (data: UserFormData) => {
    setIsLoading(true);
    try {
      if (selectedUser) {
        const res: any = await userService.updateUser(
          selectedUser._id,
          data as UserUpdateData,
        );

        /**
         * Changing a phone number does not only touch the account — it moves
         * the enrolment record and every Sports Passport that number is the
         * parent on, because attendance confirmations, fee reminders and the
         * passport's unique identity key all read their own copy of it. The
         * API reports what it moved; showing that is the difference between
         * an admin trusting the change went through everywhere and quietly
         * wondering whether they now have to fix the passport by hand.
         */
        const propagated: string[] = res?.data?.propagated ?? [];
        const alsoSynced = propagated.filter((p) => p !== "account");

        toast.success("User updated successfully", {
          description:
            alsoSynced.length > 0
              ? `Also synced across ${alsoSynced.join(" and ")}.`
              : "The user information has been updated.",
          style: {
            background: "#f0fdf4",
            borderColor: "#bbf7d0",
            color: "#166534",
          },
          className: "border-l-4 border-l-green-500",
        });

        // Fields the server refused for this role — silently dropping them is
        // how "I changed it and it didn't save" reports start.
        const ignored: string[] = res?.data?.ignoredFields ?? [];
        if (ignored.length > 0) {
          toast.warning(`Not changed: ${ignored.join(", ")}`, {
            description:
              "Your role cannot edit those fields. Everything else was saved.",
          });
        }
      } else {
        // Create new user
        await userService.createUser(data);
        toast.success("User created successfully", {
          description: "The new user has been added to the system.",
          style: {
            background: "#f0fdf4",
            borderColor: "#bbf7d0",
            color: "#166534",
          },
          className: "border-l-4 border-l-green-500",
        });
      }

      setShowForm(false);
      setSelectedUser(null);
      fetchUsers(); // Refresh user list
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      toast.error(
        selectedUser ? "Failed to update user" : "Failed to create user",
        {
          description: errorMessage,
          style: {
            background: "#fef2f2",
            borderColor: "#fecaca",
            color: "#991b1b",
          },
          className: "border-l-4 border-l-red-500",
        },
      );
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
      toast.success("User deleted successfully", {
        description: "The user has been permanently removed from the system.",
        style: {
          background: "#f0fdf4",
          borderColor: "#bbf7d0",
          color: "#166534",
        },
        className: "border-l-4 border-l-green-500",
      });
      fetchUsers(); // Refresh user list
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      toast.error("Failed to delete user", {
        description: errorMessage,
        style: {
          background: "#fef2f2",
          borderColor: "#fecaca",
          color: "#991b1b",
        },
        className: "border-l-4 border-l-red-500",
      });
    } finally {
      setUserToDelete(null);
      setIsLoading(false);
    }
  };

  // Handle toggle user status
  const handleToggleUserStatus = async (userId: string) => {
    try {
      await userService.toggleUserStatus(userId);
      toast.success("User status updated successfully", {
        description: "The user status has been changed.",
        style: {
          background: "#f0fdf4",
          borderColor: "#bbf7d0",
          color: "#166534",
        },
        className: "border-l-4 border-l-green-500",
      });
      fetchUsers(); // Refresh user list
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      toast.error("Failed to update user status", {
        description: errorMessage,
        style: {
          background: "#fef2f2",
          borderColor: "#fecaca",
          color: "#991b1b",
        },
        className: "border-l-4 border-l-red-500",
      });
    }
  };

  // Handle view user details - NO LOADING for this action
  const handleViewUser = async (userId: string) => {
    try {
      const response = await userService.getUserById(userId);
      setSelectedUser(response.data.user);
      setShowDetails(true);
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      toast.error("Failed to fetch user details", {
        description: errorMessage,
        style: {
          background: "#fef2f2",
          borderColor: "#fecaca",
          color: "#991b1b",
        },
        className: "border-l-4 border-l-red-500",
      });
    }
  };

  // Handle edit user - NO LOADING for this action
  const handleEditUser = async (userId: string) => {
    try {
      const response = await userService.getUserById(userId);
      setSelectedUser(response.data.user);
      setShowForm(true);
      setShowDetails(false);
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      toast.error("Failed to fetch user details", {
        description: errorMessage,
        style: {
          background: "#fef2f2",
          borderColor: "#fecaca",
          color: "#991b1b",
        },
        className: "border-l-4 border-l-red-500",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <h2 className="text-2xl font-bold">User Management</h2>

        <div className="flex gap-2">
          <Button
            onClick={() => {
              setSelectedUser(null);
              setShowForm(true);
            }}
            className="gap-1"
          >
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

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
        onPageChange={(page) => setFilters({ ...filters, page })}
      />

      {/* User Form Dialog */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          if (!open) setSelectedUser(null);
          setShowForm(open);
        }}
      >
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
      <Dialog
        open={showDetails}
        onOpenChange={(open) => {
          setShowDetails(open);
          if (!open) setSelectedUser(null);
        }}
      >
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
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => {
          if (!open) setUserToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              user and remove their data from our servers.
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
