import React from "react";
import type { Trainer } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  Award,
  Briefcase,
  Clock,
  DollarSign,
  Users,
  Star,
} from "lucide-react";
import { formatDate } from "@/utils/helpers";

interface TrainerDetailsProps {
  trainer: Trainer;
  onClose: () => void;
  onEdit: () => void;
}

export const TrainerDetails: React.FC<TrainerDetailsProps> = ({
  trainer,
  onClose,
  onEdit,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const userName = trainer.userId?.name || trainer.user?.name || "Unknown";
  const userEmail = trainer.userId?.email || trainer.user?.email || "N/A";
  const userPhone =
    trainer.userId?.phone || trainer.user?.phone || "Not provided";

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg bg-blue-500 text-white">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{userName}</CardTitle>
              <CardDescription className="flex items-center mt-1 gap-2">
                <Badge className="bg-blue-500 hover:bg-blue-600">Trainer</Badge>
                <span className="flex items-center">
                  {trainer.isActive ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500 mr-1" />
                      Inactive
                    </>
                  )}
                </span>
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Email</span>
              <p className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                {userEmail}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Phone</span>
              <p className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                {userPhone}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Trainer Information */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Trainer Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Hourly Rate</span>
              <p className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />$
                {trainer.hourlyRate || "Not set"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">
                Student Count
              </span>
              <p className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                {trainer.studentCount || trainer.students?.length || 0} students
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Rating</span>
              <p className="flex items-center">
                <Star className="h-4 w-4 mr-2 text-yellow-500" />
                {trainer.rating?.average?.toFixed(1) || "0.0"} (
                {trainer.rating?.totalReviews || 0} reviews)
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Joined Date</span>
              <p className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                {trainer.joinedDate ? formatDate(trainer.joinedDate) : "N/A"}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Sports */}
        {trainer.sports && trainer.sports.length > 0 && (
          <>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Sports</h3>
              <div className="flex flex-wrap gap-2">
                {trainer.sports.map((sport) => (
                  <Badge key={sport} variant="secondary" className="capitalize">
                    {sport}
                  </Badge>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Specializations */}
        {trainer.specializations && trainer.specializations.length > 0 && (
          <>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Specializations</h3>
              <div className="flex flex-wrap gap-2">
                {trainer.specializations.map((spec, index) => (
                  <Badge key={index} variant="outline">
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Qualifications */}
        {trainer.qualifications && trainer.qualifications.length > 0 && (
          <>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Award className="h-5 w-5" />
                Qualifications
              </h3>
              <div className="space-y-3">
                {trainer.qualifications.map((qual, index) => (
                  <div
                    key={index}
                    className="p-4 bg-muted/50 rounded-lg space-y-2"
                  >
                    <p className="font-semibold">{qual.certification}</p>
                    <p className="text-sm text-muted-foreground">
                      Issued by: {qual.issuedBy}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>Issued: {formatDate(qual.issuedDate)}</span>
                      {qual.expiryDate && (
                        <span>Expires: {formatDate(qual.expiryDate)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Experience */}
        {trainer.experience && trainer.experience.length > 0 && (
          <>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Experience
              </h3>
              <div className="space-y-3">
                {trainer.experience.map((exp, index) => (
                  <div
                    key={index}
                    className="p-4 bg-muted/50 rounded-lg space-y-2"
                  >
                    <p className="font-semibold">{exp.position}</p>
                    <p className="text-sm text-muted-foreground">
                      {exp.organization}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>
                        {formatDate(exp.startDate)} -{" "}
                        {exp.endDate ? formatDate(exp.endDate) : "Present"}
                      </span>
                    </div>
                    <p className="text-sm mt-2">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Availability */}
        {trainer.availability && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Availability
            </h3>
            <div className="space-y-3">
              {trainer.availability.days &&
                trainer.availability.days.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Days</p>
                    <div className="flex flex-wrap gap-2">
                      {trainer.availability.days.map((day) => (
                        <Badge
                          key={day}
                          variant="secondary"
                          className="capitalize"
                        >
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              {trainer.availability.timeSlots &&
                trainer.availability.timeSlots.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Time Slots
                    </p>
                    <div className="space-y-1">
                      {trainer.availability.timeSlots.map((slot, index) => (
                        <p key={index} className="text-sm">
                          {slot.start} - {slot.end}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <span className="font-medium">Created:</span>{" "}
            {formatDate(trainer.createdAt)}
          </div>
          <div>
            <span className="font-medium">Last Updated:</span>{" "}
            {formatDate(trainer.updatedAt)}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onEdit}>Edit Trainer</Button>
      </CardFooter>
    </Card>
  );
};
