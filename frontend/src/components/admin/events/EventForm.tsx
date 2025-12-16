import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Image as ImageIcon, AlertCircle } from "lucide-react";
import { SPORTS_LIST, EVENT_STATUS_OPTIONS } from "@/utils/constants";
import type { Event, EventFormData } from "@/types";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EventFormProps {
  event?: Event;
  onSubmit: (data: EventFormData) => void;
  isLoading?: boolean;
  error?: string | null;
}

export const EventForm: React.FC<EventFormProps> = ({
  event,
  onSubmit,
  isLoading = false,
  error = null,
}) => {
  const [tags, setTags] = useState<string[]>(event?.tags || []);
  const [prizes, setPrizes] = useState<string[]>(event?.prizes || []);
  const [links, setLinks] = useState<string[]>(event?.links || []);
  const [images, setImages] = useState<string[]>(event?.images || []);
  const [tagInput, setTagInput] = useState("");
  const [prizeInput, setPrizeInput] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [imageInput, setImageInput] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    defaultValues: event
      ? {
          name: event.name,
          description: event.description,
          sport: event.sport,
          startDate: new Date(event.startDate).toISOString().slice(0, 16),
          endDate: event.endDate
            ? new Date(event.endDate).toISOString().slice(0, 16)
            : undefined,
          location: event.location,
          venue: event.venue,
          maxParticipants: event.maxParticipants,
          registrationDeadline: event.registrationDeadline
            ? new Date(event.registrationDeadline).toISOString().slice(0, 16)
            : undefined,
          entryFee: event.entryFee,
          contactInfo: event.contactInfo,
          status: event.status,
          isPublic: event.isPublic,
          registrationOpen: event.registrationOpen,
          requirements: event.requirements,
        }
      : {
          status: "draft",
          isPublic: true,
          registrationOpen: true,
          contactInfo: { name: "", phone: "", email: "" },
        },
  });

  const status = watch("status");
  const isPublic = watch("isPublic");
  const registrationOpen = watch("registrationOpen");

  const handleFormSubmit = (data: EventFormData) => {
    onSubmit({
      ...data,
      tags,
      prizes,
      links,
      images,
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const addPrize = () => {
    if (prizeInput.trim()) {
      setPrizes([...prizes, prizeInput.trim()]);
      setPrizeInput("");
    }
  };

  const removePrize = (index: number) => {
    setPrizes(prizes.filter((_, i) => i !== index));
  };

  const addLink = () => {
    if (linkInput.trim()) {
      setLinks([...links, linkInput.trim()]);
      setLinkInput("");
    }
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const addImage = () => {
    if (imageInput.trim()) {
      // Basic URL validation
      try {
        new URL(imageInput.trim());
        setImages([...images, imageInput.trim()]);
        setImageInput("");
      } catch {
        alert("Please enter a valid image URL");
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-line">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Event Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register("name", {
                required: "Event name is required",
                minLength: { value: 3, message: "Minimum 3 characters" },
                maxLength: { value: 100, message: "Maximum 100 characters" },
              })}
              placeholder="Annual Football Championship"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sport">
              Sport <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch("sport")}
              onValueChange={(value) => setValue("sport", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sport" />
              </SelectTrigger>
              <SelectContent>
                {SPORTS_LIST.map((sport) => (
                  <SelectItem key={sport} value={sport.toLowerCase()}>
                    {sport}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.sport && (
              <p className="text-sm text-red-500">{errors.sport.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Description <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            {...register("description", {
              required: "Description is required",
              minLength: { value: 10, message: "Minimum 10 characters" },
              maxLength: { value: 2000, message: "Maximum 2000 characters" },
            })}
            placeholder="Describe your event..."
            rows={4}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>
      </div>

      {/* Date & Location */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Date & Location</h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">
              Start Date & Time <span className="text-red-500">*</span>
            </Label>
            <Input
              id="startDate"
              type="datetime-local"
              {...register("startDate", {
                required: "Start date is required",
              })}
            />
            {errors.startDate && (
              <p className="text-sm text-red-500">{errors.startDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date & Time</Label>
            <Input
              id="endDate"
              type="datetime-local"
              {...register("endDate")}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="location">
              Location <span className="text-red-500">*</span>
            </Label>
            <Input
              id="location"
              {...register("location", { required: "Location is required" })}
              placeholder="City, State"
            />
            {errors.location && (
              <p className="text-sm text-red-500">{errors.location.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue">
              Venue <span className="text-red-500">*</span>
            </Label>
            <Input
              id="venue"
              {...register("venue", { required: "Venue is required" })}
              placeholder="Stadium Name or Address"
            />
            {errors.venue && (
              <p className="text-sm text-red-500">{errors.venue.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Registration Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Registration Details</h3>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maxParticipants">Max Participants</Label>
            <Input
              id="maxParticipants"
              type="number"
              min="1"
              {...register("maxParticipants", {
                min: { value: 1, message: "Minimum 1 participant" },
              })}
              placeholder="50"
              onKeyDown={(e) => {
                if (e.key === "-" || e.key === "e" || e.key === "E") {
                  e.preventDefault();
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entryFee">Entry Fee (₹)</Label>
            <Input
              id="entryFee"
              type="number"
              min="0"
              value="0"
              step="1.00"
              {...register("entryFee", {
                min: { value: 0, message: "Cannot be negative" },
              })}
              placeholder="0"
              onKeyDown={(e) => {
                if (e.key === "-" || e.key === "e" || e.key === "E") {
                  e.preventDefault();
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationDeadline">Registration Deadline</Label>
            <Input
              id="registrationDeadline"
              type="datetime-local"
              {...register("registrationDeadline")}
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Contact Information</h3>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactName">
              Contact Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contactName"
              {...register("contactInfo.name", {
                required: "Contact name is required",
              })}
              placeholder="John Doe"
            />
            {errors.contactInfo?.name && (
              <p className="text-sm text-red-500">
                {errors.contactInfo.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">
              Contact Phone <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contactPhone"
              {...register("contactInfo.phone", {
                required: "Contact phone is required",
                pattern: {
                  value: /^[+]?[\d\s\-\(\)]{10,}$/,
                  message: "Invalid phone number",
                },
              })}
              placeholder="+1234567890"
            />
            {errors.contactInfo?.phone && (
              <p className="text-sm text-red-500">
                {errors.contactInfo.phone.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail">
              Contact Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contactEmail"
              type="email"
              {...register("contactInfo.email", {
                required: "Contact email is required",
                pattern: {
                  value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                  message: "Invalid email",
                },
              })}
              placeholder="contact@example.com"
            />
            {errors.contactInfo?.email && (
              <p className="text-sm text-red-500">
                {errors.contactInfo.email.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status & Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Status & Settings</h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Event Status</Label>
            <Select
              value={status}
              onValueChange={(value) => setValue("status", value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label htmlFor="isPublic">Public Event</Label>
              <p className="text-sm text-muted-foreground">
                Event visible to all users
              </p>
            </div>
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={(checked) => setValue("isPublic", checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label htmlFor="registrationOpen">Registration Open</Label>
              <p className="text-sm text-muted-foreground">
                Allow users to register
              </p>
            </div>
            <Switch
              id="registrationOpen"
              checked={registrationOpen}
              onCheckedChange={(checked) =>
                setValue("registrationOpen", checked)
              }
            />
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Additional Details</h3>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), addTag())
              }
              placeholder="Add tag..."
            />
            <Button type="button" onClick={addTag} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Requirements */}
        <div className="space-y-2">
          <Label htmlFor="requirements">Requirements</Label>
          <Textarea
            id="requirements"
            {...register("requirements")}
            placeholder="List any requirements for participants..."
            rows={3}
          />
        </div>

        {/* Prizes */}
        <div className="space-y-2">
          <Label>Prizes</Label>
          <div className="flex gap-2">
            <Input
              value={prizeInput}
              onChange={(e) => setPrizeInput(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), addPrize())
              }
              placeholder="Add prize..."
            />
            <Button type="button" onClick={addPrize} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {prizes.length > 0 && (
            <ul className="space-y-2 mt-2">
              {prizes.map((prize, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded"
                >
                  <span className="text-sm">{prize}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePrize(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Links */}
        <div className="space-y-2">
          <Label>Event Links</Label>
          <div className="flex gap-2">
            <Input
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), addLink())
              }
              placeholder="https://..."
            />
            <Button type="button" onClick={addLink} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {links.length > 0 && (
            <ul className="space-y-2 mt-2">
              {links.map((link, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded"
                >
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate flex-1"
                  >
                    {link}
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLink(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Event Images */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Event Images (URLs)
          </Label>
          <p className="text-sm text-muted-foreground">
            Add valid image URLs (must end with .jpg, .jpeg, .png, .gif, .webp)
          </p>
          <div className="flex gap-2">
            <Input
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), addImage())
              }
              placeholder="https://example.com/image.jpg"
              type="url"
            />
            <Button type="button" onClick={addImage} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {images.map((image, index) => (
                <div
                  key={index}
                  className="relative group rounded-lg overflow-hidden border bg-muted"
                >
                  <img
                    src={image}
                    alt={`Event image ${index + 1}`}
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/400x300?text=Invalid+Image+URL";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                  <div className="p-2 bg-background/95">
                    <a
                      href={image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline truncate block"
                    >
                      {image}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : event ? "Update Event" : "Create Event"}
        </Button>
      </div>
    </form>
  );
};
