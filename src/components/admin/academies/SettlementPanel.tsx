"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Landmark,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import apiService from "@/services/apiService";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * SETTLEMENT — pointing an academy's money at their own bank
 * ════════════════════════════════════════════════════════════════════════════
 *
 * This is the screen that decides where real money goes, so it is the most
 * consequential control in the platform and is built accordingly.
 *
 * HOW THE PLUMBING ACTUALLY WORKS (see lib/payments/settlement.ts):
 *
 *   · An academy with a Razorpay Route linked account id (`acc_…`) settles
 *     AUTOMATICALLY. `createOrder` puts a `transfers[]` array on the order and
 *     Razorpay splits at capture — the academy's share lands in their account,
 *     GWD's stays in ours. Nobody has to remember to pay anyone.
 *
 *   · An academy WITHOUT one falls back to `collect_and_manual_payout`. That is
 *     not "Route off" — it means every rupee settles into GWD's account and GWD
 *     now owes the academy money that a human has to transfer. The obligation
 *     is recorded correctly; discharging it is not automated.
 *
 * WHY THIS SCREEN EXISTS. Both halves were already implemented and correct, but
 * `rzp_account` could only be set by writing to the database. So the difference
 * between "the academy is paid automatically" and "GWD is quietly accruing a
 * debt to them" came down to whether someone remembered a manual step, with
 * nothing on any screen showing which state an academy was in.
 *
 * `rzp_account` is deliberately absent from OWNER_WRITABLE in
 * lib/academy/updateGuard.ts — an academy owner must never be able to point
 * settlement somewhere. Only a platform admin reaches this panel.
 * ════════════════════════════════════════════════════════════════════════════
 */

/** Razorpay linked-account ids look like `acc_MnO1p2Q3r4S5t6`. */
const ACC_ID = /^acc_[A-Za-z0-9]{10,}$/;

export interface SettlementAcademy {
  _id: string;
  name: string;
  rzp_account?: string | null;
  settlementStrategy?: string | null;
  platformFeePercent?: number | null;
}

export function SettlementPanel({
  academy,
  onSaved,
}: {
  academy: SettlementAcademy | null;
  onSaved?: () => void;
}) {
  const [account, setAccount] = useState("");
  const [strategy, setStrategy] = useState("");
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setAccount(academy?.rzp_account ?? "");
    setStrategy(academy?.settlementStrategy ?? "");
    setTouched(false);
  }, [academy]);

  if (!academy) return null;

  const trimmed = account.trim();
  const accountValid = trimmed === "" || ACC_ID.test(trimmed);

  /**
   * What will ACTUALLY happen, computed with the same precedence as
   * resolveSettlementStrategy() on the server — explicit strategy wins, then a
   * linked account implies Route, else collect-and-payout. Shown live so the
   * admin sees the consequence of what they typed before they save it.
   */
  const effective =
    strategy === "razorpay_route_auto_split"
      ? trimmed
        ? "auto"
        : "broken"
      : strategy === "collect_and_manual_payout"
        ? "manual"
        : trimmed
          ? "auto"
          : "manual";

  const save = async () => {
    if (!accountValid) {
      toast.error("That is not a Razorpay linked-account id.");
      return;
    }
    setSaving(true);
    try {
      const res: any = await apiService.put(`/academy/${academy._id}`, {
        // Empty string clears it — `null` would be rejected by the schema path.
        rzp_account: trimmed,
        ...(strategy ? { settlementStrategy: strategy } : {}),
      });
      if (res?.success) {
        toast.success("Settlement updated", {
          description:
            effective === "auto"
              ? "New payments will split to the academy automatically."
              : "New payments will collect to GWD and need a manual payout.",
        });
        setTouched(false);
        onSaved?.();
      } else {
        toast.error(res?.message || "Could not save.");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="flex items-start gap-3">
        <Landmark className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-700" />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-900">
            Settlement — {academy.name}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Where this academy&rsquo;s share of every payment goes.
          </p>
        </div>
      </div>

      {/* ── Live consequence, before saving ────────────────────────────── */}
      <div
        className={`mt-5 flex items-start gap-2.5 rounded-xl px-4 py-3 ring-1 ${
          effective === "auto"
            ? "bg-emerald-50 ring-emerald-200"
            : effective === "broken"
              ? "bg-red-50 ring-red-200"
              : "bg-amber-50 ring-amber-200"
        }`}
      >
        {effective === "auto" ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
        ) : effective === "broken" ? (
          <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
        ) : (
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
        )}
        <div className="min-w-0 text-xs leading-relaxed">
          {effective === "auto" && (
            <>
              <p className="font-bold text-emerald-800">
                Automatic — Razorpay Route
              </p>
              <p className="mt-0.5 text-emerald-700">
                Every payment splits at capture. The academy&rsquo;s share goes
                straight to their linked account; GWD&rsquo;s stays in ours. No
                manual step, no accruing liability.
              </p>
            </>
          )}
          {effective === "manual" && (
            <>
              <p className="font-bold text-amber-800">Manual payout required</p>
              <p className="mt-0.5 text-amber-700">
                Every rupee settles into the GWD account and{" "}
                <strong>GWD then owes this academy their share</strong>. The
                obligation is recorded on each payment, but transferring it is a
                human job. Link a Route account to make this automatic.
              </p>
            </>
          )}
          {effective === "broken" && (
            <>
              <p className="font-bold text-red-800">
                Route selected, but no account linked
              </p>
              <p className="mt-0.5 text-red-700">
                Payments will collect to GWD and the academy will have to be
                paid by hand — which is not what this setting says. Either paste
                the linked-account id or switch the strategy to manual, so the
                setting matches reality.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-slate-700">Razorpay linked account id</Label>
          <Input
            value={account}
            onChange={(e) => {
              setAccount(e.target.value);
              setTouched(true);
            }}
            placeholder="acc_MnO1p2Q3r4S5t6"
            className={`font-mono ${!accountValid ? "border-red-400" : ""}`}
            spellCheck={false}
            autoComplete="off"
          />
          {!accountValid ? (
            <p className="text-[11px] font-medium text-red-600">
              Expected a Razorpay linked-account id starting <code>acc_</code>.
              A bank account number does not go here.
            </p>
          ) : (
            <p className="text-[11px] leading-relaxed text-slate-500">
              Created in the Razorpay dashboard under{" "}
              <span className="font-medium">Route → Linked Accounts</span>. The
              academy&rsquo;s bank details live on Razorpay&rsquo;s side, not
              here — we only store the id that points at them.{" "}
              <a
                href="https://dashboard.razorpay.com/app/route/accounts"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 font-medium text-blue-600 hover:underline"
              >
                Open Razorpay
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-slate-700">Strategy</Label>
          <select
            value={strategy}
            onChange={(e) => {
              setStrategy(e.target.value);
              setTouched(true);
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Automatic (decide from the linked account)</option>
            <option value="razorpay_route_auto_split">
              Force Route auto-split
            </option>
            <option value="collect_and_manual_payout">
              Force collect &amp; manual payout
            </option>
          </select>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Leave on automatic unless there is a reason. Forcing manual is the
            correct choice for an academy that cannot use Route — that decision
            is a legal one, not a technical one.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button onClick={save} disabled={saving || !touched || !accountValid}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save settlement
          </Button>
          {touched && (
            <span className="text-xs text-slate-400">Unsaved changes</span>
          )}
        </div>

        <p className="border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-400">
          Changing this affects <strong>new payments only</strong>. Orders
          already created carry the strategy they were built with, which is
          deliberate — a payment must settle the way it was described when the
          parent authorised it.
        </p>
      </div>
    </div>
  );
}

export default SettlementPanel;
