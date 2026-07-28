import assert from 'node:assert/strict';
import test from 'node:test';
import { computeIncomeTax, computeSalaryBreakdown } from './salary-calculator.ts';

test('computeIncomeTax applies the lowest bracket and per-dependent basic deduction', () => {
  // 300만원/month taxable => 36,000,000 annual, falls in the 14,000,000~50,000,000 bracket.
  const tax1dependent = computeIncomeTax(3000000, 1);
  const tax3dependents = computeIncomeTax(3000000, 3);
  assert.ok(tax1dependent > 0);
  assert.ok(tax3dependents < tax1dependent, 'more dependents must not increase tax');
});

test('computeIncomeTax never goes negative even with many dependents', () => {
  assert.equal(computeIncomeTax(500000, 20), 0);
});

test('computeSalaryBreakdown matches the documented component formula for a known input', () => {
  const result = computeSalaryBreakdown(300, 1, 10);
  const grossKRW = 3000000;
  assert.equal(result.gross, grossKRW);
  assert.equal(result.pension, Math.round(grossKRW * 0.045));
  assert.equal(result.health, Math.round(grossKRW * 0.03545));
  assert.equal(result.ltc, Math.round(result.health * 0.1281));
  assert.equal(result.employment, Math.round(grossKRW * 0.009));
  assert.equal(result.localTax, Math.round(result.incomeTax * 0.1));
  assert.equal(result.totalDed, result.pension + result.health + result.ltc + result.employment + result.incomeTax + result.localTax);
  assert.equal(result.net, result.gross - result.totalDed);
});

test('computeSalaryBreakdown is deterministic across repeated calls', () => {
  const a = computeSalaryBreakdown(450, 2, 15);
  const b = computeSalaryBreakdown(450, 2, 15);
  assert.deepEqual(a, b);
});

test('computeSalaryBreakdown effectiveRate reflects total deductions over gross', () => {
  const result = computeSalaryBreakdown(300, 1, 10);
  const expected = ((result.totalDed / result.gross) * 100).toFixed(1);
  assert.equal(result.effectiveRate, expected);
});
