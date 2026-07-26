"use client";
import React, { useCallback, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  AlertTriangle,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Contrast,
  GripVertical,
  Image as ImageIcon,
  LayoutDashboard,
  Loader2,
  Palette,
  Plus,
  Quote,
  Sparkles,
  Trophy,
  Type,
  Upload,
  X,
  Zap,
} from "lucide-react";
import {
  BACKGROUND_STYLES,
  BRAND_STYLES,
  DEFAULT_ACCENT,
  DEFAULT_PRIMARY,
  FONT_PRESETS,
  assessContrast,
  buildThemeVariables,
  isBackgroundStyle,
  isBrandStyle,
  isFontPreset,
  parseHex,
  type BackgroundStyle,
  type BrandStyle,
  type FontPreset,
} from "@/lib/branding/palette";
import type {
  Academy,
  AcademyGalleryItem,
  AcademyHomepageSections,
  AcademyProgram,
  AcademyTestimonial,
} from "@/services/academyService";
import { uploadGalleryImage, uploadLogo } from "@/services/settingsService";
import { toastUtils } from "@/utils/toast";
import {
  heroLogoAlignClass,
  heroLogoStyle,
  heroScrimStyle,
} from "@/lib/branding/heroStyle";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE ONE PLACE AN ACADEMY'S BRAND IS EDITED
 * ════════════════════════════════════════════════════════════════════════════
 *
 * This replaces three diverged surfaces that all edited overlapping slices of
 * the same data and disagreed about it:
 *
 *   - the super admin's onboarding form, which had NO branding fields at all,
 *     so every new academy launched on platform defaults;
 *   - BrandingStudio, which owned colour/feel/tagline;
 *   - AcademyBrandingSettings, which owned logo/tagline/fees.
 *
 * The last two were stacked in the same tab and both wrote `theme.tagline`.
 * Whichever you saved last won, which is exactly the kind of thing that makes
 * an owner stop trusting the screen.
 *
 * It is a CONTROLLED component on purpose. Onboarding needs the draft to live
 * in the super admin's react-hook-form so it submits with the rest of the
 * academy; the owner's settings tab needs it to live in a panel that loads and
 * saves on its own. Owning state here would have forced one of those two to be
 * a special case, and special cases are how the previous three drifted apart.
 * Both callers render THIS component, so the experience cannot diverge again.
 *
 * The live preview is built from `buildThemeVariables` — the same pure function
 * the real public page uses. A preview assembled from its own mock styles is a
 * preview that lies, and the first time it lies the owner stops believing it.
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface BrandingDraft {
  primaryColor: string;
  accentColor: string;
  style: BrandStyle;
  fontPreset: FontPreset;
  backgroundStyle: BackgroundStyle;
  backgroundColor: string;
  logoScale: number;
  logoShape: "square" | "rounded" | "circle";
  logoAlign: "left" | "center" | "right";
  logoFit: "contain" | "cover";
  heroBlur: number;
  heroOverlay: number;
  tagline: string;
  logoUrl: string;
  programs: AcademyProgram[];
  testimonials: AcademyTestimonial[];
  gallery: AcademyGalleryItem[];
  achievements: string[];
  /** Vertical rhythm preset: compact tightens sections, spacious opens them. */
  density: "compact" | "spacious";
  /** Key of the section that uses --accent instead of --brand as focal colour. */
  accentSection: string;
  sections: AcademyHomepageSections;
}

export const DEFAULT_SECTIONS: AcademyHomepageSections = {
  programs: true,
  achievements: true,
  testimonials: true,
  gallery: true,
  stats: true,
  order: ['programs', 'stats', 'achievements', 'gallery', 'testimonials'],
};

/** The canonical section ordering used as a fallback when `order` is absent. */
export const DEFAULT_SECTION_ORDER = [
  'programs',
  'stats',
  'achievements',
  'gallery',
  'testimonials',
] as const;

export type SectionKey = (typeof DEFAULT_SECTION_ORDER)[number];

export const SECTION_LABELS: Record<SectionKey, string> = {
  programs: 'Disciplines',
  stats: 'Stats strip',
  achievements: 'Achievements',
  gallery: 'Photo gallery',
  testimonials: 'Testimonials',
};

export function defaultBrandingDraft(): BrandingDraft {
  return {
    primaryColor: DEFAULT_PRIMARY,
    accentColor: DEFAULT_ACCENT,
    style: "classic",
    fontPreset: "sans",
    backgroundStyle: "light",
    backgroundColor: "",
    logoScale: 100,
    logoShape: "rounded",
    logoAlign: "center",
    logoFit: "contain",
    heroBlur: 3,
    heroOverlay: 55,
    tagline: "",
    logoUrl: "",
    programs: [],
    testimonials: [],
    gallery: [],
    achievements: [],
    density: "spacious",
    accentSection: "",
    sections: { ...DEFAULT_SECTIONS },
  };
}

/** Reads a saved academy into a draft, tolerating documents written before
 *  any of these fields existed. */
export function draftFromAcademy(academy?: Partial<Academy> | null): BrandingDraft {
  const theme = academy?.theme;
  const base = defaultBrandingDraft();
  if (!theme) return { ...base, achievements: academy?.achievements ?? [] };

  // Reconstruct order from saved data, appending any keys not yet present.
  const savedOrder: string[] = theme.sections?.order ?? [];
  const fullOrder = [
    ...savedOrder.filter((k) => DEFAULT_SECTION_ORDER.includes(k as SectionKey)),
    ...DEFAULT_SECTION_ORDER.filter((k) => !savedOrder.includes(k)),
  ];

  return {
    primaryColor: theme.primaryColor || base.primaryColor,
    accentColor: theme.accentColor || base.accentColor,
    style: isBrandStyle(theme.style) ? theme.style : base.style,
    fontPreset: isFontPreset(theme.fontPreset) ? theme.fontPreset : base.fontPreset,
    backgroundStyle: isBackgroundStyle(theme.backgroundStyle)
      ? theme.backgroundStyle
      : base.backgroundStyle,
    backgroundColor: theme.backgroundColor ?? "",
    logoScale: theme.logoScale ?? 100,
    logoShape: theme.logoShape ?? "rounded",
    logoAlign: theme.logoAlign ?? "center",
    logoFit: theme.logoFit ?? "contain",
    heroBlur: theme.heroBlur ?? 3,
    heroOverlay: theme.heroOverlay ?? 55,
    tagline: theme.tagline ?? "",
    logoUrl: theme.logoUrl ?? "",
    programs: theme.programs ?? [],
    testimonials: theme.testimonials ?? [],
    gallery: theme.gallery ?? [],
    achievements: academy?.achievements ?? [],
    density: (theme.density === 'compact' || theme.density === 'spacious') ? theme.density : 'spacious',
    accentSection: theme.accentSection ?? "",
    sections: {
      ...DEFAULT_SECTIONS,
      ...(theme.sections ?? {}),
      order: fullOrder,
    },
  };
}

/**
 * Dot-notation, NOT a nested `theme` object.
 *
 * `PUT /api/academy/:id` does a plain findByIdAndUpdate, so sending
 * `{ theme: {...} }` replaces the whole subdocument — silently wiping
 * heroImages, which nothing on this screen edits. Dot paths touch only the
 * keys named.
 */
export function draftToThemeUpdate(draft: BrandingDraft): Record<string, unknown> {
  return {
    "theme.primaryColor": draft.primaryColor,
    "theme.accentColor": draft.accentColor,
    "theme.style": draft.style,
    "theme.fontPreset": draft.fontPreset,
    "theme.backgroundStyle": draft.backgroundStyle,
    "theme.backgroundColor": draft.backgroundColor,
    "theme.logoScale": draft.logoScale,
    "theme.logoShape": draft.logoShape,
    "theme.logoAlign": draft.logoAlign,
    "theme.logoFit": draft.logoFit,
    "theme.heroBlur": draft.heroBlur,
    "theme.heroOverlay": draft.heroOverlay,
    "theme.tagline": draft.tagline,
    "theme.logoUrl": draft.logoUrl,
    "theme.programs": draft.programs,
    "theme.testimonials": draft.testimonials,
    "theme.gallery": draft.gallery,
    "theme.density": draft.density,
    "theme.accentSection": draft.accentSection,
    "theme.sections": draft.sections,
    achievements: draft.achievements,
  };
}

/** Curated starting points, so nobody has to arrive with a hex code. */
const PRESETS: { name: string; primary: string; accent: string }[] = [
  { name: "Violet", primary: "#7c3aed", accent: "#c8971a" },
  { name: "Deep Blue", primary: "#1d4ed8", accent: "#f59e0b" },
  { name: "Forest", primary: "#0f766e", accent: "#84cc16" },
  { name: "Crimson", primary: "#dc2626", accent: "#0f172a" },
  { name: "Midnight", primary: "#0f172a", accent: "#38bdf8" },
  { name: "Sunrise", primary: "#ea580c", accent: "#facc15" },
];

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Emoji suggestions when seeding disciplines from the academy's real sports. */
const SPORT_EMOJI: Record<string, string> = {
  football: "⚽",
  soccer: "⚽",
  cricket: "🏏",
  basketball: "🏀",
  tennis: "🎾",
  badminton: "🏸",
  swimming: "🏊",
  athletics: "🏃",
  hockey: "🏑",
  volleyball: "🏐",
  boxing: "🥊",
  chess: "♟️",
  karate: "🥋",
  judo: "🥋",
  skating: "⛸️",
  cycling: "🚴",
  golf: "⛳",
  baseball: "⚾",
  rugby: "🏉",
  gym: "🏋️",
  fitness: "🏋️",
  yoga: "🧘",
};

const SectionLabel: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({
  icon,
  children,
}) => (
  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
    {icon}
    {children}
  </p>
);

export interface AcademyBrandingEditorProps {
  value: BrandingDraft;
  onChange: (next: BrandingDraft) => void;
  /** Shown in the preview hero so the owner sees their own name, not a placeholder. */
  academyName?: string;
  /** Used by "Use my sports" to seed the disciplines list from real data. */
  sports?: string[];
  disabled?: boolean;
}

export const AcademyBrandingEditor: React.FC<AcademyBrandingEditorProps> = ({
  value,
  onChange,
  academyName = "Your Academy",
  sports = [],
  disabled = false,
}) => {
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const patch = useCallback(
    (partial: Partial<BrandingDraft>) => onChange({ ...value, ...partial }),
    [onChange, value],
  );

  // ── Uploads ────────────────────────────────────────────────────────────
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      patch({ logoUrl: await uploadLogo(file) });
    } catch (err: any) {
      toastUtils.error(
        "Logo upload failed",
        err?.response?.data?.message || "Could not upload that image.",
      );
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingGallery(true);
    try {
      const urls = await Promise.all(files.map((f) => uploadGalleryImage(f)));
      patch({ gallery: [...value.gallery, ...urls.map((url) => ({ url, caption: "" }))] });
    } catch (err: any) {
      toastUtils.error(
        "Image upload failed",
        err?.response?.data?.message || "Could not upload those images.",
      );
    } finally {
      setUploadingGallery(false);
      e.target.value = "";
    }
  };

  // ── Disciplines ────────────────────────────────────────────────────────
  const seedProgramsFromSports = () => {
    const seeded: AcademyProgram[] = sports.map((sport) => {
      const key = String(sport).toLowerCase().trim();
      return {
        id: key.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        emoji: SPORT_EMOJI[key] ?? "🏅",
        description: "",
      };
    });
    patch({ programs: seeded });
  };

  const updateProgram = (index: number, partial: Partial<AcademyProgram>) => {
    const next = value.programs.map((p, i) => (i === index ? { ...p, ...partial } : p));
    patch({ programs: next });
  };

  // The same colour engine the real page runs. See the header.
  const variables = buildThemeVariables(value);
  const primaryRgb = parseHex(value.primaryColor);
  const contrast = primaryRgb ? assessContrast(primaryRgb) : null;

  const previewPrograms = value.programs.length
    ? value.programs
    : sports.slice(0, 3).map((s) => ({
        id: s,
        label: String(s).charAt(0).toUpperCase() + String(s).slice(1),
        emoji: SPORT_EMOJI[String(s).toLowerCase()] ?? "🏅",
      }));

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_1fr]">
      {/* ══ Controls ════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        {/* Logo + tagline */}
        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-4 p-5">
            <SectionLabel icon={<ImageIcon className="h-3 w-3" />}>
              Logo &amp; tagline
            </SectionLabel>

            <div className="flex flex-wrap items-end gap-4">
              {value.logoUrl ? (
                <div className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    loading="lazy"
                    decoding="async"
                    src={value.logoUrl}
                    alt="Academy logo"
                    className="max-h-full max-w-full object-contain p-2"
                  />
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => patch({ logoUrl: "" })}
                    className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove logo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex h-24 w-24 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400">
                  <ImageIcon className="mb-1 h-6 w-6 opacity-50" />
                  <span className="text-[10px] font-medium">No logo</span>
                </div>
              )}

              <label
                className={`flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 ${
                  disabled ? "pointer-events-none opacity-50" : ""
                }`}
              >
                {uploadingLogo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploadingLogo ? "Uploading…" : "Upload logo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={disabled || uploadingLogo}
                  onChange={handleLogoUpload}
                />
              </label>
            </div>
            <p className="text-[11px] text-slate-400">
              PNG or SVG with a transparent background works best. Max 5MB.
            </p>

            {/* ── Logo presentation ─────────────────────────────────────── */}
            {value.logoUrl ? (
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Size
                    </label>
                    <span className="font-mono text-[11px] text-slate-500">
                      {value.logoScale}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={220}
                    step={5}
                    disabled={disabled}
                    value={value.logoScale}
                    onChange={(e) => patch({ logoScale: Number(e.target.value) })}
                    className="w-full accent-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Shape
                    </label>
                    <div className="flex gap-1">
                      {(["square", "rounded", "circle"] as const).map((shape) => (
                        <button
                          key={shape}
                          type="button"
                          disabled={disabled}
                          onClick={() => patch({ logoShape: shape })}
                          title={shape}
                          className={`flex h-9 flex-1 items-center justify-center border transition-colors ${
                            value.logoShape === shape
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                          style={{
                            borderRadius:
                              shape === "circle" ? "999px" : shape === "rounded" ? "10px" : "2px",
                          }}
                        >
                          <span
                            className="h-4 w-4 border-2 border-current"
                            style={{
                              borderRadius:
                                shape === "circle" ? "999px" : shape === "rounded" ? "4px" : "0",
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Position
                    </label>
                    <div className="flex gap-1">
                      {(
                        [
                          ["left", AlignLeft],
                          ["center", AlignCenter],
                          ["right", AlignRight],
                        ] as const
                      ).map(([align, Icon]) => (
                        <button
                          key={align}
                          type="button"
                          disabled={disabled}
                          onClick={() => patch({ logoAlign: align })}
                          title={align}
                          className={`flex h-9 flex-1 items-center justify-center rounded-md border transition-colors ${
                            value.logoAlign === align
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Crop
                  </label>
                  <div className="flex gap-1">
                    {(
                      [
                        ["contain", "Fit whole logo"],
                        ["cover", "Fill and crop"],
                      ] as const
                    ).map(([fit, label]) => (
                      <button
                        key={fit}
                        type="button"
                        disabled={disabled}
                        onClick={() => patch({ logoFit: fit })}
                        className={`flex-1 rounded-md border px-2 py-2 text-[11px] font-semibold transition-colors ${
                          value.logoFit === fit
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {/* "Fill and crop" trims edges — fine for a photo mark,
                      destructive for a wordmark, so say which is which. */}
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                    Use “Fit whole logo” for wordmarks. “Fill and crop” suits
                    square photo badges but trims the edges.
                  </p>
                </div>
              </div>
            ) : null}

            <Input
              value={value.tagline}
              maxLength={100}
              disabled={disabled}
              onChange={(e) => patch({ tagline: e.target.value })}
              placeholder="Where Legends Are Born"
            />
            <p className="text-[11px] text-slate-400">
              Appears under your academy name on your homepage.
            </p>
          </CardContent>
        </Card>

        {/* Colour */}
        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-4 p-5">
            <SectionLabel icon={<Palette className="h-3 w-3" />}>Colour</SectionLabel>

            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((preset) => {
                const active =
                  value.primaryColor.toLowerCase() === preset.primary &&
                  value.accentColor.toLowerCase() === preset.accent;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      patch({ primaryColor: preset.primary, accentColor: preset.accent })
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
                      disabled={disabled}
                      value={HEX.test(value[field]) ? value[field] : DEFAULT_PRIMARY}
                      onChange={(e) => patch({ [field]: e.target.value } as Partial<BrandingDraft>)}
                      className="h-9 w-9 flex-shrink-0 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                    />
                    <Input
                      value={value[field]}
                      disabled={disabled}
                      onChange={(e) => patch({ [field]: e.target.value } as Partial<BrandingDraft>)}
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
                  <p className="font-semibold">Text on this colour will be hard to read.</p>
                  <p className="mt-0.5">
                    Contrast is {contrast.ratio}:1, below the 4.5:1 needed for normal
                    text.{" "}
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

        {/* Feel */}
        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-3 p-5">
            <SectionLabel icon={<Sparkles className="h-3 w-3" />}>Feel</SectionLabel>
            <div className="space-y-2">
              {(Object.keys(BRAND_STYLES) as BrandStyle[]).map((key) => {
                const preset = BRAND_STYLES[key];
                const active = value.style === key;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    onClick={() => patch({ style: key })}
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

        {/* Background */}
        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-3 p-5">
            <SectionLabel icon={<Palette className="h-3 w-3" />}>
              Page background
            </SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(BACKGROUND_STYLES) as BackgroundStyle[]).map((key) => {
                const preset = BACKGROUND_STYLES[key];
                const active = value.backgroundStyle === key;
                // Swatch built from the same function the page uses, so the
                // chip is literally the surface that will ship.
                const swatch = buildThemeVariables({ ...value, backgroundStyle: key });
                const isDark = swatch["--page-scheme"] === "dark";
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    onClick={() => patch({ backgroundStyle: key })}
                    className={`rounded-lg border p-2 text-left transition-all ${
                      active
                        ? "border-slate-900 ring-2 ring-slate-900/10"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span
                      className="relative mb-1.5 flex h-9 w-full items-center justify-center rounded border border-slate-200/70 text-[10px] font-bold overflow-hidden"
                      style={{
                        background: swatch["--page-bg"],
                        color: swatch["--page-fg"],
                      }}
                    >
                      Aa
                      {/* Dark/light badge */}
                      <span
                        className="absolute bottom-0.5 right-0.5 rounded-full px-1 py-px text-[8px] font-bold leading-none"
                        style={{
                          background: isDark ? "#1e293b" : "#f1f5f9",
                          color: isDark ? "#94a3b8" : "#64748b",
                        }}
                      >
                        {isDark ? "dark" : "light"}
                      </span>
                    </span>
                    <span className="block text-[10px] font-semibold text-slate-700">
                      {preset.label}
                    </span>
                    <span className="mt-0.5 block text-[9px] leading-snug text-slate-400">
                      {preset.description}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Exact colour — optional override of the derived surface. */}
            <div className="border-t border-slate-100 pt-4">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Exact background colour
              </label>
              <div className="flex gap-1.5">
                <input
                  type="color"
                  disabled={disabled}
                  value={HEX.test(value.backgroundColor) ? value.backgroundColor : "#ffffff"}
                  onChange={(e) => patch({ backgroundColor: e.target.value })}
                  className="h-9 w-9 flex-shrink-0 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                />
                <Input
                  value={value.backgroundColor}
                  disabled={disabled}
                  placeholder="Leave empty to use the preset above"
                  onChange={(e) => patch({ backgroundColor: e.target.value })}
                  className="h-9 font-mono text-xs"
                />
                {value.backgroundColor ? (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => patch({ backgroundColor: "" })}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Clear background colour"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                Overrides the preset. Text colour is worked out from whatever you
                pick, so it stays readable — including on very dark or very light
                choices.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Hero media treatment */}
        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-4 p-5">
            <SectionLabel icon={<Sparkles className="h-3 w-3" />}>
              Hero photo &amp; video
            </SectionLabel>
            <p className="text-[11px] leading-relaxed text-slate-400">
              How your header image or video sits behind your name. One setting
              controls phones and desktop together, so what you approve here is
              what everyone sees.
            </p>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Blur
                </label>
                <span className="font-mono text-[11px] text-slate-500">
                  {value.heroBlur}px
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                disabled={disabled}
                value={value.heroBlur}
                onChange={(e) => patch({ heroBlur: Number(e.target.value) })}
                className="w-full accent-slate-900"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Darkening
                </label>
                <span className="font-mono text-[11px] text-slate-500">
                  {value.heroOverlay}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                disabled={disabled}
                value={value.heroOverlay}
                onChange={(e) => patch({ heroOverlay: Number(e.target.value) })}
                className="w-full accent-slate-900"
              />
              {/* Below ~25% a white headline starts to lose against a bright
                  photo. Warned, not blocked — it is their page. */}
              {value.heroOverlay < 25 && (
                <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-amber-600">
                  <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                  Your academy name may be hard to read over a bright photo at
                  this level.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Typeface */}
        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-3 p-5">
            <SectionLabel icon={<Type className="h-3 w-3" />}>Typeface</SectionLabel>
            <div className="space-y-2">
              {(Object.keys(FONT_PRESETS) as FontPreset[]).map((key) => {
                const preset = FONT_PRESETS[key];
                const active = value.fontPreset === key;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    onClick={() => patch({ fontPreset: key })}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      active
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className="text-xl font-extrabold text-slate-800"
                      style={{ fontFamily: preset.heading }}
                    >
                      Aa
                    </span>
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

        {/* ── Density ──────────────────────────────────────────────────── */}
        {/*
         * Two options: compact and spacious. The difference is --section-py
         * (section vertical padding) and --content-gap (card grid gap).
         * These are read by every section via CSS variables, so changing this
         * single setting rescales the whole page at once.
         */}
        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-3 p-5">
            <SectionLabel icon={<LayoutDashboard className="h-3 w-3" />}>Layout density</SectionLabel>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Compact suits academies with a lot to show; spacious suits a
              premium or elite club page.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  [
                    "compact",
                    "Compact",
                    "Tighter sections — more content above the fold",
                  ],
                  [
                    "spacious",
                    "Spacious",
                    "Generous breathing room — premium, unhurried feel",
                  ],
                ] as const
              ).map(([key, label, desc]) => {
                const active = value.density === key;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    onClick={() => patch({ density: key })}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      active
                        ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900/10"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span
                      className="mb-1.5 flex flex-col items-start gap-0.5"
                    >
                      <span className="flex items-center gap-1.5">
                        {key === "compact" ? (
                          <Zap className="h-3.5 w-3.5 text-slate-600" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5 text-slate-600" />
                        )}
                        <span className="text-sm font-semibold text-slate-800">
                          {label}
                        </span>
                      </span>
                    </span>
                    <span className="mt-1 block text-[10px] leading-snug text-slate-400">
                      {desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Per-section accent override ────────────────────────────── */}
        {/*
         * ONE section can trade --brand for --accent as its focal colour.
         * A single contrasting section is how designers create a focal point;
         * every section in accent would be noise. Selecting "None" clears it.
         */}
        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-3 p-5">
            <SectionLabel icon={<Zap className="h-3 w-3" />}>Accent highlight</SectionLabel>
            <p className="text-[11px] leading-relaxed text-slate-400">
              One section can use your accent colour instead of your main brand
              colour — like a spotlight in a show. Pick wisely: only one.
            </p>
            <div className="space-y-1">
              <label
                className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-50"
              >
                <span className="text-sm text-slate-700">None</span>
                <input
                  type="radio"
                  name="accentSection"
                  value=""
                  disabled={disabled}
                  checked={value.accentSection === ""}
                  onChange={() => patch({ accentSection: "" })}
                  className="accent-slate-900"
                />
              </label>
              {DEFAULT_SECTION_ORDER.map((key) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-50"
                >
                  <span className="text-sm text-slate-700">
                    {SECTION_LABELS[key]}
                  </span>
                  <input
                    type="radio"
                    name="accentSection"
                    value={key}
                    disabled={disabled}
                    checked={value.accentSection === key}
                    onChange={() => patch({ accentSection: key })}
                    className="accent-slate-900"
                  />
                </label>
              ))}
            </div>
            {value.accentSection && (
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-600">
                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                {SECTION_LABELS[value.accentSection as SectionKey] ?? value.accentSection}{" "}
                will use your accent colour{" "}
                <span
                  className="inline-block h-3 w-3 rounded-sm border border-slate-200"
                  style={{ background: value.accentColor }}
                />{" "}
                as its focal colour.
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── Section order drag-to-reorder ─────────────────────────────── */}
        {/*
         * HTML5 drag-and-drop: no library needed. The `draggable` attribute on
         * each row is enough. The order is stored in sections.order[] and
         * consumed by AcademyPublicPage, which renders sections in that order
         * rather than the hardcoded JSX sequence. Hidden sections stay hidden.
         */}
        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-3 p-5">
            <SectionLabel icon={<GripVertical className="h-3 w-3" />}>
              Section order
            </SectionLabel>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Drag rows to reorder sections on your homepage. Disabled sections
              are still hidden regardless of position.
            </p>
            <div className="space-y-1.5" role="list" aria-label="Section order">
              {(value.sections.order ?? DEFAULT_SECTION_ORDER).map((key, index) => {
                const label = SECTION_LABELS[key as SectionKey] ?? key;
                const enabled = value.sections[key as SectionKey];
                return (
                  <div
                    key={key}
                    role="listitem"
                    draggable={!disabled}
                    aria-label={`${label}, position ${index + 1}`}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", String(index));
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const from = Number(e.dataTransfer.getData("text/plain"));
                      const to = index;
                      if (from === to) return;
                      const order = [
                        ...(value.sections.order ?? DEFAULT_SECTION_ORDER),
                      ];
                      const [moved] = order.splice(from, 1);
                      order.splice(to, 0, moved);
                      patch({ sections: { ...value.sections, order } });
                    }}
                    className={`flex select-none items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                      disabled ? "cursor-not-allowed opacity-50" : "cursor-grab hover:bg-slate-50 active:cursor-grabbing"
                    } ${
                      enabled
                        ? "border-slate-200 bg-white"
                        : "border-dashed border-slate-200 bg-slate-50/60 opacity-60"
                    }`}
                  >
                    <GripVertical className="h-4 w-4 flex-shrink-0 text-slate-300" />
                    <span className="flex-1 text-sm text-slate-700">{label}</span>
                    {!enabled && (
                      <span className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                        hidden
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Disciplines */}
        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <SectionLabel icon={<Trophy className="h-3 w-3" />}>Disciplines</SectionLabel>
              {sports.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  onClick={seedProgramsFromSports}
                  className="h-7 text-[11px]"
                >
                  Use my sports
                </Button>
              )}
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Leave empty and your homepage lists the sports on your academy
              profile. Add entries here to give each one its own name and blurb.
            </p>

            <div className="space-y-2">
              {value.programs.map((program, index) => (
                <div
                  key={index}
                  className="space-y-2 rounded-lg border border-slate-200 p-3"
                >
                  <div className="flex gap-2">
                    <Input
                      value={program.emoji ?? ""}
                      disabled={disabled}
                      maxLength={4}
                      onChange={(e) => updateProgram(index, { emoji: e.target.value })}
                      className="h-9 w-14 text-center"
                      placeholder="⚽"
                    />
                    <Input
                      value={program.label}
                      disabled={disabled}
                      onChange={(e) =>
                        updateProgram(index, {
                          label: e.target.value,
                          id:
                            program.id ||
                            e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                        })
                      }
                      className="h-9"
                      placeholder="Football"
                    />
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        patch({ programs: value.programs.filter((_, i) => i !== index) })
                      }
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove discipline"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <Input
                    value={program.description ?? ""}
                    disabled={disabled}
                    onChange={(e) => updateProgram(index, { description: e.target.value })}
                    className="h-9 text-xs"
                    placeholder="Short blurb — e.g. All age groups, evening batches"
                  />
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() =>
                patch({
                  programs: [
                    ...value.programs,
                    { id: "", label: "", emoji: "🏅", description: "" },
                  ],
                })
              }
              className="w-full"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add discipline
            </Button>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-3 p-5">
            <SectionLabel icon={<Trophy className="h-3 w-3" />}>Achievements</SectionLabel>
            <div className="space-y-2">
              {value.achievements.map((achievement, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={achievement}
                    disabled={disabled}
                    onChange={(e) =>
                      patch({
                        achievements: value.achievements.map((a, i) =>
                          i === index ? e.target.value : a,
                        ),
                      })
                    }
                    className="h-9"
                    placeholder="State champions 2025"
                  />
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      patch({
                        achievements: value.achievements.filter((_, i) => i !== index),
                      })
                    }
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove achievement"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => patch({ achievements: [...value.achievements, ""] })}
              className="w-full"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add achievement
            </Button>
          </CardContent>
        </Card>

        {/* Gallery */}
        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-3 p-5">
            <SectionLabel icon={<ImageIcon className="h-3 w-3" />}>Photo gallery</SectionLabel>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Shown as a carousel on your homepage. Landscape photos work best.
            </p>

            {value.gallery.length > 0 && (
              <div className="space-y-2">
                {value.gallery.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 p-2"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      loading="lazy"
                      decoding="async"
                      src={item.url}
                      alt={item.caption || `Gallery image ${index + 1}`}
                      className="h-12 w-16 flex-shrink-0 rounded object-cover"
                    />
                    <Input
                      value={item.caption ?? ""}
                      disabled={disabled}
                      onChange={(e) =>
                        patch({
                          gallery: value.gallery.map((g, i) =>
                            i === index ? { ...g, caption: e.target.value } : g,
                          ),
                        })
                      }
                      className="h-9 text-xs"
                      placeholder="Caption (optional)"
                    />
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        patch({ gallery: value.gallery.filter((_, i) => i !== index) })
                      }
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={disabled || uploadingGallery}
              onChange={handleGalleryUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || uploadingGallery}
              onClick={() => galleryInputRef.current?.click()}
              className="w-full"
            >
              {uploadingGallery ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="mr-1.5 h-3.5 w-3.5" />
              )}
              {uploadingGallery ? "Uploading…" : "Add photos"}
            </Button>
          </CardContent>
        </Card>

        {/* Testimonials */}
        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-3 p-5">
            <SectionLabel icon={<Quote className="h-3 w-3" />}>Testimonials</SectionLabel>
            <div className="space-y-2">
              {value.testimonials.map((testimonial, index) => {
                const update = (partial: Partial<AcademyTestimonial>) =>
                  patch({
                    testimonials: value.testimonials.map((t, i) =>
                      i === index ? { ...t, ...partial } : t,
                    ),
                  });
                return (
                  <div
                    key={index}
                    className="space-y-2 rounded-lg border border-slate-200 p-3"
                  >
                    <div className="flex gap-2">
                      <Input
                        value={testimonial.name}
                        disabled={disabled}
                        onChange={(e) => update({ name: e.target.value })}
                        className="h-9"
                        placeholder="Parent or player name"
                      />
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() =>
                          patch({
                            testimonials: value.testimonials.filter((_, i) => i !== index),
                          })
                        }
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove testimonial"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <Input
                      value={testimonial.role ?? ""}
                      disabled={disabled}
                      onChange={(e) => update({ role: e.target.value })}
                      className="h-9 text-xs"
                      placeholder="e.g. Parent of U-14 player"
                    />
                    <Textarea
                      value={testimonial.quote}
                      disabled={disabled}
                      rows={2}
                      onChange={(e) => update({ quote: e.target.value })}
                      className="text-xs"
                      placeholder="What they said…"
                    />
                  </div>
                );
              })}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() =>
                patch({
                  testimonials: [
                    ...value.testimonials,
                    { name: "", role: "", quote: "" },
                  ],
                })
              }
              className="w-full"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add testimonial
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ══ Live preview ════════════════════════════════════════════════ */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Live preview
        </p>
        <div
          style={
            {
              ...variables,
              background: variables["--page-bg"],
              color: variables["--page-fg"],
            } as React.CSSProperties
          }
          className="overflow-hidden rounded-xl border border-slate-200 lg:sticky lg:top-4"
        >
          {/* Hero */}
          <div className="relative overflow-hidden px-6 py-12 text-center">
            <div
              className="absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl"
              style={{ background: "rgb(var(--brand-rgb) / 0.18)" }}
            />
            <div className="relative">
              {value.logoUrl && (
                <div className={`mb-3 flex ${heroLogoAlignClass(value)}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    loading="lazy"
                    decoding="async"
                    src={value.logoUrl}
                    alt=""
                    /**
                     * Same shape/crop/alignment helper the live page uses, at a
                     * third the height because this preview panel is far
                     * shorter than a real hero. Proportion, corner shape and
                     * crop stay exact — only the absolute size is scaled.
                     */
                    style={{
                      ...heroLogoStyle(value),
                      height: `${Math.max(24, Math.round((88 * value.logoScale) / 100 / 2.6))}px`,
                      width: value.logoFit === "cover"
                        ? `${Math.max(24, Math.round((88 * value.logoScale) / 100 / 2.6))}px`
                        : "auto",
                    }}
                  />
                </div>
              )}
              <p
                className="text-3xl font-extrabold tracking-tight"
                style={{
                  color: "var(--page-fg)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                {academyName.split(" ")[0]}{" "}
                <span style={{ color: "var(--brand)" }}>
                  {academyName.split(" ").slice(1).join(" ")}
                </span>
              </p>
              <p
                className="mt-1.5 text-sm"
                style={{
                  color: "var(--page-muted)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {value.tagline || "Where Legends Are Born"}
              </p>
              <button
                type="button"
                className="mt-5 px-5 py-2.5 text-sm font-bold"
                style={{
                  background: "var(--brand)",
                  color: "var(--brand-on)",
                  borderRadius: "var(--brand-radius)",
                  boxShadow: "var(--brand-shadow)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Join the academy
              </button>
            </div>
          </div>

          {/* Disciplines */}
          {value.sections.programs && previewPrograms.length > 0 && (
            <div className="grid grid-cols-3 gap-3 p-5">
              {previewPrograms.slice(0, 3).map((program, i) => (
                <div
                  key={i}
                  className="p-4"
                  style={{
                    background: "var(--brand-soft)",
                    borderRadius: "var(--brand-radius)",
                    border: "1px solid var(--brand-border)",
                  }}
                >
                  <div className="mb-2 text-lg">{program.emoji || "🏅"}</div>
                  {/* These sit on --brand-soft, which is a light tint whatever
                      the page background is, so they keep dark ink. */}
                  <p
                    className="text-xs font-bold text-slate-800"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {program.label || "Discipline"}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {("description" in program && program.description) || "All age groups"}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Stats strip */}
          {value.sections.stats && (
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ background: "var(--brand)", color: "var(--brand-on)" }}
            >
              <div>
                <p
                  className="text-xl font-extrabold"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  240+
                </p>
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
          )}

          {/* Achievements */}
          {value.sections.achievements && value.achievements.some(Boolean) && (
            <div className="flex flex-wrap gap-2 border-t border-slate-100 p-5">
              {value.achievements.filter(Boolean).slice(0, 4).map((achievement, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    background: "var(--brand-soft)",
                    color: "var(--brand-strong)",
                    borderRadius: "calc(var(--brand-radius) * 0.6)",
                  }}
                >
                  🏆 {achievement}
                </span>
              ))}
            </div>
          )}

          {/* Gallery */}
          {value.sections.gallery && value.gallery.length > 0 && (
            <div className="flex gap-2 overflow-x-auto border-t border-slate-100 p-5">
              {value.gallery.slice(0, 6).map((item, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  loading="lazy"
                  decoding="async"
                  key={i}
                  src={item.url}
                  alt={item.caption || ""}
                  className="h-20 w-28 flex-shrink-0 object-cover"
                  style={{ borderRadius: "calc(var(--brand-radius) * 0.6)" }}
                />
              ))}
            </div>
          )}

          {/* Testimonials */}
          {value.sections.testimonials && value.testimonials.some((t) => t.quote) && (
            <div className="border-t border-slate-100 p-5">
              {value.testimonials
                .filter((t) => t.quote)
                .slice(0, 1)
                .map((testimonial, i) => (
                  <div
                    key={i}
                    className="p-4"
                    style={{
                      background: "var(--brand-soft)",
                      borderRadius: "var(--brand-radius)",
                    }}
                  >
                    {/* On --brand-soft, which stays light in every background
                        treatment, so dark ink rather than --page-fg. */}
                    <p className="text-xs italic leading-relaxed text-slate-700">
                      “{testimonial.quote}”
                    </p>
                    <p className="mt-2 text-[11px] font-semibold text-slate-800">
                      {testimonial.name || "A parent"}
                      {testimonial.role ? (
                        <span className="font-normal text-slate-500">
                          {" "}
                          · {testimonial.role}
                        </span>
                      ) : null}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>

        <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-400">
          <Palette className="mt-0.5 h-3 w-3 flex-shrink-0" />
          This preview uses the same colour engine as your live page, so what you
          see here is what parents will see.
        </p>
      </div>
    </div>
  );
};

export default AcademyBrandingEditor;
