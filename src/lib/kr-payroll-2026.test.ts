import assert from "node:assert/strict";
import { test } from "node:test";
import { dailyWageTax, dailyWorkerInsurance, leaverHealthSettlement, parseLeaverText, parseWon, parseWorkText, RATES, weeklyHolidayPay } from "./kr-payroll-2026.ts";

test("pins the 2026 rates so a yearly change is a deliberate edit", () => {
  assert.equal(RATES.minimumWage, 10_320);
  assert.equal(RATES.pensionEmployee, 0.0475);
  assert.equal(RATES.healthEmployee, 0.03595);
  assert.equal(RATES.longTermCareOfHealth, 0.1314);
  assert.equal(RATES.employmentEmployee, 0.009);
});

test("weekly holiday pay follows the 15-hour line and the 40-hour cap", () => {
  const full = weeklyHolidayPay({ hourlyWage: 10_320, daysPerWeek: 5, hoursPerDay: 8 });
  assert.equal(full.holidayHours, 8);
  assert.equal(full.holidayPay, 82_560);
  assert.equal(full.monthlyPay, Math.round((40 * 10_320 + 82_560) * 365 / 7 / 12));
  // The usual 209-hour conversion rounds 48 × 4.345 = 208.6 up to 209, so the two differ by under one hour's pay.
  assert.ok(Math.abs(full.monthlyPay - 209 * 10_320) < 10_320);

  const part = weeklyHolidayPay({ hourlyWage: 10_320, daysPerWeek: 5, hoursPerDay: 4 });
  assert.equal(part.holidayHours, 4);
  assert.equal(part.holidayPay, 41_280);

  const under = weeklyHolidayPay({ hourlyWage: 10_320, daysPerWeek: 2, hoursPerDay: 7 });
  assert.equal(under.eligible, false);
  assert.equal(under.holidayPay, 0);

  const capped = weeklyHolidayPay({ hourlyWage: 10_000, daysPerWeek: 6, hoursPerDay: 8 });
  assert.equal(capped.holidayHours, 8);
  assert.equal(capped.belowMinimumWage, true);
});

test("daily worker insurance turns on at 8 days or 60 hours after one month", () => {
  const byId = (rows: ReturnType<typeof dailyWorkerInsurance>) => Object.fromEntries(rows.map((r) => [r.id, r]));
  const short = byId(dailyWorkerInsurance({ daysWorked: 7, hoursWorked: 56, monthlyPay: 700_000, overOneMonth: true }));
  assert.equal(short.pension.applies, false);
  assert.equal(short.health.applies, false);
  assert.equal(short.employment.applies, true);
  assert.equal(short.employment.employeeDeduction, 6_300);

  const eight = byId(dailyWorkerInsurance({ daysWorked: 8, hoursWorked: 40, monthlyPay: 1_000_000, overOneMonth: true }));
  assert.equal(eight.pension.applies, true);
  assert.equal(eight.pension.employeeDeduction, 47_500);
  assert.equal(eight.health.applies, true);
  // 35,950 health + 4,720 long-term care (35,950 × 13.14% = 4,723.8 → 4,720)
  assert.equal(eight.health.employeeDeduction, 35_950 + 4_720);

  const newHire = byId(dailyWorkerInsurance({ daysWorked: 10, hoursWorked: 80, monthlyPay: 1_000_000, overOneMonth: false }));
  assert.equal(newHire.health.applies, false);

  const highPay = byId(dailyWorkerInsurance({ daysWorked: 5, hoursWorked: 40, monthlyPay: 2_300_000, overOneMonth: false }));
  assert.equal(highPay.pension.applies, true);
  assert.match(highPay.pension.reason, /220만/);
});

test("daily wage tax: 150,000 deduction, 2.7% effective, under 1,000 won not withheld", () => {
  assert.deepEqual(dailyWageTax(150_000), { incomeTax: 0, localTax: 0 });
  assert.deepEqual(dailyWageTax(187_000), { incomeTax: 0, localTax: 0 }); // 999 → 소액부징수
  assert.deepEqual(dailyWageTax(200_000), { incomeTax: 1_350, localTax: 130 });
});

test("reads Korean amounts and one-line work descriptions", () => {
  assert.equal(parseWon("10,320원"), 10_320);
  assert.equal(parseWon("1만 320"), 10_320);
  assert.equal(parseWon("220만"), 2_200_000);
  assert.equal(parseWon("abc"), null);
  assert.deepEqual(parseWorkText("주 5일 하루 4시간 시급 10320원"), { hourlyWage: 10_320, daysPerWeek: 5, hoursPerDay: 4 });
  assert.deepEqual(parseWorkText("이번 달 7일 56시간 일당 12만원"), { dailyWage: 120_000, daysPerMonth: 7, hoursPerMonth: 56 });
  assert.deepEqual(parseWorkText("월급 180만원 한 달 20일"), { monthlyPay: 1_800_000, daysPerMonth: 20 });
});

test("leaver health settlement matches a published 2023 example", () => {
  // 2023 rates: health 3.545% employee, long-term care 12.81% of health.
  const r = leaverHealthSettlement({
    totalPay: 27_500_000,
    monthsWorked: 10,
    monthsCharged: 9,
    noticeMonthly: 2_500_000,
    rates: { health: 0.03545, longTermCareOfHealth: 0.1281 },
  });
  assert.equal(r.actualMonthly, 2_750_000);
  assert.equal(r.paidHealth, 88_620 * 9);
  assert.equal(r.owedHealth, 877_320);
  assert.equal(r.health, 79_740);
  assert.equal(r.care, 10_170);
});

test("leaver settlement reproduces the office note and runs on 2026 rates", () => {
  // Note: (5,000,000 − 4,500,000) × 6 × 3.545% = 106,350; per-month 10-won flooring moves it by a few won.
  const note = leaverHealthSettlement({ totalPay: 30_000_000, monthsWorked: 6, monthsCharged: 6, noticeMonthly: 4_500_000, rates: { health: 0.03545, longTermCareOfHealth: 0 } });
  assert.ok(Math.abs(note.health - 106_350) <= 60);

  const now = leaverHealthSettlement({ totalPay: 30_000_000, monthsWorked: 6, monthsCharged: 6, noticeMonthly: 4_500_000 });
  assert.equal(now.health, (179_750 - 161_770) * 6); // 5,000,000 × 3.595% vs 4,500,000 × 3.595% (10-won floor)
  assert.equal(now.care, (floor10(179_750 * 0.1314) - floor10(161_770 * 0.1314)) * 6);

  const refund = leaverHealthSettlement({ totalPay: 24_000_000, monthsWorked: 6, monthsCharged: 6, noticeMonthly: 4_500_000 });
  assert.ok(refund.total < 0);

  assert.deepEqual(parseLeaverText("올해 총급여 3000만원 6개월 근무 기준 보수월액 450만원 부과 5개월"), {
    totalPay: 30_000_000,
    noticeMonthly: 4_500_000,
    monthsWorked: 6,
    monthsCharged: 5,
  });
});

const floor10 = (won: number) => Math.floor(Math.round(won * 1e6) / 1e7) * 10;

import { basicIncomeTax, earnedIncomeDeduction, earnedIncomeTaxCredit, pensionBaseLimits } from "./kr-payroll-2026.ts";

test("basic income tax uses all eight 2026 brackets including 42% and 45%", () => {
  assert.equal(basicIncomeTax(0), 0);
  assert.equal(basicIncomeTax(14_000_000), 840_000);
  assert.equal(basicIncomeTax(20_000_000), 1_740_000); // 국세청 안내 예시
  assert.equal(basicIncomeTax(50_000_000), 6_240_000);
  assert.equal(basicIncomeTax(88_000_000), 15_360_000);
  assert.equal(basicIncomeTax(150_000_000), 37_060_000);
  assert.equal(basicIncomeTax(300_000_000), 94_060_000);
  assert.equal(basicIncomeTax(500_000_000), 174_060_000);
  assert.equal(basicIncomeTax(600_000_000), 216_060_000); // 42% 구간
  assert.equal(basicIncomeTax(1_000_000_000), 384_060_000);
  assert.equal(basicIncomeTax(1_200_000_000), 474_060_000); // 45% 구간
});

test("earned income deduction follows the statutory table and the 20M cap", () => {
  assert.equal(earnedIncomeDeduction(5_000_000), 3_500_000);
  assert.equal(earnedIncomeDeduction(15_000_000), 7_500_000);
  assert.equal(earnedIncomeDeduction(50_000_000), 12_250_000);
  assert.equal(earnedIncomeDeduction(100_000_000), 14_750_000);
  assert.equal(earnedIncomeDeduction(400_000_000), 20_000_000);
});

test("earned income tax credit applies the 55%/30% rate and the pay-based limit", () => {
  assert.equal(earnedIncomeTaxCredit(1_000_000, 30_000_000), 550_000);
  assert.equal(earnedIncomeTaxCredit(3_000_000, 40_000_000), 684_000);
  assert.equal(earnedIncomeTaxCredit(3_000_000, 60_000_000), 660_000);
  assert.equal(earnedIncomeTaxCredit(20_000_000, 200_000_000), 200_000);
});

test("pension base limits switch on 2026-07-01", () => {
  assert.deepEqual(pensionBaseLimits("2026-03-01"), { min: 400_000, max: 6_370_000 });
  assert.deepEqual(pensionBaseLimits("2026-10-17"), { min: 410_000, max: 6_590_000 });
});
