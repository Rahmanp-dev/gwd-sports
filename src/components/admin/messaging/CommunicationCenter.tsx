"use client";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Bell, Megaphone, MessageSquare } from "lucide-react";
import { useAppSelector } from "@/store";
import { AlertFeed } from "./AlertFeed";
import { MessageLog } from "./MessageLog";
import { MessagingHealth } from "./MessagingHealth";
import { BroadcastComposer } from "./BroadcastComposer";

/**
 * Everything the communication engine exposes to a human, in one place.
 *
 * The four views answer four different questions and are ordered by how often
 * an owner asks them:
 *
 *   Alerts     — what does the platform need me to decide?
 *   Message Log — what did it actually do, and why not?
 *   Announcement — say something to everyone
 *   Delivery Status — can anything reach a parent at all right now?
 *
 * They are sub-tabs of one dashboard tab rather than four top-level tabs
 * because an owner chasing an overdue fee moves between the first two
 * constantly, and the tab strip is already ten entries wide.
 */
export function CommunicationCenter() {
  const { user } = useAppSelector((s) => s.auth);
  const isSuperAdmin = (user?.role as string) === "gwd_super_admin";

  // A broadcast is sent on behalf of ONE academy, and a super admin is not
  // attached to one. Rather than show a tab that returns 403, it is hidden —
  // a platform-wide message to every parent of every tenant is not a feature
  // anyone asked for, and should not fall out of a role check.
  return (
    <Tabs defaultValue="alerts" className="space-y-5">
      <TabsList className="h-auto justify-start gap-2 overflow-x-auto bg-slate-100">
        <TabsTrigger
          value="alerts"
          className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          <Bell className="mr-2 h-4 w-4" />
          Alerts
        </TabsTrigger>
        <TabsTrigger
          value="log"
          className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Message Log
        </TabsTrigger>
        {!isSuperAdmin && (
          <TabsTrigger
            value="broadcast"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Megaphone className="mr-2 h-4 w-4" />
            Announcement
          </TabsTrigger>
        )}
        <TabsTrigger
          value="health"
          className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          <Activity className="mr-2 h-4 w-4" />
          Delivery Status
        </TabsTrigger>
      </TabsList>

      <TabsContent value="alerts">
        <AlertFeed />
      </TabsContent>

      <TabsContent value="log">
        <MessageLog />
      </TabsContent>

      {!isSuperAdmin && (
        <TabsContent value="broadcast">
          <BroadcastComposer />
        </TabsContent>
      )}

      <TabsContent value="health">
        <MessagingHealth />
      </TabsContent>
    </Tabs>
  );
}

export default CommunicationCenter;
