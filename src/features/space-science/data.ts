// Shared constants for the space-science labs (academy: 지구과학·우주 입문).
// Physical values: NASA Planetary Fact Sheet (mean radius, semi-major axis, sidereal period).
// https://nssdc.gsfc.nasa.gov/planetary/factsheet/
import { Body } from "astronomy-engine";

export type SpaceLocale = "ko" | "en";

export const AU_KM = 149_597_870.7;
export const LIGHT_SECONDS_PER_AU = 499.004784;
export const SUN_RADIUS_KM = 695_700;

export type PlanetId =
  | "mercury"
  | "venus"
  | "earth"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune";

export interface PlanetInfo {
  id: PlanetId;
  body: Body;
  /** mean radius, km */
  radiusKm: number;
  /** semi-major axis, AU */
  aAu: number;
  /** sidereal orbital period, days */
  periodDays: number;
  /** base colour used by the 3D scene and SVG markers */
  color: string;
  /** second colour for banded gas giants */
  band?: string;
  kind: "rocky" | "giant";
}

export const PLANETS: PlanetInfo[] = [
  { id: "mercury", body: Body.Mercury, radiusKm: 2439.7, aAu: 0.387, periodDays: 87.969, color: "#9ca3af", kind: "rocky" },
  { id: "venus", body: Body.Venus, radiusKm: 6051.8, aAu: 0.723, periodDays: 224.701, color: "#e8c58a", kind: "rocky" },
  { id: "earth", body: Body.Earth, radiusKm: 6371.0, aAu: 1.0, periodDays: 365.256, color: "#3b82c4", band: "#4f9d5a", kind: "rocky" },
  { id: "mars", body: Body.Mars, radiusKm: 3389.5, aAu: 1.524, periodDays: 686.98, color: "#c1440e", kind: "rocky" },
  { id: "jupiter", body: Body.Jupiter, radiusKm: 69_911, aAu: 5.203, periodDays: 4332.59, color: "#d8b48a", band: "#a5734b", kind: "giant" },
  { id: "saturn", body: Body.Saturn, radiusKm: 58_232, aAu: 9.537, periodDays: 10_759.22, color: "#e3cf9a", band: "#b99a5f", kind: "giant" },
  { id: "uranus", body: Body.Uranus, radiusKm: 25_362, aAu: 19.19, periodDays: 30_688.5, color: "#9fd6dc", band: "#86c3cb", kind: "giant" },
  { id: "neptune", body: Body.Neptune, radiusKm: 24_622, aAu: 30.07, periodDays: 60_182, color: "#4a6fd1", band: "#3a58b0", kind: "giant" },
];

export const PLANET_NAMES: Record<SpaceLocale, Record<PlanetId | "sun" | "moon", string>> = {
  ko: { sun: "태양", moon: "달", mercury: "수성", venus: "금성", earth: "지구", mars: "화성", jupiter: "목성", saturn: "토성", uranus: "천왕성", neptune: "해왕성" },
  en: { sun: "Sun", moon: "Moon", mercury: "Mercury", venus: "Venus", earth: "Earth", mars: "Mars", jupiter: "Jupiter", saturn: "Saturn", uranus: "Uranus", neptune: "Neptune" },
};

export function asLocale(locale?: string): SpaceLocale {
  return locale === "en" ? "en" : "ko";
}

/** "8분 19초" / "8 min 19 s" style duration from seconds. */
export function formatDuration(seconds: number, locale: SpaceLocale): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (locale === "ko") {
    if (h > 0) return `${h}시간 ${m}분`;
    if (m > 0) return `${m}분 ${sec}초`;
    return `${sec}초`;
  }
  if (h > 0) return `${h} h ${m} min`;
  if (m > 0) return `${m} min ${sec} s`;
  return `${sec} s`;
}

export function formatDate(date: Date, locale: SpaceLocale, withTime = false): string {
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

/** yyyy-mm-dd in local time, for <input type="date">. */
export function toDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromDateInput(value: string): Date | null {
  const parts = value.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  return new Date(parts[0], parts[1] - 1, parts[2], 21, 0, 0);
}

/**
 * Scene colours for astronomical bodies drawn in SVG/WebGL. These depict the
 * objects themselves (Sun, Moon, rings), not UI chrome, so they are data rather
 * than theme tokens; UI text and lines in the labs use theme tokens.
 */
export const SCENE = {
  sun: "#fbbf24",
  sunlight: "#fef9c3",
  highlight: "#fde68a",
  ring: "#d6c08e",
  moonLit: "#f5f0dc",
  moonDark: "#1f2937",
  space: "#05070f",
  orbit: "#475569",
  label: "#cbd5e1",
} as const;
