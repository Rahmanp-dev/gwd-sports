"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL, BRAND_NAME } from "@/utils/constants";
import { useAppSelector } from "@/store";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * WHOSE NAME IS ON THIS SCREEN
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `BRAND_NAME` is a build-time environment variable. That was fine while the
 * platform served one academy, and stops being fine the moment five branches —
 * Mumbai, Punjab, Chennai, Bangalore — run under one domain, which is the
 * stated plan. A single deployment cannot have five values of one env var.
 *
 * So the name comes from the signed-in user's academy, and falls back to
 * `BRAND_NAME` only when there is no tenant to ask about: the marketing site, a
 * logged-out visitor, the super admin's platform-wide console.
 *
 * WHY A HOOK AND NOT A CONTEXT PROVIDER: the landing components already take an
 * `academy` prop and resolve it themselves, and rewiring those into a provider
 * would touch working code for no behavioural gain. This fills the gap for the
 * screens that had no way to know — admin, auth, static pages, checkout.
 *
 * The result is CACHED PER ACADEMY for the session. This is a page header; it
 * must not cost a request every time a tab is switched.
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface Brand {
  /** What to print. Never empty. */
  name: string;
  logoUrl: string | null;
  /** True once a tenant's real name has been resolved. */
  isTenant: boolean;
  loading: boolean;
}

/** Module-level, so it survives remounts within a session. */
const cache = new Map<string, { name: string; logoUrl: string | null }>();

export function useBrand(): Brand {
  const { user } = useAppSelector((state) => state.auth);
  const academyId = (user as any)?.academyId ?? null;

  const cached = academyId ? cache.get(String(academyId)) : undefined;
  const [resolved, setResolved] = useState(cached ?? null);
  const [loading, setLoading] = useState(Boolean(academyId) && !cached);

  useEffect(() => {
    if (!academyId) {
      setResolved(null);
      setLoading(false);
      return;
    }

    const key = String(academyId);
    const hit = cache.get(key);
    if (hit) {
      setResolved(hit);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    axios
      .get(`${API_BASE_URL}/academy/${key}`)
      .then((res) => {
        const academy = res.data?.data?.academy ?? res.data?.data;
        if (!academy?.name) return;
        const value = {
          name: academy.name as string,
          logoUrl: academy.theme?.logoUrl || null,
        };
        cache.set(key, value);
        if (!cancelled) setResolved(value);
      })
      .catch(() => {
        // A failed lookup falls through to BRAND_NAME. A header that renders
        // the platform name is a far smaller problem than a header that
        // renders nothing.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [academyId]);

  return {
    name: resolved?.name ?? BRAND_NAME,
    logoUrl: resolved?.logoUrl ?? null,
    isTenant: Boolean(resolved),
    loading,
  };
}

export default useBrand;
