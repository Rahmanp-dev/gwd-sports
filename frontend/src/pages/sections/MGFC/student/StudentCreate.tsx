import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { authService } from "@/services/authService";
import { studentPublicService } from "@/services/studentService";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  User,
  Mail,
  Phone,
  Lock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Heart,
  Trophy,
  Shield,
  Users,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

interface MedicalInfo {
  allergies: string[];
  medications: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
}

export default function StudentCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email || "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  //   const [currentStep, setCurrentStep] = useState<"user" | "both">("both");

  // User Details State
  const [userDetails, setUserDetails] = useState({
    name: "",
    email: emailFromState,
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // Student Details State
  const [studentDetails, setStudentDetails] = useState({
    sports: ["football"] as string[],
    level: "beginner" as "beginner" | "intermediate" | "advanced",
    allergies: "",
    medications: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelation: "",
  });

  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Available sports (football is mandatory)
  const availableSports = [
    { id: "football", label: "Football ⚽", mandatory: true },
    { id: "basketball", label: "Basketball 🏀", mandatory: false },
    { id: "cricket", label: "Cricket 🏏", mandatory: false },
    { id: "tennis", label: "Tennis 🎾", mandatory: false },
    { id: "badminton", label: "Badminton 🏸", mandatory: false },
    { id: "swimming", label: "Swimming 🏊", mandatory: false },
  ];

  // Validate User Details
  const validateUserDetails = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!userDetails.name || userDetails.name.length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (!userDetails.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(userDetails.email)) {
      errors.email = "Email is invalid";
    }

    if (!userDetails.phone) {
      errors.phone = "Phone number is required";
    } else if (!/^[+]?[\d\s\-\(\)]{10,}$/.test(userDetails.phone)) {
      errors.phone = "Phone number is invalid";
    }

    if (!userDetails.password) {
      errors.password = "Password is required";
    } else if (userDetails.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/.test(
        userDetails.password,
      )
    ) {
      errors.password =
        "Password must contain uppercase, lowercase, number, and special character (@$!%*?&#)";
    }

    if (userDetails.password !== userDetails.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate Student Details
  const validateStudentDetails = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!studentDetails.sports.includes("football")) {
      errors.sports = "Football is mandatory for MGFC students";
    }

    if (studentDetails.sports.length === 0) {
      errors.sports = "Select at least one sport";
    }

    if (!studentDetails.emergencyName) {
      errors.emergencyName = "Emergency contact name is required";
    }

    if (!studentDetails.emergencyPhone) {
      errors.emergencyPhone = "Emergency contact phone is required";
    } else if (!/^[+]?[\d\s\-\(\)]{10,}$/.test(studentDetails.emergencyPhone)) {
      errors.emergencyPhone = "Invalid phone number";
    }

    if (!studentDetails.emergencyRelation) {
      errors.emergencyRelation = "Emergency contact relation is required";
    }

    setValidationErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  // Handle Sport Selection
  const handleSportToggle = (sportId: string) => {
    if (sportId === "football") return; // Football is mandatory, can't be unchecked

    setStudentDetails((prev) => {
      const sports = prev.sports.includes(sportId)
        ? prev.sports.filter((s) => s !== sportId)
        : [...prev.sports, sportId];
      return { ...prev, sports };
    });
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate both sections
    const isUserValid = validateUserDetails();
    const isStudentValid = validateStudentDetails();

    if (!isUserValid || !isStudentValid) {
      toast.error("Please fix all validation errors");
      return;
    }

    try {
      setIsSubmitting(true);

      // Step 1: Create User Account
      toast.loading("Creating your account...");
      const userResponse = await authService.register({
        name: userDetails.name,
        email: userDetails.email,
        phone: userDetails.phone,
        password: userDetails.password,
        role: "user",
        sports: studentDetails.sports,
      });

      if (!userResponse.success) {
        throw new Error("Failed to create user account");
      }

      const userId = userResponse.data.user._id;
      const accessToken = userResponse.data.accessToken;

      toast.dismiss();
      toast.success("Account created successfully!");

      // Step 2: Create Student Profile
      toast.loading("Setting up your student profile...");

      // Prepare medical info
      const medicalInfo: MedicalInfo = {
        allergies: studentDetails.allergies
          ? studentDetails.allergies
              .split(",")
              .map((a) => a.trim())
              .filter(Boolean)
          : [],
        medications: studentDetails.medications
          ? studentDetails.medications
              .split(",")
              .map((m) => m.trim())
              .filter(Boolean)
          : [],
        emergencyContact: {
          name: studentDetails.emergencyName,
          phone: studentDetails.emergencyPhone,
          relation: studentDetails.emergencyRelation,
        },
      };

      const studentResponse = await studentPublicService.createStudentProfile(
        {
          userId,
          sports: studentDetails.sports,
          level: studentDetails.level,
          medicalInfo,
        },
        accessToken,
      );

      if (!studentResponse.success) {
        throw new Error("Failed to create student profile");
      }

      toast.dismiss();
      toast.success("Student profile created successfully! 🎉");

      // Wait a bit for user to see success message
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Redirect to login or dashboard
      navigate("/user/auth", {
        state: {
          email: userDetails.email,
          message: "Registration successful! Please login to continue.",
        },
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.dismiss();
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black py-8 px-4 sm:px-6 lg:px-8">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-7xl mx-auto relative z-10"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Join{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-500">
              MGFC
            </span>
          </h1>
          <p className="text-xl text-gray-400">
            Complete your registration to start your football journey
          </p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - User Details */}
            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 backdrop-blur-xl h-full">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">
                        Personal Details
                      </CardTitle>
                      <CardDescription>
                        Your account information
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">
                      Full Name *
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={userDetails.name}
                        onChange={(e) =>
                          setUserDetails({
                            ...userDetails,
                            name: e.target.value,
                          })
                        }
                        className={`pl-10 bg-gray-800 border-gray-700 text-white ${
                          validationErrors.name ? "border-red-500" : ""
                        }`}
                        disabled={isSubmitting}
                      />
                    </div>
                    {validationErrors.name && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">
                      Email Address *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={userDetails.email}
                        onChange={(e) =>
                          setUserDetails({
                            ...userDetails,
                            email: e.target.value,
                          })
                        }
                        className={`pl-10 bg-gray-800 border-gray-700 text-white ${
                          validationErrors.email ? "border-red-500" : ""
                        }`}
                        disabled={isSubmitting || !!emailFromState}
                      />
                    </div>
                    {validationErrors.email && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white">
                      Phone Number *
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1234567890"
                        value={userDetails.phone}
                        onChange={(e) =>
                          setUserDetails({
                            ...userDetails,
                            phone: e.target.value,
                          })
                        }
                        className={`pl-10 bg-gray-800 border-gray-700 text-white ${
                          validationErrors.phone ? "border-red-500" : ""
                        }`}
                        disabled={isSubmitting}
                      />
                    </div>
                    {validationErrors.phone && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors.phone}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">
                      Password *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={userDetails.password}
                        onChange={(e) =>
                          setUserDetails({
                            ...userDetails,
                            password: e.target.value,
                          })
                        }
                        className={`pl-10 pr-10 bg-gray-800 border-gray-700 text-white ${
                          validationErrors.password ? "border-red-500" : ""
                        }`}
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        disabled={isSubmitting}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {validationErrors.password && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors.password}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      Min 8 characters with uppercase, lowercase, number &
                      special char
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white">
                      Confirm Password *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={userDetails.confirmPassword}
                        onChange={(e) =>
                          setUserDetails({
                            ...userDetails,
                            confirmPassword: e.target.value,
                          })
                        }
                        className={`pl-10 pr-10 bg-gray-800 border-gray-700 text-white ${
                          validationErrors.confirmPassword
                            ? "border-red-500"
                            : ""
                        }`}
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        disabled={isSubmitting}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {validationErrors.confirmPassword && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right Column - Student Details */}
            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 backdrop-blur-xl h-full">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">
                        Student Profile
                      </CardTitle>
                      <CardDescription>
                        Your athletic information
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Sports Selection */}
                  <div className="space-y-3">
                    <Label className="text-white">Sports Interests</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {availableSports.map((sport) => (
                        <div
                          key={sport.id}
                          className={`flex items-center space-x-2 p-3 rounded-lg border ${
                            studentDetails.sports.includes(sport.id)
                              ? "bg-blue-500/20 border-blue-500/50"
                              : "bg-gray-800/50 border-gray-700"
                          } ${sport.mandatory ? "opacity-100" : "hover:bg-gray-700/50"}`}
                        >
                          <Checkbox
                            id={sport.id}
                            checked={studentDetails.sports.includes(sport.id)}
                            onCheckedChange={() =>
                              !sport.mandatory && handleSportToggle(sport.id)
                            }
                            disabled={sport.mandatory || isSubmitting}
                            className="border-gray-600"
                          />
                          <Label
                            htmlFor={sport.id}
                            className={`text-sm text-white flex-1 ${
                              !sport.mandatory
                                ? "cursor-pointer"
                                : "cursor-not-allowed"
                            }`}
                          >
                            {sport.label}
                            {sport.mandatory && (
                              <span className="text-xs text-blue-400 ml-1">
                                (Required)
                              </span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {validationErrors.sports && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors.sports}
                      </p>
                    )}
                  </div>

                  {/* Skill Level */}
                  <div className="space-y-3">
                    <Label className="text-white">Skill Level *</Label>
                    <RadioGroup
                      value={studentDetails.level}
                      onValueChange={(value: any) =>
                        setStudentDetails({ ...studentDetails, level: value })
                      }
                      disabled={isSubmitting}
                      className="grid grid-cols-3 gap-3"
                    >
                      {(["beginner", "intermediate", "advanced"] as const).map(
                        (level) => (
                          <div
                            key={level}
                            className={`relative flex items-center space-x-2 p-3 rounded-lg border cursor-pointer ${
                              studentDetails.level === level
                                ? "bg-green-500/20 border-green-500/50"
                                : "bg-gray-800/50 border-gray-700 hover:bg-gray-700/50"
                            }`}
                          >
                            <RadioGroupItem
                              value={level}
                              id={level}
                              className="border-gray-600"
                            />
                            <Label
                              htmlFor={level}
                              className="text-sm text-white cursor-pointer capitalize"
                            >
                              {level}
                            </Label>
                          </div>
                        ),
                      )}
                    </RadioGroup>
                  </div>

                  {/* Medical Information */}
                  <div className="space-y-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-400" />
                      <Label className="text-white font-semibold">
                        Medical Information
                      </Label>
                    </div>

                    {/* Allergies */}
                    <div className="space-y-2">
                      <Label htmlFor="allergies" className="text-white text-sm">
                        Allergies (comma-separated, optional)
                      </Label>
                      <Input
                        id="allergies"
                        type="text"
                        placeholder="e.g., peanuts, shellfish"
                        value={studentDetails.allergies}
                        onChange={(e) =>
                          setStudentDetails({
                            ...studentDetails,
                            allergies: e.target.value,
                          })
                        }
                        className="bg-gray-800 border-gray-700 text-white"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Medications */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="medications"
                        className="text-white text-sm"
                      >
                        Current Medications (comma-separated, optional)
                      </Label>
                      <Input
                        id="medications"
                        type="text"
                        placeholder="e.g., inhaler, insulin"
                        value={studentDetails.medications}
                        onChange={(e) =>
                          setStudentDetails({
                            ...studentDetails,
                            medications: e.target.value,
                          })
                        }
                        className="bg-gray-800 border-gray-700 text-white"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-yellow-400" />
                      <Label className="text-white font-semibold">
                        Emergency Contact *
                      </Label>
                    </div>

                    <div className="space-y-3">
                      {/* Emergency Name */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="emergencyName"
                          className="text-white text-sm"
                        >
                          Contact Name *
                        </Label>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="emergencyName"
                            type="text"
                            placeholder="Jane Doe"
                            value={studentDetails.emergencyName}
                            onChange={(e) =>
                              setStudentDetails({
                                ...studentDetails,
                                emergencyName: e.target.value,
                              })
                            }
                            className={`pl-10 bg-gray-800 border-gray-700 text-white ${
                              validationErrors.emergencyName
                                ? "border-red-500"
                                : ""
                            }`}
                            disabled={isSubmitting}
                          />
                        </div>
                        {validationErrors.emergencyName && (
                          <p className="text-red-500 text-xs flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {validationErrors.emergencyName}
                          </p>
                        )}
                      </div>

                      {/* Emergency Phone */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="emergencyPhone"
                          className="text-white text-sm"
                        >
                          Contact Phone *
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="emergencyPhone"
                            type="tel"
                            placeholder="+1987654321"
                            value={studentDetails.emergencyPhone}
                            onChange={(e) =>
                              setStudentDetails({
                                ...studentDetails,
                                emergencyPhone: e.target.value,
                              })
                            }
                            className={`pl-10 bg-gray-800 border-gray-700 text-white ${
                              validationErrors.emergencyPhone
                                ? "border-red-500"
                                : ""
                            }`}
                            disabled={isSubmitting}
                          />
                        </div>
                        {validationErrors.emergencyPhone && (
                          <p className="text-red-500 text-xs flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {validationErrors.emergencyPhone}
                          </p>
                        )}
                      </div>

                      {/* Emergency Relation */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="emergencyRelation"
                          className="text-white text-sm"
                        >
                          Relation *
                        </Label>
                        <Input
                          id="emergencyRelation"
                          type="text"
                          placeholder="Mother, Father, Guardian, etc."
                          value={studentDetails.emergencyRelation}
                          onChange={(e) =>
                            setStudentDetails({
                              ...studentDetails,
                              emergencyRelation: e.target.value,
                            })
                          }
                          className={`bg-gray-800 border-gray-700 text-white ${
                            validationErrors.emergencyRelation
                              ? "border-red-500"
                              : ""
                          }`}
                          disabled={isSubmitting}
                        />
                        {validationErrors.emergencyRelation && (
                          <p className="text-red-500 text-xs flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {validationErrors.emergencyRelation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Submit Button */}
          <motion.div variants={itemVariants} className="mt-6">
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-white font-medium">Ready to join?</p>
                      <p className="text-sm text-gray-400">
                        By registering, you agree to our Terms of Service and
                        Privacy Policy
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(-1)}
                      disabled={isSubmitting}
                      className="flex-1 sm:flex-initial border-gray-600 text-black hover:bg-gray-800 hover:text-white"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 sm:flex-initial bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Complete Registration
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
