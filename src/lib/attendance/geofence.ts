/**
 * ════════════════════════════════════════════════════════════════════════════
 * "ARE THEY ACTUALLY AT THE GROUND?"
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The session window (session.ts) already stops a photographed QR code being
 * useful at 3am. It does nothing about a code photographed and used from home
 * DURING the session — which is the obvious way to fake attendance once a
 * parent works out the URL is stable.
 *
 * This adds the other axis: the scan must come from near the ground.
 *
 * ⚠️ WHAT THIS IS NOT. Browser geolocation is supplied BY THE CLIENT. A
 * determined person can override it from devtools or a spoofing app, and no
 * amount of server-side maths changes that. This raises the effort required
 * from "photograph a code" to "deliberately falsify your device location" —
 * a real deterrent for casual convenience-cheating, and not a proof of
 * presence. Anything that must be certain still needs the coach's own mark
 * (`source: 'coach'`), which is why that path exists and is unaffected.
 *
 * ── ON ACCURACY, WHICH IS THE WHOLE DIFFICULTY ──
 *
 * `coords.accuracy` is a RADIUS in metres, not a quality score: the device is
 * claiming "68% chance the true position is within this circle". Indoors, or
 * on a phone falling back to wifi/cell positioning, it is routinely 50–2000m
 * — often larger than any geofence worth setting.
 *
 * Treating a reading as a point and comparing to the radius would therefore
 * reject real students standing in the clubhouse. Trusting the accuracy
 * circle in full would let someone 2km away pass by reporting a huge
 * accuracy. So:
 *
 *   • a reading worse than MAX_USABLE_ACCURACY_M is refused as unusable —
 *     the answer is "move outside and retry", not a silent pass or fail;
 *   • otherwise the fence is widened by the reported accuracy, but only up to
 *     ACCURACY_ALLOWANCE_M, so a fabricated accuracy buys a bounded amount.
 *
 * The bias is deliberate and asymmetric: a false REJECT strands a child who
 * really is at training and makes the feature feel broken, which is worse
 * than a false ACCEPT that the coach's own register would catch anyway.
 * ════════════════════════════════════════════════════════════════════════════
 */

/** Beyond this the fix tells us nothing useful; ask for a better one. */
export const MAX_USABLE_ACCURACY_M = 500;

/** The most a claimed accuracy may widen the fence. */
export const ACCURACY_ALLOWANCE_M = 100;

export const DEFAULT_RADIUS_M = 200;
export const MIN_RADIUS_M = 50;
export const MAX_RADIUS_M = 5000;

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeofenceConfig {
  enabled: boolean;
  radiusMeters?: number | null;
  /** The ground. Falls back to the academy's public map pin — see resolveGeofenceCentre. */
  centre?: LatLng | null;
}

export interface DeviceFix {
  lat: number;
  lng: number;
  /** Metres, from `coords.accuracy`. Absent is treated as unknown, not as zero. */
  accuracy?: number | null;
}

export type GeofenceVerdict =
  | { ok: true; reason: 'disabled' | 'not_configured' | 'inside'; distanceMeters?: number }
  | {
      ok: false;
      code: 'location_required' | 'accuracy_too_poor' | 'outside';
      reason: string;
      distanceMeters?: number;
      allowedMeters?: number;
    };

const EARTH_RADIUS_M = 6_371_008.8;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Finite, and inside the ranges a real coordinate can occupy. */
export function isValidLatLng(value: unknown): value is LatLng {
  const v = value as LatLng | null;
  return Boolean(
    v &&
      typeof v.lat === 'number' &&
      typeof v.lng === 'number' &&
      Number.isFinite(v.lat) &&
      Number.isFinite(v.lng) &&
      Math.abs(v.lat) <= 90 &&
      Math.abs(v.lng) <= 180 &&
      // 0,0 is in the Atlantic. It is never a real academy, and it IS the
      // value you get from a half-initialised form, so reject it as unset.
      !(v.lat === 0 && v.lng === 0),
  );
}

/**
 * Great-circle distance in metres.
 *
 * Haversine rather than a flat-earth approximation: the error of the naive
 * equirectangular shortcut grows with latitude, and this runs for academies
 * anywhere. At the scale of a geofence the cost difference is irrelevant.
 */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Clamps an owner-supplied radius into something sane. */
export function normaliseRadius(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_RADIUS_M;
  return Math.min(MAX_RADIUS_M, Math.max(MIN_RADIUS_M, Math.round(n)));
}

/**
 * The geofence centre: the academy's own attendance location if set, otherwise
 * its public map pin.
 *
 * Two separate fields on purpose. The marketing pin may be an office or a
 * rough town-centre marker, while training happens on a field a kilometre
 * away — silently reusing the pin as the fence centre would lock out every
 * student at academies where those differ.
 */
export function resolveGeofenceCentre(
  attendanceCentre: unknown,
  mapPin: unknown,
): LatLng | null {
  if (isValidLatLng(attendanceCentre)) return attendanceCentre;
  if (isValidLatLng(mapPin)) return mapPin;
  return null;
}

/**
 * The gate.
 *
 * FAILS OPEN when the academy has not configured a centre, even with the
 * geofence switched on. An owner who ticks the box before anyone has set the
 * ground location would otherwise lock out every student at the gate, with an
 * error none of them can act on — the feature silently becoming an outage.
 * The 'not_configured' verdict is surfaced to the owner instead, so the fix
 * lands on the person who can make it.
 */
export function evaluateGeofence(
  config: GeofenceConfig,
  fix: DeviceFix | null | undefined,
): GeofenceVerdict {
  if (!config.enabled) return { ok: true, reason: 'disabled' };

  const centre = config.centre;
  if (!isValidLatLng(centre)) return { ok: true, reason: 'not_configured' };

  if (!fix || !isValidLatLng({ lat: fix.lat, lng: fix.lng })) {
    return {
      ok: false,
      code: 'location_required',
      reason:
        'Your academy only accepts check-ins at the ground. Allow location access and try again.',
    };
  }

  const accuracy =
    typeof fix.accuracy === 'number' && Number.isFinite(fix.accuracy) && fix.accuracy >= 0
      ? fix.accuracy
      : null;

  if (accuracy !== null && accuracy > MAX_USABLE_ACCURACY_M) {
    return {
      ok: false,
      code: 'accuracy_too_poor',
      reason:
        `Your device could only place you within ${Math.round(accuracy)}m, which is too rough ` +
        'to confirm you are at the ground. Step outside and try again.',
    };
  }

  const radius = normaliseRadius(config.radiusMeters);
  const allowed = radius + Math.min(accuracy ?? 0, ACCURACY_ALLOWANCE_M);
  const distance = Math.round(distanceMeters(centre, { lat: fix.lat, lng: fix.lng }));

  if (distance > allowed) {
    return {
      ok: false,
      code: 'outside',
      reason:
        `You appear to be about ${formatDistance(distance)} from the ground. ` +
        'Check-in only works when you are there.',
      distanceMeters: distance,
      allowedMeters: allowed,
    };
  }

  return { ok: true, reason: 'inside', distanceMeters: distance };
}

/** Metres under a kilometre, otherwise one decimal of a kilometre. */
export function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`;
}
