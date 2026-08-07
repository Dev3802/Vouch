/** Placeholder photos for seed personas, keyed by persona id. */
export const PERSONA_PHOTOS: Record<string, string> = {
  p0: "/photos/marcus.jpg",
  p1: "/photos/dana.jpg",
  p2: "/photos/riley.jpg",
  p3: "/photos/priya.jpg",
  p4: "/photos/jordan.jpg",
  p5: "/photos/sofia.jpg",
  p6: "/photos/theo.jpg",
  p7: "/photos/amara.jpg",
};

/** Personas with a verified badge, keyed by persona id. */
export const PERSONA_VERIFIED: Record<string, boolean> = {
  p0: true,
};

/** "Marcus Webb" -> "MW", "Tala" -> "T" */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
