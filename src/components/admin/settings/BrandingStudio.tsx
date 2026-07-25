"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/utils/constants";
import { useAppSelector } from "@/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  Check,
  Contrast,
  Loader2,
  Palette,
  RotateCcw,
  Save,
} from "lucide-react";
import {
  buildThemeVariables,
  parseHex,
  assessContrast,
  BRAND_STYLES,
  isBrandStyle,
  DEFAULT_PRIMARY,
  DEFAULT_ACCENT,
  type BrandStyle,
} from "@/lib/branding/palette";

/**
 * Where an academy owner controls how their public page looks.
 *
 * TWO THINGS MAKE THIS DIFFERENT FROM A COLOUR PICKER:
 *
 * 1. **The preview is real.** It renders through `buildThemeVariables` — the
 *    same pure function the live page uses — so what an owner approves is what
 *    ships. A preview built from a separate mock is a preview that lies, and
 *    the first time it lies about a colour, the owner stops trusting the whole
 *    screen.
 *
 * 2. **Contrast is checked and reported.** An owner who picks a mid grey or a
 *    bright yellow gets told their page will be hard to read, with the actual
 *    ratio. It is a warning and not a block: it is their brand, and refusing to
 *    save it would be the wrong trade. Shipping it unknowingly is the thing to
 *    prevent.
 */

/** Curated starting points, so nobody has to arrive with a hex code. */
const PRESETS: { name: string; primary: string; accent: string }[] = [
  { name: "Violet", primary: "#7c3aed", accent: "#c8971a" },
  { name: "Deep Blue", primary: "#1d4ed8", accent: "#f59e0b" },
  { name: "Forest", primary: "#0f766e", accent: "#84cc16" },
  { name: "Crimson", primary: "#dc2626", accent: "#0f172a" },
  { name: "Midnight", primary: "#0f172a", accent: "#38bdf8" },
  { name: "Sunrise", primary: "#ea580c", accent: "#facc15" },
];

interface ThemeDraft {
  primaryColor: string;
  accentColor: string;
  style: BrandStyle;
  tagline: string;
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function BrandingStudio() {
  const [draft, setDraft] = useState<ThemeDraft>({
    primaryColor: DEFAULT_PRIMARY,
    accentColor: DEFAULT_ACCENT,
    style: "classic",
    tagline: "",
  });
  const [saved, setSaved] = useState<ThemeDraft | null>(null);
  const [academyName, setAcademyName] = useState("Your Academy");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  const { user, token } = useAppSelector((s) => s.auth);
  const academyId = (user as any)?.academyId;

  const load = useCallback(async () => {
    if (!academyId) {
      setLoading(false);
      setError("Your account is not linked to an academy.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/academy/${academyId}`);
      const academy = res.data?.data?.academy;
      if (academy) {
        setAcademyName(academy.name || "Your Academy");
        const next: ThemeDraft = {
          primaryColor: academy.theme?.primaryColor || DEFAULT_PRIMARY,
          accentColor: academy.theme?.accentColor || DEFAULT_ACCENT,
          style: isBrandStyle(academy.theme?.style) ? academy.theme.style : "classic",
          tagline: academy.theme?.tagline || "",
        };
        setDraft(next);
        setSaved(next);
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "Could not load your branding");
    } finally {
      setLoading(false);
    }
  }, [academyId]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await axios.put(
        `${API_BASE_URL}/academy/${academyId}`,
        {
          /**
           * Dot-notation, NOT a nested `theme` object. The route does a plain
           * findByIdAndUpdate, so sending `{ theme: {...} }` would replace the
           * whole subdocument and silently wipe logoUrl and heroImages — which
           * are edited on a different screen and would look like data loss with
           * no obvious cause.
           */
          "theme.primaryColor": draft.primaryColor,
          "theme.accentColor": draft.accentColor,
          "theme.style": draft.style,
          "theme.tagline": draft.tagline,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data?.success) {
        setSaved(draft);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2500);
      } else {
        setError(res.data?.message || "Could not save");
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  // The same function the real page uses. See the header.
  const variables = buildThemeVariables(draft);
  const primaryRgb = parseHex(draft.primaryColor);
  const contrast = primaryRgb ? assessContrast(primaryRgb) : null;

  const dirty =
    saved !== null &&
    (saved.primaryColor !== draft.primaryColor ||
      saved.accentColor !== draft.accentColor ||
      saved.style !== draft.style ||
      saved.tagline !== draft.tagline);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Look &amp; feel
          </h2>
          <p className="text-sm text-slate-500">
            How your public page appears to parents. Changes preview instantly
            and go live when you save.
          </p>
        </div>
        <div className="flex gap-2">
          {dirty && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => saved && setDraft(saved)}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Discard
            </Button>
          )}
          <Button size="sm" onClick={save} disabled={saving || !dirty}>
            {saving ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : justSaved ? (
              <Check className="mr-1.5 h-3.5 w-3.5" />
            ) : (
              <Save className="mr-1.5 h-3.5 w-3.5" />
            )}
            {justSaved ? "Saved" : "Save & publish"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_1fr]">
        {/* ── Controls ───────────────────────────────────────────────── */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="space-y-4 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Start from a palette
              </p>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((preset) => {
                  const active =
                    draft.primaryColor.toLowerCase() === preset.primary &&
                    draft.accentColor.toLowerCase() === preset.accent;
                  return (
                    <button
                      key={preset.name}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          primaryColor: preset.primary,
                          accentColor: preset.accent,
                        })
                      }
                      className={`rounded-lg border p-2 text-left transition-all ${
                        active
                          ? "border-slate-900 ring-2 ring-slate-900/10"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex gap-1">
                        <span
                          className="h-6 flex-1 rounded"
                          style={{ background: preset.primary }}
                        />
                        <span
                          className="h-6 w-2.5 rounded"
                          style={{ background: preset.accent }}
                        />
                      </div>
                      <span className="mt-1.5 block text-[11px] font-medium text-slate-600">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                {(
                  [
                    ["primaryColor", "Main colour"],
                    ["accentColor", "Accent"],
                  ] as const
                ).map(([field, label]) => (
                  <div key={field}>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {label}
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="color"
                        value={
                          HEX.test(draft[field]) ? draft[field] : DEFAULT_PRIMARY
                        }
                        onChange={(e) =>
                          setDraft({ ...draft, [field]: e.target.value })
                        }
                        className="h-9 w-9 flex-shrink-0 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                      />
                      <Input
                        value={draft[field]}
                        onChange={(e) =>
                          setDraft({ ...draft, [field]: e.target.value })
                        }
                        className="h-9 font-mono text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* The check that stops an unreadable page shipping unnoticed. */}
              {contrast && !contrast.passesNormal && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                  <div className="text-xs leading-relaxed text-amber-900">
                    <p className="font-semibold">
                      Text on this colour will be hard to read.
                    </p>
                    <p className="mt-0.5">
                      Contrast is {contrast.ratio}:1, below the 4.5:1 needed for
                      normal text.{" "}
                      {contrast.passesLarge
                        ? "It is still fine for large headings."
                        : "It is below the threshold for headings too."}{" "}
                      You can save it anyway — this is only a warning.
                    </p>
                  </div>
                </div>
              )}
              {contrast && contrast.passesNormal && (
                <p className="flex items-center gap-1.5 text-[11px] text-emerald-600">
                  <Contrast className="h-3 w-3" />
                  Readable — {contrast.ratio}:1 contrast.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="space-y-3 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Feel
              </p>
              <div className="space-y-2">
                {(Object.keys(BRAND_STYLES) as BrandStyle[]).map((key) => {
                  const preset = BRAND_STYLES[key];
                  const active = draft.style === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setDraft({ ...draft, style: key })}
                      className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                        active
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className="mt-0.5 h-8 w-8 flex-shrink-0 border-2 border-slate-300"
                        style={{ borderRadius: preset.radius }}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-800">
                          {preset.label}
                        </span>
                        <span className="block text-[11px] leading-snug text-slate-500">
                          {preset.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="space-y-2 p-5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Tagline
              </label>
              <Input
                value={draft.tagline}
                maxLength={100}
                onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
                placeholder="Where Legends Are Born"
              />
              <p className="text-[11px] text-slate-400">
                Appears under your academy name on the homepage.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Live preview ───────────────────────────────────────────── */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Live preview
          </p>
          <div
            style={variables as React.CSSProperties}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            {/* Hero */}
            <div className="relative overflow-hidden bg-slate-50 px-6 py-12 text-center">
              <div
                className="absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl"
                style={{ background: "rgb(var(--brand-rgb) / 0.18)" }}
              />
              <div className="relative">
                <p className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {academyName.split(" ")[0]}{" "}
                  <span style={{ color: "var(--brand)" }}>
                    {academyName.split(" ").slice(1).join(" ")}
                  </span>
                </p>
                <p className="mt-1.5 text-sm text-slate-500">
                  {draft.tagline || "Where Legends Are Born"}
                </p>
                <button
                  className="mt-5 px-5 py-2.5 text-sm font-bold"
                  style={{
                    background: "var(--brand)",
                    color: "var(--brand-on)",
                    borderRadius: "var(--brand-radius)",
                    boxShadow: "var(--brand-shadow)",
                  }}
                >
                  Join the academy
                </button>
              </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-3 gap-3 p-5">
              {["Cricket", "Football", "Athletics"].map((sport) => (
                <div
                  key={sport}
                  className="p-4"
                  style={{
                    background: "var(--brand-soft)",
                    borderRadius: "var(--brand-radius)",
                    border: "1px solid var(--brand-border)",
                  }}
                >
                  <div
                    className="mb-2 h-7 w-7"
                    style={{
                      background: "var(--brand)",
                      borderRadius: "calc(var(--brand-radius) * 0.5)",
                    }}
                  />
                  <p className="text-xs font-bold text-slate-800">{sport}</p>
                  <p className="text-[10px] text-slate-500">All age groups</p>
                </div>
              ))}
            </div>

            {/* Stat strip + accent */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ background: "var(--brand)", color: "var(--brand-on)" }}
            >
              <div>
                <p className="text-xl font-extrabold">240+</p>
                <p className="text-[10px] uppercase tracking-wider opacity-80">
                  Athletes trained
                </p>
              </div>
              <span
                className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-on)",
                  borderRadius: "calc(var(--brand-radius) * 0.6)",
                }}
              >
                Trials open
              </span>
            </div>
          </div>

          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-400">
            <Palette className="mt-0.5 h-3 w-3 flex-shrink-0" />
            This preview uses the same colour engine as your live page, so what
            you see here is what parents will see.
          </p>
        </div>
      </div>
    </div>
  );
}

export default BrandingStudio;
