// Korean payroll rules for 2026, shared by the weekly holiday pay calculator and the
// daily worker insurance checker. Values were checked on 2026-10-12; see
// company-brain projects/oiyo-ecosystem/tax-practice-toolkit-plan-2026-10-12.md for sources.
// When a year changes, update RATES and the tests, not the formulas.

import { AMOUNT, parseKrAmount } from "./kr-vat-2026.ts";

export const RATES_AS_OF = "2026-10-12";

export const RATES = {
  minimumWage: 10_320, // 2026 hourly minimum wage (2027: 10,700)
  pensionEmployee: 0.0475, // 국민연금 9.5% total
  healthEmployee: 0.03595, // 건강보험 7.19% total
  longTermCareOfHealth: 0.1314, // 장기요양 = 건강보험료 × 13.14%
  employmentEmployee: 0.009, // 고용보험 실업급여 근로자분
  pensionIncomeThreshold: 2_200_000, // 월 소득 220만 원 이상이면 일수와 관계없이 국민연금 가입
  dailyWageDeduction: 150_000, // 일용근로소득 1일 근로소득공제
  dailyWageTaxRate: 0.06,
  dailyWageTaxCredit: 0.55,
} as const;

/** Average weeks per month used for monthly conversion (365 ÷ 7 ÷ 12). */
export const WEEKS_PER_MONTH = 365 / 7 / 12;

export interface WeeklyInput {
  hourlyWage: number;
  daysPerWeek: number;
  hoursPerDay: number;
}

export interface WeeklyResult {
  weeklyHours: number;
  eligible: boolean;
  holidayHours: number;
  holidayPay: number;
  weeklyPay: number;
  monthlyPay: number;
  belowMinimumWage: boolean;
}

/** 주휴수당: 주 소정근로 15시간 이상이면 (주 소정시간 ÷ 40) × 8시간분, 40시간을 넘으면 8시간분. */
export function weeklyHolidayPay({ hourlyWage, daysPerWeek, hoursPerDay }: WeeklyInput): WeeklyResult {
  const weeklyHours = daysPerWeek * hoursPerDay;
  const eligible = weeklyHours >= 15;
  const holidayHours = eligible ? (Math.min(weeklyHours, 40) / 40) * 8 : 0;
  const holidayPay = Math.round(holidayHours * hourlyWage);
  const weeklyPay = Math.round(weeklyHours * hourlyWage) + holidayPay;
  return {
    weeklyHours,
    eligible,
    holidayHours,
    holidayPay,
    weeklyPay,
    monthlyPay: Math.round(weeklyPay * WEEKS_PER_MONTH),
    belowMinimumWage: hourlyWage < RATES.minimumWage,
  };
}

export type InsuranceId = "pension" | "health" | "employment" | "accident";

export interface MonthInput {
  daysWorked: number;
  hoursWorked: number;
  monthlyPay: number;
  /** 같은 사업장에서 1개월 이상 계속 근로했거나 그럴 예정인가 */
  overOneMonth: boolean;
}

export interface InsuranceVerdict {
  id: InsuranceId;
  applies: boolean;
  reason: string;
  employeeDeduction: number;
}

// Round to 1e-6 first: 700,000 × 0.009 is 6,299.999… in floating point and must stay 6,300.
const floor10 = (won: number) => Math.floor(Math.round(won * 1e6) / 1e7) * 10;

/**
 * 일용·단시간 근로자의 4대보험 가입 여부 참고 판정.
 * 국민연금: 1개월 이상 + (월 8일 이상 또는 월 60시간 이상), 또는 월 소득 220만 원 이상.
 * 건강보험: 1개월 이상 + (월 8일 이상 또는 월 60시간 이상).
 * 고용·산재: 일용근로자는 하루만 일해도 적용(고용보험 65세 이후 신규 등 예외는 다루지 않음).
 * 보험료는 지급액 × 근로자 요율의 단순 추정이며 기준소득월액 상·하한은 반영하지 않는다.
 */
export function dailyWorkerInsurance({ daysWorked, hoursWorked, monthlyPay, overOneMonth }: MonthInput): InsuranceVerdict[] {
  const meetsDaysOrHours = daysWorked >= 8 || hoursWorked >= 60;
  const pensionApplies = (overOneMonth && meetsDaysOrHours) || monthlyPay >= RATES.pensionIncomeThreshold;
  const healthApplies = overOneMonth && meetsDaysOrHours;
  const why = overOneMonth
    ? meetsDaysOrHours
      ? `1개월 이상 근로하고 월 ${daysWorked}일·${hoursWorked}시간으로 8일 또는 60시간 기준을 넘습니다.`
      : `월 ${daysWorked}일·${hoursWorked}시간으로 8일·60시간 기준에 모두 못 미칩니다.`
    : "근로 기간이 1개월 미만이라 일수·시간 기준이 적용되지 않습니다.";
  const health = healthApplies ? floor10(monthlyPay * RATES.healthEmployee) : 0;
  return [
    {
      id: "pension",
      applies: pensionApplies,
      reason: pensionApplies && !(overOneMonth && meetsDaysOrHours) ? "월 소득이 220만 원 이상이라 일수와 관계없이 가입 대상입니다." : why,
      employeeDeduction: pensionApplies ? floor10(monthlyPay * RATES.pensionEmployee) : 0,
    },
    {
      id: "health",
      applies: healthApplies,
      reason: why,
      employeeDeduction: health + (healthApplies ? floor10(health * RATES.longTermCareOfHealth) : 0),
    },
    {
      id: "employment",
      applies: true,
      reason: "일용근로자는 하루만 일해도 고용보험이 적용됩니다.",
      employeeDeduction: floor10(monthlyPay * RATES.employmentEmployee),
    },
    {
      id: "accident",
      applies: true,
      reason: "산재보험은 모든 근로자에게 적용되고 보험료는 사업주가 냅니다.",
      employeeDeduction: 0,
    },
  ];
}

/** 일용근로소득 원천징수(1일분): (일당 − 15만 원) × 6% × (1 − 55%), 1천 원 미만은 소액부징수. 지방소득세는 10%. */
export function dailyWageTax(dailyWage: number): { incomeTax: number; localTax: number } {
  const raw = Math.max(0, dailyWage - RATES.dailyWageDeduction) * RATES.dailyWageTaxRate * (1 - RATES.dailyWageTaxCredit);
  const incomeTax = floor10(raw);
  if (incomeTax < 1_000) return { incomeTax: 0, localTax: 0 };
  return { incomeTax, localTax: Math.floor(incomeTax / 100) * 10 };
}

export interface LeaverInput {
  /** 정산 연도에 받은 보수 총액(비과세 제외) */
  totalPay: number;
  /** 보수를 받은 달 수 (보수월액 = 총액 ÷ 이 값) */
  monthsWorked: number;
  /** 보험료가 부과된 달 수 (월 중 입사면 다음 달부터) */
  monthsCharged: number;
  /** 매달 고지된 보험료의 기준 보수월액 */
  noticeMonthly: number;
  /** 그해 요율. 기본은 2026년 */
  rates?: { health: number; longTermCareOfHealth: number };
}

export interface LeaverResult {
  actualMonthly: number;
  owedHealth: number;
  owedCare: number;
  paidHealth: number;
  paidCare: number;
  health: number;
  care: number;
  total: number;
}

/**
 * 퇴사월 건강보험 정산(근로자 부담분). 보수월액 = 보수총액 ÷ 근무 월수,
 * 월 보험료는 10원 미만 버림, 장기요양은 건강보험료 × 비율. 정산액 = (낼 보험료 − 낸 보험료) × 부과 월수.
 * 양수면 마지막 급여에서 더 떼고, 음수면 돌려준다. 사업주도 같은 금액을 정산한다.
 */
export function leaverHealthSettlement({ totalPay, monthsWorked, monthsCharged, noticeMonthly, rates }: LeaverInput): LeaverResult {
  const health = rates?.health ?? RATES.healthEmployee;
  const careRatio = rates?.longTermCareOfHealth ?? RATES.longTermCareOfHealth;
  const actualMonthly = Math.floor(totalPay / monthsWorked);
  const perMonth = (monthly: number) => {
    const h = floor10(monthly * health);
    return { h, c: floor10(h * careRatio) };
  };
  const owed = perMonth(actualMonthly);
  const paid = perMonth(noticeMonthly);
  const result = {
    actualMonthly,
    owedHealth: owed.h * monthsCharged,
    owedCare: owed.c * monthsCharged,
    paidHealth: paid.h * monthsCharged,
    paidCare: paid.c * monthsCharged,
  };
  const h = result.owedHealth - result.paidHealth;
  const c = result.owedCare - result.paidCare;
  return { ...result, health: h, care: c, total: h + c };
}

export interface ParsedLeaver {
  totalPay?: number;
  monthsWorked?: number;
  monthsCharged?: number;
  noticeMonthly?: number;
}

/** "올해 총급여 3000만원 6개월 근무 기준 보수월액 450만원 부과 5개월" */
export function parseLeaverText(text: string): ParsedLeaver {
  const t = text.replace(/\s+/g, " ");
  const out: ParsedLeaver = {};
  const amount = (re: RegExp) => {
    const raw = t.match(re)?.[1];
    const value = raw === undefined ? null : parseKrAmount(raw);
    return value === null ? undefined : value;
  };
  out.totalPay = amount(new RegExp(`(?:총\\s*급여|총\\s*보수|보수\\s*총액|받은\\s*급여|급여\\s*총액)\\s*${AMOUNT}`));
  out.noticeMonthly = amount(new RegExp(`(?:기준\\s*(?:보수월액|보수|금액|액)?|고지\\s*(?:기준)?\\s*(?:보수월액)?)\\s*${AMOUNT}`));
  const worked = t.match(/(\d+)\s*(?:개월|달)\s*(?:근무|일함|일했)/)?.[1] ?? t.match(/근무\s*(\d+)\s*(?:개월|달)/)?.[1];
  if (worked) out.monthsWorked = Number(worked);
  const charged = t.match(/(?:부과|산정|고지)\s*(\d+)\s*(?:개월|달)/)?.[1] ?? t.match(/(\d+)\s*(?:개월|달)\s*(?:부과|고지)/)?.[1];
  if (charged) out.monthsCharged = Number(charged);
  for (const key of Object.keys(out) as (keyof ParsedLeaver)[]) if (out[key] === undefined) delete out[key];
  return out;
}

export interface ParsedWork {
  hourlyWage?: number;
  daysPerWeek?: number;
  hoursPerDay?: number;
  daysPerMonth?: number;
  hoursPerMonth?: number;
  monthlyPay?: number;
  dailyWage?: number;
}

/** "1만 320", "10,320", "220만" 같은 금액을 원 단위 숫자로 읽는다. */
export function parseWon(text: string): number | null {
  const s = text.replace(/[,\s원]/g, "");
  const m = s.match(/^(?:(\d+(?:\.\d+)?)만)?(\d+)?$/);
  if (!m || (!m[1] && !m[2])) return null;
  return Math.round((m[1] ? Number(m[1]) * 10_000 : 0) + (m[2] ? Number(m[2]) : 0));
}

const NUM = String.raw`(\d+(?:\.\d+)?)`;
const WON = String.raw`(\d[\d,]*(?:\.\d+)?\s*만?\s*[\d,]*)\s*원?`;

/**
 * 한 줄 설명("주 5일 하루 4시간 시급 10320원", "이번 달 7일 56시간 일당 12만원")에서 값을 뽑는다.
 * 브라우저 안 규칙 파서이며, 못 읽은 값은 비워 두고 폼에서 채우게 한다.
 */
export function parseWorkText(text: string): ParsedWork {
  const t = text.replace(/\s+/g, " ");
  const out: ParsedWork = {};
  const pick = (re: RegExp) => t.match(re)?.[1];
  const won = (re: RegExp) => {
    const raw = pick(re);
    const value = raw === undefined ? null : parseWon(raw);
    return value === null ? undefined : value;
  };
  out.hourlyWage = won(new RegExp(`시급\\s*${WON}`));
  out.dailyWage = won(new RegExp(`일당\\s*${WON}`));
  out.monthlyPay = won(new RegExp(`(?:월급|월\\s*지급액|월\\s*급여|한\\s*달\\s*급여)\\s*${WON}`));
  const dpw = pick(new RegExp(`주\\s*${NUM}\\s*일`));
  if (dpw) out.daysPerWeek = Number(dpw);
  const hpd = pick(new RegExp(`(?:하루에?|1일)\\s*${NUM}\\s*시간`));
  if (hpd) out.hoursPerDay = Number(hpd);
  const dpm = pick(new RegExp(`(?:월|한\\s*달|이번\\s*달)\\s*${NUM}\\s*일`));
  if (dpm) out.daysPerMonth = Number(dpm);
  const hpm = pick(new RegExp(`(?:월|한\\s*달|이번\\s*달)\\s*(?:\\d+\\s*일\\s*)?${NUM}\\s*시간`));
  if (hpm) out.hoursPerMonth = Number(hpm);
  for (const key of Object.keys(out) as (keyof ParsedWork)[]) if (out[key] === undefined) delete out[key];
  return out;
}
