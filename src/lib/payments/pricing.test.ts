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

  /**
   * The partner booklet prints this worked example. The copy is hand-written
   * HTML and cannot import from here, so nothing else would catch it drifting
   * if the rates move — and a stale figure in a document handed to a partner
   * is worse than no figure at all.
   *
   * The public homepage deliberately does NOT print any of this: it states
   * that the platform is free and stops there. See the header of
   * components/ecosystem/WhatItCosts.tsx for why.
   *
   * KEEP IN SYNC: docs/GWD-Academy-Booklet.html, "The question everyone asks
   * first" (page 06).
   */
  it('matches the worked example printed in the partner booklet', () => {
    const split = computeFeeSplit(BASE_FEE_PAISE, configuredSplitConfig());

    expect(formatInr(split.parentTotalPaise)).toBe('₹3,104.00');       // "Parent pays"
    expect(formatInr(split.academyAmountPaise)).toBe('₹3,000.00');     // "Your academy"
    expect(formatInr(split.convenienceFeePaise)).toBe('₹104.00');      // "Added on top"

    // The only rate the public copy names, because it is the only one we set.
    expect(DEFAULT_MARGIN_RATE_BPS / 100).toBe(1);
  });

  /**
   * ══════════════════════════════════════════════════════════════════════════
   * WHY THE PUBLIC COPY STOPS AT THE ₹104 AND DOES NOT SPLIT IT
   * ══════════════════════════════════════════════════════════════════════════
   *
   * `gatewayFeePaise` is a MODELLED figure — a flat 236 bps applied to the
   * captured total with no branching by payment instrument. It exists to gross
   * the parent's total up so the academy and GWD are both left whole. It is an
   * assumption, not an observation.
   *
   * What Razorpay ACTUALLY charged arrives later, per payment, and is stored
   * separately as `gatewayFeeActualPaise` (settle.ts reads it off the webhook).
   * The two exist as different fields because they are different quantities.
   *
   * They diverge hardest on the commonest case: UPI carries zero MDR in India,
   * so the real gateway charge on a UPI payment is at or near nil while this
   * model still assumes 2.36%. Publishing "Razorpay takes ₹73.25 / GWD keeps
   * ₹30.75" therefore attributes an amount to a named third party that they do
   * not charge on that transaction, and understates GWD's own share severalfold.
   *
   * This test exists to keep that reasoning attached to the numbers. If the
   * split is ever made instrument-aware and reconciled against
   * `gatewayFeeActualPaise`, a per-party public breakdown becomes defensible
   * and this test should be replaced rather than deleted.
   * ══════════════════════════════════════════════════════════════════════════
   */
  it('models the gateway cut rather than observing it, so it stays internal', () => {
    const split = computeFeeSplit(BASE_FEE_PAISE, configuredSplitConfig());

    // The estimate is internally consistent — the two modelled parts account
    // for the whole add-on with nothing unexplained.
    expect(split.gatewayFeePaise + split.gwdNetPaise).toBe(split.convenienceFeePaise);

    // ...and it is an ESTIMATE: one flat rate, applied whatever the parent
    // paid with. Nothing here consults the payment instrument.
    expect(DEFAULT_GATEWAY_RATE_BPS).toBe(236); // 200 × 1.18, no GST input credit claimed

    /**
     * The parent is charged the SAME grossed-up total however they choose to
     * pay, because the model cannot see the instrument. What varies is the
     * gateway's real charge underneath that fixed total — and therefore what
     * GWD actually realises.
     *
     * On UPI (zero MDR) the gateway takes ~nothing, so GWD realises the whole
     * add-on rather than the modelled ₹30.75. That is why the public copy
     * cannot name a per-party figure: the printed one would be wrong in GWD's
     * own favour on the commonest payment method.
     */
    const parentTotal = split.parentTotalPaise;
    const realisedIfGatewayCharged = (actualFeePaise: number) =>
      parentTotal - split.academyAmountPaise - actualFeePaise;

    expect(realisedIfGatewayCharged(split.gatewayFeePaise)).toBe(split.gwdNetPaise);
    expect(realisedIfGatewayCharged(0)).toBe(split.convenienceFeePaise); // the UPI case
    expect(realisedIfGatewayCharged(0)).toBeGreaterThan(split.gwdNetPaise * 3);
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
