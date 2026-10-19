import assert from "node:assert/strict";
import { test } from "node:test";
import { benefitDays, dailyFloor, insuredBracket, UNEMPLOYMENT, unemploymentBenefit } from "./kr-unemployment-2026.ts";

test("pins the 2026 cap, floor inputs and the benefit-days table so a change is a deliberate edit", () => {
  assert.equal(UNEMPLOYMENT.dailyCap, 68_100);
  assert.equal(UNEMPLOYMENT.baseDailyCap, 113_500);
  assert.equal(UNEMPLOYMENT.minimumWage, 10_320);
  assert.deepEqual(UNEMPLOYMENT.daysUnder50, [120, 150, 180, 210, 240]);
  assert.deepEqual(UNEMPLOYMENT.daysOver50, [120, 180, 210, 240, 270]);
});

test("the full-time floor is 66,048원 and part-time floors scale with contracted hours", () => {
  assert.equal(dailyFloor(8), 66_048); // 10,320 × 8 × 0.8
  assert.equal(dailyFloor(10), 66_048); // hours above 8 count as 8
  assert.equal(dailyFloor(4), 33_024);
});

test("insured-period brackets are lower-inclusive", () => {
  assert.equal(insuredBracket(0.5), 0);
  assert.equal(insuredBracket(1), 1);
  assert.equal(insuredBracket(2.9), 1);
  assert.equal(insuredBracket(3), 2);
  assert.equal(insuredBracket(5), 3);
  assert.equal(insuredBracket(10), 4);
  assert.equal(benefitDays(4, false), 180);
  assert.equal(benefitDays(4, true), 210);
  assert.equal(benefitDays(12, true), 270);
});

test("a 300만 원 monthly wage is lifted to the floor", () => {
  // 900만 / 92일 = 97,826원 → ×60% = 58,695원 < 66,048원
  const r = unemploymentBenefit({ threeMonthWages: 9_000_000, threeMonthDays: 92, insuredYears: 4, over50OrDisabled: false, dailyHours: 8 });
  assert.equal(r.baseDaily, 97_826);
  assert.equal(r.rawDaily, 58_695);
  assert.equal(r.daily, 66_048);
  assert.equal(r.limitedBy, "floor");
  assert.equal(r.days, 180);
  assert.equal(r.total, 66_048 * 180);
});

test("a 500만 원 monthly wage hits the cap", () => {
  // 1,500만 / 92 = 163,043 → 기초일액 상한 113,500 → 68,100
  const r = unemploymentBenefit({ threeMonthWages: 15_000_000, threeMonthDays: 92, insuredYears: 12, over50OrDisabled: false, dailyHours: 8 });
  assert.equal(r.baseDaily, 113_500);
  assert.equal(r.daily, 68_100);
  assert.equal(r.days, 240);
  assert.equal(r.total, 16_344_000);
});

test("between floor and cap the 60% figure is paid as is", () => {
  // 340만 × 3 = 1,020만 / 91 = 112,087 → 67,252
  const r = unemploymentBenefit({ threeMonthWages: 10_200_000, threeMonthDays: 91, insuredYears: 2, over50OrDisabled: false, dailyHours: 8 });
  assert.equal(r.daily, 67_252);
  assert.equal(r.limitedBy, null);
  assert.equal(r.days, 150);
});
