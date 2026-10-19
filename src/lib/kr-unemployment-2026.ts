// 구직급여(실업급여) for the unemployment benefit calculator.
// Checked 2026-10-19: for people who left a job on or after 2026-01-01 the daily cap is 68,100원
// (기초일액 상한 113,500원 × 60%), and the floor is 80% of the minimum wage for the contracted
// daily hours (10,320원 × 8시간 × 80% = 66,048원). 소정급여일수 follows 고용보험법 별표 1.
// The proposed cut for repeat claimants (5년 3회 이상) was still a bill, so it is not applied.
// Sources were secondary summaries (시프티, 고용24 안내 인용); work24.go.kr could not be fetched
// from the build container. When the cap or the minimum wage changes, update UNEMPLOYMENT and the
// tests, not the formulas.

import { RATES } from "./kr-payroll-2026.ts";

export const UNEMPLOYMENT_AS_OF = "2026-10-19";

export const UNEMPLOYMENT = {
  /** 구직급여일액 상한 (2026-01-01 이후 이직자) */
  dailyCap: 68_100,
  /** 기초일액 상한 */
  baseDailyCap: 113_500,
  /** 기초일액 대비 지급률 */
  rate: 0.6,
  /** 하한 = 최저임금 × 1일 소정근로시간 × 80% */
  floorRate: 0.8,
  minimumWage: RATES.minimumWage,
  /** 1일 소정근로시간 상한 (하한 계산용) */
  maxDailyHours: 8,
  /** 피보험기간 구간 경계(년): 1년 미만, 1~3, 3~5, 5~10, 10년 이상 */
  insuredYearBreaks: [1, 3, 5, 10],
  /** 이직일 현재 50세 미만 */
  daysUnder50: [120, 150, 180, 210, 240],
  /** 이직일 현재 50세 이상 또는 장애인 */
  daysOver50: [120, 180, 210, 240, 270],
  /** 수급 자격: 이직 전 18개월 동안 피보험 단위기간 */
  minInsuredDays: 180,
} as const;

/** 실업인정 1회차 단위(일). 4주마다 실업을 인정받고 그 기간분을 받는다. */
export const RECOGNITION_PERIOD_DAYS = 28;

export interface UnemploymentInput {
  /** 이직 전 3개월 동안 받은 세전 임금 합계 (상여·연차수당 포함) */
  threeMonthWages: number;
  /** 그 3개월의 달력상 일수 (보통 89~92일) */
  threeMonthDays: number;
  /** 고용보험 가입 기간(년). 여러 직장을 합산한 피보험기간 */
  insuredYears: number;
  /** 이직일 현재 만 50세 이상이거나 장애인 */
  over50OrDisabled: boolean;
  /** 1일 소정근로시간 (하한 계산에 쓰며 8시간을 넘으면 8시간) */
  dailyHours: number;
}

export interface UnemploymentResult {
  baseDaily: number;
  rawDaily: number;
  floor: number;
  daily: number;
  limitedBy: "cap" | "floor" | null;
  days: number;
  total: number;
  per28Days: number;
  bracketIndex: number;
}

/** 소정급여일수 표에서 피보험기간 구간 번호(0~4). */
export function insuredBracket(insuredYears: number): number {
  const y = Math.max(0, insuredYears);
  const i = UNEMPLOYMENT.insuredYearBreaks.findIndex((limit) => y < limit);
  return i === -1 ? UNEMPLOYMENT.insuredYearBreaks.length : i;
}

export function benefitDays(insuredYears: number, over50OrDisabled: boolean): number {
  const table = over50OrDisabled ? UNEMPLOYMENT.daysOver50 : UNEMPLOYMENT.daysUnder50;
  return table[insuredBracket(insuredYears)];
}

/** 하한액: 최저임금 × 소정근로시간(최대 8) × 80%, 원 미만 버림. */
export function dailyFloor(dailyHours: number): number {
  const hours = Math.min(UNEMPLOYMENT.maxDailyHours, Math.max(1, dailyHours));
  return Math.floor(UNEMPLOYMENT.minimumWage * hours * UNEMPLOYMENT.floorRate);
}

export function unemploymentBenefit(input: UnemploymentInput): UnemploymentResult {
  const days3 = Math.max(1, Math.round(input.threeMonthDays));
  const baseDaily = Math.min(UNEMPLOYMENT.baseDailyCap, Math.floor(Math.max(0, input.threeMonthWages) / days3));
  const rawDaily = Math.floor(baseDaily * UNEMPLOYMENT.rate);
  const floor = dailyFloor(input.dailyHours);
  let daily = Math.min(UNEMPLOYMENT.dailyCap, rawDaily);
  let limitedBy: UnemploymentResult["limitedBy"] = rawDaily > UNEMPLOYMENT.dailyCap ? "cap" : null;
  if (daily < floor) {
    daily = floor;
    limitedBy = "floor";
  }
  const days = benefitDays(input.insuredYears, input.over50OrDisabled);
  return {
    baseDaily,
    rawDaily,
    floor,
    daily,
    limitedBy,
    days,
    total: daily * days,
    per28Days: daily * RECOGNITION_PERIOD_DAYS,
    bracketIndex: insuredBracket(input.insuredYears),
  };
}

/** 월급(세전)만 아는 사람을 위해 3개월 합계로 바꾼다. */
export function threeMonthsFromMonthly(monthlyWage: number): number {
  return Math.max(0, monthlyWage) * 3;
}
