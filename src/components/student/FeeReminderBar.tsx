"use client";

import React from "react";
import { CalendarClock, AlertTriangle, ArrowRight, X } from "lucide-react";
import { feeBannerState } from "@/lib/payments/feeStatus";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE FEE BAR
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Sits above everything on the student dashboard for the week around a due
 * date, then goes away. All the deciding happens in lib/payments/feeStatus.ts,
 * which is pure and tested against the same cycle rule the WhatsApp reminders
 * use — if the two disagreed, a parent would get a message saying the fee is
 * due today while the portal still said "in three days", and neither would be
 * believed again.
 *
 * TONE IS THE DESIGN PROBLEM HERE, not layout. This is a bill, shown to a
 * child, about money their parent owes. So:
 *
 *  · It never blocks anything and never covers content — it is a bar, not a
 *    modal, and it is dismissible.
 *  · It de-escalates. `insistent` goes false once the message cadence has
 *    stopped chasing; the balance is still stated, quietly. A permanently
 *    flashing red banner is both cruel and, after a week, invisible.
 *  · It says outright that nothing on their record changes. The platform's
 *    rule is that a child is never restricted for a billing problem, and the
 *    one place a student would fear otherwise is a red bar about money.
 * ════════════════════════════════════════════════════════════════════════════
 */

export function FeeReminderBar({
  outstandingFees,
  feeDueDayOfMonth,
  onPay,
}: {
  outstandingFees?: number | null;
  feeDueDayOfMonth?: number | null;
  /** Sends the student to the Fees tab. */
  onPay?: () => void;
}) {
  const [dismissed, setDismissed] = React.useState(false);

  const state = feeBannerState({ outstandingFees, feeDueDayOfMonth });
  if (!state.show || dismissed) return null;

  const loud = state.insistent;
  const overdue = state.urgency === "overdue";

  /**
   * Tone is fixed rather than themed: an academy whose brand IS red would make
   * every notice look like an alarm, and one whose brand is green would make an
   * overdue fee read as a success. But it still has to survive both page
   * schemes — the classes below flip weight on `--page-scheme`, which is what a
   * first version of this got wrong by hard-coding light-on-dark text.
   */
  const toneClass = loud
    ? overdue
      ? "pt-notice pt-notice-danger"
      : "pt-notice pt-notice-warn"
    : "pt-notice-quiet";

  const Icon = overdue && loud ? AlertTriangle : CalendarClock;

  return (
    <div
      // `polite`, never `assertive`: a screen-reader user should hear this when
      // they reach it, not have it interrupt whatever they were doing.
      role="status"
      aria-live="polite"
      className={`flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 ${toneClass}`}
    >
      <Icon className="h-5 w-5 flex-shrink-0 opacity-90" aria-hidden />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{state.headline}</p>
        <p className="pt-faint mt-0.5 text-xs leading-relaxed">
          {state.detail}
        </p>
      </div>

      <div className="flex flex-shrink-0 items-center gap-1.5">
        {onPay && (
          <button
            type="button"
            onClick={onPay}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-opacity hover:opacity-90 ${loud ? "pt-notice-btn" : "pt-btn-quiet rounded-lg"}`}
          >
            Pay now
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Hide this reminder"
          className="pt-faint rounded-lg p-1.5 transition-colors hover:bg-white/10"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default FeeReminderBar;
