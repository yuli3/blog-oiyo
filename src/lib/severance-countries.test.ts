import assert from "node:assert/strict";
import { test } from "node:test";
import {
  chinaCompensation,
  chinaCompYears,
  franceIndemnity,
  japanNoticePay,
  japanRetirementDeduction,
  japanRetirementTax,
  spainIndemnity,
} from "./severance-countries.ts";

test("Japan 退職所得控除: 40万/year to 20 years, 70万 after, at least 80万", () => {
  assert.equal(japanRetirementDeduction(0.5), 800_000);
  assert.equal(japanRetirementDeduction(10), 4_000_000);
  assert.equal(japanRetirementDeduction(9.2), 4_000_000); // partial year rounds up
  assert.equal(japanRetirementDeduction(25), 11_500_000);
});

test("Japan halves the excess, except the short-term part above 300万", () => {
  const r = japanRetirementTax(20_000_000, 25);
  assert.equal(r.taxable, 4_250_000);
  assert.equal(r.incomeTax, 431_372);
  assert.equal(r.residentTax, 425_000);
  const s = japanRetirementTax(8_000_000, 3);
  assert.equal(s.shortTerm, true);
  assert.equal(s.taxable, 5_300_000);
  assert.equal(s.incomeTax, 645_782);
});

test("Japan 解雇予告手当 is 30 days of average wage less days of notice", () => {
  assert.equal(japanNoticePay(900_000, 92, 10), 195_652);
  assert.equal(japanNoticePay(900_000, 92, 30), 0);
});

test("China counts 6+ leftover months as a year and fewer as half", () => {
  assert.equal(chinaCompYears(30), 3);
  assert.equal(chinaCompYears(26), 2.5);
  assert.equal(chinaCompYears(3), 0.5);
});

test("China caps high earners at 3× local average wage and 12 years; unlawful pays double", () => {
  const r = chinaCompensation(180, 40_000, 10_000, "normal");
  assert.equal(r.capped, true);
  assert.equal(r.total, 360_000);
  assert.equal(chinaCompensation(30, 8_000, 10_000, "unlawful").total, 48_000);
  assert.equal(chinaCompensation(30, 8_000, 10_000, "noNotice").total, 32_000);
});

test("France: 8 months minimum, 1/4 month a year to 10 years, 1/3 after", () => {
  assert.equal(franceIndemnity(7, 3_000).amount, 0);
  assert.equal(franceIndemnity(12, 3_000).amount, 750);
  assert.equal(franceIndemnity(180, 3_000).amount, 12_500);
});

test("Spain: days per year on annual ÷ 365, capped in mensualidades", () => {
  const r = spainIndemnity(24, 36_500, "improcedente");
  assert.equal(r.days, 66);
  assert.equal(r.amount, 6_600);
  const c = spainIndemnity(360, 36_500, "improcedente");
  assert.equal(c.capped, true);
  assert.equal(c.amount, 73_000);
  assert.equal(spainIndemnity(12, 36_500, "objetivo").amount, 2_000);
});
