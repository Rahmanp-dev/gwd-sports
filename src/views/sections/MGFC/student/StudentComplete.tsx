"use client";

import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "@/lib/router-shim";
import { motion } from "framer-motion";
import { useAppSelector, useAppDispatch } from "@/store";
import { setSession } from "@/store/slices/authSlice";
import type { User } from "@/types";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Trophy, Heart } from "lucide-react";
import { toast } from "sonner";

type Level =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "U12"
  | "U14"
  | "U16"
  | "U19"
  | "U23";

export default function StudentComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user, token, isAuthenticated } = useAppSelector((state) => state.auth);

  const stateUser = location.state?.user;
  const stateEmail = location.state?.email as string | undefined;

  const [level, setLevel] = useState<Level>("beginner");
  const [sports, setSports] = useState<string[]>(["football"]);
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!stateEmail && !stateUser) {
    return <Navigate to="/portal/student/register" replace />;
  }

  if (!isAuthenticated || !token || !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Sign in to continue</CardTitle>
            <CardDescription>
              Log in with {stateEmail || stateUser?.email} to finish your student profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() =>
                navigate("/user/auth", {
                  state: { email: stateEmail || stateUser?.email, from: "/portal/student/register/complete" },
                })
              }
            >
              Go to login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyName || !emergencyPhone || !emergencyRelation) {
      toast.error("Please fill emergency contact details");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await studentPublicService.createStudentProfile(
        {
          userId: user._id,
          sports,
          level,
          medicalInfo: {
            allergies: [],
            medications: [],
            emergencyContact: {
              name: emergencyName,
              phone: emergencyPhone,
              relation: emergencyRelation,
            },
          },
        },
        token,
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to create student profile");
      }

      dispatch(
        setSession({
          accessToken: token!,
          user: { ...user!, role: "student" } as User,
        }),
      );

      toast.success("Student profile created! Welcome to MGFC.");
      navigate("/portal/student", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Could not complete registration");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto"
      >
        <Card className="bg-gray-800/80 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              Complete your MGFC profile
            </CardTitle>
            <CardDescription>
              Hi {user.name}, add training details to access your student dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-white">Training level</Label>
                <RadioGroup value={level} onValueChange={(v) => setLevel(v as Level)}>
                  {(["beginner", "intermediate", "advanced"] as Level[]).map((opt) => (
                    <div key={opt} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt} id={opt} />
                      <Label htmlFor={opt} className="text-gray-300 capitalize">
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3 border-t border-gray-700 pt-4">
                <Label className="text-white flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-400" />
                  Emergency contact
                </Label>
                <Input
                  placeholder="Contact name"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white"
                />
                <Input
                  placeholder="Phone"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white"
                />
                <Input
                  placeholder="Relation"
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white"
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Finish registration"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
