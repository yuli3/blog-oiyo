/**
 * Unit conversion data (SSOT) for the physical unit converter cluster.
 * Linear categories use a base-unit factor; temperature uses to/from functions
 * (it is affine, not a pure factor). The UnitConverter island reads this.
 */
export interface UnitDef {
  key: string;
  symbol: string;
  /** value in the category's base unit = value * factor (linear units) */
  factor?: number;
  /** non-linear: convert a value of this unit TO the base unit */
  toBase?: (v: number) => number;
  /** non-linear: convert a base-unit value TO this unit */
  fromBase?: (v: number) => number;
}

export interface UnitCategory {
  id: string;
  units: UnitDef[];
  defaultFrom: string;
  defaultTo: string;
  /** sensible default input value shown on load */
  defaultValue: number;
}

const lin = (key: string, symbol: string, factor: number): UnitDef => ({ key, symbol, factor });

export const UNIT_CATEGORIES: Record<string, UnitCategory> = {
  temperature: {
    id: "temperature",
    defaultFrom: "c",
    defaultTo: "f",
    defaultValue: 100,
    units: [
      { key: "c", symbol: "°C", toBase: (v) => v, fromBase: (v) => v },
      { key: "f", symbol: "°F", toBase: (v) => (v - 32) * (5 / 9), fromBase: (v) => v * (9 / 5) + 32 },
      { key: "k", symbol: "K", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
  },
  // base unit: gram
  weight: {
    id: "weight",
    defaultFrom: "kg",
    defaultTo: "lb",
    defaultValue: 1,
    units: [
      lin("mg", "mg", 0.001),
      lin("g", "g", 1),
      lin("kg", "kg", 1000),
      lin("t", "t", 1_000_000),
      lin("oz", "oz", 28.349523125),
      lin("lb", "lb", 453.59237),
      lin("stone", "st", 6350.29318),
    ],
  },
  // base unit: milliliter
  volume: {
    id: "volume",
    defaultFrom: "l",
    defaultTo: "floz_us",
    defaultValue: 1,
    units: [
      lin("ml", "mL", 1),
      lin("l", "L", 1000),
      lin("tsp_us", "tsp", 4.92892159375),
      lin("tbsp_us", "tbsp", 14.78676478125),
      lin("floz_us", "fl oz", 29.5735295625),
      lin("cup_us", "cup", 236.5882365),
      lin("pint_us", "pt", 473.176473),
      lin("quart_us", "qt", 946.352946),
      lin("gallon_us", "gal", 3785.411784),
    ],
  },
  // base unit: meter per second
  speed: {
    id: "speed",
    defaultFrom: "kmh",
    defaultTo: "mph",
    defaultValue: 100,
    units: [
      lin("ms", "m/s", 1),
      lin("kmh", "km/h", 1000 / 3600),
      lin("mph", "mph", 1609.344 / 3600),
      lin("knot", "kn", 1852 / 3600),
      lin("fts", "ft/s", 0.3048),
    ],
  },
};

/** Convert a value from one unit to another within a category. */
export function convertUnit(category: UnitCategory, value: number, fromKey: string, toKey: string): number {
  const from = category.units.find((u) => u.key === fromKey);
  const to = category.units.find((u) => u.key === toKey);
  if (!from || !to) return NaN;
  // to base
  const base = from.toBase ? from.toBase(value) : value * (from.factor ?? 1);
  // from base
  return to.fromBase ? to.fromBase(base) : base / (to.factor ?? 1);
}

/** Round to a readable precision (more decimals for small magnitudes). */
export function roundReadable(n: number): number {
  if (!isFinite(n)) return n;
  const abs = Math.abs(n);
  const decimals = abs === 0 ? 0 : abs >= 100 ? 2 : abs >= 1 ? 3 : abs >= 0.001 ? 5 : 8;
  return Number(n.toFixed(decimals));
}
