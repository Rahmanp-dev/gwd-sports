"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/utils/constants";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Loader2,
  Lock,
  ShieldCheck,
  XCircle,
} from "lucide-react";

/**
 * The page behind "Pay here:" in every fee reminder.
 *
 * No login — see the API route for why that is safe. The parent arrives from a
 * WhatsApp message on a phone, and any step between arriving and paying is a
 * step where they stop. So: amount, breakdown, one button.
 *
 * The itemised breakdown is not optional. A parent who sees a total larger than
 * the fee their academy quoted, with no explanation, does not pay — they phone
 * the academy, and the academy phones us.
 */

interface AmountDue {
  academyFee: number;
  convenienceFee: number;
  total: number;
  totalFormatted: string;
}

interface FeeState {
  passportId: string;
  studentName: string;
  academyName: string | null;
  period?: string;
  amountDue: AmountDue | null;
  message?: string;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

/** Loads the checkout SDK on demand rather than on every page in the app. */
function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function PayPage({ passportId }: { passportId: string }) {
  const [fee, setFee] = useState<FeeState | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [paid, setPaid] = useState(false);
  // Set once the payment is confirmed server-side; drives the receipt link.
  const [receiptId, setReceiptId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/passport/${passportId}/pay`);
      if (res.data?.success) setFee(res.data.data);
      else setError(res.data?.message || "Could not load the fee");
    } catch (e: any) {
      setError(e.response?.data?.message || "Could not load the fee");
    } finally {
      setLoading(false);
    }
  }, [passportId]);

  useEffect(() => {
    load();
  }, [load]);

  const pay = async () => {
    setPaying(true);
    setError("");
    try {
      const sdkReady = await loadRazorpay();
      if (!sdkReady) {
        setError("Could not reach the payment provider. Check your connection.");
        return;
      }

      const res = await axios.post(`${API_BASE_URL}/passport/${passportId}/pay`);
      if (!res.data?.success) {
        setError(res.data?.message || "Could not start the payment");
        return;
      }

      const { order, key_id, studentName } = res.data.data;

      const checkout = new window.Razorpay({
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: fee?.academyName || "GWD Sports",
        description: `Fees — ${studentName}`,
        order_id: order.id,
        /**
         * Confirm immediately, AND let the webhook confirm independently.
         *
         * The webhook remains the authoritative path — a parent who loses
         * signal here or closes the tab is still recorded as paid. But relying
         * on it ALONE meant that wherever the webhook cannot reach the server
         * (local development, an environment where it is not configured, or
         * simply the delay before delivery) a completed payment sat `pending`
         * forever: no receipt number, no invoice, and an admin dashboard
         * showing the parent as unpaid after they had paid.
         *
         * Both paths funnel through the same idempotent `settlePayment()`, so
         * whichever arrives second is a no-op.
         */
        handler: async (response: any) => {
          setPaid(true);
          try {
            const confirmed = await axios.post(
              `${API_BASE_URL}/passport/${passportId}/pay/verify`,
              {
                razorpay_order_id: response?.razorpay_order_id,
                razorpay_payment_id: response?.razorpay_payment_id,
                razorpay_signature: response?.razorpay_signature,
              },
            );
            setReceiptId(confirmed.data?.data?.feePaymentId ?? null);
          } catch {
            // Already shown as paid, and it is — the money moved. The webhook
            // will reconcile. Telling the parent something went wrong here
            // would be false and would invite a second payment.
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
        theme: { color: "#0f172a" },
      });

      checkout.on("payment.failed", (response: any) => {
        setError(
          response?.error?.description ||
            "The payment did not go through. Nothing has been charged.",
        );
        setPaying(false);
      });

      checkout.open();
    } catch (e: any) {
      setError(e.response?.data?.message || "Could not start the payment");
    } finally {
      setPaying(false);
    }
  };

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {children}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      </Shell>
    );
  }

  if (paid) {
    return (
      <Shell>
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
          <h1 className="text-xl font-extrabold text-slate-900">Payment received</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            Thank you. {fee?.academyName ?? "The academy"} has been notified.
          </p>

          {/* Only offered once the server has confirmed — a receipt link that
              404s because settlement has not landed yet is worse than none. */}
          {receiptId && (
            <a
              href={`/receipt/${receiptId}`}
              className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
            >
              View receipt
            </a>
          )}

          <a
            href={`/passport/${passportId}`}
            className="mt-4 block text-sm font-semibold text-slate-900 underline"
          >
            View {fee?.studentName?.split(" ")[0] ?? "the"} Sports Passport
          </a>
        </div>
      </Shell>
    );
  }

  if (!fee) {
    return (
      <Shell>
        <div className="text-center">
          <XCircle className="mx-auto mb-3 h-10 w-10 text-red-400" />
          <h1 className="text-lg font-bold text-slate-900">Can't load this</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{error}</p>
          <p className="mt-3 font-mono text-xs text-slate-400">{passportId}</p>
        </div>
      </Shell>
    );
  }

  if (!fee.amountDue) {
    return (
      <Shell>
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-3 h-11 w-11 text-emerald-500" />
          <h1 className="text-lg font-bold text-slate-900">Nothing due</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            {fee.studentName} has no outstanding fees right now.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {fee.academyName ?? "Academy fees"}
        </p>
        <h1 className="mt-1 text-lg font-bold text-slate-900">
          Fees for {fee.studentName}
        </h1>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Academy fee</span>
          <span className="font-medium text-slate-800">
            ₹{fee.amountDue.academyFee.toLocaleString("en-IN")}
          </span>
        </div>
        {fee.amountDue.convenienceFee > 0 && (
          <div className="mt-1.5 flex justify-between text-sm">
            <span className="text-slate-500">Convenience fee</span>
            <span className="font-medium text-slate-800">
              ₹{fee.amountDue.convenienceFee.toLocaleString("en-IN")}
            </span>
          </div>
        )}
        <div className="mt-3 flex items-baseline justify-between border-t border-slate-200 pt-3">
          <span className="text-sm font-semibold text-slate-700">Total</span>
          <span className="text-2xl font-extrabold tracking-tight text-slate-900">
            {fee.amountDue.totalFormatted}
          </span>
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700">
          {error}
        </p>
      )}

      <Button
        onClick={pay}
        disabled={paying}
        className="mt-4 h-13 w-full bg-slate-900 py-6 text-base font-bold hover:bg-slate-800"
      >
        {paying ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <Lock className="mr-2 h-4 w-4" />
        )}
        Pay {fee.amountDue.totalFormatted}
      </Button>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
        <ShieldCheck className="h-3 w-3" />
        Secured by Razorpay. GWD never sees your card details.
      </p>
    </Shell>
  );
}

export default PayPage;
