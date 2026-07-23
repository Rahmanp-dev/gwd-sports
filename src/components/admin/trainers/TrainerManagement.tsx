"use client";
import React, { useState, useEffect, useCallback } from "react";
import type { Trainer, TrainerFilters, UserFormData } from "@/types";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { TrainerTable } from "./TrainerTable";
import { TrainerForm } from "./TrainerForm";
import { TrainerDetails } from "./TrainerDetails";
import { trainerAdminService } from "@/services/trainerService";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const TrainerManagement: React.FC = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [filters, setFilters] = useState<TrainerFilters>({
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
  const [trainerToDelete, setTrainerToDelete] = useState<string | null>(null);

  // Enhanced error extraction
  const extractErrorMessage = (error: any): string => {
    console.log("Full error object:", error);

    const response = error?.response || error;
    const data = response?.data || response;

    // Check for validation errors
    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      const firstError = data.errors[0];
      if (firstError?.message) {
        return firstError.message;
      }
    }

    // Check for general error message
    if (data?.message && data.message !== "Invalid request data") {
      return data.message;
    }

    if (error?.message && error.message !== "Invalid request data") {
      return error.message;
    }

    return "An unexpected error occurred. Please try again.";
  };

  // Fetch trainers based on filters
  const fetchTrainers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await trainerAdminService.getAllTrainers(filters);

      setTrainers(response?.trainers);
      setPagination(response?.pagination);
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      toast.error("Error", {
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
    fetchTrainers();
  }, [fetchTrainers]);

  // Handle create/update trainer
  const handleTrainerSubmit = async (
    userData: UserFormData | null,
    trainerData: any,
  ) => {
    setIsLoading(true);
    try {
      if (selectedTrainer) {
        // Update existing trainer
        await trainerAdminService.updateTrainer(
          selectedTrainer._id,
          trainerData,
        );

        toast.success("Trainer updated successfully", {
          description: "The trainer information has been updated.",
          style: {
            background: "#f0fdf4",
            borderColor: "#bbf7d0",
            color: "#166534",
          },
          className: "border-l-4 border-l-green-500",
        });
      } else {
        // Create new trainer (two-step process)
        if (!userData) {
          throw new Error("User data is required for creating a trainer");
        }

        // Step 1: Create user
        const userResponse = await trainerAdminService.createUser(userData);
        console.log(userResponse);
        const createdUserId = userResponse.user._id;

        // Step 2: Create trainer profile
        await trainerAdminService.createTrainerProfile({
          userId: createdUserId,
          ...trainerData,
        });

        toast.success("Trainer created successfully", {
          description: "The trainer information has been created.",
          style: {
            background: "#f0fdf4",
            borderColor: "#bbf7d0",
            color: "#166534",
          },
          className: "border-l-4 border-l-green-500",
        });
      }

      setShowForm(false);
      setSelectedTrainer(null);
      fetchTrainers();
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      console.log("its me handleTrainerSubmit");

      toast.error("Failed to save trainer", {
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
  };

  // Handle delete trainer
  const handleDeleteTrainer = async () => {
    if (!trainerToDelete) return;

    setIsLoading(true);
    try {
      await trainerAdminService.deleteTrainer(trainerToDelete);

      toast.success("Trainer deleted successfully", {
        description: "The trainer information has been deleted.",
        style: {
          background: "#f0fdf4",
          borderColor: "#bbf7d0",
          color: "#166534",
        },
        className: "border-l-4 border-l-green-500",
      });

      setTrainerToDelete(null);
      fetchTrainers();
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      console.log("its me delete trainers");

      toast.error("Failed to delete trainer", {
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
  };

  // Handle view trainer details
  const handleViewTrainer = async (trainerId: string) => {
    try {
      const response = await trainerAdminService.getTrainerById(trainerId);
      setSelectedTrainer(response.trainer);
      setShowDetails(true);
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      console.log("its me handle view");
      toast.error("Failed to fetch trainer details", {
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

  // Handle edit trainer
  const handleEditTrainer = async (trainerId: string) => {
    try {
      const response = await trainerAdminService.getTrainerById(trainerId);
      setSelectedTrainer(response.trainer);
      setShowForm(true);
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      console.log("its me fetch trainer for edit");
      toast.error("Failed to edit trainer details", {
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <h2 className="text-2xl font-bold">Trainer Management</h2>

        <div className="flex gap-2">
          <Button
            onClick={() => {
              setSelectedTrainer(null);
              setShowForm(true);
            }}
            className="gap-1"
          >
            <UserPlus className="h-4 w-4" />
            Add Trainer
          </Button>
        </div>
      </div>

      {/* Table */}
      <TrainerTable
        trainers={trainers}
        isLoading={isLoading}
        onViewTrainer={handleViewTrainer}
        onEditTrainer={handleEditTrainer}
        onDeleteTrainer={(trainerId) => setTrainerToDelete(trainerId)}
        onFilterChange={setFilters}
        currentFilters={filters}
        pagination={pagination}
        onPageChange={(page) => setFilters({ ...filters, page })}
      />

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="w-[600px] max-h-[90vh] overflow-y-auto">
          <TrainerForm
            trainer={selectedTrainer || undefined}
            onSubmit={handleTrainerSubmit}
            isLoading={isLoading}
            onCancel={() => {
              setShowForm(false);
              setSelectedTrainer(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTrainer && (
            <TrainerDetails
              trainer={selectedTrainer}
              onClose={() => {
                setShowDetails(false);
                setSelectedTrainer(null);
              }}
              onEdit={() => {
                setShowDetails(false);
                setShowForm(true);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!trainerToDelete}
        onOpenChange={(open) => !open && setTrainerToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this trainer? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTrainerToDelete(null)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTrainer}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
