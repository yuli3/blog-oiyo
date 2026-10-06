/**
 * The numbers behind the per-height pages under /height-converter/.
 *
 * They are the same constants the converter itself uses (components/tools/
 * HeightConverter.tsx), copied here so a static page can compute at build time
 * without loading the React tool. Keep the two in step: a per-height page that
 * disagrees with the tool it links to is worse than no page. 2026-10-06
 */
export const HEIGHT_MALE_MEAN = 173.5;
export const HEIGHT_MALE_SD = 5.7;
export const HEIGHT_FEMALE_MEAN = 160.9;
export const HEIGHT_FEMALE_SD = 5.2;
export const HEIGHT_GAP = Math.round((HEIGHT_MALE_MEAN - HEIGHT_FEMALE_MEAN) * 10) / 10; // 12.6

export type HeightGender = "female" | "male";

function normalCDF(z: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

const stats = (gender: HeightGender) =>
  gender === "male" ? { mean: HEIGHT_MALE_MEAN, sd: HEIGHT_MALE_SD } : { mean: HEIGHT_FEMALE_MEAN, sd: HEIGHT_FEMALE_SD };
const other = (gender: HeightGender): HeightGender => (gender === "male" ? "female" : "male");
const round1 = (value: number) => Math.round(value * 10) / 10;

export interface HeightEquivalent {
  gender: HeightGender;
  cm: number;
  /** The converter's method: add or subtract the gap between the two averages. */
  byGap: number;
  /** Same place in the distribution: the height at the same z-score for the other gender. */
  byRank: number;
  /** Share of the same gender that is shorter, in percent. */
  percentile: number;
}

export function heightEquivalent(gender: HeightGender, cm: number): HeightEquivalent {
  const mine = stats(gender);
  const theirs = stats(other(gender));
  const z = (cm - mine.mean) / mine.sd;
  return {
    gender,
    cm,
    byGap: round1(gender === "male" ? cm - HEIGHT_GAP : cm + HEIGHT_GAP),
    byRank: round1(theirs.mean + z * theirs.sd),
    percentile: round1(normalCDF(z) * 100),
  };
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const total = Math.round(cm / 2.54);
  return { feet: Math.floor(total / 12), inches: total % 12 };
}
export const feetInchesToCm = (feet: number, inches: number) => round1((feet * 12 + inches) * 2.54);
export const formatFeetInches = (cm: number) => { const v = cmToFeetInches(cm); return `${v.feet}'${v.inches}"`; };

/**
 * Which heights get a page. Korean searches name a height in cm ("여자 키 170 남자 키 환산"),
 * English ones in feet and inches ("5'7 female to male height"), so the two languages list
 * different heights and are not translations of each other.
 */
export interface HeightPage { slug: string; gender: HeightGender; cm: number; feet?: number; inches?: number }

export function heightPages(locale: "ko" | "en"): HeightPage[] {
  const pages: HeightPage[] = [];
  if (locale === "ko") {
    for (let cm = 148; cm <= 185; cm++) pages.push({ slug: `female-${cm}cm`, gender: "female", cm });
    for (let cm = 158; cm <= 195; cm++) pages.push({ slug: `male-${cm}cm`, gender: "male", cm });
    return pages;
  }
  const range = (gender: HeightGender, from: number, to: number) => {
    for (let total = from; total <= to; total++) {
      const feet = Math.floor(total / 12);
      const inches = total % 12;
      pages.push({ slug: `${gender}-${feet}-${inches}`, gender, cm: feetInchesToCm(feet, inches), feet, inches });
    }
  };
  range("female", 58, 75); // 4'10" to 6'3"
  range("male", 62, 80); // 5'2" to 6'8"
  return pages;
}
