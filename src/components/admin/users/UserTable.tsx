"use client";
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User, UserFilters } from "@/types";
import { formatDate } from "@/utils/helpers";
import {
  Edit,
  MoreHorizontal,
  Search,
  Trash2,
  UserCheck,
  UserX,
  Eye,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  onViewUser: (userId: string) => void;
  onEditUser: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  onToggleUserStatus: (userId: string) => void;
  onFilterChange: (filters: UserFilters) => void;
  currentFilters: UserFilters;
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  onPageChange: (page: number) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading,
  onViewUser,
  onEditUser,
  onDeleteUser,
  onToggleUserStatus,
  onFilterChange,
  currentFilters,
  pagination,
  onPageChange,
}) => {
  const [searchTerm, setSearchTerm] = useState(currentFilters.search || "");

  // Debounced search effect - real-time search with 300ms delay
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onFilterChange({
        ...currentFilters,
        search: searchTerm || undefined,
        page: 1,
      });
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleRoleFilter = (role: string | null) => {
    onFilterChange({
      ...currentFilters,
      role: (role as any) || undefined,
      page: 1,
    });
  };

  const handleStatusFilter = (isActive: boolean | null) => {
    onFilterChange({
      ...currentFilters,
      isActive: isActive === null ? undefined : isActive,
      page: 1,
    });
  };

  const handleSort = (field: string) => {
    const sortOrder =
      currentFilters.sortBy === field && currentFilters.sortOrder === "asc"
        ? "desc"
        : "asc";

    onFilterChange({
      ...currentFilters,
      sortBy: field,
      sortOrder,
    });
  };

  const getSortIcon = (field: string) => {
    if (currentFilters.sortBy !== field) {
      return <ChevronsUpDown className="h-4 w-4 text-slate-400" />;
    }

    return currentFilters.sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4 text-blue-600" />
    ) : (
      <ChevronDown className="h-4 w-4 text-blue-600" />
    );
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500 hover:bg-red-600";
      case "trainer":
        return "bg-blue-500 hover:bg-blue-600";
      case "student":
        return "bg-green-500 hover:bg-green-600";
      default:
        return "bg-slate-500 hover:bg-slate-600";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        {/* Search Bar - Real-time search */}
        <div className="flex w-full md:w-1/2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Role: {currentFilters.role || "All"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleRoleFilter(null)}>
                All Roles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRoleFilter("admin")}>
                Admin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRoleFilter("trainer")}>
                Trainer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRoleFilter("student")}>
                Student
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRoleFilter("user")}>
                User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Status:{" "}
                {currentFilters.isActive === undefined
                  ? "All"
                  : currentFilters.isActive
                    ? "Active"
                    : "Inactive"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleStatusFilter(null)}>
                All Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusFilter(true)}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusFilter(false)}>
                Inactive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableCaption>
            {isLoading ? "Loading users..." : `Showing ${users.length} users`}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead
                className="w-[180px] cursor-pointer hover:bg-slate-50 select-none"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-2">
                  Name
                  {getSortIcon("name")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-slate-50 select-none"
                onClick={() => handleSort("email")}
              >
                <div className="flex items-center gap-2">
                  Email
                  {getSortIcon("email")}
                </div>
              </TableHead>
              <TableHead className="hidden md:table-cell">Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead
                className="hidden md:table-cell cursor-pointer hover:bg-slate-50 select-none"
                onClick={() => handleSort("createdAt")}
              >
                <div className="flex items-center gap-2">
                  Created
                  {getSortIcon("createdAt")}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  {searchTerm ||
                  currentFilters.role ||
                  currentFilters.isActive !== undefined
                    ? "No users found matching your search criteria."
                    : "No users found."}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {user.phone || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={user.isActive ? "default" : "outline"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onViewUser(user._id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditUser(user._id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onToggleUserStatus(user._id)}
                        >
                          {user.isActive ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteUser(user._id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center md:justify-between mt-4">
        <div className="hidden md:block text-sm text-muted-foreground">
          Page {pagination.currentPage} of {pagination.totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
