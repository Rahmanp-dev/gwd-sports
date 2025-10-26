import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout, setUser } from "@/store/slices/authSlice";
import { userService } from "@/services/userService";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Trophy
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
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-green-600 to-purple-600 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-white shadow-2xl">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-green-600 text-white text-3xl font-bold">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {user.name}
                </h1>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-white/20 text-white border-white/30">
                    <Mail className="h-3 w-3 mr-1" />
                    {user.email}
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30">
                    <Shield className="h-3 w-3 mr-1" />
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                  {user.isActive && (
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-6"
        >
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-200 text-sm mb-1">Member Since</p>
                      <p className="text-white font-bold text-lg">
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <Calendar className="h-10 w-10 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 border-green-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-200 text-sm mb-1">Sports</p>
                      <p className="text-white font-bold text-lg">
                        {user.sports?.length || 0} Enrolled
                      </p>
                    </div>
                    <Trophy className="h-10 w-10 text-green-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-purple-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-200 text-sm mb-1">Last Login</p>
                      <p className="text-white font-bold text-lg">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <Activity className="h-10 w-10 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Profile Details */}
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-2xl">Profile Details</CardTitle>
                    <CardDescription>
                      Manage your personal information and settings
                    </CardDescription>
                  </div>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="border-gray-600"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="profile" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                    <TabsTrigger value="profile" className="data-[state=active]:bg-blue-600">
                      Profile Information
                    </TabsTrigger>
                    <TabsTrigger value="security" className="data-[state=active]:bg-blue-600">
                      Security
                    </TabsTrigger>
                  </TabsList>

                  {/* Profile Tab */}
                  <TabsContent value="profile" className="space-y-6">
                    {isEditing ? (
                      <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-white">
                              Full Name
                            </Label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <Input
                                id="name"
                                value={profileData.name}
                                onChange={(e) =>
                                  setProfileData({ ...profileData, name: e.target.value })
                                }
                                className={`pl-10 bg-gray-800 border-gray-700 text-white ${
                                  validationErrors.name ? "border-red-500" : ""
                                }`}
                              />
                            </div>
                            {validationErrors.name && (
                              <p className="text-red-500 text-sm">{validationErrors.name}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-white">
                              Phone Number
                            </Label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <Input
                                id="phone"
                                value={profileData.phone}
                                onChange={(e) =>
                                  setProfileData({ ...profileData, phone: e.target.value })
                                }
                                className={`pl-10 bg-gray-800 border-gray-700 text-white ${
                                  validationErrors.phone ? "border-red-500" : ""
                                }`}
                              />
                            </div>
                            {validationErrors.phone && (
                              <p className="text-red-500 text-sm">{validationErrors.phone}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button
                            type="submit"
                            className="bg-gradient-to-r from-blue-600 to-green-600"
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
                            className="border-gray-600"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-gray-400">Full Name</Label>
                          <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                            <User className="h-5 w-5 text-gray-400" />
                            <span className="text-white">{user.name}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-400">Email Address</Label>
                          <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                            <Mail className="h-5 w-5 text-gray-400" />
                            <span className="text-white">{user.email}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-400">Phone Number</Label>
                          <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                            <Phone className="h-5 w-5 text-gray-400" />
                            <span className="text-white">{user.phone}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-400">Account Role</Label>
                          <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                            <Shield className="h-5 w-5 text-gray-400" />
                            <span className="text-white">
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Security Tab */}
                  <TabsContent value="security">
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <Alert className="bg-blue-500/10 border-blue-500/20">
                        <Lock className="h-4 w-4 text-blue-400" />
                        <AlertDescription className="text-gray-300">
                          Choose a strong password with at least 8 characters
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <Label htmlFor="current-password" className="text-white">
                          Current Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                            className={`pl-10 bg-gray-800 border-gray-700 text-white ${
                              validationErrors.currentPassword ? "border-red-500" : ""
                            }`}
                          />
                        </div>
                        {validationErrors.currentPassword && (
                          <p className="text-red-500 text-sm">
                            {validationErrors.currentPassword}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-password" className="text-white">
                          New Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                            className={`pl-10 bg-gray-800 border-gray-700 text-white ${
                              validationErrors.newPassword ? "border-red-500" : ""
                            }`}
                          />
                        </div>
                        {validationErrors.newPassword && (
                          <p className="text-red-500 text-sm">
                            {validationErrors.newPassword}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="text-white">
                          Confirm New Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                            className={`pl-10 bg-gray-800 border-gray-700 text-white ${
                              validationErrors.confirmPassword ? "border-red-500" : ""
                            }`}
                          />
                        </div>
                        {validationErrors.confirmPassword && (
                          <p className="text-red-500 text-sm">
                            {validationErrors.confirmPassword}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="bg-gradient-to-r from-blue-600 to-green-600"
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
        </motion.div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}