import assert from 'node:assert/strict';
import test from 'node:test';
import { computeStressDsrMortgage, metroRegulatedLoanCap, rateTypeRatio, stressAddon } from './stress-dsr.ts';

test('수도권·규제지역 주담대 변동형은 스트레스 금리 3.0%를 100% 가산한다', () => {
  assert.deepEqual(stressAddon(true, 'variable', 0, 30), { stage: '3단계', baseRate: 3, ratio: 1, addon: 3 });
});

test('지방(수도권·규제지역 밖) 주담대는 2026-12-31까지 0.75%에 2단계 비율', () => {
  assert.deepEqual(stressAddon(false, 'variable', 0, 30), { stage: '2단계 유지', baseRate: 0.75, ratio: 1, addon: 0.75 });
  // 혼합형 5년/30년 = 16.7% → 2단계 60%
  assert.equal(stressAddon(false, 'mixed', 5, 30).addon, 0.45);
});

test('혼합형·주기형 3단계 비율표', () => {
  assert.equal(rateTypeRatio('mixed', 3, 30, false), 1); // 5년 미만은 변동형과 같음
  assert.equal(rateTypeRatio('mixed', 5, 30, false), 0.8); // 30% 미만
  assert.equal(rateTypeRatio('mixed', 10, 30, false), 0.6); // 33% → 30~50%
  assert.equal(rateTypeRatio('mixed', 15, 25, false), 0.4); // 60% → 50~70%
  assert.equal(rateTypeRatio('mixed', 21, 30, false), 0); // 70% 이상 미적용
  assert.equal(rateTypeRatio('periodic', 5, 30, false), 0.4);
  assert.equal(rateTypeRatio('periodic', 5, 10, false), 0.2);
  assert.equal(rateTypeRatio('periodic', 5, 30, true), 0.3);
  // 수도권 혼합형 5년/30년: 3.0% × 80% = 2.4%p
  assert.equal(stressAddon(true, 'mixed', 5, 30).addon, 2.4);
});

test('수도권·규제지역 주담대 한도 6억/4억/2억', () => {
  assert.equal(metroRegulatedLoanCap(1_500_000_000), 600_000_000);
  assert.equal(metroRegulatedLoanCap(2_000_000_000), 400_000_000);
  assert.equal(metroRegulatedLoanCap(3_000_000_000), 200_000_000);
});

test('규제지역 LTV 40%와 DSR 중 작은 값이 최종 한도', () => {
  const base = { housePrice: 800_000_000, annualIncome: 60_000_000, existingAnnualPayment: 5_000_000, interestRate: 4, maturityYears: 30, rateType: 'variable' as const, fixedYears: 0 };
  const seoul = computeStressDsrMortgage({ ...base, capitalArea: true, regulatedArea: true });
  assert.equal(seoul.ltvAmount, 320_000_000);
  assert.equal(seoul.stressedRate, 7);
  assert.ok(seoul.stressedDsrPrincipal < seoul.normalDsrPrincipal);
  assert.equal(seoul.finalMaxLoan, Math.min(320_000_000, seoul.stressedDsrPrincipal, 600_000_000));
  const local = computeStressDsrMortgage({ ...base, capitalArea: false, regulatedArea: false });
  assert.equal(local.cap, null);
  assert.equal(local.stressedRate, 4.75);
  assert.ok(local.stressedDsrPrincipal > seoul.stressedDsrPrincipal);
});

test('고가 주택은 수도권 한도가 묶는다', () => {
  const r = computeStressDsrMortgage({ housePrice: 3_000_000_000, annualIncome: 300_000_000, existingAnnualPayment: 0, interestRate: 4, maturityYears: 30, capitalArea: true, regulatedArea: true, rateType: 'variable', fixedYears: 0 });
  assert.equal(r.finalMaxLoan, 200_000_000);
  assert.equal(r.binding, 'cap');
});
