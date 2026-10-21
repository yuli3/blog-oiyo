import assert from 'node:assert/strict';
import test from 'node:test';
import { compareIsaTax } from './isa-tax-comparison.ts';

test('ordinary ISA compares confirmed taxable profit and deductible loss, not investment performance', () => {
  const result = compareIsaTax({ type: 'normal', taxableProfit: '7000000', deductibleLoss: '1500000' });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  // 7m at 15.4%=1,078,000; ISA: (7m-1.5m-2m) at 9.9%=346,500.
  assert.equal(result.normalAccountTax, 1078000);
  assert.equal(result.isaTax, 346500);
  assert.equal(result.taxSaved, 731500);
  assert.equal(result.taxFreeLimit, 2000000);
});

test('invalid or unsafe amounts are rejected instead of silently becoming zero', () => {
  for (const value of ['', ' ', '-1', 'Infinity', 'NaN', '9007199254740992', '1.5', '1e3', '0x10']) {
    assert.equal(compareIsaTax({ type: 'normal', taxableProfit: value, deductibleLoss: '0' }).ok, false, value);
    assert.equal(compareIsaTax({ type: 'normal', taxableProfit: '0', deductibleLoss: value }).ok, false, value);
  }
});

test('eligible limit, exact threshold, and loss exceeding profit retain their meaning', () => {
  for (const [type, profit, loss, tax, afterTax] of [
    ['eligible', '7000000', '1500000', 148500, 5351500],
    ['normal', '2000000', '0', 0, 2000000],
    ['eligible', '4000000', '0', 0, 4000000],
    ['normal', '1000000', '1500000', 0, -500000],
    ['normal', '0', '0', 0, 0],
  ] as const) {
    const result = compareIsaTax({ type, taxableProfit: profit, deductibleLoss: loss });
    assert.equal(result.ok, true);
    if (!result.ok) continue;
    assert.equal(result.isaTax, tax);
    assert.equal(result.isaNetProfit, afterTax);
  }
});
