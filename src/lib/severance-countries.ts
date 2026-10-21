// Statutory severance for the non-Korean pages of the severance calculator. Each locale page uses
// its own country's law (세운 2026-10-19). Checked 2026-10-19:
// - Japan: there is no statutory 退職金; it exists only when 就業規則 or a 退職金規程 says so.
//   The law does require 解雇予告手当 (労基法 第20条: 30 days of 平均賃金, less one day per day of
//   notice given; 平均賃金 = last 3 months' wages ÷ calendar days, 第12条). The calculator also
//   shows how a company 退職金 is taxed: 退職所得控除 40万/year up to 20 years (min 80万), 70万/year
//   after; 退職所得 = (退職金 − 控除) × 1/2, except 短期退職手当 (勤続5年以下) where the part above
//   300万 is not halved (所得税法 第30条). Rates: 所得税 bracket × 1.021 (復興特別所得税) + 住民税 10%.
// - China 劳动合同法 第47条: 经济补偿 = one month's wage per full year; 6 months or more counts as a
//   year, under 6 months as half a month. When the monthly wage exceeds 3× the local average
//   monthly wage, the wage is capped at 3× and the years at 12. 第87条: unlawful dismissal pays 2×.
//   第40条: without 30 days' notice, one extra month (代通知金).
// - France Code du travail L1234-9, R1234-2: indemnité légale after 8 months' uninterrupted
//   service; 1/4 month per year up to 10 years, 1/3 per year beyond, incomplete years pro rata.
// - Spain Estatuto de los Trabajadores art. 53.1.b, 56.1 and 49.1.c: despido objetivo 20 días/año
//   (max 12 mensualidades), despido improcedente 33 días/año (max 24), end of a temporary contract
//   12 días/año. Salario diario = salario bruto anual ÷ 365, periods under a year prorated by month.

export type SeveranceCountry = "jp" | "cn" | "fr" | "es";

export const SEVERANCE_AS_OF = "2026-10-19";

// ── Japan ────────────────────────────────────────────────────────────────

/** 解雇予告手当: 30 days of average wage, less the days of notice actually given. */
export function japanNoticePay(wages3Months: number, calendarDays3Months: number, noticeDays: number): number {
  const daily = calendarDays3Months > 0 ? wages3Months / calendarDays3Months : 0;
  return Math.floor(daily * Math.max(0, 30 - noticeDays));
}

/** 勤続年数 rounds a partial year up. */
export function japanRetirementDeduction(years: number): number {
  const y = Math.max(1, Math.ceil(years));
  return y <= 20 ? Math.max(800_000, 400_000 * y) : 8_000_000 + 700_000 * (y - 20);
}

const JP_BRACKETS: [number, number, number][] = [
  [1_950_000, 0.05, 0],
  [3_300_000, 0.1, 97_500],
  [6_950_000, 0.2, 427_500],
  [9_000_000, 0.23, 636_000],
  [18_000_000, 0.33, 1_536_000],
  [40_000_000, 0.4, 2_796_000],
  [Infinity, 0.45, 4_796_000],
];

export function japanRetirementTax(payment: number, years: number) {
  const deduction = japanRetirementDeduction(years);
  const over = Math.max(0, payment - deduction);
  const shortTerm = Math.ceil(years) <= 5;
  const taxableRaw = shortTerm && over > 3_000_000 ? 1_500_000 + (over - 3_000_000) : over / 2;
  const taxable = Math.floor(taxableRaw / 1000) * 1000;
  const [, rate, minus] = JP_BRACKETS.find(([top]) => taxable <= top)!;
  const incomeTax = Math.floor(Math.max(0, taxable * rate - minus) * 1.021);
  const residentTax = Math.floor(taxable * 0.1);
  return { deduction, taxable, incomeTax, residentTax, net: payment - incomeTax - residentTax, shortTerm };
}

// ── China ────────────────────────────────────────────────────────────────

export type ChinaCase = "normal" | "noNotice" | "unlawful";

/** Years counted for 经济补偿: full years, plus 1 for 6+ leftover months or 0.5 for fewer. */
export function chinaCompYears(monthsOfService: number): number {
  const full = Math.floor(monthsOfService / 12);
  const rest = monthsOfService - full * 12;
  return full + (rest >= 6 ? 1 : rest > 0 ? 0.5 : 0);
}

export function chinaCompensation(monthsOfService: number, monthlyWage: number, localAvgMonthly: number, kind: ChinaCase) {
  const capped = localAvgMonthly > 0 && monthlyWage > localAvgMonthly * 3;
  const wage = capped ? localAvgMonthly * 3 : monthlyWage;
  const years = capped ? Math.min(12, chinaCompYears(monthsOfService)) : chinaCompYears(monthsOfService);
  const base = wage * years;
  const total = kind === "unlawful" ? base * 2 : kind === "noNotice" ? base + monthlyWage : base;
  return { years, wage, capped, base, total: Math.round(total) };
}

// ── France ───────────────────────────────────────────────────────────────

export function franceIndemnity(monthsOfService: number, referenceMonthly: number) {
  const eligible = monthsOfService >= 8;
  const years = monthsOfService / 12;
  const amount = eligible
    ? referenceMonthly * (Math.min(years, 10) / 4 + Math.max(0, years - 10) / 3)
    : 0;
  return { eligible, years, amount: Math.round(amount * 100) / 100 };
}

// ── Spain ────────────────────────────────────────────────────────────────

export type SpainCase = "objetivo" | "improcedente" | "temporal";

export const ES_RULES: Record<SpainCase, { daysPerYear: number; capMonths: number | null }> = {
  objetivo: { daysPerYear: 20, capMonths: 12 },
  improcedente: { daysPerYear: 33, capMonths: 24 },
  temporal: { daysPerYear: 12, capMonths: null },
};

export function spainIndemnity(monthsOfService: number, annualGross: number, kind: SpainCase) {
  const { daysPerYear, capMonths } = ES_RULES[kind];
  const daily = annualGross / 365;
  const days = (daysPerYear * monthsOfService) / 12;
  const raw = daily * days;
  const cap = capMonths === null ? Infinity : (annualGross / 12) * capMonths;
  const amount = Math.min(raw, cap);
  return { daily: Math.round(daily * 100) / 100, days: Math.round(days * 100) / 100, capped: raw > cap, amount: Math.round(amount * 100) / 100 };
}
