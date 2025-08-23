import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Student, StudentFilters } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import StudentsTable from './StudentsTable';
import StudentModal from './StudentModal';
import { studentsService } from '@/services/studentsService';
import { useToast } from '@/hooks/use-toast';
import { STUDENT_LEVELS } from '@/utils/constants';
import { debounce } from '@/utils/helpers';

const StudentsTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState<StudentFilters>({
    page: 1,
    limit: 10,
    search: '',
    level: '',
    academyId: '',
    trainerId: '',
    sortBy: 'enrollmentDate',
    sortOrder: 'desc'
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');

  // Fetch students with filters
  const { 
    data: studentsData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['students', filters],
    queryFn: () => studentsService.getAll(filters),
    placeholderData: (prev) => prev, 
  });

  // Delete student mutation
  const deleteMutation = useMutation({
    mutationFn: studentsService.delete,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete student",
        variant: "destructive",
      });
    },
  });

  // Update kit status mutation
  const updateKitMutation = useMutation({
    mutationFn: ({ studentId, kitId, status, cost }: { 
      studentId: string; 
      kitId: string; 
      status: string; 
      cost?: number; 
    }) => studentsService.updateKitStatus(studentId, kitId, { status, cost }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Kit status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update kit status",
        variant: "destructive",
      });
    },
  });

  // Debounced search
  const debouncedSearch = debounce((searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
  }, 300);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const handleFilterChange = (key: keyof StudentFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleCreateStudent = () => {
    setSelectedStudent(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleDeleteStudent = (studentId: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      deleteMutation.mutate(studentId);
    }
  };

  const handleKitStatusUpdate = (studentId: string, kitId: string, status: string, cost?: number) => {
    updateKitMutation.mutate({ studentId, kitId, status, cost });
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      level: '',
      academyId: '',
      trainerId: '',
      sortBy: 'enrollmentDate',
      sortOrder: 'desc'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Students Management</h2>
          <p className="text-gray-600">Manage student profiles, enrollment, and progress</p>
        </div>
        <Button onClick={handleCreateStudent} size="lg">
          ➕ Add New Student
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {studentsData?.data?.pagination?.totalItems || 0}
                </p>
              </div>
              <div className="text-2xl">👨‍🎓</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Students</p>
                <p className="text-2xl font-bold text-green-600">
                  {studentsData?.data?.items?.filter(s => s.isActive).length || 0}
                </p>
              </div>
              <div className="text-2xl">✅</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Beginners</p>
                <p className="text-2xl font-bold text-blue-600">
                  {studentsData?.data?.items?.filter(s => s.level === 'beginner').length || 0}
                </p>
              </div>
              <div className="text-2xl">🌱</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Advanced</p>
                <p className="text-2xl font-bold text-purple-600">
                  {studentsData?.data?.items?.filter(s => s.level === 'advanced').length || 0}
                </p>
              </div>
              <div className="text-2xl">🏆</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="col-span-1 md:col-span-2">
              <Input
                placeholder="Search students..."
                onChange={handleSearch}
                className="w-full"
              />
            </div>

            {/* Level Filter */}
            <Select value={filters.level} onValueChange={(value) => handleFilterChange('level', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Levels</SelectItem>
                {Object.values(STUDENT_LEVELS).map((level) => (
                  <SelectItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enrollmentDate">Enrollment Date</SelectItem>
                <SelectItem value="level">Level</SelectItem>
                <SelectItem value="totalFeesPaid">Fees Paid</SelectItem>
                <SelectItem value="createdAt">Created Date</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Select value={filters.sortOrder} onValueChange={(value) => handleFilterChange('sortOrder', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button variant="outline" onClick={clearFilters} className="w-full">
              Clear Filters
            </Button>
          </div>

          {/* Active Filters Display */}
          {(filters.search || filters.level || filters.academyId || filters.trainerId) && (
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filters.search && (
                <Badge variant="secondary" className="text-xs">
                  Search: {filters.search}
                </Badge>
              )}
              {filters.level && (
                <Badge variant="secondary" className="text-xs">
                  Level: {filters.level}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">Failed to load students</p>
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <StudentsTable
              students={studentsData?.data?.items || []}
              pagination={studentsData?.data?.pagination}
              onPageChange={handlePageChange}
              onEdit={handleEditStudent}
              onView={handleViewStudent}
              onDelete={handleDeleteStudent}
              onKitStatusUpdate={handleKitStatusUpdate}
              isLoading={deleteMutation.isPending || updateKitMutation.isPending}
            />
          )}
        </CardContent>
      </Card>

      {/* Student Modal */}
      <StudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        student={selectedStudent}
        mode={modalMode}
        onSuccess={() => {
          setIsModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['students'] });
        }}
      />
    </div>
  );
};

export default StudentsTab;