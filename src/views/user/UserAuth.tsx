"use client";
import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "@/lib/router-shim";
import { getRoleHomePath } from "@/components/auth/RoleProtectedRoute";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store";
import { loginUser, registerUser, clearError, logout } from "@/store/slices/authSlice";
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
} from "lucide-react";
import { BRAND_NAME } from "@/utils/constants";

export default function UserAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated, user } = useAppSelector(
    (state) => state.auth,
  );

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Login form state
  const [loginData, setLoginData] = useState({
    email: (location.state as any)?.email || "",
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
    if (typeof window !== "undefined" && window.location.search.includes("clearsession=true")) {
      dispatch(logout());
      localStorage.clear();
      document.cookie = "gwd_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (isAuthenticated && user) {
      const from = (location.state as any)?.from as string | undefined;
      const target = from || getRoleHomePath(user.role);
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, user, dispatch, navigate, location.state]);

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
      const res = await dispatch(
        loginUser({
          email: loginData.email,
          password: loginData.password,
        }),
      ).unwrap();

      const role = res?.user?.role;
      const target = (role === "admin" || role === "gwd_super_admin")
        ? "/admin/dashboard" 
        : "/user/profile";
      
      navigate(target, { replace: true });
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50" />
      </div>

      <Button
        variant="ghost"
        className="absolute top-6 left-6 text-slate-500 hover:text-slate-800 hover:bg-slate-100 z-20 font-semibold"
        onClick={() => navigate("/")}
      >
        ← Back to Home
      </Button>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-5xl relative z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          
          {/* Left Side - Branding */}
          <div className="hidden lg:flex flex-col justify-center h-full p-12 bg-slate-50 border-r border-slate-100">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/gwdlogo.png"
                alt="GWD Sports"
                className="mb-6 h-14 w-auto"
              />
              <h1 className="text-4xl font-bold text-slate-900 mb-4 font-display tracking-tight">
                Welcome to{" "}
                <span className="text-blue-600">
                  {BRAND_NAME}
                </span>
              </h1>
              <p className="text-lg text-slate-500 font-medium">
                Join our community of athletes and achieve your sports dreams.
              </p>
            </div>

            <div className="space-y-8 mt-12">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Trophy className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-slate-900 font-semibold text-lg mb-1">
                    World-Class Training
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Access professional coaching and state-of-the-art facilities.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-slate-900 font-semibold text-lg mb-1">
                    Join a Community
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Connect with like-minded athletes and build lasting friendships.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Target className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-slate-900 font-semibold text-lg mb-1">
                    Achieve Your Goals
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Track your progress and reach new milestones in your journey.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="p-8 sm:p-12 w-full max-w-md mx-auto lg:max-w-none">
            <div className="text-center mb-8">
              {/* The branding panel beside this is `hidden lg:flex`, so on a
                  phone — where most parents sign in — nothing identified the
                  platform at all without this. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/gwdlogo.png"
                alt="GWD Sports"
                className="mx-auto mb-5 h-12 w-auto lg:hidden"
              />
              <h2 className="text-2xl font-bold text-slate-900 font-display">
                {activeTab === "login" ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-slate-500 mt-2 font-medium">
                {activeTab === "login"
                  ? "Sign in to continue your journey"
                  : "Join us and start your sports journey"}
              </p>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "login" | "register")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 rounded-lg p-1">
                <TabsTrigger
                  value="login"
                  className="rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-500 font-semibold transition-all"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-500 font-semibold transition-all"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Register
                </TabsTrigger>
              </TabsList>

              {/* Display Error */}
              {error && (
                <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-600 rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-medium">{error}</AlertDescription>
                </Alert>
              )}

              {/* Login Tab */}
              <TabsContent value="login" className="focus-visible:outline-none">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="text-slate-700 font-semibold">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginData.email}
                        onChange={(e) =>
                          setLoginData({
                            ...loginData,
                            email: e.target.value,
                          })
                        }
                        className={`pl-10 h-12 bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 rounded-xl transition-all ${
                          validationErrors.email ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""
                        }`}
                      />
                    </div>
                    {validationErrors.email && (
                      <p className="text-red-500 text-xs font-medium">
                        {validationErrors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="login-password" className="text-slate-700 font-semibold">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
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
                        className={`pl-10 pr-10 h-12 bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 rounded-xl transition-all ${
                          validationErrors.password ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowLoginPassword(!showLoginPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showLoginPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {validationErrors.password && (
                      <p className="text-red-500 text-xs font-medium">
                        {validationErrors.password}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] mt-4"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        <LogIn className="h-5 w-5 mr-2" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="focus-visible:outline-none">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="register-name" className="text-slate-700 font-semibold">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="John Doe"
                        value={registerData.name}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            name: e.target.value,
                          })
                        }
                        className={`pl-10 h-11 bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 rounded-xl transition-all ${
                          validationErrors.name ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""
                        }`}
                      />
                    </div>
                    {validationErrors.name && (
                      <p className="text-red-500 text-xs font-medium">
                        {validationErrors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="register-email" className="text-slate-700 font-semibold">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="you@example.com"
                        value={registerData.email}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            email: e.target.value,
                          })
                        }
                        className={`pl-10 h-11 bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 rounded-xl transition-all ${
                          validationErrors.email ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""
                        }`}
                      />
                    </div>
                    {validationErrors.email && (
                      <p className="text-red-500 text-xs font-medium">
                        {validationErrors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="register-phone" className="text-slate-700 font-semibold">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        id="register-phone"
                        type="tel"
                        placeholder="9876543210"
                        value={registerData.phone}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            phone: e.target.value,
                          })
                        }
                        className={`pl-10 h-11 bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 rounded-xl transition-all ${
                          validationErrors.phone ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""
                        }`}
                      />
                    </div>
                    {validationErrors.phone && (
                      <p className="text-red-500 text-xs font-medium">
                        {validationErrors.phone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="register-password" className="text-slate-700 font-semibold">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
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
                        className={`pl-10 pr-10 h-11 bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 rounded-xl transition-all ${
                          validationErrors.password ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowRegisterPassword(!showRegisterPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showRegisterPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {validationErrors.password && (
                      <p className="text-red-500 text-xs font-medium">
                        {validationErrors.password}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="register-confirm-password"
                      className="text-slate-700 font-semibold"
                    >
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
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
                        className={`pl-10 pr-10 h-11 bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 rounded-xl transition-all ${
                          validationErrors.confirmPassword
                            ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                            : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {validationErrors.confirmPassword && (
                      <p className="text-red-500 text-xs font-medium">
                        {validationErrors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] mt-4"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-5 w-5 mr-2" />
                        Create Account
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
