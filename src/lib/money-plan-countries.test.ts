import assert from "node:assert/strict";
import { test } from "node:test";
import {
  allocate,
  buildPlans,
  COUNTRY_MONEY,
  minimumIncomeFor,
  minimumPay,
  monthsToTarget,
  PLAN_COUNTRIES,
  wageRatio,
} from "./money-plan-countries.ts";

test("minimum wage: full-time monthly matches each country's published figure", () => {
  assert.equal(minimumPay("kr", 40).monthly, 2_156_880); // 10,320 × 209h
  assert.equal(Math.round(minimumPay("kr", 40).monthlyHours), 209);
  assert.equal(minimumPay("fr", 35).monthly, 1_867.02); // 12,31 × 151,67
  assert.equal(minimumPay("es", 40).monthly, 1_221);
  assert.equal(minimumPay("es", 40).annual, 17_094); // 14 pagas
  assert.equal(minimumPay("es", 40).monthlyAvg, 1_424.5); // 12개월로 나눈 값
  assert.equal(minimumPay("kr", 40).monthlyAvg, 2_156_880);
  assert.equal(minimumPay("cn", 40).monthly, 2_740);
  assert.equal(minimumPay("jp", 40).monthly, Math.round(1_177 * 40 * (52 / 12) * 100) / 100);
});

test("minimum wage: part-time is prorated, and KR adds 주휴 only from 15 hours a week", () => {
  // 주 20시간: (20 + 4) × 365/7/12
  const kr20 = minimumPay("kr", 20);
  assert.equal(Math.round(kr20.monthlyHours), 104);
  const kr14 = minimumPay("kr", 14);
  assert.ok(Math.abs(kr14.monthlyHours - 14 * (365 / 7 / 12)) < 1e-9);
  assert.equal(minimumPay("es", 20).monthly, 610.5);
  assert.equal(minimumPay("cn", 20).monthly, Math.round(25 * 20 * (52 / 12) * 100) / 100);
});

test("wage ratio flags pay under the minimum", () => {
  assert.ok(wageRatio("kr", 10_000) < 1);
  assert.equal(wageRatio("jp", 1_177), 1);
});

test("minimum income references: KR 생계급여 32%, FR RSA, ES IMV, CN 低保, JP none", () => {
  assert.equal(minimumIncomeFor("kr", 1), 820_556);
  assert.equal(minimumIncomeFor("kr", 4), 2_078_316);
  assert.equal(minimumIncomeFor("fr", 1), 651.69);
  assert.equal(minimumIncomeFor("es", 2), 953.68);
  assert.equal(minimumIncomeFor("cn", 3), 5_070);
  assert.equal(minimumIncomeFor("jp", 1), null);
  // 5명 이상은 마지막 칸 간격만큼 늘린다
  assert.equal(minimumIncomeFor("cn", 5), 8_450);
});

test("monthsToTarget: zero rate is simple division, a return shortens it, unreachable is null", () => {
  assert.equal(monthsToTarget(0, 100_000, 0, 1_000_000), 10);
  assert.equal(monthsToTarget(2_000_000, 0, 0, 1_000_000), 0);
  assert.ok(monthsToTarget(0, 100_000, 0.06, 10_000_000)! < 100);
  assert.equal(monthsToTarget(0, 0, 0, 1), null);
});

test("allocate fills accounts in order up to their caps and skips age-gated ones", () => {
  const young = allocate("kr", 29, 1_500_000, 3_000_000);
  assert.deepEqual(young.map((a) => [a.accountId, a.monthly]), [
    ["kr-youth", 500_000],
    ["kr-pension", 500_000],
    ["kr-irp", 250_000],
    ["kr-isa", 250_000],
  ]);
  const older = allocate("kr", 40, 600_000, 3_000_000);
  assert.deepEqual(older.map((a) => a.accountId), ["kr-pension", "kr-irp"]);
  // FR PER cap = 10% of net
  assert.equal(allocate("fr", 30, 500, 2_000)[0].monthly, 200);
});

test("buildPlans: current plan uses actual spending; A/B/C split the take-home pay", () => {
  const plans = buildPlans({ country: "kr", age: 30, netMonthly: 3_000_000, needs: 1_200_000, wants: 600_000, currentSavings: 0, annualReturn: 0 });
  assert.deepEqual(plans.map((p) => p.id), ["current", "stable", "balanced", "aggressive"]);
  assert.equal(plans[0].save, 1_200_000);
  assert.equal(plans[1].save, 600_000); // 20%
  assert.equal(plans[2].save, 900_000); // 30%
  assert.equal(plans[3].save, 1_350_000); // 45%
  assert.equal(plans[0].emergencyTarget, 10_800_000); // (120만 + 60만) × 6개월
  assert.equal(plans[0].emergencyMonths, 9);
  assert.deepEqual(plans[1].milestones, [2, 17, 84]); // 60만/월, 수익률 0
});

test("buildPlans: when essentials exceed the plan's share, savings shrink and the plan says so", () => {
  const plans = buildPlans({ country: "jp", age: 30, netMonthly: 200_000, needs: 150_000, wants: 30_000, currentSavings: 0, annualReturn: 0 });
  const stable = plans.find((p) => p.id === "stable")!;
  assert.equal(stable.squeezed, true);
  assert.equal(stable.needs, 150_000);
  assert.equal(stable.wants + stable.save, 50_000);
  assert.ok(stable.save > 0);
});

test("every country has three ascending seed targets and at least one catch-all account", () => {
  for (const c of PLAN_COUNTRIES) {
    const m = COUNTRY_MONEY[c];
    assert.ok(m.seedTargets[0] < m.seedTargets[1] && m.seedTargets[1] < m.seedTargets[2], c);
    const last = m.accounts[m.accounts.length - 1];
    assert.equal(last.monthlyCap, undefined, c);
    assert.equal(last.capShareOfIncome, undefined, c);
  }
});

import { COUNTRY_NOTES } from "./money-plan-notes.ts";

test("every account in every country has a note in ko, en and the native language", () => {
  const native = { kr: "ko", jp: "ja", cn: "zh", fr: "fr", es: "es" } as const;
  for (const c of PLAN_COUNTRIES) {
    const notes = COUNTRY_NOTES[c];
    for (const a of COUNTRY_MONEY[c].accounts) {
      const n = notes.accounts[a.id];
      assert.ok(n, `${c} ${a.id}`);
      assert.ok(n.ko && n.en && n[native[c]], `${c} ${a.id} languages`);
    }
    assert.equal(notes.minimumIncome === null, COUNTRY_MONEY[c].minimumIncome === null, `${c} minimum income note`);
  }
});
