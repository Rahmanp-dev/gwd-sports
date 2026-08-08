"use client";

import React, { useMemo, useRef, useState } from "react";
import { Sparkles, Check, Wand2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LOOKS, matchLook, lookContrast, type Look } from "@/lib/branding/looks";
import {
  suggestPaletteFromPixels,
  suggestionIsMeaningful,
  type SampledPixel,
} from "@/lib/branding/logoPalette";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * LOOKS + "USE MY LOGO'S COLOURS"
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Sits above the individual colour, font, feel and background controls — not
 * instead of them. An owner who recognises their club in one of these cards is
 * finished in a click; an owner who wants to keep going still has every control
 * underneath, exactly as before.
 *
 * The logo button is the part worth explaining. An academy already has an
 * identity, on their crest and their jerseys, and asking a cricket coach to
 * translate it into two hex codes is asking the wrong question of the wrong
 * person. They have already uploaded the logo — the colours are right there.
 * The reading happens on a canvas here; every judgement about what counts as a
 * brand colour lives in lib/branding/logoPalette.ts, where it is tested.
 *
 * Nothing here writes directly. It calls `onApply` with a patch, so undo,
 * dirty-state and saving stay owned by the editor that already handles them.
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface LookPatch {
  primaryColor: string;
  accentColor: string;
  fontPreset: string;
  style: string;
  background: string;
}

/** How many pixels to sample. Enough to be representative, cheap enough to be instant. */
const SAMPLE_EDGE = 96;

export function LooksPicker({
  current,
  logoUrl,
  onApply,
  onApplyColours,
  disabled,
}: {
  current: {
    primaryColor?: string | null;
    accentColor?: string | null;
    fontPreset?: string | null;
    style?: string | null;
    background?: string | null;
  };
  logoUrl?: string | null;
  onApply: (patch: LookPatch) => void;
  onApplyColours: (colours: { primaryColor: string; accentColor: string }) => void;
  disabled?: boolean;
}) {
  const [reading, setReading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const active = useMemo(
    () =>
      matchLook({
        primary: current.primaryColor,
        accent: current.accentColor,
        fontPreset: current.fontPreset,
        style: current.style,
        background: current.background,
      }),
    [current],
  );

  const applyLook = (look: Look) => {
    onApply({
      primaryColor: look.primary,
      accentColor: look.accent,
      fontPreset: look.fontPreset,
      style: look.style,
      background: look.background,
    });
    toast.success(`${look.label} applied`, {
      description: "Colours, type, feel and background all set. Tune anything below.",
    });
  };

  const readLogo = async () => {
    if (!logoUrl) return;
    setReading(true);
    try {
      const img = new Image();
      // The logo is served from our own origin or Cloudinary; without this the
      // canvas is tainted and getImageData throws a security error.
      img.crossOrigin = "anonymous";

      const loaded = await new Promise<HTMLImageElement | null>((resolve) => {
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = logoUrl;
      });

      if (!loaded) {
        toast.error("Couldn't read that logo", {
          description: "It may be hosted somewhere that blocks colour sampling.",
        });
        return;
      }

      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvas.width = SAMPLE_EDGE;
      canvas.height = SAMPLE_EDGE;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.clearRect(0, 0, SAMPLE_EDGE, SAMPLE_EDGE);
      ctx.drawImage(loaded, 0, 0, SAMPLE_EDGE, SAMPLE_EDGE);

      let data: Uint8ClampedArray;
      try {
        data = ctx.getImageData(0, 0, SAMPLE_EDGE, SAMPLE_EDGE).data;
      } catch {
        // Tainted canvas — a cross-origin logo without CORS headers.
        toast.error("Couldn't read that logo", {
          description: "Re-upload it through Look & feel and try again.",
        });
        return;
      }

      const pixels: SampledPixel[] = [];
      for (let i = 0; i < data.length; i += 4) {
        pixels.push({
          r: data[i],
          g: data[i + 1],
          b: data[i + 2],
          a: data[i + 3],
        });
      }

      const suggestion = suggestPaletteFromPixels(pixels, {
        primary: current.primaryColor ?? "#1e40af",
        accent: current.accentColor ?? "#f59e0b",
      });

      if (suggestion.empty) {
        toast("Nothing to take from that logo", {
          description:
            "It looks black and white. Pick a Look below, or set the colours by hand.",
        });
        return;
      }

      if (!suggestionIsMeaningful(suggestion, { primary: current.primaryColor })) {
        toast("Already matching", {
          description: "Your colours are already close to your logo's.",
        });
        return;
      }

      onApplyColours({
        primaryColor: suggestion.primary,
        accentColor: suggestion.accent,
      });
      toast.success("Colours taken from your logo", {
        description: `${suggestion.primary} and ${suggestion.accent}. Checked for readability.`,
      });
    } finally {
      setReading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Read the logo ──────────────────────────────────────────────── */}
      {logoUrl && (
        <button
          type="button"
          onClick={readLogo}
          disabled={disabled || reading}
          className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-3 text-left transition-all hover:border-slate-900 hover:shadow-sm disabled:opacity-60"
        >
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900">
            {reading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <Wand2 className="h-4 w-4 text-white" />
            )}
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-bold text-slate-900">
              Use my logo&rsquo;s colours
            </span>
            <span className="block text-[10px] leading-snug text-slate-500">
              Reads your crest and sets a readable palette from it.
            </span>
          </span>
        </button>
      )}

      {/* ── The Looks ──────────────────────────────────────────────────── */}
      <div>
        <div className="mb-2 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Looks
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {LOOKS.map((look) => {
            const isActive = active?.id === look.id;
            return (
              <button
                key={look.id}
                type="button"
                disabled={disabled}
                onClick={() => applyLook(look)}
                title={`${look.suits}  ·  contrast ${lookContrast(look).toFixed(1)}:1`}
                className={`group relative overflow-hidden rounded-xl border p-2.5 text-left transition-all disabled:opacity-60 ${
                  isActive
                    ? "border-slate-900 ring-2 ring-slate-900/10"
                    : "border-slate-200 hover:border-slate-400"
                }`}
              >
                {/* A real swatch of the actual identity, not a label. An owner
                    picks by recognising their club, not by reading. */}
                <span
                  className="mb-2 flex h-10 w-full items-center gap-1 overflow-hidden rounded-lg px-2"
                  style={{ background: look.primary }}
                >
                  <span
                    className="h-4 w-4 flex-shrink-0 rounded-full"
                    style={{ background: look.accent }}
                  />
                  <span
                    className="h-1.5 flex-1 rounded-full"
                    style={{ background: "rgb(255 255 255 / 0.45)" }}
                  />
                </span>

                <span className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-slate-900">
                    {look.label}
                  </span>
                  {isActive && (
                    <Check className="h-3 w-3 flex-shrink-0 text-slate-900" />
                  )}
                </span>
                <span className="mt-0.5 block text-[9px] leading-snug text-slate-400">
                  {look.suits}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
          A Look sets colours, type, feel and background together. Everything
          stays editable below.
        </p>
      </div>

      <canvas ref={canvasRef} className="hidden" aria-hidden />
    </div>
  );
}

export default LooksPicker;
