"use client";
import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/utils/constants";
import { useAppSelector } from "@/store";
import { AlertTriangle, CheckCircle2, ChevronRight, X } from "lucide-react";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * WHAT IS STILL STOPPING THIS ACADEMY FROM OPERATING
 * ════════════════════════════════════════════════════════════════════════════
 *
 * A freshly deployed academy is created with `fees: {monthly: 0, quarterly: 0,
 * halfYearly: 0, yearly: 0}`. `resolveAmountDue` requires a value ABOVE zero at
 * every tier and otherwise throws, so until somebody fills the fee schedule in,
 * every parent who tries to pay gets an error — and nothing anywhere told the
 * owner that. The first person to discover it would have been a customer.
 *
 * Same shape of problem for batches: attendance is per-batch, so a coach with
 * no batch sees an empty register and reports the feature as broken.
 *
 * So the checklist states the consequence, not the task. "Set your fees" is
 * ignorable; "parents cannot pay you" is not.
 *
 * It disappears completely once everything is done — a permanent checklist
 * becomes furniture, and furniture does not get read.
 * ════════════════════════════════════════════════════════════════════════════
 */

interface CheckItem {
  id: string;
  done: boolean;
  title: string;
  consequence: string;
  action: string;
}

export const SetupChecklist: React.FC<{ onNavigate?: (tab: string) => void }> = ({
  onNavigate,
}) => {
  const { user, token } = useAppSelector((s) => s.auth);
  const academyId = (user as any)?.academyId;

  const [items, setItems] = useState<CheckItem[] | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const load = useCallback(async () => {
    if (!academyId || !token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [academyRes, batchRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/academy/${academyId}`).catch(() => null),
        axios.get(`${API_BASE_URL}/academy/batches`, { headers }).catch(() => null),
      ]);

      const academy = academyRes?.data?.data?.academy;
      if (!academy) return;

      const fees = academy.fees ?? {};
      const anyFeeSet = ["monthly", "quarterly", "halfYearly", "yearly"].some(
        (k) => Number(fees[k]) > 0,
      );
      const batches = batchRes?.data?.data?.batches ?? batchRes?.data?.data ?? [];
      const theme = academy.theme ?? {};

      setItems([
        {
          id: "fees",
          done: anyFeeSet,
          title: "Set your fee structure",
          consequence:
            "Until at least one period has a price, parents trying to pay online get an error.",
          action: "branding",
        },
        {
          id: "batches",
          done: Array.isArray(batches) && batches.length > 0,
          title: "Create at least one batch",
          consequence:
            "Attendance is taken per batch. Coaches with no batch see an empty register.",
          action: "checkin",
        },
        {
          id: "branding",
          done: Boolean(theme.logoUrl) || Boolean(theme.tagline),
          title: "Add your logo and tagline",
          consequence:
            "Your public page currently shows platform defaults instead of your brand.",
          action: "branding",
        },
      ]);
    } catch {
      // A failed checklist must never block the dashboard behind it.
    }
  }, [academyId, token]);

  useEffect(() => {
    load();
  }, [load]);

  if (!items || dismissed) return null;

  const outstanding = items.filter((i) => !i.done);
  if (outstanding.length === 0) return null;

  const blocksPayment = outstanding.some((i) => i.id === "fees");

  return (
    <div
      className={`mb-6 rounded-2xl border p-5 ${
        blocksPayment
          ? "border-amber-300 bg-amber-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertTriangle
            className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
              blocksPayment ? "text-amber-600" : "text-slate-400"
            }`}
          />
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {outstanding.length} thing{outstanding.length > 1 ? "s" : ""} left
              before your academy is ready
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {blocksPayment
                ? "One of these stops parents paying you today."
                : "None of these are urgent, but they affect what families see."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-full p-1 text-slate-400 transition-colors hover:bg-white hover:text-slate-600"
          aria-label="Hide checklist"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={`flex items-start gap-3 rounded-xl border bg-white px-3 py-2.5 ${
              item.done ? "border-slate-100 opacity-60" : "border-slate-200"
            }`}
          >
            {item.done ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
            ) : (
              <span className="mt-1 h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 border-slate-300" />
            )}
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-semibold ${
                  item.done ? "text-slate-400 line-through" : "text-slate-800"
                }`}
              >
                {item.title}
              </p>
              {!item.done && (
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                  {item.consequence}
                </p>
              )}
            </div>
            {!item.done && onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate(item.action)}
                className="flex flex-shrink-0 items-center gap-0.5 self-center rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
              >
                Fix <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SetupChecklist;
