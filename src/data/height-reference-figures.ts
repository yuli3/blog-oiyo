/**
 * Public figures with well-documented heights, for the "people close to your
 * height" feature in HeightConverter.tsx. Ported concept from the retired
 * oiyo.net /financial-ratios/-style "learn by example" pattern, adapted for
 * height comparison (2026-08-25).
 *
 * Accuracy rule: only athletes with an official team/league/federation
 * listed height are included. Actors/entertainers are deliberately excluded
 * — publicist-supplied "official" heights for that category are notoriously
 * unreliable and often inflated, and there's no equivalent single
 * authoritative registry to check them against. `source` names the type of
 * record backing each figure so provenance stays traceable; heights are
 * rounded to the nearest cm as commonly reported and should read as
 * approximate, not lab-measured precision.
 *
 * v1 scope: one shared list across all 6 locales (not culturally localized
 * per-locale) — figures are internationally recognizable by name in Latin
 * script in virtually all markets this content reaches. A locale-specific
 * figure set is a distinct follow-up, not part of this pass.
 */
export interface HeightReferenceFigure {
  name: string;
  heightCm: number;
  field: string;
  source: string;
}

export const HEIGHT_REFERENCE_FIGURES: HeightReferenceFigure[] = [
  { name: "Simone Biles", heightCm: 142, field: "Gymnastics", source: "Olympic federation profile" },
  { name: "Kim Yuna", heightCm: 165, field: "Figure skating", source: "Olympic federation profile" },
  { name: "Lionel Messi", heightCm: 170, field: "Football", source: "Club/national team roster" },
  { name: "Serena Williams", heightCm: 175, field: "Tennis", source: "WTA official profile" },
  { name: "Ronaldinho", heightCm: 180, field: "Football", source: "Club roster (retired)" },
  { name: "Naomi Osaka", heightCm: 180, field: "Tennis", source: "WTA official profile" },
  { name: "Rafael Nadal", heightCm: 185, field: "Tennis", source: "ATP official profile" },
  { name: "Venus Williams", heightCm: 185, field: "Tennis", source: "WTA official profile" },
  { name: "Park Tae-hwan", heightCm: 186, field: "Swimming", source: "Olympic federation profile" },
  { name: "Cristiano Ronaldo", heightCm: 187, field: "Football", source: "Club/national team roster" },
  { name: "Novak Djokovic", heightCm: 188, field: "Tennis", source: "ATP official profile" },
  { name: "Stephen Curry", heightCm: 188, field: "Basketball", source: "NBA official roster" },
  { name: "Son Heung-min", heightCm: 183, field: "Football", source: "Club/national team roster" },
  { name: "Michael Phelps", heightCm: 193, field: "Swimming", source: "Olympic federation profile" },
  { name: "Usain Bolt", heightCm: 195, field: "Track & field", source: "Olympic federation profile" },
  { name: "Michael Jordan", heightCm: 198, field: "Basketball", source: "NBA official roster" },
  { name: "LeBron James", heightCm: 206, field: "Basketball", source: "NBA official roster" },
  { name: "Kevin Durant", heightCm: 208, field: "Basketball", source: "NBA official roster" },
  { name: "Shaquille O'Neal", heightCm: 216, field: "Basketball", source: "NBA official roster" },
  { name: "Yao Ming", heightCm: 229, field: "Basketball", source: "NBA official roster" },
];

/** Nearest match(es) to a given height, closest first. */
export function nearestFigures(
  heightCm: number,
  count = 3,
): HeightReferenceFigure[] {
  return [...HEIGHT_REFERENCE_FIGURES]
    .sort((a, b) => Math.abs(a.heightCm - heightCm) - Math.abs(b.heightCm - heightCm))
    .slice(0, count);
}
