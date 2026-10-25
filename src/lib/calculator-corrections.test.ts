import assert from 'node:assert/strict';
import { test } from 'node:test';
import { weeklyHolidayPay } from './kr-payroll-2026.ts';
import { settleYearEnd } from './kr-year-end-2026.ts';
import { compareForeignExchange } from './foreign-exchange-comparison.ts';

test('weekly comparison matches deployed API without treating unknown eligibility as approval', () => {
  const input = { hourlyWage: 10320, daysPerWeek: 5, hoursPerDay: 3 };
  assert.equal(weeklyHolidayPay(input).eligibilityStatus, 'unknown');
  const confirmed = weeklyHolidayPay({ ...input, employedWholeWeek: true, completedScheduledDays: true });
  assert.equal(confirmed.holidayPay, 30960);
  assert.equal(confirmed.weeklyPay, 185760);
  assert.equal(confirmed.monthlyPay, 807127);
  assert.equal(confirmed.eligibilityStatus, 'self_confirmed');
  assert.equal(weeklyHolidayPay({ ...input, employedWholeWeek: false }).holidayPay, 0);
});
test('paid rent is not an eligibility confirmation', () => {
  const input = { salary: 48_000_000, persons: 1, irp: 3_000_000, rent: 7_800_000 };
  assert.equal(settleYearEnd(input).rentCredit, 0);
  assert.equal(settleYearEnd({ ...input, rentEligible: false }).rentCredit, 0);
  assert.equal(settleYearEnd({ ...input, rentEligible: true }).rentCredit, 1326000);
});

test('weekly fractions, caps, low input wage and invalid values remain explicit', () => {
  const input = { hourlyWage: 10321, daysPerWeek: 1, hoursPerDay: 15.5, employedWholeWeek: true, completedScheduledDays: true };
  const result = weeklyHolidayPay(input);
  assert.equal(result.holidayPay, 31995);
  assert.equal(result.weeklyPay, 191970);
  assert.equal(result.monthlyPay, 834109);
  assert.equal(weeklyHolidayPay({ ...input, daysPerWeek: 5, hoursPerDay: 8 }).holidayHours, 8);
  assert.equal(weeklyHolidayPay({ ...input, daysPerWeek: 6, hoursPerDay: 8 }).holidayHours, 8);
  assert.equal(weeklyHolidayPay({ ...input, hourlyWage: 9000 }).holidayPay, 27900);
  for (const value of [NaN, Infinity, 0, -1]) assert.throws(() => weeklyHolidayPay({ ...input, hourlyWage: value }));
  assert.throws(() => weeklyHolidayPay({ ...input, hourlyWage: 1e308 }));
});

test('rent confirmation does not bypass income limits or accept truthy non-booleans', () => {
  const input = { salary: 48_000_000, persons: 1, rent: 7_800_000 };
  assert.equal(settleYearEnd({ ...input, rentEligible: JSON.parse('"true"') }).rentCredit, 0);
  assert.equal(settleYearEnd({ ...input, rentEligible: JSON.parse('1') }).rentCredit, 0);
  assert.equal(settleYearEnd({ ...input, salary: 81_000_000, rentEligible: true }).rentCredit, 0);
});

test('DCC final offer is not charged twice and 1/100 rate units agree', () => {
  const input = { foreignAmount: 100, enteredRate: 1400, rateUnit: 1, networkPercent: 0, issuerPercent: 0, issuerBasis: 'base' as const, mode: 'offered_final' as const, offeredFinalAmount: 147000, assumedDccMarkupPercent: 5 };
  assert.deepEqual(compareForeignExchange(input), { base: 140000, networkFee: 0, issuerFee: 0, localScenario: 140000, dccScenario: 147000, delta: 7000 });
  assert.equal(compareForeignExchange({ ...input, networkPercent: 1, issuerPercent: 1 }).dccScenario, 147000);
  assert.equal(compareForeignExchange({ ...input, foreignAmount: 100, enteredRate: 14 }).base, 1400);
  assert.equal(compareForeignExchange({ ...input, foreignAmount: 100, enteredRate: 1400, rateUnit: 100 }).base, 1400);
  assert.equal(compareForeignExchange({ ...input, mode: 'assumed_markup', offeredFinalAmount: NaN }).dccScenario, 147000);
  assert.equal(compareForeignExchange({ ...input, networkPercent: 1, issuerPercent: 1, issuerBasis: 'base_plus_network' }).issuerFee, 1414);
  for (const value of [NaN, Infinity, 0, -1]) assert.throws(() => compareForeignExchange({ ...input, enteredRate: value }));
});

import { parseYearEndSalary } from './year-end-salary-input.ts';

test('year-end salary accepts won amounts without changing their meaning', () => {
  assert.equal(parseYearEndSalary('50,000,000'), 50_000_000);
  assert.equal(parseYearEndSalary('50000000'), 50_000_000);
  assert.equal(parseYearEndSalary('0'), 0);
});

test('year-end salary does not turn signs, decimals or invalid text into another amount', () => {
  for (const value of ['', '-50000000', '50e6', 'NaN', 'Infinity', '50.5', '50만원', '50,00', '999999999999999999999']) {
    assert.equal(parseYearEndSalary(value), null, value);
  }
});
