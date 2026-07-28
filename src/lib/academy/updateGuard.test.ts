import { describe, it, expect } from 'vitest';
import { filterAcademyUpdate } from './updateGuard';

describe('filterAcademyUpdate', () => {
  it('lets an owner edit their own branding and content', () => {
    const { update, rejected } = filterAcademyUpdate(
      {
        'theme.primaryColor': '#ff0000',
        'theme.footer.phone': '+919000000000',
        'fees.monthly': 1500,
        name: 'Afroz Cricket Academy',
        starPlayers: [{ name: 'A', role: 'Batter' }],
        registeredTeams: [{ name: 'U16', category: 'Under 16' }],
        achievements: ['District champions'],
      },
      false,
    );

    expect(rejected).toEqual([]);
    expect(Object.keys(update)).toHaveLength(7);
    expect(update['theme.primaryColor']).toBe('#ff0000');
  });

  it('blocks the commercial and trust fields an owner must not set', () => {
    const { update, rejected } = filterAcademyUpdate(
      {
        'theme.primaryColor': '#ff0000',
        platformFeePercent: 0,
        verificationStatus: 'founding',
        gwdFoundingAcademy: true,
        ecosystemScore: 100,
        rzp_account: 'acc_attacker',
        settlementStrategy: 'collect_and_manual_payout',
        ownerId: '000000000000000000000000',
        isActive: true,
        slug: 'someone-elses-slug',
        coordinates: { lat: 0, lng: 0 },
      },
      false,
    );

    // Only the legitimate branding change survives.
    expect(update).toEqual({ 'theme.primaryColor': '#ff0000' });
    expect(rejected).toEqual(
      expect.arrayContaining([
        'platformFeePercent',
        'verificationStatus',
        'gwdFoundingAcademy',
        'ecosystemScore',
        'rzp_account',
        'settlementStrategy',
        'ownerId',
        'isActive',
        'slug',
        'coordinates',
      ]),
    );
  });

  it('refuses mongo operators, which would bypass the allowlist entirely', () => {
    const { update, rejected } = filterAcademyUpdate(
      { $set: { platformFeePercent: 0 }, $unset: { ownerId: 1 } },
      false,
    );
    expect(update).toEqual({});
    expect(rejected).toEqual(['$set', '$unset']);
  });

  it('does not let a nested path smuggle a protected root through', () => {
    const { update, rejected } = filterAcademyUpdate(
      { 'platformFeePercent.value': 0, 'ownerId.x': 'y' },
      false,
    );
    expect(update).toEqual({});
    expect(rejected).toEqual(['platformFeePercent.value', 'ownerId.x']);
  });

  it('passes everything through untouched for a super admin', () => {
    const payload = {
      platformFeePercent: 2.5,
      verificationStatus: 'verified',
      ecosystemScore: 90,
    };
    const { update, rejected } = filterAcademyUpdate(payload, true);
    expect(update).toEqual(payload);
    expect(rejected).toEqual([]);
  });

  it('tolerates an empty or missing body', () => {
    expect(filterAcademyUpdate({}, false).update).toEqual({});
    expect(filterAcademyUpdate(undefined as any, false).update).toEqual({});
  });
});
