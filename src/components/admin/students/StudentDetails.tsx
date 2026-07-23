"use client";
import React from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Student, Kit } from "@/types";
import { formatDate } from "@/utils/helpers";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  MapPin,
  User,
  Package,
  BarChart3,
  Clock,
  IndianRupee,
} from "lucide-react";

interface StudentDetailsProps {
  student: Student;
  onClose: () => void;
  onEdit: () => void;
  onEditKitStatus: (kit: Kit) => void;
}

export const StudentDetails: React.FC<StudentDetailsProps> = ({
  student,
  onClose,
  onEdit,
  onEditKitStatus,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-500 hover:bg-green-600";
      case "intermediate":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "advanced":
        return "bg-red-500 hover:bg-red-600";
      case "U12":
      case "U14":
      case "U16":
      case "U19":
      case "U23":
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const getFeeStatusBadgeColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500 hover:bg-green-600";
      case "pending":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "overdue":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const getKitStatusBadgeColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-500 hover:bg-green-600";
      case "processing":
        return "bg-blue-500 hover:bg-blue-600";
      case "requested":
        return "bg-yellow-500 hover:bg-yellow-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                {getInitials(student.user?.name || "Unknown")}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">
                {student.user?.name || "Unknown Student"}
              </CardTitle>
              <CardDescription className="flex items-center mt-1 gap-2">
                <Badge className={getLevelBadgeColor(student.level)}>
                  {student.level}
                </Badge>
                <Badge variant="outline">
                  {student.sport || "Unknown Sport"}
                </Badge>
                <span className="flex items-center">
                  {student.user?.isActive !== false ? (
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

      <CardContent>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="kits">Kits ({student.kits.length})</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <p className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      {student.user?.email || "No email provided"}
                    </p>
                  </div>
                  {student.user?.phone && (
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">
                        Phone
                      </span>
                      <p className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        {student.user.phone}
                      </p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">
                      Enrollment Date
                    </span>
                    <p className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      {formatDate(student.enrollmentDate)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Academy & Training
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">
                      Academy
                    </span>
                    <p className="font-medium">
                      {student.academy?.name || "No Academy"}
                    </p>
                    <p className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" />
                      {student.academy?.location || "Unknown Location"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">
                      Trainer
                    </span>
                    <p className="font-medium">
                      {student.trainer?.name || "Not assigned"}
                    </p>
                    {student.trainer && (
                      <p className="text-sm text-muted-foreground">
                        Sports:{" "}
                        {student.trainer.sports?.join(", ") ||
                          "No sports listed"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fee Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Fee Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">
                      Amount
                    </span>
                    <p className="text-lg font-semibold">
                      ${student.fees?.amount || 0}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {student.fees?.period || "monthly"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">
                      Status
                    </span>
                    <div>
                      <Badge
                        className={getFeeStatusBadgeColor(
                          student.fees?.status || "pending",
                        )}
                      >
                        {student.fees?.status || "pending"}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">
                      Due Date
                    </span>
                    <p className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      {student.fees?.dueDate
                        ? formatDate(student.fees.dueDate)
                        : "No due date"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kits" className="space-y-4">
            {student.kits.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-muted-foreground">
                    No kits requested yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {student.kits.map((kit) => (
                  <Card key={kit._id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-semibold">{kit.itemName}</h3>
                            <Badge
                              className={getKitStatusBadgeColor(kit.status)}
                            >
                              {kit.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Requested:{" "}
                              </span>
                              <span className="font-medium">
                                {formatDate(kit.requestedDate)}
                              </span>
                            </div>
                            {kit.deliveredDate && (
                              <div>
                                <span className="text-muted-foreground">
                                  Delivered:{" "}
                                </span>
                                <span className="font-medium">
                                  {formatDate(kit.deliveredDate)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditKitStatus(kit)}
                        >
                          Update Status
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            {student.attendance.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-muted-foreground">
                    No attendance records found.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {student.attendance.slice(0, 10).map((record) => (
                  <Card key={record._id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${record.present ? "bg-green-500" : "bg-red-500"}`}
                          />
                          <div>
                            <p className="font-medium">
                              {formatDate(record.date)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {record.present ? "Present" : "Absent"}
                            </p>
                          </div>
                        </div>
                        {record.notes && (
                          <p className="text-sm text-muted-foreground max-w-xs truncate">
                            {record.notes}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            {student.performance.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-muted-foreground">
                    No performance records found.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {student.performance.slice(0, 10).map((record) => (
                  <Card key={record._id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-semibold">{record.metric}</h3>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Value:{" "}
                              </span>
                              <span className="font-medium">
                                {record.value} {record.unit}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Date:{" "}
                              </span>
                              <span className="font-medium">
                                {formatDate(record.date)}
                              </span>
                            </div>
                          </div>
                          {record.notes && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">
                                Notes:{" "}
                              </span>
                              <span>{record.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onEdit}>Edit Student</Button>
      </CardFooter>
    </Card>
  );
};
