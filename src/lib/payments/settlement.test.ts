import { describe, it, expect } from 'vitest';
import {
  resolveSettlementStrategy,
  getSettlementStrategy,
  listSettlementStrategies,
} from './settlement';
import { computeFeeSplit, configuredSplitConfig, rupeesToPaise } from './money';

const split = computeFeeSplit(rupeesToPaise(3000), configuredSplitConfig());

describe('settlement strategy resolution', () => {
  it('honours an explicit per-academy strategy above all else', () => {
    const strategy = resolveSettlementStrategy({
      settlementStrategy: 'collect_and_manual_payout',
      rzp_account: 'acc_LINKED123', // present, but the explicit choice wins
    });
    expect(strategy.name).toBe('collect_and_manual_payout');
  });

  it('infers Route when an academy has a linked account and no explicit choice', () => {
    const strategy = resolveSettlementStrategy({ rzp_account: 'acc_LINKED123' });
    expect(strategy.name).toBe('razorpay_route_auto_split');
    expect(strategy.isAutomatic).toBe(true);
  });

  it('falls back to collect-and-payout when there is no linked account', () => {
    expect(resolveSettlementStrategy({}).name).toBe('collect_and_manual_payout');
    expect(resolveSettlementStrategy(null).name).toBe('collect_and_manual_payout');
    expect(resolveSettlementStrategy(undefined).name).toBe('collect_and_manual_payout');
  });

  it('falls back safely rather than throwing on an unknown strategy name', () => {
    const strategy = resolveSettlementStrategy({ settlementStrategy: 'some_future_mechanism' });
    expect(strategy.name).toBe('collect_and_manual_payout');
  });
});

describe('Route order instructions', () => {
  it('transfers exactly the academy portion, in paise, and nothing more', () => {
    const strategy = getSettlementStrategy('razorpay_route_auto_split')!;
    const instruction = strategy.buildOrderInstruction({
      split,
      academyRzpAccount: 'acc_LINKED123',
      currency: 'INR',
    });

    const transfers = instruction.orderFields.transfers as any[];
    expect(transfers).toHaveLength(1);
    expect(transfers[0].account).toBe('acc_LINKED123');
    // The academy's cut, untouched by the gateway fee or GWD's margin.
    expect(transfers[0].amount).toBe(split.academyAmountPaise);
    expect(transfers[0].amount).toBe(rupeesToPaise(3000));
    expect(transfers[0].on_hold).toBe(false);
    expect(instruction.transferStatus).toBe('pending');
  });

  it('does not silently keep the academy money when Route is set but unlinked', () => {
    const strategy = getSettlementStrategy('razorpay_route_auto_split')!;
    const instruction = strategy.buildOrderInstruction({
      split,
      academyRzpAccount: null,
      currency: 'INR',
    });

    expect(instruction.orderFields.transfers).toBeUndefined();
    expect(instruction.transferStatus).toBe('not_applicable');
    // The note is what makes the manual-payout obligation visible to an operator.
    expect(instruction.note).toMatch(/manually/i);
  });
});

describe('collect-and-payout instructions', () => {
  it('adds no transfers and records the amount owed to the academy', () => {
    const strategy = getSettlementStrategy('collect_and_manual_payout')!;
    const instruction = strategy.buildOrderInstruction({ split, currency: 'INR' });

    expect(instruction.orderFields).toEqual({});
    expect(instruction.transferStatus).toBe('not_applicable');
    expect(instruction.note).toContain(String(split.academyAmountPaise));
  });

  it('is marked non-automatic, because a real liability to the academy exists', () => {
    expect(getSettlementStrategy('collect_and_manual_payout')!.isAutomatic).toBe(false);
  });
});

describe('the registry', () => {
  it('exposes every strategy with a stable name matching its key', () => {
    for (const strategy of listSettlementStrategies()) {
      expect(getSettlementStrategy(strategy.name)).toBe(strategy);
    }
  });

  it('returns undefined for an unregistered name rather than a default', () => {
    expect(getSettlementStrategy('nope')).toBeUndefined();
  });
});
