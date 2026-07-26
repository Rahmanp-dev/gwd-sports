"use client";
import React, { useCallback, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  AlertTriangle,
  Contrast,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  Palette,
  Plus,
  Quote,
  Sparkles,
  Trophy,
  Type,
  Upload,
  X,
} from "lucide-react";
import {
  BRAND_STYLES,
  DEFAULT_ACCENT,
  DEFAULT_PRIMARY,
  FONT_PRESETS,
  assessContrast,
  buildThemeVariables,
  isBrandStyle,
  isFontPreset,
  parseHex,
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
  tagline: string;
  logoUrl: string;
  programs: AcademyProgram[];
  testimonials: AcademyTestimonial[];
  gallery: AcademyGalleryItem[];
  achievements: string[];
  sections: AcademyHomepageSections;
}

export const DEFAULT_SECTIONS: AcademyHomepageSections = {
  programs: true,
  achievements: true,
  testimonials: true,
  gallery: true,
  stats: true,
};

export function defaultBrandingDraft(): BrandingDraft {
  return {
    primaryColor: DEFAULT_PRIMARY,
    accentColor: DEFAULT_ACCENT,
    style: "classic",
    fontPreset: "sans",
    tagline: "",
    logoUrl: "",
    programs: [],
    testimonials: [],
    gallery: [],
    achievements: [],
    sections: { ...DEFAULT_SECTIONS },
  };
}

/** Reads a saved academy into a draft, tolerating documents written before
 *  any of these fields existed. */
export function draftFromAcademy(academy?: Partial<Academy> | null): BrandingDraft {
  const theme = academy?.theme;
  const base = defaultBrandingDraft();
  if (!theme) return { ...base, achievements: academy?.achievements ?? [] };

  return {
    primaryColor: theme.primaryColor || base.primaryColor,
    accentColor: theme.accentColor || base.accentColor,
    style: isBrandStyle(theme.style) ? theme.style : base.style,
    fontPreset: isFontPreset(theme.fontPreset) ? theme.fontPreset : base.fontPreset,
    tagline: theme.tagline ?? "",
    logoUrl: theme.logoUrl ?? "",
    programs: theme.programs ?? [],
    testimonials: theme.testimonials ?? [],
    gallery: theme.gallery ?? [],
    achievements: academy?.achievements ?? [],
    sections: { ...DEFAULT_SECTIONS, ...(theme.sections ?? {}) },
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
    "theme.tagline": draft.tagline,
    "theme.logoUrl": draft.logoUrl,
    "theme.programs": draft.programs,
    "theme.testimonials": draft.testimonials,
    "theme.gallery": draft.gallery,
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

        {/* Homepage sections */}
        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-3 p-5">
            <SectionLabel icon={<GripVertical className="h-3 w-3" />}>
              Homepage sections
            </SectionLabel>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Turn off anything you have nothing to show yet — an empty section
              looks worse than no section.
            </p>
            <div className="space-y-1">
              {(
                [
                  ["programs", "Disciplines"],
                  ["stats", "Stats strip"],
                  ["achievements", "Achievements"],
                  ["gallery", "Photo gallery"],
                  ["testimonials", "Testimonials"],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-50"
                >
                  <span className="text-sm text-slate-700">{label}</span>
                  <Switch
                    checked={value.sections[key]}
                    disabled={disabled}
                    onCheckedChange={(checked) =>
                      patch({ sections: { ...value.sections, [key]: checked } })
                    }
                  />
                </label>
              ))}
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
          style={variables as React.CSSProperties}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:sticky lg:top-4"
        >
          {/* Hero */}
          <div className="relative overflow-hidden bg-slate-50 px-6 py-12 text-center">
            <div
              className="absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl"
              style={{ background: "rgb(var(--brand-rgb) / 0.18)" }}
            />
            <div className="relative">
              {value.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={value.logoUrl}
                  alt=""
                  className="mx-auto mb-3 h-12 object-contain"
                />
              )}
              <p
                className="text-3xl font-extrabold tracking-tight text-slate-900"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {academyName.split(" ")[0]}{" "}
                <span style={{ color: "var(--brand)" }}>
                  {academyName.split(" ").slice(1).join(" ")}
                </span>
              </p>
              <p
                className="mt-1.5 text-sm text-slate-500"
                style={{ fontFamily: "var(--font-body)" }}
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
