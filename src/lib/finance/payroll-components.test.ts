import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { EMPLOYER_EMPLOYMENT_STABILITY, RATES, pensionBaseLimits, ratePct } from '../kr-payroll-2026.ts';
import {
  computeEmployerInsurance,
  computePensionContribution,
  computeSalaryBreakdown,
  computeSalaryBreakdownWon,
} from './salary-calculator.ts';

// 급여·인건비 컴포넌트(mdx/SalaryCalculator, tools/SalaryNegotiationCalculator, calculators/LaborCostCalculator,
// tools/CashFlowManager 등)가 쓰는 공용 함수의 손 검산 벡터. 기준: 2026-10-17, 2026년 요율.

test('원 단위 버전은 만원 단위 버전과 같은 결과를 낸다', () => {
  assert.deepEqual(computeSalaryBreakdownWon(4_000_000, 1, 200_000), computeSalaryBreakdown(400, 1, 20));
});

test('연봉 5,000만 원(협상 계산기 기본값) 월 급여 공제', () => {
  const r = computeSalaryBreakdownWon(Math.round(50_000_000 / 12), 1, 0);
  assert.equal(r.gross, 4_166_667);
  assert.equal(r.pension, 197_880); // 기준소득월액 4,166,000 × 4.75% = 197,885 → 197,880
  assert.equal(r.health, 149_790); // 4,166,667 × 3.595% = 149,791.7 → 149,790
  assert.equal(r.ltc, 19_680); // 149,790 × 13.14% = 19,682.4 → 19,680
  assert.equal(r.employment, 37_500); // 4,166,667 × 0.9% = 37,500.0 → 37,500
  assert.equal(r.net, r.gross - r.totalDed);
  assert.ok(r.incomeTax > 0 && r.incomeTax < 300_000);
});

test('사업주 부담: 월 300만·비과세 식대 20만·150인 미만·산재 1.5% 가정', () => {
  const e = computeEmployerInsurance(2_800_000, { stabilityRate: EMPLOYER_EMPLOYMENT_STABILITY.under150, workCompRate: 0.015 });
  assert.equal(e.pension, 133_000); // 2,800,000 × 4.75%
  assert.equal(e.health, 100_660); // 2,800,000 × 3.595%
  assert.equal(e.ltc, 13_220); // 100,660 × 13.14% = 13,226.7 → 13,220
  assert.equal(e.employment, 32_200); // 2,800,000 × (0.9% + 0.25%)
  assert.equal(e.workComp, 42_000);
  assert.equal(e.total, 321_080);
});

test('국민연금 근로자분: 상한·하한·0원', () => {
  assert.equal(computePensionContribution(0), 0);
  assert.equal(computePensionContribution(100_000), 19_470); // 하한 41만 × 4.75%
  assert.equal(computePensionContribution(20_000_000), 313_020); // 상한 659만 × 4.75% = 313,025 → 313,020
  assert.equal(pensionBaseLimits().max, 6_590_000);
});

test('화면 라벨은 SSOT 요율에서 만든다', () => {
  assert.equal(ratePct(RATES.pensionEmployee), '4.75%');
  assert.equal(ratePct(RATES.healthEmployee), '3.595%');
  assert.equal(ratePct(RATES.longTermCareOfHealth), '13.14%');
  assert.equal(ratePct(RATES.employmentEmployee + EMPLOYER_EMPLOYMENT_STABILITY.under150), '1.15%');
});

// 2024~2025년 4대보험 요율 숫자가 컴포넌트에 다시 하드코딩되지 않게 막는다.
// (자동차세 연납 공제 ≈4.57%처럼 다른 제도의 숫자는 이 목록에 넣지 않는다.)
const LEGACY = [/\b0\.045\b(?!\d)/, /0\.03545/, /0\.1295/, /0\.1281/, /\b3\.545%/, /\b12\.95%/, /\b12\.81%/, /0\.4591/, /\b265_500\b/, /\b277_650\b/, /\b6_170_000\b/];
const PAYROLL_FILES = [
  'src/components/mdx/SalaryCalculator.tsx',
  'src/components/mdx/PensionCalculator.tsx',
  'src/components/mdx/FreelancerTaxCalculator.tsx',
  'src/components/tools/SalaryCalculator.tsx',
  'src/components/tools/SalaryNegotiationCalculator.tsx',
  'src/components/tools/CashFlowManager.tsx',
  'src/components/calculators/LaborCostCalculator.tsx',
  'src/components/tests/SalaryCalculator.tsx',
];

// 4대보험과 무관한 같은 숫자: 자동차세 1월 연납 공제(연세액의 약 4.57%).
const NOT_PAYROLL = new Set(['src/components/tools/AutoTaxCalculator.tsx']);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|astro)$/.test(name)) out.push(p);
  }
  return out;
}

test('급여 컴포넌트는 kr-payroll-2026 SSOT를 import한다', () => {
  for (const f of PAYROLL_FILES) {
    const src = readFileSync(f, 'utf8');
    assert.match(src, /lib\/(kr-payroll-2026|finance\/salary-calculator)['"]/, `${f}가 SSOT를 import하지 않음`);
  }
});

test('src/components에 2024~2025 4대보험 요율 리터럴이 없다', () => {
  const hits: string[] = [];
  for (const f of walk('src/components')) {
    if (NOT_PAYROLL.has(f)) continue;
    const lines = readFileSync(f, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (LEGACY.some((re) => re.test(line))) hits.push(`${f}:${i + 1}: ${line.trim()}`);
    });
  }
  assert.deepEqual(hits, []);
});
