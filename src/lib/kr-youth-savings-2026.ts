// 청년미래적금 (2026-06-22 출시) rules for the youth future savings calculator.
// Checked 2026-10-13 against 금융위원회 announcements as summarised by 서민금융진흥원,
// 토스뱅크 (2026-06-02, 2026-09-22 articles) and 헤럴드경제 (2026-09-15). The official
// pages could not be fetched from the build container, so re-check the numbers below
// against kinfa.or.kr before changing them.
// When the product changes, update YOUTH_SAVINGS and the tests, not the formulas.

import { AMOUNT, parseKrAmount } from "./kr-vat-2026.ts";

export const YOUTH_SAVINGS_AS_OF = "2026-10-13";

export const YOUTH_SAVINGS = {
  monthlyMax: 500_000,
  months: 36,
  baseRate: 0.05, // 3년 고정
  lowIncomeBonusRate: 0.005, // 총급여 3,600만 원(종합소득 2,600만 원) 이하
  counselingBonusRate: 0.002, // '청년 모두를 위한 재무상담' 이수
  contributionGeneral: 0.06,
  contributionPreferred: 0.12,
  generalPayMax: 60_000_000,
  preferredPayMax: 36_000_000,
  taxFreeOnlyPayMax: 75_000_000,
  generalRevenueMax: 300_000_000,
  preferredRevenueMax: 100_000_000,
  interestTaxRate: 0.154, // 일반 적금이었다면 내는 이자소득세(지방세 포함)
} as const;

export type SavingsKind = "preferred" | "general" | "taxFreeOnly";
export type WorkKind = "smeEmployee" | "smeNewHire" | "otherEmployee" | "smallBusiness";
export type HouseholdBand = "upTo150" | "upTo200" | "over200";

export interface SavingsInput {
  monthly: number;
  annualRate: number;
  kind: SavingsKind;
  months?: number;
}

export interface SavingsResult {
  principal: number;
  interest: number;
  monthlyContribution: number;
  contribution: number;
  total: number;
  /** 같은 금리의 일반 적금이었다면 이자에서 빠졌을 세금 */
  taxSaved: number;
}

export function contributionRate(kind: SavingsKind): number {
  if (kind === "preferred") return YOUTH_SAVINGS.contributionPreferred;
  if (kind === "general") return YOUTH_SAVINGS.contributionGeneral;
  return 0;
}

/**
 * 만기 수령액. 이자는 적금 단리(매달 넣은 돈이 남은 달 수만큼 이자)로 계산한다.
 * 기여금에 붙는 이자는 적립 방식이 공개 자료마다 달라 넣지 않았다(2026-10-13).
 * 그래서 은행이 보여 주는 예시 수령액보다 조금 적게 나온다.
 */
export function youthFutureSavings({ monthly, annualRate, kind, months = YOUTH_SAVINGS.months }: SavingsInput): SavingsResult {
  const principal = monthly * months;
  const interest = Math.floor((monthly * annualRate * (months * (months + 1)) / 2) / 12);
  const monthlyContribution = Math.floor(monthly * contributionRate(kind));
  const contribution = monthlyContribution * months;
  return {
    principal,
    interest,
    monthlyContribution,
    contribution,
    total: principal + interest + contribution,
    taxSaved: Math.floor(interest * YOUTH_SAVINGS.interestTaxRate),
  };
}

export interface EligibilityInput {
  work: WorkKind;
  /** 직전 연도 총급여(직장인) */
  pay: number;
  /** 연 매출(소상공인) */
  revenue: number;
  household: HouseholdBand;
}

export interface Eligibility {
  kind: SavingsKind | "ineligible";
  reason: string;
  lowIncomeBonus: boolean;
}

/** 공개된 기준으로 본 유형 미리 보기. 실제 판정은 국세청 확정 소득과 가구소득 심사로 정해진다. */
export function classifyYouthSavings({ work, pay, revenue, household }: EligibilityInput): Eligibility {
  const S = YOUTH_SAVINGS;
  if (household === "over200") {
    return { kind: "ineligible", reason: "가구소득이 기준중위소득 200%를 넘으면 가입할 수 없습니다.", lowIncomeBonus: false };
  }
  if (work === "smallBusiness") {
    if (revenue <= S.preferredRevenueMax && household === "upTo150") {
      return { kind: "preferred", reason: "연 매출 1억 원 이하 소상공인이고 가구소득이 150% 이하라 우대형 기준에 맞습니다.", lowIncomeBonus: false };
    }
    if (revenue <= S.generalRevenueMax) {
      return { kind: "general", reason: "연 매출 3억 원 이하 소상공인이라 일반형 기준에 맞습니다.", lowIncomeBonus: false };
    }
    return { kind: "ineligible", reason: "소상공인은 연 매출 3억 원 이하여야 합니다.", lowIncomeBonus: false };
  }
  const lowIncomeBonus = pay <= S.preferredPayMax;
  if (pay > S.taxFreeOnlyPayMax) {
    return { kind: "ineligible", reason: "총급여가 7,500만 원을 넘으면 가입할 수 없습니다.", lowIncomeBonus: false };
  }
  if (pay > S.generalPayMax) {
    return { kind: "taxFreeOnly", reason: "총급여 6,000만~7,500만 원 구간은 정부기여금 없이 이자 비과세만 받습니다.", lowIncomeBonus };
  }
  if (work === "smeNewHire") {
    return { kind: "preferred", reason: "중소기업 입사 6개월 이내이고 총급여 6,000만 원 이하라 우대형(신규 취업자) 기준에 맞습니다.", lowIncomeBonus };
  }
  if (work === "smeEmployee" && lowIncomeBonus && household === "upTo150") {
    return { kind: "preferred", reason: "중소기업 재직, 총급여 3,600만 원 이하, 가구소득 150% 이하라 우대형 기준에 맞습니다.", lowIncomeBonus };
  }
  return { kind: "general", reason: "총급여 6,000만 원 이하라 일반형 기준에 맞습니다.", lowIncomeBonus };
}

export interface ParsedSavings {
  monthly?: number;
  annualRate?: number;
  kind?: SavingsKind;
  pay?: number;
}

/** "월 50만원 우대형 금리 7%", "총급여 3000만원 월 30만원" 같은 한 줄을 읽는다. */
export function parseSavingsText(text: string): ParsedSavings {
  const t = text.replace(/\s+/g, " ");
  const out: ParsedSavings = {};
  const amount = (re: RegExp) => {
    const raw = t.match(re)?.[1];
    const value = raw === undefined ? null : parseKrAmount(raw);
    return value === null ? undefined : value;
  };
  out.monthly = amount(new RegExp(`(?:월|매달|매월)\\s*(?:납입|저축)?\\s*${AMOUNT}`));
  out.pay = amount(new RegExp(`(?:총\\s*급여|연봉|급여)\\s*${AMOUNT}`));
  const rate = t.match(/(\d+(?:\.\d+)?)\s*%/)?.[1];
  if (rate) out.annualRate = Number(rate) / 100;
  if (/우대형/.test(t)) out.kind = "preferred";
  else if (/일반형/.test(t)) out.kind = "general";
  else if (/비과세\s*만/.test(t)) out.kind = "taxFreeOnly";
  for (const key of Object.keys(out) as (keyof ParsedSavings)[]) if (out[key] === undefined) delete out[key];
  return out;
}
