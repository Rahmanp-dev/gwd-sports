"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImportWizard } from "@/components/admin/import/ImportWizard";
import { ActivationDashboard } from "@/components/admin/import/ActivationDashboard";

/**
 * Bulk onboarding: the import wizard and the activation dashboard it feeds.
 *
 * They share a page because they are two halves of one job. Importing 60 students
 * is not the goal; 60 engaged parents is. Putting the activation view one tab
 * away from the import that created it keeps that visible.
 */
export const ImportPage: React.FC = () => (
  <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <header className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">Add your students</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Get your whole roster in from a register photo, a WhatsApp list, or a spreadsheet. Only
        name, parent mobile number and sport are needed to start — everything else can be filled
        in later.
      </p>
    </header>

    <Tabs defaultValue="import">
      <TabsList>
        <TabsTrigger value="import">Import students</TabsTrigger>
        <TabsTrigger value="activation">Parent activation</TabsTrigger>
      </TabsList>

      <TabsContent value="import" className="mt-6">
        <ImportWizard />
      </TabsContent>

      <TabsContent value="activation" className="mt-6">
        <ActivationDashboard />
      </TabsContent>
    </Tabs>
  </div>
);

export default ImportPage;
