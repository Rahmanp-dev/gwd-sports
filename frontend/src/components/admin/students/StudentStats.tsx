import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  GraduationCap,
  Trophy,
  DollarSign,
} from "lucide-react";

interface StudentStatsProps {
  stats: any;
  isLoading: boolean;
}

export const StudentStats: React.FC<StudentStatsProps> = ({
  stats,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No statistics available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">
                Total Students
              </span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-3xl font-bold">
              {stats.totalStudents || 0}
            </span>
            <span className="text-green-600 text-sm mt-2 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              Active system-wide
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">
                Enrolled Students
              </span>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-3xl font-bold">
              {stats.enrolledStudents || 0}
            </span>
            <span className="text-blue-600 text-sm mt-2">In academies</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">Unenrolled</span>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-3xl font-bold">
              {stats.unenrolledStudents || 0}
            </span>
            <span className="text-orange-600 text-sm mt-2">
              Awaiting enrollment
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">
                Avg. Fees Paid
              </span>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-3xl font-bold">
              ${stats.studentsByLevel?.[0]?.averageFeesPaid?.toFixed(0) || 0}
            </span>
            <span className="text-green-600 text-sm mt-2">Per student</span>
          </CardContent>
        </Card>
      </div>

      {/* Students by Level */}
      {stats.studentsByLevel && stats.studentsByLevel.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Students by Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.studentsByLevel.map((level: any) => (
                <div
                  key={level._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium capitalize">{level._id}</p>
                    <p className="text-sm text-muted-foreground">
                      Avg. Fees: ${level.averageFeesPaid?.toFixed(0) || 0}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {level.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
