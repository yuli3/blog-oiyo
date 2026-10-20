import assert from "node:assert/strict";
import { test } from "node:test";
import {
  chinaPensionSaving,
  chinaPlan,
  francePerExit,
  francePerSaving,
  frPerCeilingSalarie,
  frPerCeilingTns,
  japanIdecoSaving,
  japanPlan,
  jpIdecoMonthlyLimit,
  jpLumpSumTax,
  jpRetirementDeduction,
  spainPensionLimit,
  spainPensionRescue,
  spainPensionSaving,
} from "./pension-countries.ts";

test("Japan iDeCo 拠出限度額: 令和8年11月分まで / 12月分から", () => {
  assert.equal(jpIdecoMonthlyLimit("first", "current"), 68_000);
  assert.equal(jpIdecoMonthlyLimit("first", "reform", 10_000), 65_000);
  assert.equal(jpIdecoMonthlyLimit("employee", "current"), 23_000);
  assert.equal(jpIdecoMonthlyLimit("employee", "reform"), 62_000);
  assert.equal(jpIdecoMonthlyLimit("employee-corp", "current", 40_000), 15_000);
  assert.equal(jpIdecoMonthlyLimit("employee-corp", "reform", 30_000), 32_000);
  // 5,000円に満たない枠は拠出できない
  assert.equal(jpIdecoMonthlyLimit("employee-corp", "reform", 58_000), 0);
  assert.equal(jpIdecoMonthlyLimit("third", "reform"), 23_000);
});

test("Japan iDeCo 所得控除: 所得税10%×102.1% + 住民税10%", () => {
  const r = japanIdecoSaving({ salary: 6_000_000, otherIncome: 0, socialInsurance: 900_000, spouse: false, dependents: 0, annualContribution: 276_000 });
  assert.equal(r.before.taxable, 2_420_000);
  assert.equal(r.incomeTax, 28_200);
  assert.equal(r.residentTax, 27_600);
});

test("Japan iDeCo 一時金: 退職所得控除と1/2課税", () => {
  assert.equal(jpRetirementDeduction(1), 800_000);
  assert.equal(jpRetirementDeduction(20), 8_000_000);
  assert.equal(jpRetirementDeduction(25), 11_500_000);
  const r = jpLumpSumTax(20_000_000, 25);
  assert.equal(r.taxable, 4_250_000);
  assert.equal(r.incomeTax, 431_372);
  assert.equal(r.residentTax, 425_000);
});

test("Japan 積立配分: iDeCo → NISA (生涯1,800万円) → 課税口座", () => {
  const r = japanPlan({ monthlyBudget: 400_000, idecoMonthlyLimit: 62_000, years: 10, annualReturn: 0, nisaUsed: 0 });
  assert.equal(r.nisaMonthly, 300_000);
  assert.equal(r.paid.nisa, 18_000_000);
  assert.equal(r.paid.taxable, 22_560_000);
  assert.equal(r.lumpSum.taxable, 1_720_000);
});

test("China 个人养老金: 12,000元扣除, 领取3%", () => {
  const r = chinaPensionSaving({ income: 240_000, socialInsurance: 30_000, specialAdditional: 24_000, otherDeductions: 0, contribution: 20_000 });
  assert.equal(r.deduction, 12_000);
  assert.equal(r.before, 10_080);
  assert.equal(r.saving, 1_200);
  assert.equal(r.marginal, 0.1);
  const p = chinaPlan({ income: 240_000, socialInsurance: 30_000, specialAdditional: 24_000, otherDeductions: 0, contribution: 12_000, years: 10, annualReturn: 0 });
  assert.equal(p.withdrawalTax, 3_600);
  assert.equal(p.net, 8_400);
  // 不需要缴税的人: 没有节税, 只有领取时的3%
  assert.equal(chinaPensionSaving({ income: 70_000, socialInsurance: 10_000, specialAdditional: 0, otherDeductions: 0, contribution: 12_000 }).saving, 0);
});

test("France PER: plafond 2026 salarié et TNS", () => {
  assert.equal(frPerCeilingSalarie(50_000), 5_000);
  assert.equal(frPerCeilingSalarie(10_000), 4_710);
  assert.equal(frPerCeilingSalarie(500_000), 37_680);
  assert.equal(frPerCeilingSalarie(50_000, 1_000), 4_000);
  assert.equal(frPerCeilingTns(120_000), 22_791);
  assert.equal(frPerCeilingTns(1_000_000), 88_911);
  assert.equal(frPerCeilingTns(10_000), 4_806);
});

test("France PER: économie = versement × TMI, sortie en capital au barème + 31,4 %", () => {
  const r = francePerSaving({ revenu: 45_000, couple: false, children: 0, versement: 5_000, plafond: 4_500 });
  assert.equal(r.tmi, 0.3);
  assert.equal(r.saving, 1_350);
  assert.equal(r.excess, 500);
  const e = francePerExit({ deducted: 50_000, notDeducted: 0, gains: 20_000, retirementIncome: 25_000, couple: false, spreadYears: 1 });
  assert.equal(e.principalTax, 14_360);
  assert.equal(e.gainsIr + e.gainsSocial, 6_280);
});

test("Spain plan de pensiones: límites y coeficientes del plan de empleo", () => {
  const r = spainPensionLimit({ individual: 1_500, employer: 1_000, workerEmployment: 2_000, workIncomeOver60k: false, autonomo: 0, netIncome: 40_000 });
  assert.equal(r.workerCap, 1_375);
  assert.equal(r.reduction, 3_875);
  assert.equal(r.excess, 625);
  const a = spainPensionLimit({ individual: 1_500, employer: 0, workerEmployment: 0, workIncomeOver60k: false, autonomo: 5_000, netIncome: 10_000 });
  assert.equal(a.absolute, 5_750);
  assert.equal(a.reduction, 3_000); // 30 % de los rendimientos netos
  assert.equal(spainPensionLimit({ individual: 0, employer: 12_000, workerEmployment: 0, workIncomeOver60k: true, autonomo: 0, netIncome: 80_000 }).reduction, 8_500);
});

test("Spain: ahorro de IRPF al tipo marginal y rescate como rendimiento del trabajo", () => {
  const r = spainPensionSaving({ grossSalary: 40_000, socialSecurity: 2_600, employer: 0, children: 0, over65: false, reduction: 1_500 });
  assert.equal(r.base, 35_400);
  assert.equal(r.saving, 464);
  const lump = spainPensionRescue({ amount: 30_000, pre2007: 10_000, otherBase: 18_000, over65: true, spreadYears: 1 });
  assert.equal(lump.reduction, 4_000);
  assert.equal(lump.tax, 8_284);
  assert.equal(spainPensionRescue({ amount: 30_000, pre2007: 10_000, otherBase: 18_000, over65: true, spreadYears: 3 }).reduction, 0);
});
