import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

interface StudentProfileData {
  _id: string;
  userId: string;
  academyId: string | null;
  trainerId: string | null;
  enrollmentDate: string | null;
  totalFeesPaid: number;
  outstandingFees: number;
  sports: string[];
  level: "beginner" | "intermediate" | "advanced";
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
      <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Student Profile Found
          </h3>
          <p className="text-gray-400 mb-4">
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
      <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-2xl">
                Student Profile
              </CardTitle>
              <CardDescription>
                Manage your student information and preferences
              </CardDescription>
            </div>
            {!isEditing ? (
              <Button
                variant="outline"
                onClick={handleEdit}
                className="border-gray-600"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Student Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="border-gray-600 text-black"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700"
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
      <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <CardTitle className="text-white">Athletic Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sports */}
          <div className="space-y-2">
            <Label className="text-white">Sports</Label>
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
                      className="flex items-center space-x-2 p-2 rounded-lg border border-gray-700"
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
                        className="text-white capitalize cursor-pointer"
                      >
                        {sport}
                        {sport === "football" && (
                          <span className="text-xs text-blue-400 ml-1">
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

          <Separator className="bg-gray-700" />

          {/* Skill Level */}
          <div className="space-y-2">
            <Label className="text-white">Skill Level</Label>
            {isEditing ? (
              <RadioGroup
                value={editedProfile.level}
                onValueChange={(value: any) =>
                  setEditedProfile({ ...editedProfile, level: value })
                }
                className="grid grid-cols-3 gap-3"
              >
                {(["beginner", "intermediate", "advanced"] as const).map(
                  (level) => (
                    <div
                      key={level}
                      className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${
                        editedProfile.level === level
                          ? "bg-blue-500/20 border-blue-500"
                          : "bg-gray-800/50 border-gray-700 hover:bg-gray-700/50"
                      }`}
                    >
                      <RadioGroupItem
                        value={level}
                        id={level}
                        className="border-gray-400 text-white"
                      />
                      <Label
                        htmlFor={level}
                        className="text-white cursor-pointer capitalize flex-1"
                      >
                        {level}
                      </Label>
                    </div>
                  ),
                )}
              </RadioGroup>
            ) : (
              <div>
                <Badge
                  variant="secondary"
                  className={`capitalize ${
                    studentProfile.level === "beginner"
                      ? "bg-green-500/20 text-green-300 border-green-500/50"
                      : studentProfile.level === "intermediate"
                        ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/50"
                        : "bg-red-500/20 text-red-300 border-red-500/50"
                  }`}
                >
                  {studentProfile.level}
                </Badge>
              </div>
            )}
          </div>

          <Separator className="bg-gray-700" />

          {/* Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Status</Label>
              <div>
                <Badge
                  variant="secondary"
                  className={
                    studentProfile.isActive
                      ? "bg-green-500/20 text-green-300 border-green-500/50"
                      : "bg-gray-500/20 text-gray-300 border-gray-500/50"
                  }
                >
                  {studentProfile.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            {studentProfile.enrollmentDate && (
              <div className="space-y-2">
                <Label className="text-white">Enrollment Date</Label>
                <div className="flex items-center gap-2 text-gray-300">
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
        <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-400" />
              <CardTitle className="text-white">Medical Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Allergies */}
            <div className="space-y-2">
              <Label className="text-white">Allergies</Label>
              {isEditing ? (
                <Textarea
                  placeholder="Enter allergies separated by commas (e.g., peanuts, shellfish)"
                  value={editedProfile.medicalInfo?.allergies?.join(", ") || ""}
                  onChange={(e) => {
                    const allergies = e.target.value
                      .split(",")
                      .map((a) => a.trim())
                      .filter(Boolean);
                    setEditedProfile({
                      ...editedProfile,
                      medicalInfo: {
                        ...editedProfile.medicalInfo!,
                        allergies,
                      },
                    });
                  }}
                  className="bg-gray-800 border-gray-700 text-white"
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
                          className="bg-red-500/20 text-red-300 border-red-500/50"
                        >
                          {allergy}
                        </Badge>
                      ),
                    )
                  ) : (
                    <p className="text-gray-400 text-sm">No allergies listed</p>
                  )}
                </div>
              )}
            </div>

            {/* Medications */}
            <div className="space-y-2">
              <Label className="text-white">Current Medications</Label>
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
                        ...editedProfile.medicalInfo!,
                        medications,
                      },
                    });
                  }}
                  className="bg-gray-800 border-gray-700 text-white"
                  rows={2}
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {studentProfile.medicalInfo.medications &&
                  studentProfile.medicalInfo.medications.length > 0 ? (
                    studentProfile.medicalInfo.medications.map(
                      (medication, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-purple-500/20 text-purple-300 border-purple-500/50"
                        >
                          {medication}
                        </Badge>
                      ),
                    )
                  ) : (
                    <p className="text-gray-400 text-sm">
                      No medications listed
                    </p>
                  )}
                </div>
              )}
            </div>

            <Separator className="bg-gray-700" />

            {/* Emergency Contact */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-yellow-400" />
                <Label className="text-white font-semibold">
                  Emergency Contact
                </Label>
              </div>

              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-400 text-sm">Name</Label>
                    <Input
                      value={
                        editedProfile.medicalInfo?.emergencyContact?.name || ""
                      }
                      onChange={(e) =>
                        setEditedProfile({
                          ...editedProfile,
                          medicalInfo: {
                            ...editedProfile.medicalInfo!,
                            emergencyContact: {
                              ...editedProfile.medicalInfo!.emergencyContact,
                              name: e.target.value,
                            },
                          },
                        })
                      }
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Emergency contact name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400 text-sm">Phone</Label>
                    <Input
                      value={
                        editedProfile.medicalInfo?.emergencyContact?.phone || ""
                      }
                      onChange={(e) =>
                        setEditedProfile({
                          ...editedProfile,
                          medicalInfo: {
                            ...editedProfile.medicalInfo!,
                            emergencyContact: {
                              ...editedProfile.medicalInfo!.emergencyContact,
                              phone: e.target.value,
                            },
                          },
                        })
                      }
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400 text-sm">Relation</Label>
                    <Input
                      value={
                        editedProfile.medicalInfo?.emergencyContact?.relation ||
                        ""
                      }
                      onChange={(e) =>
                        setEditedProfile({
                          ...editedProfile,
                          medicalInfo: {
                            ...editedProfile.medicalInfo!,
                            emergencyContact: {
                              ...editedProfile.medicalInfo!.emergencyContact,
                              relation: e.target.value,
                            },
                          },
                        })
                      }
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Relation (e.g., Mother)"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-gray-400 text-sm">Name</Label>
                    <p className="text-white">
                      {studentProfile.medicalInfo.emergencyContact.name}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-400 text-sm">Phone</Label>
                    <p className="text-white">
                      {studentProfile.medicalInfo.emergencyContact.phone}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-400 text-sm">Relation</Label>
                    <p className="text-white capitalize">
                      {studentProfile.medicalInfo.emergencyContact.relation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Information */}
      <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-400" />
            <CardTitle className="text-white">Financial Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Total Fees Paid</Label>
              <p className="text-2xl font-bold text-green-400">
                ₹{studentProfile.totalFeesPaid.toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Outstanding Fees</Label>
              <p className="text-2xl font-bold text-red-400">
                ₹{studentProfile.outstandingFees.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
