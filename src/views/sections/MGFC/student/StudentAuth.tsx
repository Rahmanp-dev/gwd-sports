"use client";
import { useState } from "react";
import { useNavigate } from "@/lib/router-shim";
import { motion } from "framer-motion";
import { userService } from "@/services/userService";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export default function StudentRegister() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");

  // Validate email format
  const validateEmail = (): boolean => {
    if (!email) {
      setError("Email is required");
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }

    setError("");
    return true;
  };

  // Handle email check
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail()) {
      return;
    }

    try {
      setIsChecking(true);
      setError("");

      const response = await userService.checkEmail(email);

      console.log(response);

      if (response.success) {
        const message = response.message;

        // Fresh User - No account - create User Profile and Student Profile
        if (message === "User not found") {
          toast.success("Hi there! Let's create your account.");
          await new Promise((resolve) => setTimeout(resolve, 2000));
          navigate("/portal/student/register/create", { state: { email } });
        }
        // Existing User - Has no profile OR incomplete profile - create Student Profile
        else if (
          message === "User has a no other profile" ||
          message === "Student profile not found" ||
          message === "Trainer profile not found"
        ) {
          if (response.data?.user) {
            toast.success(
              `Welcome ${response.data.user.name}! Let's create your student profile.`,
            );
            await new Promise((resolve) => setTimeout(resolve, 2000));
            navigate("/portal/student/register/complete", {
              state: { email, user: response.data.user },
            });
          }
        }
        // Existing User - Has a student profile - redirect to login
        // Existing User - Has a student or trainer profile - redirect to login
        else if (
          message === "User has a student profile" ||
          message === "User has a trainer profile"
        ) {
          const profileType = message.includes("student")
            ? "student"
            : "trainer";
          if (response.data?.user) {
            toast.info(
              `You already have a ${profileType} profile, ${response.data.user.name}! Please login to continue.`,
            );
          }
          await new Promise((resolve) => setTimeout(resolve, 2000));
          navigate("/user/auth", { state: { email } });
        }
        // Fallback - shouldn't reach here but handle gracefully
        else {
          toast.info("Please login to continue.");
          await new Promise((resolve) => setTimeout(resolve, 1500));
          navigate("/user/auth", { state: { email } });
        }
      }
    } catch (error: any) {
      console.error("Email check error:", error);
      setError(error.message || "Failed to verify email. Please try again.");
      toast.error("Failed to verify email");
    } finally {
      setIsChecking(false);
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

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-md relative z-10"
      >
        <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 backdrop-blur-xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl text-white">
              Student Registration
            </CardTitle>
            <CardDescription className="text-gray-400">
              Enter your email address to get started
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleCheckEmail} className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert
                  variant="destructive"
                  className="animate-in slide-in-from-top"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white text-base">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    className={`pl-10 h-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 ${
                      error ? "border-red-500" : ""
                    }`}
                    disabled={isChecking}
                    autoFocus
                  />
                </div>
                <p className="text-sm text-gray-400">
                  We'll check if you already have an account
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold"
                disabled={isChecking}
              >
                {isChecking ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Checking Email...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>

              {/* Info Box */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm text-blue-300 font-medium">
                      What happens next?
                    </p>
                    <ul className="text-xs text-gray-400 space-y-1">
                      <li>• If you have an account, we'll ask you to login</li>
                      <li>
                        • If you're new, we'll help you create your profile
                      </li>
                      <li>• Your data is secure and encrypted</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Back Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  ← Back to Home
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer Text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}
