import assert from "node:assert/strict";
import { test } from "node:test";
import { chinaComprehensive, chinaIncomeAmount, franceComprehensive, franceMicroIncome, japanFiling, jpAdjustmentCredit, spainComprehensive } from "./comprehensive-income-tax-countries.ts";

const jp = { salary: 5_000_000, businessRevenue: 3_000_000, businessExpenses: 1_000_000, blueDeduction: 650_000 as const, otherIncome: 0, socialInsurance: 750_000, otherDeductions: 0, spouse: false, dependents: 0, specificDependents: 0, prepaid: 120_000 };

test("Japan 確定申告: 給与＋事業 (青色65万), 基礎控除は合計所得で判定, 所得税×102.1%, 住民税10%", () => {
  const r = japanFiling(jp);
  assert.equal(r.employmentIncome, 3_560_000);
  assert.equal(r.businessIncome, 1_350_000);
  assert.equal(r.totalIncome, 4_910_000);
  assert.equal(r.basic, 670_000);
  assert.equal(r.taxable, 3_490_000);
  assert.equal(r.incomeTax, 276_100);
  assert.equal(r.residentTaxable, 3_730_000);
  assert.equal(r.residentTax, 375_500);
  assert.equal(r.balance, 156_100);
});

test("Japan 青色申告特別控除は事業所得が上限, 白色は控除なし", () => {
  assert.equal(japanFiling({ ...jp, businessRevenue: 1_300_000 }).blue, 300_000);
  assert.equal(japanFiling({ ...jp, blueDeduction: 0 }).businessIncome, 2_000_000);
});

test("Japan 調整控除: 200万円以下は差額と課税所得の小さい方×5%, 超は最低2,500円", () => {
  assert.equal(jpAdjustmentCredit(1_000_000, true, 1, 0), 7_500);
  assert.equal(jpAdjustmentCredit(5_000_000, true, 1, 0), 2_500);
  assert.equal(jpAdjustmentCredit(0, false, 0, 0), 0);
});

test("China 综合所得: 劳务×80%, 稿酬×56%, 减除60,000与扣除后按年度税率表", () => {
  assert.equal(chinaIncomeAmount({ wages: 0, labour: 10_000, royalties: 10_000, authorFees: 10_000 }), 21_600);
  const r = chinaComprehensive({ wages: 200_000, labour: 50_000, royalties: 0, authorFees: 10_000, socialInsurance: 20_000, specialAdditional: 36_000, other: 0, prepaid: 5_000 });
  assert.equal(r.incomeAmount, 245_600);
  assert.equal(r.taxable, 129_600);
  assert.equal(r.due, 10_440);
  assert.equal(r.balance, 5_440);
});

test("France: salaires (abattement 10 %) + micro-BNC (34 %) au barème 2026", () => {
  assert.equal(franceMicroIncome(20_000, "bnc"), 13_200);
  assert.equal(franceMicroIncome(20_000, "bic-vente"), 5_800);
  assert.equal(franceMicroIncome(200, "bic-services"), 0);
  const r = franceComprehensive({ salaries: 30_000, microTurnover: 20_000, microKind: "bnc", otherNet: 0, couple: false, children: 0, prepaid: 2_000 });
  assert.equal(r.revenu, 40_200);
  assert.equal(r.impot, 5_164);
  assert.equal(r.balance, 3_164);
});

test("Spain: base general = trabajo + actividades; sin reducción del trabajo si otras rentas > 6.500 €", () => {
  const r = spainComprehensive({ grossSalary: 30_000, socialSecurity: 1_950, activityNet: 10_000, otherGeneral: 0, children: 0, over65: false, prepaid: 4_000 });
  assert.equal(r.reduction, 0);
  assert.equal(r.base, 36_050);
  assert.equal(r.cuota, 7_985.5);
  assert.equal(r.result, 3_985.5);
  // Salary only matches the year-end calculator (26.050 € base, cuota 4.926 €).
  assert.equal(spainComprehensive({ grossSalary: 30_000, socialSecurity: 1_950, activityNet: 0, otherGeneral: 0, children: 0, over65: false, prepaid: 0 }).cuota, 4_926);
});
