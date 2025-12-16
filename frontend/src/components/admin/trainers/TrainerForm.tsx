import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Trainer, UserFormData } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Loader2 } from "lucide-react";

// Sports list
const SPORTS_LIST = [
  "Football",
  "Basketball",
  "Tennis",
  "Swimming",
  "Cricket",
  "Badminton",
  "Table Tennis",
  "Athletics",
  "Hockey",
  "Volleyball",
];

const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

// Form validation schema
const trainerFormSchema = z.object({
  // User fields (for creation only)
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .optional(),
  email: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .optional(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),

  // Trainer profile fields
  sports: z.array(z.string()).min(1, { message: "Select at least one sport" }),
  specializations: z.array(z.string()).optional(),
  hourlyRate: z.number().min(0).optional(),

  // Qualifications
  qualifications: z
    .array(
      z.object({
        certification: z.string().min(1, "Certification name is required"),
        issuedBy: z.string().min(1, "Issuing organization is required"),
        issuedDate: z.string().min(1, "Issue date is required"),
        expiryDate: z.string().optional(),
        certificateUrl: z.string().url().optional().or(z.literal("")),
      }),
    )
    .optional(),

  // Experience
  experience: z
    .array(
      z.object({
        organization: z.string().min(1, "Organization is required"),
        position: z.string().min(1, "Position is required"),
        startDate: z.string().min(1, "Start date is required"),
        endDate: z.string().optional(),
        description: z.string().min(1, "Description is required"),
      }),
    )
    .optional(),

  // Availability
  availabilityDays: z.array(z.string()).optional(),
  timeSlots: z
    .array(
      z.object({
        start: z
          .string()
          .regex(
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            "Invalid time format (HH:MM)",
          ),
        end: z
          .string()
          .regex(
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            "Invalid time format (HH:MM)",
          ),
      }),
    )
    .optional(),
});

type TrainerFormData = z.infer<typeof trainerFormSchema>;

interface TrainerFormProps {
  trainer?: Trainer;
  onSubmit: (userData: UserFormData | null, trainerData: any) => void;
  isLoading: boolean;
  onCancel: () => void;
}

export const TrainerForm: React.FC<TrainerFormProps> = ({
  trainer,
  onSubmit,
  isLoading,
  onCancel,
}) => {
  const isEditMode = !!trainer;

  // Additional state for dynamic fields
  const [specializationInput, setSpecializationInput] = useState("");
  const [specializations, setSpecializations] = useState<string[]>(
    trainer?.specializations || [],
  );

  const form = useForm<TrainerFormData>({
    resolver: zodResolver(trainerFormSchema),
    defaultValues: {
      name: trainer?.userId?.name || trainer?.user?.name || "",
      email: trainer?.userId?.email || trainer?.user?.email || "",
      password: "",
      phone: trainer?.userId?.phone || trainer?.user?.phone || "",
      sports: trainer?.sports || [],
      specializations: trainer?.specializations || [],
      hourlyRate: trainer?.hourlyRate || undefined,
      qualifications:
        trainer?.qualifications?.map((q) => ({
          certification: q.certification,
          issuedBy: q.issuedBy,
          issuedDate: q.issuedDate
            ? new Date(q.issuedDate).toISOString().split("T")[0]
            : "",
          expiryDate: q.expiryDate
            ? new Date(q.expiryDate).toISOString().split("T")[0]
            : "",
          certificateUrl: q.certificateUrl || "",
        })) || [],
      experience:
        trainer?.experience?.map((e) => ({
          organization: e.organization,
          position: e.position,
          startDate: e.startDate
            ? new Date(e.startDate).toISOString().split("T")[0]
            : "",
          endDate: e.endDate
            ? new Date(e.endDate).toISOString().split("T")[0]
            : "",
          description: e.description,
        })) || [],
      availabilityDays: trainer?.availability?.days || [],
      timeSlots: trainer?.availability?.timeSlots || [],
    },
  });

  // Watch fields for dynamic updates
  const watchedQualifications = form.watch("qualifications") || [];
  const watchedExperience = form.watch("experience") || [];
  const watchedTimeSlots = form.watch("timeSlots") || [];
  const selectedSports = form.watch("sports") || [];
  const selectedDays = form.watch("availabilityDays") || [];

  const addSpecialization = () => {
    if (specializationInput.trim()) {
      const newSpecs = [...specializations, specializationInput.trim()];
      setSpecializations(newSpecs);
      form.setValue("specializations", newSpecs);
      setSpecializationInput("");
    }
  };

  const removeSpecialization = (index: number) => {
    const newSpecs = specializations.filter((_, i) => i !== index);
    setSpecializations(newSpecs);
    form.setValue("specializations", newSpecs);
  };

  const addQualification = () => {
    form.setValue("qualifications", [
      ...watchedQualifications,
      {
        certification: "",
        issuedBy: "",
        issuedDate: "",
        expiryDate: "",
        certificateUrl: "",
      },
    ]);
  };

  const removeQualification = (index: number) => {
    form.setValue(
      "qualifications",
      watchedQualifications.filter((_, i) => i !== index),
    );
  };

  const addExperience = () => {
    form.setValue("experience", [
      ...watchedExperience,
      {
        organization: "",
        position: "",
        startDate: "",
        endDate: "",
        description: "",
      },
    ]);
  };

  const removeExperience = (index: number) => {
    form.setValue(
      "experience",
      watchedExperience.filter((_, i) => i !== index),
    );
  };

  const addTimeSlot = () => {
    form.setValue("timeSlots", [
      ...watchedTimeSlots,
      { start: "09:00", end: "17:00" },
    ]);
  };

  const removeTimeSlot = (index: number) => {
    form.setValue(
      "timeSlots",
      watchedTimeSlots.filter((_, i) => i !== index),
    );
  };

  const handleSubmit = (data: TrainerFormData) => {
    // Prepare user data (only for creation)
    const userData: UserFormData | null = isEditMode
      ? null
      : {
          name: data.name!,
          email: data.email!,
          password: data.password!,
          phone: data.phone,
          role: "trainer",
          sports: data.sports,
          isActive: true,
        };

    // Prepare trainer profile data
    const trainerData: any = {
      sports: data.sports,
      specializations: data.specializations || [],
      hourlyRate: data.hourlyRate,
      qualifications:
        data.qualifications?.map((q) => ({
          certification: q.certification,
          issuedBy: q.issuedBy,
          issuedDate: new Date(q.issuedDate).toISOString(),
          expiryDate: q.expiryDate
            ? new Date(q.expiryDate).toISOString()
            : undefined,
          certificateUrl: q.certificateUrl || undefined,
        })) || [],
      experience:
        data.experience?.map((e) => ({
          organization: e.organization,
          position: e.position,
          startDate: new Date(e.startDate).toISOString(),
          endDate: e.endDate ? new Date(e.endDate).toISOString() : undefined,
          description: e.description,
        })) || [],
      availability: {
        days: data.availabilityDays || [],
        timeSlots: data.timeSlots || [],
      },
    };

    onSubmit(userData, trainerData);
  };

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEditMode ? "Edit Trainer" : "Create New Trainer"}
        </CardTitle>
        <CardDescription>
          {isEditMode
            ? "Update trainer profile information."
            : "Create a new trainer account and profile."}
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            {/* User Information (only for creation) */}
            {!isEditMode && (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    User Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="john@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password *</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Min. 8 characters"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Sports */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Sports & Specializations
              </h3>
              <FormField
                control={form.control}
                name="sports"
                render={() => (
                  <FormItem>
                    <FormLabel>Sports * (Select at least one)</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {SPORTS_LIST.map((sport) => (
                        <FormField
                          key={sport}
                          control={form.control}
                          name="sports"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(sport)}
                                  onCheckedChange={(checked) => {
                                    const value = field.value || [];
                                    if (checked) {
                                      field.onChange([...value, sport]);
                                    } else {
                                      field.onChange(
                                        value.filter((s) => s !== sport),
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {sport}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Specializations */}
              <div className="mt-4 space-y-2">
                <Label>Specializations</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add specialization (e.g., Youth Training)"
                    value={specializationInput}
                    onChange={(e) => setSpecializationInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSpecialization();
                      }
                    }}
                  />
                  <Button type="button" onClick={addSpecialization} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {specializations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {specializations.map((spec, index) => (
                      <Badge key={index} variant="secondary">
                        {spec}
                        <button
                          type="button"
                          onClick={() => removeSpecialization(index)}
                          className="ml-2 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Hourly Rate */}
              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hourly Rate ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="50.00"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(
                              value ? parseFloat(value) : undefined,
                            );
                          }}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Qualifications */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Qualifications</h3>
                <Button
                  type="button"
                  onClick={addQualification}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Qualification
                </Button>
              </div>
              <div className="space-y-4">
                {watchedQualifications.map((_, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">
                        Qualification #{index + 1}
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQualification(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name={`qualifications.${index}.certification`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Certification Name *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="FIFA Level 1 Coaching"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`qualifications.${index}.issuedBy`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Issued By *</FormLabel>
                            <FormControl>
                              <Input placeholder="FIFA" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`qualifications.${index}.issuedDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Issue Date *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`qualifications.${index}.expiryDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`qualifications.${index}.certificateUrl`}
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Certificate URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Experience */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Experience</h3>
                <Button
                  type="button"
                  onClick={addExperience}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Experience
                </Button>
              </div>
              <div className="space-y-4">
                {watchedExperience.map((_, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">Experience #{index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExperience(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name={`experience.${index}.organization`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Local Sports Club"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`experience.${index}.position`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Position *</FormLabel>
                            <FormControl>
                              <Input placeholder="Youth Coach" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`experience.${index}.startDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`experience.${index}.endDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormDescription>
                              Leave empty if current
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`experience.${index}.description`}
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Description *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe the role and responsibilities..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Availability */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Availability</h3>

              {/* Days */}
              <FormField
                control={form.control}
                name="availabilityDays"
                render={() => (
                  <FormItem>
                    <FormLabel>Available Days</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                      {DAYS_OF_WEEK.map((day) => (
                        <FormField
                          key={day}
                          control={form.control}
                          name="availabilityDays"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(day)}
                                  onCheckedChange={(checked) => {
                                    const value = field.value || [];
                                    if (checked) {
                                      field.onChange([...value, day]);
                                    } else {
                                      field.onChange(
                                        value.filter((d) => d !== day),
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer capitalize">
                                {day.slice(0, 3)}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time Slots */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-3">
                  <Label>Time Slots</Label>
                  <Button
                    type="button"
                    onClick={addTimeSlot}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Time Slot
                  </Button>
                </div>
                <div className="space-y-2">
                  {watchedTimeSlots.map((_, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <FormField
                        control={form.control}
                        name={`timeSlots.${index}.start`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Start Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`timeSlots.${index}.end`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>End Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTimeSlot(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
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
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{isEditMode ? "Update Trainer" : "Create Trainer"}</>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
