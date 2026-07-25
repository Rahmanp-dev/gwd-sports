"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2, PhoneCall, RefreshCw, Users } from "lucide-react";
import { importService, type ActivationData } from "@/services/importService";
import { toastUtils } from "@/utils/toast";

/**
 * The activation dashboard.
 *
 * Its purpose is to make the last 20% of onboarding actionable. Automation gets
 * most parents engaged; the owner's personal relationship closes the rest. So
 * this deliberately shows a CALL LIST of dormant parents by name and number, not
 * just an engagement percentage — a metric with no next action attached doesn't
 * get anyone activated.
 */
export const ActivationDashboard: React.FC = () => {
  const [data, setData] = useState<ActivationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await importService.getActivation();
      setData(response.data);
    } catch (error: any) {
      toastUtils.error("Could not load activation data", error?.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (isLoading && !data) {
    return (
      <div className="flex items-center gap-2 p-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading activation status…
      </div>
    );
  }

  if (!data) return null;

  const queuedWelcomes = data.welcomeMessages.pending + data.welcomeMessages.processing;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Parent activation</h2>
          <p className="text-sm text-muted-foreground">
            How many imported students have a parent who has actually opened their link.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/*
        Honest reporting of a metric that cannot be live yet. The engagement
        counter is wired to real data, but nothing drives parents to their links
        until Phase 2's welcome message exists — so saying "0% engaged" without
        this explanation would read as a broken feature rather than a pending one.
      */}
      {data.engagementMetricStatus === "awaiting_phase_2_delivery" && (
        <Card className="flex items-start gap-3 border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Engagement tracking is armed but not yet driven.</p>
            <p className="mt-1">
              {queuedWelcomes > 0 ? (
                <>
                  {queuedWelcomes} welcome message{queuedWelcomes === 1 ? "" : "s"} are queued and
                  will send once the WhatsApp engine is switched on.
                </>
              ) : (
                <>Welcome messages will queue here as students are imported.</>
              )}{" "}
              Until then this will read 0% engaged — the counter itself is working, parents just
              have not been sent their links yet.
            </p>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Students imported"
          value={data.students.total}
          detail={`${data.imports.studentsCreated} via bulk import`}
        />
        <StatCard
          label="Parents engaged"
          value={data.passports.engaged}
          detail={`of ${data.passports.total} passports`}
          tone="good"
        />
        <StatCard
          label="Still dormant"
          value={data.passports.dormant}
          detail="need a personal follow-up"
          tone={data.passports.dormant > 0 ? "warn" : undefined}
        />
        <StatCard
          label="No contact number"
          value={data.students.missingParentPhone}
          detail="cannot be reached at all"
          tone={data.students.missingParentPhone > 0 ? "bad" : undefined}
        />
      </div>

      <Card className="p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Activation rate</span>
          <span className="text-muted-foreground">
            {data.passports.engaged} / {data.passports.total} ({data.passports.engagementRate}%)
          </span>
        </div>
        <Progress value={data.passports.engagementRate} />
      </Card>

      {data.students.missingParentPhone > 0 && (
        <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-medium">
            {data.students.missingParentPhone} student
            {data.students.missingParentPhone === 1 ? " has" : "s have"} no parent mobile number.
          </p>
          <p className="mt-1">
            No message can reach them. Fix this first — it is the cheapest activation win
            available.
          </p>
        </Card>
      )}

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Follow-up list</h3>
            <p className="text-sm text-muted-foreground">
              Parents who have not opened their child&apos;s passport yet. Oldest first.
            </p>
          </div>
          {data.dormantParents.length > 0 && (
            <Badge variant="secondary">{data.dormantParents.length} to chase</Badge>
          )}
        </div>

        {data.dormantParents.length === 0 ? (
          <p className="mt-4 text-sm text-emerald-700">
            Every parent has opened their link. Nothing to chase.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-2">Student</th>
                  <th className="py-2">Parent</th>
                  <th className="py-2">Mobile</th>
                  <th className="py-2">Passport</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {data.dormantParents.map((parent) => (
                  <tr key={parent.passportId} className="border-t">
                    <td className="py-2 font-medium">{parent.studentName}</td>
                    <td className="py-2 text-muted-foreground">
                      {parent.parentName || "—"}
                    </td>
                    <td className="py-2 font-mono text-xs">{parent.parentPhone}</td>
                    <td className="py-2 font-mono text-xs text-muted-foreground">
                      {parent.passportId}
                    </td>
                    <td className="py-2 text-right">
                      {/*
                        A tel: link rather than an in-app action. The owner
                        phoning the parent from their own number is the point —
                        it is the relationship doing the work that automation
                        could not.
                      */}
                      <a href={`tel:${parent.parentPhone}`}>
                        <Button variant="ghost" size="sm">
                          <PhoneCall className="mr-1 h-3.5 w-3.5" />
                          Call
                        </Button>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  value: number;
  detail?: string;
  icon?: React.ReactNode;
  tone?: "good" | "warn" | "bad";
}> = ({ label, value, detail, icon, tone }) => {
  const toneClass =
    tone === "good"
      ? "text-emerald-600"
      : tone === "warn"
        ? "text-amber-600"
        : tone === "bad"
          ? "text-red-600"
          : "";

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className={`mt-2 text-3xl font-semibold ${toneClass}`}>{value}</p>
      {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
    </Card>
  );
};

export default ActivationDashboard;
