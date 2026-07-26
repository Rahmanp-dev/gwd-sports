"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/utils/constants";
import { useAppSelector } from "@/store";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Printer } from "lucide-react";

/**
 * The printable payment receipt.
 *
 * Deliberately plain. A parent forwards this to an employer for reimbursement,
 * so it has to survive being printed in black and white on someone else's
 * printer — no gradients, no background fills behind text, no colour carrying
 * meaning on its own.
 *
 * It is labelled a receipt, not a tax invoice, and says why. The API route
 * carries the full reasoning: one payment is two supplies by two parties, and
 * neither party's tax registration is held in this system.
 */

interface Line {
  label: string;
  sublabel: string | null;
  suppliedBy: string;
  amount: number;
  amountFormatted: string;
}

interface Receipt {
  receiptNumber: string | null;
  issuedAt: string;
  paidAt: string;
  payer: {
    name: string;
    email: string | null;
    parentName: string | null;
    passportId: string | null;
  };
  academy: {
    name: string;
    address: string | null;
    location: string | null;
    phone: string | null;
    email: string | null;
  };
  lines: Line[];
  total: number;
  totalFormatted: string;
  payment: { method: string; reference: string; status: string };
  refunded: { amount: number; amountFormatted: string } | null;
}

function longDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export function ReceiptPage({ paymentId }: { paymentId: string }) {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { token } = useAppSelector((s) => s.auth);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/payments/receipt/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) setReceipt(res.data.data);
      else setError(res.data?.message || "Could not load this receipt");
    } catch (e: any) {
      setError(e.response?.data?.message || "Could not load this receipt");
    } finally {
      setLoading(false);
    }
  }, [paymentId, token]);

  useEffect(() => {
    if (token) load();
    else setLoading(false);
  }, [token, load]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <AlertTriangle className="mx-auto mb-3 h-9 w-9 text-amber-400" />
          <p className="text-sm text-slate-600">
            {error || "You need to sign in to view this receipt."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 print:bg-white print:p-0">
      {/* Hidden when printing — the paper copy should be the document alone. */}
      <div className="mx-auto mb-4 flex max-w-2xl justify-end print:hidden">
        <Button onClick={() => window.print()} size="sm">
          <Printer className="mr-2 h-4 w-4" /> Print or save as PDF
        </Button>
      </div>

      <div className="mx-auto max-w-2xl bg-white p-8 shadow-sm print:max-w-none print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {receipt.academy.name}
            </h1>
            {receipt.academy.address && (
              <p className="mt-0.5 text-xs text-slate-500">{receipt.academy.address}</p>
            )}
            {receipt.academy.location && (
              <p className="text-xs text-slate-500">{receipt.academy.location}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              {[receipt.academy.phone, receipt.academy.email].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Payment Receipt
            </p>
            <p className="mt-1 font-mono text-sm font-bold text-slate-900">
              {receipt.receiptNumber ?? "—"}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{longDate(receipt.issuedAt)}</p>
          </div>
        </div>

        <div className="grid gap-6 py-5 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Received from
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {receipt.payer.name}
            </p>
            {receipt.payer.parentName && (
              <p className="text-xs text-slate-500">
                Parent: {receipt.payer.parentName}
              </p>
            )}
            {receipt.payer.passportId && (
              <p className="font-mono text-xs text-slate-500">
                {receipt.payer.passportId}
              </p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Paid on
            </p>
            <p className="mt-1 text-sm text-slate-700">{longDate(receipt.paidAt)}</p>
            <p className="text-xs text-slate-500">{receipt.payment.method}</p>
            <p className="break-all font-mono text-[10px] text-slate-400">
              {receipt.payment.reference}
            </p>
          </div>
        </div>

        {/* Both supplies named. See the API route for why they are separate. */}
        <table className="w-full border-t border-slate-200 text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-widest text-slate-400">
              <th className="py-2 font-semibold">Description</th>
              <th className="py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {receipt.lines.map((line, index) => (
              <tr key={index} className="border-t border-slate-100">
                <td className="py-3 pr-4">
                  <p className="font-medium text-slate-800">{line.label}</p>
                  {line.sublabel && (
                    <p className="text-xs text-slate-500">{line.sublabel}</p>
                  )}
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Supplied by {line.suppliedBy}
                  </p>
                </td>
                <td className="py-3 text-right align-top font-medium text-slate-800">
                  {line.amountFormatted}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300">
              <td className="py-3 text-sm font-bold text-slate-900">Total paid</td>
              <td className="py-3 text-right text-lg font-extrabold text-slate-900">
                {receipt.totalFormatted}
              </td>
            </tr>
            {receipt.refunded && (
              <tr className="border-t border-slate-100">
                <td className="py-2 text-sm text-slate-600">Refunded</td>
                <td className="py-2 text-right text-sm font-medium text-slate-600">
                  −{receipt.refunded.amountFormatted}
                </td>
              </tr>
            )}
          </tfoot>
        </table>

        {/**
         * The GWD mark sits in the footer, not the header. The academy is the
         * primary supplier and owns the top of this document; GWD is named here
         * because it supplied the convenience-fee line item, which is exactly
         * what the note beside it says. Putting the platform logo at the top
         * would misstate who the parent bought coaching from.
         */}
        <div className="mt-6 flex items-start gap-3 border-t border-slate-200 pt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/gwdlogo.png"
            alt="GWD Sports"
            className="mt-0.5 h-12 w-auto flex-shrink-0 opacity-80 print:opacity-100"
          />
          <div>
            <p className="text-[10px] leading-relaxed text-slate-400">
              This is a payment receipt, not a GST tax invoice. The academy fee is
              supplied by {receipt.academy.name}; the convenience fee is supplied
              by GWD Sports for online payment processing. If you need a tax
              invoice for either component, contact the respective supplier.
            </p>
            <p className="mt-2 text-[10px] text-slate-400">
              Computer-generated — valid without a signature.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReceiptPage;
