// Korean year-end settlement (연말정산) rules for 2026 귀속 (settled in Jan–Feb 2027), shared by
// the year-end settlement tool and the calculator embedded in the year-end guide.
// Values were checked on 2026-10-19 against 국가법령정보센터 조문 (소득세법 시행 2026.1.1,
// 법률 제21221호·제21548호; 조세특례제한법 법률 제21223호, 2026.9.18 시행판). Review note:
// /mnt/project-files/notes/year-end-2026-review-2026-10-19.md (company-brain project files).
// The 2026 세제개편안 (proposed for 2027 귀속) is NOT applied here; it is still before the National Assembly.
// When a year changes, update the tables and the tests, not the formulas.
//
// The tax bracket table, 근로소득공제 and 근로소득세액공제 already live in kr-payroll-2026.ts (checked
// 2026-10-17) and are re-exported here so both year-end calculators import from one place.

import {
  basicIncomeTax,
  earnedIncomeDeduction,
  earnedIncomeTaxCredit,
  INCOME_TAX_BRACKETS,
  PERSONAL_DEDUCTION_PER_PERSON,
} from "./kr-payroll-2026.ts";

export { basicIncomeTax, earnedIncomeDeduction, earnedIncomeTaxCredit, INCOME_TAX_BRACKETS, PERSONAL_DEDUCTION_PER_PERSON };

export const YEAR_END_AS_OF = "2026-10-19";
export const YEAR_END_TAX_YEAR = 2026;

/** 지방소득세 = 결정세액 × 10% */
export const LOCAL_TAX_RATE = 0.1;

/** 표준세액공제(소득세법 제59조의4 ⑨): 특별소득공제·특별세액공제·월세세액공제를 신청하지 않은 근로자 */
export const STANDARD_TAX_CREDIT = 130_000;

/** 신용카드 등 소득공제(조특법 제126조의2, 2026.9.18 시행판). 2028.12.31 사용분까지. */
export const CARD = {
  thresholdRate: 0.25, // 총급여의 25%를 넘게 쓴 금액부터
  salaryCut: 70_000_000, // 한도·문화체육 공제율이 갈리는 총급여
  rates: { credit: 0.15, debit: 0.3, culture: 0.3, market: 0.4, transit: 0.4 },
  baseLimit: { le70m: 3_000_000, gt70m: 2_500_000 },
  childStep: { le70m: 500_000, gt70m: 250_000 }, // 자녀 1명당 상향, 2명까지
  childMax: 2,
  // 추가한도: 7천만 이하 전통시장+대중교통+문화체육 합산, 초과 전통시장+대중교통 합산
  extraLimit: { le70m: 3_000_000, gt70m: 2_000_000 },
} as const;

/** 보장성보험료 세액공제(소득세법 제59조의4 ①): min(보험료, 100만) × 12% */
export const INSURANCE = { cap: 1_000_000, rate: 0.12 } as const;

/** 연금계좌 세액공제(소득세법 제59조의3). 국세 기준 15%/12%, 지방세는 결정세액에서 따로 더한다. */
export const PENSION = { savingsCap: 6_000_000, totalCap: 9_000_000, rateLe55m: 0.15, rateGt55m: 0.12, salaryCut: 55_000_000 } as const;

/** 월세액 세액공제(조특법 제95조의2): 연 1,000만 원 한도, 총급여 8,000만 이하(종합소득금액 7,000만 초과 제외). */
export const RENT = {
  cap: 10_000_000,
  salaryMax: 80_000_000,
  incomeMax: 70_000_000,
  rateHigh: 0.17, // 총급여 5,500만 이하(종합소득금액 4,500만 이하)
  rateLow: 0.15,
  highRateSalaryMax: 55_000_000,
  highRateIncomeMax: 45_000_000,
} as const;

/** 의료비 세액공제(소득세법 제59조의4 ②). 계산기는 입력 전액을 일반 부양가족 의료비로 보고 700만 원 한도를 건다. */
export const MEDICAL = { floorRate: 0.03, rate: 0.15, generalCap: 7_000_000 } as const;

/** 교육비 세액공제(소득세법 제59조의4 ③). 계산기는 1인 한도를 따로 나누지 않고 합계에 대학생 한도를 건다. */
export const EDUCATION = { rate: 0.15, schoolCap: 3_000_000, collegeCap: 9_000_000 } as const;

/** 기부금 세액공제(소득세법 제59조의4 ④): 1,000만 원 이하 15%, 초과분 30%. 소득금액 한도는 계산기에서 생략. */
export const DONATION = { rate: 0.15, highRate: 0.3, pivot: 10_000_000 } as const;

/**
 * 자녀세액공제(소득세법 제59조의2): 1명 25만, 2명 55만, 3명부터 1명당 40만 추가.
 * 2026년 귀속 대상은 9세 이상 20세 이하(법률 제21548호 부칙, 2030년 13세까지 단계 상향).
 * 출산·입양 공제는 첫째 30만, 둘째 50만, 셋째 이상 70만.
 */
export const CHILD_CREDIT = { one: 250_000, two: 550_000, extraPer: 400_000, minAge2026: 9, maxAge: 20 } as const;
export const BIRTH_CREDIT = [300_000, 500_000, 700_000] as const;

/**
 * 추가공제(소득세법 제51조): 경로우대(70세 이상) 100만, 장애인 200만, 부녀자 50만(종합소득금액 3,000만 이하),
 * 한부모 100만. 부녀자와 한부모가 겹치면 한부모만 받는다(같은 조 ②).
 */
export const ADDITIONAL = { senior: 1_000_000, disabled: 2_000_000, woman: 500_000, womanIncomeMax: 30_000_000, singleParent: 1_000_000 } as const;

/**
 * 주택자금 공제. 주택임차차입금 원리금(소득세법 제52조 ④)과 주택청약종합저축(조특법 제87조)은 40%씩 합산 400만,
 * 장기주택저당차입금 이자(제52조 ⑤)는 그 400만을 포함한 상환 조건별 한도까지. 청약은 총급여 7,000만 이하
 * 무주택 세대주, 연 납입 300만까지. 장기주택 한도는 2024년 상향분(2,000/1,800/800/600만) 그대로다(확인 2026-10-23).
 */
export const HOUSING = {
  rate: 0.4,
  leaseSubscriptionCap: 4_000_000,
  subscriptionPayCap: 3_000_000,
  subscriptionSalaryMax: 70_000_000,
  mortgageCaps: { fixedAndNoGrace15: 20_000_000, fixedOrNoGrace15: 18_000_000, other15: 8_000_000, fixedOrNoGrace10: 6_000_000 },
} as const;
export type MortgageType = keyof typeof HOUSING.mortgageCaps;

/** 소득공제 종합한도(조특법 제132조의2): 신용카드·청약저축 등 조특법 소득공제 합계 2,500만 */
export const SPECIAL_DEDUCTION_TOTAL_CAP = 25_000_000;

/** 장애인전용 보장성보험료 세액공제: min(보험료, 100만) × 15% */
export const DISABLED_INSURANCE = { cap: 1_000_000, rate: 0.15 } as const;

/** 일반기부금 소득금액 한도(소득세법 제34조 ③): 종교단체 없으면 30%, 있으면 10% + min(20%, 종교 외) */
export const DONATION_LIMIT = { general: 0.3, religious: 0.1 } as const;

/**
 * 정치자금(조특법 제76조)·고향사랑기부금(제58조): 10만 원까지 100/110. 고향사랑은 2026.1.1 기부분부터 10만 초과
 * 20만 이하 40%(2025.12.23 개정), 그 위 15%, 연 2,000만 한도. 정치자금 10만 초과는 15%(3,000만 초과 25%).
 * 둘 다 특별세액공제가 아니라 표준세액공제를 골라도 받는다.
 */
export const POLITICAL = { fullCap: 100_000, rate: 0.15, highRate: 0.25, pivot: 30_000_000 } as const;
export const HOMETOWN = { fullCap: 100_000, midCap: 200_000, midRate: 0.4, rate: 0.15, cap: 20_000_000 } as const;

/** 결혼세액공제(조특법 제92조): 2024.1.1~2026.12.31 혼인신고, 생애 1회 50만 */
export const MARRIAGE_CREDIT = 500_000;

/** 중소기업 취업 청년 소득세 감면(조특법 제30조): 계약 시 15~34세, 5년간 90%, 연 200만 한도 */
export const YOUTH_SME = { rate: 0.9, cap: 2_000_000, maxAge: 34 } as const;

/** ISA 만기금 연금계좌 전환(소득세법 제59조의3 ③): 전환액 10%, 300만까지 연금 세액공제 대상에 더한다. */
export const ISA_TRANSFER = { rate: 0.1, cap: 3_000_000 } as const;

const floor = (won: number) => Math.floor(Math.max(0, won));

export interface CardSpending {
  credit?: number;
  /** 체크카드·현금영수증 */
  debit?: number;
  /** 도서·신문·공연·박물관·영화·체육시설(총급여 7천만 이하만 30%, 초과면 결제수단 공제율) */
  culture?: number;
  market?: number;
  transit?: number;
}

export interface CardDeductionResult {
  threshold: number;
  /** 한도 적용 전 공제 가능액 */
  gross: number;
  limit: number;
  extra: number;
  deduction: number;
}

/**
 * 신용카드 등 소득공제. 최저사용금액(총급여 25%)은 공제율이 낮은 순서(신용 → 체크·현금 → 문화체육 →
 * 전통시장·대중교통)로 먼저 채운다. 기본한도를 넘은 금액은 전통시장·대중교통(7천만 이하는 문화체육 포함)
 * 공제분 안에서 추가한도까지 더 인정한다.
 */
export function cardDeduction(salary: number, spend: CardSpending, children = 0): CardDeductionResult {
  const le70 = salary <= CARD.salaryCut;
  const r = CARD.rates;
  // 총급여 7천만 초과자의 문화체육 지출은 별도 공제율이 없어 신용카드로 본다(결제수단에 따라 달라질 수 있음).
  const groups: { amount: number; rate: number; extraEligible: boolean }[] = [
    { amount: (spend.credit ?? 0) + (le70 ? 0 : spend.culture ?? 0), rate: r.credit, extraEligible: false },
    { amount: spend.debit ?? 0, rate: r.debit, extraEligible: false },
    { amount: le70 ? spend.culture ?? 0 : 0, rate: r.culture, extraEligible: le70 },
    { amount: spend.market ?? 0, rate: r.market, extraEligible: true },
    { amount: spend.transit ?? 0, rate: r.transit, extraEligible: true },
  ];
  const threshold = salary * CARD.thresholdRate;
  let remaining = threshold;
  let gross = 0;
  let extraPool = 0;
  for (const g of groups) {
    const amount = Math.max(0, g.amount);
    const used = Math.min(amount, remaining);
    remaining -= used;
    const part = (amount - used) * g.rate;
    gross += part;
    if (g.extraEligible) extraPool += part;
  }
  const kids = Math.min(Math.max(0, Math.floor(children)), CARD.childMax);
  const limit = le70 ? CARD.baseLimit.le70m + kids * CARD.childStep.le70m : CARD.baseLimit.gt70m + kids * CARD.childStep.gt70m;
  const within = Math.min(gross, limit);
  const extra = Math.min(gross - within, extraPool, le70 ? CARD.extraLimit.le70m : CARD.extraLimit.gt70m);
  return { threshold, gross: floor(gross), limit, extra: floor(extra), deduction: floor(within + extra) };
}

export function insuranceCredit(premium: number): number {
  return floor(Math.min(Math.max(0, premium), INSURANCE.cap) * INSURANCE.rate);
}

/** 연금계좌 세액공제(국세). 연금저축은 600만, IRP를 더해 900만까지. */
export function pensionCredit(salary: number, savings: number, irp: number, isaTransfer = 0): number {
  const base = Math.min(Math.min(Math.max(0, savings), PENSION.savingsCap) + Math.max(0, irp), PENSION.totalCap);
  const isa = Math.min(Math.max(0, isaTransfer) * ISA_TRANSFER.rate, ISA_TRANSFER.cap);
  return floor((base + isa) * (salary <= PENSION.salaryCut ? PENSION.rateLe55m : PENSION.rateGt55m));
}

/** 월세액 세액공제(국세). earnedIncome은 근로소득금액(근로소득만 있으면 종합소득금액과 같다). */
export function rentCredit(salary: number, earnedIncome: number, rentPaid: number): number {
  if (salary > RENT.salaryMax || earnedIncome > RENT.incomeMax) return 0;
  const high = salary <= RENT.highRateSalaryMax && earnedIncome <= RENT.highRateIncomeMax;
  return floor(Math.min(Math.max(0, rentPaid), RENT.cap) * (high ? RENT.rateHigh : RENT.rateLow));
}

/**
 * 의료비 세액공제. general은 700만 한도가 걸리는 일반 부양가족 의료비, specific은 한도가 없는 본인·65세 이상·
 * 장애인·6세 이하 의료비. 총급여 3% 문턱은 일반 의료비에서 먼저 빼고, 모자라면 specific에서 뺀다.
 */
export function medicalCredit(salary: number, general: number, specific = 0): number {
  const over = Math.max(0, general) - salary * MEDICAL.floorRate;
  const generalPart = Math.min(Math.max(0, over), MEDICAL.generalCap);
  const specificPart = Math.max(0, Math.max(0, specific) + Math.min(0, over));
  return floor((generalPart + specificPart) * MEDICAL.rate);
}

/** 교육비 세액공제. 부양가족 교육비는 대학생 한도 900만을 합계에 걸고, 본인 교육비(self)는 한도가 없다. */
export function educationCredit(spent: number, self = 0): number {
  return floor((Math.min(Math.max(0, spent), EDUCATION.collegeCap) + Math.max(0, self)) * EDUCATION.rate);
}

export function donationCredit(given: number): number {
  const g = Math.max(0, given);
  return floor(Math.min(g, DONATION.pivot) * DONATION.rate + Math.max(0, g - DONATION.pivot) * DONATION.highRate);
}

/** 자녀세액공제(9세 이상 20세 이하 기본공제 대상 자녀 수) */
export function childTaxCredit(children: number): number {
  const n = Math.max(0, Math.floor(children));
  if (n === 0) return 0;
  if (n === 1) return CHILD_CREDIT.one;
  return CHILD_CREDIT.two + (n - 2) * CHILD_CREDIT.extraPer;
}


export interface AdditionalPersons {
  /** 70세 이상 기본공제 대상자 수(본인 포함) */
  seniors?: number;
  /** 장애인 기본공제 대상자 수(본인 포함) */
  disabled?: number;
  /** 부녀자: 배우자 있는 여성 또는 부양가족 있는 여성 세대주 */
  womanHead?: boolean;
  /** 한부모: 배우자 없이 기본공제 대상 직계비속·입양자가 있는 사람 */
  singleParent?: boolean;
}

/** 추가공제 합계. totalIncome은 종합소득금액(부녀자 3,000만 요건에 쓴다). */
export function additionalDeduction(p: AdditionalPersons, totalIncome: number, persons: number): number {
  const cap = Math.max(1, Math.floor(persons));
  const count = (n?: number) => Math.min(Math.max(0, Math.floor(n ?? 0)), cap);
  let total = count(p.seniors) * ADDITIONAL.senior + count(p.disabled) * ADDITIONAL.disabled;
  if (p.singleParent) total += ADDITIONAL.singleParent;
  else if (p.womanHead && totalIncome <= ADDITIONAL.womanIncomeMax) total += ADDITIONAL.woman;
  return total;
}

export interface HousingInput {
  /** 주택임차차입금(전세대출) 원리금 상환액. 무주택 세대주, 국민주택규모 */
  leaseRepaid?: number;
  /** 주택청약종합저축 납입액. 총급여 7,000만 이하 무주택 세대주(배우자) */
  subscriptionPaid?: number;
  /** 장기주택저당차입금 이자 상환액 */
  mortgageInterest?: number;
  mortgageType?: MortgageType;
}

export interface HousingResult {
  lease: number;
  subscription: number;
  mortgage: number;
  total: number;
}

/**
 * 주택자금 소득공제. 청약은 조특법 공제라 표준세액공제를 골라도 남고(special=false), 임차차입금·장기주택 이자는
 * 특별소득공제라 special=true일 때만 들어간다.
 */
export function housingDeduction(salary: number, h: HousingInput, special: boolean): HousingResult {
  const sub = salary <= HOUSING.subscriptionSalaryMax ? Math.min(Math.max(0, h.subscriptionPaid ?? 0), HOUSING.subscriptionPayCap) * HOUSING.rate : 0;
  const lease = special ? Math.max(0, h.leaseRepaid ?? 0) * HOUSING.rate : 0;
  const pair = Math.min(sub + lease, HOUSING.leaseSubscriptionCap);
  const subscription = Math.min(sub, pair);
  const mortgageCap = h.mortgageType ? HOUSING.mortgageCaps[h.mortgageType] : 0;
  const mortgage = special ? Math.min(Math.max(0, h.mortgageInterest ?? 0), Math.max(0, mortgageCap - pair)) : 0;
  return { lease: floor(pair - subscription), subscription: floor(subscription), mortgage: floor(mortgage), total: floor(pair + mortgage) };
}

/** 일반기부금 중 소득금액 한도 안에서 인정되는 금액 */
export function allowedDonation(income: number, general: number, religious: number): number {
  const g = Math.max(0, general);
  const r = Math.max(0, religious);
  const i = Math.max(0, income);
  const limit = r > 0 ? i * DONATION_LIMIT.religious + Math.min(i * (DONATION_LIMIT.general - DONATION_LIMIT.religious), g) : i * DONATION_LIMIT.general;
  return Math.min(g + r, limit);
}

/** 정치자금 기부금 세액공제(국세). 10만 원까지 100/110 */
export function politicalCredit(given: number): number {
  const g = Math.max(0, given);
  const full = Math.min(g, POLITICAL.fullCap);
  const mid = Math.min(Math.max(0, g - full), POLITICAL.pivot - POLITICAL.fullCap);
  const high = Math.max(0, g - POLITICAL.pivot);
  return floor((full * 100) / 110 + mid * POLITICAL.rate + high * POLITICAL.highRate);
}

/** 고향사랑기부금 세액공제(국세, 2026.1.1 기부분부터). 10만 원까지 100/110, 20만까지 40%, 그 위 15% */
export function hometownCredit(given: number): number {
  const g = Math.min(Math.max(0, given), HOMETOWN.cap);
  const full = Math.min(g, HOMETOWN.fullCap);
  const mid = Math.min(Math.max(0, g - HOMETOWN.fullCap), HOMETOWN.midCap - HOMETOWN.fullCap);
  const rest = Math.max(0, g - HOMETOWN.midCap);
  return floor((full * 100) / 110 + mid * HOMETOWN.midRate + rest * HOMETOWN.rate);
}

/** 출산·입양 세액공제. order는 올해 태어난(입양한) 자녀가 몇째인지(0이면 없음) */
export function birthCredit(order: number): number {
  const o = Math.floor(order);
  if (o <= 0) return 0;
  return BIRTH_CREDIT[Math.min(o, BIRTH_CREDIT.length) - 1];
}

export interface YearEndInput {
  /** 총급여(비과세 제외, 연) */
  salary: number;
  /** 기본공제 인원(본인 포함) */
  persons: number;
  /** 근로소득 외 종합소득금액(사업·연금·기타소득금액 합계). 넣으면 종합소득세 확정신고 기준으로 계산한다. */
  otherIncome?: number;
  additional?: AdditionalPersons;
  /** 국민연금 등 연금보험료(제51조의3, 표준세액공제와 무관하게 공제) */
  nationalPension?: number;
  /** 건강·장기요양·고용보험료(특별소득공제) */
  healthEmployment?: number;
  housing?: HousingInput;
  card?: CardSpending;
  /** 신용카드 한도 상향에 쓰는 자녀 수 */
  cardChildren?: number;
  /** 자녀세액공제 대상 자녀 수(2026년 귀속 9세 이상 20세 이하) */
  creditChildren?: number;
  /** 올해 출생·입양한 자녀가 몇째인지(0이면 없음) */
  birthOrder?: number;
  insurancePremium?: number;
  disabledInsurance?: number;
  /** 일반 부양가족 의료비(700만 한도) */
  medical?: number;
  /** 본인·65세 이상·장애인·6세 이하 의료비(한도 없음) */
  medicalSpecific?: number;
  /** 부양가족 교육비 */
  education?: number;
  /** 본인 교육비(한도 없음) */
  educationSelf?: number;
  /** 일반(지정)기부금 중 종교단체 외 */
  donation?: number;
  religiousDonation?: number;
  politicalDonation?: number;
  hometownDonation?: number;
  pensionSavings?: number;
  /** IRP·DC형 퇴직연금 개인 추가 납입액 */
  irp?: number;
  /** 올해 연금계좌로 옮긴 ISA 만기금 */
  isaTransfer?: number;
  rent?: number;
  /** 2024~2026년 혼인신고(생애 1회, 아직 받지 않은 경우) */
  marriage?: boolean;
  /** 중소기업 취업 청년 감면 대상 */
  youthSme?: boolean;
  /** 1년 동안 원천징수된 소득세(지방소득세 제외). 넣으면 환급·추가 납부를 계산한다. */
  withheld?: number;
}

export interface YearEndResult {
  earnedDeduction: number;
  earnedIncome: number;
  /** 근로소득금액 + 다른 종합소득금액 */
  totalIncome: number;
  personalDeduction: number;
  additionalDeduction: number;
  incomeDeductions: number;
  cardDeduction: number;
  housing: HousingResult;
  taxBase: number;
  calculatedTax: number;
  youthReduction: number;
  earnedTaxCredit: number;
  childCredit: number;
  birthCredit: number;
  pensionCredit: number;
  insuranceCredit: number;
  medicalCredit: number;
  educationCredit: number;
  donationCredit: number;
  politicalCredit: number;
  hometownCredit: number;
  marriageCredit: number;
  rentCredit: number;
  standardCredit: number;
  /** true면 특별공제·월세 대신 표준세액공제 13만 원을 고른 결과 */
  usedStandard: boolean;
  totalCredits: number;
  finalTax: number;
  localTax: number;
  /** 결정세액 + 지방소득세 */
  totalTax: number;
  /** withheld를 넣었을 때만: 양수면 환급, 음수면 추가 납부(국세 + 지방세) */
  refund?: { national: number; local: number; total: number };
}

/**
 * 근로소득 거주자의 연말정산 간이 계산(otherIncome을 넣으면 종합소득세 확정신고 근사).
 * 특별소득공제(건강·고용보험료, 주택임차·장기주택 이자)·특별세액공제(보험·의료·교육·기부)·월세를 받는 경우와
 * 표준세액공제 13만 원을 받는 경우를 둘 다 계산해 세금이 적은 쪽을 고른다(소득세법 제59조의4 ⑨). 원 미만은 절사한다.
 * 근로소득세액공제와 청년 감면은 산출세액 중 근로소득금액 비율만큼만 계산한다.
 */
export function settleYearEnd(input: YearEndInput): YearEndResult {
  const salary = Math.max(0, input.salary);
  const earnedDeduction = earnedIncomeDeduction(salary);
  const earnedIncome = Math.max(0, salary - earnedDeduction);
  const totalIncome = earnedIncome + Math.max(0, input.otherIncome ?? 0);
  const persons = Math.max(1, Math.floor(input.persons));
  const personalDeduction = persons * PERSONAL_DEDUCTION_PER_PERSON;
  const additional = additionalDeduction(input.additional ?? {}, totalIncome, persons);
  const card = cardDeduction(salary, input.card ?? {}, input.cardChildren ?? 0).deduction;

  const childCredit = childTaxCredit(input.creditChildren ?? 0);
  const birth = birthCredit(input.birthOrder ?? 0);
  const pension = pensionCredit(salary, input.pensionSavings ?? 0, input.irp ?? 0, input.isaTransfer ?? 0);
  const political = politicalCredit(input.politicalDonation ?? 0);
  const hometown = hometownCredit(input.hometownDonation ?? 0);
  const marriage = input.marriage ? MARRIAGE_CREDIT : 0;

  const run = (special: boolean): YearEndResult => {
    const housing = housingDeduction(salary, input.housing ?? {}, special);
    // 조특법 소득공제(카드·청약)는 합쳐 2,500만까지
    const capped = Math.min(card + housing.subscription, SPECIAL_DEDUCTION_TOTAL_CAP);
    const incomeDeductions =
      personalDeduction +
      additional +
      Math.max(0, input.nationalPension ?? 0) +
      capped +
      (special ? Math.max(0, input.healthEmployment ?? 0) + housing.lease + housing.mortgage : 0);
    const taxBase = floor(totalIncome - incomeDeductions);
    const calculatedTax = basicIncomeTax(taxBase);
    const earnedShare = totalIncome > 0 ? earnedIncome / totalIncome : 0;
    const earnedTax = calculatedTax * earnedShare;
    const youthReduction = input.youthSme ? floor(Math.min(earnedTax * YOUTH_SME.rate, YOUTH_SME.cap)) : 0;
    const earnedTaxCredit = floor(
      earnedIncomeTaxCredit(floor(earnedTax), salary) * (calculatedTax > 0 ? 1 - youthReduction / calculatedTax : 0),
    );
    const ins = special ? insuranceCredit(input.insurancePremium ?? 0) + floor(Math.min(Math.max(0, input.disabledInsurance ?? 0), DISABLED_INSURANCE.cap) * DISABLED_INSURANCE.rate) : 0;
    const med = special ? medicalCredit(salary, input.medical ?? 0, input.medicalSpecific ?? 0) : 0;
    const edu = special ? educationCredit(input.education ?? 0, input.educationSelf ?? 0) : 0;
    const don = special ? donationCredit(allowedDonation(totalIncome, input.donation ?? 0, input.religiousDonation ?? 0)) : 0;
    const rent = special ? rentCredit(salary, totalIncome, input.rent ?? 0) : 0;
    const standardCredit = special ? 0 : STANDARD_TAX_CREDIT;
    const totalCredits =
      earnedTaxCredit + childCredit + birth + pension + ins + med + edu + don + political + hometown + marriage + rent + standardCredit;
    const finalTax = floor(calculatedTax - youthReduction - totalCredits);
    const localTax = floor(finalTax * LOCAL_TAX_RATE);
    const result: YearEndResult = {
      earnedDeduction,
      earnedIncome,
      totalIncome,
      personalDeduction,
      additionalDeduction: additional,
      incomeDeductions,
      cardDeduction: capped - housing.subscription,
      housing,
      taxBase,
      calculatedTax,
      youthReduction,
      earnedTaxCredit,
      childCredit,
      birthCredit: birth,
      pensionCredit: pension,
      insuranceCredit: ins,
      medicalCredit: med,
      educationCredit: edu,
      donationCredit: don,
      politicalCredit: political,
      hometownCredit: hometown,
      marriageCredit: marriage,
      rentCredit: rent,
      standardCredit,
      usedStandard: !special,
      totalCredits,
      finalTax,
      localTax,
      totalTax: finalTax + localTax,
    };
    if (input.withheld !== undefined) {
      const withheld = Math.max(0, input.withheld);
      const national = withheld - finalTax;
      const local = floor(withheld * LOCAL_TAX_RATE) - localTax;
      result.refund = { national, local, total: national + local };
    }
    return result;
  };

  const withSpecial = run(true);
  const withStandard = run(false);
  return withStandard.totalTax < withSpecial.totalTax ? withStandard : withSpecial;
}

export type SavingLeverId = "pension" | "subscription" | "political" | "hometown" | "debit";

export interface SavingLever {
  id: SavingLeverId;
  /** 이 방법을 쓰려고 더 내야 하는 돈(카드 결제수단 바꾸기는 0) */
  extraPayment: number;
  /** 줄어드는 결정세액 + 지방소득세 */
  taxSaved: number;
}

export interface SavingPlan {
  base: YearEndResult;
  levers: SavingLever[];
  /** 모든 방법을 한꺼번에 쓴 결과 */
  best: YearEndResult;
  bestExtraPayment: number;
  bestTaxSaved: number;
}

/**
 * 지금 입력에서 세금을 더 줄일 수 있는 방법을 하나씩, 그리고 모두 합쳐 다시 계산한다. 공제 한도까지만 채우며,
 * 청약은 총급여 7,000만 이하일 때만 제안한다(무주택 세대주 요건은 사용자가 확인).
 */
export function taxSavingPlan(input: YearEndInput): SavingPlan {
  const base = settleYearEnd(input);
  const pensionBase = Math.min(Math.max(0, input.pensionSavings ?? 0), PENSION.savingsCap) + Math.max(0, input.irp ?? 0);
  const changes: { id: SavingLeverId; extra: number; apply: (i: YearEndInput) => YearEndInput }[] = [];

  const pensionExtra = Math.max(0, PENSION.totalCap - pensionBase);
  changes.push({ id: "pension", extra: pensionExtra, apply: (i) => ({ ...i, irp: (i.irp ?? 0) + pensionExtra }) });

  if (input.salary <= HOUSING.subscriptionSalaryMax) {
    const paid = input.housing?.subscriptionPaid ?? 0;
    const subExtra = Math.max(0, HOUSING.subscriptionPayCap - paid);
    changes.push({ id: "subscription", extra: subExtra, apply: (i) => ({ ...i, housing: { ...i.housing, subscriptionPaid: (i.housing?.subscriptionPaid ?? 0) + subExtra } }) });
  }

  const politicalExtra = Math.max(0, POLITICAL.fullCap - (input.politicalDonation ?? 0));
  changes.push({ id: "political", extra: politicalExtra, apply: (i) => ({ ...i, politicalDonation: (i.politicalDonation ?? 0) + politicalExtra }) });

  const hometownExtra = Math.max(0, HOMETOWN.midCap - (input.hometownDonation ?? 0));
  changes.push({ id: "hometown", extra: hometownExtra, apply: (i) => ({ ...i, hometownDonation: (i.hometownDonation ?? 0) + hometownExtra }) });

  const credit = input.card?.credit ?? 0;
  changes.push({ id: "debit", extra: 0, apply: (i) => ({ ...i, card: { ...i.card, credit: 0, debit: (i.card?.debit ?? 0) + (i.card?.credit ?? 0) } }) });

  const levers: SavingLever[] = [];
  let combined = input;
  let bestExtraPayment = 0;
  for (const c of changes) {
    if (c.id === "debit" ? credit <= 0 : c.extra <= 0) continue;
    const saved = base.totalTax - settleYearEnd(c.apply(input)).totalTax;
    if (saved <= 0) continue;
    levers.push({ id: c.id, extraPayment: c.extra, taxSaved: saved });
    combined = c.apply(combined);
    bestExtraPayment += c.extra;
  }
  const best = settleYearEnd(combined);
  return { base, levers, best, bestExtraPayment, bestTaxSaved: base.totalTax - best.totalTax };
}
