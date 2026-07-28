import assert from 'node:assert/strict';
import test from 'node:test';
import { calcRatios, type YearData } from './ratio-trend.ts';

const sampleYear: YearData = {
  label: '2024',
  currentAssets: 620,
  currentLiabilities: 260,
  totalAssets: 1450,
  totalLiabilities: 550,
  equity: 900,
  operatingIncome: 130,
  netIncome: 95,
  revenue: 1100,
};

test('calcRatios returns the 8 documented ratios in a fixed order', () => {
  const results = calcRatios([sampleYear]);
  assert.deepEqual(results.map((r) => r.nameEn), [
    'Current Ratio', 'Debt Ratio', 'Equity Ratio', 'ROA', 'ROE',
    'Operating Margin', 'Net Margin', 'Asset Turnover',
  ]);
});

test('calcRatios computes current ratio as currentAssets/currentLiabilities * 100', () => {
  const [current] = calcRatios([sampleYear]);
  const expected = (sampleYear.currentAssets / sampleYear.currentLiabilities) * 100;
  assert.ok(Math.abs(current.values[0] - expected) < 1e-9);
});

test('calcRatios treats a zero denominator as 0 instead of NaN or Infinity', () => {
  const zeroDenominator: YearData = { ...sampleYear, currentLiabilities: 0, totalAssets: 0, equity: 0, revenue: 0 };
  const results = calcRatios([zeroDenominator]);
  for (const ratio of results) {
    assert.equal(ratio.values[0], 0);
  }
});

test('calcRatios preserves per-year ordering across multiple years', () => {
  const yearA: YearData = { ...sampleYear, label: '2023', netIncome: 50 };
  const yearB: YearData = { ...sampleYear, label: '2024', netIncome: 95 };
  const [, , , roa] = calcRatios([yearA, yearB]);
  assert.equal(roa.values.length, 2);
  assert.ok(roa.values[1] > roa.values[0], 'higher netIncome year must show a higher ROA');
});

test('debt ratio benchmark direction is lower-is-better', () => {
  const [, debtRatio] = calcRatios([sampleYear]);
  assert.equal(debtRatio.higherIsBetter, false);
  assert.equal(debtRatio.benchmark, 100);
});
