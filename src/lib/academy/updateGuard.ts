/**
 * ════════════════════════════════════════════════════════════════════════════
 * WHAT AN ACADEMY OWNER MAY CHANGE ABOUT THEIR OWN ACADEMY
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `PUT /api/academy/[id]` passed the raw request body straight into
 * `findByIdAndUpdate`. The only check was "is this your academy?" — which
 * meant an academy admin could set, on their own tenant:
 *
 *   platformFeePercent: 0     → GWD's margin on every future payment, gone
 *   verificationStatus        → self-award "verified" / "founding"
 *   gwdFoundingAcademy: true  → a founding badge on the public map
 *   ecosystemScore: 100       → top of the public leaderboard
 *   rzp_account               → point settlement at another Razorpay account
 *   ownerId                   → hand the academy to someone else
 *   isActive                  → un-freeze an account GWD had frozen
 *
 * None of those are branding. They are the commercial and trust boundary
 * between GWD and its customers, and they belong to the super admin.
 *
 * The allowlist is on the OWNER side rather than a denylist on the privileged
 * side deliberately: a field added to the schema later is not editable by an
 * owner until someone chooses to add it here. A denylist fails open — the new
 * field would be silently writable by every academy admin the moment it
 * exists.
 * ════════════════════════════════════════════════════════════════════════════
 */

/**
 * Top-level paths an academy admin may write. Dot-paths are matched on their
 * first segment, so "theme.primaryColor" and "fees.monthly" are allowed by
 * "theme" and "fees".
 */
const OWNER_WRITABLE = new Set([
  // Public-page content and branding
  'theme',
  'name',
  'description',
  'location',
  'address',
  'contactInfo',
  'facilities',
  'timings',
  'capacity',
  'images',
  'sports',
  // Fee schedule — the owner's own pricing, not GWD's cut
  'fees',
  // Ecosystem / map profile the academy is responsible for the truth of
  'achievements',
  'coachName',
  'establishedYear',
  'starPlayers',
  'registeredTeams',
  /**
   * Attendance geofence — the owner's own operational policy about their own
   * ground, so theirs to set. Deliberately NOT `coordinates`: that is the
   * public ecosystem-map pin, which stays GWD's, and is why the geofence
   * carries its own lat/lng rather than reusing it.
   */
  'attendanceGeofence',
]);

export interface FilteredUpdate {
  update: Record<string, unknown>;
  /** Keys that were dropped, for logging. Never echoed to the caller. */
  rejected: string[];
}

/**
 * Strips anything an academy admin is not allowed to set.
 *
 * Rejected keys are dropped rather than 400'd: a legitimate client sending
 * one extra field should still save the rest, and an attacker learns nothing
 * from the response either way. The caller logs what was dropped.
 */
export function filterAcademyUpdate(
  data: Record<string, unknown>,
  isSuperAdmin: boolean,
): FilteredUpdate {
  if (isSuperAdmin) return { update: data, rejected: [] };

  const update: Record<string, unknown> = {};
  const rejected: string[] = [];

  for (const [key, value] of Object.entries(data ?? {})) {
    // "theme.footer.phone" → "theme"
    const root = key.split('.')[0];

    // Mongo operators ($set, $unset, ...) are never accepted from an owner:
    // they would let the allowlist be bypassed entirely by nesting.
    if (root.startsWith('$')) {
      rejected.push(key);
      continue;
    }

    if (OWNER_WRITABLE.has(root)) {
      update[key] = value;
    } else {
      rejected.push(key);
    }
  }

  return { update, rejected };
}
