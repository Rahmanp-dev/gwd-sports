import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { Student, Academy, User } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { studentsService } from '@/services/studentsService';
import { academiesService } from '@/services/academiesService';
import { trainersService } from '@/services/trainersService';
import { toast } from "sonner"; // Updated to use Sonner
import { STUDENT_LEVELS, SPORTS_LIST } from '@/utils/constants';
import { formatDate, formatCurrency } from '@/utils/helpers';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  mode: 'create' | 'edit' | 'view';
  onSuccess: () => void;
}

// Define the form data type to match what the API expects
interface StudentFormData {
  name: string;
  email: string;
  phone: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  sports: string[];
  academyId: string;
  trainerId: string;
  medicalInfo: {
    allergies: string[];
    medications: string[];
    emergencyContact: {
      name: string;
      phone: string;
      relation: string;
    };
  };
}

const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  student,
  mode,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    email: '',
    phone: '',
    level: 'beginner',
    sports: [],
    academyId: '',
    trainerId: '',
    medicalInfo: {
      allergies: [],
      medications: [],
      emergencyContact: {
        name: '',
        phone: '',
        relation: '',
      },
    },
  });

  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [allergiesInput, setAllergiesInput] = useState('');
  const [medicationsInput, setMedicationsInput] = useState('');

  // Fetch academies for dropdown
  const { data: academiesData } = useQuery({
    queryKey: ['academies-dropdown'],
    queryFn: () => academiesService.getAll({ limit: 100 }),
  });

  // Fetch trainers for dropdown
  const { data: trainersData } = useQuery({
    queryKey: ['trainers-dropdown'],
    queryFn: () => trainersService.getAll({ limit: 100 }),
  });

  // Create/Update mutations
  const createMutation = useMutation({
    mutationFn: studentsService.create,
    onSuccess: () => {
      toast.success("Student created successfully");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create student");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      studentsService.update(id, data),
    onSuccess: () => {
      toast.success("Student updated successfully");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update student");
    },
  });

  // Initialize form data when student changes
  useEffect(() => {
    if (student && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: student.userId.name,
        email: student.userId.email,
        phone: student.userId.phone,
        level: student.level,
        sports: student.sports,
        academyId: student.academyId?._id || '',
        trainerId: student.trainerId?._id || '',
        medicalInfo: {
          allergies: student.medicalInfo?.allergies || [],
          medications: student.medicalInfo?.medications || [],
          emergencyContact: {
            name: student.medicalInfo?.emergencyContact?.name || '',
            phone: student.medicalInfo?.emergencyContact?.phone || '',
            relation: student.medicalInfo?.emergencyContact?.relation || '',
          },
        },
      });
      setSelectedSports(student.sports);
      setAllergiesInput(student.medicalInfo?.allergies?.join(', ') || '');
      setMedicationsInput(student.medicalInfo?.medications?.join(', ') || '');
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        email: '',
        phone: '',
        level: 'beginner',
        sports: [],
        academyId: '',
        trainerId: '',
        medicalInfo: {
          allergies: [],
          medications: [],
          emergencyContact: {
            name: '',
            phone: '',
            relation: '',
          },
        },
      });
      setSelectedSports([]);
      setAllergiesInput('');
      setMedicationsInput('');
    }
  }, [student, mode]);

  const handleSportToggle = (sport: string) => {
    const updated = selectedSports.includes(sport)
      ? selectedSports.filter(s => s !== sport)
      : [...selectedSports, sport];
    
    setSelectedSports(updated);
    setFormData(prev => ({ ...prev, sports: updated }));
  };

  const handleInputChange = (field: keyof StudentFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEmergencyContactChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      medicalInfo: {
        ...prev.medicalInfo,
        emergencyContact: {
          ...prev.medicalInfo.emergencyContact,
          [field]: value,
        },
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'view') return;

    // Validate required fields
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (selectedSports.length === 0) {
      toast.error("At least one sport must be selected");
      return;
    }

    // Prepare data for API
    const submitData = {
      ...formData,
      sports: selectedSports,
      medicalInfo: {
        ...formData.medicalInfo,
        allergies: allergiesInput.split(',').map(s => s.trim()).filter(Boolean),
        medications: medicationsInput.split(',').map(s => s.trim()).filter(Boolean),
      },
    };

    if (mode === 'create') {
      createMutation.mutate(submitData);
    } else if (mode === 'edit' && student) {
      updateMutation.mutate({ id: student._id, data: submitData });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isReadOnly = mode === 'view';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' && 'Add New Student'}
            {mode === 'edit' && 'Edit Student'}
            {mode === 'view' && 'Student Details'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Student Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter full name"
                  disabled={isReadOnly}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                  disabled={isReadOnly}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Academic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Student Level *</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => handleInputChange('level', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(STUDENT_LEVELS).map((level) => (
                      <SelectItem key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="academyId">Academy</Label>
                <Select
                  value={formData.academyId}
                  onValueChange={(value) => handleInputChange('academyId', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select academy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No academy</SelectItem>
                    {academiesData?.data?.items?.map((academy: Academy) => (
                      <SelectItem key={academy._id} value={academy._id}>
                        {academy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trainerId">Trainer</Label>
                <Select
                  value={formData.trainerId}
                  onValueChange={(value) => handleInputChange('trainerId', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trainer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No trainer</SelectItem>
                    {trainersData?.data?.items?.map((trainer: any) => (
                      <SelectItem key={trainer._id} value={trainer._id}>
                        {trainer.userId?.name || trainer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Sports Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Sports *</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {SPORTS_LIST.map((sport) => (
                <div key={sport} className="flex items-center space-x-2">
                  <Checkbox
                    id={sport}
                    checked={selectedSports.includes(sport)}
                    onCheckedChange={() => handleSportToggle(sport)}
                    disabled={isReadOnly}
                  />
                  <Label htmlFor={sport} className="text-sm">
                    {sport}
                  </Label>
                </div>
              ))}
            </div>
            {selectedSports.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedSports.map((sport) => (
                  <Badge key={sport} variant="outline">
                    {sport}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Medical Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Medical Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies (comma separated)</Label>
                <Textarea
                  id="allergies"
                  value={allergiesInput}
                  onChange={(e) => setAllergiesInput(e.target.value)}
                  placeholder="Enter allergies separated by commas"
                  rows={3}
                  disabled={isReadOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medications">Medications (comma separated)</Label>
                <Textarea
                  id="medications"
                  value={medicationsInput}
                  onChange={(e) => setMedicationsInput(e.target.value)}
                  placeholder="Enter medications separated by commas"
                  rows={3}
                  disabled={isReadOnly}
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h4 className="font-medium">Emergency Contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyName">Contact Name</Label>
                  <Input
                    id="emergencyName"
                    value={formData.medicalInfo.emergencyContact.name}
                    onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                    placeholder="Emergency contact name"
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Contact Phone</Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.medicalInfo.emergencyContact.phone}
                    onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                    placeholder="Emergency contact phone"
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyRelation">Relation</Label>
                  <Input
                    id="emergencyRelation"
                    value={formData.medicalInfo.emergencyContact.relation}
                    onChange={(e) => handleEmergencyContactChange('relation', e.target.value)}
                    placeholder="Relation (e.g., Father, Mother)"
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Student Details (View Mode) */}
          {mode === 'view' && student && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Student Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Enrollment Date</p>
                  <p className="font-medium">{formatDate(student.enrollmentDate)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Fees Paid</p>
                  <p className="font-medium">{formatCurrency(student.totalFeesPaid)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge variant={student.isActive ? "default" : "secondary"}>
                    {student.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              {/* Kits Information */}
              {student.kits && student.kits.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Equipment Kits</h4>
                  <div className="space-y-2">
                    {student.kits.map((kit) => (
                      <div key={kit._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{kit.kitName}</p>
                          <p className="text-sm text-gray-600">
                            Requested: {formatDate(kit.requestedAt)}
                          </p>
                          {kit.deliveredAt && (
                            <p className="text-sm text-gray-600">
                              Delivered: {formatDate(kit.deliveredAt)}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge className={`mb-1 ${
                            kit.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            kit.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {kit.status}
                          </Badge>
                          {kit.cost && (
                            <p className="text-sm font-medium">{formatCurrency(kit.cost)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {mode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {mode !== 'view' && (
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading || selectedSports.length === 0}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                mode === 'create' ? 'Create Student' : 'Update Student'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StudentModal;