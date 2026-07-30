"use client";
import { useCallback, useState } from "react";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * ONE GEOLOCATION REQUEST, WITH THE FAILURE MODES NAMED
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `navigator.geolocation` has four ways to disappoint a parent standing at the
 * gate, and they need different words:
 *
 *   unsupported — an old or locked-down browser. Nothing they can do here;
 *                 tell them to ask the coach to mark them instead.
 *   denied      — they (or the browser, permanently) refused. The fix is in
 *                 browser settings, so saying "try again" is useless.
 *   unavailable — permission granted, but no fix obtained. Usually indoors.
 *                 "Step outside" is genuinely the answer.
 *   timeout     — took too long. Retrying is reasonable.
 *
 * Collapsing these into "location error" is what makes a feature like this
 * feel broken rather than strict.
 *
 * ⚠️ REQUIRES HTTPS. Browsers refuse geolocation on insecure origins, with
 * localhost the only exception — so this works in dev and in production, but
 * silently fails on any plain-http staging URL. That surfaces as `denied`.
 */

export type LocationErrorKind = "unsupported" | "denied" | "unavailable" | "timeout";

export interface DeviceLocation {
  lat: number;
  lng: number;
  accuracy: number | null;
}

export interface LocationState {
  status: "idle" | "requesting" | "ready" | "error";
  location: DeviceLocation | null;
  errorKind: LocationErrorKind | null;
  message: string;
}

const MESSAGES: Record<LocationErrorKind, string> = {
  unsupported:
    "This browser cannot share your location. Ask your coach to mark you present instead.",
  denied:
    "Location is blocked for this site. Enable it in your browser settings, then try again.",
  unavailable:
    "Your device could not get a location fix. Step outside, away from the building, and try again.",
  timeout: "Getting your location took too long. Try again.",
};

const IDLE: LocationState = {
  status: "idle",
  location: null,
  errorKind: null,
  message: "",
};

export function useDeviceLocation() {
  const [state, setState] = useState<LocationState>(IDLE);

  const request = useCallback((): Promise<DeviceLocation | null> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({
        status: "error",
        location: null,
        errorKind: "unsupported",
        message: MESSAGES.unsupported,
      });
      return Promise.resolve(null);
    }

    setState({ ...IDLE, status: "requesting" });

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: DeviceLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: Number.isFinite(position.coords.accuracy)
              ? position.coords.accuracy
              : null,
          };
          setState({
            status: "ready",
            location,
            errorKind: null,
            message: "",
          });
          resolve(location);
        },
        (err) => {
          const kind: LocationErrorKind =
            err.code === err.PERMISSION_DENIED
              ? "denied"
              : err.code === err.TIMEOUT
                ? "timeout"
                : "unavailable";
          setState({
            status: "error",
            location: null,
            errorKind: kind,
            message: MESSAGES[kind],
          });
          resolve(null);
        },
        {
          // A geofence is worthless against a cached fix from this morning at
          // home, so no maximumAge — always take a fresh reading.
          enableHighAccuracy: true,
          timeout: 15_000,
          maximumAge: 0,
        },
      );
    });
  }, []);

  const reset = useCallback(() => setState(IDLE), []);

  return { ...state, request, reset };
}
