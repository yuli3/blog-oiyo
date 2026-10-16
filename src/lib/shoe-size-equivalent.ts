/**
 * Shoe size equivalents and per-size page generation for /shoe-size-converter/[size].
 *
 * Grounded in the Brannock device formulas used by ShoeSizeConverter.tsx:
 * - Men's US = 3 * (foot length in inches) - 24
 * - Women's US = 3 * (foot length in inches) - 22.5
 * - UK = Men's US - 1
 * - EU = Foot length in cm * 1.5 (Paris points, 2/3 cm per point)
 * - Retail conversion: Women's = Men's + 2 (common retail charts)
 */

export const MEN_CONST = 24;
export const WOMEN_CONST = 22.5;
export const INCH_CM = 2.54;

export const lenFromMen = (s: number) => (s + MEN_CONST) / 3;
export const lenFromWomen = (s: number) => (s + WOMEN_CONST) / 3;
export const menFromLen = (inches: number) => inches * 3 - MEN_CONST;
export const womenFromLen = (inches: number) => inches * 3 - WOMEN_CONST;
export const ukFromMen = (s: number) => s - 1;
export const euFromLen = (inches: number) => inches * INCH_CM * 1.5;

export const half = (n: number) => Math.round(n * 2) / 2;
export const round1 = (n: number) => Math.round(n * 10) / 10;

export interface ShoeSizeEquivalent {
  inches: number;
  cm: number;
  mm: number;
  menUs: number;
  womenBrannock: number;
  womenRetail: number;
  uk: number;
  eu: number;
}

export function shoeSizeFromMm(mm: number): ShoeSizeEquivalent {
  const cm = mm / 10;
  const inches = cm / INCH_CM;
  const men = menFromLen(inches);
  return {
    inches: round1(inches),
    cm: round1(cm),
    mm,
    menUs: half(men),
    womenBrannock: half(womenFromLen(inches)),
    womenRetail: half(men + 2),
    uk: half(ukFromMen(men)),
    eu: half(euFromLen(inches)),
  };
}

export function shoeSizeFromMenUs(us: number): ShoeSizeEquivalent {
  const inches = lenFromMen(us);
  const cm = inches * INCH_CM;
  return {
    inches: round1(inches),
    cm: round1(cm),
    mm: Math.round(cm * 10),
    menUs: us,
    womenBrannock: half(womenFromLen(inches)),
    womenRetail: half(us + 2),
    uk: half(ukFromMen(us)),
    eu: half(euFromLen(inches)),
  };
}

export function shoeSizeFromWomenUs(us: number): ShoeSizeEquivalent {
  const inches = lenFromWomen(us);
  const cm = inches * INCH_CM;
  const men = menFromLen(inches);
  return {
    inches: round1(inches),
    cm: round1(cm),
    mm: Math.round(cm * 10),
    menUs: half(men),
    womenBrannock: us,
    womenRetail: half(men + 2),
    uk: half(ukFromMen(men)),
    eu: half(euFromLen(inches)),
  };
}

export interface ShoeSizePage {
  slug: string;
  locale: "ko" | "en";
  system: "mm" | "men-us" | "women-us";
  value: number;
  data: ShoeSizeEquivalent;
}

export function shoeSizePages(locale: "ko" | "en"): ShoeSizePage[] {
  const pages: ShoeSizePage[] = [];

  if (locale === "ko") {
    // 220mm to 300mm in 5mm steps (standard Korean shoe sizes)
    for (let mm = 220; mm <= 300; mm += 5) {
      pages.push({
        slug: `${mm}mm`,
        locale: "ko",
        system: "mm",
        value: mm,
        data: shoeSizeFromMm(mm),
      });
    }
    return pages;
  }

  // English: Men's US 6.0 to 13.0, Women's US 5.0 to 12.0
  for (let s = 6.0; s <= 13.0; s += 0.5) {
    const slugStr = s.toString().replace(".", "-");
    pages.push({
      slug: `men-us-${slugStr}`,
      locale: "en",
      system: "men-us",
      value: s,
      data: shoeSizeFromMenUs(s),
    });
  }

  for (let s = 5.0; s <= 12.0; s += 0.5) {
    const slugStr = s.toString().replace(".", "-");
    pages.push({
      slug: `women-us-${slugStr}`,
      locale: "en",
      system: "women-us",
      value: s,
      data: shoeSizeFromWomenUs(s),
    });
  }

  return pages;
}
