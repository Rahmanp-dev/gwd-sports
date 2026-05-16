import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
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
  Star,
  DollarSign,
  X,
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

  // Add dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addDialogType, setAddDialogType] = useState<"student" | "trainer">("student");
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isFetchingAvailable, setIsFetchingAvailable] = useState(false);
  const [addSearchTerm, setAddSearchTerm] = useState("");

  // Remove dialog state
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
    if (isOpen) fetchMembers();
  }, [isOpen, fetchMembers]);

  // Fetch available members for a given type — type passed explicitly to avoid stale closure
  const fetchAvailableForType = async (type: "student" | "trainer") => {
    try {
      setIsFetchingAvailable(true);
      setAvailableMembers([]);

      if (type === "trainer") {
        const response = await trainerAdminService.getAllTrainers({ limit: 100 });
        const allTrainers: any[] = response?.data?.trainers || response?.trainers || [];

        const currentTrainerIds = new Set(trainers.map((t) => t._id));
        const filtered = allTrainers.filter(
          (t: any) => !currentTrainerIds.has(t.userId) && !currentTrainerIds.has(t.user?._id)
        );
        setAvailableMembers(filtered);
      } else {
        const response = await studentAdminService.getAllStudents({ limit: 100 });
        const allStudents: any[] = response?.data?.students || [];

        const currentStudentIds = new Set(students.map((s) => s._id));
        const filtered = allStudents.filter(
          (s: any) => !currentStudentIds.has(s.userId) && !currentStudentIds.has(s.user?._id)
        );
        setAvailableMembers(filtered);
      }
    } catch (error) {
      console.error("Error fetching available members:", error);
      toast.error(`Failed to load available ${type}s`);
    } finally {
      setIsFetchingAvailable(false);
    }
  };

  const handleOpenAddDialog = async (type: "student" | "trainer") => {
    setAddDialogType(type);
    setSelectedMemberId("");
    setAddSearchTerm("");
    setIsAddDialogOpen(true);
    await fetchAvailableForType(type);
  };

  const handleAddMember = async () => {
    if (!selectedMemberId) {
      toast.error("Please select a member to add");
      return;
    }

    try {
      setIsAddingMember(true);
      if (addDialogType === "trainer") {
        await academyService.addTrainerToAcademy(academyId, selectedMemberId);
        toast.success("Trainer added to academy successfully!");
      } else {
        await academyService.addStudentToAcademy(academyId, selectedMemberId);
        toast.success("Student added to academy successfully!");
      }
      setIsAddDialogOpen(false);
      await fetchMembers();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          `Failed to add ${addDialogType} to academy`
      );
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = (
    memberId: string,
    type: "student" | "trainer",
    name: string
  ) => {
    setMemberToRemove({ id: memberId, type, name });
    setRemoveDialogOpen(true);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      if (memberToRemove.type === "trainer") {
        await academyService.removeTrainerFromAcademy(academyId, memberToRemove.id);
        toast.success("Trainer removed from academy");
      } else {
        await academyService.removeStudentFromAcademy(academyId, memberToRemove.id);
        toast.success("Student removed from academy");
      }
      await fetchMembers();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          `Failed to remove ${memberToRemove.type} from academy`
      );
    } finally {
      setRemoveDialogOpen(false);
      setMemberToRemove(null);
    }
  };

  const filterMembers = (members: Member[]) => {
    if (!searchTerm.trim()) return members;
    const q = searchTerm.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  };

  const getDisplayInfo = (member: any, type: "student" | "trainer") => {
    if (type === "trainer") {
      const name = member.user?.name || "Unknown";
      const email = member.user?.email || "";
      const phone = member.user?.phone || "";
      const sports = member.sports || member.user?.sports || [];
      const hourlyRate = member.hourlyRate;
      const rating = member.rating?.average;
      const idToSend = member.userId || member.user?._id;
      return { name, email, phone, sports, hourlyRate, rating, idToSend };
    } else {
      const name = member.user?.name || member.userId?.name || "Unknown";
      const email = member.user?.email || member.userId?.email || "";
      const phone = member.user?.phone || member.userId?.phone || "";
      const sports = member.sports || [];
      const idToSend = member.userId?._id || member.userId || member.user?._id;
      return { name, email, phone, sports, idToSend };
    }
  };

  const filteredAvailableMembers = availableMembers.filter((member) => {
    const { name, email } = getDisplayInfo(member, addDialogType);
    const q = addSearchTerm.toLowerCase();
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
  });

  const filteredTrainers = filterMembers(trainers);
  const filteredStudents = filterMembers(students);

  // Prevent background scroll when massive dialog components are active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* ── Custom Massive Main Dialog Overlay ── */}
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6 transition-all duration-200">
        <div 
          className="w-full max-w-[96vw] h-[94vh] max-h-[96vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col bg-white border border-gray-100 transform transition-all animate-in fade-in zoom-in-95 duration-150"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-green-600 px-8 py-6 rounded-t-2xl flex items-center justify-between shadow-md">
            <div>
              <h2 className="text-white text-3xl font-bold tracking-tight">
                Manage Academy Members
              </h2>
              <p className="text-white/80 mt-1 text-base font-medium">
                {academyName} — Add or remove trainers and students
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-8 bg-gray-50/50">
            {/* Search */}
            <div className="mb-8 relative max-w-3xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search members by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-base bg-white border-gray-200 shadow-sm rounded-xl focus-visible:ring-blue-500"
              />
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-3">
                <Loader className="h-12 w-12 animate-spin text-green-500" />
                <p className="text-gray-500 font-medium">Synchronizing roster data...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100%-5rem)] align-stretch">
                {/* Trainers */}
                <Card className="border-blue-100 shadow-sm flex flex-col h-full bg-white rounded-xl">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-t-xl border-b border-blue-100 py-5 px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600 rounded-xl shadow-sm">
                          <BookOpen className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className="text-blue-900 text-xl font-bold">
                          Trainers
                          <span className="ml-3 text-sm font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                            {trainers.length}
                          </span>
                        </CardTitle>
                      </div>
                      <Button
                        size="lg"
                        onClick={() => handleOpenAddDialog("trainer")}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold px-4 py-2 rounded-xl"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Trainer
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 flex-1 overflow-hidden">
                    <div className="space-y-4 h-full overflow-y-auto pr-1 max-h-[52vh]">
                      {filteredTrainers.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                          <Users className="h-12 w-12 mx-auto mb-4 text-gray-200" />
                          <p className="font-semibold text-gray-500 text-base">
                            {searchTerm ? "No trainers match your search criteria" : "No trainers associated yet"}
                          </p>
                          <p className="text-sm mt-1 text-gray-400">
                            {!searchTerm && "Click 'Add Trainer' to expand your academy staff"}
                          </p>
                        </div>
                      ) : (
                        filteredTrainers.map((trainer) => (
                          <motion.div
                            key={trainer._id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-xl p-5 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm">
                                  {trainer.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 space-y-0.5">
                                  <h4 className="font-bold text-gray-900 text-base truncate">
                                    {trainer.name}
                                  </h4>
                                  <p className="text-sm text-gray-500 truncate font-medium">{trainer.email}</p>
                                  {trainer.phone && (
                                    <p className="text-xs text-gray-400 font-medium">{trainer.phone}</p>
                                  )}
                                  {trainer.sports && trainer.sports.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {trainer.sports.map((sport) => (
                                        <Badge
                                          key={sport}
                                          variant="secondary"
                                          className="text-xs bg-blue-50 text-blue-700 border-blue-100 capitalize px-2 py-0.5 font-semibold"
                                        >
                                          {sport}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleRemoveMember(trainer._id, "trainer", trainer.name)
                                }
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 rounded-lg p-2 h-auto"
                              >
                                <UserMinus className="h-5 w-5" />
                              </Button>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Students */}
                <Card className="border-green-100 shadow-sm flex flex-col h-full bg-white rounded-xl">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-green-100/50 rounded-t-xl border-b border-green-100 py-5 px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-green-600 rounded-xl shadow-sm">
                          <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className="text-green-900 text-xl font-bold">
                          Students
                          <span className="ml-3 text-sm font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                            {students.length}
                          </span>
                        </CardTitle>
                      </div>
                      <Button
                        size="md"
                        onClick={() => handleOpenAddDialog("student")}
                        className="bg-green-600 hover:bg-green-700 text-white shadow-sm font-semibold px-4 py-2 rounded-xl"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Student
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 flex-1 overflow-hidden">
                    <div className="space-y-4 h-full overflow-y-auto pr-1 max-h-[52vh]">
                      {filteredStudents.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                          <Users className="h-12 w-12 mx-auto mb-4 text-gray-200" />
                          <p className="font-semibold text-gray-500 text-base">
                            {searchTerm ? "No students match your search criteria" : "No students onboarded yet"}
                          </p>
                          <p className="text-sm mt-1 text-gray-400">
                            {!searchTerm && "Click 'Add Student' to assign members to this academy"}
                          </p>
                        </div>
                      ) : (
                        filteredStudents.map((student) => (
                          <motion.div
                            key={student._id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-xl p-5 border border-gray-100 hover:border-green-200 hover:shadow-md transition-all group"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm">
                                  {student.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 space-y-0.5">
                                  <h4 className="font-bold text-gray-900 text-base truncate">
                                    {student.name}
                                  </h4>
                                  <p className="text-sm text-gray-500 truncate font-medium">{student.email}</p>
                                  {student.phone && (
                                    <p className="text-xs text-gray-400 font-medium">{student.phone}</p>
                                  )}
                                  {student.sports && student.sports.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {student.sports.map((sport) => (
                                        <Badge
                                          key={sport}
                                          variant="secondary"
                                          className="text-xs bg-green-50 text-green-700 border-green-100 capitalize px-2 py-0.5 font-semibold"
                                        >
                                          {sport}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleRemoveMember(student._id, "student", student.name)
                                }
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 rounded-lg p-2 h-auto"
                              >
                                <UserMinus className="h-5 w-5" />
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

          <div className="flex justify-end px-8 py-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl shadow-inner gap-4">
            <Button variant="outline" onClick={onClose} className="px-8 h-11 text-base font-semibold border-gray-200 rounded-xl">
              Close Panel
            </Button>
          </div>
        </div>
      </div>

      {/* ── Custom Massive Add Member Dialog Overlay ── */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 md:p-6 transition-all duration-200">
          <div 
            className="w-full max-w-6xl h-[86vh] max-h-[88vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all border border-gray-100 animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div
              className={`px-8 py-6 flex items-center justify-between rounded-t-2xl shadow-md ${
                addDialogType === "trainer"
                  ? "bg-gradient-to-r from-blue-600 to-blue-700"
                  : "bg-gradient-to-r from-green-600 to-green-700"
              }`}
            >
              <div>
                <h3 className="text-white text-2xl font-bold tracking-tight">
                  Add {addDialogType === "trainer" ? "Trainer" : "Student"}
                </h3>
                <p className="text-white/80 mt-1 text-sm font-medium">
                  Select an available global profile pool asset to connect to {academyName}
                </p>
              </div>
              <button 
                onClick={() => setIsAddDialogOpen(false)}
                className="text-white/80 hover:text-white p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 bg-gray-50/50 space-y-6">
              {/* Search */}
              <div className="relative max-w-2xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder={`Search global directory of ${addDialogType}s by name or email...`}
                  value={addSearchTerm}
                  onChange={(e) => setAddSearchTerm(e.target.value)}
                  className="pl-12 h-11 text-sm bg-white border-gray-200 shadow-sm rounded-xl focus-visible:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <Label className="text-gray-800 font-bold text-base">
                  Available Global Pool {addDialogType === "trainer" ? "Trainers" : "Students"}
                  {!isFetchingAvailable && (
                    <span className="ml-2 text-sm font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                      {filteredAvailableMembers.length} records found
                    </span>
                  )}
                </Label>
                {selectedMemberId && (
                  <span className="text-sm text-green-600 font-bold bg-green-50 px-3 py-1 rounded-lg border border-green-200">
                    ✓ 1 Profile Selected
                  </span>
                )}
              </div>

              {isFetchingAvailable ? (
                <div className="flex items-center justify-center py-24">
                  <div className="text-center space-y-3">
                    <Loader className="h-10 w-10 animate-spin text-green-500 mx-auto" />
                    <p className="text-gray-500 font-medium text-sm">
                      Querying centralized master database arrays...
                    </p>
                  </div>
                </div>
              ) : filteredAvailableMembers.length === 0 ? (
                <div className="text-center py-20 text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl bg-white max-w-3xl mx-auto shadow-inner">
                  <Users className="h-14 w-14 mx-auto mb-4 text-gray-300" />
                  <p className="font-bold text-gray-700 text-lg">
                    {addSearchTerm
                      ? `No matching pipeline data for "${addSearchTerm}"`
                      : `No unassigned ${addDialogType} networks available`}
                  </p>
                  <p className="text-sm mt-1 text-gray-400 px-6 max-w-md mx-auto">
                    {addSearchTerm
                      ? "Verify spelling parameters or clear query filters to re-initialize grid search profiles."
                      : `All eligible system ${addDialogType} entries are currently locked to active contracts in this academy.`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                  {filteredAvailableMembers.map((member) => {
                    const info = getDisplayInfo(member, addDialogType);
                    const isSelected = selectedMemberId === info.idToSend;

                    return (
                      <motion.div
                        key={member._id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between h-44 shadow-sm ${
                          isSelected
                            ? addDialogType === "trainer"
                              ? "border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20"
                              : "border-green-500 bg-green-50/70 ring-2 ring-green-500/20"
                            : "border-gray-100 bg-white hover:border-gray-300 hover:shadow-md"
                        }`}
                        onClick={() => setSelectedMemberId(info.idToSend)}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-inner ${
                              addDialogType === "trainer"
                                ? "bg-gradient-to-br from-blue-500 to-blue-700"
                                : "bg-gradient-to-br from-green-500 to-green-700"
                            }`}
                          >
                            {info.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-bold text-gray-900 text-base truncate">
                                {info.name}
                              </h4>
                              {isSelected && (
                                <div
                                  className={`flex-shrink-0 rounded-full p-1.5 shadow-sm text-white ${
                                    addDialogType === "trainer" ? "bg-blue-600" : "bg-green-600"
                                  }`}
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate font-semibold">{info.email}</p>
                            {info.phone && (
                              <p className="text-xs text-gray-400 font-medium">{info.phone}</p>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-100/80 mt-auto">
                          {addDialogType === "trainer" && (
                            <div className="flex items-center gap-4 text-xs font-bold text-gray-600 mb-2">
                              {(info as any).hourlyRate !== undefined && (
                                <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                                  <DollarSign className="h-3 w-3 text-gray-500" />
                                  ₹{(info as any).hourlyRate}/hr
                                </span>
                              )}
                              {(info as any).rating !== undefined && (info as any).rating > 0 && (
                                <span className="flex items-center gap-1 bg-yellow-50 text-yellow-800 border border-yellow-100 px-2 py-1 rounded-md">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  {(info as any).rating.toFixed(1)}
                                </span>
                              )}
                            </div>
                          )}
                          {info.sports && info.sports.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {info.sports.slice(0, 2).map((sport: string) => (
                                <Badge
                                  key={sport}
                                  variant="secondary"
                                  className="text-[10px] capitalize font-bold px-1.5 py-0"
                                >
                                  {sport}
                                </Badge>
                              ))}
                              {info.sports.length > 2 && (
                                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1 py-0 rounded">
                                  +{info.sports.length - 2} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-8 py-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl shadow-inner">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isAddingMember}
                className="px-6 h-11 font-semibold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMember}
                disabled={!selectedMemberId || isAddingMember}
                className={`px-8 h-11 font-semibold text-white rounded-xl shadow-md ${
                  addDialogType === "trainer"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isAddingMember ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Committing Association...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Confirm & Add Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Remove Confirmation ── */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-gray-900 text-xl font-bold">
                Remove {memberToRemove?.type === "trainer" ? "Trainer" : "Student"}?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-gray-600 pt-3 text-base leading-relaxed">
              Are you sure you want to decouple{" "}
              <span className="font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">{memberToRemove?.name}</span> from{" "}
              <span className="font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">{academyName}</span>?
              This action terminates current organizational structural routing data hooks instantly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2">
            <AlertDialogCancel className="border-gray-200 rounded-xl h-11 font-semibold px-6">Cancel Connection</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMember}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl h-11 px-6 shadow-md"
            >
              Confirm Permanent Removal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};