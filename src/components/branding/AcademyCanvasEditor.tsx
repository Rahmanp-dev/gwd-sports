"use client";
import React, { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Monitor,
  Palette,
  Pencil,
  Smartphone,
  X,
} from "lucide-react";
import HeroSection from "@/components/landing/HeroSection";
import SportsGrid from "@/components/landing/SportsGrid";
import StatsSection from "@/components/landing/StatsSection";
import WhyChooseUs from "@/components/landing/WhyChooseUs";
import VideoSection from "@/components/landing/VideoSection";
import GallerySection from "@/components/landing/GallerySection";
import TestimonialsCarousel from "@/components/landing/TestimonialsCarousel";
import Footer from "@/components/landing/Footer";
import AcademyTheme from "@/components/branding/AcademyTheme";
import {
  AcademyBrandingEditor,
  BRANDING_PANEL_LABELS,
  DEFAULT_SECTION_ORDER,
  SECTION_LABELS,
  type BrandingDraft,
  type BrandingPanel,
  type SectionKey,
} from "./AcademyBrandingEditor";
import { draftToPreviewAcademy } from "./draftPreview";
import { Button } from "@/components/ui/button";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE THEME ENGINE AS THE PAGE ITSELF
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The previous editor was seventeen control cards beside a postage-stamp
 * mock-up. An owner changed something on the left and tried to imagine the
 * result on the right. This renders the ACTUAL homepage — the same
 * components `AcademyPublicPage` ships, in the same order, with the same
 * theme engine — and lets the owner click a section on the page to edit it.
 *
 * WHY THE REAL COMPONENTS AND NOT A FAITHFUL COPY. A copy has to be kept in
 * sync by hand, and the moment it drifts the owner is approving something
 * other than what publishes. Importing the real sections means the canvas
 * cannot disagree with production: if the section changes, this changes.
 *
 * WHAT THIS COMPONENT DOES NOT OWN. It holds no branding state. `value` and
 * `onChange` pass straight through to AcademyBrandingEditor, which is still
 * the single place every control lives — this only decides WHICH of those
 * controls is on screen (`only`) and renders the page around them. That
 * keeps the super admin onboarding form and the owner's settings tab on one
 * implementation, which is the whole reason the editor was unified.
 * ════════════════════════════════════════════════════════════════════════════
 */

/** Canvas section key → the control panels that edit it. */
const SECTION_PANELS: Record<string, BrandingPanel[]> = {
  hero: ["hero", "brand"],
  programs: ["programs"],
  stats: ["stats"],
  achievements: ["highlights", "achievements"],
  video: ["video"],
  gallery: ["gallery"],
  testimonials: ["testimonials"],
  footer: ["footer"],
};

const SECTION_TITLES: Record<string, string> = {
  hero: "Hero",
  footer: "Footer",
  ...SECTION_LABELS,
};

const CANVAS_SECTIONS: Record<string, React.ComponentType<{ academy: any }>> = {
  programs: SportsGrid,
  stats: StatsSection,
  achievements: WhyChooseUs,
  video: VideoSection,
  gallery: GallerySection,
  testimonials: TestimonialsCarousel,
};

export interface AcademyCanvasEditorProps {
  value: BrandingDraft;
  onChange: (next: BrandingDraft) => void;
  /** The saved academy, for content the draft does not carry (students, events). */
  academy?: Record<string, any> | null;
  academyName?: string;
  sports?: string[];
  disabled?: boolean;
}

export const AcademyCanvasEditor: React.FC<AcademyCanvasEditorProps> = ({
  value,
  onChange,
  academy,
  academyName = "Your Academy",
  sports = [],
  disabled = false,
}) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  // Rebuilt on every keystroke — cheap, and the whole point is that the page
  // below reflects the draft immediately.
  const previewAcademy = useMemo(
    () => draftToPreviewAcademy(value, { name: academyName, sports, ...(academy ?? {}) }),
    [value, academy, academyName, sports],
  );

  const order = useMemo(() => {
    const saved = value.sections.order ?? [];
    return [
      ...saved.filter((k) => DEFAULT_SECTION_ORDER.includes(k as SectionKey)),
      ...DEFAULT_SECTION_ORDER.filter((k) => !saved.includes(k)),
    ];
  }, [value.sections.order]);

  const setSectionVisible = (key: string, visible: boolean) =>
    onChange({
      ...value,
      sections: { ...value.sections, [key]: visible },
    });

  const move = (key: string, direction: -1 | 1) => {
    const current = [...order];
    const index = current.indexOf(key);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= current.length) return;
    [current[index], current[target]] = [current[target], current[index]];
    onChange({ ...value, sections: { ...value.sections, order: current } });
  };

  const activePanels = selected ? SECTION_PANELS[selected] : undefined;

  return (
    <div className="relative">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">
            Your homepage
          </span>
          <span className="hidden text-xs text-slate-400 sm:inline">
            Click any section to edit it
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={selected === "__brand" ? "default" : "outline"}
            size="sm"
            onClick={() =>
              setSelected(selected === "__brand" ? null : "__brand")
            }
          >
            <Palette className="mr-1.5 h-3.5 w-3.5" />
            Brand
          </Button>

          <div className="flex overflow-hidden rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              aria-label="Desktop preview"
              aria-pressed={device === "desktop"}
              className={`px-2.5 py-1.5 transition-colors ${
                device === "desktop"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-500 hover:text-slate-800"
              }`}
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              aria-label="Mobile preview"
              aria-pressed={device === "mobile"}
              className={`px-2.5 py-1.5 transition-colors ${
                device === "mobile"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-500 hover:text-slate-800"
              }`}
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_minmax(0,420px)]">
        {/* ── Canvas ───────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-2 sm:p-3">
          <div
            className={`mx-auto overflow-hidden rounded-lg bg-white shadow-sm transition-all ${
              device === "mobile" ? "w-[390px] max-w-full" : "w-full"
            }`}
          >
            {/*
              `pointer-events-none` on the section content: inside the canvas a
              click means "edit this", not "follow this link". Without it an
              owner clicking the hero's call-to-action would be navigated to
              the sign-in page mid-edit, losing unsaved work.
            */}
            <AcademyTheme
              theme={previewAcademy.theme}
              as="div"
              style={{
                background: "var(--page-bg)",
                color: "var(--page-fg)",
                display: "block",
              }}
            >
              <CanvasSection
                sectionKey="hero"
                title="Hero"
                selected={selected === "hero"}
                onSelect={() => setSelected(selected === "hero" ? null : "hero")}
                canToggle={false}
                canMove={false}
              >
                <HeroSection academy={previewAcademy} />
              </CanvasSection>

              {/*
                `renderedCount` mirrors AcademyPublicPage exactly: the
                alternating band is keyed on how many sections have actually
                RENDERED, not on the index in the order array. Using the index
                here would drift from the live page the moment a section is
                hidden — and the whole promise of this canvas is that it
                cannot drift.
              */}
              {(() => {
                let renderedCount = 0;
                return order.map((key, index) => {
                  const Section = CANVAS_SECTIONS[key];
                  if (!Section) return null;

                  const visible = value.sections[key as SectionKey] !== false;
                  // A hidden section still occupies a slot on the canvas (the
                  // owner needs to see and un-hide it), but must not consume a
                  // band position, or the live page's rhythm would differ.
                  const band = visible
                    ? renderedCount % 2 === 0
                      ? "primary"
                      : "alt"
                    : undefined;
                  if (visible) renderedCount++;

                  return (
                    <CanvasSection
                      key={key}
                      sectionKey={key}
                      title={SECTION_TITLES[key] ?? key}
                      selected={selected === key}
                      hidden={!visible}
                      band={band}
                      accented={Boolean(
                        value.accentSection && value.accentSection === key,
                      )}
                      onSelect={() => setSelected(selected === key ? null : key)}
                      onToggle={() => setSectionVisible(key, !visible)}
                      onMoveUp={index > 0 ? () => move(key, -1) : undefined}
                      onMoveDown={
                        index < order.length - 1 ? () => move(key, 1) : undefined
                      }
                      disabled={disabled}
                    >
                      <Section academy={previewAcademy} />
                    </CanvasSection>
                  );
                });
              })()}

              <CanvasSection
                sectionKey="footer"
                title="Footer"
                selected={selected === "footer"}
                onSelect={() =>
                  setSelected(selected === "footer" ? null : "footer")
                }
                canToggle={false}
                canMove={false}
              >
                <Footer academy={previewAcademy} />
              </CanvasSection>
            </AcademyTheme>
          </div>
        </div>

        {/* ── Contextual controls ──────────────────────────────────────── */}
        <div className="xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto">
          {selected ? (
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">
                  {selected === "__brand"
                    ? "Brand & colours"
                    : `Editing: ${SECTION_TITLES[selected] ?? selected}`}
                </p>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Close editor"
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <AcademyBrandingEditor
                value={value}
                onChange={onChange}
                academyName={academyName}
                sports={sports}
                disabled={disabled}
                hidePreview
                only={
                  selected === "__brand"
                    ? ["brand", "layout"]
                    : (activePanels ?? ["brand"])
                }
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
              <Pencil className="mx-auto mb-2 h-5 w-5 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">
                Pick a section to edit
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Hover any part of the page and press Edit — or use Brand for
                colours, fonts and section order.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {Object.entries(BRANDING_PANEL_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      const match = Object.entries(SECTION_PANELS).find(([, panels]) =>
                        panels.includes(key as BrandingPanel),
                      );
                      setSelected(match ? match[0] : "__brand");
                    }}
                    className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * One clickable, hoverable band on the canvas.
 *
 * The overlay is a sibling of the content rather than a wrapper with a click
 * handler, so the section renders at its true size with no extra box in the
 * layout — a wrapper with padding or a border would shift everything and the
 * canvas would stop matching the real page.
 */
function CanvasSection({
  sectionKey,
  title,
  children,
  selected,
  hidden = false,
  band,
  accented = false,
  onSelect,
  onToggle,
  onMoveUp,
  onMoveDown,
  canToggle = true,
  canMove = true,
  disabled = false,
}: {
  sectionKey: string;
  title: string;
  children: React.ReactNode;
  selected: boolean;
  hidden?: boolean;
  /** 'primary' | 'alt' — the same alternating band the live page uses. */
  band?: string;
  accented?: boolean;
  onSelect: () => void;
  onToggle?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canToggle?: boolean;
  canMove?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className="group/canvas relative"
      data-canvas-section={sectionKey}
      /* Same attributes AcademyPublicPage sets, so the identical globals.css
         rules paint the band and swap --brand→--accent here too. */
      data-band={band}
      data-section-accent={accented ? sectionKey : undefined}
      aria-label={title}
    >
      {/* The real section. Non-interactive inside the canvas — see above. */}
      <div
        className={`pointer-events-none select-none transition-opacity ${
          hidden ? "opacity-30 grayscale" : ""
        }`}
      >
        {children}
      </div>

      {/* Selection ring */}
      <div
        className={`pointer-events-none absolute inset-0 transition-all ${
          selected
            ? "ring-2 ring-inset ring-blue-500"
            : "ring-0 ring-inset ring-blue-400/50 group-hover/canvas:ring-2"
        }`}
      />

      {/*
        Hover/selected controls.
        `focus-within:opacity-100` is not decoration: without it these controls
        are reachable by Tab but invisible while focused, so a keyboard user
        tabs through a row of buttons they cannot see.
      */}
      <div
        className={`absolute right-3 top-3 z-10 flex items-center gap-1 rounded-lg border border-slate-200 bg-white/95 p-1 shadow-md backdrop-blur transition-opacity focus-within:opacity-100 ${
          selected ? "opacity-100" : "opacity-0 group-hover/canvas:opacity-100"
        }`}
      >
        <span className="px-1.5 text-[11px] font-semibold text-slate-500">
          {title}
        </span>

        {canMove && (
          <>
            <button
              type="button"
              disabled={disabled || !onMoveUp}
              onClick={onMoveUp}
              aria-label={`Move ${title} up`}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={disabled || !onMoveDown}
              onClick={onMoveDown}
              aria-label={`Move ${title} down`}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </>
        )}

        {canToggle && onToggle && (
          <button
            type="button"
            disabled={disabled}
            onClick={onToggle}
            aria-label={hidden ? `Show ${title}` : `Hide ${title}`}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
          >
            {hidden ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onSelect}
          className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition-colors ${
            selected
              ? "bg-blue-600 text-white"
              : "bg-slate-900 text-white hover:bg-slate-700"
          }`}
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>
      </div>

      {/* An empty section still needs to be clickable, or a section the owner
          has not filled in yet becomes unreachable on the canvas. */}
      {hidden && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-semibold text-white">
            Hidden on your live page
          </span>
        </div>
      )}
    </div>
  );
}

export default AcademyCanvasEditor;
