// 월급 실수령액 추정: 4대 보험 근로자 부담분 + 근로소득세 연간 추정액 ÷ 12.
// 요율·세율·공제는 전부 src/lib/kr-payroll-2026.ts(SSOT)에서 가져온다. 여기서 숫자를 새로 적지 않는다.
// 소득세는 국세청 근로소득 간이세액표가 아니라 연말정산 구조(근로소득공제 → 인적공제·보험료공제 →
// 기본세율 → 근로소득세액공제)로 계산한 추정값이다. 화면에서도 '추정'으로 표시한다(2026-10-17 감사 S-5).

import {
  RATES,
  PERSONAL_DEDUCTION_PER_PERSON,
  basicIncomeTax,
  earnedIncomeDeduction,
  earnedIncomeTaxCredit,
  floor10,
  pensionBaseLimits,
} from "../kr-payroll-2026.ts";

export interface SalaryBreakdown {
  gross: number;
  taxablePay: number;
  pension: number;
  health: number;
  ltc: number;
  employment: number;
  /** 근로소득세 월 추정액(간이세액표 아님) */
  incomeTax: number;
  localTax: number;
  totalDed: number;
  net: number;
  effectiveRate: string;
  /** 연간 추정 계산의 중간값(설명용) */
  annual: {
    totalPay: number;
    earnedIncomeDeduction: number;
    personalDeduction: number;
    insuranceDeduction: number;
    taxBase: number;
    calculatedTax: number;
    taxCredit: number;
    determinedTax: number;
  };
}

export interface MonthlyInsurance {
  pension: number;
  health: number;
  ltc: number;
  employment: number;
}

/** 월 과세 보수(비과세 제외)에 대한 근로자 부담 4대 보험료. 10원 미만 절사. */
export function computeMonthlyInsurance(monthlyTaxable: number, onDate?: string): MonthlyInsurance {
  const pay = Math.max(0, monthlyTaxable);
  const { min, max } = pensionBaseLimits(onDate);
  // 기준소득월액은 1천 원 미만을 버린 뒤 상·하한을 적용한다.
  const pensionBase = pay > 0 ? Math.min(max, Math.max(min, Math.floor(pay / 1000) * 1000)) : 0;
  const pension = floor10(pensionBase * RATES.pensionEmployee);
  const health = floor10(pay * RATES.healthEmployee);
  const ltc = floor10(health * RATES.longTermCareOfHealth);
  const employment = floor10(pay * RATES.employmentEmployee);
  return { pension, health, ltc, employment };
}

/**
 * 근로소득세 월 추정액. dependents는 본인 포함 기본공제 인원.
 * 연간 총급여 = 월 과세 보수 × 12, 보험료는 전액 소득공제(연금보험료공제·특별소득공제)로 본다.
 */
export function computeIncomeTax(monthlyTaxable: number, dependents: number, insurance?: MonthlyInsurance) {
  const ins = insurance ?? computeMonthlyInsurance(monthlyTaxable);
  const totalPay = Math.max(0, monthlyTaxable) * 12;
  const eid = earnedIncomeDeduction(totalPay);
  const personalDeduction = Math.max(1, Math.floor(dependents)) * PERSONAL_DEDUCTION_PER_PERSON;
  const insuranceDeduction = (ins.pension + ins.health + ins.ltc + ins.employment) * 12;
  const taxBase = Math.max(0, totalPay - eid - personalDeduction - insuranceDeduction);
  const calculatedTax = basicIncomeTax(taxBase);
  const taxCredit = earnedIncomeTaxCredit(calculatedTax, totalPay);
  const determinedTax = Math.max(0, calculatedTax - taxCredit);
  return {
    monthly: floor10(determinedTax / 12),
    annual: { totalPay, earnedIncomeDeduction: eid, personalDeduction, insuranceDeduction, taxBase, calculatedTax, taxCredit, determinedTax },
  };
}

/** grossManwon/nonTaxableManwon are in units of 10,000 KRW (만원), matching the UI sliders. */
export function computeSalaryBreakdown(grossManwon: number, dependents: number, nonTaxableManwon: number): SalaryBreakdown {
  const gross = Math.max(0, grossManwon) * 10000;
  const nonTaxable = Math.min(gross, Math.max(0, nonTaxableManwon) * 10000);
  const taxablePay = gross - nonTaxable;

  const ins = computeMonthlyInsurance(taxablePay);
  const tax = computeIncomeTax(taxablePay, dependents, ins);
  const incomeTax = tax.monthly;
  const localTax = floor10(incomeTax * 0.1);

  const totalDed = ins.pension + ins.health + ins.ltc + ins.employment + incomeTax + localTax;
  const net = gross - totalDed;
  const effectiveRate = gross > 0 ? ((totalDed / gross) * 100).toFixed(1) : "0.0";

  return { gross, taxablePay, ...ins, incomeTax, localTax, totalDed, net, effectiveRate, annual: tax.annual };
}
