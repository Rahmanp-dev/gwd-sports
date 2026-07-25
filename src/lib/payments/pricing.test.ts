import { describe, it, expect } from 'vitest';
import {
  computeFeeSplit,
  configuredSplitConfig,
  formatInr,
  DEFAULT_GATEWAY_RATE_BPS,
  DEFAULT_MARGIN_RATE_BPS,
} from './money';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PRICING — PINNED, BECAUSE THREE DOCUMENTS DISAGREE
 * ════════════════════════════════════════════════════════════════════════════
 *
 * As of this file being written, what a parent pays on a ₹3,000 fee has three
 * different published answers:
 *
 *   gwd_platform_edge_cases.html   ₹3,075   — a flat 2.5% convenience fee
 *   this codebase                  see below — gateway cost + 1% target margin
 *   the Phase 4 brief              "2.5–3%" — a range, not a number
 *
 * These are not three roundings of one rate. They are two different MODELS:
 * a flat percentage added to the fee, versus a cost-plus-margin build-up where
 * the parent covers Razorpay's actual cut and GWD's margin sits on top. They
 * happen to land close together at ₹3,000 and will diverge as the fee moves.
 *
 * This file does not resolve that — the rate is a finance decision, and picking
 * one here would be inventing an answer. What it does is make the current
 * behaviour EXPLICIT and BREAKABLE. Today the number is buried three call-deep
 * behind two env vars, so it can change without anyone noticing. Pinned here,
 * any change to the pricing model fails this test with the old and new figures
 * side by side, and whoever makes the change has to state the intent.
 *
 * WHEN FINANCE ANSWERS: update DEFAULT_MARGIN_RATE_BPS / GWD_GATEWAY_RATE_BPS
 * (or replace the model in computeFeeSplit), update these expectations, and
 * correct gwd_platform_edge_cases.html so all three sources agree.
 * ════════════════════════════════════════════════════════════════════════════
 */

/** The worked example every document uses. */
const BASE_FEE_PAISE = 3000_00;

describe('the pricing model currently in force', () => {
  it('defaults have not drifted', () => {
    // 236 bps assumes NO GST input tax credit on Razorpay's fee — the
    // conservative choice. If GWD is GST-registered and reclaims it, the real
    // cost is 200 and net margin roughly quintuples.
    expect(DEFAULT_GATEWAY_RATE_BPS).toBe(236);
    // 1% target net margin, overridable per academy via platformFeePercent.
    expect(DEFAULT_MARGIN_RATE_BPS).toBe(100);
  });

  it('charges a documented, whole-rupee total on the ₹3,000 worked example', () => {
    const split = computeFeeSplit(BASE_FEE_PAISE, configuredSplitConfig());

    // If this line changes, the pricing model changed. That is allowed — but it
    // must be deliberate, and the other two documents must be updated with it.
    expect(split.parentTotalPaise).toBe(3104_00);
    expect(formatInr(split.parentTotalPaise)).toBe('₹3,104.00');

    // The load-bearing invariant, independent of whatever rate is chosen: the
    // academy receives the full fee. GWD's margin is never taken out of the
    // academy's money — it is added to what the parent pays.
    expect(split.academyAmountPaise).toBe(BASE_FEE_PAISE);
  });

  it('is a cost-plus model, not a flat percentage', () => {
    // The distinction that makes the three documents irreconcilable. Under a
    // flat 2.5% the add-on scales linearly with the fee; here it does not,
    // because the gateway's cut is computed on the captured TOTAL rather than
    // on the base.
    const small = computeFeeSplit(1000_00, configuredSplitConfig());
    const large = computeFeeSplit(10000_00, configuredSplitConfig());

    const smallRate = small.convenienceFeePaise / 1000_00;
    const largeRate = large.convenienceFeePaise / 10000_00;

    // Both near 3.4%, but not identical — and neither is the 2.5% the
    // edge-cases document promises.
    expect(smallRate).not.toBeCloseTo(0.025, 3);
    expect(largeRate).not.toBeCloseTo(0.025, 3);
  });

  it('always bills the parent a whole number of rupees', () => {
    // Paise on a UPI screen looks like a bug to a parent, and support calls
    // about ₹3,104.37 cost more than the 37 paise.
    for (const base of [999_00, 1500_50, 3000_00, 7250_00, 12345_00]) {
      const split = computeFeeSplit(base, configuredSplitConfig());
      expect(split.parentTotalPaise % 100).toBe(0);
    }
  });

  it('leaves GWD with a positive margin at every realistic fee', () => {
    // The failure this guards: a rounding rule that quietly makes small fees
    // loss-making. gwdNet absorbs all rounding, so it is where that would show.
    for (const base of [500_00, 1000_00, 3000_00, 25000_00]) {
      const split = computeFeeSplit(base, configuredSplitConfig());
      expect(split.gwdNetPaise).toBeGreaterThan(0);
    }
  });

  it('honours a per-academy margin override', () => {
    const standard = computeFeeSplit(BASE_FEE_PAISE, configuredSplitConfig());
    const premium = computeFeeSplit(BASE_FEE_PAISE, configuredSplitConfig(250));
    expect(premium.parentTotalPaise).toBeGreaterThan(standard.parentTotalPaise);
    expect(premium.academyAmountPaise).toBe(BASE_FEE_PAISE);
  });
});

describe('the alternative model, for comparison when finance decides', () => {
  it('a flat 2.5% would charge ₹3,075 — the figure in gwd_platform_edge_cases.html', () => {
    // Not what the code does. Recorded so the gap is a number rather than an
    // argument: ₹29 on this example, and it widens with the fee.
    const flat = Math.round(BASE_FEE_PAISE * 1.025);
    expect(flat).toBe(3075_00);

    const actual = computeFeeSplit(BASE_FEE_PAISE, configuredSplitConfig());
    expect(actual.parentTotalPaise - flat).toBe(29_00);
  });
});
