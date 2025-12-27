import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { academyService } from "@/services/academyService";
import { studentAdminService } from "@/services/studentService";
import { trainerAdminService } from "@/services/trainerService";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  UserMinus,
  Search,
  Loader,
  GraduationCap,
  BookOpen,
  AlertTriangle,
} from "lucide-react";

interface AcademyMemberManagementProps {
  academyId: string;
  academyName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Member {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  sports?: string[];
}

export const AcademyMemberManagement: React.FC<
  AcademyMemberManagementProps
> = ({ academyId, academyName, isOpen, onClose }) => {
  const [trainers, setTrainers] = useState<Member[]>([]);
  const [students, setStudents] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [memberType, setMemberType] = useState<"student" | "trainer">(
    "student",
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addSearchTerm, setAddSearchTerm] = useState("");
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{
    id: string;
    type: "student" | "trainer";
    name: string;
  } | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await academyService.getAcademyMembers(academyId);
      setTrainers(response.data.trainers || []);
      setStudents(response.data.students || []);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load academy members");
    } finally {
      setIsLoading(false);
    }
  }, [academyId]);

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen, fetchMembers]);

  const fetchAvailableMembers = async () => {
    try {
      setIsLoading(true);
      if (memberType === "student") {
        const response = await studentAdminService.getAllStudents({
          limit: 100,
        });
        const studentsList = response?.data?.students || [];
        // Filter out students already in this academy
        // The API returns students with userId field containing the user's ObjectId
        const filtered = studentsList.filter(
          (s: any) => !students.some((existing) => existing._id === s.userId),
        );
        setAvailableMembers(filtered);
      } else {
        const response = await trainerAdminService.getAllTrainers({
          limit: 100,
        });
        // Filter out trainers already in this academy
        // The API returns trainers with userId field containing the user's ObjectId
        const filtered = response.data.trainers.filter(
          (t: any) => !trainers.some((existing) => existing._id === t.userId),
        );
        setAvailableMembers(filtered);
      }
    } catch (error) {
      console.error("Error fetching available members:", error);
      toast.error(`Failed to load ${memberType}s`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddDialog = async (type: "student" | "trainer") => {
    setMemberType(type);
    setSelectedMemberId("");
    setAddSearchTerm("");
    setIsAddDialogOpen(true);
    await fetchAvailableMembers();
  };

  const handleAddMember = async () => {
    if (!selectedMemberId) {
      toast.error("Please select a member to add");
      return;
    }

    try {
      setIsAddingMember(true);
      if (memberType === "student") {
        await academyService.addStudentToAcademy(academyId, selectedMemberId);
        toast.success("Student added to academy successfully!");
      } else {
        await academyService.addTrainerToAcademy(academyId, selectedMemberId);
        toast.success("Trainer added to academy successfully!");
      }
      setIsAddDialogOpen(false);
      await fetchMembers();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          `Failed to add ${memberType} to academy`,
      );
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = (
    memberId: string,
    type: "student" | "trainer",
    name: string,
  ) => {
    setMemberToRemove({ id: memberId, type, name });
    setRemoveDialogOpen(true);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      if (memberToRemove.type === "student") {
        await academyService.removeStudentFromAcademy(
          academyId,
          memberToRemove.id,
        );
        toast.success("Student removed from academy");
      } else {
        await academyService.removeTrainerFromAcademy(
          academyId,
          memberToRemove.id,
        );
        toast.success("Trainer removed from academy");
      }
      await fetchMembers();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          `Failed to remove ${memberToRemove.type} from academy`,
      );
    } finally {
      setRemoveDialogOpen(false);
      setMemberToRemove(null);
    }
  };

  const filterMembers = (members: Member[]) => {
    if (!searchTerm) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  const filteredTrainers = filterMembers(trainers);
  const filteredStudents = filterMembers(students);

  const filteredAvailableMembers = availableMembers.filter((member) => {
    const userName = member.user?.name || member.userId?.name || "";
    const userEmail = member.user?.email || member.userId?.email || "";
    return (
      userName.toLowerCase().includes(addSearchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(addSearchTerm.toLowerCase())
    );
  });

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[90vw] max-w-[90vw] h-[90vh] max-h-[90vh] overflow-hidden flex flex-col bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900 text-2xl">
              Manage Academy Members
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {academyName} - Add or remove trainers and students
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-1">
            {/* Search Bar */}
            <div className="mb-6 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search members by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300"
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-green-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trainers Section */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-blue-900">
                          Trainers ({trainers.length})
                        </CardTitle>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleOpenAddDialog("trainer")}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Trainer
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {filteredTrainers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>
                            {searchTerm
                              ? "No trainers found"
                              : "No trainers in this academy"}
                          </p>
                        </div>
                      ) : (
                        filteredTrainers.map((trainer) => (
                          <motion.div
                            key={trainer._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-lg p-4 border border-blue-200 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">
                                  {trainer.name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {trainer.email}
                                </p>
                                {trainer.phone && (
                                  <p className="text-sm text-gray-500">
                                    {trainer.phone}
                                  </p>
                                )}
                                {trainer.sports &&
                                  trainer.sports.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {trainer.sports.map((sport) => (
                                        <Badge
                                          key={sport}
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          {sport}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleRemoveMember(
                                    trainer._id,
                                    "trainer",
                                    trainer.name,
                                  )
                                }
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Students Section */}
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-green-600" />
                        <CardTitle className="text-green-900">
                          Students ({students.length})
                        </CardTitle>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleOpenAddDialog("student")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Student
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {filteredStudents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>
                            {searchTerm
                              ? "No students found"
                              : "No students in this academy"}
                          </p>
                        </div>
                      ) : (
                        filteredStudents.map((student) => (
                          <motion.div
                            key={student._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-lg p-4 border border-green-200 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">
                                  {student.name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {student.email}
                                </p>
                                {student.phone && (
                                  <p className="text-sm text-gray-500">
                                    {student.phone}
                                  </p>
                                )}
                                {student.sports &&
                                  student.sports.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {student.sports.map((sport) => (
                                        <Badge
                                          key={sport}
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          {sport}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleRemoveMember(
                                    student._id,
                                    "student",
                                    student.name,
                                  )
                                }
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-white w-[90vw] max-w-4xl h-[80vh] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-gray-900 text-2xl">
              Add {memberType === "student" ? "Student" : "Trainer"}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Select a {memberType} to add to {academyName}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={`Search ${memberType}s by name or email...`}
                value={addSearchTerm}
                onChange={(e) => setAddSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300"
              />
            </div>

            {/* Available Members List */}
            <div className="space-y-2">
              <Label className="text-gray-900 text-sm font-medium">
                Available {memberType === "student" ? "Students" : "Trainers"} (
                {filteredAvailableMembers.length})
              </Label>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="h-8 w-8 animate-spin text-green-500" />
                </div>
              ) : filteredAvailableMembers.length === 0 ? (
                <div className="text-center py-12 text-gray-500 border rounded-lg bg-gray-50">
                  <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p className="font-medium">
                    {addSearchTerm
                      ? `No ${memberType}s found matching "${addSearchTerm}"`
                      : `No ${memberType}s available to add`}
                  </p>
                  <p className="text-sm mt-1">
                    {addSearchTerm
                      ? "Try a different search term"
                      : `All ${memberType}s may already be in this academy`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[450px] overflow-y-auto pr-2">
                  {filteredAvailableMembers.map((member) => {
                    const userId = member.userId;
                    const userName = member.user?.name || "Unknown";
                    const userEmail = member.user?.email || "";
                    const userPhone = member.user?.phone || "";
                    const sports = member.sports || [];

                    return (
                      <motion.div
                        key={member._id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedMemberId === userId
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 bg-white hover:border-green-300 hover:shadow-md"
                        }`}
                        onClick={() => setSelectedMemberId(userId)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">
                              {userName}
                            </h4>
                            <p className="text-sm text-gray-600">{userEmail}</p>
                            {userPhone && (
                              <p className="text-sm text-gray-500">
                                {userPhone}
                              </p>
                            )}
                            {sports.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {sports.map((sport: string) => (
                                  <Badge
                                    key={sport}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {sport}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          {selectedMemberId === userId && (
                            <div className="ml-2 bg-green-500 rounded-full p-1">
                              <svg
                                className="w-4 h-4 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isAddingMember}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={!selectedMemberId || isAddingMember}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              {isAddingMember ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add {memberType === "student" ? "Student" : "Trainer"}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-gray-900">
                Remove{" "}
                {memberToRemove?.type === "student" ? "Student" : "Trainer"}?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-gray-600 pt-2">
              Are you sure you want to remove{" "}
              <span className="font-semibold">{memberToRemove?.name}</span> from{" "}
              <span className="font-semibold">{academyName}</span>? This will
              also clear their academy association from their profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMember}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remove{" "}
              {memberToRemove?.type === "student" ? "Student" : "Trainer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
