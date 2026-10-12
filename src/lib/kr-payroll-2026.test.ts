import assert from "node:assert/strict";
import { test } from "node:test";
import { dailyWageTax, dailyWorkerInsurance, parseWon, parseWorkText, RATES, weeklyHolidayPay } from "./kr-payroll-2026.ts";

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
