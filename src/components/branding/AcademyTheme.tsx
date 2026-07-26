"use client";
import React from "react";
import { buildThemeVariables, type BrandInput } from "@/lib/branding/palette";

/**
 * Applies an academy's brand as CSS custom properties on a wrapper element.
 *
 * WHY VARIABLES AND NOT PROPS. The previous approach threaded `primaryColor`
 * down and set `style={{ color }}` at each use site. The result was that two of
 * nine landing components honoured the theme and seven quietly rendered the
 * platform's blue — because every new section had to remember to opt in, and
 * none of them did. A variable set once at the root reaches every descendant,
 * including components nobody thought about.
 *
 * The variables are computed by the same pure function the branding studio's
 * live preview uses, so the preview cannot disagree with the real page.
 *
 * `display: contents` keeps this wrapper out of the layout entirely — it exists
 * only to carry the custom properties, and must not introduce a block box that
 * changes how the page stacks.
 */
export function AcademyTheme({
  theme,
  children,
  as: Tag = "div",
  className,
  style,
}: {
  theme?: BrandInput | null;
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
  /** Merged AFTER the theme variables, so a caller can consume one — e.g.
   *  `background: var(--page-bg)` — on the very element that defines it. */
  style?: React.CSSProperties;
}) {
  const variables = React.useMemo(
    () => buildThemeVariables(theme ?? {}),
    [
      theme?.primaryColor,
      theme?.accentColor,
      theme?.style,
      theme?.fontPreset,
      theme?.backgroundStyle,
    ],
  );

  return (
    <Tag
      style={
        {
          ...variables,
          fontFamily: variables["--font-body"],
          ...style,
        } as React.CSSProperties
      }
      className={className ?? "contents"}
      data-brand-style={theme?.style ?? "classic"}
    >
      {children}
    </Tag>
  );
}

export default AcademyTheme;
