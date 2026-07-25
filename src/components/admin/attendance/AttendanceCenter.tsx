"use client";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarClock, QrCode } from "lucide-react";
import { BatchManagement } from "./BatchManagement";
import { BatchQrCodes } from "./BatchQrCodes";

/**
 * Schedules and check-in codes, one tab apart.
 *
 * They belong together because one determines the other: a code's window is
 * computed entirely from its batch's days and times, so an owner printing a
 * poster needs the schedule to be right first. Schedule leads, because it is
 * the step people skip — the import creates batches without one, and a code
 * printed for an unscheduled batch is accepted almost any hour of any day.
 */
export function AttendanceCenter() {
  return (
    <Tabs defaultValue="schedule" className="space-y-5">
      <TabsList className="h-auto justify-start gap-2 bg-slate-100">
        <TabsTrigger
          value="schedule"
          className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          <CalendarClock className="mr-2 h-4 w-4" />
          Batches &amp; schedule
        </TabsTrigger>
        <TabsTrigger
          value="codes"
          className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          <QrCode className="mr-2 h-4 w-4" />
          Check-in codes
        </TabsTrigger>
      </TabsList>

      <TabsContent value="schedule">
        <BatchManagement />
      </TabsContent>

      <TabsContent value="codes">
        <BatchQrCodes />
      </TabsContent>
    </Tabs>
  );
}

export default AttendanceCenter;
