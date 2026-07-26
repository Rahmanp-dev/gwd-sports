"use client";
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
import { TrainerStudentRelations } from "./TrainerStudentRelations";

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

  // Trainer–Student Relations dialog
  const [showRelations, setShowRelations] = useState(false);
  const [relationsAcademy, setRelationsAcademy] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const extractErrorMessage = (error: any): string => {
    const response = error?.response || error;
    const data = response?.data || response;

    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      const firstError = data.errors[0];
      if (firstError?.message) return firstError.message;
    }
    if (data?.message && data.message !== "Invalid request data")
      return data.message;
    if (error?.message && error.message !== "Invalid request data")
      return error.message;
    return "An unexpected error occurred. Please check your input and try again.";
  };

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
      toastUtils.error("Failed to fetch academies", extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAcademies();
  }, [fetchAcademies]);

  const handleCreateAcademy = async (data: AcademyFormData) => {
    setIsLoading(true);
    try {
      await academyService.createAcademy(data);
      toastUtils.success(
        "Academy created successfully",
        "The academy has been created.",
      );
      setShowForm(false);
      fetchAcademies();
    } catch (error: any) {
      toastUtils.error("Failed to create academy", extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAcademy = async (data: AcademyFormData) => {
    if (!selectedAcademy) return;
    setIsLoading(true);
    try {
      await academyService.updateAcademy(selectedAcademy._id, data, { superAdmin: true });
      toastUtils.success(
        "Academy updated successfully",
        "The academy information has been updated.",
      );
      setShowForm(false);
      setSelectedAcademy(null);
      setIsEditMode(false);
      fetchAcademies();
    } catch (error: any) {
      toastUtils.error("Failed to update academy", extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAcademy = async (academyId: string) => {
    try {
      const response = await academyService.getAcademyById(academyId);
      if (response?.data?.academy) {
        setSelectedAcademy(response.data.academy);
        setShowDetails(true);
      }
    } catch (error: any) {
      toastUtils.error(
        "Failed to fetch academy details",
        extractErrorMessage(error),
      );
    }
  };

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
      toastUtils.error(
        "Failed to fetch academy details",
        extractErrorMessage(error),
      );
    }
  };

  const [deleteAcademyId, setDeleteAcademyId] = useState<string | null>(null);

  const confirmDeleteAcademy = async () => {
    if (!deleteAcademyId) return;
    setIsLoading(true);
    try {
      await academyService.deleteAcademy(deleteAcademyId);
      toastUtils.success(
        "Academy deleted successfully",
        "The academy has been removed.",
      );
      setDeleteAcademyId(null);
      fetchAcademies();
    } catch (error: any) {
      toastUtils.error("Failed to delete academy", extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAcademy = (academyId: string) => {
    setDeleteAcademyId(academyId);
  };

  // Open trainer–student relations for a specific academy
  const handleManageRelations = (academy: Academy) => {
    setRelationsAcademy({ id: academy._id, name: academy.name });
    setShowRelations(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Academy Table — pass the new handler down */}
      <AcademyTable
        academies={academies}
        isLoading={isLoading}
        onViewAcademy={handleViewAcademy}
        onEditAcademy={handleEditAcademy}
        onDeleteAcademy={handleDeleteAcademy}
        onManageRelations={handleManageRelations}
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

      {/* Trainer–Student Relations Dialog */}
      {relationsAcademy && (
        <TrainerStudentRelations
          academyId={relationsAcademy.id}
          academyName={relationsAcademy.name}
          isOpen={showRelations}
          onClose={() => {
            setShowRelations(false);
            setRelationsAcademy(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteAcademyId}
        onOpenChange={(open) => !open && setDeleteAcademyId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete this academy? This action cannot be
            undone.
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteAcademyId(null)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteAcademy}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
