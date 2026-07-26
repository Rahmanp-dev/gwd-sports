"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "@/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, IndianRupee, Loader2, RotateCcw, Save } from "lucide-react";
import { academyService, type Academy, type AcademyFees } from "@/services/academyService";
import { toastUtils } from "@/utils/toast";
import {
  AcademyBrandingEditor,
  draftFromAcademy,
  draftToThemeUpdate,
  defaultBrandingDraft,
  type BrandingDraft,
} from "./AcademyBrandingEditor";

/**
 * The academy owner's branding screen.
 *
 * All this adds on top of AcademyBrandingEditor is load, dirty-tracking and
 * save — deliberately thin, because the editing experience itself has to be
 * identical to the one a super admin sees while onboarding the academy. When
 * those were two separate components they drifted until they disagreed about
 * who owned the tagline.
 *
 * Fees live here rather than in the editor: they are not branding, but they
 * were on the screen this replaces and moving them elsewhere would be a
 * regression for owners who know where to find them.
 */

const EMPTY_FEES: AcademyFees = { monthly: 0, quarterly: 0, halfYearly: 0, yearly: 0 };

export const AcademyBrandingPanel: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const academyId = (user as any)?.academyId;

  const [academy, setAcademy] = useState<Academy | null>(null);
  const [draft, setDraft] = useState<BrandingDraft>(defaultBrandingDraft());
  const [savedDraft, setSavedDraft] = useState<BrandingDraft | null>(null);
  const [fees, setFees] = useState<AcademyFees>(EMPTY_FEES);
  const [savedFees, setSavedFees] = useState<AcademyFees>(EMPTY_FEES);
  const [dueDay, setDueDay] = useState<number>(5);
  const [savedDueDay, setSavedDueDay] = useState<number>(5);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  const load = useCallback(async () => {
    if (!academyId) {
      setLoading(false);
      setError("Your account is not linked to an academy.");
      return;
    }
    setLoading(true);
    try {
      const res = await academyService.getAcademyById(academyId);
      const found = res?.data?.academy;
      if (found) {
        setAcademy(found);
        const next = draftFromAcademy(found);
        setDraft(next);
        setSavedDraft(next);
        const nextFees = { ...EMPTY_FEES, ...(found.fees ?? {}) };
        const nextDue = Number((found.fees as any)?.dueDayOfMonth) || 5;
        setDueDay(nextDue);
        setSavedDueDay(nextDue);
        setFees(nextFees);
        setSavedFees(nextFees);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Could not load your branding.");
    } finally {
      setLoading(false);
    }
  }, [academyId]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty =
    savedDraft !== null &&
    (JSON.stringify(savedDraft) !== JSON.stringify(draft) ||
      JSON.stringify(savedFees) !== JSON.stringify(fees) ||
      savedDueDay !== dueDay);

  const save = async () => {
    if (!academyId) return;
    setSaving(true);
    setError("");
    try {
      await academyService.updateAcademy(
        academyId,
        {
          ...draftToThemeUpdate(draft),
          "fees.monthly": fees.monthly,
          "fees.quarterly": fees.quarterly,
          "fees.halfYearly": fees.halfYearly,
          "fees.yearly": fees.yearly,
          "fees.dueDayOfMonth": dueDay,
        } as any,
      );
      setSavedDraft(draft);
      setSavedFees(fees);
      setSavedDueDay(dueDay);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
      toastUtils.success("Saved", "Your homepage has been updated.");
    } catch (e: any) {
      const message = e?.response?.data?.message || "Could not save your changes.";
      setError(message);
      toastUtils.error("Save failed", message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!academyId) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-8 text-center text-slate-500">
          Your account is not linked to an academy, so there is no branding to edit.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Look &amp; feel
          </h2>
          <p className="text-sm text-slate-500">
            How your public page appears to parents. Changes preview instantly and
            go live when you save.
          </p>
        </div>
        <div className="flex gap-2">
          {dirty && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (savedDraft) setDraft(savedDraft);
                setFees(savedFees);
                setDueDay(savedDueDay);
              }}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Discard
            </Button>
          )}
          <Button size="sm" onClick={save} disabled={saving || !dirty}>
            {saving ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : justSaved ? (
              <Check className="mr-1.5 h-3.5 w-3.5" />
            ) : (
              <Save className="mr-1.5 h-3.5 w-3.5" />
            )}
            {justSaved ? "Saved" : "Save & publish"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <AcademyBrandingEditor
        value={draft}
        onChange={setDraft}
        academyName={academy?.name || "Your Academy"}
        sports={academy?.sports ?? []}
        disabled={saving}
      />

      {/* Fees — not branding, but this is where owners already look for them. */}
      <Card className="border-0 shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <IndianRupee className="h-3 w-3" />
              Fee structure
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              What a parent is charged for each billing period. A period left at
              0 cannot be paid online — set the ones you actually offer.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["monthly", "Monthly"],
                ["quarterly", "Quarterly"],
                ["halfYearly", "Half-yearly"],
                ["yearly", "Yearly"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {label} (₹)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={fees[key]}
                  disabled={saving}
                  onChange={(e) =>
                    setFees({ ...fees, [key]: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            ))}
          </div>

          {/**
           * The day the reminder cadence pivots on.
           *
           * Reminders fire five days before this date, on it, and three days
           * after. It was hardcoded to the 5th for every academy on the
           * platform with no way to change it, so an academy that collects on
           * the 1st was chasing its parents four days late every month.
           */}
          <div className="border-t border-slate-100 pt-4">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Fees due on day
            </label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                max={28}
                value={dueDay}
                disabled={saving}
                onChange={(e) => setDueDay(Number(e.target.value) || 1)}
                className="w-24"
              />
              <p className="text-[11px] leading-relaxed text-slate-400">
                of each month. Parents are reminded 5 days before, on the day,
                and 3 days after. Maximum 28, so the date exists in every month.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcademyBrandingPanel;
