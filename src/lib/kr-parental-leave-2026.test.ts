import assert from "node:assert/strict";
import { test } from "node:test";
import { parentalLeaveBenefit, shortLeaveBenefit } from "./kr-parental-leave-2026.ts";

const amounts = (r: ReturnType<typeof parentalLeaveBenefit>) => r.rows.map((x) => x.amount / 10_000);

test("general leave steps 250 → 200 → 80% capped at 160", () => {
  const r = parentalLeaveBenefit(3_000_000, 12, "general");
  assert.deepEqual(amounts(r), [250, 250, 250, 200, 200, 200, 160, 160, 160, 160, 160, 160]);
  assert.equal(r.total, 23_100_000);
});

test("80% applies from month 7 below the cap", () => {
  const r = parentalLeaveBenefit(1_800_000, 7, "general");
  assert.equal(r.rows[6].amount, 1_440_000);
});

test("floor is 70만", () => {
  assert.equal(parentalLeaveBenefit(600_000, 1, "general").rows[0].amount, 700_000);
});

test("6+6 caps climb to 450 when both parents take 6 months", () => {
  const r = parentalLeaveBenefit(5_000_000, 6, "sixPlusSix", 6);
  assert.deepEqual(amounts(r), [250, 250, 300, 350, 400, 450]);
  assert.equal(r.total, 20_000_000);
});

test("6+6 special caps stop at the shorter parent's months", () => {
  const r = parentalLeaveBenefit(5_000_000, 6, "sixPlusSix", 3);
  assert.deepEqual(amounts(r), [250, 250, 300, 200, 200, 200]);
  assert.equal(r.specialUntil, 3);
});

test("6+6 never pays above the wage", () => {
  assert.deepEqual(amounts(parentalLeaveBenefit(2_800_000, 6, "sixPlusSix", 6)), [250, 250, 280, 280, 280, 280]);
});

test("single parents get 300 for months 1-3", () => {
  assert.deepEqual(amounts(parentalLeaveBenefit(4_000_000, 7, "singleParent")), [300, 300, 300, 200, 200, 200, 160]);
});

test("short leave is prorated over 30 days", () => {
  assert.equal(shortLeaveBenefit(2_500_000, 7), 583_333);
  assert.equal(shortLeaveBenefit(2_500_000, 14), 1_166_666);
});
