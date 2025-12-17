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
import type { Academy, AcademyFilters } from "@/services/academyService";
import { formatDate } from "@/utils/helpers";
import {
  Edit,
  MoreHorizontal,
  Search,
  Eye,
  Trash2,
  Building,
} from "lucide-react";
import { SPORTS_LIST } from "@/utils/constants";

interface AcademyTableProps {
  academies: Academy[];
  isLoading: boolean;
  onViewAcademy: (academyId: string) => void;
  onEditAcademy: (academyId: string) => void;
  onDeleteAcademy: (academyId: string) => void;
  onFilterChange: (filters: AcademyFilters) => void;
  currentFilters: AcademyFilters;
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  onPageChange: (page: number) => void;
}

export const AcademyTable: React.FC<AcademyTableProps> = ({
  academies,
  isLoading,
  onViewAcademy,
  onEditAcademy,
  onDeleteAcademy,
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        {/* Search Bar */}
        <div className="flex w-full md:w-1/2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by academy name or location..."
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
              ? "Loading academies..."
              : academies.length === 0
                ? "No academies found"
                : `Showing ${academies.length} academies`}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Sports</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : academies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Building className="h-12 w-12 text-gray-400" />
                    <p className="text-muted-foreground">
                      No academies found. Try adjusting your filters.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              academies.map((academy) => (
                <TableRow key={academy._id}>
                  <TableCell className="font-medium">{academy.name}</TableCell>
                  <TableCell>{academy.location}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {academy.sports.slice(0, 2).map((sport) => (
                        <Badge key={sport} variant="secondary">
                          {sport}
                        </Badge>
                      ))}
                      {academy.sports.length > 2 && (
                        <Badge variant="outline">
                          +{academy.sports.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{academy.capacity}</TableCell>
                  <TableCell>
                    <Badge
                      variant={academy.isActive ? "default" : "secondary"}
                      className={
                        academy.isActive
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-gray-500 hover:bg-gray-600"
                      }
                    >
                      {academy.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{academy.contactInfo.name}</div>
                      <div className="text-muted-foreground">
                        {academy.contactInfo.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onViewAcademy(academy._id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onEditAcademy(academy._id)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDeleteAcademy(academy._id)}
                          className="text-red-600"
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
      {!isLoading && academies.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
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
      )}
    </div>
  );
};
