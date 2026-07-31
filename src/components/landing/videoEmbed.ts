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

/**
 * ────────────────────────────────────────────────────────────────────────────
 * ASPECT RATIO
 * ────────────────────────────────────────────────────────────────────────────
 *
 * The frame used to be hard-coded to 16:9. That is right for exactly one of
 * the things owners actually paste. A YouTube Short, an Instagram Reel and a
 * portrait post are all TALLER than they are wide, so each was letterboxed
 * into a 16:9 box — a thin strip of video marooned in two black slabs, which
 * is what an owner sees and reasonably calls broken.
 *
 * Two things fix it. `detectAspect` reads the shape out of the URL itself —
 * a /shorts/ or /reel/ link is 9:16 and we already know that at parse time, so
 * the sensible default costs the owner nothing. And `aspect` is then an
 * explicit setting, because detection cannot be right every time: a landscape
 * clip can be posted to Reels, and a square post is indistinguishable from a
 * portrait one by URL alone.
 * ────────────────────────────────────────────────────────────────────────────
 */

export type VideoAspect = "auto" | "16:9" | "9:16" | "1:1" | "4:5" | "21:9";

export const VIDEO_ASPECTS: Record<
  Exclude<VideoAspect, "auto">,
  { label: string; hint: string; css: string; /** Tailwind cap so a tall video is not enormous. */ cap: string }
> = {
  "16:9": { label: "Landscape", hint: "Standard YouTube video", css: "16 / 9", cap: "max-w-5xl" },
  "9:16": { label: "Portrait",  hint: "Shorts and Reels",      css: "9 / 16", cap: "max-w-[380px]" },
  "1:1":  { label: "Square",    hint: "Square Instagram post",  css: "1 / 1",  cap: "max-w-lg" },
  "4:5":  { label: "Tall post", hint: "Portrait Instagram post", css: "4 / 5", cap: "max-w-md" },
  "21:9": { label: "Cinematic", hint: "Ultra-wide showreel",    css: "21 / 9", cap: "max-w-6xl" },
};

export function isVideoAspect(value: unknown): value is VideoAspect {
  return value === "auto" || (typeof value === "string" && value in VIDEO_ASPECTS);
}

/** What kind of thing the owner pasted. Drives the automatic aspect. */
export type VideoShape = "landscape" | "portrait" | "square";

/**
 * Reads the likely shape straight out of the URL.
 *
 * Instagram `/p/` is deliberately reported as square rather than portrait: a
 * square frame shows a 4:5 post with modest padding, whereas a 4:5 frame crops
 * nothing but leaves a square post with side bars. Guessing the *less* tall
 * option is the safer error.
 */
export function detectShape(provider: VideoProvider, raw: string): VideoShape {
  const value = (raw ?? "").trim();
  if (provider === "instagram") {
    return /instagram\.com\/(?:reel|reels|tv)\//i.test(value) ? "portrait" : "square";
  }
  return /youtube\.com\/shorts\//i.test(value) ? "portrait" : "landscape";
}

const SHAPE_TO_ASPECT: Record<VideoShape, Exclude<VideoAspect, "auto">> = {
  landscape: "16:9",
  portrait: "9:16",
  square: "1:1",
};

/** The concrete ratio to render, honouring an explicit choice over detection. */
export function resolveAspect(
  configured: unknown,
  provider: VideoProvider,
  url: string
): Exclude<VideoAspect, "auto"> {
  if (isVideoAspect(configured) && configured !== "auto") return configured;
  return SHAPE_TO_ASPECT[detectShape(provider, url)];
}

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
