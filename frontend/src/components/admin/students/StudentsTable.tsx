import React from 'react';
import type { Student, PaginationInfo } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate, formatCurrency, getInitials } from '@/utils/helpers';
import { PAGINATION } from '@/utils/constants';

interface StudentsTableProps {
  students: Student[];
  pagination?: PaginationInfo;
  onPageChange: (page: number) => void;
  onEdit: (student: Student) => void;
  onView: (student: Student) => void;
  onDelete: (studentId: string) => void;
  onKitStatusUpdate: (studentId: string, kitId: string, status: string, cost?: number) => void;
  isLoading?: boolean;
}

const StudentsTable: React.FC<StudentsTableProps> = ({
  students,
  pagination,
  onPageChange,
  onEdit,
  onView,
  onDelete,
  onKitStatusUpdate,
  isLoading = false,
}) => {
  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getKitStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'requested': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!students.length) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">👨‍🎓</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
        <p className="text-gray-500">Get started by adding your first student.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Student</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Sports</TableHead>
              <TableHead>Academy</TableHead>
              <TableHead>Trainer</TableHead>
              <TableHead>Fees Paid</TableHead>
              <TableHead>Enrollment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Kits</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student._id} className="hover:bg-gray-50">
                {/* Student Info */}
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-500 text-white">
                        {getInitials(student.userId.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-gray-900">
                        {student.userId.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {student.userId.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        {student.userId.phone}
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Level */}
                <TableCell>
                  <Badge className={getLevelBadgeColor(student.level)}>
                    {student.level}
                  </Badge>
                </TableCell>

                {/* Sports */}
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {student.sports.slice(0, 2).map((sport, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {sport}
                      </Badge>
                    ))}
                    {student.sports.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{student.sports.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>

                {/* Academy */}
                <TableCell>
                  <div className="text-sm">
                    {student.academyId?.name || (
                      <span className="text-gray-400">Not assigned</span>
                    )}
                  </div>
                </TableCell>

                {/* Trainer */}
                <TableCell>
                  <div className="text-sm">
                    {student.trainerId?.name || (
                      <span className="text-gray-400">Not assigned</span>
                    )}
                  </div>
                </TableCell>

                {/* Fees Paid */}
                <TableCell>
                  <div className="font-medium">
                    {formatCurrency(student.totalFeesPaid)}
                  </div>
                </TableCell>

                {/* Enrollment Date */}
                <TableCell>
                  <div className="text-sm">
                    {formatDate(student.enrollmentDate)}
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Badge variant={student.isActive ? "default" : "secondary"}>
                    {student.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>

                {/* Kits */}
                <TableCell>
                  <div className="space-y-1">
                    {student.kits.slice(0, 2).map((kit) => (
                      <div key={kit._id} className="flex items-center gap-2">
                        <Badge className={`${getKitStatusColor(kit.status)} text-xs`}>
                          {kit.status}
                        </Badge>
                        <Select
                          value={kit.status}
                          onValueChange={(status) => 
                            onKitStatusUpdate(student._id, kit._id, status)
                          }
                          disabled={isLoading}
                        >
                          <SelectTrigger className="h-6 w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="requested">Requested</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                    {student.kits.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{student.kits.length - 2} more
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={isLoading}>
                        ⋮
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(student)}>
                        👁️ View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(student)}>
                        ✏️ Edit Student
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(student._id)}
                        className="text-red-600"
                      >
                        🗑️ Delete Student
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-gray-500">
            Showing {((pagination.currentPage - 1) * PAGINATION.DEFAULT_LIMIT) + 1} to{' '}
            {Math.min(pagination.currentPage * PAGINATION.DEFAULT_LIMIT, pagination.totalItems)} of{' '}
            {pagination.totalItems} students
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage || isLoading}
            >
              ← Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={pagination.currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page)}
                    disabled={isLoading}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage || isLoading}
            >
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsTable;