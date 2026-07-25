import { describe, it, expect } from 'vitest';
import {
  explainMessage,
  MESSAGE_STATUS_GROUPS,
  type ExplainableMessage,
} from './explain';
import { DEFAULT_SCHEDULING_CONFIG } from './scheduling';
import { MESSAGE_PRIORITY, type MessageStatus } from '@/lib/models/OutboundMessage';

const CONFIG = DEFAULT_SCHEDULING_CONFIG;
const IST = CONFIG.timezoneOffsetMinutes;

/** A Date from an IST wall-clock time, so the assertions read in local terms. */
function ist(day: number, hour: number, minute = 0): Date {
  return new Date(Date.UTC(2026, 6, day, hour, minute) - IST * 60_000);
}

const NOW = ist(20, 12, 0); // 20 July 2026, noon IST

function message(overrides: Partial<ExplainableMessage> = {}): ExplainableMessage {
  return {
    status: 'queued',
    channel: 'whatsapp',
    priority: MESSAGE_PRIORITY.ATTENDANCE,
    scheduledFor: NOW,
    attempts: 0,
    deferrals: 0,
    ...overrides,
  };
}

describe('explainMessage — every status produces an answer', () => {
  const ALL_STATUSES: MessageStatus[] = [
    'queued',
    'sending',
    'sent',
    'delivered',
    'read',
    'failed',
    'cancelled',
    'skipped',
  ];

  it.each(ALL_STATUSES)('%s has a non-empty headline and detail', (status) => {
    const result = explainMessage(message({ status }), CONFIG, NOW);
    expect(result.headline.length).toBeGreaterThan(0);
    expect(result.detail.length).toBeGreaterThan(0);
  });

  it('never leaves a status unhandled', () => {
    // Guards against a status being added to the model without a sentence here.
    for (const status of ALL_STATUSES) {
      const result = explainMessage(message({ status }), CONFIG, NOW);
      expect(result.detail).not.toMatch(/Unrecognised status/);
    }
  });
});

describe('queued — the four situations that share one status', () => {
  it('a quiet-hours deferral says when it will go out and that it was not dropped', () => {
    const result = explainMessage(
      message({
        deferrals: 1,
        lastDeferralReason: 'quiet_hours',
        scheduledFor: ist(21, 8, 0),
      }),
      CONFIG,
      NOW
    );

    expect(result.state).toBe('held');
    expect(result.headline).toBe('Held back');
    expect(result.detail).toMatch(/quiet hours/i);
    expect(result.detail).toMatch(/21 Jul, 08:00/);
    expect(result.detail).toMatch(/not been dropped/i);
    expect(result.terminal).toBe(false);
  });

  it('a budget deferral quotes the cap that actually applied to this priority', () => {
    const payment = explainMessage(
      message({
        priority: MESSAGE_PRIORITY.PAYMENT,
        deferrals: 2,
        lastDeferralReason: 'daily_budget',
        scheduledFor: ist(21, 10, 0),
      }),
      CONFIG,
      NOW
    );
    const broadcast = explainMessage(
      message({
        priority: MESSAGE_PRIORITY.BROADCAST,
        deferrals: 1,
        lastDeferralReason: 'daily_budget',
        scheduledFor: ist(21, 10, 0),
      }),
      CONFIG,
      NOW
    );

    // Payment gets the shared budget plus its reserve; a broadcast does not.
    expect(payment.detail).toMatch(
      new RegExp(`${CONFIG.dailyBudget + CONFIG.paymentReserve} message`)
    );
    expect(broadcast.detail).toMatch(new RegExp(`${CONFIG.dailyBudget} message`));
    expect(payment.detail).toMatch(/held 2 time/);
  });

  it('a future scheduledFor with no deferrals is healthy, not stuck', () => {
    const result = explainMessage(
      message({ scheduledFor: ist(22, 10, 0) }),
      CONFIG,
      NOW
    );
    expect(result.state).toBe('waiting');
    expect(result.headline).toBe('Scheduled');
    expect(result.detail).toMatch(/healthy/i);
  });

  it('a due message with no deferrals points at the next cron tick', () => {
    const result = explainMessage(
      message({ scheduledFor: ist(20, 11, 0) }),
      CONFIG,
      NOW
    );
    expect(result.state).toBe('waiting');
    expect(result.headline).toBe('Due now');
    expect(result.detail).toMatch(/15 minutes/);
  });

  it('a retry after a transient error reads as a problem, not as waiting', () => {
    const result = explainMessage(
      message({
        attempts: 2,
        error: 'upstream timeout',
        scheduledFor: ist(20, 12, 15),
      }),
      CONFIG,
      NOW
    );
    expect(result.state).toBe('problem');
    expect(result.headline).toBe('Retrying');
    expect(result.detail).toMatch(/upstream timeout/);
    expect(result.terminal).toBe(false);
  });

  it('a deferral outranks an attempt count when both are present', () => {
    // A message that failed once and was later deferred should read as held —
    // the deferral is the reason it is not going out right now.
    const result = explainMessage(
      message({
        attempts: 1,
        error: 'upstream timeout',
        deferrals: 1,
        lastDeferralReason: 'daily_budget',
        scheduledFor: ist(21, 10, 0),
      }),
      CONFIG,
      NOW
    );
    expect(result.headline).toBe('Held back');
  });
});

describe('not-sent statuses are told apart correctly', () => {
  it('a missing provider is an activation gap, not a delivery failure', () => {
    const result = explainMessage(
      message({
        status: 'skipped',
        error: 'No WhatsApp provider configured',
      }),
      CONFIG,
      NOW
    );

    expect(result.state).toBe('stopped');
    expect(result.headline).toMatch(/provider not connected/i);
    // The load-bearing sentence: with no credentials every message skips, and
    // an owner must not read a screen of these as "the system is broken".
    expect(result.detail).toMatch(/Nothing is wrong with this message/);
    expect(result.terminal).toBe(true);
  });

  it('the SMS fallback DLT gap is also recognised as an activation gap', () => {
    const result = explainMessage(
      message({
        status: 'skipped',
        channel: 'sms',
        error:
          'No SMS provider configured. Indian SMS also requires a DLT-registered template.',
      }),
      CONFIG,
      NOW
    );
    expect(result.headline).toMatch(/provider not connected/i);
  });

  it('a policy skip is not dressed up as an activation gap', () => {
    const result = explainMessage(
      message({ status: 'skipped', error: 'recipient opted out' }),
      CONFIG,
      NOW
    );
    expect(result.headline).toBe('Skipped');
    expect(result.detail).toMatch(/recipient opted out/);
  });

  it('a cancellation reads as the system correctly staying quiet', () => {
    const result = explainMessage(
      message({
        status: 'cancelled',
        error: 'fee paid before the reminder was due',
      }),
      CONFIG,
      NOW
    );
    expect(result.state).toBe('stopped');
    expect(result.detail).toMatch(/fee paid before the reminder was due/);
    expect(result.detail).toMatch(/correctly staying quiet/i);
  });

  it('a genuine failure surfaces the provider reason verbatim', () => {
    const result = explainMessage(
      message({
        status: 'failed',
        attempts: 3,
        failedAt: ist(20, 11, 30),
        error: 'template gwd_fee_reminder_v1 is not approved',
      }),
      CONFIG,
      NOW
    );
    expect(result.state).toBe('problem');
    expect(result.detail).toMatch(/template gwd_fee_reminder_v1 is not approved/);
    expect(result.detail).toMatch(/3 attempt/);
    expect(result.terminal).toBe(true);
  });

  it('mentions the SMS fallback when one was raised for a failure', () => {
    const result = explainMessage(
      message({
        status: 'failed',
        failedAt: ist(20, 11, 30),
        error: 'undeliverable',
        fallbackMessageId: 'abc123',
      }),
      CONFIG,
      NOW
    );
    expect(result.detail).toMatch(/SMS fallback was raised/i);
  });

  it('labels a row that IS the fallback, so it is not mistaken for a duplicate', () => {
    const result = explainMessage(
      message({ status: 'queued', fallbackForMessageId: 'abc123' }),
      CONFIG,
      NOW
    );
    expect(result.detail).toMatch(/This is the SMS fallback/);
  });
});

describe('in-flight statuses', () => {
  it('sent is not yet delivered, and says so', () => {
    const result = explainMessage(
      message({ status: 'sent', provider: 'interakt', sentAt: ist(20, 11, 0) }),
      CONFIG,
      NOW
    );
    expect(result.state).toBe('in_flight');
    expect(result.detail).toMatch(/interakt/);
    expect(result.detail).toMatch(/20 Jul, 11:00/);
    expect(result.terminal).toBe(false);
  });

  it('read is the only terminal success', () => {
    const delivered = explainMessage(
      message({ status: 'delivered', deliveredAt: ist(20, 11, 1) }),
      CONFIG,
      NOW
    );
    const read = explainMessage(
      message({ status: 'read', readAt: ist(20, 11, 5) }),
      CONFIG,
      NOW
    );
    expect(delivered.state).toBe('landed');
    expect(delivered.terminal).toBe(false);
    expect(read.state).toBe('landed');
    expect(read.terminal).toBe(true);
  });

  it('a stuck sending row explains that the next tick recovers it', () => {
    const result = explainMessage(message({ status: 'sending' }), CONFIG, NOW);
    expect(result.state).toBe('in_flight');
    expect(result.detail).toMatch(/next tick/i);
  });
});

describe('timestamps are rendered in IST', () => {
  it('shifts a UTC instant into the reader\'s timezone', () => {
    // 20 July 2026 06:30 UTC is 12:00 IST.
    const result = explainMessage(
      message({ status: 'sent', sentAt: new Date(Date.UTC(2026, 6, 20, 6, 30)) }),
      CONFIG,
      NOW
    );
    expect(result.detail).toMatch(/20 Jul, 12:00/);
  });

  it('survives a missing or unparseable timestamp', () => {
    const result = explainMessage(
      message({ status: 'sent', sentAt: null }),
      CONFIG,
      NOW
    );
    expect(result.detail).toMatch(/an unknown time/);
  });

  it('accepts an ISO string as readily as a Date, since lean() returns either', () => {
    const result = explainMessage(
      message({ status: 'sent', sentAt: ist(20, 11, 0).toISOString() }),
      CONFIG,
      NOW
    );
    expect(result.detail).toMatch(/20 Jul, 11:00/);
  });
});

describe('MESSAGE_STATUS_GROUPS', () => {
  it('covers every status exactly once, so no row is unfilterable', () => {
    const ALL: MessageStatus[] = [
      'queued',
      'sending',
      'sent',
      'delivered',
      'read',
      'failed',
      'cancelled',
      'skipped',
    ];
    const grouped = Object.values(MESSAGE_STATUS_GROUPS).flat();
    expect([...grouped].sort()).toEqual([...ALL].sort());
    expect(new Set(grouped).size).toBe(grouped.length);
  });
});
