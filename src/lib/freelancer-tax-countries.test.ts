import assert from "node:assert/strict";
import { test } from "node:test";
import { chinaFreelance, chinaLabourWithholding, franceMicro, japanFreelance, jpEnterpriseTax, jpFeeWithholding, spainAutonomo, spainAutonomoQuota } from "./freelancer-tax-countries.ts";

test("Japan 個人事業主: 所得税・住民税・個人事業税 (290万円控除, 5%)", () => {
  const r = japanFreelance({ revenue: 8_000_000, expenses: 2_000_000, blueDeduction: 650_000, healthInsurance: 600_000, pension: 215_040, otherDeductions: 0, spouse: false, dependents: 0, enterpriseRate: 0.05, withheld: 300_000 });
  assert.equal(r.businessIncome, 5_350_000);
  assert.equal(r.taxable, 3_864_000);
  assert.equal(r.incomeTax, 352_500);
  assert.equal(r.residentTax, 412_900);
  assert.equal(r.enterpriseTax, 155_000);
  assert.equal(r.balance, 52_500);
  assert.equal(r.takeHome, 4_264_560);
});

test("Japan 個人事業税は青色控除前の所得から290万円を引く; 報酬の源泉徴収 10.21%/20.42%", () => {
  assert.equal(jpEnterpriseTax(2_900_000, 0.05), 0);
  assert.equal(jpEnterpriseTax(3_900_000, 0.03), 30_000);
  assert.equal(jpFeeWithholding(100_000), 10_210);
  assert.equal(jpFeeWithholding(1_500_000), 204_200);
});

test("China 经营所得: 5%–35%, 个体工商户200万元以下部分减半", () => {
  const r = chinaFreelance({ revenue: 500_000, costs: 200_000, hasComprehensive: false, socialInsurance: 20_000, specialAdditional: 0, other: 0, selfEmployedHalf: true, prepaid: 0 });
  assert.equal(r.taxable, 220_000);
  assert.equal(r.tax, 33_500);
  assert.equal(r.due, 16_750);
  // 税务总局公告2023年第5号 例3 (不考虑残疾人减免): 2,400,000 → (2,000,000×35% − 65,500) × 50%
  const big = chinaFreelance({ revenue: 2_400_000, costs: 0, hasComprehensive: true, socialInsurance: 0, specialAdditional: 0, other: 0, selfEmployedHalf: true, prepaid: 0 });
  assert.equal(big.relief, 317_250);
});

test("China 劳务报酬 预扣: 800元/20% 减除, 20%/30%/40%", () => {
  assert.equal(chinaLabourWithholding(3_000).withheld, 440);
  assert.equal(chinaLabourWithholding(30_000).withheld, 5_200);
  assert.equal(chinaLabourWithholding(100_000).withheld, 25_000);
});

test("France micro-BNC 2026: 25,6 % + CFP 0,2 %, barème ou versement libératoire 2,2 %", () => {
  const base = { turnover: 50_000, activity: "bnc" as const, acre: 0, versementLiberatoire: false, otherHouseholdNet: 0, couple: false, children: 0 };
  const r = franceMicro(base);
  assert.equal(r.social, 12_800);
  assert.equal(r.cfp, 100);
  assert.equal(r.taxableMicro, 33_000);
  assert.equal(r.incomeTax, 3_004);
  assert.equal(franceMicro({ ...base, versementLiberatoire: true }).incomeTax, 1_100);
  assert.equal(franceMicro({ ...base, acre: 0.5 }).social, 6_400);
});

test("Spain autónomo: tramo por rendimiento mensual (−7 %), cuota 31,5 %, IRPF con 5 % de difícil justificación", () => {
  assert.equal(spainAutonomoQuota(8_000, 0, false).tramo, 1);
  assert.equal(spainAutonomoQuota(8_000, 0, true).monthly, 80);
  const r = spainAutonomo({ income: 40_000, expenses: 10_000, tarifaPlana: false, withholdingRate: 0.15, children: 0, over65: false });
  assert.equal(r.quota.tramo, 9);
  assert.equal(r.quota.monthly, 401.47);
  assert.equal(r.hardToJustify, 1_259.12);
  assert.equal(r.cuota, 4_287.97);
  assert.equal(r.result, -1_712.03);
  assert.equal(spainAutonomo({ income: 200_000, expenses: 0, tarifaPlana: false, withholdingRate: 0, children: 0, over65: false }).hardToJustify, 2_000);
});
