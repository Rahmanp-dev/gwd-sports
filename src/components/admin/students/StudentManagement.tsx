"use client";
import React, { useState, useEffect, useCallback } from "react";
import { StudentTable } from "./StudentTable";
import { StudentDetails } from "./StudentDetails";
import { StudentStats } from "./StudentStats";
import { StudentForm } from "./StudentForm";
import { KitStatusForm } from "./KitStatusForm";
import { CoachToolsDialog } from "./CoachToolsDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  Student,
  StudentFilters,
  StudentUpdateData,
  KitUpdateData,
  Kit,
} from "@/types";
import { studentAdminService } from "@/services/studentService";
import { BarChart3 } from "lucide-react";
import { toastUtils } from "@/utils/toast";

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
  const [filters, setFilters] = useState<StudentFilters>({
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
  const [showKitForm, setShowKitForm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // Extract specific error message from API error response
  const extractErrorMessage = (error: any): string => {
    const response = error?.response || error;
    const data = response?.data || response;

    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      const firstError = data.errors[0];
      if (firstError?.message) {
        return firstError.message;
      }
    }

    if (data?.message && data.message !== "Invalid request data") {
      return data.message;
    }

    if (error?.message && error.message !== "Invalid request data") {
      return error.message;
    }

    return "An unexpected error occurred. Please check your input and try again.";
  };

  // Fetch students based on filters
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await studentAdminService.getAllStudents(filters);
      if (response?.data) {
        setStudents(response.data.students || []);
        setPagination({
          currentPage: response.data.pagination.currentPage,
          totalPages: response.data.pagination.totalPages,
          totalItems: response.data.pagination.totalStudents, // Map totalStudents to totalItems
          hasNextPage: response.data.pagination.hasNextPage,
          hasPrevPage: response.data.pagination.hasPrevPage,
        });
      }
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      toastUtils.error("Failed to fetch students", errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Fetch student statistics
  const fetchStats = async () => {
    setIsStatsLoading(true);
    try {
      const response = await studentAdminService.getStudentStats();
      if (response?.data) {
        setStats(response.data);
      }
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      toastUtils.error("Failed to fetch student statistics", errorMessage);
    } finally {
      setIsStatsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Fetch stats when stats view is toggled on
  useEffect(() => {
    if (showStats && !stats) {
      fetchStats();
    }
  }, [showStats, stats]);

  // Handle update student
  const handleStudentSubmit = async (data: StudentUpdateData) => {
    if (!selectedStudent) return;

    setIsLoading(true);
    try {
      await studentAdminService.updateStudent(selectedStudent._id, data);
      toastUtils.success(
        "Student updated successfully",
        "The student information has been updated.",
      );

      setShowForm(false);
      setSelectedStudent(null);
      fetchStudents(); // Refresh student list
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      toastUtils.error("Failed to update student", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle kit status update
  const handleKitStatusUpdate = async (data: KitUpdateData) => {
    if (!selectedStudent || !selectedKit) return;

    setIsLoading(true);
    try {
      await studentAdminService.updateKitStatus(
        selectedStudent._id,
        selectedKit._id,
        data,
      );
      toastUtils.success(
        "Kit status updated successfully",
        "The kit status has been updated.",
      );

      setShowKitForm(false);
      setSelectedKit(null);
      fetchStudents(); // Refresh student list
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      toastUtils.error("Failed to update kit status", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle view student details
  /** The student whose coach toolkit is open, if any. */
  const [coachToolsFor, setCoachToolsFor] = useState<any | null>(null);

  const handleViewStudent = async (studentId: string) => {
    try {
      const response = await studentAdminService.getStudentById(studentId);
      if (response?.data?.student) {
        setSelectedStudent(response.data.student);
        setShowDetails(true);
      }
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      toastUtils.error("Failed to fetch student details", errorMessage);
    }
  };

  // Handle edit student
  const handleEditStudent = async (studentId: string) => {
    try {
      const response = await studentAdminService.getStudentById(studentId);
      if (response?.data?.student) {
        setSelectedStudent(response.data.student);
        setShowForm(true);
        setShowDetails(false);
      }
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      toastUtils.error("Failed to fetch student details", errorMessage);
    }
  };

  // Handle kit status edit
  const handleEditKitStatus = (student: Student, kit: Kit) => {
    setSelectedStudent(student);
    setSelectedKit(kit);
    setShowKitForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <h2 className="text-2xl font-bold">Student Management</h2>

        <div className="flex gap-2">
          <Button
            variant={showStats ? "default" : "outline"}
            onClick={() => setShowStats(!showStats)}
            className="gap-1"
          >
            <BarChart3 className="h-4 w-4" />
            {showStats ? "Hide" : "View"} Statistics
          </Button>
        </div>
      </div>

      {/* Statistics Section */}
      {showStats && <StudentStats stats={stats} isLoading={isStatsLoading} />}

      {/* Student Table */}
      <StudentTable
        students={students}
        isLoading={isLoading}
        onCoachTools={setCoachToolsFor}
        onViewStudent={handleViewStudent}
        onEditStudent={handleEditStudent}
        onEditKitStatus={handleEditKitStatus}
        onFilterChange={setFilters}
        currentFilters={filters}
        pagination={pagination}
        onPageChange={(page) => setFilters({ ...filters, page })}
      />

      {/* Student Form Dialog */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          if (!open) setSelectedStudent(null);
          setShowForm(open);
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          {/* Only render StudentForm when we have a selected student */}
          {selectedStudent ? (
            <StudentForm
              student={selectedStudent}
              onSubmit={handleStudentSubmit}
              isLoading={isLoading}
              onCancel={() => {
                setShowForm(false);
                setSelectedStudent(null);
              }}
            />
          ) : (
            <div className="p-4 text-center">
              <p className="text-muted-foreground">
                Loading student information...
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Student Details Dialog */}
      <Dialog
        open={showDetails}
        onOpenChange={(open) => {
          setShowDetails(open);
          if (!open) setSelectedStudent(null);
        }}
      >
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <StudentDetails
              student={selectedStudent}
              onClose={() => setShowDetails(false)}
              onEdit={() => {
                setShowDetails(false);
                setShowForm(true);
              }}
              onEditKitStatus={(kit) =>
                handleEditKitStatus(selectedStudent, kit)
              }
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Kit Status Form Dialog */}
      <Dialog
        open={showKitForm}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedKit(null);
            setSelectedStudent(null);
          }
          setShowKitForm(open);
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Kit Status</DialogTitle>
          </DialogHeader>
          {selectedKit && (
            <KitStatusForm
              kit={selectedKit}
              onSubmit={handleKitStatusUpdate}
              isLoading={isLoading}
              onCancel={() => {
                setShowKitForm(false);
                setSelectedKit(null);
                setSelectedStudent(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <CoachToolsDialog
        open={!!coachToolsFor}
        onOpenChange={(o) => {
          if (!o) setCoachToolsFor(null);
        }}
        student={
          coachToolsFor
            ? {
                userId: coachToolsFor.userId,
                name: coachToolsFor.user?.name ?? "Student",
                sports: coachToolsFor.sports,
              }
            : null
        }
        onDone={fetchStudents}
      />
    </div>
  );
};
