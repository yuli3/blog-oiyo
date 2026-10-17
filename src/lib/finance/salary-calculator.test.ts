import assert from 'node:assert/strict';
import test from 'node:test';
import { basicIncomeTax } from '../kr-payroll-2026.ts';
import { computeIncomeTax, computeMonthlyInsurance, computeSalaryBreakdown } from './salary-calculator.ts';

// 손으로 검산한 2026 벡터(기준일 2026-10-17). 요율: 연금 4.75%, 건강 3.595%, 장기요양 13.14%, 고용 0.9%.

test('월 400만·비과세 20만·본인 1명 벡터', () => {
  const r = computeSalaryBreakdown(400, 1, 20);
  assert.equal(r.taxablePay, 3_800_000);
  assert.equal(r.pension, 180_500); // 3,800,000 × 4.75%
  assert.equal(r.health, 136_610); // 3,800,000 × 3.595%
  assert.equal(r.ltc, 17_950); // 136,610 × 13.14% = 17,950.5 → 10원 미만 절사
  assert.equal(r.employment, 34_200);
  // 총급여 4,560만 − 근로소득공제 1,203만 − 인적공제 150만 − 보험료 443만 1,120 = 과표 2,763만 8,880
  assert.equal(r.annual.earnedIncomeDeduction, 12_030_000);
  assert.equal(r.annual.taxBase, 27_638_880);
  assert.equal(r.annual.calculatedTax, 2_885_832); // 84만 + 1,363만 8,880 × 15%
  assert.equal(r.annual.taxCredit, 660_000); // 한도 max(66만, 74만 − 1,260만 × 0.008)
  assert.equal(r.incomeTax, 185_480);
  assert.equal(r.localTax, 18_540);
  assert.equal(r.net, 3_426_720);
  // 옛 계산식(공제 없이 월 과세분 × 12에 세율)은 446,250원이었다.
  assert.ok(r.incomeTax < 446_250 / 2);
});

test('국민연금은 기준소득월액 상한 659만 원에서 멈춘다', () => {
  const r = computeSalaryBreakdown(1000, 1, 20);
  assert.equal(r.pension, 313_020); // 6,590,000 × 4.75% = 313,025 → 313,020
  assert.equal(r.health, 352_310); // 상한 없이 9,800,000 × 3.595%
});

test('국민연금 하한 41만 원과 저소득 세액', () => {
  const ins = computeMonthlyInsurance(300_000);
  assert.equal(ins.pension, 19_470); // 410,000 × 4.75%
  const r = computeSalaryBreakdown(100, 1, 30);
  assert.equal(r.incomeTax, 2_750);
});

test('보험료와 세금은 비과세를 뺀 과세 보수에만 부과된다', () => {
  const a = computeSalaryBreakdown(300, 1, 0);
  const b = computeSalaryBreakdown(300, 1, 20);
  assert.ok(b.pension < a.pension && b.health < a.health && b.incomeTax < a.incomeTax);
});

test('부양가족이 늘면 세금이 줄고 음수가 되지 않는다', () => {
  const one = computeSalaryBreakdown(250, 1, 20);
  const three = computeSalaryBreakdown(250, 3, 20);
  assert.equal(three.incomeTax, 24_810);
  assert.ok(three.incomeTax < one.incomeTax);
  assert.equal(computeSalaryBreakdown(100, 6, 30).incomeTax, 0);
});

test('고소득 구간은 45% 세율까지 쓴다', () => {
  const t = computeIncomeTax(100_000_000, 1);
  assert.ok(t.annual.taxBase > 1_000_000_000);
  assert.equal(t.annual.calculatedTax, basicIncomeTax(t.annual.taxBase));
  assert.equal(t.annual.calculatedTax, 384_060_000 + Math.round((t.annual.taxBase - 1_000_000_000) * 0.45));
});

test('합계와 실효율은 항목 합과 일치하고 결정적이다', () => {
  const r = computeSalaryBreakdown(450, 2, 15);
  assert.equal(r.totalDed, r.pension + r.health + r.ltc + r.employment + r.incomeTax + r.localTax);
  assert.equal(r.net, r.gross - r.totalDed);
  assert.equal(r.effectiveRate, ((r.totalDed / r.gross) * 100).toFixed(1));
  assert.deepEqual(r, computeSalaryBreakdown(450, 2, 15));
});
