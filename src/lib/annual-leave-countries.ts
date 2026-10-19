// Statutory annual leave for the non-Korean pages of the annual leave calculator.
// Each locale page uses its own country's law (세운 2026-10-19: law-dependent tools get one page
// per country, not translated Korean rules). Checked 2026-10-19:
// - Japan 労働基準法 第39条: 6 months of service with 80% attendance → 10 days, rising to 20 days
//   at 6.5 years. Cashing out unused days is not allowed in principle (on departure it is up to
//   the employer), so the calculator shows only the value of the days.
// - China 职工带薪年休假条例 第3条 + 企业职工带薪年休假实施办法 第10·11条: 5/10/15 days by cumulative
//   working years; unused days the employer did not let you take are paid at 300% of daily wage
//   (normal pay included, so 200% extra). Daily wage = monthly wage ÷ 21.75.
// - France Code du travail L3141-3, L3141-7, L3141-24: 2.5 jours ouvrables per month worked, max 30,
//   rounded up; the indemnity is the higher of 1/10 of reference-period pay and salary maintenance.
// - Spain Estatuto de los Trabajadores art. 38: at least 30 días naturales a year, prorated; paid
//   out only when the contract ends (finiquito).

export type LeaveCountry = "jp" | "cn" | "fr" | "es";

export const LEAVE_AS_OF = "2026-10-19";

/** Japan: [months of continuous service, days granted]. */
export const JP_GRANT_TABLE = [
  [6, 10],
  [18, 11],
  [30, 12],
  [42, 14],
  [54, 16],
  [66, 18],
  [78, 20],
] as const;

export function japanDays(monthsOfService: number): number {
  let days = 0;
  for (const [months, d] of JP_GRANT_TABLE) {
    if (monthsOfService >= months) days = d;
  }
  return days;
}

/** China: cumulative working years (all employers), not years at the current one. */
export function chinaDays(cumulativeYears: number): number {
  if (cumulativeYears < 1) return 0;
  if (cumulativeYears < 10) return 5;
  if (cumulativeYears < 20) return 10;
  return 15;
}

export const CN_MONTHLY_WORKDAYS = 21.75;

/** Extra pay owed for unused days on top of normal wages (200% of daily wage). */
export function chinaUnusedPay(monthlyWage: number, unusedDays: number): { daily: number; extra: number; total300: number } {
  const daily = Math.max(0, monthlyWage) / CN_MONTHLY_WORKDAYS;
  const days = Math.max(0, unusedDays);
  return { daily, extra: Math.round(daily * days * 2), total300: Math.round(daily * days * 3) };
}

/** France: jours ouvrables acquired, 2.5 per month worked, rounded up, max 30. */
export function franceDays(monthsWorked: number): number {
  const months = Math.min(12, Math.max(0, monthsWorked));
  return Math.min(30, Math.ceil(months * 2.5));
}

/** Jours ouvrables in a month for salary maintenance (Mon–Sat). */
export const FR_OUVRABLES_PER_MONTH = 26;

export function franceIndemnity(monthlyGross: number, monthsWorked: number, remainingDays: number) {
  const acquired = franceDays(monthsWorked);
  const remaining = Math.min(Math.max(0, remainingDays), acquired);
  const referencePay = Math.max(0, monthlyGross) * Math.min(12, Math.max(0, monthsWorked));
  const tenth = acquired > 0 ? (referencePay * 0.1 * remaining) / acquired : 0;
  const maintenance = (Math.max(0, monthlyGross) / FR_OUVRABLES_PER_MONTH) * remaining;
  return {
    acquired,
    remaining,
    tenth: Math.round(tenth * 100) / 100,
    maintenance: Math.round(maintenance * 100) / 100,
    due: Math.round(Math.max(tenth, maintenance) * 100) / 100,
    method: tenth >= maintenance ? ("tenth" as const) : ("maintenance" as const),
  };
}

/** Spain: días naturales accrued, 30 a year prorated by months worked. */
export function spainDays(monthsWorked: number): number {
  const months = Math.min(12, Math.max(0, monthsWorked));
  return Math.round(((30 * months) / 12) * 100) / 100;
}

export function spainPayout(annualGross: number, monthsWorked: number, daysTaken: number) {
  const accrued = spainDays(monthsWorked);
  const pending = Math.max(0, accrued - Math.max(0, daysTaken));
  const daily = Math.max(0, annualGross) / 365;
  return { accrued, pending, daily, payout: Math.round(daily * pending * 100) / 100 };
}
