import { describe, it, expect } from 'vitest';
import {
  computeFeeSplit,
  computeRefundSplit,
  configuredSplitConfig,
  percentToBps,
  rupeesToPaise,
  paiseToRupees,
  splitDrift,
  formatInr,
  MoneyError,
  DEFAULT_GATEWAY_RATE_BPS,
  DEFAULT_MARGIN_RATE_BPS,
  type SplitConfig,
} from './money';

const CONFIG: SplitConfig = {
  gatewayRateBps: DEFAULT_GATEWAY_RATE_BPS, // 2.36%
  marginRateBps: DEFAULT_MARGIN_RATE_BPS, // 1%
};

/**
 * Deliberately awkward fee amounts. Round numbers hide rounding bugs; these are
 * the ones that surface them — primes, repeating decimals under 2.36%, amounts
 * whose 1% lands on a half-paise, and the small amounts where a single paise of
 * drift is a meaningful fraction of margin.
 */
const AWKWARD_FEES_RUPEES = [
  1, 7, 13, 99, 100, 137, 250, 333, 499, 500, 749, 750, 999, 1000, 1234, 1500,
  1777, 2000, 2333, 2500, 2750, 2999, 3000, 3001, 3333, 3750, 4000, 4567, 5000,
  6666, 7500, 8333, 9999, 10000, 12500, 15000, 24999, 33333, 50000,
];

describe('the split invariant: academy + razorpay + gwd === parent total', () => {
  it('holds exactly for every awkward fee amount, with zero drift', () => {
    for (const rupees of AWKWARD_FEES_RUPEES) {
      const split = computeFeeSplit(rupeesToPaise(rupees), CONFIG);
      expect(
        splitDrift(split),
        `drift on base ₹${rupees}: ${JSON.stringify(split)}`
      ).toBe(0);
    }
  });

  it('holds across a dense sweep of 20,000 consecutive paise values', () => {
    // A dense sweep catches rounding boundaries that a hand-picked list misses.
    for (let paise = 1; paise <= 20_000; paise++) {
      const split = computeFeeSplit(paise, CONFIG);
      expect(splitDrift(split), `drift at ${paise} paise`).toBe(0);
    }
  });

  it('holds across every combination of realistic margin and gateway rates', () => {
    const marginRates = [0, 50, 100, 150, 250, 300, 500];
    const gatewayRates = [0, 200, 236, 250, 300];
    for (const marginRateBps of marginRates) {
      for (const gatewayRateBps of gatewayRates) {
        for (const rupees of [137, 2750, 3333, 9999]) {
          const split = computeFeeSplit(rupeesToPaise(rupees), {
            marginRateBps,
            gatewayRateBps,
          });
          expect(
            splitDrift(split),
            `drift at base ₹${rupees}, margin ${marginRateBps}bps, gateway ${gatewayRateBps}bps`
          ).toBe(0);
        }
      }
    }
  });
});

describe('the academy is always made whole', () => {
  it('receives exactly the base fee, never reduced by rounding or fees', () => {
    for (const rupees of AWKWARD_FEES_RUPEES) {
      const base = rupeesToPaise(rupees);
      const split = computeFeeSplit(base, CONFIG);
      expect(split.academyAmountPaise).toBe(base);
    }
  });
});

describe('parent-facing rounding', () => {
  it('always charges a whole number of rupees', () => {
    for (const rupees of AWKWARD_FEES_RUPEES) {
      const split = computeFeeSplit(rupeesToPaise(rupees), CONFIG);
      expect(
        split.parentTotalPaise % 100,
        `base ₹${rupees} produced a non-whole total ${split.parentTotalPaise}`
      ).toBe(0);
    }
  });

  it('rounds up, never down — the total always covers base + margin + gateway', () => {
    for (const rupees of AWKWARD_FEES_RUPEES) {
      const base = rupeesToPaise(rupees);
      const split = computeFeeSplit(base, CONFIG);
      // Rounding up means GWD nets at least its target margin, never less.
      const targetMargin = (base * CONFIG.marginRateBps) / 10_000;
      expect(
        split.gwdNetPaise,
        `base ₹${rupees}: gwd net ${split.gwdNetPaise} below target ${targetMargin}`
      ).toBeGreaterThanOrEqual(Math.floor(targetMargin));
    }
  });

  it('never leaves GWD with a negative share', () => {
    for (const rupees of AWKWARD_FEES_RUPEES) {
      const split = computeFeeSplit(rupeesToPaise(rupees), CONFIG);
      expect(split.gwdNetPaise).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('the gross-up regression this module exists to fix', () => {
  /**
   * The previous implementation in create-order computed
   *   gatewayFee = (base + platformFee) * 2.36%
   * levying Razorpay's fee on the pre-fee subtotal instead of on the captured
   * total. Razorpay charges on what it actually captures, so the shortfall came
   * out of GWD's margin silently. This test pins the corrected behaviour.
   */
  it('collects enough that a ₹3,000 fee at 1% leaves GWD its full margin', () => {
    const base = rupeesToPaise(3000);
    const split = computeFeeSplit(base, CONFIG);

    // Gross-up: 3030 / (1 - 0.0236) = 3103.2364... → rounds up to ₹3,104.
    expect(split.parentTotalPaise).toBe(rupeesToPaise(3104));
    expect(split.academyAmountPaise).toBe(rupeesToPaise(3000));
    // Razorpay's 2.36% of the ₹3,104 actually captured (73.2544 → 73.25).
    expect(split.gatewayFeePaise).toBe(7325);
    // Residual: 3104.00 - 3000.00 - 73.25 = ₹30.75, above the ₹30.00 target.
    expect(split.gwdNetPaise).toBe(3075);
    expect(split.convenienceFeePaise).toBe(rupeesToPaise(104));
    expect(splitDrift(split)).toBe(0);
  });

  it('beats the old under-collecting formula on GWD net, at every amount', () => {
    const oldFormulaGwdNet = (baseRupees: number): number => {
      // Reproduction of the old create-order math, in rupees as it was written.
      const base = baseRupees;
      const platformFee = (base * 1) / 100;
      const estimatedGateway = (base + platformFee) * 0.0236;
      const total = base + platformFee + estimatedGateway;
      const actualGateway = total * 0.0236; // what Razorpay really charges
      return total - base - actualGateway;
    };

    for (const rupees of AWKWARD_FEES_RUPEES) {
      const corrected = paiseToRupees(computeFeeSplit(rupeesToPaise(rupees), CONFIG).gwdNetPaise);
      const old = oldFormulaGwdNet(rupees);
      expect(
        corrected,
        `base ₹${rupees}: corrected net ${corrected} should be >= old net ${old}`
      ).toBeGreaterThanOrEqual(old);
    }
  });
});

describe('refund reversal math', () => {
  it('reverses a full refund exactly, with no residue anywhere', () => {
    for (const rupees of AWKWARD_FEES_RUPEES) {
      const split = computeFeeSplit(rupeesToPaise(rupees), CONFIG);
      const reversal = computeRefundSplit(split, split.parentTotalPaise);

      expect(reversal.academyReversalPaise).toBe(split.academyAmountPaise);
      expect(reversal.gatewayReversalPaise).toBe(split.gatewayFeePaise);
      expect(reversal.gwdReversalPaise).toBe(split.gwdNetPaise);
      expect(
        reversal.academyReversalPaise +
          reversal.gatewayReversalPaise +
          reversal.gwdReversalPaise
      ).toBe(split.parentTotalPaise);
    }
  });

  it('reverses partial refunds so the three reversals sum to the refund exactly', () => {
    for (const rupees of AWKWARD_FEES_RUPEES) {
      const split = computeFeeSplit(rupeesToPaise(rupees), CONFIG);
      for (const fraction of [0.1, 0.25, 1 / 3, 0.5, 2 / 3, 0.75, 0.99]) {
        const refund = Math.round(split.parentTotalPaise * fraction);
        const reversal = computeRefundSplit(split, refund);
        expect(
          reversal.academyReversalPaise +
            reversal.gatewayReversalPaise +
            reversal.gwdReversalPaise,
          `base ₹${rupees} refunding ${fraction}`
        ).toBe(refund);
      }
    }
  });

  it('never reverses more than was originally collected from any participant', () => {
    const split = computeFeeSplit(rupeesToPaise(3000), CONFIG);
    const reversal = computeRefundSplit(split, split.parentTotalPaise);
    expect(reversal.academyReversalPaise).toBeLessThanOrEqual(split.academyAmountPaise);
    expect(reversal.gatewayReversalPaise).toBeLessThanOrEqual(split.gatewayFeePaise);
    expect(reversal.gwdReversalPaise).toBeLessThanOrEqual(split.gwdNetPaise);
  });

  it('rejects a refund larger than the original capture', () => {
    const split = computeFeeSplit(rupeesToPaise(3000), CONFIG);
    expect(() => computeRefundSplit(split, split.parentTotalPaise + 1)).toThrow(MoneyError);
  });

  it('treats a zero refund as a no-op', () => {
    const split = computeFeeSplit(rupeesToPaise(3000), CONFIG);
    const reversal = computeRefundSplit(split, 0);
    expect(reversal.academyReversalPaise).toBe(0);
    expect(reversal.gatewayReversalPaise).toBe(0);
    expect(reversal.gwdReversalPaise).toBe(0);
  });
});

describe('input guards', () => {
  it('rejects rupee floats masquerading as paise', () => {
    expect(() => computeFeeSplit(3000.5, CONFIG)).toThrow(MoneyError);
  });

  it('rejects negative base amounts', () => {
    expect(() => computeFeeSplit(-100, CONFIG)).toThrow(MoneyError);
  });

  it('rejects a gateway rate of 100% or more (the gross-up would divide by zero)', () => {
    expect(() => computeFeeSplit(100_000, { gatewayRateBps: 10_000, marginRateBps: 100 })).toThrow(
      MoneyError
    );
  });

  it('rejects non-finite rupee input', () => {
    expect(() => rupeesToPaise(NaN)).toThrow(MoneyError);
    expect(() => rupeesToPaise(Infinity)).toThrow(MoneyError);
  });

  it('handles a zero fee without dividing by anything', () => {
    const split = computeFeeSplit(0, CONFIG);
    expect(split.parentTotalPaise).toBe(0);
    expect(splitDrift(split)).toBe(0);
  });
});

describe('unit conversion helpers', () => {
  it('converts rupees to paise without float drift', () => {
    expect(rupeesToPaise(3000)).toBe(300_000);
    expect(rupeesToPaise(2750.5)).toBe(275_050);
    expect(rupeesToPaise(0.1)).toBe(10);
    // The classic float trap: 29.999999999999996 must become 3000 paise.
    expect(rupeesToPaise(0.1 * 3 * 100)).toBe(3000);
  });

  it('converts a fee percent to basis points', () => {
    expect(percentToBps(1)).toBe(100);
    expect(percentToBps(2.5)).toBe(250);
    expect(percentToBps(0)).toBe(0);
  });

  it('formats paise as Indian-grouped rupees', () => {
    expect(formatInr(310_400)).toBe('₹3,104.00');
    expect(formatInr(7325)).toBe('₹73.25');
  });
});

describe('configuration', () => {
  it('defaults to 2.36% gateway and 1% margin', () => {
    const config = configuredSplitConfig();
    expect(config.gatewayRateBps).toBe(236);
    expect(config.marginRateBps).toBe(100);
  });

  it('accepts a per-academy margin override', () => {
    expect(configuredSplitConfig(250).marginRateBps).toBe(250);
  });
});
