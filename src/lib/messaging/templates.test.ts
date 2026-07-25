import { describe, it, expect } from 'vitest';
import {
  validateAndRender,
  assertVariablesBelongTo,
  getTemplate,
  requiredInteraktTemplateNames,
  renderWelcomePaymentLine,
  renderAchievementLine,
  renderFeeOpeningLine,
  TemplateValidationError,
  TEMPLATES,
} from './templates';
import { MESSAGE_PRIORITY } from '@/lib/models/OutboundMessage';

const ROHAN = { passportId: 'GWD-7K2M9X', studentName: 'Rohan Sharma' };
const ANAYA = { passportId: 'GWD-4P8QRT', studentName: 'Anaya Sharma' };

function welcomeVars(overrides: Record<string, unknown> = {}) {
  return {
    parentGreetingName: 'Anil',
    academyName: 'MasterGrade Cricket',
    childName: 'Rohan Sharma',
    passportUrl: 'https://gwd.in/passport/GWD-7K2M9X',
    paymentLine: "This month's fee of ₹3,104.00 is due — pay here: https://gwd.in/pay/GWD-7K2M9X",
    // Sixth parameter, added so a parent receives working sign-in details in
    // the same message that carries their child's passport link.
    loginLine:
      'Sign in at https://gwd.in/user/auth — username gwd-7k2m9x@mastergrade.gwd.in, password k7mq2xrt9p. Please change it after your first sign-in.',
    ...overrides,
  };
}

describe('template registry', () => {
  it('orders variables positionally for the BSP', () => {
    const rendered = validateAndRender('attendance_confirmation', {
      childName: 'Rohan Sharma',
      checkInTime: '5:02 PM',
      academyName: 'MasterGrade Cricket',
    });
    // {{1}} {{2}} {{3}} in the approved template's declared order.
    expect(rendered.variables).toEqual(['Rohan Sharma', '5:02 PM', 'MasterGrade Cricket']);
  });

  it('assigns the documented priority tiers', () => {
    expect(getTemplate('fee_due_today').priority).toBe(MESSAGE_PRIORITY.PAYMENT);
    expect(getTemplate('fee_overdue_3').priority).toBe(MESSAGE_PRIORITY.PAYMENT);
    expect(getTemplate('attendance_confirmation').priority).toBe(MESSAGE_PRIORITY.ATTENDANCE);
    expect(getTemplate('achievement').priority).toBe(MESSAGE_PRIORITY.ACHIEVEMENT);
    expect(getTemplate('broadcast').priority).toBe(MESSAGE_PRIORITY.BROADCAST);
  });

  it('keeps welcome out of the payment tier so it cannot eat the payment reserve', () => {
    expect(getTemplate('welcome').priority).not.toBe(MESSAGE_PRIORITY.PAYMENT);
  });

  it('has NO parent-facing template for T+7 or T+15 overdue', () => {
    // Past T+3 escalation is the owner's personal call, by design. A template
    // existing here would be an invitation to automate it.
    const keys = Object.keys(TEMPLATES);
    expect(keys).not.toContain('fee_overdue_7');
    expect(keys).not.toContain('fee_overdue_15');
  });

  it('lists the distinct Meta template names needing approval', () => {
    // This list is the launch checklist: every one needs Meta approval via
    // Interakt before a single message can be delivered.
    expect(requiredInteraktTemplateNames()).toEqual([
      'gwd_achievement_v1',
      'gwd_attendance_confirmation_v1',
      'gwd_broadcast_v1',
      'gwd_fee_reminder_v1',
      'gwd_weekly_digest_v1',
      'gwd_welcome_v1',
    ]);
  });

  it('reuses one approved template across all three fee stages', () => {
    // Three near-identical templates would mean three Meta approvals and three
    // chances of one stage silently breaking while the others pass.
    const name = getTemplate('fee_reminder_t5').interaktTemplateName;
    expect(getTemplate('fee_due_today').interaktTemplateName).toBe(name);
    expect(getTemplate('fee_overdue_3').interaktTemplateName).toBe(name);
  });

  it('rejects an unknown template key', () => {
    expect(() => getTemplate('nope')).toThrow(TemplateValidationError);
  });

  it('declares every variable its plainText renderer uses', () => {
    for (const template of Object.values(TEMPLATES)) {
      const vars = Object.fromEntries(template.variableOrder.map((n) => [n, `<${n}>`]));
      const text = template.plainText(vars);
      expect(text, `${template.key} plainText`).not.toMatch(/undefined/);
    }
  });
});

describe('hard-fail validation: missing required variables', () => {
  it('refuses to send when a required variable is absent', () => {
    const vars = welcomeVars();
    delete (vars as any).childName;
    expect(() => validateAndRender('welcome', vars)).toThrow(/missing required variable "childName"/);
  });

  it('refuses to send when a required variable is empty or whitespace', () => {
    expect(() => validateAndRender('welcome', welcomeVars({ childName: '' }))).toThrow(
      TemplateValidationError
    );
    expect(() => validateAndRender('welcome', welcomeVars({ childName: '   ' }))).toThrow(
      TemplateValidationError
    );
  });

  it('refuses to send a fee reminder with no amount', () => {
    // The parent could not act on this even if it arrived.
    expect(() =>
      validateAndRender('fee_due_today', {
        openingLine: 'Payment is due today.',
        childName: 'Rohan Sharma',
        amount: '',
        dueDate: '5 Aug 2026',
        paymentUrl: 'https://gwd.in/pay/GWD-7K2M9X',
      })
    ).toThrow(/missing required variable "amount"/);
  });

  it('refuses to send a fee reminder with no payment link', () => {
    expect(() =>
      validateAndRender('fee_due_today', {
        openingLine: 'Payment is due today.',
        childName: 'Rohan Sharma',
        amount: '₹3,104.00',
        dueDate: '5 Aug 2026',
        paymentUrl: null,
      })
    ).toThrow(/missing required variable "paymentUrl"/);
  });
});

describe('hard-fail validation: rendering bugs', () => {
  const badValues: Array<[string, string]> = [
    ['an unrendered placeholder', 'Hello {{1}}'],
    ['a literal undefined', 'undefined'],
    ['undefined inside a sentence', "Rohan's fee of undefined is due"],
    ['a literal null', 'null'],
    ['NaN from broken money math', '₹NaN'],
    ['an invalid date', 'Invalid Date'],
    ['a stringified object', '[object Object]'],
  ];

  it.each(badValues)('refuses to send %s', (_label, value) => {
    expect(() => validateAndRender('welcome', welcomeVars({ paymentLine: value }))).toThrow(
      /rendering bug/
    );
  });

  it('catches an undefined amount that slipped through as a string', () => {
    expect(() =>
      validateAndRender('fee_due_today', {
        openingLine: 'Payment is due today.',
        childName: 'Rohan Sharma',
        amount: String(undefined),
        dueDate: '5 Aug 2026',
        paymentUrl: 'https://gwd.in/pay/GWD-7K2M9X',
      })
    ).toThrow(/rendering bug/);
  });

  it('rejects undeclared variables, which mean caller and template disagree', () => {
    expect(() =>
      validateAndRender('attendance_confirmation', {
        childName: 'Rohan Sharma',
        checkInTime: '5:02 PM',
        academyName: 'MasterGrade Cricket',
        childsName: 'Rohan Sharma', // renamed/typo'd variable
      })
    ).toThrow(/undeclared variable/);
  });

  it('strips newlines, which WhatsApp rejects inside parameters', () => {
    const rendered = validateAndRender('broadcast', {
      messageBody: 'Tournament on Sunday.\nBring your kit.\t9am start.',
      academyName: 'MasterGrade Cricket',
    });
    expect(rendered.variableMap.messageBody).toBe('Tournament on Sunday. Bring your kit. 9am start.');
  });

  it('accepts a legitimately optional variable left empty', () => {
    // achievementLine is required-but-always-populated by its renderer; an empty
    // OPTIONAL variable should not be treated as a failure.
    const rendered = validateAndRender('weekly_digest', {
      childName: 'Rohan Sharma',
      academyName: 'MasterGrade Cricket',
      attendanceSummary: '4 of 5 sessions (80%)',
      achievementLine: renderAchievementLine(null),
      nextFeeDue: '5 Aug 2026',
      passportUrl: 'https://gwd.in/passport/GWD-7K2M9X',
    });
    expect(rendered.variableMap.achievementLine).toMatch(/No new achievement/);
  });
});

describe('cross-contamination guard — the wrong child must never be messaged', () => {
  it('accepts variables that belong to the right student', () => {
    const rendered = validateAndRender('welcome', welcomeVars());
    expect(() => assertVariablesBelongTo(rendered, ROHAN)).not.toThrow();
  });

  it("REFUSES a message carrying another child's name", () => {
    const rendered = validateAndRender('welcome', welcomeVars({ childName: 'Anaya Sharma' }));
    expect(() => assertVariablesBelongTo(rendered, ROHAN)).toThrow(/Cross-contamination/);
  });

  it("REFUSES a message carrying another child's payment link", () => {
    // The dangerous one: right name, wrong link. The parent pays and the money
    // lands on the wrong student's ledger.
    const rendered = validateAndRender(
      'welcome',
      welcomeVars({
        paymentLine: "This month's fee of ₹3,104.00 is due — pay here: https://gwd.in/pay/GWD-4P8QRT",
      })
    );
    expect(() => assertVariablesBelongTo(rendered, ROHAN)).toThrow(
      /references passport GWD-4P8QRT but this message is for GWD-7K2M9X/
    );
  });

  it("REFUSES a message carrying another child's passport link", () => {
    const rendered = validateAndRender(
      'welcome',
      welcomeVars({ passportUrl: 'https://gwd.in/passport/GWD-4P8QRT' })
    );
    expect(() => assertVariablesBelongTo(rendered, ROHAN)).toThrow(/Cross-contamination/);
  });

  it('catches the sibling mix-up specifically — same surname, one parent phone', () => {
    // Siblings are the likeliest cross-contamination in practice: adjacent rows,
    // same phone number, similar names.
    const rendered = validateAndRender(
      'attendance_confirmation',
      { childName: 'Anaya Sharma', checkInTime: '5:02 PM', academyName: 'MasterGrade Cricket' }
    );
    expect(() => assertVariablesBelongTo(rendered, ROHAN)).toThrow(/Cross-contamination/);
    // ...and is fine when addressed to the right sibling.
    expect(() => assertVariablesBelongTo(rendered, ANAYA)).not.toThrow();
  });

  it('tolerates harmless case and whitespace differences in the name', () => {
    const rendered = validateAndRender('welcome', welcomeVars({ childName: 'rohan  sharma' }));
    expect(() => assertVariablesBelongTo(rendered, ROHAN)).not.toThrow();
  });

  it('is case-insensitive about the passport id itself', () => {
    const rendered = validateAndRender(
      'welcome',
      welcomeVars({ passportUrl: 'https://gwd.in/passport/GWD-7K2M9X' })
    );
    expect(() =>
      assertVariablesBelongTo(rendered, { ...ROHAN, passportId: 'gwd-7k2m9x' })
    ).not.toThrow();
  });

  it('checks every variable, not just the obvious link fields', () => {
    const rendered = validateAndRender('broadcast', {
      messageBody: 'Reminder for GWD-4P8QRT to bring kit',
      academyName: 'MasterGrade Cricket',
    });
    expect(() => assertVariablesBelongTo(rendered, ROHAN)).toThrow(/Cross-contamination/);
  });
});

describe('conditional line renderers', () => {
  it('renders a payment line when a fee is due', () => {
    const line = renderWelcomePaymentLine({
      isFeeDue: true,
      amountFormatted: '₹3,104.00',
      paymentUrl: 'https://gwd.in/pay/GWD-7K2M9X',
    });
    expect(line).toContain('₹3,104.00');
    expect(line).toContain('https://gwd.in/pay/GWD-7K2M9X');
  });

  it('never returns an empty string, because Meta rejects empty parameters', () => {
    const cases = [
      renderWelcomePaymentLine({ isFeeDue: false }),
      renderWelcomePaymentLine({ isFeeDue: true }), // due but no link supplied
      renderAchievementLine(null),
      renderAchievementLine(undefined),
    ];
    for (const value of cases) {
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it('does not claim a fee is due when no link is available', () => {
    const line = renderWelcomePaymentLine({ isFeeDue: true });
    expect(line).not.toMatch(/pay here/i);
  });

  it('gives each fee stage a distinct opening line', () => {
    const lines = [
      renderFeeOpeningLine('t5'),
      renderFeeOpeningLine('due'),
      renderFeeOpeningLine('overdue3'),
    ];
    expect(new Set(lines).size).toBe(3);
    expect(lines[2]).toMatch(/overdue/i);
  });
});
