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
import type { Student, StudentFilters } from "@/types";
import { formatDate } from "@/utils/helpers";
import {
  Edit,
  MoreHorizontal,
  Search,
  Eye,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Package,
  ClipboardCheck,
} from "lucide-react";
import { SPORTS_LIST } from "@/utils/constants";

interface StudentTableProps {
  students: Student[];
  isLoading: boolean;
  onViewStudent: (studentId: string) => void;
  onEditStudent: (studentId: string) => void;
  onEditKitStatus: (student: Student, kit: any) => void;
  /** Opens the coach toolkit — attendance, evaluations, passport records. */
  onCoachTools: (student: Student) => void;
  onFilterChange: (filters: StudentFilters) => void;
  currentFilters: StudentFilters;
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  onPageChange: (page: number) => void;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  isLoading,
  onViewStudent,
  onEditStudent,
  onEditKitStatus,
  onCoachTools,
  onFilterChange,
  currentFilters,
  pagination,
  onPageChange,
}) => {
  const [searchTerm, setSearchTerm] = useState(currentFilters.search || "");

  // Debounced search effect
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

  const handleSportFilter = (sport: string | null) => {
    onFilterChange({
      ...currentFilters,
      sport: sport || undefined,
      page: 1,
    });
  };

  const handleLevelFilter = (level: string | null) => {
    onFilterChange({
      ...currentFilters,
      level: (level as any) || undefined,
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

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-500 hover:bg-green-600";
      case "intermediate":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "advanced":
        return "bg-red-500 hover:bg-red-600";
      case "U12":
      case "U14":
      case "U16":
      case "U19":
      case "U23":
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "bg-slate-500 hover:bg-slate-600";
    }
  };

  const getFeeStatusBadgeColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500 hover:bg-green-600";
      case "pending":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "overdue":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-slate-500 hover:bg-slate-600";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        {/* Search Bar */}
        <div className="flex w-full md:w-1/2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by student name or email..."
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
                Sport: {currentFilters.sport || "All"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleSportFilter(null)}>
                All Sports
              </DropdownMenuItem>
              {SPORTS_LIST.map((sport) => (
                <DropdownMenuItem
                  key={sport}
                  onClick={() => handleSportFilter(sport)}
                >
                  {sport}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Level:{" "}
                {currentFilters.level
                  ? currentFilters.level.charAt(0).toUpperCase() +
                    currentFilters.level.slice(1)
                  : "All"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleLevelFilter(null)}>
                All Levels
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLevelFilter("beginner")}>
                Beginner
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleLevelFilter("intermediate")}
              >
                Intermediate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLevelFilter("advanced")}>
                Advanced
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLevelFilter("U12")}>
                U12
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLevelFilter("U14")}>
                U14
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLevelFilter("U16")}>
                U16
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLevelFilter("U19")}>
                U19
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLevelFilter("U23")}>
                U23
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
            {isLoading
              ? "Loading students..."
              : `Showing ${students.length} students`}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead
                className="w-[180px] cursor-pointer hover:bg-slate-50 select-none"
                onClick={() => handleSort("user.name")}
              >
                <div className="flex items-center gap-2">
                  Student Name
                  {getSortIcon("user.name")}
                </div>
              </TableHead>
              <TableHead className="hidden md:table-cell">Academy</TableHead>
              <TableHead className="hidden md:table-cell">Trainer</TableHead>
              <TableHead>Sport</TableHead>
              <TableHead>Level</TableHead>
              <TableHead className="hidden lg:table-cell">Fee Status</TableHead>
              <TableHead className="hidden md:table-cell">Kits</TableHead>
              <TableHead
                className="hidden md:table-cell cursor-pointer hover:bg-slate-50 select-none"
                onClick={() => handleSort("enrollmentDate")}
              >
                <div className="flex items-center gap-2">
                  Enrolled
                  {getSortIcon("enrollmentDate")}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center h-24">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center h-24">
                  {searchTerm ||
                  currentFilters.sport ||
                  currentFilters.level ||
                  currentFilters.isActive !== undefined
                    ? "No students found matching your search criteria."
                    : "No students found."}
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student._id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">
                    <div>
                      <div>{student.user?.name || "Unknown Student"}</div>
                      <div className="text-sm text-slate-500">
                        {student.user?.email || "No email"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div>
                      <div className="font-medium">
                        {student.academy?.name || "No Academy"}
                      </div>
                      <div className="text-sm text-slate-500">
                        {student.academy?.location || "Unknown Location"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {student.trainer?.name || "Not assigned"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {student.sport || "Unknown Sport"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getLevelBadgeColor(student.level)}>
                      {student.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge
                      className={getFeeStatusBadgeColor(
                        student.fees?.status || "pending",
                      )}
                    >
                      {student.fees?.status || "pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      <span>{student.kits?.length || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(student.enrollmentDate)}
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
                        <DropdownMenuItem
                          onClick={() => onViewStudent(student._id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onEditStudent(student._id)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Student
                        </DropdownMenuItem>
                        {/* The owner is the coach most evenings on a small
                            academy. Everything a coach can do, one tap in. */}
                        <DropdownMenuItem onClick={() => onCoachTools(student)}>
                          <ClipboardCheck className="mr-2 h-4 w-4" />
                          Attendance &amp; performance
                        </DropdownMenuItem>
                        {student.kits && student.kits.length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>
                              Kit Management
                            </DropdownMenuLabel>
                            {student.kits.map((kit) => (
                              <DropdownMenuItem
                                key={kit._id}
                                onClick={() => onEditKitStatus(student, kit)}
                              >
                                <Package className="mr-2 h-4 w-4" />
                                {kit.itemName} - {kit.status}
                              </DropdownMenuItem>
                            ))}
                          </>
                        )}
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
