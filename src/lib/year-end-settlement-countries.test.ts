import assert from "node:assert/strict";
import { test } from "node:test";
import { chinaYearEnd, franceParts, franceYearEnd, japanYearEnd, jpLifeInsuranceDeduction, spainYearEnd } from "./year-end-settlement-countries.ts";

const jp = { salary: 5_000_000, withheld: 120_000, socialInsurance: 750_000, lifePremiums: [0, 0, 0] as [number, number, number], spouse: false, dependents: 0, specificDependents: 0, housingLoanCredit: 0 };

test("Japan 年末調整: 給与所得控除 + 基礎控除104万 → 年調年税額 (×102.1%, 百円未満切捨て)", () => {
  const r = japanYearEnd(jp);
  assert.equal(r.employmentIncome, 3_560_000);
  assert.equal(r.taxable, 1_770_000);
  assert.equal(r.annualTax, 90_300);
  assert.equal(r.refund, 29_700);
  assert.equal(japanYearEnd({ ...jp, housingLoanCredit: 200_000 }).annualTax, 0);
});

test("Japan 生命保険料控除 (新制度) per category and 12万 cap", () => {
  assert.equal(jpLifeInsuranceDeduction(20_000), 20_000);
  assert.equal(jpLifeInsuranceDeduction(30_000), 25_000);
  assert.equal(jpLifeInsuranceDeduction(60_000), 35_000);
  assert.equal(jpLifeInsuranceDeduction(100_000), 40_000);
  assert.equal(japanYearEnd({ ...jp, lifePremiums: [100_000, 100_000, 100_000] }).life, 120_000);
});

test("China 年度汇算: 60,000 + 专项附加扣除, annual brackets, refund = prepaid − due", () => {
  const r = chinaYearEnd({ income: 200_000, socialInsurance: 20_000, children: 1, elderlyMonthly: 3_000, rent: "1500", mortgage: false, continuingEducation: 0, medical: 0, other: 0, prepaid: 3_000 });
  assert.equal(r.special, 78_000);
  assert.equal(r.taxable, 42_000);
  assert.equal(r.due, 1_680);
  assert.equal(r.refund, 1_320);
});

test("France: barème 2026, décote, plafonnement du quotient familial", () => {
  assert.equal(franceParts(true, 3), 4);
  const single = franceYearEnd({ netTaxable: 30_000, couple: false, children: 0, withheld: 2_000 });
  assert.equal(single.impot, 1_564);
  assert.equal(single.balance, 436);
  const family = franceYearEnd({ netTaxable: 100_000, couple: true, children: 2, withheld: 9_000 });
  assert.equal(family.parts, 3);
  assert.equal(family.capped, true);
  assert.equal(family.impot, 9_594);
});

test("Spain: escala general 2026, mínimo personal 5.550 €, cuota − retenciones", () => {
  const r = spainYearEnd({ grossSalary: 30_000, socialSecurity: 1_950, withheld: 4_000, children: 0, over65: false, pensionPlan: 0 });
  assert.equal(r.base, 26_050);
  assert.equal(r.cuota, 4_926);
  assert.equal(r.result, 926);
});
