"use client";
import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "@/utils/constants";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/store";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  UserMinus,
  Search,
  Loader,
  ChevronRight,
  GraduationCap,
  Dumbbell,
  AlertTriangle,
  X,
} from "lucide-react";
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

// ── Types ────────────────────────────────────────────────────────────────────

interface AcademyMember {
  _id: string; // Represents Core User ID (e.g., 694245d80b9a238bd04d3af1)
  name: string;
  email: string;
  phone?: string;
  sports?: string[];
}

interface TrainerStudent {
  _id: string; // Represents Student Profile ID (e.g., 694245d90b9a238bd04d3af6)
  userId: string; // Represents Student User ID (e.g., 694245d80b9a238bd04d3af1)
  level: string;
  sports: string[];
  isActive: boolean;
  attendance: any[];
  performance: any[];
  academyId?: string;
  user: {
    _id: string; // Represents Student User ID
    name: string;
    email: string;
    phone?: string;
    sports?: string[];
    isActive: boolean;
  };
}

interface TrainerStudentRelationsProps {
  academyId: string;
  academyName: string;
  isOpen: boolean;
  onClose: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const API = API_BASE_URL;

const levelColor: Record<string, string> = {
  beginner: "bg-green-50 text-green-700 border-green-200",
  intermediate: "bg-blue-50 text-blue-700 border-blue-200",
  advanced: "bg-purple-50 text-purple-700 border-purple-200",
};

// ── Component ────────────────────────────────────────────────────────────────

export const TrainerStudentRelations: React.FC<
  TrainerStudentRelationsProps
> = ({ academyId, academyName, isOpen, onClose }) => {
  const { token } = useAppSelector((s) => s.auth);

  // Academy scope data boundaries
  const [academyTrainers, setAcademyTrainers] = useState<AcademyMember[]>([]);
  const [academyStudents, setAcademyStudents] = useState<AcademyMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Selected instructor context state trees
  const [selectedTrainer, setSelectedTrainer] = useState<AcademyMember | null>(
    null,
  );
  const [trainerStudents, setTrainerStudents] = useState<TrainerStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Search local filter strings
  const [trainerSearch, setTrainerSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  // Mutation transaction targets
  const [addingStudentId, setAddingStudentId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Freeze parent viewport background window scroll layouts
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

  // ── Fetch Global Academy Scoped Members ─────────────────────────────────────

  const fetchMembers = useCallback(async () => {
    try {
      setMembersLoading(true);
      const res = await fetch(`${API}/academy/${academyId}/members`, {
        headers: authHeaders,
      });
      const data = await res.json();
      if (data.success) {
        setAcademyTrainers(data.data.trainers || []);
        setAcademyStudents(data.data.students || []);
      } else {
        toast.error("Failed to load academy members");
      }
    } catch {
      toast.error("Network infrastructure layout mapping fault");
    } finally {
      setMembersLoading(false);
    }
  }, [academyId]);

  useEffect(() => {
    if (isOpen) {
      setSelectedTrainer(null);
      setTrainerStudents([]);
      setTrainerSearch("");
      setStudentSearch("");
      fetchMembers();
    }
  }, [isOpen, fetchMembers]);

  // ── Fetch Selected Instructor Roster Matrix ───────────────────────────────

  const fetchTrainerStudents = useCallback(
    async (trainer: AcademyMember) => {
      try {
        setStudentsLoading(true);
        setTrainerStudents([]);

        // FIXED: Restored to standard GET request to align with your existing router configuration rules
        // and passed trainerId as a query parameter
        const res = await fetch(
          `${API}/trainer/students?trainerId=${trainer._id}`,
          {
            method: "GET",
            headers: authHeaders,
          },
        );
        const data = await res.json();

        if (data.success) {
          // Filters down elements strictly to ensure matching integrity within the open academy space scope
          const fullRoster: TrainerStudent[] = data.data.students || [];
          const scopeFiltered = fullRoster.filter(
            (s) => s.academyId?.toString() === academyId.toString(),
          );
          setTrainerStudents(scopeFiltered);
        } else {
          toast.error(
            data.message || "Failed to parse instructor student mappings",
          );
        }
      } catch {
        toast.error("Roster matrix array data sync breakdown");
      } finally {
        setStudentsLoading(false);
      }
    },
    [token, academyId],
  );

  const handleSelectTrainer = (trainer: AcademyMember) => {
    setSelectedTrainer(trainer);
    setStudentSearch("");
    fetchTrainerStudents(trainer);
  };

  // ── Create Active Contract Assignment Linkage ──────────────────────────────

  const handleAddStudent = async (student: AcademyMember) => {
    if (!selectedTrainer) return;
    try {
      setAddingStudentId(student._id);
      const res = await fetch(`${API}/trainer/add-student`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          studentId: student._id, // Verified Student User ID
          trainerId: selectedTrainer._id, // Verified Trainer User ID
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `${student.name} linked successfully`);
        fetchTrainerStudents(selectedTrainer);
      } else {
        toast.error(data.message || "Failed to commit allocation link");
      }
    } catch {
      toast.error("Transactional write operation rejected");
    } finally {
      setAddingStudentId(null);
    }
  };

  // ── Sever Active Contract Assignment Linkage ─────────────────────────────

  const confirmRemove = async () => {
    if (!selectedTrainer || !removeTarget) return;
    try {
      setRemovingId(removeTarget.userId);
      const res = await fetch(`${API}/trainer/remove-student`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          studentId: removeTarget.userId, // Target Student User ID
          trainerId: selectedTrainer._id, // Core Instructor User ID
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Relationship unlinked successfully");
        fetchTrainerStudents(selectedTrainer);
      } else {
        toast.error(data.message || "Failed to remove link configuration");
      }
    } catch {
      toast.error("Transactional drop instruction timed out");
    } finally {
      setRemovingId(null);
      setRemoveTarget(null);
    }
  };

  // ── Data Processing Operations (Strictly Locked Within Academy Scope Boundaries) ──

  const filteredTrainers = academyTrainers.filter((t) => {
    const q = trainerSearch.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q)
    );
  });

  // CRITICAL UI BUG FIX: Isolates the explicit subdocument student User ID values
  const trainerStudentUserIds = new Set(
    trainerStudents
      .map((s) => s.userId || s.user?._id)
      .filter(Boolean)
      .map((id) => id.toString()),
  );

  // Candidate generation pipeline strictly bound to current academy instance files
  const assignableStudents = academyStudents.filter((s) => {
    if (trainerStudentUserIds.has(s._id.toString())) return false; // Cross-column visibility visibility removal fix
    const q = studentSearch.toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  });

  const filteredTrainerStudents = trainerStudents.filter((s) => {
    const q = studentSearch.toLowerCase();
    if (!q) return true;
    const name = s.user?.name || "";
    const email = s.user?.email || "";
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
  });

  if (!isOpen) return null;

  return (
    <>
      {/* ── Custom Viewport-Dominant Massive Modal Canvas Overlay ── */}
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6 transition-all duration-200">
        <div
          className="w-full max-w-[96vw] h-[94vh] max-h-[96vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col bg-white border border-slate-100 transform transition-all animate-in fade-in zoom-in-95 duration-150"
          role="dialog"
          aria-modal="true"
        >
          {/* Header Panel */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 px-8 py-6 flex items-center justify-between shadow-md flex-shrink-0 rounded-t-2xl">
            <div>
              <h2 className="text-white text-3xl font-bold tracking-tight">
                Trainer–Student Relations
              </h2>
              <p className="text-white/80 mt-1 text-base font-medium">
                {academyName} — Assign or remove students from trainers within
                this academy
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Master Workspace View Layout Split */}
          <div className="flex flex-1 overflow-hidden bg-slate-50/50">
            {/* ── LEFT COMPARTMENT: Staff Directory Column ── */}
            <div className="w-80 flex-shrink-0 border-r border-slate-200/80 flex flex-col bg-slate-50">
              <div className="px-5 py-4 border-b border-slate-200/60 bg-white">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  Academy Instructors ({academyTrainers.length})
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search directory trainers..."
                    value={trainerSearch}
                    onChange={(e) => setTrainerSearch(e.target.value)}
                    className="pl-9 h-10 text-sm bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
                {membersLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-2">
                    <Loader className="h-6 w-6 animate-spin text-indigo-500" />
                    <p className="text-xs text-slate-400 font-medium">
                      Querying staff array...
                    </p>
                  </div>
                ) : filteredTrainers.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 bg-white/50 rounded-xl border border-dashed border-slate-200 m-2">
                    <Dumbbell className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-500">
                      No matching trainers
                    </p>
                  </div>
                ) : (
                  filteredTrainers.map((trainer) => {
                    const isSelected = selectedTrainer?._id === trainer._id;
                    return (
                      <button
                        type="button"
                        key={trainer._id}
                        onClick={() => handleSelectTrainer(trainer)}
                        className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center gap-3 transition-all group ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-md font-medium"
                            : "hover:bg-white hover:shadow-sm text-slate-700 bg-transparent"
                        }`}
                      >
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 shadow-inner ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-indigo-100 text-indigo-700"
                          }`}
                        >
                          {trainer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-bold text-sm truncate ${isSelected ? "text-white" : "text-slate-900"}`}
                          >
                            {trainer.name}
                          </p>
                          <p
                            className={`text-xs truncate ${isSelected ? "text-white/70" : "text-slate-400"} font-medium`}
                          >
                            {trainer.email}
                          </p>
                        </div>
                        <ChevronRight
                          className={`h-5 w-5 flex-shrink-0 transition-transform ${isSelected ? "text-white translate-x-0.5" : "text-slate-300 group-hover:text-slate-500"}`}
                        />
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* ── RIGHT COMPARTMENT: Active Workspace Assignment Canvas ── */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              {!selectedTrainer ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-50/30">
                  <div className="text-center max-w-md px-4">
                    <Users className="h-16 w-16 mx-auto mb-4 text-slate-200" />
                    <p className="text-xl font-bold text-slate-700">
                      Select an Instructor
                    </p>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                      Choose an instructor record path inside the left directory
                      to display structural relationship routing channels and
                      allocate students inside this academy.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col flex-1 overflow-hidden animate-in fade-in duration-200">
                  {/* Instructor Context Bar */}
                  <div className="flex-shrink-0 px-8 py-4 border-b border-slate-100 bg-white flex items-center gap-4 shadow-sm z-10">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {selectedTrainer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">
                        {selectedTrainer.name}
                      </h3>
                      <p className="text-sm text-slate-500 font-medium">
                        {selectedTrainer.email}
                      </p>
                    </div>
                    <div className="ml-auto flex flex-wrap gap-1.5">
                      {selectedTrainer.sports?.map((s) => (
                        <Badge
                          key={s}
                          variant="secondary"
                          className="text-xs capitalize font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5"
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Operational Filtering Matrix Input Panel */}
                  <div className="flex-shrink-0 px-8 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="relative w-full max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Filter list down dynamically..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="pl-10 bg-white border-slate-200 h-10 text-sm rounded-xl shadow-sm focus-visible:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Dual Grid Assignment Panel Flow Split */}
                  <div className="flex-1 overflow-hidden grid grid-cols-2 divide-x divide-gray-200">
                    {/* Column A: Active Assignments */}
                    <div className="flex flex-col overflow-hidden bg-white">
                      <div className="flex-shrink-0 px-6 py-3.5 bg-slate-50/30 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100">
                            <GraduationCap className="h-4 w-4 text-indigo-600" />
                          </div>
                          <p className="font-bold text-slate-800 text-base">
                            Assigned Students
                            <span className="ml-2.5 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                              {filteredTrainerStudents.length} Active Linkages
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                        {studentsLoading ? (
                          <div className="flex flex-col items-center justify-center py-16 gap-2">
                            <Loader className="h-6 w-6 animate-spin text-indigo-500" />
                            <p className="text-xs text-slate-400">
                              Loading active mappings...
                            </p>
                          </div>
                        ) : filteredTrainerStudents.length === 0 ? (
                          <div className="text-center py-16 text-slate-400 border border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                            <GraduationCap className="h-12 w-12 mx-auto mb-3 text-slate-200" />
                            <p className="font-semibold text-slate-500">
                              No students assigned yet
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Use the right column pipeline to link academy
                              records
                            </p>
                          </div>
                        ) : (
                          <AnimatePresence>
                            {filteredTrainerStudents.map((s) => {
                              const targetUserId = s.userId || s.user?._id;
                              return (
                                <motion.div
                                  key={targetUserId}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -8 }}
                                  className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-red-200 hover:shadow-md transition-all group relative flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-sm">
                                      {(s.user?.name || "S")
                                        .charAt(0)
                                        .toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-0.5">
                                      <p className="font-bold text-slate-900 text-base truncate">
                                        {s.user?.name ||
                                          "Unknown Profile Reference"}
                                      </p>
                                      <p className="text-xs text-slate-500 font-medium truncate">
                                        {s.user?.email}
                                      </p>
                                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                        {s.level && s.level !== "—" && (
                                          <span
                                            className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${
                                              levelColor[s.level] ??
                                              "bg-slate-50 text-slate-600 border-slate-200"
                                            }`}
                                          >
                                            {s.level}
                                          </span>
                                        )}
                                        {s.sports?.slice(0, 2).map((sp) => (
                                          <Badge
                                            key={sp}
                                            variant="secondary"
                                            className="text-[10px] uppercase font-bold py-0 bg-slate-100 text-slate-600 border-transparent"
                                          >
                                            {sp}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={removingId === targetUserId}
                                    onClick={() =>
                                      setRemoveTarget({
                                        userId: targetUserId,
                                        name: s.user?.name || "Student Profile",
                                      })
                                    }
                                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all flex-shrink-0 rounded-xl p-2 h-auto ml-2"
                                  >
                                    {removingId === targetUserId ? (
                                      <Loader className="h-5 w-5 animate-spin" />
                                    ) : (
                                      <UserMinus className="h-5 w-5" />
                                    )}
                                  </Button>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        )}
                      </div>
                    </div>

                    {/* Column B: Allocation Candidate Pool */}
                    <div className="flex flex-col overflow-hidden bg-slate-50/30">
                      <div className="flex-shrink-0 px-6 py-3.5 bg-slate-50/30 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-green-50 rounded-xl border border-green-100">
                            <UserPlus className="h-4 w-4 text-green-600" />
                          </div>
                          <p className="font-bold text-slate-800 text-base">
                            Available to Assign
                            <span className="ml-2.5 text-xs font-bold text-green-700 bg-green-50 border border-green-100 px-2.5 py-0.5 rounded-full">
                              {assignableStudents.length} Pool Candidates
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                        {membersLoading || studentsLoading ? (
                          <div className="flex flex-col items-center justify-center py-16 gap-2">
                            <Loader className="h-6 w-6 animate-spin text-green-500" />
                            <p className="text-xs text-slate-400">
                              Comparing structural indexes...
                            </p>
                          </div>
                        ) : assignableStudents.length === 0 ? (
                          <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white shadow-sm">
                            <Users className="h-12 w-12 mx-auto mb-3 text-slate-200" />
                            <p className="font-bold text-slate-700">
                              Roster Stack Exhausted
                            </p>
                            <p className="text-xs text-slate-400 mt-1 max-w-[18rem] mx-auto leading-relaxed">
                              {academyStudents.length === 0
                                ? "No student database configurations exist natively inside this academy yet."
                                : "Every registered student profile in this academy has an active allocation link mapped to this instructor."}
                            </p>
                          </div>
                        ) : (
                          <AnimatePresence>
                            {assignableStudents.map((s) => (
                              <motion.div
                                key={s._id}
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 8 }}
                                className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-green-200 hover:shadow-md transition-all group flex items-center justify-between"
                              >
                                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                  <div className="h-11 w-11 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-sm">
                                    {s.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0 space-y-0.5">
                                    <p className="font-bold text-slate-900 text-base truncate">
                                      {s.name}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium truncate">
                                      {s.email}
                                    </p>
                                    {s.sports && s.sports.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {s.sports.slice(0, 2).map((sp) => (
                                          <Badge
                                            key={sp}
                                            variant="secondary"
                                            className="text-[10px] uppercase font-bold py-0 border-transparent"
                                          >
                                            {sp}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  disabled={addingStudentId === s._id}
                                  onClick={() => handleAddStudent(s)}
                                  className="opacity-0 group-hover:opacity-100 bg-green-600 hover:bg-green-700 text-white transition-all flex-shrink-0 h-9 w-9 rounded-xl p-0 flex items-center justify-center ml-2 shadow-sm"
                                >
                                  {addingStudentId === s._id ? (
                                    <Loader className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <UserPlus className="h-4 w-4" />
                                  )}
                                </Button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Footer Button Bar Container Strip */}
          <div className="flex-shrink-0 flex justify-end px-8 py-5 border-t border-slate-100 bg-slate-50 rounded-b-2xl shadow-inner gap-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-8 h-11 text-base font-semibold border-slate-200 rounded-xl"
            >
              Close Panel
            </Button>
          </div>
        </div>
      </div>

      {/* ── Remove Link Confirmation Overlay ── */}
      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(o) => {
          if (!o) setRemoveTarget(null);
        }}
      >
        <AlertDialogContent className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-slate-900 text-xl font-bold">
                Sever Roster Record Link?
              </AlertDialogTitle>
            </div>
            <div className="text-slate-600 pt-3 text-base leading-relaxed">
              Are you sure you want to decouple student record{" "}
              <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                {removeTarget?.name}
              </span>{" "}
              from the active roster listing of{" "}
              <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                {selectedTrainer?.name}
              </span>
              ?
              <p className="mt-2 text-sm text-slate-400">
                The student entity retains their primary documentation mapping
                inside the master academy directory structure—only this explicit
                instructor connection profile pointer will be detached.
              </p>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2">
            <AlertDialogCancel className="border-slate-200 rounded-xl h-11 font-semibold px-6">
              Cancel Decouple
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl h-11 px-6 shadow-md"
            >
              Confirm Decouple Execution
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
