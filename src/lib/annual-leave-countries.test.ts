import assert from "node:assert/strict";
import { test } from "node:test";
import { chinaDays, chinaUnusedPay, franceDays, franceIndemnity, japanDays, spainDays, spainPayout } from "./annual-leave-countries.ts";

test("Japan grants 10 days at 6 months and caps at 20 from 6.5 years", () => {
  assert.equal(japanDays(5), 0);
  assert.equal(japanDays(6), 10);
  assert.equal(japanDays(18), 11);
  assert.equal(japanDays(41), 12);
  assert.equal(japanDays(42), 14);
  assert.equal(japanDays(78), 20);
  assert.equal(japanDays(240), 20);
});

test("China uses cumulative working years with 1/10/20-year steps", () => {
  assert.equal(chinaDays(0.9), 0);
  assert.equal(chinaDays(1), 5);
  assert.equal(chinaDays(9.9), 5);
  assert.equal(chinaDays(10), 10);
  assert.equal(chinaDays(20), 15);
});

test("China pays 200% extra for unused days on a 21.75-day month", () => {
  const r = chinaUnusedPay(8_700, 3); // daily 400
  assert.equal(r.daily, 400);
  assert.equal(r.extra, 2_400);
  assert.equal(r.total300, 3_600);
});

test("France accrues 2.5 jours ouvrables a month, rounded up, max 30", () => {
  assert.equal(franceDays(12), 30);
  assert.equal(franceDays(5), 13); // 12.5 → 13
  assert.equal(franceDays(20), 30);
});

test("France pays the higher of the 1/10 rule and salary maintenance", () => {
  const r = franceIndemnity(2_600, 12, 10);
  assert.equal(r.tenth, 1_040); // 31,200 × 10% × 10/30
  assert.equal(r.maintenance, 1_000); // 2,600 / 26 × 10
  assert.equal(r.due, 1_040);
  assert.equal(r.method, "tenth");
});

test("Spain prorates 30 natural days and pays pending days on termination", () => {
  assert.equal(spainDays(12), 30);
  assert.equal(spainDays(6), 15);
  const r = spainPayout(36_500, 6, 5);
  assert.equal(r.pending, 10);
  assert.equal(r.payout, 1_000);
});
