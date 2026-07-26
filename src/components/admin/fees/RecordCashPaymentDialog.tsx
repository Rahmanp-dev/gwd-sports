"use client";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Banknote, Loader2 } from "lucide-react";
import { recordOfflinePayment } from "@/services/paymentService";
import { toastUtils } from "@/utils/toast";

/**
 * "The parent handed me cash — mark them paid."
 *
 * The backend for this (`lib/payments/offline.ts`) has existed and been correct
 * for a while: tenant-scoped, idempotent-ish, and careful to record a ZERO
 * gateway/platform split because off-platform money never touched Razorpay and
 * booking a notional fee would corrupt reconciliation. What was missing was any
 * way to reach it — no screen in the app called it. This is that screen.
 *
 * Deliberately not a full ledger editor: amount, period, optional reference.
 * An academy taking cash needs to clear a due in ten seconds on a phone.
 */

export interface CashPaymentTarget {
  /** The student's USER id — not their StudentProfile id. */
  userId: string;
  name: string;
  outstanding?: number;
}

const PERIODS = ["monthly", "quarterly", "yearly"] as const;

export const RecordCashPaymentDialog: React.FC<{
  target: CashPaymentTarget | null;
  onClose: () => void;
  onRecorded?: () => void;
}> = ({ target, onClose, onRecorded }) => {
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("monthly");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Pre-fill with what they owe — the overwhelmingly common case is clearing
  // the full outstanding balance, and retyping it invites a typo.
  useEffect(() => {
    if (target) {
      setAmount(target.outstanding ? String(target.outstanding) : "");
      setPeriod("monthly");
      setReference("");
      setNote("");
    }
  }, [target]);

  const parsedAmount = parseFloat(amount);
  const validAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;

  const submit = async () => {
    if (!target || !validAmount) return;
    setSaving(true);
    try {
      const res = await recordOfflinePayment({
        studentUserId: target.userId,
        amount: parsedAmount,
        period,
        transactionId: reference.trim() || undefined,
        note: note.trim() || undefined,
      });
      if (res?.success) {
        toastUtils.success(
          "Payment recorded",
          `₹${parsedAmount.toLocaleString("en-IN")} marked as received from ${target.name}.`,
        );
        onRecorded?.();
        onClose();
      } else {
        toastUtils.error("Could not record payment", res?.message || "Please try again.");
      }
    } catch (e: any) {
      toastUtils.error(
        "Could not record payment",
        e?.response?.data?.message || "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-emerald-600" />
            Record a cash payment
          </DialogTitle>
          <DialogDescription>
            For money received outside the app — cash, direct UPI or a bank
            transfer. This updates {target?.name ?? "the student"}&apos;s ledger;
            no payment is taken now.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {typeof target?.outstanding === "number" && target.outstanding > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Currently outstanding:{" "}
              <span className="font-bold">
                ₹{target.outstanding.toLocaleString("en-IN")}
              </span>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Amount received (₹)
            </label>
            <Input
              type="number"
              min="1"
              inputMode="decimal"
              value={amount}
              disabled={saving}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
              autoFocus
            />
            {amount !== "" && !validAmount && (
              <p className="mt-1 text-xs text-red-600">
                Enter an amount greater than zero.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Covers which period
            </label>
            <div className="flex gap-2">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={saving}
                  onClick={() => setPeriod(p)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition-colors ${
                    period === p
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Reference <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <Input
              value={reference}
              disabled={saving}
              onChange={(e) => setReference(e.target.value)}
              placeholder="UPI ref, receipt book no."
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Note <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <Input
              value={note}
              disabled={saving}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Paid in cash at the ground"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || !validAmount}>
            {saving ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Recording…
              </>
            ) : (
              "Mark as paid"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecordCashPaymentDialog;
