import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Academy } from "@/services/academyService";
import { formatDate } from "@/utils/helpers";
import {
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Users,
  DollarSign,
  CheckCircle2,
  XCircle,
  Dumbbell,
} from "lucide-react";

interface AcademyDetailsProps {
  academy: Academy;
  onClose: () => void;
  onEdit: () => void;
}

export const AcademyDetails: React.FC<AcademyDetailsProps> = ({
  academy,
  onClose,
  onEdit,
}) => {
  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">{academy.name}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={academy.isActive ? "default" : "secondary"}>
                  {academy.isActive ? (
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {academy.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="outline" className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {academy.location}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contact">Contact & Hours</TabsTrigger>
            <TabsTrigger value="facilities">Facilities</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{academy.description}</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location & Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">City</span>
                    <p className="font-medium">{academy.location}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Full Address
                    </span>
                    <p className="text-sm">{academy.address}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Capacity & Sports
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Total Capacity
                    </span>
                    <p className="font-medium text-lg">
                      {academy.capacity} students
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground block mb-2">
                      Sports Offered
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {academy.sports.map((sport) => (
                        <Badge
                          key={sport}
                          variant="secondary"
                          className="capitalize"
                        >
                          {sport}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Images */}
            {academy.images && academy.images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {academy.images.map((image, index) => (
                      <div
                        key={index}
                        className="aspect-video bg-muted rounded-lg overflow-hidden"
                      >
                        <img
                          src={image}
                          alt={`${academy.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://via.placeholder.com/300x200?text=Academy+Image";
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Academy Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">
                    Created By
                  </span>
                  <p className="font-medium">
                    {academy.createdBy?.name || "Unknown"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {academy.createdBy?.email}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Created On
                  </span>
                  <p className="font-medium">{formatDate(academy.createdAt)}</p>
                  {academy.updatedAt !== academy.createdAt && (
                    <p className="text-sm text-muted-foreground">
                      Updated: {formatDate(academy.updatedAt)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact & Hours Tab */}
          <TabsContent value="contact" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Contact Person
                    </span>
                    <p className="font-medium">{academy.contactInfo.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Phone</span>
                    <p className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a
                        href={`tel:${academy.contactInfo.phone}`}
                        className="hover:underline"
                      >
                        {academy.contactInfo.phone}
                      </a>
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Email</span>
                    <p className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a
                        href={`mailto:${academy.contactInfo.email}`}
                        className="hover:underline"
                      >
                        {academy.contactInfo.email}
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Operating Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Opening Time
                    </span>
                    <p className="font-medium text-lg">
                      {academy.timings.opening}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Closing Time
                    </span>
                    <p className="font-medium text-lg">
                      {academy.timings.closing}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground block mb-2">
                      Working Days
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {academy.timings.workingDays.map((day) => (
                        <Badge
                          key={day}
                          variant="outline"
                          className="capitalize"
                        >
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Facilities Tab */}
          <TabsContent value="facilities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" />
                  Available Facilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {academy.facilities.map((facility, index) => (
                    <div
                      key={index}
                      className="flex items-center p-3 border rounded-lg bg-muted/50"
                    >
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="font-medium">{facility}</span>
                    </div>
                  ))}
                </div>
                {academy.facilities.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No facilities listed
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Fee Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border rounded-lg p-6 text-center">
                    <h3 className="text-sm text-muted-foreground mb-2">
                      Monthly
                    </h3>
                    <p className="text-3xl font-bold text-primary">
                      ${academy.fees.monthly}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      per month
                    </p>
                  </div>
                  <div className="border rounded-lg p-6 text-center bg-primary/5">
                    <h3 className="text-sm text-muted-foreground mb-2">
                      Quarterly
                    </h3>
                    <p className="text-3xl font-bold text-primary">
                      ${academy.fees.quarterly}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      per 3 months
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      Save $
                      {(
                        academy.fees.monthly * 3 -
                        academy.fees.quarterly
                      ).toFixed(2)}
                    </Badge>
                  </div>
                  <div className="border rounded-lg p-6 text-center">
                    <h3 className="text-sm text-muted-foreground mb-2">
                      Yearly
                    </h3>
                    <p className="text-3xl font-bold text-primary">
                      ${academy.fees.yearly}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      per year
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      Save $
                      {(
                        academy.fees.monthly * 12 -
                        academy.fees.yearly
                      ).toFixed(2)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardContent className="flex justify-end gap-2 border-t pt-6">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onEdit}>Edit Academy</Button>
      </CardContent>
    </Card>
  );
};
