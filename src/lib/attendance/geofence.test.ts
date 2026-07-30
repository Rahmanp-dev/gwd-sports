import { describe, it, expect } from 'vitest';
import {
  ACCURACY_ALLOWANCE_M,
  MAX_USABLE_ACCURACY_M,
  distanceMeters,
  evaluateGeofence,
  formatDistance,
  isValidLatLng,
  normaliseRadius,
  resolveGeofenceCentre,
} from './geofence';

/** Gachibowli Stadium, Hyderabad — a real ground, used as the fence centre. */
const GROUND = { lat: 17.4401, lng: 78.3489 };

describe('distanceMeters', () => {
  it('is zero for the same point', () => {
    expect(distanceMeters(GROUND, GROUND)).toBe(0);
  });

  it('is symmetric', () => {
    const other = { lat: 17.45, lng: 78.36 };
    expect(distanceMeters(GROUND, other)).toBeCloseTo(distanceMeters(other, GROUND), 6);
  });

  it('matches a known separation', () => {
    // 0.001° of latitude is ~111m anywhere on Earth.
    const north = { lat: GROUND.lat + 0.001, lng: GROUND.lng };
    expect(distanceMeters(GROUND, north)).toBeGreaterThan(105);
    expect(distanceMeters(GROUND, north)).toBeLessThan(118);
  });

  it('handles antipodal-ish distances without NaN from a domain error', () => {
    // sqrt(h) can exceed 1 by floating error; the clamp in asin guards it.
    const d = distanceMeters({ lat: 0, lng: 0 }, { lat: 0, lng: 180 });
    expect(Number.isFinite(d)).toBe(true);
    expect(d).toBeGreaterThan(19_000_000);
  });
});

describe('isValidLatLng', () => {
  it('accepts a real coordinate', () => {
    expect(isValidLatLng(GROUND)).toBe(true);
  });

  it('rejects 0,0 — the value a half-filled form produces, never a real academy', () => {
    expect(isValidLatLng({ lat: 0, lng: 0 })).toBe(false);
  });

  it('rejects out-of-range, non-finite and missing values', () => {
    expect(isValidLatLng({ lat: 91, lng: 0 })).toBe(false);
    expect(isValidLatLng({ lat: 0, lng: 181 })).toBe(false);
    expect(isValidLatLng({ lat: NaN, lng: 10 })).toBe(false);
    expect(isValidLatLng(null)).toBe(false);
    expect(isValidLatLng({})).toBe(false);
    expect(isValidLatLng({ lat: '17.4', lng: '78.3' })).toBe(false);
  });
});

describe('normaliseRadius', () => {
  it('clamps rather than trusting owner input', () => {
    expect(normaliseRadius(10)).toBe(50);
    expect(normaliseRadius(99999)).toBe(5000);
    expect(normaliseRadius(250)).toBe(250);
  });

  it('falls back to the default for garbage', () => {
    expect(normaliseRadius(undefined)).toBe(200);
    expect(normaliseRadius('abc')).toBe(200);
    expect(normaliseRadius(NaN)).toBe(200);
  });
});

describe('resolveGeofenceCentre', () => {
  it('prefers the attendance location over the public map pin', () => {
    const attendance = { lat: 17.5, lng: 78.4 };
    expect(resolveGeofenceCentre(attendance, GROUND)).toEqual(attendance);
  });

  it('falls back to the map pin when no attendance location is set', () => {
    expect(resolveGeofenceCentre(null, GROUND)).toEqual(GROUND);
    expect(resolveGeofenceCentre({ lat: 0, lng: 0 }, GROUND)).toEqual(GROUND);
  });

  it('returns null when neither is usable', () => {
    expect(resolveGeofenceCentre(null, null)).toBeNull();
  });
});

describe('evaluateGeofence', () => {
  const enabled = { enabled: true, radiusMeters: 200, centre: GROUND };

  it('passes straight through when disabled, even with no location', () => {
    const v = evaluateGeofence({ enabled: false }, null);
    expect(v.ok).toBe(true);
    expect(v.ok && v.reason).toBe('disabled');
  });

  /**
   * The important safety property: enabling the fence before setting the
   * ground must not lock every student out of a working feature.
   */
  it('FAILS OPEN when enabled but no centre is configured', () => {
    const v = evaluateGeofence({ enabled: true, centre: null }, null);
    expect(v.ok).toBe(true);
    expect(v.ok && v.reason).toBe('not_configured');
  });

  it('refuses when a location is required but not supplied', () => {
    const v = evaluateGeofence(enabled, null);
    expect(v.ok).toBe(false);
    expect(!v.ok && v.code).toBe('location_required');
  });

  it('refuses a fix whose accuracy makes it meaningless', () => {
    const v = evaluateGeofence(enabled, {
      ...GROUND,
      accuracy: MAX_USABLE_ACCURACY_M + 1,
    });
    expect(v.ok).toBe(false);
    expect(!v.ok && v.code).toBe('accuracy_too_poor');
  });

  it('accepts someone standing at the ground', () => {
    const v = evaluateGeofence(enabled, { ...GROUND, accuracy: 12 });
    expect(v.ok).toBe(true);
    expect(v.ok && v.reason).toBe('inside');
    expect(v.ok && v.distanceMeters).toBe(0);
  });

  it('rejects someone plainly at home', () => {
    // ~5km away.
    const v = evaluateGeofence(enabled, { lat: 17.485, lng: 78.349, accuracy: 10 });
    expect(v.ok).toBe(false);
    expect(!v.ok && v.code).toBe('outside');
    expect(!v.ok && v.distanceMeters).toBeGreaterThan(4000);
  });

  it('gives a poor-but-usable fix the benefit of the doubt, up to the allowance', () => {
    // 280m out, radius 200 — outside on a point comparison, but a 90m
    // accuracy circle reaches the fence, so a real student indoors passes.
    const near = { lat: GROUND.lat + 0.00252, lng: GROUND.lng };
    expect(Math.round(distanceMeters(GROUND, near))).toBeGreaterThan(200);
    const v = evaluateGeofence(enabled, { ...near, accuracy: 90 });
    expect(v.ok).toBe(true);
  });

  it('caps how far a claimed accuracy can widen the fence', () => {
    // Far outside, claiming enormous-but-still-usable accuracy. The allowance
    // is bounded, so this must not become a bypass.
    const far = { lat: GROUND.lat + 0.008, lng: GROUND.lng }; // ~890m
    const v = evaluateGeofence(enabled, { ...far, accuracy: MAX_USABLE_ACCURACY_M });
    expect(v.ok).toBe(false);
    expect(!v.ok && v.allowedMeters).toBe(200 + ACCURACY_ALLOWANCE_M);
  });

  it('treats a missing accuracy as unknown rather than as perfect', () => {
    // No accuracy: no widening at all, so a point just outside stays outside.
    const near = { lat: GROUND.lat + 0.0025, lng: GROUND.lng };
    const v = evaluateGeofence(enabled, near);
    expect(v.ok).toBe(false);
  });

  it('clamps an absurd configured radius instead of honouring it', () => {
    const v = evaluateGeofence(
      { enabled: true, radiusMeters: 10, centre: GROUND },
      { ...GROUND, accuracy: 5 },
    );
    // Radius floors at 50m, so standing at the centre still passes.
    expect(v.ok).toBe(true);
  });
});

describe('formatDistance', () => {
  it('reads naturally at both scales', () => {
    expect(formatDistance(120)).toBe('120m');
    expect(formatDistance(999)).toBe('999m');
    expect(formatDistance(1500)).toBe('1.5km');
  });
});
