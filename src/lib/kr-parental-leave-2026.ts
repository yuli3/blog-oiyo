// Korean parental leave benefit (육아휴직 급여), for leave in 2026. Checked 2026-10-19:
// - 고용보험법 시행령 제95조: months 1–3 100% of 월 통상임금 capped at 250만, months 4–6 100%
//   capped at 200만, month 7 on 80% capped at 160만; floor 70만. The 25% 사후지급금 was abolished
//   from 2025, so the whole amount is paid monthly.
// - 제95조의3 ① (6+6 부모육아휴직제): when both parents take leave for the same child before it is
//   18 months old, months 1–6 are 100% with caps 250·250·300·350·400·450만 by month. The special
//   caps run only as far as the shorter of the two parents' leave (up to 6 months).
// - 제95조의3 ③ (한부모): months 1–3 capped at 300만, 4–6 at 200만, 7 on 80% capped at 160만.
// - 남녀고용평등법 제19조: 1 year per child, 1 year 6 months when each parent takes 3+ months,
//   for a single parent, or for a child with a severe disability.
// - 단기 육아휴직 (from 2026-08-20): 1 or 2 weeks once a year, paid at the same rate pro rata.

export const PARENTAL_AS_OF = "2026-10-19";

export const PARENTAL = {
  floor: 700_000,
  general: [2_500_000, 2_500_000, 2_500_000, 2_000_000, 2_000_000, 2_000_000],
  sixPlusSix: [2_500_000, 2_500_000, 3_000_000, 3_500_000, 4_000_000, 4_500_000],
  singleParent: [3_000_000, 3_000_000, 3_000_000, 2_000_000, 2_000_000, 2_000_000],
  laterRate: 0.8,
  laterCap: 1_600_000,
  maxMonths: 12,
  maxMonthsExtended: 18,
} as const;

export type ParentalMode = "general" | "sixPlusSix" | "singleParent";

export interface ParentalMonth {
  month: number;
  rate: number;
  cap: number;
  amount: number;
  special: boolean;
}

/**
 * Month-by-month benefit. `otherParentMonths` is only used for 6+6: the special caps apply to
 * months up to the shorter of the two parents' leave, capped at 6.
 */
export function parentalLeaveBenefit(monthlyWage: number, months: number, mode: ParentalMode, otherParentMonths = 0) {
  const n = Math.max(0, Math.min(PARENTAL.maxMonthsExtended, Math.floor(months)));
  const specialUntil = mode === "sixPlusSix" ? Math.min(6, n, Math.max(0, Math.floor(otherParentMonths))) : 0;
  const rows: ParentalMonth[] = [];
  for (let m = 1; m <= n; m++) {
    let rate: number;
    let cap: number;
    let special = false;
    if (m <= 6) {
      rate = 1;
      if (m <= specialUntil) {
        cap = PARENTAL.sixPlusSix[m - 1];
        special = true;
      } else {
        cap = mode === "singleParent" ? PARENTAL.singleParent[m - 1] : PARENTAL.general[m - 1];
        special = mode === "singleParent";
      }
    } else {
      rate = PARENTAL.laterRate;
      cap = PARENTAL.laterCap;
    }
    const amount = Math.max(PARENTAL.floor, Math.min(cap, Math.floor(monthlyWage * rate)));
    rows.push({ month: m, rate, cap, amount, special });
  }
  const total = rows.reduce((s, r) => s + r.amount, 0);
  return { rows, total, specialUntil };
}

/** 단기 육아휴직: the month's benefit prorated over a 30-day month for 7 or 14 days. */
export function shortLeaveBenefit(monthlyAmount: number, days: 7 | 14): number {
  return Math.floor((monthlyAmount * days) / 30);
}
