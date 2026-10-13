import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyYouthSavings, parseSavingsText, YOUTH_SAVINGS, youthFutureSavings } from "./kr-youth-savings-2026.ts";

test("pins the 2026 product terms so a change is a deliberate edit", () => {
  assert.equal(YOUTH_SAVINGS.monthlyMax, 500_000);
  assert.equal(YOUTH_SAVINGS.months, 36);
  assert.equal(YOUTH_SAVINGS.baseRate, 0.05);
  assert.equal(YOUTH_SAVINGS.contributionGeneral, 0.06);
  assert.equal(YOUTH_SAVINGS.contributionPreferred, 0.12);
});

test("full deposit at the base rate, general type", () => {
  const r = youthFutureSavings({ monthly: 500_000, annualRate: 0.05, kind: "general" });
  assert.equal(r.principal, 18_000_000);
  // 50만 원 × 5% × (36 × 37 ÷ 2) ÷ 12
  assert.equal(r.interest, 1_387_500);
  assert.equal(r.monthlyContribution, 30_000);
  assert.equal(r.contribution, 1_080_000); // 총 108만 원 (월 최대 3만 원)
  assert.equal(r.total, 20_467_500);
  assert.equal(r.taxSaved, 213_675);
});

test("preferred type doubles the contribution to 216만 원", () => {
  const r = youthFutureSavings({ monthly: 500_000, annualRate: 0.08, kind: "preferred" });
  assert.equal(r.contribution, 2_160_000);
  assert.equal(r.interest, 2_220_000);
  assert.equal(r.total, 22_380_000);
});

test("tax-free-only band gets no contribution", () => {
  const r = youthFutureSavings({ monthly: 300_000, annualRate: 0.05, kind: "taxFreeOnly" });
  assert.equal(r.contribution, 0);
  assert.equal(r.principal, 10_800_000);
});

test("classifies by published income lines", () => {
  const base = { revenue: 0, household: "upTo200" as const };
  assert.equal(classifyYouthSavings({ ...base, work: "otherEmployee", pay: 45_000_000 }).kind, "general");
  assert.equal(classifyYouthSavings({ ...base, work: "otherEmployee", pay: 70_000_000 }).kind, "taxFreeOnly");
  assert.equal(classifyYouthSavings({ ...base, work: "otherEmployee", pay: 80_000_000 }).kind, "ineligible");
  assert.equal(classifyYouthSavings({ ...base, work: "smeNewHire", pay: 50_000_000 }).kind, "preferred");
  // 중소기업 재직자 우대형은 가구소득 150% 이하도 필요하다
  assert.equal(classifyYouthSavings({ ...base, work: "smeEmployee", pay: 30_000_000 }).kind, "general");
  assert.equal(classifyYouthSavings({ revenue: 0, household: "upTo150", work: "smeEmployee", pay: 30_000_000 }).kind, "preferred");
  assert.equal(classifyYouthSavings({ ...base, work: "otherEmployee", pay: 30_000_000 }).lowIncomeBonus, true);
  assert.equal(classifyYouthSavings({ pay: 0, revenue: 80_000_000, household: "upTo150", work: "smallBusiness" }).kind, "preferred");
  assert.equal(classifyYouthSavings({ pay: 0, revenue: 250_000_000, household: "upTo150", work: "smallBusiness" }).kind, "general");
  assert.equal(classifyYouthSavings({ ...base, household: "over200", work: "otherEmployee", pay: 30_000_000 }).kind, "ineligible");
});

test("reads one-line input", () => {
  assert.deepEqual(parseSavingsText("월 50만원 우대형 금리 7%"), { monthly: 500_000, annualRate: 0.07, kind: "preferred" });
  assert.deepEqual(parseSavingsText("총급여 3000만원 매달 30만원"), { monthly: 300_000, pay: 30_000_000 });
});
