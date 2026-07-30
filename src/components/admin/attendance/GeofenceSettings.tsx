"use client";
import React, { useState } from "react";
import { Crosshair, Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_RADIUS_M,
  MAX_RADIUS_M,
  MIN_RADIUS_M,
  formatDistance,
  isValidLatLng,
} from "@/lib/attendance/geofence";
import { useDeviceLocation } from "@/lib/attendance/useDeviceLocation";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * "ONLY COUNT CHECK-INS AT THE GROUND"
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The one control that makes this usable is "Use my current location" — an
 * owner standing on their own field taps it and the fence is set exactly
 * right. The alternative is asking them to find latitude and longitude, which
 * is how a feature like this ends up switched on with a wrong centre and every
 * student locked out.
 *
 * The ground is stored separately from the public ecosystem-map pin on
 * purpose: those are often different places, and GWD owns the map pin while
 * the owner owns where training happens. See the Academy schema.
 */

export interface GeofenceDraft {
  enabled: boolean;
  radiusMeters: number;
  lat: number | "";
  lng: number | "";
}

export function emptyGeofenceDraft(): GeofenceDraft {
  return { enabled: false, radiusMeters: DEFAULT_RADIUS_M, lat: "", lng: "" };
}

export function geofenceDraftFromAcademy(academy?: any): GeofenceDraft {
  const g = academy?.attendanceGeofence ?? {};
  return {
    enabled: Boolean(g.enabled),
    radiusMeters:
      typeof g.radiusMeters === "number" ? g.radiusMeters : DEFAULT_RADIUS_M,
    lat: typeof g.lat === "number" ? g.lat : "",
    lng: typeof g.lng === "number" ? g.lng : "",
  };
}

export function geofenceDraftToUpdate(d: GeofenceDraft): Record<string, unknown> {
  return {
    "attendanceGeofence.enabled": d.enabled,
    "attendanceGeofence.radiusMeters": d.radiusMeters,
    // Empty means "fall back to the map pin", so send null rather than 0 —
    // 0,0 is a real coordinate in the Atlantic and would be treated as a
    // deliberate (and very wrong) centre.
    "attendanceGeofence.lat": d.lat === "" ? null : Number(d.lat),
    "attendanceGeofence.lng": d.lng === "" ? null : Number(d.lng),
  };
}

interface Props {
  value: GeofenceDraft;
  onChange: (next: GeofenceDraft) => void;
  /** The public map pin, used as the fallback centre when no ground is set. */
  mapPin?: { lat?: number; lng?: number } | null;
  disabled?: boolean;
}

export default function GeofenceSettings({
  value,
  onChange,
  mapPin,
  disabled = false,
}: Props) {
  const geo = useDeviceLocation();
  const [captured, setCaptured] = useState<string>("");

  const patch = (p: Partial<GeofenceDraft>) => onChange({ ...value, ...p });

  const hasGround = isValidLatLng({ lat: Number(value.lat), lng: Number(value.lng) });
  const hasPin = isValidLatLng({
    lat: Number(mapPin?.lat),
    lng: Number(mapPin?.lng),
  });
  const effective = hasGround || hasPin;

  const useCurrentLocation = async () => {
    const loc = await geo.request();
    if (!loc) return;
    patch({ lat: loc.lat, lng: loc.lng });
    setCaptured(
      loc.accuracy
        ? `Set from your device, accurate to about ${formatDistance(loc.accuracy)}.`
        : "Set from your device.",
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            Only count check-ins at the ground
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
            Students scanning the QR code must be physically near your training
            location. Coaches marking the register are never affected.
          </p>
        </div>
        <Switch
          checked={value.enabled}
          disabled={disabled}
          onCheckedChange={(enabled) => patch({ enabled })}
        />
      </div>

      {value.enabled && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          {/*
            The condition an owner is most likely to create: fence on, no
            centre anywhere. The server deliberately fails OPEN in that state
            rather than locking everyone out, so this says exactly that — an
            owner who thinks it is enforcing when it is not would trust
            attendance data that means nothing.
          */}
          {!effective && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
              No training location set yet, so this is <strong>not enforcing</strong>{" "}
              — check-ins are still being accepted from anywhere. Set the location
              below to turn it on properly.
            </p>
          )}

          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Training location
            </label>
            <Button
              type="button"
              variant="outline"
              disabled={disabled || geo.status === "requesting"}
              onClick={useCurrentLocation}
              className="w-full"
            >
              {geo.status === "requesting" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Crosshair className="mr-2 h-4 w-4" />
              )}
              {geo.status === "requesting"
                ? "Getting your location…"
                : "Use my current location"}
            </Button>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
              Tap this while standing at the ground for the most accurate result.
            </p>

            {geo.status === "error" && (
              <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] leading-relaxed text-red-700">
                {geo.message}
              </p>
            )}
            {captured && geo.status === "ready" && (
              <p className="mt-2 text-[11px] font-medium text-emerald-600">{captured}</p>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[10px] text-slate-400">Latitude</label>
                <Input
                  type="number"
                  step="any"
                  value={value.lat}
                  disabled={disabled}
                  placeholder="e.g. 17.4401"
                  onChange={(e) =>
                    patch({ lat: e.target.value === "" ? "" : Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-slate-400">Longitude</label>
                <Input
                  type="number"
                  step="any"
                  value={value.lng}
                  disabled={disabled}
                  placeholder="e.g. 78.3489"
                  onChange={(e) =>
                    patch({ lng: e.target.value === "" ? "" : Number(e.target.value) })
                  }
                />
              </div>
            </div>

            {!hasGround && hasPin && (
              <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                Using your map pin as the location for now. Set it explicitly if you
                train somewhere else.
              </p>
            )}
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="mb-1 flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                How close they must be
              </label>
              <span className="text-xs font-semibold text-slate-700">
                {formatDistance(value.radiusMeters)}
              </span>
            </div>
            <input
              type="range"
              min={MIN_RADIUS_M}
              max={1000}
              step={25}
              disabled={disabled}
              value={Math.min(value.radiusMeters, 1000)}
              onChange={(e) => patch({ radiusMeters: Number(e.target.value) })}
              className="w-full accent-slate-900"
            />
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
              Phone GPS is not exact, especially indoors, so a little slack is
              added automatically. Below about {formatDistance(MIN_RADIUS_M * 3)} you
              may start turning away students who really are there. Maximum{" "}
              {formatDistance(MAX_RADIUS_M)}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
