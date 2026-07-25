import { describe, it, expect } from 'vitest';
import {
  planDispatch,
  budgetKey,
  localDateKey,
  isQuietHour,
  nextAllowedSendTime,
  nextDaySlot,
  effectiveBudget,
  explainDecision,
  DEFAULT_SCHEDULING_CONFIG,
  type SchedulingConfig,
  type DispatchCandidate,
  type DispatchDecision,
  type DeferralReason,
} from './scheduling';
import { MESSAGE_PRIORITY } from '@/lib/models/OutboundMessage';

const CONFIG: SchedulingConfig = DEFAULT_SCHEDULING_CONFIG;
const IST = CONFIG.timezoneOffsetMinutes;

/** Builds a Date from an IST wall-clock time, so tests read in local terms. */
function ist(day: number, hour: number, minute = 0): Date {
  return new Date(Date.UTC(2026, 6, day, hour, minute) - IST * 60_000);
}

const PARENT = '+919876543210';

function candidate(
  id: string,
  priority: number,
  templateKey: string,
  scheduledFor: Date,
  phone = PARENT
): DispatchCandidate {
  return { id, priority, templateKey, scheduledFor, recipientPhone: phone };
}

function byId(decisions: DispatchDecision[]): Record<string, DispatchDecision> {
  return Object.fromEntries(decisions.map((d) => [d.id, d]));
}

// ═══════════════════════════════════════════════════════════════════════════
// THE HEADLINE SCENARIO
//
// A full simulated Saturday for ONE parent with TWO children enrolled (Rohan
// and Anaya — siblings on one phone number, so they share one budget). Seven
// triggers fire across the day. The worker runs on a cron tick, so this is
// modelled as a SEQUENCE of planner calls with the sent-count carried forward,
// exactly as production behaves — not one omniscient batch, because in reality
// the 7pm trigger does not exist yet when the 8am tick runs.
//
// Budget: 3 shared slots + 1 slot reserved for payment = 4 maximum.
// ═══════════════════════════════════════════════════════════════════════════

describe('simulated day: 7 triggers for one parent across sequential cron ticks', () => {
  /** Runs the planner tick by tick, threading the budget spend forward. */
  function simulate(
    ticks: Array<{ at: Date; label: string; candidates: DispatchCandidate[] }>
  ) {
    const sentCounts: Record<string, number> = {};
    const log: Array<{
      tick: string;
      id: string;
      action: 'send' | 'defer';
      reason?: DeferralReason;
      deferTo?: Date;
    }> = [];

    for (const tick of ticks) {
      const decisions = planDispatch({
        now: tick.at,
        candidates: tick.candidates,
        sentCounts,
        config: CONFIG,
      });

      for (const decision of decisions) {
        if (decision.action === 'send') {
          const key = budgetKey(decision.recipientPhone, localDateKey(tick.at, IST));
          sentCounts[key] = (sentCounts[key] ?? 0) + 1;
          log.push({ tick: tick.label, id: decision.id, action: 'send' });
        } else {
          log.push({
            tick: tick.label,
            id: decision.id,
            action: 'defer',
            reason: decision.reason,
            deferTo: decision.deferTo,
          });
        }
      }
    }

    return { log, sentCounts };
  }

  const { log, sentCounts } = simulate([
    {
      at: ist(25, 7, 30),
      label: '07:30 (quiet)',
      candidates: [candidate('digest-weekly', MESSAGE_PRIORITY.ACHIEVEMENT, 'weekly_digest', ist(25, 7, 30))],
    },
    {
      at: ist(25, 8, 5),
      label: '08:05',
      candidates: [candidate('digest-weekly', MESSAGE_PRIORITY.ACHIEVEMENT, 'weekly_digest', ist(25, 8, 0))],
    },
    {
      at: ist(25, 10, 0),
      label: '10:00',
      candidates: [candidate('fee-due-today', MESSAGE_PRIORITY.PAYMENT, 'fee_due_today', ist(25, 10, 0))],
    },
    {
      at: ist(25, 17, 0),
      label: '17:00 (both kids check in)',
      candidates: [
        candidate('attendance-rohan', MESSAGE_PRIORITY.ATTENDANCE, 'attendance_confirmation', ist(25, 17, 0)),
        candidate('attendance-anaya', MESSAGE_PRIORITY.ATTENDANCE, 'attendance_confirmation', ist(25, 17, 0)),
      ],
    },
    {
      at: ist(25, 18, 0),
      label: '18:00',
      candidates: [candidate('achievement-badge', MESSAGE_PRIORITY.ACHIEVEMENT, 'achievement', ist(25, 18, 0))],
    },
    {
      at: ist(25, 19, 0),
      label: '19:00',
      candidates: [candidate('fee-overdue-3', MESSAGE_PRIORITY.PAYMENT, 'fee_overdue_3', ist(25, 19, 0))],
    },
    {
      at: ist(25, 19, 30),
      label: '19:30',
      candidates: [candidate('fee-overdue-again', MESSAGE_PRIORITY.PAYMENT, 'fee_overdue_3', ist(25, 19, 30))],
    },
  ]);

  const outcome = (id: string) => log.filter((entry) => entry.id === id);

  it('sends exactly 4 messages all day — 3 shared slots plus the payment reserve', () => {
    const sends = log.filter((entry) => entry.action === 'send');
    expect(sends).toHaveLength(4);
    expect(sentCounts[budgetKey(PARENT, '2026-07-25')]).toBe(4);
  });

  it('07:30 — holds the weekly digest for quiet hours, then sends it at 08:05', () => {
    const attempts = outcome('digest-weekly');
    expect(attempts[0]).toMatchObject({ action: 'defer', reason: 'quiet_hours' });
    expect(attempts[0].deferTo?.getTime()).toBe(ist(25, 8).getTime());
    expect(attempts[1]).toMatchObject({ action: 'send' });
  });

  it('10:00 — sends the fee-due reminder (slot 2 of 3)', () => {
    expect(outcome('fee-due-today')[0]).toMatchObject({ action: 'send' });
  });

  it('17:00 — sends ONE sibling and defers the other: they share one budget', () => {
    // Two children, one phone. The third shared slot goes to one of them; the
    // other is pushed rather than sent, because a fourth message would risk the
    // mute that costs us every future message.
    const rohan = outcome('attendance-rohan')[0];
    const anaya = outcome('attendance-anaya')[0];
    const actions = [rohan.action, anaya.action].sort();
    expect(actions).toEqual(['defer', 'send']);

    const deferred = rohan.action === 'defer' ? rohan : anaya;
    expect(deferred.reason).toBe('daily_budget');
    expect(deferred.deferTo?.getTime()).toBe(ist(26, CONFIG.preferredSendHour).getTime());
  });

  it('18:00 — defers the achievement badge: shared budget is spent', () => {
    const badge = outcome('achievement-badge')[0];
    expect(badge).toMatchObject({ action: 'defer', reason: 'daily_budget' });
    expect(badge.deferTo?.getTime()).toBe(ist(26, CONFIG.preferredSendHour).getTime());
  });

  it('19:00 — STILL sends the overdue fee reminder, using the payment reserve', () => {
    // This is the case the reserve exists for. Three messages already went out,
    // and priority ordering cannot retroactively help — those sends happened
    // before this reminder existed. Without the reserve, the one message that
    // actually collects revenue would be the one that got dropped.
    expect(outcome('fee-overdue-3')[0]).toMatchObject({ action: 'send' });
  });

  it('19:30 — defers a second payment message: the reserve is finite, not a bypass', () => {
    expect(outcome('fee-overdue-again')[0]).toMatchObject({
      action: 'defer',
      reason: 'daily_budget',
    });
  });

  it('drops NOTHING — every deferred message carries a concrete future slot', () => {
    const deferrals = log.filter((entry) => entry.action === 'defer');
    expect(deferrals.length).toBeGreaterThan(0);
    for (const deferral of deferrals) {
      expect(deferral.deferTo).toBeInstanceOf(Date);
      expect(isQuietHour(deferral.deferTo!, CONFIG)).toBe(false);
    }
  });

  it('never exceeds the hard cap no matter how many triggers pile up', () => {
    // 7 triggers, 4 sends. The parent stays subscribed.
    expect(sentCounts[budgetKey(PARENT, '2026-07-25')]).toBeLessThanOrEqual(
      CONFIG.dailyBudget + CONFIG.paymentReserve
    );
  });

  it('produces a human-readable reason for every decision', () => {
    // The owner will ask "why didn't the achievement message go out?"
    const decisions = planDispatch({
      now: ist(25, 18, 0),
      candidates: [candidate('badge', MESSAGE_PRIORITY.ACHIEVEMENT, 'achievement', ist(25, 18, 0))],
      sentCounts: { [budgetKey(PARENT, '2026-07-25')]: 3 },
      config: CONFIG,
    });
    expect(explainDecision(decisions[0], CONFIG)).toMatch(
      /daily budget of 3 message\(s\) is spent/
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// The starvation case the payment reserve exists to prevent
// ═══════════════════════════════════════════════════════════════════════════

describe('payment reminders are never starved by earlier low-priority traffic', () => {
  const now = ist(25, 18, 0);

  it('still sends a fee reminder after the shared budget is already spent', () => {
    // Three messages already went out earlier today — priority ordering cannot
    // help, because those sends already happened before the reminder existed.
    const sentCounts = { [budgetKey(PARENT, '2026-07-25')]: 3 };

    const decisions = planDispatch({
      now,
      candidates: [candidate('payment-overdue', MESSAGE_PRIORITY.PAYMENT, 'fee_overdue_3', ist(25, 18, 0))],
      sentCounts,
      config: CONFIG,
    });

    expect(decisions[0].action).toBe('send');
  });

  it('but a non-payment message in the same situation is deferred', () => {
    const sentCounts = { [budgetKey(PARENT, '2026-07-25')]: 3 };

    const decisions = planDispatch({
      now,
      candidates: [candidate('attendance-late', MESSAGE_PRIORITY.ATTENDANCE, 'attendance_confirmation', ist(25, 18, 0))],
      sentCounts,
      config: CONFIG,
    });

    expect(decisions[0].action).toBe('defer');
    if (decisions[0].action === 'defer') {
      expect(decisions[0].reason).toBe('daily_budget');
    }
  });

  it('the reserve is finite — a second payment message the same day is deferred', () => {
    const sentCounts = { [budgetKey(PARENT, '2026-07-25')]: 4 };

    const decisions = planDispatch({
      now,
      candidates: [candidate('payment-again', MESSAGE_PRIORITY.PAYMENT, 'fee_overdue_3', ist(25, 18, 0))],
      sentCounts,
      config: CONFIG,
    });

    expect(decisions[0].action).toBe('defer');
  });

  it('grants payment exactly one extra slot over other priorities', () => {
    expect(effectiveBudget(MESSAGE_PRIORITY.PAYMENT, CONFIG)).toBe(4);
    expect(effectiveBudget(MESSAGE_PRIORITY.ATTENDANCE, CONFIG)).toBe(3);
    expect(effectiveBudget(MESSAGE_PRIORITY.ACHIEVEMENT, CONFIG)).toBe(3);
    expect(effectiveBudget(MESSAGE_PRIORITY.BROADCAST, CONFIG)).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Budget isolation between parents and across days
// ═══════════════════════════════════════════════════════════════════════════

describe('the budget is per parent, per parent-local day', () => {
  const now = ist(25, 15, 0);

  it("one parent's exhausted budget does not affect another parent", () => {
    const other = '+919123456789';
    const sentCounts = { [budgetKey(PARENT, '2026-07-25')]: 3 };

    const decisions = planDispatch({
      now,
      candidates: [
        candidate('to-capped-parent', MESSAGE_PRIORITY.ATTENDANCE, 'attendance_confirmation', now),
        candidate('to-fresh-parent', MESSAGE_PRIORITY.ATTENDANCE, 'attendance_confirmation', now, other),
      ],
      sentCounts,
      config: CONFIG,
    });

    const result = byId(decisions);
    expect(result['to-capped-parent'].action).toBe('defer');
    expect(result['to-fresh-parent'].action).toBe('send');
  });

  it('siblings share one budget, because they share one parent phone', () => {
    // Two children, one number. Three attendance confirmations would be three
    // messages to the same handset, so they compete for the same three slots.
    const decisions = planDispatch({
      now,
      candidates: [
        candidate('child-1', MESSAGE_PRIORITY.ATTENDANCE, 'attendance_confirmation', now),
        candidate('child-2', MESSAGE_PRIORITY.ATTENDANCE, 'attendance_confirmation', now),
        candidate('child-3', MESSAGE_PRIORITY.ATTENDANCE, 'attendance_confirmation', now),
        candidate('child-4', MESSAGE_PRIORITY.ATTENDANCE, 'attendance_confirmation', now),
      ],
      sentCounts: {},
      config: CONFIG,
    });

    expect(decisions.filter((d) => d.action === 'send')).toHaveLength(3);
    expect(decisions.filter((d) => d.action === 'defer')).toHaveLength(1);
  });

  it('yesterday spending does not count against today', () => {
    const sentCounts = { [budgetKey(PARENT, '2026-07-24')]: 9 };

    const decisions = planDispatch({
      now,
      candidates: [candidate('today', MESSAGE_PRIORITY.ATTENDANCE, 'attendance_confirmation', now)],
      sentCounts,
      config: CONFIG,
    });

    expect(decisions[0].action).toBe('send');
  });

  it('buckets by IST day, not UTC day', () => {
    // 01:00 IST on 26 July is 19:30 UTC on 25 July. A UTC-bucketed cap would
    // roll over mid-evening and hand the parent a fresh allowance.
    const earlyMorningIst = ist(26, 1, 0);
    expect(localDateKey(earlyMorningIst, IST)).toBe('2026-07-26');
    expect(earlyMorningIst.toISOString()).toContain('2026-07-25');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Quiet hours
// ═══════════════════════════════════════════════════════════════════════════

describe('quiet hours (21:00–08:00 IST)', () => {
  it('identifies quiet and active hours correctly', () => {
    expect(isQuietHour(ist(25, 22, 0), CONFIG)).toBe(true);
    expect(isQuietHour(ist(25, 3, 0), CONFIG)).toBe(true);
    expect(isQuietHour(ist(25, 7, 59), CONFIG)).toBe(true);
    expect(isQuietHour(ist(25, 8, 0), CONFIG)).toBe(false);
    expect(isQuietHour(ist(25, 20, 59), CONFIG)).toBe(false);
    expect(isQuietHour(ist(25, 21, 0), CONFIG)).toBe(true);
  });

  it('defers everything sent late at night to the next morning', () => {
    const lateNight = ist(25, 23, 30);
    const decisions = planDispatch({
      now: lateNight,
      candidates: [
        candidate('payment', MESSAGE_PRIORITY.PAYMENT, 'fee_due_today', lateNight),
        candidate('attendance', MESSAGE_PRIORITY.ATTENDANCE, 'attendance_confirmation', lateNight),
      ],
      sentCounts: {},
      config: CONFIG,
    });

    // Even the highest priority waits. A 3am fee reminder is a complaint.
    for (const decision of decisions) {
      expect(decision.action).toBe('defer');
      if (decision.action === 'defer') {
        expect(decision.reason).toBe('quiet_hours');
        expect(decision.deferTo.getTime()).toBe(ist(26, 8).getTime());
      }
    }
  });

  it('defers a small-hours message to the same morning, not the next day', () => {
    const preDawn = ist(25, 4, 0);
    const decisions = planDispatch({
      now: preDawn,
      candidates: [candidate('attendance', MESSAGE_PRIORITY.ATTENDANCE, 'attendance_confirmation', preDawn)],
      sentCounts: {},
      config: CONFIG,
    });

    expect(decisions[0].action).toBe('defer');
    if (decisions[0].action === 'defer') {
      expect(decisions[0].deferTo.getTime()).toBe(ist(25, 8).getTime());
    }
  });

  it('does not charge a quiet-hours deferral against the daily budget', () => {
    // Charging it would silently shrink tomorrow's allowance for a message that
    // was never actually sent.
    const lateNight = ist(25, 23, 0);
    const decisions = planDispatch({
      now: lateNight,
      candidates: [
        candidate('a', MESSAGE_PRIORITY.ATTENDANCE, 'attendance_confirmation', lateNight),
        candidate('b', MESSAGE_PRIORITY.ATTENDANCE, 'attendance_confirmation', lateNight),
        candidate('c', MESSAGE_PRIORITY.ATTENDANCE, 'attendance_confirmation', lateNight),
        candidate('d', MESSAGE_PRIORITY.ATTENDANCE, 'attendance_confirmation', lateNight),
        candidate('e', MESSAGE_PRIORITY.ATTENDANCE, 'attendance_confirmation', lateNight),
      ],
      sentCounts: {},
      config: CONFIG,
    });

    // All five deferred for quiet hours, none for budget.
    expect(decisions.every((d) => d.action === 'defer')).toBe(true);
    expect(
      decisions.every((d) => d.action === 'defer' && d.reason === 'quiet_hours')
    ).toBe(true);
  });

  it('never defers into quiet hours', () => {
    // A deferral target that itself falls in quiet hours would bounce forever.
    for (let hour = 0; hour < 24; hour++) {
      const at = ist(25, hour);
      expect(isQuietHour(nextAllowedSendTime(at, CONFIG), CONFIG)).toBe(false);
      expect(isQuietHour(nextDaySlot(at, CONFIG), CONFIG)).toBe(false);
    }
  });

  it('handles a preferred send hour that falls inside quiet hours', () => {
    const oddConfig: SchedulingConfig = { ...CONFIG, preferredSendHour: 23 };
    const slot = nextDaySlot(ist(25, 15), oddConfig);
    expect(isQuietHour(slot, oddConfig)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Determinism and edge cases
// ═══════════════════════════════════════════════════════════════════════════

describe('planner properties', () => {
  const now = ist(25, 14, 0);

  it('is deterministic regardless of input order', () => {
    const candidates = [
      candidate('a', MESSAGE_PRIORITY.BROADCAST, 'broadcast', now),
      candidate('b', MESSAGE_PRIORITY.PAYMENT, 'fee_due_today', now),
      candidate('c', MESSAGE_PRIORITY.ATTENDANCE, 'attendance_confirmation', now),
      candidate('d', MESSAGE_PRIORITY.ACHIEVEMENT, 'achievement', now),
    ];

    const forward = planDispatch({ now, candidates, sentCounts: {}, config: CONFIG });
    const reversed = planDispatch({
      now,
      candidates: [...candidates].reverse(),
      sentCounts: {},
      config: CONFIG,
    });

    expect(byId(forward)).toEqual(byId(reversed));
  });

  it('does not mutate the caller\'s sentCounts', () => {
    const sentCounts = { [budgetKey(PARENT, '2026-07-25')]: 1 };
    const snapshot = { ...sentCounts };

    planDispatch({
      now,
      candidates: [candidate('x', MESSAGE_PRIORITY.ATTENDANCE, 'attendance_confirmation', now)],
      sentCounts,
      config: CONFIG,
    });

    expect(sentCounts).toEqual(snapshot);
  });

  it('marks a not-yet-due candidate as such without consuming budget', () => {
    const decisions = planDispatch({
      now,
      candidates: [
        candidate('future', MESSAGE_PRIORITY.PAYMENT, 'fee_due_today', ist(26, 10)),
        candidate('now-1', MESSAGE_PRIORITY.ATTENDANCE, 'attendance_confirmation', now),
        candidate('now-2', MESSAGE_PRIORITY.ATTENDANCE, 'attendance_confirmation', now),
        candidate('now-3', MESSAGE_PRIORITY.ATTENDANCE, 'attendance_confirmation', now),
      ],
      sentCounts: {},
      config: CONFIG,
    });

    const result = byId(decisions);
    expect(result['future'].action).toBe('defer');
    if (result['future'].action === 'defer') {
      expect(result['future'].reason).toBe('not_due');
    }
    // The future message did not eat one of the three slots.
    expect(decisions.filter((d) => d.action === 'send')).toHaveLength(3);
  });

  it('returns an empty plan for no candidates', () => {
    expect(planDispatch({ now, candidates: [], sentCounts: {}, config: CONFIG })).toEqual([]);
  });

  it('respects a zero budget by deferring everything except reserved payment', () => {
    const zero: SchedulingConfig = { ...CONFIG, dailyBudget: 0, paymentReserve: 1 };
    const decisions = planDispatch({
      now,
      candidates: [
        candidate('payment', MESSAGE_PRIORITY.PAYMENT, 'fee_due_today', now),
        candidate('attendance', MESSAGE_PRIORITY.ATTENDANCE, 'attendance_confirmation', now),
      ],
      sentCounts: {},
      config: zero,
    });

    const result = byId(decisions);
    expect(result['payment'].action).toBe('send');
    expect(result['attendance'].action).toBe('defer');
  });
});
