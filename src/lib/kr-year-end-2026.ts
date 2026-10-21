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
export function pensionCredit(salary: number, savings: number, irp: number): number {
  const base = Math.min(Math.min(Math.max(0, savings), PENSION.savingsCap) + Math.max(0, irp), PENSION.totalCap);
  return floor(base * (salary <= PENSION.salaryCut ? PENSION.rateLe55m : PENSION.rateGt55m));
}

/** 월세액 세액공제(국세). earnedIncome은 근로소득금액(근로소득만 있으면 종합소득금액과 같다). */
export function rentCredit(salary: number, earnedIncome: number, rentPaid: number): number {
  if (salary > RENT.salaryMax || earnedIncome > RENT.incomeMax) return 0;
  const high = salary <= RENT.highRateSalaryMax && earnedIncome <= RENT.highRateIncomeMax;
  return floor(Math.min(Math.max(0, rentPaid), RENT.cap) * (high ? RENT.rateHigh : RENT.rateLow));
}

export function medicalCredit(salary: number, spent: number): number {
  return floor(Math.min(Math.max(0, spent - salary * MEDICAL.floorRate), MEDICAL.generalCap) * MEDICAL.rate);
}

export function educationCredit(spent: number): number {
  return floor(Math.min(Math.max(0, spent), EDUCATION.collegeCap) * EDUCATION.rate);
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

export interface YearEndInput {
  /** 총급여(비과세 제외, 연) */
  salary: number;
  /** 기본공제 인원(본인 포함) */
  persons: number;
  /** 국민연금 등 연금보험료(제51조의3, 표준세액공제와 무관하게 공제) */
  nationalPension?: number;
  /** 건강·장기요양·고용보험료(특별소득공제) */
  healthEmployment?: number;
  card?: CardSpending;
  /** 신용카드 한도 상향에 쓰는 자녀 수 */
  cardChildren?: number;
  /** 자녀세액공제 대상 자녀 수(2026년 귀속 9세 이상 20세 이하) */
  creditChildren?: number;
  insurancePremium?: number;
  medical?: number;
  education?: number;
  donation?: number;
  pensionSavings?: number;
  irp?: number;
  rent?: number;
}

export interface YearEndResult {
  earnedDeduction: number;
  earnedIncome: number;
  incomeDeductions: number;
  cardDeduction: number;
  taxBase: number;
  calculatedTax: number;
  earnedTaxCredit: number;
  childCredit: number;
  pensionCredit: number;
  insuranceCredit: number;
  medicalCredit: number;
  educationCredit: number;
  donationCredit: number;
  rentCredit: number;
  standardCredit: number;
  /** true면 특별공제·월세 대신 표준세액공제 13만 원을 고른 결과 */
  usedStandard: boolean;
  totalCredits: number;
  finalTax: number;
  localTax: number;
  /** 결정세액 + 지방소득세 */
  totalTax: number;
}

/**
 * 근로소득만 있는 거주자의 연말정산 간이 계산.
 * 특별소득공제(건강·고용보험료)·특별세액공제(보험·의료·교육·기부)·월세를 받는 경우와 표준세액공제 13만 원을
 * 받는 경우를 둘 다 계산해 세금이 적은 쪽을 고른다(소득세법 제59조의4 ⑨). 원 미만은 절사한다.
 */
export function settleYearEnd(input: YearEndInput): YearEndResult {
  const salary = Math.max(0, input.salary);
  const earnedDeduction = earnedIncomeDeduction(salary);
  const earnedIncome = Math.max(0, salary - earnedDeduction);
  const card = cardDeduction(salary, input.card ?? {}, input.cardChildren ?? 0).deduction;
  const commonDeductions =
    Math.max(1, Math.floor(input.persons)) * PERSONAL_DEDUCTION_PER_PERSON + Math.max(0, input.nationalPension ?? 0) + card;

  const childCredit = childTaxCredit(input.creditChildren ?? 0);
  const pension = pensionCredit(salary, input.pensionSavings ?? 0, input.irp ?? 0);

  const run = (special: boolean) => {
    const incomeDeductions = commonDeductions + (special ? Math.max(0, input.healthEmployment ?? 0) : 0);
    const taxBase = floor(earnedIncome - incomeDeductions);
    const calculatedTax = basicIncomeTax(taxBase);
    const earnedTaxCredit = earnedIncomeTaxCredit(calculatedTax, salary);
    const ins = special ? insuranceCredit(input.insurancePremium ?? 0) : 0;
    const med = special ? medicalCredit(salary, input.medical ?? 0) : 0;
    const edu = special ? educationCredit(input.education ?? 0) : 0;
    const don = special ? donationCredit(input.donation ?? 0) : 0;
    const rent = special ? rentCredit(salary, earnedIncome, input.rent ?? 0) : 0;
    const standardCredit = special ? 0 : STANDARD_TAX_CREDIT;
    const totalCredits = earnedTaxCredit + childCredit + pension + ins + med + edu + don + rent + standardCredit;
    const finalTax = floor(calculatedTax - totalCredits);
    const localTax = floor(finalTax * LOCAL_TAX_RATE);
    return {
      earnedDeduction,
      earnedIncome,
      incomeDeductions,
      cardDeduction: card,
      taxBase,
      calculatedTax,
      earnedTaxCredit,
      childCredit,
      pensionCredit: pension,
      insuranceCredit: ins,
      medicalCredit: med,
      educationCredit: edu,
      donationCredit: don,
      rentCredit: rent,
      standardCredit,
      usedStandard: !special,
      totalCredits,
      finalTax,
      localTax,
      totalTax: finalTax + localTax,
    };
  };

  const withSpecial = run(true);
  const withStandard = run(false);
  return withStandard.totalTax < withSpecial.totalTax ? withStandard : withSpecial;
}
