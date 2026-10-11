/**
 * Male ↔ female CrossFit weight conversion (blog /crossfit-male-to-female-weight-converter/, 2026-10-11).
 *
 * The ratio is the mean of the women's over men's Rx loads in the benchmark standards below, so the
 * page can show where the number comes from. Pounds are the published loads; kilograms are the
 * metric pairs used in the CrossFit Open, which are rounded separately and are not lb × 0.4536.
 * The tests pin the ratio, so a changed standard is a deliberate edit.
 */
export type Unit = "lb" | "kg";
export type Direction = "toWomen" | "toMen";

export interface Standard {
  id: string;
  name: string;
  movement: string;
  lb: { men: number; women: number };
  kg: { men: number; women: number };
}

export const STANDARDS: readonly Standard[] = [
  { id: "fran", name: "Fran", movement: "Thruster", lb: { men: 95, women: 65 }, kg: { men: 43, women: 29 } },
  { id: "grace", name: "Grace", movement: "Clean and jerk", lb: { men: 135, women: 95 }, kg: { men: 61, women: 43 } },
  { id: "isabel", name: "Isabel", movement: "Snatch", lb: { men: 135, women: 95 }, kg: { men: 61, women: 43 } },
  { id: "dt", name: "DT", movement: "Deadlift, hang power clean, push jerk", lb: { men: 155, women: 105 }, kg: { men: 70, women: 47 } },
  { id: "diane", name: "Diane", movement: "Deadlift", lb: { men: 225, women: 155 }, kg: { men: 102, women: 70 } },
  { id: "kettlebell", name: "Kettlebell swing", movement: "Kettlebell", lb: { men: 53, women: 35 }, kg: { men: 24, women: 16 } },
  { id: "dumbbell", name: "Dumbbell (Open)", movement: "Dumbbell", lb: { men: 50, women: 35 }, kg: { men: 22.5, women: 15 } },
  { id: "wallball", name: "Wall ball", movement: "Medicine ball", lb: { men: 20, women: 14 }, kg: { men: 9, women: 6 } },
];

/** Mean women's / men's load across the pound standards: about 0.69. */
export const RATIO = STANDARDS.reduce((sum, row) => sum + row.lb.women / row.lb.men, 0) / STANDARDS.length;

/** Smallest practical jump: a pair of 2.5 lb or 1.25 kg plates. */
export const STEP: Record<Unit, number> = { lb: 5, kg: 2.5 };

export function equivalentWeight(value: number, direction: Direction): number {
  return direction === "toWomen" ? value * RATIO : value / RATIO;
}

export function roundToStep(value: number, unit: Unit): number {
  const step = STEP[unit];
  return Math.round(value / step) * step;
}

/** Standards whose source-side load equals the input, so the page can show the published pair instead of an estimate. */
export function matchingStandards(value: number, unit: Unit, direction: Direction): Standard[] {
  const from = direction === "toWomen" ? "men" : "women";
  return STANDARDS.filter((row) => Math.abs(row[unit][from] - value) < 0.01);
}

export function formatWeight(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}
