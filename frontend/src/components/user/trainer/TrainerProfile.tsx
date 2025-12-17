import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Edit,
  Save,
  X,
  AlertCircle,
  Loader2,
  Trophy,
  Award,
  Briefcase,
  Clock,
  DollarSign,
  Star,
  Users,
  CheckCircle,
  Plus,
  Trash2,
} from "lucide-react";
import {
  trainerService,
  type ITrainerProfile,
} from "@/services/trainerService";
import { toast } from "sonner";

export default function TrainerProfile() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [trainerProfile, setTrainerProfile] = useState<ITrainerProfile | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<ITrainerProfile>>(
    {},
  );

  // Fetch trainer profile on mount
  useEffect(() => {
    fetchTrainerProfile();
  }, []);

  const fetchTrainerProfile = async () => {
    try {
      setIsLoading(true);
      const response = await trainerService.getOwnTrainerProfile();

      if (response.success) {
        setTrainerProfile(response.data.trainerProfile);
        setEditedProfile(response.data.trainerProfile);
      } else {
        console.error("Failed to load trainer profile:", response);
        toast.error("Failed to load trainer profile");
      }
    } catch (error: any) {
      console.error("Error fetching trainer profile:", error);
      toast.error(error.message || "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile(trainerProfile || {});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile(trainerProfile || {});
  };

  const handleSave = async () => {
    try {
      // Validate football is in sports
      if (!editedProfile.sports?.some((s) => s.toLowerCase() === "football")) {
        toast.error("Football is mandatory and cannot be removed");
        return;
      }

      // Validate qualifications
      if (
        editedProfile.qualifications &&
        editedProfile.qualifications.length > 0
      ) {
        for (let i = 0; i < editedProfile.qualifications.length; i++) {
          const qual = editedProfile.qualifications[i];
          if (!qual.certification?.trim()) {
            toast.error(
              `Qualification ${i + 1}: Certification name is required`,
            );
            return;
          }
          if (!qual.issuedBy?.trim()) {
            toast.error(`Qualification ${i + 1}: Issued by is required`);
            return;
          }
          if (!qual.issuedDate) {
            toast.error(`Qualification ${i + 1}: Issue date is required`);
            return;
          }
        }
      }

      // Validate experience
      if (editedProfile.experience && editedProfile.experience.length > 0) {
        for (let i = 0; i < editedProfile.experience.length; i++) {
          const exp = editedProfile.experience[i];
          if (!exp.position?.trim()) {
            toast.error(`Experience ${i + 1}: Position is required`);
            return;
          }
          if (!exp.organization?.trim()) {
            toast.error(`Experience ${i + 1}: Organization is required`);
            return;
          }
          if (!exp.startDate) {
            toast.error(`Experience ${i + 1}: Start date is required`);
            return;
          }
          if (!exp.description?.trim()) {
            toast.error(`Experience ${i + 1}: Description is required`);
            return;
          }
        }
      }

      // Validate time slots
      if (
        editedProfile.availability?.timeSlots &&
        editedProfile.availability.timeSlots.length > 0
      ) {
        for (let i = 0; i < editedProfile.availability.timeSlots.length; i++) {
          const slot = editedProfile.availability.timeSlots[i];
          if (!slot.start?.trim()) {
            toast.error(`Time Slot ${i + 1}: Start time is required`);
            return;
          }
          if (!slot.end?.trim()) {
            toast.error(`Time Slot ${i + 1}: End time is required`);
            return;
          }
          // Validate that end time is after start time
          if (slot.start && slot.end && slot.start >= slot.end) {
            toast.error(
              `Time Slot ${i + 1}: End time must be after start time`,
            );
            return;
          }
        }
      }

      // Validate specializations (no empty strings)
      if (
        editedProfile.specializations &&
        editedProfile.specializations.length > 0
      ) {
        const hasEmpty = editedProfile.specializations.some(
          (spec) => !spec.trim(),
        );
        if (hasEmpty) {
          toast.error("Please remove empty specializations or fill them in");
          return;
        }
      }

      toast.loading("Updating profile...");

      const updateData: any = {
        sports: editedProfile.sports,
        specializations: editedProfile.specializations?.filter((s) => s.trim()),
        availability: editedProfile.availability,
      };

      // Include qualifications if edited
      if (
        editedProfile.qualifications &&
        editedProfile.qualifications.length > 0
      ) {
        updateData.qualifications = editedProfile.qualifications.map((q) => ({
          certification: q.certification,
          issuedBy: q.issuedBy,
          issuedDate: q.issuedDate,
          expiryDate: q.expiryDate || undefined,
          certificateUrl: q.certificateUrl || undefined,
        }));
      }

      // Include experience if edited
      if (editedProfile.experience && editedProfile.experience.length > 0) {
        updateData.experience = editedProfile.experience.map((e) => ({
          organization: e.organization,
          position: e.position,
          startDate: e.startDate,
          endDate: e.endDate || undefined,
          description: e.description,
        }));
      }

      const response = await trainerService.updateOwnTrainerProfile(updateData);

      if (response.success) {
        setTrainerProfile(response.data.trainerProfile);
        setIsEditing(false);
        toast.dismiss();
        toast.success("Profile updated successfully!");
      }
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

  if (!trainerProfile) {
    return (
      <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Trainer Profile Found
          </h3>
          <p className="text-gray-400 mb-4">
            You haven't created a trainer profile yet.
          </p>
          <Button onClick={() => navigate("/trainer/create")}>
            Create Trainer Profile
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
                Trainer Profile
              </CardTitle>
              <CardDescription>
                Manage your trainer information and qualifications
              </CardDescription>
            </div>
            {!isEditing ? (
              <Button
                variant="outline"
                onClick={handleEdit}
                className="border-gray-600"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Trainer Profile
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

      {/* Professional Information */}
      <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <CardTitle className="text-white">
              Professional Information
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sports */}
          <div className="space-y-2">
            <Label className="text-white">Sports</Label>
            {isEditing ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  "football",
                  "basketball",
                  "volleyball",
                  "badminton",
                  "tennis",
                  "cricket",
                  "swimming",
                  "athletics",
                ].map((sport) => {
                  const isChecked =
                    editedProfile.sports?.some(
                      (s) => s.toLowerCase() === sport.toLowerCase(),
                    ) || false;
                  const isFootball = sport.toLowerCase() === "football";
                  return (
                    <div key={sport} className="flex items-center space-x-2">
                      <Checkbox
                        id={sport}
                        checked={isChecked}
                        disabled={isFootball}
                        onCheckedChange={(checked) => {
                          if (isFootball) return;
                          const updatedSports = checked
                            ? [...(editedProfile.sports || []), sport]
                            : (editedProfile.sports || []).filter(
                                (s) => s.toLowerCase() !== sport.toLowerCase(),
                              );
                          setEditedProfile({
                            ...editedProfile,
                            sports: updatedSports,
                          });
                        }}
                        className="border-gray-500"
                      />
                      <Label
                        htmlFor={sport}
                        className={`text-sm capitalize cursor-pointer ${
                          isFootball ? "text-gray-500" : "text-white"
                        }`}
                      >
                        {sport} {isFootball && "(Mandatory)"}
                      </Label>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {trainerProfile.sports.map((sport) => (
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

          {/* Specializations */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white">Specializations</Label>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditedProfile({
                      ...editedProfile,
                      specializations: [
                        ...(editedProfile.specializations || []),
                        "",
                      ],
                    });
                  }}
                  className="border-gray-600"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-2">
                {(editedProfile.specializations || []).map((spec, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={spec}
                      onChange={(e) => {
                        const updated = [
                          ...(editedProfile.specializations || []),
                        ];
                        updated[index] = e.target.value;
                        setEditedProfile({
                          ...editedProfile,
                          specializations: updated,
                        });
                      }}
                      placeholder="Enter specialization"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const updated = (
                          editedProfile.specializations || []
                        ).filter((_, i) => i !== index);
                        setEditedProfile({
                          ...editedProfile,
                          specializations: updated,
                        });
                      }}
                      className="border-gray-600 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {trainerProfile.specializations.map((spec, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-purple-500/20 text-purple-300 border-purple-500/50"
                  >
                    {spec}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator className="bg-gray-700" />

          {/* Status and Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Status</Label>
              <div>
                <Badge
                  variant="secondary"
                  className={
                    trainerProfile.isActive
                      ? "bg-green-500/20 text-green-300 border-green-500/50"
                      : "bg-gray-500/20 text-gray-300 border-gray-500/50"
                  }
                >
                  {trainerProfile.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Students</Label>
              <div className="flex items-center gap-2 text-gray-300">
                <Users className="h-4 w-4" />
                {trainerProfile.students.length} Active
              </div>
            </div>

            {trainerProfile.joinedDate && (
              <div className="space-y-2">
                <Label className="text-white">Joined Date</Label>
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="h-4 w-4" />
                  {new Date(trainerProfile.joinedDate).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Qualifications */}
      {(trainerProfile.qualifications &&
        trainerProfile.qualifications.length > 0) ||
      isEditing ? (
        <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-400" />
                <CardTitle className="text-white">
                  Qualifications & Certifications
                </CardTitle>
              </div>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditedProfile({
                      ...editedProfile,
                      qualifications: [
                        ...(editedProfile.qualifications || []),
                        {
                          _id: `temp-${Date.now()}`,
                          certification: "",
                          issuedBy: "",
                          issuedDate: "",
                          expiryDate: "",
                          certificateUrl: "",
                        } as any,
                      ],
                    });
                  }}
                  className="border-gray-600"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Qualification
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing
              ? (editedProfile.qualifications || []).map((qual, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="text-white font-semibold">
                        Qualification {index + 1}
                      </h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const updated = (
                            editedProfile.qualifications || []
                          ).filter((_, i) => i !== index);
                          setEditedProfile({
                            ...editedProfile,
                            qualifications: updated,
                          });
                        }}
                        className="border-gray-600 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-white text-sm">
                          Certification Name *
                        </Label>
                        <Input
                          value={qual.certification}
                          onChange={(e) => {
                            const updated = [
                              ...(editedProfile.qualifications || []),
                            ];
                            updated[index] = {
                              ...updated[index],
                              certification: e.target.value,
                            };
                            setEditedProfile({
                              ...editedProfile,
                              qualifications: updated,
                            });
                          }}
                          placeholder="e.g., UEFA B License"
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white text-sm">
                          Issued By *
                        </Label>
                        <Input
                          value={qual.issuedBy}
                          onChange={(e) => {
                            const updated = [
                              ...(editedProfile.qualifications || []),
                            ];
                            updated[index] = {
                              ...updated[index],
                              issuedBy: e.target.value,
                            };
                            setEditedProfile({
                              ...editedProfile,
                              qualifications: updated,
                            });
                          }}
                          placeholder="e.g., UEFA"
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white text-sm">
                          Issue Date *
                        </Label>
                        <Input
                          type="date"
                          value={
                            qual.issuedDate
                              ? new Date(qual.issuedDate)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) => {
                            const updated = [
                              ...(editedProfile.qualifications || []),
                            ];
                            updated[index] = {
                              ...updated[index],
                              issuedDate: e.target.value,
                            };
                            setEditedProfile({
                              ...editedProfile,
                              qualifications: updated,
                            });
                          }}
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white text-sm">
                          Expiry Date
                        </Label>
                        <Input
                          type="date"
                          value={
                            qual.expiryDate
                              ? new Date(qual.expiryDate)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) => {
                            const updated = [
                              ...(editedProfile.qualifications || []),
                            ];
                            updated[index] = {
                              ...updated[index],
                              expiryDate: e.target.value,
                            };
                            setEditedProfile({
                              ...editedProfile,
                              qualifications: updated,
                            });
                          }}
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-white text-sm">
                          Certificate URL
                        </Label>
                        <Input
                          value={qual.certificateUrl || ""}
                          onChange={(e) => {
                            const updated = [
                              ...(editedProfile.qualifications || []),
                            ];
                            updated[index] = {
                              ...updated[index],
                              certificateUrl: e.target.value,
                            };
                            setEditedProfile({
                              ...editedProfile,
                              qualifications: updated,
                            });
                          }}
                          placeholder="https://..."
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))
              : trainerProfile.qualifications?.map((qual) => (
                  <div
                    key={qual._id}
                    className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">
                          {qual.certification}
                        </h4>
                        <p className="text-gray-400 text-sm">
                          Issued by: {qual.issuedBy}
                        </p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-400">
                        <span className="font-medium">Issued:</span>{" "}
                        {new Date(qual.issuedDate).toLocaleDateString()}
                      </div>
                      {qual.expiryDate && (
                        <div className="text-gray-400">
                          <span className="font-medium">Expires:</span>{" "}
                          {new Date(qual.expiryDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Experience */}
      {(trainerProfile.experience && trainerProfile.experience.length > 0) ||
      isEditing ? (
        <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-white">Work Experience</CardTitle>
              </div>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditedProfile({
                      ...editedProfile,
                      experience: [
                        ...(editedProfile.experience || []),
                        {
                          _id: `temp-${Date.now()}`,
                          organization: "",
                          position: "",
                          startDate: "",
                          endDate: "",
                          description: "",
                        } as any,
                      ],
                    });
                  }}
                  className="border-gray-600"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Experience
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing
              ? (editedProfile.experience || []).map((exp, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="text-white font-semibold">
                        Experience {index + 1}
                      </h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const updated = (
                            editedProfile.experience || []
                          ).filter((_, i) => i !== index);
                          setEditedProfile({
                            ...editedProfile,
                            experience: updated,
                          });
                        }}
                        className="border-gray-600 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-white text-sm">Position *</Label>
                        <Input
                          value={exp.position}
                          onChange={(e) => {
                            const updated = [
                              ...(editedProfile.experience || []),
                            ];
                            updated[index] = {
                              ...updated[index],
                              position: e.target.value,
                            };
                            setEditedProfile({
                              ...editedProfile,
                              experience: updated,
                            });
                          }}
                          placeholder="e.g., Head Coach"
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white text-sm">
                          Organization *
                        </Label>
                        <Input
                          value={exp.organization}
                          onChange={(e) => {
                            const updated = [
                              ...(editedProfile.experience || []),
                            ];
                            updated[index] = {
                              ...updated[index],
                              organization: e.target.value,
                            };
                            setEditedProfile({
                              ...editedProfile,
                              experience: updated,
                            });
                          }}
                          placeholder="e.g., FC Barcelona Academy"
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white text-sm">
                          Start Date *
                        </Label>
                        <Input
                          type="date"
                          value={
                            exp.startDate
                              ? new Date(exp.startDate)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) => {
                            const updated = [
                              ...(editedProfile.experience || []),
                            ];
                            updated[index] = {
                              ...updated[index],
                              startDate: e.target.value,
                            };
                            setEditedProfile({
                              ...editedProfile,
                              experience: updated,
                            });
                          }}
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white text-sm">End Date</Label>
                        <Input
                          type="date"
                          value={
                            exp.endDate
                              ? new Date(exp.endDate)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) => {
                            const updated = [
                              ...(editedProfile.experience || []),
                            ];
                            updated[index] = {
                              ...updated[index],
                              endDate: e.target.value,
                            };
                            setEditedProfile({
                              ...editedProfile,
                              experience: updated,
                            });
                          }}
                          placeholder="Leave empty if current"
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-white text-sm">
                          Description *
                        </Label>
                        <Textarea
                          value={exp.description}
                          onChange={(e) => {
                            const updated = [
                              ...(editedProfile.experience || []),
                            ];
                            updated[index] = {
                              ...updated[index],
                              description: e.target.value,
                            };
                            setEditedProfile({
                              ...editedProfile,
                              experience: updated,
                            });
                          }}
                          placeholder="Describe your role and achievements"
                          rows={3}
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))
              : trainerProfile.experience?.map((exp) => (
                  <div
                    key={exp._id}
                    className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-white font-semibold">
                          {exp.position}
                        </h4>
                        <p className="text-gray-400 text-sm">
                          {exp.organization}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-blue-500/20 text-blue-300 border-blue-500/50"
                      >
                        {exp.endDate ? "Past" : "Current"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Calendar className="h-4 w-4" />
                      {new Date(exp.startDate).toLocaleDateString()} -{" "}
                      {exp.endDate
                        ? new Date(exp.endDate).toLocaleDateString()
                        : "Present"}
                    </div>
                    <p className="text-gray-300 text-sm">{exp.description}</p>
                  </div>
                ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Availability & Rates */}
      <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-400" />
            <CardTitle className="text-white">Availability & Pricing</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hourly Rate */}
          <div className="space-y-2">
            <Label className="text-white">Hourly Rate</Label>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-400">
                ₹{trainerProfile.hourlyRate}
              </span>
              <span className="text-gray-400">/hour</span>
            </div>
            {isEditing && (
              <p className="text-xs text-gray-500">
                Hourly rate can only be updated by admin
              </p>
            )}
          </div>

          <Separator className="bg-gray-700" />

          {/* Available Days */}
          <div className="space-y-2">
            <Label className="text-white">Available Days</Label>
            {isEditing ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                  "sunday",
                ].map((day) => {
                  const isChecked =
                    editedProfile.availability?.days?.some(
                      (d) => d.toLowerCase() === day.toLowerCase(),
                    ) || false;
                  return (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const currentDays =
                            editedProfile.availability?.days || [];
                          const updatedDays = checked
                            ? [...currentDays, day]
                            : currentDays.filter(
                                (d) => d.toLowerCase() !== day.toLowerCase(),
                              );
                          setEditedProfile({
                            ...editedProfile,
                            availability: {
                              ...editedProfile.availability,
                              days: updatedDays,
                              timeSlots:
                                editedProfile.availability?.timeSlots || [],
                            },
                          });
                        }}
                        className="border-gray-500"
                      />
                      <Label
                        htmlFor={`day-${day}`}
                        className="text-sm capitalize cursor-pointer text-white"
                      >
                        {day}
                      </Label>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {trainerProfile.availability.days.map((day) => (
                  <Badge
                    key={day}
                    variant="secondary"
                    className="bg-orange-500/20 text-orange-300 border-orange-500/50 capitalize"
                  >
                    {day}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator className="bg-gray-700" />

          {/* Time Slots */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white">Time Slots</Label>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentSlots =
                      editedProfile.availability?.timeSlots || [];
                    setEditedProfile({
                      ...editedProfile,
                      availability: {
                        ...editedProfile.availability,
                        days: editedProfile.availability?.days || [],
                        timeSlots: [
                          ...currentSlots,
                          {
                            _id: `temp-${Date.now()}`,
                            start: "",
                            end: "",
                          } as any,
                        ],
                      },
                    });
                  }}
                  className="border-gray-600"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Slot
                </Button>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-2">
                {(editedProfile.availability?.timeSlots || []).map(
                  (slot, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                    >
                      <Clock className="h-4 w-4 text-gray-400" />
                      <Input
                        type="time"
                        value={slot.start}
                        onChange={(e) => {
                          const updated = [
                            ...(editedProfile.availability?.timeSlots || []),
                          ];
                          updated[index] = {
                            ...updated[index],
                            start: e.target.value,
                          };
                          setEditedProfile({
                            ...editedProfile,
                            availability: {
                              ...editedProfile.availability,
                              days: editedProfile.availability?.days || [],
                              timeSlots: updated,
                            },
                          });
                        }}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                      <span className="text-white">-</span>
                      <Input
                        type="time"
                        value={slot.end}
                        onChange={(e) => {
                          const updated = [
                            ...(editedProfile.availability?.timeSlots || []),
                          ];
                          updated[index] = {
                            ...updated[index],
                            end: e.target.value,
                          };
                          setEditedProfile({
                            ...editedProfile,
                            availability: {
                              ...editedProfile.availability,
                              days: editedProfile.availability?.days || [],
                              timeSlots: updated,
                            },
                          });
                        }}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const updated = (
                            editedProfile.availability?.timeSlots || []
                          ).filter((_, i) => i !== index);
                          setEditedProfile({
                            ...editedProfile,
                            availability: {
                              ...editedProfile.availability,
                              days: editedProfile.availability?.days || [],
                              timeSlots: updated,
                            },
                          });
                        }}
                        className="border-gray-600 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {trainerProfile.availability.timeSlots.map((slot) => (
                  <div
                    key={slot._id}
                    className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                  >
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-white">
                      {slot.start} - {slot.end}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rating */}
      <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" />
            <CardTitle className="text-white">Rating & Reviews</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Average Rating</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 ${
                      star <= trainerProfile.rating.average
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-600"
                    }`}
                  />
                ))}
                <span className="text-2xl font-bold text-yellow-400">
                  {trainerProfile.rating.average.toFixed(1)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Total Reviews</Label>
              <p className="text-2xl font-bold text-white">
                {trainerProfile.rating.totalReviews}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
