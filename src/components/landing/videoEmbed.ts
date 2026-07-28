/**
 * ════════════════════════════════════════════════════════════════════════════
 * VIDEO URL PARSING — pure, and deliberately in its own module
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Kept out of VideoSection.tsx so it can be unit-tested: this project's vitest
 * setup does not transform JSX, so anything exported from a .tsx file is
 * untestable. These parsers are exactly the code that must not silently break
 * — they decide whether an owner's pasted link renders or vanishes.
 *
 * WHY PARSE RATHER THAN IFRAME THE PASTED URL DIRECTLY. An owner pastes what
 * is in their address bar — a watch URL, a Shorts URL, a share link with a
 * tracking suffix. None of those load in an iframe; YouTube refuses to frame
 * /watch. Parsing to a canonical embed URL is the difference between "paste a
 * link" and "find the embed code". It also means we only ever emit a URL we
 * constructed, so a pasted `javascript:` or arbitrary third-party host can
 * never reach an iframe src.
 * ════════════════════════════════════════════════════════════════════════════
 */

export type VideoProvider = "youtube" | "instagram";
export type VideoLayout = "cinematic" | "framed" | "split";

export const VIDEO_LAYOUTS: Record<VideoLayout, { label: string; description: string }> = {
  cinematic: {
    label: "Cinematic",
    description: "Full-width, edge to edge. The video is the section.",
  },
  framed: {
    label: "Framed",
    description: "Centred card with a brand-coloured glow around it.",
  },
  split: {
    label: "Split",
    description: "Video on one side, your heading and text on the other.",
  },
};

/** youtube.com/watch?v=, youtu.be/, /shorts/, /embed/, /live/ → the 11-char id. */
export function parseYouTubeId(raw: string): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([A-Za-z0-9_-]{11})/,
    /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([A-Za-z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1];
  }

  // A bare id pasted on its own.
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;

  return null;
}

/** instagram.com/p/CODE, /reel/CODE, /tv/CODE → the shortcode. */
export function parseInstagramShortcode(raw: string): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;

  const match = value.match(/instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  return match?.[1] ?? null;
}

/**
 * The canonical embed URL, or null when the input is not something we can
 * safely frame. Never returns the owner's raw string.
 */
export function buildEmbedUrl(provider: VideoProvider, url: string): string | null {
  if (!url) return null;

  if (provider === "instagram") {
    const shortcode = parseInstagramShortcode(url);
    return shortcode ? `https://www.instagram.com/p/${shortcode}/embed` : null;
  }

  const id = parseYouTubeId(url);
  // youtube-nocookie: no tracking cookie until the visitor actually presses
  // play. rel=0 keeps end-screen suggestions inside this channel rather than
  // sending a parent off to a competitor academy's video.
  return id
    ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`
    : null;
}
