/**
 * Turning an academy's real `sports[]` into presentable discipline cards.
 *
 * Shared by the branding editor (to seed the list an owner then edits) and by
 * the public SportsGrid (to render something honest when they never did). Both
 * must agree, or the "Use my sports" button would produce different cards than
 * the page shows.
 */

export interface DerivedProgram {
  id: string;
  label: string;
  emoji?: string;
  description?: string;
  image?: string;
}

export const SPORT_EMOJI: Record<string, string> = {
  football: "⚽",
  soccer: "⚽",
  cricket: "🏏",
  basketball: "🏀",
  tennis: "🎾",
  badminton: "🏸",
  swimming: "🏊",
  athletics: "🏃",
  running: "🏃",
  hockey: "🏑",
  volleyball: "🏐",
  boxing: "🥊",
  chess: "♟️",
  karate: "🥋",
  judo: "🥋",
  taekwondo: "🥋",
  skating: "⛸️",
  cycling: "🚴",
  golf: "⛳",
  baseball: "⚾",
  rugby: "🏉",
  gym: "🏋️",
  fitness: "🏋️",
  yoga: "🧘",
  archery: "🏹",
  kabaddi: "🤼",
  wrestling: "🤼",
  "table tennis": "🏓",
};

export function emojiForSport(sport: string): string {
  return SPORT_EMOJI[String(sport).toLowerCase().trim()] ?? "🏅";
}

export function slugifySport(sport: string): string {
  return (
    String(sport)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || String(sport).toLowerCase().trim()
  );
}

export function titleCaseSport(sport: string): string {
  const cleaned = String(sport).trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/** One card per sport the academy actually offers. */
export function deriveProgramsFromSports(sports: string[] = []): DerivedProgram[] {
  return sports.filter(Boolean).map((sport) => ({
    id: slugifySport(sport),
    label: titleCaseSport(sport),
    emoji: emojiForSport(sport),
    description: "",
  }));
}
