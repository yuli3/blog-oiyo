// Money planner and minimum wage / minimum living cost data for the five countries the blog's
// locales cover (ko/en → kr, ja → jp, zh → cn, fr → fr, es → es; the page lets any locale pick any
// country). Figures checked 2026-10-23 against the sources below; the official sites of 法令/劳动局/
// Légifrance/BOE could not be fetched from the build container, so re-check them before editing:
// - KR 최저임금 2026 10,320원, 2027 10,700원(고용노동부 고시 2026-08-05 보도). 기준중위소득 2026
//   1인 2,564,238 · 2인 4,193,352 · 3인 5,364,719 · 4인 6,494,738원(복지로), 생계급여 선정 32%.
// - JP 令和8年度 地域別最低賃金 全国加重平均 1,177円・東京 1,280円(2026-09-03 厚労省答申結果、
//   10/1〜12/2 順次発効)。生活保護基準は地域・年齢で決まるため単一の数字を置かない。
// - CN 上海 月最低工资 2,740元、小时 25元(2025-07-01 起, 人社部 2026-10-01 全国表で首位のまま)。
//   上海 低保 1,690元/人/月(2026-07-01 起)。
// - FR SMIC 12,31 €/h au 1er juin 2026 (revalorisation automatique L3231-5, 151,67 h = 1 867,02 €).
//   RSA personne seule 651,69 € (décret 2026-220, 1er avril 2026).
// - ES SMI 2026 1.221 €/mes en 14 pagas = 17.094 €/año (Real Decreto 126/2026). IMV adulto solo
//   ≈ 733,60 €/mes (fuentes discrepan en céntimos).
// When a year changes, update the tables and the tests, not the formulas.

import { WEEKS_PER_MONTH } from "./kr-payroll-2026.ts";

export const MONEY_PLAN_AS_OF = "2026-10-23";

export type PlanCountry = "kr" | "jp" | "cn" | "fr" | "es";
export const PLAN_COUNTRIES: PlanCountry[] = ["kr", "jp", "cn", "fr", "es"];
export type Currency = "KRW" | "JPY" | "CNY" | "EUR";

export interface MinimumWageRule {
  /** 시간급(ES·CN은 표시용 환산값) */
  hourly: number;
  /** 법정 전일제 주 소정근로시간 */
  fullTimeWeeklyHours: number;
  /** 전일제 월급이 법으로 따로 정해진 나라(CN 월 최저임금, ES 14개월 기준 월액) */
  fullTimeMonthly?: number;
  /** 연간 지급 횟수(ES 14 pagas) */
  paymentsPerYear: number;
  /** KR: 주 15시간 이상이면 주휴수당 */
  weeklyHoliday: boolean;
  region?: string;
  effective: string;
  next?: { hourly: number; effective: string };
}

export interface CountryMoney {
  currency: Currency;
  minimumWage: MinimumWageRule;
  /** 공적 최저생활 기준(가구원 1~4명). null이면 단일 기준이 없다. */
  minimumIncome: { perHousehold: number[]; basis: "kr-livelihood" | "cn-dibao" | "fr-rsa" | "es-imv" } | null;
  /** 시드머니 목표 3단계(현지 통화) */
  seedTargets: [number, number, number];
  emergencyMonths: number;
  /** 저축 우선순위(비상금을 채운 뒤). monthlyCap이 없으면 남은 돈 전부. */
  accounts: SavingsAccount[];
}

export interface SavingsAccount {
  id: string;
  /** 현지 상품명(고유명사라 번역하지 않는다) */
  name: string;
  monthlyCap?: number;
  /** 월 실수령액 대비 상한(FR PER 공제 한도 근사) */
  capShareOfIncome?: number;
  minAge?: number;
  maxAge?: number;
}

export const COUNTRY_MONEY: Record<PlanCountry, CountryMoney> = {
  kr: {
    currency: "KRW",
    minimumWage: { hourly: 10_320, fullTimeWeeklyHours: 40, paymentsPerYear: 12, weeklyHoliday: true, effective: "2026-01-01", next: { hourly: 10_700, effective: "2027-01-01" } },
    minimumIncome: { perHousehold: [2_564_238, 4_193_352, 5_364_719, 6_494_738].map((m) => Math.floor(m * 0.32)), basis: "kr-livelihood" },
    seedTargets: [1_000_000, 10_000_000, 50_000_000],
    emergencyMonths: 6,
    accounts: [
      { id: "kr-youth", name: "청년미래적금", monthlyCap: 500_000, minAge: 19, maxAge: 34 },
      { id: "kr-pension", name: "연금저축", monthlyCap: 500_000 },
      { id: "kr-irp", name: "IRP", monthlyCap: 250_000 },
      { id: "kr-isa", name: "ISA", monthlyCap: Math.floor(20_000_000 / 12) },
      { id: "kr-taxable", name: "일반 계좌" },
    ],
  },
  jp: {
    currency: "JPY",
    minimumWage: { hourly: 1_177, fullTimeWeeklyHours: 40, paymentsPerYear: 12, weeklyHoliday: false, region: "全国加重平均", effective: "2026-10-01" },
    minimumIncome: null,
    seedTargets: [100_000, 1_000_000, 5_000_000],
    emergencyMonths: 6,
    accounts: [
      { id: "jp-ideco", name: "iDeCo", monthlyCap: 23_000 },
      { id: "jp-nisa-tsumitate", name: "NISA つみたて投資枠", monthlyCap: 100_000, minAge: 18 },
      { id: "jp-nisa-growth", name: "NISA 成長投資枠", monthlyCap: 200_000, minAge: 18 },
      { id: "jp-taxable", name: "特定口座" },
    ],
  },
  cn: {
    currency: "CNY",
    minimumWage: { hourly: 25, fullTimeWeeklyHours: 40, fullTimeMonthly: 2_740, paymentsPerYear: 12, weeklyHoliday: false, region: "上海", effective: "2025-07-01" },
    minimumIncome: { perHousehold: [1_690, 3_380, 5_070, 6_760], basis: "cn-dibao" },
    seedTargets: [10_000, 100_000, 500_000],
    emergencyMonths: 6,
    accounts: [
      { id: "cn-pension", name: "个人养老金", monthlyCap: 1_000 },
      { id: "cn-fund", name: "基金定投 / 存款" },
    ],
  },
  fr: {
    currency: "EUR",
    minimumWage: { hourly: 12.31, fullTimeWeeklyHours: 35, paymentsPerYear: 12, weeklyHoliday: false, effective: "2026-06-01" },
    // RSA forfaitaire : +50 % pour la 2e personne, +30 % pour chacune des suivantes
    minimumIncome: { perHousehold: [651.69, 977.54, 1_173.04, 1_368.55], basis: "fr-rsa" },
    seedTargets: [1_000, 10_000, 50_000],
    emergencyMonths: 3,
    accounts: [
      { id: "fr-per", name: "PER", capShareOfIncome: 0.1 },
      { id: "fr-pea", name: "PEA" },
    ],
  },
  es: {
    currency: "EUR",
    minimumWage: { hourly: Math.round((17_094 / (40 * 52)) * 100) / 100, fullTimeWeeklyHours: 40, fullTimeMonthly: 1_221, paymentsPerYear: 14, weeklyHoliday: false, effective: "2026-01-01" },
    // IMV: +30 % por cada miembro adicional sobre la cuantía de un adulto
    minimumIncome: { perHousehold: [733.6, 953.68, 1_173.76, 1_393.84], basis: "es-imv" },
    seedTargets: [1_000, 10_000, 50_000],
    emergencyMonths: 3,
    accounts: [
      { id: "es-pension", name: "Plan de pensiones", monthlyCap: 125 },
      { id: "es-index", name: "Fondo indexado" },
    ],
  },
};

export interface MinimumPay {
  hourly: number;
  /** 주휴 포함 월 유급시간(KR) 또는 월 근로시간 */
  monthlyHours: number;
  /** 매달 받는 금액(ES는 14회 중 1회분) */
  monthly: number;
  annual: number;
  /** 연간 ÷ 12. 14회 지급(ES)도 다른 나라·내 월급과 같은 기준으로 비교할 때 쓴다. */
  monthlyAvg: number;
}

/** 주 weeklyHours 일할 때의 법정 최저 보수 */
export function minimumPay(country: PlanCountry, weeklyHours: number): MinimumPay {
  const rule = COUNTRY_MONEY[country].minimumWage;
  const h = Math.max(0, weeklyHours);
  const share = h / rule.fullTimeWeeklyHours;
  if (rule.fullTimeMonthly !== undefined && h >= rule.fullTimeWeeklyHours) {
    // 전일제 월 최저임금이 따로 있는 나라: 전일제는 그 금액, 단시간은 시간급으로 계산(CN) 또는 비례(ES)
    const monthly = rule.fullTimeMonthly;
    return withAvg({ hourly: rule.hourly, monthlyHours: rule.fullTimeWeeklyHours * (52 / 12), monthly, annual: monthly * rule.paymentsPerYear });
  }
  if (country === "es") {
    const monthly = round2(rule.fullTimeMonthly! * share);
    return withAvg({ hourly: rule.hourly, monthlyHours: h * (52 / 12), monthly, annual: round2(monthly * rule.paymentsPerYear) });
  }
  // KR: 주 15시간 이상이면 1주 소정근로의 1/5(최대 8시간)을 주휴로 더 받는다(근로기준법 제55조).
  const holiday = rule.weeklyHoliday && h >= 15 ? (Math.min(h, 40) / 40) * 8 : 0;
  const weeksPerMonth = rule.weeklyHoliday ? WEEKS_PER_MONTH : 52 / 12;
  const monthlyHours = (h + holiday) * weeksPerMonth;
  const monthly = country === "kr" ? Math.round(rule.hourly * Math.round(monthlyHours)) : round2(rule.hourly * monthlyHours);
  return withAvg({ hourly: rule.hourly, monthlyHours, monthly, annual: round2(monthly * 12) });
}

const withAvg = (p: Omit<MinimumPay, "monthlyAvg">): MinimumPay => ({ ...p, monthlyAvg: round2(p.annual / 12) });

/** 내 시급이 최저임금의 몇 배인지(1 미만이면 위반 가능성) */
export function wageRatio(country: PlanCountry, hourlyWage: number): number {
  return hourlyWage / COUNTRY_MONEY[country].minimumWage.hourly;
}

/** 공적 최저생활 기준(가구원 수 1~4, 5명 이상은 4명 기준에서 1인분씩 늘린다) */
export function minimumIncomeFor(country: PlanCountry, household: number): number | null {
  const ref = COUNTRY_MONEY[country].minimumIncome;
  if (!ref) return null;
  const n = Math.max(1, Math.floor(household));
  const table = ref.perHousehold;
  if (n <= table.length) return table[n - 1];
  const step = table[table.length - 1] - table[table.length - 2];
  return round2(table[table.length - 1] + step * (n - table.length));
}

/** 월 적립액 monthly, 연 수익률 annualRate로 current에서 target까지 걸리는 개월 수. 50년 안에 못 가면 null */
export function monthsToTarget(current: number, monthly: number, annualRate: number, target: number): number | null {
  if (current >= target) return 0;
  const r = annualRate / 12;
  let balance = Math.max(0, current);
  for (let m = 1; m <= 600; m++) {
    balance = balance * (1 + r) + monthly;
    if (balance >= target) return m;
  }
  return null;
}

export type PlanId = "current" | "stable" | "balanced" | "aggressive";

/** 실수령액을 필수지출 / 선택지출 / 저축으로 나누는 비율. current는 사용자가 실제로 쓰는 대로. */
export const PLAN_SPLITS: Record<Exclude<PlanId, "current">, { needs: number; wants: number; save: number }> = {
  stable: { needs: 0.5, wants: 0.3, save: 0.2 },
  balanced: { needs: 0.5, wants: 0.2, save: 0.3 },
  aggressive: { needs: 0.45, wants: 0.1, save: 0.45 },
};

export interface PlanInput {
  country: PlanCountry;
  age: number;
  /** 월 실수령액 */
  netMonthly: number;
  /** 주거·식비·공과금·교통·통신·보험 등 필수지출 */
  needs: number;
  /** 외식·취미·여행 등 선택지출 */
  wants: number;
  /** 지금 모아 둔 돈 */
  currentSavings: number;
  /** 기대 연 수익률(예: 0.04) */
  annualReturn: number;
}

export interface Allocation {
  accountId: string;
  name: string;
  monthly: number;
}

export interface Plan {
  id: PlanId;
  needs: number;
  wants: number;
  save: number;
  /** 필수지출이 계획 비율보다 커서 저축액을 줄였는지 */
  squeezed: boolean;
  emergencyTarget: number;
  /** 비상금을 채우는 데 걸리는 개월 수(이미 채웠으면 0, 못 채우면 null) */
  emergencyMonths: number | null;
  /** 비상금을 채운 뒤 매달 어디에 넣을지 */
  allocation: Allocation[];
  /** seedTargets 3단계까지 걸리는 개월 수 */
  milestones: (number | null)[];
}

/** 나이 조건이 맞는 계좌에 우선순위대로 한도까지 채운다. */
export function allocate(country: PlanCountry, age: number, monthly: number, netMonthly: number): Allocation[] {
  let left = Math.max(0, monthly);
  const out: Allocation[] = [];
  for (const a of COUNTRY_MONEY[country].accounts) {
    if (left <= 0) break;
    if ((a.minAge !== undefined && age < a.minAge) || (a.maxAge !== undefined && age > a.maxAge)) continue;
    const cap = a.monthlyCap ?? (a.capShareOfIncome !== undefined ? netMonthly * a.capShareOfIncome : Infinity);
    const put = Math.min(left, cap);
    if (put <= 0) continue;
    out.push({ accountId: a.id, name: a.name, monthly: round2(put) });
    left -= put;
  }
  return out;
}

/** 지금 쓰는 그대로(current)와 A·B·C 세 가지 나눔 비율로 저축 계획을 만든다. */
export function buildPlans(input: PlanInput): Plan[] {
  const c = COUNTRY_MONEY[input.country];
  const net = Math.max(0, input.netMonthly);
  const needs = Math.max(0, input.needs);
  const wants = Math.max(0, input.wants);
  const emergencyTarget = (needs + wants) * c.emergencyMonths;

  const make = (id: PlanId, planNeeds: number, planWants: number, save: number, squeezed: boolean): Plan => {
    const s = Math.max(0, save);
    const gap = Math.max(0, emergencyTarget - Math.max(0, input.currentSavings));
    return {
      id,
      needs: round2(planNeeds),
      wants: round2(planWants),
      save: round2(s),
      squeezed,
      emergencyTarget: round2(emergencyTarget),
      emergencyMonths: gap === 0 ? 0 : s > 0 ? Math.ceil(gap / s) : null,
      allocation: allocate(input.country, input.age, s, net),
      milestones: c.seedTargets.map((t) => (s > 0 || input.currentSavings >= t ? monthsToTarget(input.currentSavings, s, input.annualReturn, t) : null)),
    };
  };

  const plans: Plan[] = [make("current", needs, wants, net - needs - wants, false)];
  for (const id of ["stable", "balanced", "aggressive"] as const) {
    const split = PLAN_SPLITS[id];
    // 필수지출은 줄일 수 없다고 보고, 비율보다 크면 선택지출과 저축에서 덜어 낸다.
    const planNeeds = Math.max(needs, net * split.needs);
    const room = Math.max(0, net - planNeeds);
    const wantShare = split.wants / (split.wants + split.save);
    const squeezed = needs > net * split.needs;
    const planWants = squeezed ? room * wantShare : net * split.wants;
    const save = squeezed ? room - planWants : net * split.save;
    plans.push(make(id, planNeeds, planWants, save, squeezed));
  }
  return plans;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
