"use client";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, UserCheck } from "lucide-react";
import { ImportWizard } from "./ImportWizard";
import { ActivationDashboard } from "./ActivationDashboard";

/**
 * Bulk onboarding: the import wizard and the activation dashboard it feeds.
 *
 * They share a surface because they are two halves of one job. Importing 60
 * students is not the goal; 60 engaged parents is. Putting the activation view
 * one tab away from the import that created it keeps that visible.
 *
 * Extracted out of `views/admin/ImportPage` so the same thing can be mounted
 * inside the admin dashboard's tab strip AND served at its own URL. Owners who
 * live in the dashboard never find a standalone route, and owners sent a direct
 * link should not have to hunt through tabs.
 */
export function OnboardingCenter({ showHeader = true }: { showHeader?: boolean }) {
  return (
    <div className="space-y-5">
      {showHeader && (
        <header>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Add your students
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Get your whole roster in from a register photo, a WhatsApp list, or a
            spreadsheet. Only name, parent mobile number and sport are needed to
            start — everything else can be filled in later.
          </p>
        </header>
      )}

      <Tabs defaultValue="import" className="space-y-5">
        <TabsList className="h-auto justify-start gap-2 bg-slate-100">
          <TabsTrigger
            value="import"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import students
          </TabsTrigger>
          <TabsTrigger
            value="activation"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <UserCheck className="mr-2 h-4 w-4" />
            Parent activation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import">
          <ImportWizard />
        </TabsContent>

        <TabsContent value="activation">
          <ActivationDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default OnboardingCenter;
