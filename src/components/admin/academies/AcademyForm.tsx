"use client";
import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BRAND_NAME } from "@/utils/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Academy, AcademyFormData } from "@/services/academyService";
import { SPORTS_LIST } from "@/utils/constants";
import { X, Plus } from "lucide-react";

// Define form validation schema
const academyFormSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters" }),
  location: z.string().min(2, { message: "Location is required" }),
  address: z
    .string()
    .min(10, { message: "Address must be at least 10 characters" }),
  sports: z.array(z.string()).min(1, { message: "Select at least one sport" }),
  capacity: z.number().min(1, { message: "Capacity must be at least 1" }),
  facilities: z
    .array(z.string())
    .min(1, { message: "Add at least one facility" }),
  images: z.array(z.string()),
  contactInfo: z.object({
    name: z.string().min(2, { message: "Contact name is required" }),
    phone: z.string().min(10, { message: "Valid phone number is required" }),
    email: z.string().email({ message: "Valid email is required" }),
  }),
  fees: z.object({
    monthly: z.number().min(0, { message: "Monthly fee must be positive" }),
    quarterly: z.number().min(0, { message: "Quarterly fee must be positive" }),
    yearly: z.number().min(0, { message: "Yearly fee must be positive" }),
  }),
  timings: z.object({
    opening: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
      message: "Valid time format HH:MM",
    }),
    closing: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
      message: "Valid time format HH:MM",
    }),
    workingDays: z
      .array(z.string())
      .min(1, { message: "Select at least one working day" }),
  }),
  coordinates: z
    .object({
      lat: z.number().optional(),
      lng: z.number().optional(),
    })
    .optional(),
  coachName: z.string().optional(),
  establishedYear: z.number().optional(),
  achievements: z.array(z.string()).optional(),
  starPlayers: z
    .array(
      z.object({
        name: z.string(),
        role: z.string(),
        badge: z.string().optional(),
      })
    )
    .optional(),
  registeredTeams: z
    .array(
      z.object({
        name: z.string(),
        category: z.string(),
        winRate: z.string().optional(),
      })
    )
    .optional(),
  isActive: z.boolean().optional(),
});

type FormData = z.infer<typeof academyFormSchema>;

interface AcademyFormProps {
  academy?: Academy | null;
  onSubmit: (data: AcademyFormData) => void;
  isLoading: boolean;
  onCancel: () => void;
}

const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const AcademyForm: React.FC<AcademyFormProps> = ({
  academy,
  onSubmit,
  isLoading,
  onCancel,
}) => {
  const isEditMode = !!academy;
  const [newFacility, setNewFacility] = useState("");
  const [newImage, setNewImage] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(academyFormSchema),
    defaultValues: {
      name: academy?.name || "",
      description: academy?.description || "",
      location: academy?.location || "",
      address: academy?.address || "",
      sports: academy?.sports || [],
      capacity: academy?.capacity || 50,
      facilities: academy?.facilities || [],
      images: academy?.images || [],
      contactInfo: {
        name: academy?.contactInfo?.name || "",
        phone: academy?.contactInfo?.phone || "",
        email: academy?.contactInfo?.email || "",
      },
      fees: {
        monthly: academy?.fees?.monthly || 0,
        quarterly: academy?.fees?.quarterly || 0,
        yearly: academy?.fees?.yearly || 0,
      },
      timings: {
        opening: academy?.timings?.opening || "06:00",
        closing: academy?.timings?.closing || "22:00",
        workingDays: academy?.timings?.workingDays || [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
        ],
      },
      coordinates: {
        lat: academy?.coordinates?.lat ?? undefined,
        lng: academy?.coordinates?.lng ?? undefined,
      },
      coachName: academy?.coachName || "",
      establishedYear: academy?.establishedYear || 2024,
      achievements: academy?.achievements || [],
      starPlayers: academy?.starPlayers || [],
      registeredTeams: academy?.registeredTeams || [],
      isActive: academy?.isActive ?? true,
    },
  });

  const {
    fields: facilitiesFields,
    append: appendFacility,
    remove: removeFacility,
  } = useFieldArray({
    control: form.control as any,
    name: "facilities",
  });

  const {
    fields: imagesFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({
    control: form.control as any,
    name: "images",
  });

  const selectedSports = form.watch("sports");
  const selectedWorkingDays = form.watch("timings.workingDays");

  const toggleSport = (sport: string) => {
    const current = selectedSports || [];
    if (current.includes(sport)) {
      form.setValue(
        "sports",
        current.filter((s) => s !== sport),
      );
    } else {
      form.setValue("sports", [...current, sport]);
    }
  };

  const toggleWorkingDay = (day: string) => {
    const current = selectedWorkingDays || [];
    if (current.includes(day)) {
      form.setValue(
        "timings.workingDays",
        current.filter((d) => d !== day),
      );
    } else {
      form.setValue("timings.workingDays", [...current, day]);
    }
  };

  const handleAddFacility = () => {
    if (newFacility.trim()) {
      appendFacility(newFacility.trim());
      setNewFacility("");
    }
  };

  const handleAddImage = () => {
    if (newImage.trim()) {
      appendImage(newImage.trim());
      setNewImage("");
    }
  };

  const handleSubmit = (data: FormData) => {
    onSubmit(data as AcademyFormData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the academy's basic details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Academy Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={`${BRAND_NAME} FC Academy`}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the academy's offerings and facilities..."
                      rows={4}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Hyderabad"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="100"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Address *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Banjara Hills Road, Hyderabad, TS 500001"
                      rows={2}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Map Pin Coordinates */}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-emerald-600 mb-2">📍 Map Pin Coordinates</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="coordinates.lat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.0001"
                          placeholder="17.4485"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coordinates.lng"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.0001"
                          placeholder="78.3908"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sports Offered */}
        <Card>
          <CardHeader>
            <CardTitle>Sports Offered</CardTitle>
            <CardDescription>
              Select all sports available at this academy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="sports"
              render={() => (
                <FormItem>
                  <div className="flex flex-wrap gap-2">
                    {SPORTS_LIST.map((sport) => (
                      <Badge
                        key={sport}
                        variant={
                          selectedSports?.includes(sport.toLowerCase())
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => toggleSport(sport.toLowerCase())}
                      >
                        {sport}
                        {selectedSports?.includes(sport.toLowerCase()) && (
                          <X className="ml-1 h-3 w-3" />
                        )}
                      </Badge>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Primary contact details for the academy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="contactInfo.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Rahul Sharma"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactInfo.phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="98765 43210"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactInfo.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="contact@academy.com"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Fees Structure */}
        <Card>
          <CardHeader>
            <CardTitle>Fees Structure</CardTitle>
            <CardDescription>
              Set the pricing for different billing periods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="fees.monthly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Fee (₹) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="150.00"
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
                name="fees.quarterly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quarterly Fee (₹) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="400.00"
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
                name="fees.yearly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yearly Fee (₹) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="1500.00"
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
            </div>
          </CardContent>
        </Card>

        {/* Facilities */}
        <Card>
          <CardHeader>
            <CardTitle>Facilities</CardTitle>
            <CardDescription>List all available facilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add facility (e.g., Swimming Pool)"
                value={newFacility}
                onChange={(e) => setNewFacility(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddFacility())
                }
                disabled={isLoading}
              />
              <Button
                type="button"
                onClick={handleAddFacility}
                variant="outline"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {facilitiesFields.map((field, index) => (
                <Badge key={field.id} variant="secondary" className="pr-1">
                  {form.watch(`facilities.${index}`)}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-2"
                    onClick={() => removeFacility(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            {form.formState.errors.facilities && (
              <p className="text-sm text-red-500">
                {form.formState.errors.facilities.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Timings */}
        <Card>
          <CardHeader>
            <CardTitle>Operating Hours</CardTitle>
            <CardDescription>Set the academy's schedule</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="timings.opening"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opening Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timings.closing"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Closing Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="timings.workingDays"
              render={() => (
                <FormItem>
                  <FormLabel>Working Days *</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((day) => (
                      <Badge
                        key={day}
                        variant={
                          selectedWorkingDays?.includes(day)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer capitalize"
                        onClick={() => toggleWorkingDay(day)}
                      >
                        {day.slice(0, 3)}
                        {selectedWorkingDays?.includes(day) && (
                          <X className="ml-1 h-3 w-3" />
                        )}
                      </Badge>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Images (Optional) */}
        <Card>
          <CardHeader>
            <CardTitle>Images (Optional)</CardTitle>
            <CardDescription>Add image URLs for the academy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/image.jpg"
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddImage())
                }
                disabled={isLoading}
              />
              <Button
                type="button"
                onClick={handleAddImage}
                variant="outline"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {imagesFields.map((field, index) => (
                <Badge
                  key={field.id}
                  variant="secondary"
                  className="pr-1 max-w-xs truncate"
                >
                  {form.watch(`images.${index}`)}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-2"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        {isEditMode && (
          <Card>
            <CardHeader>
              <CardTitle>Academy Status</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div>
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Inactive academies won't be visible to users
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Saving..."
              : isEditMode
                ? "Update Academy"
                : "Create Academy"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
