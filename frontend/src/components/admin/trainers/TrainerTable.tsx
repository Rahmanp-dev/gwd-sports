import React, { useState, useEffect } from "react";
import type { Trainer, TrainerFilters } from "@/types";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Filter,
} from "lucide-react";

interface TrainerTableProps {
  trainers: Trainer[];
  isLoading: boolean;
  onViewTrainer: (trainerId: string) => void;
  onEditTrainer: (trainerId: string) => void;
  onDeleteTrainer: (trainerId: string) => void;
  onFilterChange: (filters: TrainerFilters) => void;
  currentFilters: TrainerFilters;
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  onPageChange: (page: number) => void;
}

const SPORTS_LIST = [
  "Football",
  "Basketball",
  "Tennis",
  "Swimming",
  "Cricket",
  "Badminton",
  "Table Tennis",
  "Athletics",
  "Hockey",
  "Volleyball",
];

export const TrainerTable: React.FC<TrainerTableProps> = ({
  trainers,
  isLoading,
  onViewTrainer,
  onEditTrainer,
  onDeleteTrainer,
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
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
    }

    return currentFilters.sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4 text-blue-600" />
    ) : (
      <ChevronDown className="h-4 w-4 text-blue-600" />
    );
  };

  const getTrainerName = (trainer: Trainer) => {
    return trainer.userId?.name || trainer.user?.name || "Unknown";
  };

  const getTrainerEmail = (trainer: Trainer) => {
    return trainer.userId?.email || trainer.user?.email || "N/A";
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        {/* Search Bar */}
        <div className="flex w-full md:w-1/2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, email, or sport..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Sport
                {currentFilters.sport && (
                  <Badge variant="secondary" className="ml-2">
                    1
                  </Badge>
                )}
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
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Status
                {currentFilters.isActive !== undefined && (
                  <Badge variant="secondary" className="ml-2">
                    1
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleStatusFilter(null)}>
                All Trainers
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusFilter(true)}>
                Active Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusFilter(false)}>
                Inactive Only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableCaption>
            {isLoading
              ? "Loading trainers..."
              : `Total ${trainers.length} trainer(s)`}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => handleSort("userId.name")}
                  className="flex items-center gap-2 hover:text-primary"
                >
                  Name
                  {getSortIcon("userId.name")}
                </button>
              </TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Sports</TableHead>
              <TableHead className="hidden lg:table-cell">Students</TableHead>
              <TableHead className="hidden lg:table-cell">Rate</TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("isActive")}
                  className="flex items-center gap-2 hover:text-primary"
                >
                  Status
                  {getSortIcon("isActive")}
                </button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                </TableCell>
              </TableRow>
            ) : trainers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-10 text-muted-foreground"
                >
                  No trainers found
                </TableCell>
              </TableRow>
            ) : (
              trainers.map((trainer) => (
                <TableRow key={trainer._id}>
                  <TableCell className="font-medium">
                    {getTrainerName(trainer)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {getTrainerEmail(trainer)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {trainer.sports.slice(0, 2).map((sport) => (
                        <Badge
                          key={sport}
                          variant="secondary"
                          className="text-xs"
                        >
                          {sport}
                        </Badge>
                      ))}
                      {trainer.sports.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{trainer.sports.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {trainer.studentCount || trainer.students?.length || 0}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {trainer.hourlyRate ? `$${trainer.hourlyRate}` : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={trainer.isActive ? "default" : "secondary"}
                      className={
                        trainer.isActive
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-gray-500 hover:bg-gray-600"
                      }
                    >
                      {trainer.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onViewTrainer(trainer._id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onEditTrainer(trainer._id)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteTrainer(trainer._id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
        <div className="text-sm text-muted-foreground">
          Page {pagination.currentPage} of {pagination.totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage || isLoading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage || isLoading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
