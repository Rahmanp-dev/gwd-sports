"use client";
import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/router-shim";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout, setUser } from "@/store/slices/authSlice";
import { userService } from "@/services/userService";
import { authService } from "@/services/authService";
import StudentProfile from "@/components/user/student/StudentProfile";
import TrainerProfile from "@/components/user/trainer/TrainerProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
} from "lucide-react";
import Footer from "@/components/landing/Footer";
import { toast } from "sonner";

export default function UserProfile() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (!token || !user) {
      navigate("/user/auth");
    }
  }, [token, user, navigate]);

  /**
   * ══════════════════════════════════════════════════════════════════════════
   * STUDENTS AND COACHES BELONG ON THEIR OWN DASHBOARD, NOT HERE
   * ══════════════════════════════════════════════════════════════════════════
   *
   * This page and /portal/{student,trainer} were two competing "my account"
   * surfaces, and this was much the worse of the two. It has no check-in
   * scanner, no attendance, no fees or receipts, no batches — and no academy
   * theme, so it renders in platform default colours no matter which academy
   * the person belongs to.
   *
   * Reachable by several routes: the RBAC fallback in middleware.ts sends any
   * non-admin here, the events pages link to it, and it is the ROLE_HOME for
   * the plain `user` role. So a student could easily land on it, conclude the
   * product has none of those features, and be entirely reasonable about it.
   *
   * Rather than rebuild those features here — which recreates exactly the
   * drift that the branding editor consolidation was undoing — send the two
   * roles that have a real dashboard to it. Account and password settings live
   * on that dashboard's Account tab.
   *
   * The plain `user` role (signed up, not yet attached to an academy) has no
   * portal dashboard, so this page remains their account screen.
   * ══════════════════════════════════════════════════════════════════════════
   */
  useEffect(() => {
    if (!user?.role) return;
    if (user.role === "student") navigate("/portal/student", { replace: true });
    else if (user.role === "trainer") navigate("/portal/trainer", { replace: true });
  }, [user?.role, navigate]);

  // Fetch fresh profile data
  useEffect(() => {
    if (token && user) {
      fetchProfile();
    }
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const response = await userService.getProfile();
      if (response.success) {
        dispatch(setUser(response.data.user));
        setProfileData({
          name: response.data.user.name,
          phone: response.data.user.phone,
        });
      }
    } catch (error: any) {
      console.error("Failed to fetch profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("mg_refresh_token");
      if (refreshToken) {
        await authService.logout();
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch(logout());
      navigate("/user/auth");
      toast.success("Logged out successfully");
    }
  };

  // Validate profile form
  const validateProfileForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!profileData.name || profileData.name.length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (!profileData.phone) {
      errors.phone = "Phone number is required";
    } else if (!/^[+]?[\d\s\-\(\)]{10,}$/.test(profileData.phone)) {
      errors.phone = "Phone number is invalid";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate password form
  const validatePasswordForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword || passwordData.newPassword.length < 8) {
      errors.newPassword = "New password must be at least 8 characters";
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateProfileForm()) {
      return;
    }

    try {
      setIsUpdating(true);
      const response = await userService.updateProfile(profileData);

      if (response.success) {
        dispatch(setUser(response.data.user));
        setIsEditing(false);
        toast.success("Profile updated successfully");
      }
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    try {
      setIsChangingPassword(true);
      const response = await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.success) {
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        toast.success("Password changed successfully");
      }
    } catch (error: any) {
      console.error("Password change error:", error);
      toast.error(error.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-10 px-4 sm:px-6 lg:px-8 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-50/50 opacity-50 blur-3xl -z-10" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg bg-white">
                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 text-3xl font-bold">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 font-display tracking-tight">
                  {user.name}
                </h1>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none shadow-sm">
                    <Mail className="h-3 w-3 mr-1" />
                    {user.email}
                  </Badge>
                  <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none shadow-sm">
                    <Shield className="h-3 w-3 mr-1" />
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                  {user.isActive && (
                    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none shadow-sm">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 shadow-sm"
                onClick={() => navigate("/events/my-events")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                My Events
              </Button>
              <Button
                variant="outline"
                className="bg-white border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-100 shadow-sm transition-colors"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-6"
        >
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div variants={itemVariants}>
              <Card className="bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 font-medium text-sm mb-1">Member Since</p>
                      <p className="text-slate-900 font-bold text-xl font-display">
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 font-medium text-sm mb-1">Sports</p>
                      <p className="text-slate-900 font-bold text-xl font-display">
                        {user.sports?.length || 0} Enrolled
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 font-medium text-sm mb-1">Last Login</p>
                      <p className="text-slate-900 font-bold text-xl font-display">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <Activity className="h-6 w-6 text-indigo-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Profile Details */}
          <motion.div variants={itemVariants}>
            <Card className="bg-white border border-slate-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-900 text-xl font-bold font-display">
                      Profile Details
                    </CardTitle>
                    <CardDescription className="text-slate-500 font-medium mt-1">
                      Manage your personal information and settings
                    </CardDescription>
                  </div>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 shadow-sm"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <Tabs defaultValue="profile" className="space-y-8">
                  <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 p-1 rounded-lg">
                    <TabsTrigger
                      value="profile"
                      className="rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-500 font-semibold transition-all"
                    >
                      Profile Info
                    </TabsTrigger>
                    <TabsTrigger
                      value="security"
                      className="rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-500 font-semibold transition-all"
                    >
                      Security
                    </TabsTrigger>
                  </TabsList>

                  {/* Profile Tab */}
                  <TabsContent value="profile" className="space-y-6 focus-visible:outline-none">
                    {isEditing ? (
                      <form
                        onSubmit={handleUpdateProfile}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-slate-700 font-semibold">
                              Full Name
                            </Label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                              <Input
                                id="name"
                                value={profileData.name}
                                onChange={(e) =>
                                  setProfileData({
                                    ...profileData,
                                    name: e.target.value,
                                  })
                                }
                                className={`pl-10 h-11 bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 rounded-xl transition-all ${
                                  validationErrors.name ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""
                                }`}
                              />
                            </div>
                            {validationErrors.name && (
                              <p className="text-red-500 text-sm font-medium">
                                {validationErrors.name}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-slate-700 font-semibold">
                              Phone Number
                            </Label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                              <Input
                                id="phone"
                                value={profileData.phone}
                                onChange={(e) =>
                                  setProfileData({
                                    ...profileData,
                                    phone: e.target.value,
                                  })
                                }
                                className={`pl-10 h-11 bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 rounded-xl transition-all ${
                                  validationErrors.phone ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""
                                }`}
                              />
                            </div>
                            {validationErrors.phone && (
                              <p className="text-red-500 text-sm font-medium">
                                {validationErrors.phone}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all h-11 px-6"
                            disabled={isUpdating}
                          >
                            {isUpdating ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsEditing(false);
                              setProfileData({
                                name: user.name,
                                phone: user.phone,
                              });
                              setValidationErrors({});
                            }}
                            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl h-11 px-6"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Full Name</Label>
                          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <User className="h-5 w-5 text-slate-400" />
                            <span className="text-slate-900 font-medium">{user.name}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Email Address</Label>
                          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <Mail className="h-5 w-5 text-slate-400" />
                            <span className="text-slate-900 font-medium">{user.email}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Phone Number</Label>
                          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <Phone className="h-5 w-5 text-slate-400" />
                            <span className="text-slate-900 font-medium">{user.phone}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Account Role</Label>
                          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <Shield className="h-5 w-5 text-slate-400" />
                            <span className="text-slate-900 font-medium">
                              {user.role.charAt(0).toUpperCase() +
                                user.role.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Security Tab */}
                  <TabsContent value="security" className="focus-visible:outline-none">
                    <form onSubmit={handleChangePassword} className="space-y-5 max-w-xl">
                      <Alert className="bg-blue-50 border-blue-200 text-blue-700 rounded-xl mb-6">
                        <Lock className="h-4 w-4" />
                        <AlertDescription className="font-medium ml-2">
                          Choose a strong password with at least 8 characters
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <Label
                          htmlFor="current-password"
                          className="text-slate-700 font-semibold"
                        >
                          Current Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <Input
                            id="current-password"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                currentPassword: e.target.value,
                              })
                            }
                            className={`pl-10 h-11 bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 rounded-xl transition-all ${
                              validationErrors.currentPassword
                                ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                                : ""
                            }`}
                          />
                        </div>
                        {validationErrors.currentPassword && (
                          <p className="text-red-500 text-xs font-medium">
                            {validationErrors.currentPassword}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-password" className="text-slate-700 font-semibold">
                          New Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <Input
                            id="new-password"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                newPassword: e.target.value,
                              })
                            }
                            className={`pl-10 h-11 bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 rounded-xl transition-all ${
                              validationErrors.newPassword
                                ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                                : ""
                            }`}
                          />
                        </div>
                        {validationErrors.newPassword && (
                          <p className="text-red-500 text-xs font-medium">
                            {validationErrors.newPassword}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="confirm-password"
                          className="text-slate-700 font-semibold"
                        >
                          Confirm New Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <Input
                            id="confirm-password"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                confirmPassword: e.target.value,
                              })
                            }
                            className={`pl-10 h-11 bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 rounded-xl transition-all ${
                              validationErrors.confirmPassword
                                ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                                : ""
                            }`}
                          />
                        </div>
                        {validationErrors.confirmPassword && (
                          <p className="text-red-500 text-xs font-medium">
                            {validationErrors.confirmPassword}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all h-11 px-6 mt-4"
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Changing Password...
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Change Password
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>

          {user.role === "student" && (
            // Student Profile
            <StudentProfile />
          )}

          {user.role === "trainer" && (
            // Trainer Profile
            <TrainerProfile />
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
