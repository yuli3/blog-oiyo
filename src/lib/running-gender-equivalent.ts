/**
 * Male ↔ female equivalent running times (blog /running-time-equivalent/, 2026-10-11).
 *
 * The ratio for each distance is the women's world record over the men's, so the page can show
 * exactly where every number comes from (the height converter started without a stated source
 * and had one added later; this one starts with it). Records as listed by World Athletics on
 * 2026-10-11. Women's road records include mixed races, which is how World Athletics ratifies
 * them; the women-only marks are shown on the page but not used.
 *
 * Records move. When one changes, update the row and its date; the tests pin the ratios.
 */
export type RaceId = "5k" | "10k" | "half" | "marathon";

export interface RecordRow {
  id: RaceId;
  km: number;
  men: { seconds: number; athlete: string; date: string };
  women: { seconds: number; athlete: string; date: string };
}

export const RECORDS_AS_OF = "2026-10-11";

export const RECORDS: readonly RecordRow[] = [
  { id: "5k", km: 5, men: { seconds: 12 * 60 + 49, athlete: "Berihu Aregawi", date: "2021-12-31" }, women: { seconds: 13 * 60 + 54, athlete: "Beatrice Chebet", date: "2024-12-31" } },
  { id: "10k", km: 10, men: { seconds: 26 * 60 + 31, athlete: "Yomif Kejelcha", date: "2025-02-16" }, women: { seconds: 28 * 60 + 46, athlete: "Agnes Jebet Ngetich", date: "2024-01-14" } },
  { id: "half", km: 21.0975, men: { seconds: 56 * 60 + 51, athlete: "Yomif Kejelcha", date: "2026-08-23" }, women: { seconds: 3600 + 2 * 60 + 52, athlete: "Letesenbet Gidey", date: "2021-10-24" } },
  { id: "marathon", km: 42.195, men: { seconds: 3600 + 59 * 60 + 30, athlete: "Sabastian Sawe", date: "2026-04-26" }, women: { seconds: 2 * 3600 + 9 * 60 + 56, athlete: "Ruth Chepngetich", date: "2024-10-13" } },
];

export type Direction = "toWomen" | "toMen";

/** Women's record over men's record for a distance: 1.0845 means the women's mark is 8.45% longer. */
export function ratioFor(id: RaceId): number {
  const row = RECORDS.find((item) => item.id === id);
  if (!row) throw new Error(`unknown race ${id}`);
  return row.women.seconds / row.men.seconds;
}

export function equivalentSeconds(seconds: number, id: RaceId, direction: Direction): number {
  const ratio = ratioFor(id);
  return direction === "toWomen" ? seconds * ratio : seconds / ratio;
}

/** "1:23:45", "23:45" or "45" (seconds) → seconds. Returns null for anything else. */
export function parseTime(input: string): number | null {
  const parts = input.trim().split(":");
  if (parts.length === 0 || parts.length > 3 || parts.some((part) => !/^\d{1,3}$/.test(part))) return null;
  const nums = parts.map(Number);
  if (nums.slice(1).some((value) => value >= 60)) return null;
  const seconds = nums.reduce((total, value) => total * 60 + value, 0);
  return seconds > 0 ? seconds : null;
}

export function formatTime(totalSeconds: number): string {
  const rounded = Math.round(totalSeconds);
  const h = Math.floor(rounded / 3600);
  const m = Math.floor((rounded % 3600) / 60);
  const s = rounded % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
