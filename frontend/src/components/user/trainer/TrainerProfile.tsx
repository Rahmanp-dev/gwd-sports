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
      toast.loading("Updating profile...");

      const updateData = {
        sports: editedProfile.sports,
        specializations: editedProfile.specializations,
        hourlyRate: editedProfile.hourlyRate,
        availability: editedProfile.availability,
      };

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
                className="border-gray-600 text-white hover:bg-gray-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="border-gray-600 text-white hover:bg-gray-700"
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
          </div>

          <Separator className="bg-gray-700" />

          {/* Specializations */}
          <div className="space-y-2">
            <Label className="text-white">Specializations</Label>
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
      {trainerProfile.qualifications &&
        trainerProfile.qualifications.length > 0 && (
          <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-400" />
                <CardTitle className="text-white">
                  Qualifications & Certifications
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {trainerProfile.qualifications.map((qual, index) => (
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
        )}

      {/* Experience */}
      {trainerProfile.experience && trainerProfile.experience.length > 0 && (
        <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-400" />
              <CardTitle className="text-white">Work Experience</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {trainerProfile.experience.map((exp) => (
              <div
                key={exp._id}
                className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-white font-semibold">{exp.position}</h4>
                    <p className="text-gray-400 text-sm">{exp.organization}</p>
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
      )}

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
          {trainerProfile.hourlyRate && (
            <div className="space-y-2">
              <Label className="text-white">Hourly Rate</Label>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                <span className="text-2xl font-bold text-green-400">
                  ₹{trainerProfile.hourlyRate}
                </span>
                <span className="text-gray-400">/hour</span>
              </div>
            </div>
          )}

          <Separator className="bg-gray-700" />

          {/* Available Days */}
          <div className="space-y-2">
            <Label className="text-white">Available Days</Label>
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
          </div>

          <Separator className="bg-gray-700" />

          {/* Time Slots */}
          <div className="space-y-2">
            <Label className="text-white">Time Slots</Label>
            <div className="space-y-2">
              {trainerProfile.availability.timeSlots.map((slot, index) => (
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
