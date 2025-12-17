import React, { useState, useEffect, useCallback } from "react";
import { AcademyTable } from "./AcademyTable";
import { AcademyDetails } from "./AcademyDetails";
import { AcademyForm } from "./AcademyForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  Academy,
  AcademyFilters,
  AcademyFormData,
} from "@/services/academyService";
import { academyService } from "@/services/academyService";
import { Plus } from "lucide-react";
import { toastUtils } from "@/utils/toast";

export const AcademyManagement: React.FC = () => {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState<Academy | null>(null);
  const [filters, setFilters] = useState<AcademyFilters>({
    page: 1,
    limit: 10,
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
  const [isEditMode, setIsEditMode] = useState(false);

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

  // Fetch academies based on filters
  const fetchAcademies = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await academyService.getAllAcademies(filters);
      if (response?.data) {
        setAcademies(response.data.academies || []);
        setPagination({
          currentPage: response.data.pagination.currentPage,
          totalPages: response.data.pagination.totalPages,
          totalItems: response.data.pagination.totalAcademies,
          hasNextPage: response.data.pagination.hasNextPage,
          hasPrevPage: response.data.pagination.hasPrevPage,
        });
      }
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      toastUtils.error("Failed to fetch academies", errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Initial data fetch
  useEffect(() => {
    fetchAcademies();
  }, [fetchAcademies]);

  // Handle create academy
  const handleCreateAcademy = async (data: AcademyFormData) => {
    setIsLoading(true);
    try {
      await academyService.createAcademy(data);
      toastUtils.success(
        "Academy created successfully",
        "The academy has been created.",
      );

      setShowForm(false);
      fetchAcademies(); // Refresh academy list
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      toastUtils.error("Failed to create academy", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle update academy
  const handleUpdateAcademy = async (data: AcademyFormData) => {
    if (!selectedAcademy) return;

    setIsLoading(true);
    try {
      await academyService.updateAcademy(selectedAcademy._id, data);
      toastUtils.success(
        "Academy updated successfully",
        "The academy information has been updated.",
      );

      setShowForm(false);
      setSelectedAcademy(null);
      setIsEditMode(false);
      fetchAcademies(); // Refresh academy list
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      toastUtils.error("Failed to update academy", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle view academy details
  const handleViewAcademy = async (academyId: string) => {
    try {
      const response = await academyService.getAcademyById(academyId);
      if (response?.data?.academy) {
        setSelectedAcademy(response.data.academy);
        setShowDetails(true);
      }
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      toastUtils.error("Failed to fetch academy details", errorMessage);
    }
  };

  // Handle edit academy
  const handleEditAcademy = async (academyId: string) => {
    try {
      const response = await academyService.getAcademyById(academyId);
      if (response?.data?.academy) {
        setSelectedAcademy(response.data.academy);
        setIsEditMode(true);
        setShowForm(true);
        setShowDetails(false);
      }
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      toastUtils.error("Failed to fetch academy details", errorMessage);
    }
  };

  // Handle delete academy
  const handleDeleteAcademy = async (academyId: string) => {
    if (!confirm("Are you sure you want to delete this academy?")) {
      return;
    }

    setIsLoading(true);
    try {
      await academyService.deleteAcademy(academyId);
      toastUtils.success(
        "Academy deleted successfully",
        "The academy has been removed.",
      );

      fetchAcademies(); // Refresh academy list
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      toastUtils.error("Failed to delete academy", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <h2 className="text-2xl font-bold">Academy Management</h2>

        <div className="flex gap-2">
          <Button
            onClick={() => {
              setSelectedAcademy(null);
              setIsEditMode(false);
              setShowForm(true);
            }}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Academy
          </Button>
        </div>
      </div>

      {/* Academy Table */}
      <AcademyTable
        academies={academies}
        isLoading={isLoading}
        onViewAcademy={handleViewAcademy}
        onEditAcademy={handleEditAcademy}
        onDeleteAcademy={handleDeleteAcademy}
        onFilterChange={setFilters}
        currentFilters={filters}
        pagination={pagination}
        onPageChange={(page: number) => setFilters({ ...filters, page })}
      />

      {/* Academy Form Dialog */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAcademy(null);
            setIsEditMode(false);
          }
          setShowForm(open);
        }}
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Academy" : "Create New Academy"}
            </DialogTitle>
          </DialogHeader>
          <AcademyForm
            academy={isEditMode ? selectedAcademy : null}
            onSubmit={isEditMode ? handleUpdateAcademy : handleCreateAcademy}
            isLoading={isLoading}
            onCancel={() => {
              setShowForm(false);
              setSelectedAcademy(null);
              setIsEditMode(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Academy Details Dialog */}
      <Dialog
        open={showDetails}
        onOpenChange={(open) => {
          setShowDetails(open);
          if (!open) setSelectedAcademy(null);
        }}
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Academy Details</DialogTitle>
          </DialogHeader>
          {selectedAcademy && (
            <AcademyDetails
              academy={selectedAcademy}
              onClose={() => setShowDetails(false)}
              onEdit={() => {
                setShowDetails(false);
                handleEditAcademy(selectedAcademy._id);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
