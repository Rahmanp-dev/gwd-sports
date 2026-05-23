import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store";
import { loginUser, registerUser, clearError } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Lock,
  Phone,
  UserPlus,
  LogIn,
  AlertCircle,
  Trophy,
  Users,
  Target,
  Eye,
  EyeOff,
  LayoutDashboard,
} from "lucide-react";
import { BRAND_NAME } from "@/utils/constants";

export default function UserAuth() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated, user } = useAppSelector(
    (state) => state.auth,
  );

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  // Form validation errors
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on role
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else if (user.role === "user") {
        navigate("/user/profile");
      } else {
        navigate(`/mgfc/${user.role}`);
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Clear errors when switching tabs
  useEffect(() => {
    dispatch(clearError());
    setValidationErrors({});
  }, [activeTab, dispatch]);

  // Validate login form
  const validateLoginForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!loginData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
      errors.email = "Email is invalid";
    }

    if (!loginData.password) {
      errors.password = "Password is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate register form
  const validateRegisterForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!registerData.name || registerData.name.length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (!registerData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(registerData.email)) {
      errors.email = "Email is invalid";
    }

    if (!registerData.phone) {
      errors.phone = "Phone number is required";
    } else if (!/^[+]?[\d\s\-\(\)]{10,}$/.test(registerData.phone)) {
      errors.phone = "Phone number is invalid";
    }

    // PASSWORD VALIDATION
    if (!registerData.password) {
      errors.password = "Password is required";
    } else if (registerData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/.test(
        registerData.password,
      )
    ) {
      errors.password =
        "Password must contain uppercase, lowercase, number, and special character (@$!%*?&#)";
    }

    if (registerData.password !== registerData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateLoginForm()) {
      return;
    }

    try {
      await dispatch(
        loginUser({
          email: loginData.email,
          password: loginData.password,
        }),
      ).unwrap();
    } catch (error: any) {
      console.error("Login failed:", error);
    }
  };

  // Handle registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateRegisterForm()) {
      return;
    }

    try {
      await dispatch(
        registerUser({
          name: registerData.name,
          email: registerData.email,
          password: registerData.password,
          phone: registerData.phone,
          role: "user",
          sports: [],
        }),
      ).unwrap();
    } catch (error: any) {
      console.error("Registration failed:", error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as any,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
      </div>

      <Button
        className="absolute top-15 left-40 bg-gray-800 text-sm text-blue-400 hover:text-blue-300 cursor-pointer"
        onClick={() => navigate("/")}
      >
        ← Back to Home
      </Button>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-6xl relative z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="hidden lg:block space-y-8">
            <div>
              <h1 className="text-5xl font-bold text-white mb-4">
                Welcome to{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-500">
                  {BRAND_NAME}
                </span>
              </h1>
              <p className="text-xl text-gray-400">
                Join our community of athletes and achieve your sports dreams
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Trophy className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">
                    World-Class Training
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Access professional coaching and state-of-the-art facilities
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">
                    Join a Community
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Connect with like-minded athletes and build lasting
                    friendships
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Target className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">
                    Achieve Your Goals
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Track your progress and reach new milestones in your journey
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                500+ Students
              </Badge>
              <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                50+ Trainers
              </Badge>
              <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                15+ Sports
              </Badge>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-white text-center">
                {activeTab === "login" ? "Welcome Back" : "Create Account"}
              </CardTitle>
              <CardDescription className="text-center text-gray-400">
                {activeTab === "login"
                  ? "Sign in to continue your journey"
                  : "Join us and start your sports journey"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as "login" | "register")}
              >
                <TabsList className="grid w-full grid-cols-2 bg-gray-800 mb-6">
                  <TabsTrigger
                    value="login"
                    className="data-[state=active]:bg-blue-600"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="data-[state=active]:bg-green-600"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register
                  </TabsTrigger>
                </TabsList>

                {/* Display Error */}
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Login Tab */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-white">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="rahul.sharma@example.com"
                          value={loginData.email}
                          onChange={(e) =>
                            setLoginData({
                              ...loginData,
                              email: e.target.value,
                            })
                          }
                          className={`pl-10 bg-gray-800 border-gray-700 text-white ${
                            validationErrors.email ? "border-red-500" : ""
                          }`}
                        />
                      </div>
                      {validationErrors.email && (
                        <p className="text-red-500 text-sm">
                          {validationErrors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-white">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="login-password"
                          type={showLoginPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={loginData.password}
                          onChange={(e) =>
                            setLoginData({
                              ...loginData,
                              password: e.target.value,
                            })
                          }
                          className={`pl-10 pr-10 bg-gray-800 border-gray-700 text-white ${
                            validationErrors.password ? "border-red-500" : ""
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowLoginPassword(!showLoginPassword)
                          }
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        >
                          {showLoginPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {validationErrors.password && (
                        <p className="text-red-500 text-sm">
                          {validationErrors.password}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Signing In...
                        </>
                      ) : (
                        <>
                          <LogIn className="h-4 w-4 mr-2" />
                          Sign In
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Register Tab */}
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="text-white">
                        Full Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="register-name"
                          type="text"
                          placeholder="Rahul Sharma"
                          value={registerData.name}
                          onChange={(e) =>
                            setRegisterData({
                              ...registerData,
                              name: e.target.value,
                            })
                          }
                          className={`pl-10 bg-gray-800 border-gray-700 text-white ${
                            validationErrors.name ? "border-red-500" : ""
                          }`}
                        />
                      </div>
                      {validationErrors.name && (
                        <p className="text-red-500 text-sm">
                          {validationErrors.name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-white">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="rahul.sharma@example.com"
                          value={registerData.email}
                          onChange={(e) =>
                            setRegisterData({
                              ...registerData,
                              email: e.target.value,
                            })
                          }
                          className={`pl-10 bg-gray-800 border-gray-700 text-white ${
                            validationErrors.email ? "border-red-500" : ""
                          }`}
                        />
                      </div>
                      {validationErrors.email && (
                        <p className="text-red-500 text-sm">
                          {validationErrors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-phone" className="text-white">
                        Phone Number
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="register-phone"
                          type="tel"
                          placeholder="98765 43210"
                          value={registerData.phone}
                          onChange={(e) =>
                            setRegisterData({
                              ...registerData,
                              phone: e.target.value,
                            })
                          }
                          className={`pl-10 bg-gray-800 border-gray-700 text-white ${
                            validationErrors.phone ? "border-red-500" : ""
                          }`}
                        />
                      </div>
                      {validationErrors.phone && (
                        <p className="text-red-500 text-sm">
                          {validationErrors.phone}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-white">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="register-password"
                          type={showRegisterPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={registerData.password}
                          onChange={(e) =>
                            setRegisterData({
                              ...registerData,
                              password: e.target.value,
                            })
                          }
                          className={`pl-10 pr-10 bg-gray-800 border-gray-700 text-white ${
                            validationErrors.password ? "border-red-500" : ""
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowRegisterPassword(!showRegisterPassword)
                          }
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        >
                          {showRegisterPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {validationErrors.password && (
                        <p className="text-red-500 text-sm">
                          {validationErrors.password}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="register-confirm-password"
                        className="text-white"
                      >
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="register-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={registerData.confirmPassword}
                          onChange={(e) =>
                            setRegisterData({
                              ...registerData,
                              confirmPassword: e.target.value,
                            })
                          }
                          className={`pl-10 pr-10 bg-gray-800 border-gray-700 text-white ${
                            validationErrors.confirmPassword
                              ? "border-red-500"
                              : ""
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {validationErrors.confirmPassword && (
                        <p className="text-red-500 text-sm">
                          {validationErrors.confirmPassword}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Create Account
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-6 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-green-500/20 to-blue-500/20 rounded-lg blur-xl" />
                <Link
                  to="/mgfc/student/register"
                  className="relative block p-6 bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-lg hover:border-blue-500/50 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <Trophy className="h-6 w-6 text-blue-400 group-hover:text-blue-300 transition-colors" />
                    <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-green-400 to-blue-400 group-hover:from-blue-300 group-hover:via-green-300 group-hover:to-blue-300 transition-all">
                      Join MGFC Academy
                    </h3>
                    <Trophy className="h-6 w-6 text-green-400 group-hover:text-green-300 transition-colors" />
                  </div>
                  <p className="text-gray-400 text-sm mb-3">
                    Register as a student and unlock professional training
                    programs
                  </p>
                  <div className="flex items-center justify-center gap-2 text-blue-400 group-hover:text-blue-300 transition-colors font-semibold">
                    <span>Get Started Now</span>
                    <svg
                      className="h-5 w-5 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>
                  <div className="mt-4 flex justify-center gap-3">
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
                      ⚡ Quick Setup
                    </Badge>
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                      🎯 Expert Coaches
                    </Badge>
                    <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs">
                      🏆 Track Progress
                    </Badge>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
