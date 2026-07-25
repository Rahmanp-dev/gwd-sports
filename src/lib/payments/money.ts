/**
 * Money math for parent-facing fee payments.
 *
 * TWO NON-NEGOTIABLE RULES IN THIS FILE:
 *
 * 1. All arithmetic happens in integer paise. Never in rupee floats. `0.1 + 0.2`
 *    is not `0.3` and a fee split that drifts by a paise per transaction is a
 *    reconciliation failure at scale.
 *
 * 2. GWD's net is the RESIDUAL, never an independently computed figure. It is
 *    defined as `parentTotal - academyAmount - gatewayFee`. This makes the
 *    invariant `academy + gateway + gwd === parentTotal` true by construction
 *    rather than true by luck, and it parks every rounding remainder in GWD's
 *    share — the only share we are entitled to absorb it into. The academy's
 *    cut is never touched by rounding.
 */

/** Razorpay's effective rate, in basis points. 236 bps = 2.36% (2% + 18% GST). */
export const DEFAULT_GATEWAY_RATE_BPS = 236;

/** GWD's target net margin, in basis points. 100 bps = 1%. */
export const DEFAULT_MARGIN_RATE_BPS = 100;

const BPS_DENOMINATOR = 10_000;
const PAISE_PER_RUPEE = 100;

export interface SplitConfig {
  /**
   * Razorpay's effective cut of the captured total, in basis points.
   *
   * 236 bps assumes GWD does NOT reclaim the 18% GST on Razorpay's fee as input
   * tax credit. If GWD is GST-registered and claims ITC, the real economic cost
   * is 200 bps and this should be configured as 200 — which roughly quintuples
   * net margin per transaction. See notes in configuredSplitConfig().
   */
  gatewayRateBps: number;
  /** GWD's target net margin on the base fee, in basis points. */
  marginRateBps: number;
}

export interface FeeSplit {
  /** What the academy receives. Always exactly the base fee — never reduced. */
  academyAmountPaise: number;
  /** What the parent is charged. Always a whole number of rupees. */
  parentTotalPaise: number;
  /** Razorpay's cut, computed on the captured total. */
  gatewayFeePaise: number;
  /** GWD's residual. Absorbs all rounding. */
  gwdNetPaise: number;
  /** The add-on shown to the parent: parentTotal - academyAmount. */
  convenienceFeePaise: number;
}

export class MoneyError extends Error {}

export function rupeesToPaise(rupees: number): number {
  if (!Number.isFinite(rupees)) {
    throw new MoneyError(`Not a finite rupee amount: ${rupees}`);
  }
  if (rupees < 0) {
    throw new MoneyError(`Negative rupee amount: ${rupees}`);
  }
  // Round rather than truncate: 29.999999999 from upstream float math is 30.00.
  return Math.round(rupees * PAISE_PER_RUPEE);
}

/** For display and for writing to the legacy rupee-denominated schema fields. */
export function paiseToRupees(paise: number): number {
  assertIntegerPaise(paise);
  return paise / PAISE_PER_RUPEE;
}

export function formatInr(paise: number): string {
  assertIntegerPaise(paise);
  const rupees = paise / PAISE_PER_RUPEE;
  return `₹${rupees.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function assertIntegerPaise(paise: number): void {
  if (!Number.isInteger(paise)) {
    throw new MoneyError(
      `Money must be integer paise, got ${paise}. Something upstream is using rupee floats.`
    );
  }
}

function ceilToWholeRupee(paise: number): number {
  return Math.ceil(paise / PAISE_PER_RUPEE) * PAISE_PER_RUPEE;
}

/**
 * Reads the split configuration from the environment, falling back to defaults.
 *
 * ASSUMPTION FLAGGED FOR PRODUCT/FINANCE REVIEW: gatewayRateBps defaults to 236
 * (no GST input tax credit claimed). This is the conservative choice — it
 * over-collects slightly rather than under-collecting. If GWD is GST-registered
 * and claims ITC on Razorpay's GST, set GWD_GATEWAY_RATE_BPS=200.
 */
export function configuredSplitConfig(marginRateBpsOverride?: number): SplitConfig {
  const gatewayRateBps = Number(process.env.GWD_GATEWAY_RATE_BPS ?? DEFAULT_GATEWAY_RATE_BPS);
  const marginRateBps =
    marginRateBpsOverride ??
    Number(process.env.GWD_MARGIN_RATE_BPS ?? DEFAULT_MARGIN_RATE_BPS);
  return { gatewayRateBps, marginRateBps };
}

/** Converts an academy's `platformFeePercent` (0-10, may be fractional) to bps. */
export function percentToBps(percent: number): number {
  if (!Number.isFinite(percent) || percent < 0) {
    throw new MoneyError(`Invalid fee percent: ${percent}`);
  }
  return Math.round(percent * 100);
}

/**
 * Computes the parent-facing total and the three-way split.
 *
 * The gross-up is the important part. A naive implementation charges
 * `base + margin + (base + margin) * gatewayRate`, but Razorpay's fee is levied
 * on the TOTAL CAPTURED — including the portion added to cover the fee itself.
 * Charging the fee on the pre-fee subtotal under-collects, and the shortfall is
 * silently eaten out of GWD's margin.
 *
 * Solving for the total that leaves both the academy and GWD whole:
 *
 *     total = base + margin + gatewayRate * total
 *     total * (1 - gatewayRate) = base + margin
 *     total = (base + margin) / (1 - gatewayRate)
 *
 * The result is then rounded UP to a whole rupee (parents should never see
 * "₹3,101.51"), and GWD's net absorbs the rounding gain.
 */
export function computeFeeSplit(baseAmountPaise: number, config: SplitConfig): FeeSplit {
  assertIntegerPaise(baseAmountPaise);
  if (baseAmountPaise < 0) {
    throw new MoneyError(`Negative base amount: ${baseAmountPaise}`);
  }
  const { gatewayRateBps, marginRateBps } = config;
  if (gatewayRateBps < 0 || gatewayRateBps >= BPS_DENOMINATOR) {
    throw new MoneyError(`Gateway rate out of range: ${gatewayRateBps} bps`);
  }
  if (marginRateBps < 0) {
    throw new MoneyError(`Negative margin rate: ${marginRateBps} bps`);
  }

  if (baseAmountPaise === 0) {
    return {
      academyAmountPaise: 0,
      parentTotalPaise: 0,
      gatewayFeePaise: 0,
      gwdNetPaise: 0,
      convenienceFeePaise: 0,
    };
  }

  const marginPaise = (baseAmountPaise * marginRateBps) / BPS_DENOMINATOR;
  const grossedUp =
    ((baseAmountPaise + marginPaise) * BPS_DENOMINATOR) / (BPS_DENOMINATOR - gatewayRateBps);

  const parentTotalPaise = ceilToWholeRupee(grossedUp);

  // Razorpay computes its fee on the captured total and rounds to paise.
  const gatewayFeePaise = Math.round((parentTotalPaise * gatewayRateBps) / BPS_DENOMINATOR);

  // The residual. This is what makes the invariant exact.
  const gwdNetPaise = parentTotalPaise - baseAmountPaise - gatewayFeePaise;

  if (gwdNetPaise < 0) {
    throw new MoneyError(
      `Split would leave GWD negative (${gwdNetPaise} paise) for base ${baseAmountPaise} ` +
        `at ${marginRateBps}bps margin / ${gatewayRateBps}bps gateway. Refusing to create order.`
    );
  }

  const split: FeeSplit = {
    academyAmountPaise: baseAmountPaise,
    parentTotalPaise,
    gatewayFeePaise,
    gwdNetPaise,
    convenienceFeePaise: parentTotalPaise - baseAmountPaise,
  };

  assertSplitBalances(split);
  return split;
}

/**
 * The invariant, asserted at every boundary: the three shares must sum to the
 * parent's total, exactly, with zero tolerance.
 *
 * Called on construction, before order creation, and by the daily
 * reconciliation job against amounts actually settled by Razorpay.
 */
export function assertSplitBalances(split: {
  academyAmountPaise: number;
  gatewayFeePaise: number;
  gwdNetPaise: number;
  parentTotalPaise: number;
}): void {
  const sum = split.academyAmountPaise + split.gatewayFeePaise + split.gwdNetPaise;
  if (sum !== split.parentTotalPaise) {
    throw new MoneyError(
      `Split does not balance: academy ${split.academyAmountPaise} + gateway ` +
        `${split.gatewayFeePaise} + gwd ${split.gwdNetPaise} = ${sum}, ` +
        `expected parent total ${split.parentTotalPaise} (drift ${sum - split.parentTotalPaise} paise)`
    );
  }
}

/** Non-throwing variant for the reconciliation job, which reports rather than crashes. */
export function splitDrift(split: {
  academyAmountPaise: number;
  gatewayFeePaise: number;
  gwdNetPaise: number;
  parentTotalPaise: number;
}): number {
  return (
    split.academyAmountPaise +
    split.gatewayFeePaise +
    split.gwdNetPaise -
    split.parentTotalPaise
  );
}

export interface RefundSplit {
  refundTotalPaise: number;
  academyReversalPaise: number;
  gatewayReversalPaise: number;
  gwdReversalPaise: number;
}

/**
 * Proportional (linked) refund reversal.
 *
 * Mirrors what Razorpay Route does on a linked refund: each participant gives
 * back their share in proportion to the refunded fraction of the original
 * capture. Same residual discipline as the forward split — the academy's
 * reversal is computed proportionally, the gateway's is computed
 * proportionally, and GWD's is whatever is left, so the reversal sums exactly
 * to the refund amount.
 *
 * NOTE: whether Razorpay actually returns its own fee on a refund is a
 * commercial term of the merchant agreement, not a mathematical certainty. This
 * function models the "fee is returned" case. If GWD's contract says the
 * gateway fee is retained on refunds, gatewayReversalPaise must be forced to 0
 * and the difference charged to GWD's share — which turns most refunds into a
 * net loss and is a pricing decision, not a code change.
 */
export function computeRefundSplit(original: FeeSplit, refundTotalPaise: number): RefundSplit {
  assertIntegerPaise(refundTotalPaise);
  if (refundTotalPaise < 0) {
    throw new MoneyError(`Negative refund: ${refundTotalPaise}`);
  }
  if (refundTotalPaise > original.parentTotalPaise) {
    throw new MoneyError(
      `Refund ${refundTotalPaise} exceeds original capture ${original.parentTotalPaise}`
    );
  }
  if (refundTotalPaise === 0) {
    return {
      refundTotalPaise: 0,
      academyReversalPaise: 0,
      gatewayReversalPaise: 0,
      gwdReversalPaise: 0,
    };
  }

  // Full refund is exact by definition — avoid any proportional rounding at all.
  if (refundTotalPaise === original.parentTotalPaise) {
    return {
      refundTotalPaise,
      academyReversalPaise: original.academyAmountPaise,
      gatewayReversalPaise: original.gatewayFeePaise,
      gwdReversalPaise: original.gwdNetPaise,
    };
  }

  const fraction = refundTotalPaise / original.parentTotalPaise;
  const academyReversalPaise = Math.round(original.academyAmountPaise * fraction);
  const gatewayReversalPaise = Math.round(original.gatewayFeePaise * fraction);
  const gwdReversalPaise = refundTotalPaise - academyReversalPaise - gatewayReversalPaise;

  const reversal: RefundSplit = {
    refundTotalPaise,
    academyReversalPaise,
    gatewayReversalPaise,
    gwdReversalPaise,
  };
  assertRefundBalances(reversal);
  return reversal;
}

export function assertRefundBalances(reversal: RefundSplit): void {
  const sum =
    reversal.academyReversalPaise + reversal.gatewayReversalPaise + reversal.gwdReversalPaise;
  if (sum !== reversal.refundTotalPaise) {
    throw new MoneyError(
      `Refund reversal does not balance: ${sum} !== ${reversal.refundTotalPaise}`
    );
  }
}
