import type { FeeSplit } from './money';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * SETTLEMENT STRATEGY INTERFACE — READ THIS BEFORE HARDCODING ANYTHING
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Razorpay Route auto-split is DELIBERATELY NOT the only settlement path, and
 * must never become one.
 *
 * Route's automatic split-settlement may only be lawfully available to merchants
 * above a domestic annual turnover threshold (~₹40 lakh) under India's payment
 * aggregator regulation. Most 40–80 student academies bill ₹12–38 lakh a year and
 * therefore sit BELOW that line. This is still being confirmed with legal
 * counsel — see Turnover_Declaration_Razorpay_Route.pdf in the repo root and
 * Razorpay ticket #19993905.
 *
 * The consequence for this codebase: settlement mechanism is a per-academy
 * decision, resolved at order-creation time, swappable without a rebuild. If the
 * legal position lands differently for different academy tiers, that becomes a
 * field on the Academy document and a new implementation of this interface — not
 * a refactor of the payment flow.
 *
 * When adding a strategy:
 *   1. Implement SettlementStrategy.
 *   2. Register it in STRATEGIES.
 *   3. Set `academy.settlementStrategy` to its name.
 * Do not add branching on `rzp_account` anywhere outside this file.
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface OrderInstruction {
  /** Extra fields merged into the Razorpay order creation payload. */
  orderFields: Record<string, unknown>;
  /** Initial transferStatus to record on the FeePayment. */
  transferStatus: 'pending' | 'not_applicable';
  /** Human-readable note for the audit trail and admin UI. */
  note: string;
}

export interface SettlementStrategy {
  name: string;
  description: string;
  /**
   * True when the academy receives its money automatically as part of the
   * transaction. False means GWD holds the funds and owes the academy a payout
   * through some other mechanism, which has bookkeeping and trust consequences.
   */
  isAutomatic: boolean;
  buildOrderInstruction(params: {
    split: FeeSplit;
    academyRzpAccount?: string | null;
    currency: string;
  }): OrderInstruction;
}

/**
 * Razorpay Route: the transaction is split at capture time. The academy's linked
 * account receives the base fee directly and untouched; GWD's margin and
 * Razorpay's fee come out of the convenience fee portion that remains in GWD's
 * account.
 *
 * Availability is subject to the turnover question documented above.
 */
const routeAutoSplit: SettlementStrategy = {
  name: 'razorpay_route_auto_split',
  description: 'Razorpay Route splits at capture; academy is paid automatically.',
  isAutomatic: true,
  buildOrderInstruction({ split, academyRzpAccount, currency }) {
    if (!academyRzpAccount) {
      // Configured for Route but the linked account is missing. Do not silently
      // fall through to keeping the academy's money — that is exactly the kind
      // of quiet failure that becomes an angry phone call.
      return {
        orderFields: {},
        transferStatus: 'not_applicable',
        note:
          'Route selected but academy has no rzp_account linked. Funds will settle to ' +
          'the GWD account and the academy must be paid out manually.',
      };
    }
    return {
      orderFields: {
        transfers: [
          {
            account: academyRzpAccount,
            amount: split.academyAmountPaise,
            currency,
            on_hold: false,
          },
        ],
      },
      transferStatus: 'pending',
      note: `Route transfer of ${split.academyAmountPaise} paise to ${academyRzpAccount}.`,
    };
  },
};

/**
 * Collect-and-payout: everything settles into GWD's account and the academy is
 * paid on a separate cycle (bank transfer, RazorpayX payout, or manual).
 *
 * This is the fallback for academies that cannot legally use Route auto-split.
 * It is not merely "Route turned off" — it creates a real liability to the
 * academy that has to be tracked and discharged, which is why it is an explicit
 * named strategy rather than an absent `transfers` array.
 *
 * NEEDS A PRODUCT DECISION: the actual payout mechanism and its cadence are not
 * implemented. This strategy records the obligation correctly; discharging it is
 * currently an operational (human) process.
 */
const collectAndPayout: SettlementStrategy = {
  name: 'collect_and_manual_payout',
  description: 'Funds settle to GWD; academy is paid out on a separate cycle.',
  isAutomatic: false,
  buildOrderInstruction({ split }) {
    return {
      orderFields: {},
      transferStatus: 'not_applicable',
      note:
        `GWD holds ${split.academyAmountPaise} paise owed to the academy, to be ` +
        `discharged by separate payout.`,
    };
  },
};

const STRATEGIES: Record<string, SettlementStrategy> = {
  [routeAutoSplit.name]: routeAutoSplit,
  [collectAndPayout.name]: collectAndPayout,
};

export function getSettlementStrategy(name: string): SettlementStrategy | undefined {
  return STRATEGIES[name];
}

export function listSettlementStrategies(): SettlementStrategy[] {
  return Object.values(STRATEGIES);
}

/**
 * Chooses the settlement strategy for an academy.
 *
 * Precedence:
 *   1. An explicit `academy.settlementStrategy` — always wins once set.
 *   2. Route, if the academy has a linked Razorpay account.
 *   3. Collect-and-payout.
 *
 * Rule 2 preserves today's behaviour for the founding academies. Once the legal
 * position on the turnover threshold is settled, set rule 1 explicitly per
 * academy and stop relying on the inference.
 */
export function resolveSettlementStrategy(
  academy: { settlementStrategy?: string; rzp_account?: string } | null | undefined
): SettlementStrategy {
  if (academy?.settlementStrategy) {
    const explicit = getSettlementStrategy(academy.settlementStrategy);
    if (explicit) return explicit;
    console.warn(
      `[settlement] academy requests unknown strategy "${academy.settlementStrategy}", ` +
        `falling back to ${collectAndPayout.name}`
    );
    return collectAndPayout;
  }
  if (academy?.rzp_account) return routeAutoSplit;
  return collectAndPayout;
}
