"use client";
import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/router-shim";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
  LogOut,
  Edit,
  Save,
  X,
  CheckCircle,
  Shield,
  Activity,
  Trophy,
  Heart,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { studentPublicService } from "@/services/studentService";
import { toast } from "sonner";
import { StudentPaymentPanel } from "./StudentPaymentPanel";

interface StudentProfileData {
  _id: string;
  userId: string;
  academyId:
    | string
    | null
    | {
        _id: string;
        name?: string;
        location?: string;
        fees?: {
          monthly: number;
          quarterly: number;
          halfYearly: number;
          yearly: number;
        };
      };
  trainerId: string | null;
  enrollmentDate: string | null;
  totalFeesPaid: number;
  outstandingFees: number;
  sports: string[];
  level:
    | "beginner"
    | "intermediate"
    | "advanced"
    | "U12"
    | "U14"
    | "U16"
    | "U19"
    | "U23";
  isActive: boolean;
  medicalInfo?: {
    allergies?: string[];
    medications?: string[];
    emergencyContact: {
      name: string;
      phone: string;
      relation: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export default function StudentProfile() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [studentProfile, setStudentProfile] =
    useState<StudentProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<
    Partial<StudentProfileData>
  >({});

  // Fetch student profile on mount
  useEffect(() => {
    fetchStudentProfile();
  }, []);

  const fetchStudentProfile = async () => {
    try {
      setIsLoading(true);
      const response = await studentPublicService.getOwnStudentProfile();

      if (response.success) {
        setStudentProfile(response.data.studentProfile);
        setEditedProfile(response.data.studentProfile);
      } else {
        toast.error("Failed to load student profile");
      }
    } catch (error: any) {
      console.error("Error fetching student profile:", error);
      toast.error(error.message || "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile(studentProfile || {});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile(studentProfile || {});
  };

  const handleSave = async () => {
    try {
      // Validate football is in sports
      if (!editedProfile.sports?.includes("football")) {
        toast.error("Football is mandatory and cannot be removed");
        return;
      }

      // Validate emergency contact details
      if (editedProfile.medicalInfo) {
        const emergencyContact = editedProfile.medicalInfo.emergencyContact;

        if (!emergencyContact?.name?.trim()) {
          toast.error("Emergency contact name is required");
          return;
        }

        if (!emergencyContact?.phone?.trim()) {
          toast.error("Emergency contact phone is required");
          return;
        }

        if (!emergencyContact?.relation?.trim()) {
          toast.error("Emergency contact relation is required");
          return;
        }

        // Validate phone number format (basic check for digits)
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(emergencyContact.phone.replace(/\s+/g, ""))) {
          toast.error(
            "Emergency contact phone must be a valid 10-digit number",
          );
          return;
        }
      }

      toast.loading("Updating profile...");

      const updateData = {
        sports: editedProfile.sports,
        level: editedProfile.level,
        medicalInfo: editedProfile.medicalInfo,
      };

      const response =
        await studentPublicService.updateOwnStudentProfile(updateData);

      if (response.success) {
        setStudentProfile(response.data.studentProfile);
        setIsEditing(false);
        toast.dismiss();
        toast.success("Profile updated successfully!");
      }

      fetchStudentProfile();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.dismiss();
      toast.error(error.message || "Failed to update profile");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!studentProfile) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            No Student Profile Found
          </h3>
          <p className="text-slate-500 mb-4">
            You haven't created a student profile yet.
          </p>
          <Button onClick={() => navigate("/student/register/create")}>
            Create Student Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-900 text-2xl">
                Student Profile
              </CardTitle>
              <CardDescription className="text-slate-500">
                Manage your student information and preferences
              </CardDescription>
            </div>
            {!isEditing ? (
              <Button
                variant="outline"
                onClick={handleEdit}
                className="border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Student Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Profile Information */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-slate-900">Athletic Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sports */}
          <div className="space-y-2">
            <Label className="text-slate-700">Sports</Label>
            {isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    "football",
                    "basketball",
                    "cricket",
                    "tennis",
                    "badminton",
                    "swimming",
                  ].map((sport) => (
                    <div
                      key={sport}
                      className="flex items-center space-x-2 p-2 rounded-lg border border-slate-200"
                    >
                      <Checkbox
                        id={sport}
                        checked={editedProfile.sports?.includes(sport)}
                        onCheckedChange={(checked) => {
                          if (sport === "football") return; // Can't uncheck football
                          const currentSports = editedProfile.sports || [];
                          setEditedProfile({
                            ...editedProfile,
                            sports: checked
                              ? [...currentSports, sport]
                              : currentSports.filter((s) => s !== sport),
                          });
                        }}
                        disabled={sport === "football"}
                      />
                      <Label
                        htmlFor={sport}
                        className="text-slate-900 capitalize cursor-pointer"
                      >
                        {sport}
                        {sport === "football" && (
                          <span className="text-xs text-blue-600 ml-1">
                            (Required)
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {studentProfile.sports.map((sport) => (
                  <Badge
                    key={sport}
                    variant="secondary"
                    className="bg-blue-500/20 text-blue-300 border-blue-500/50 capitalize"
                  >
                    {sport}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator className="bg-slate-200" />

          {/* Skill Level */}
          <div className="space-y-2">
            <Label className="text-slate-700">Skill Level</Label>
            {isEditing ? (
              <RadioGroup
                value={editedProfile.level}
                onValueChange={(value: any) =>
                  setEditedProfile({ ...editedProfile, level: value })
                }
                className="grid grid-cols-3 gap-3"
              >
                {(editedProfile.sports?.includes("cricket")
                  ? ["U12", "U14", "U16", "U19", "U23"]
                  : ["beginner", "intermediate", "advanced"]
                ).map((level) => (
                  <div
                    key={level}
                    className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${
                      editedProfile.level === level
                        ? "bg-blue-50 border-blue-500"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <RadioGroupItem
                      value={level}
                      id={level}
                      className="border-slate-300 text-slate-900"
                    />
                    <Label
                      htmlFor={level}
                      className="text-slate-900 cursor-pointer capitalize flex-1"
                    >
                      {level}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div>
                <Badge
                  variant="secondary"
                  className={`capitalize ${
                    studentProfile.level === "beginner"
                      ? "bg-green-100 text-green-700 border-green-200"
                      : studentProfile.level === "intermediate"
                        ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                        : "bg-red-100 text-red-700 border-red-200"
                  }`}
                >
                  {studentProfile.level}
                </Badge>
              </div>
            )}
          </div>

          <Separator className="bg-slate-200" />

          {/* Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700">Status</Label>
              <div>
                <Badge
                  variant="secondary"
                  className={
                    studentProfile.isActive
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }
                >
                  {studentProfile.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            {studentProfile.enrollmentDate && (
              <div className="space-y-2">
                <Label className="text-slate-700">Enrollment Date</Label>
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="h-4 w-4" />
                  {new Date(studentProfile.enrollmentDate).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Medical Information */}
      {studentProfile.medicalInfo && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              <CardTitle className="text-slate-900">Medical Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Allergies */}
            <div className="space-y-2">
              <Label className="text-slate-700">Allergies</Label>
              {isEditing ? (
                <Textarea
                  placeholder="Enter allergies separated by commas (e.g., dust, pollen)"
                  value={editedProfile.medicalInfo?.allergies?.join(", ") || ""}
                  onChange={(e) => {
                    const allergies = e.target.value
                      .split(",")
                      .map((a) => a.trim())
                      .filter(Boolean);
                    setEditedProfile({
                      ...editedProfile,
                      medicalInfo: {
                        medications: [],
                        emergencyContact: { name: "", phone: "", relation: "" },
                        ...editedProfile.medicalInfo,
                        allergies,
                      },
                    });
                  }}
                  className="bg-white border-slate-200 text-slate-900"
                  rows={2}
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {studentProfile.medicalInfo.allergies &&
                  studentProfile.medicalInfo.allergies.length > 0 ? (
                    studentProfile.medicalInfo.allergies.map(
                      (allergy, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-red-100 text-red-700 border-red-200"
                        >
                          {allergy}
                        </Badge>
                      ),
                    )
                  ) : (
                    <p className="text-slate-500 text-sm">No allergies listed</p>
                  )}
                </div>
              )}
            </div>

            {/* Medications */}
            <div className="space-y-2">
              <Label className="text-slate-700">Current Medications</Label>
              {isEditing ? (
                <Textarea
                  placeholder="Enter medications separated by commas (e.g., inhaler, insulin)"
                  value={
                    editedProfile.medicalInfo?.medications?.join(", ") || ""
                  }
                  onChange={(e) => {
                    const medications = e.target.value
                      .split(",")
                      .map((m) => m.trim())
                      .filter(Boolean);
                    setEditedProfile({
                      ...editedProfile,
                      medicalInfo: {
                        allergies: [],
                        emergencyContact: { name: "", phone: "", relation: "" },
                        ...editedProfile.medicalInfo,
                        medications,
                      },
                    });
                  }}
                  className="bg-white border-slate-200 text-slate-900"
                  rows={2}
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {studentProfile.medicalInfo?.medications &&
                  studentProfile.medicalInfo.medications.length > 0 ? (
                    studentProfile.medicalInfo.medications.map(
                      (medication, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-purple-100 text-purple-700 border-purple-200"
                        >
                          {medication}
                        </Badge>
                      ),
                    )
                  ) : (
                    <p className="text-slate-500 text-sm">
                      No medications listed
                    </p>
                  )}
                </div>
              )}
            </div>

            <Separator className="bg-slate-200" />

            {/* Emergency Contact */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-yellow-500" />
                <Label className="text-slate-900 font-semibold">
                  Emergency Contact
                </Label>
              </div>

              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-500 text-sm">Name</Label>
                    <Input
                      value={
                        editedProfile.medicalInfo?.emergencyContact?.name || ""
                      }
                      onChange={(e) =>
                        setEditedProfile({
                          ...editedProfile,
                          medicalInfo: {
                            ...editedProfile.medicalInfo,
                            emergencyContact: {
                              phone: editedProfile.medicalInfo?.emergencyContact?.phone ?? "",
                              relation: editedProfile.medicalInfo?.emergencyContact?.relation ?? "",
                              name: e.target.value,
                            },
                          },
                        })
                      }
                      className="bg-white border-slate-200 text-slate-900"
                      placeholder="Emergency contact name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-500 text-sm">Phone</Label>
                    <Input
                      value={
                        editedProfile.medicalInfo?.emergencyContact?.phone || ""
                      }
                      onChange={(e) =>
                        setEditedProfile({
                          ...editedProfile,
                          medicalInfo: {
                            ...editedProfile.medicalInfo,
                            emergencyContact: {
                              name: editedProfile.medicalInfo?.emergencyContact?.name ?? "",
                              relation: editedProfile.medicalInfo?.emergencyContact?.relation ?? "",
                              phone: e.target.value,
                            },
                          },
                        })
                      }
                      className="bg-white border-slate-200 text-slate-900"
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-500 text-sm">Relation</Label>
                    <Input
                      value={
                        editedProfile.medicalInfo?.emergencyContact?.relation ||
                        ""
                      }
                      onChange={(e) =>
                        setEditedProfile({
                          ...editedProfile,
                          medicalInfo: {
                            ...editedProfile.medicalInfo,
                            emergencyContact: {
                              name: editedProfile.medicalInfo?.emergencyContact?.name ?? "",
                              phone: editedProfile.medicalInfo?.emergencyContact?.phone ?? "",
                              relation: e.target.value,
                            },
                          },
                        })
                      }
                      className="bg-white border-slate-200 text-slate-900"
                      placeholder="Relation (e.g., Mother)"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-slate-500 text-sm">Name</Label>
                    <p className="text-slate-900">
                      {studentProfile.medicalInfo?.emergencyContact?.name || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-500 text-sm">Phone</Label>
                    <p className="text-slate-900">
                      {studentProfile.medicalInfo?.emergencyContact?.phone || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-500 text-sm">Relation</Label>
                    <p className="text-slate-900 capitalize">
                      {studentProfile.medicalInfo?.emergencyContact?.relation || "N/A"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Information */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            <CardTitle className="text-slate-900">Financial Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-slate-500 text-sm">Total Fees Paid</Label>
              <p className="text-2xl font-bold text-green-600">
                ₹{studentProfile.totalFeesPaid.toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-500 text-sm">Outstanding Fees</Label>
              <p className="text-2xl font-bold text-red-600 mb-4">
                ₹{studentProfile.outstandingFees.toLocaleString()}
              </p>
              {studentProfile.outstandingFees > 0 && (
                <StudentPaymentPanel 
                  outstandingFees={studentProfile.outstandingFees} 
                  onPaymentSuccess={fetchStudentProfile}
                  academyFees={
                    typeof studentProfile.academyId === "object" && studentProfile.academyId?.fees
                      ? studentProfile.academyId.fees
                      : undefined
                  }
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
