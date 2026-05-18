import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Student, StudentUpdateData } from "@/types";
import { SPORTS_LIST } from "@/utils/constants";

// Define form validation schema
const studentFormSchema = z.object({
  academyId: z.string().min(1, { message: "Academy is required" }),
  trainerId: z.string().optional(),
  sport: z.string().min(1, { message: "Sport is required" }),
  level: z.enum(["beginner", "intermediate", "advanced", "U12", "U14", "U16", "U19", "U23"]),
  fees: z.object({
    amount: z.number().min(0, { message: "Amount must be positive" }),
    period: z.enum(["monthly", "quarterly", "yearly"]),
    dueDate: z.string().min(1, { message: "Due date is required" }),
    status: z.enum(["paid", "pending", "overdue"]).optional(),
  }),
});

type StudentFormData = z.infer<typeof studentFormSchema>;

interface StudentFormProps {
  student?: Student;
  onSubmit: (data: StudentUpdateData) => void;
  isLoading: boolean;
  onCancel: () => void;
}

// Mock data - replace with actual API calls
const mockAcademies = [
  {
    _id: "68a337d874f386a3a7ea1273",
    name: "Elite Sports Academy",
    location: "Los Angeles",
  },
  { _id: "2", name: "Champions Training Center", location: "New York" },
];

const mockTrainers = [
  {
    _id: "68a33c1171f5b7e03e9e70be",
    name: "Trainer Doe",
    sports: ["football", "basketball"],
  },
  { _id: "2", name: "Sarah Johnson", sports: ["tennis", "swimming"] },
];

export const StudentForm: React.FC<StudentFormProps> = ({
  student,
  onSubmit,
  isLoading,
  onCancel,
}) => {
  const isEditMode = !!student;
  const [academies, setAcademies] = useState(mockAcademies);
  const [trainers, setTrainers] = useState(mockTrainers);
  const [filteredTrainers, setFilteredTrainers] = useState(mockTrainers);

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      academyId: student?.academyId || "",
      trainerId: student?.trainerId || undefined, // Changed from empty string to undefined
      sport: student?.sport || "",
      level: student?.level || "beginner",
      fees: {
        amount: student?.fees?.amount || 0,
        period: student?.fees?.period || "monthly",
        dueDate: student?.fees?.dueDate
          ? new Date(student?.fees?.dueDate).toISOString().split("T")[0]
          : "",
        status: student?.fees?.status || "pending",
      },
    },
  });

  const selectedSport = form.watch("sport");

  // Filter trainers based on selected sport
  useEffect(() => {
    if (selectedSport) {
      const filtered = trainers.filter((trainer) =>
        trainer.sports.some(
          (sport) => sport.toLowerCase() === selectedSport.toLowerCase(),
        ),
      );
      setFilteredTrainers(filtered);

      // Reset trainer selection if current trainer doesn't support the sport
      const currentTrainer = form.getValues("trainerId");
      if (currentTrainer && !filtered.find((t) => t._id === currentTrainer)) {
        form.setValue("trainerId", undefined);
      }
    } else {
      setFilteredTrainers(trainers);
    }
  }, [selectedSport, trainers, form]);

  const handleSubmit = (data: StudentFormData) => {
    // Convert date string to ISO string for API
    if (data.fees?.dueDate) {
      data.fees.dueDate = new Date(data.fees.dueDate).toISOString();
    }

    // Convert form data to StudentUpdateData format
    const submitData: StudentUpdateData = {
      academyId: data.academyId,
      trainerId: data.trainerId,
      sport: data.sport,
      level: data.level,
      fees: {
        ...data.fees,
        status: data.fees.status || "pending",
      },
    };

    onSubmit(submitData);
  };

  if (!isEditMode) {
    onCancel();
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Student</CardTitle>
        <CardDescription>
          Update student information and training details.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            {/* Student Info Display */}
            {student && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Student Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>{" "}
                    {student.user?.name || "Unknown"}
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>{" "}
                    {student.user?.email || "No email"}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Academy Field */}
              <FormField
                control={form.control}
                name="academyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academy</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an academy" />
                        </SelectTrigger>
                        <SelectContent>
                          {academies.map((academy) => (
                            <SelectItem key={academy._id} value={academy._id}>
                              {academy.name} - {academy.location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sport Field */}
              <FormField
                control={form.control}
                name="sport"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sport</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a sport" />
                        </SelectTrigger>
                        <SelectContent>
                          {SPORTS_LIST.map((sport) => (
                            <SelectItem key={sport} value={sport.toLowerCase()}>
                              {sport}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Trainer Field */}
              <FormField
                control={form.control}
                name="trainerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trainer (Optional)</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value || "none"}
                        onValueChange={(value) => {
                          field.onChange(value === "none" ? undefined : value);
                        }}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a trainer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            No trainer assigned
                          </SelectItem>
                          {filteredTrainers.map((trainer) => (
                            <SelectItem key={trainer._id} value={trainer._id}>
                              {trainer.name} ({trainer.sports.join(", ")})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Level Field */}
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedSport === "cricket" ? (
                            <>
                              <SelectItem value="U12">U12</SelectItem>
                              <SelectItem value="U14">U14</SelectItem>
                              <SelectItem value="U16">U16</SelectItem>
                              <SelectItem value="U19">U19</SelectItem>
                              <SelectItem value="U23">U23</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fee Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Fee Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="fees.amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="100.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fees.period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Period</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fees.dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {isEditMode && (
                <FormField
                  control={form.control}
                  name="fees.status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee Status</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Student"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
