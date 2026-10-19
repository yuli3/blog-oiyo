import assert from "node:assert/strict";
import { test } from "node:test";
import {
  basicIncomeTax,
  CARD,
  cardDeduction,
  childTaxCredit,
  donationCredit,
  earnedIncomeDeduction,
  earnedIncomeTaxCredit,
  insuranceCredit,
  INCOME_TAX_BRACKETS,
  medicalCredit,
  pensionCredit,
  PENSION,
  RENT,
  rentCredit,
  settleYearEnd,
  STANDARD_TAX_CREDIT,
} from "./kr-year-end-2026.ts";

test("pins the 2026 귀속 limits so a change is a deliberate edit", () => {
  assert.equal(STANDARD_TAX_CREDIT, 130_000);
  assert.equal(CARD.thresholdRate, 0.25);
  assert.deepEqual(CARD.baseLimit, { le70m: 3_000_000, gt70m: 2_500_000 });
  assert.deepEqual(CARD.extraLimit, { le70m: 3_000_000, gt70m: 2_000_000 });
  assert.equal(RENT.cap, 10_000_000);
  assert.equal(RENT.salaryMax, 80_000_000);
  assert.equal(PENSION.totalCap, 9_000_000);
  assert.equal(INCOME_TAX_BRACKETS.length, 8);
});

test("tax brackets: cumulative tax at every boundary and 1M won past it", () => {
  const cases: [number, number][] = [
    [14_000_000, 840_000],
    [15_000_000, 990_000], // + 1M × 15%
    [50_000_000, 6_240_000],
    [51_000_000, 6_480_000], // + 1M × 24%
    [88_000_000, 15_360_000],
    [89_000_000, 15_710_000], // + 1M × 35%
    [150_000_000, 37_060_000],
    [151_000_000, 37_440_000], // + 1M × 38%
    [300_000_000, 94_060_000],
    [301_000_000, 94_460_000], // + 1M × 40%
    [500_000_000, 174_060_000],
    [501_000_000, 174_480_000], // + 1M × 42%
    [1_000_000_000, 384_060_000],
    [1_001_000_000, 384_510_000], // + 1M × 45%
  ];
  for (const [base, tax] of cases) assert.equal(basicIncomeTax(base), tax, `과세표준 ${base}`);
});

test("근로소득공제 keeps the 2% band above 1억 and the 2,000만 cap", () => {
  assert.equal(earnedIncomeDeduction(48_000_000), 12_150_000);
  assert.equal(earnedIncomeDeduction(100_000_000), 14_750_000);
  assert.equal(earnedIncomeDeduction(150_000_000), 15_750_000);
  assert.equal(earnedIncomeDeduction(362_500_000), 20_000_000);
  assert.equal(earnedIncomeDeduction(500_000_000), 20_000_000);
});

test("근로소득세액공제: 55%/30% rates", () => {
  assert.equal(earnedIncomeTaxCredit(1_000_000, 30_000_000), 550_000);
  assert.equal(earnedIncomeTaxCredit(1_300_000, 30_000_000), 715_000);
  assert.equal(earnedIncomeTaxCredit(1_400_000, 30_000_000), 740_000); // 715,000 + 30,000, cap 74만과 같음
});

test("근로소득세액공제: cap tiers by 총급여", () => {
  const big = 10_000_000; // 산출세액이 커서 한도가 걸리는 경우
  assert.equal(earnedIncomeTaxCredit(big, 33_000_000), 740_000);
  assert.equal(earnedIncomeTaxCredit(big, 40_000_000), 684_000); // 74만 − 700만 × 0.008
  assert.equal(earnedIncomeTaxCredit(big, 48_000_000), 660_000); // 62만 → 최저 66만
  assert.equal(earnedIncomeTaxCredit(big, 70_000_000), 660_000);
  assert.equal(earnedIncomeTaxCredit(big, 70_100_000), 610_000); // 66만 − 10만 × ½
  assert.equal(earnedIncomeTaxCredit(big, 90_000_000), 500_000); // 최저 50만
  assert.equal(earnedIncomeTaxCredit(big, 120_000_000), 500_000);
  assert.equal(earnedIncomeTaxCredit(big, 120_200_000), 400_000); // 50만 − 20만 × ½
  assert.equal(earnedIncomeTaxCredit(big, 200_000_000), 200_000); // 최저 20만
});

test("card deduction: nothing below the 25% threshold", () => {
  const r = cardDeduction(50_000_000, { credit: 12_500_000 });
  assert.equal(r.threshold, 12_500_000);
  assert.equal(r.deduction, 0);
  assert.equal(cardDeduction(50_000_000, { credit: 8_000_000, debit: 4_000_000 }).deduction, 0);
});

test("card deduction: above the threshold, credit card spending fills the threshold first", () => {
  // 총급여 5,000만 → 문턱 1,250만. 신용 2,000만 중 750만 × 15% + 체크 500만 × 30%
  assert.equal(cardDeduction(50_000_000, { credit: 20_000_000, debit: 5_000_000 }).deduction, 2_625_000);
  // 총급여 4,000만 → 문턱 1,000만. 신용 600만이 모두 문턱에 쓰이고 체크 1,000만 중 600만 × 30%
  assert.equal(cardDeduction(40_000_000, { credit: 6_000_000, debit: 10_000_000 }).deduction, 1_800_000);
});

test("card deduction: base limit, child step and the extra limit", () => {
  // 신용 4,000만: (4,000만 − 1,250만) × 15% = 412.5만 → 한도 300만
  assert.equal(cardDeduction(50_000_000, { credit: 40_000_000 }).deduction, 3_000_000);
  assert.equal(cardDeduction(50_000_000, { credit: 40_000_000 }, 1).deduction, 3_500_000);
  assert.equal(cardDeduction(50_000_000, { credit: 40_000_000 }, 3).deduction, 4_000_000); // 2명까지만 상향
  // 7천만 초과: 한도 250만, 자녀 2명 300만
  assert.equal(cardDeduction(80_000_000, { credit: 40_000_000 }).deduction, 2_500_000);
  assert.equal(cardDeduction(80_000_000, { credit: 40_000_000 }, 2).deduction, 3_000_000);
  // 추가한도: 신용 262.5만 + 전통시장 200만 + 대중교통 80만 = 542.5만, 기본 300만 + 추가 242.5만
  const r = cardDeduction(50_000_000, { credit: 30_000_000, market: 5_000_000, transit: 2_000_000 });
  assert.equal(r.gross, 5_425_000);
  assert.equal(r.extra, 2_425_000);
  assert.equal(r.deduction, 5_425_000);
});

test("보험료 12% on up to 100만, 연금계좌 15%/12% with the 900만 cap", () => {
  assert.equal(insuranceCredit(500_000), 60_000);
  assert.equal(insuranceCredit(2_000_000), 120_000);
  assert.equal(pensionCredit(55_000_000, 0, 9_000_000), 1_350_000);
  assert.equal(pensionCredit(55_000_000, 8_000_000, 2_000_000), 1_200_000); // 연금저축 600만 + IRP 200만
  assert.equal(pensionCredit(60_000_000, 3_000_000, 8_000_000), 1_080_000); // 900만 × 12%
});

test("월세 1,000만 cap, 17%/15% and the 8,000만 salary limit", () => {
  assert.equal(rentCredit(50_000_000, 37_750_000, 12_000_000), 1_700_000);
  assert.equal(rentCredit(60_000_000, 47_000_000, 12_000_000), 1_500_000);
  assert.equal(rentCredit(80_000_000, 66_250_000, 6_000_000), 900_000);
  assert.equal(rentCredit(80_000_001, 66_250_001, 6_000_000), 0);
});

test("의료비·기부금·자녀 credits", () => {
  assert.equal(medicalCredit(50_000_000, 1_000_000), 0); // 3% 문턱 150만 이하
  assert.equal(medicalCredit(50_000_000, 2_500_000), 150_000);
  assert.equal(medicalCredit(50_000_000, 20_000_000), 1_050_000); // 700만 한도
  assert.equal(donationCredit(12_000_000), 2_100_000); // 1,000만 × 15% + 200만 × 30%
  assert.deepEqual([0, 1, 2, 3, 4].map(childTaxCredit), [0, 250_000, 550_000, 950_000, 1_350_000]);
});

test("end-to-end: the review note's 김씨 example (총급여 4,800만, 월세 월 65만, IRP 300만)", () => {
  // 가정: 1인 가구, 4대보험·카드·기타 공제 입력 없음, 근로소득만 있음.
  // 근로소득공제 = 1,200만 + (4,800만 − 4,500만) × 5% = 1,215만 → 근로소득금액 3,585만
  // 과세표준 = 3,585만 − 기본공제 150만 = 3,435만
  // 산출세액 = 84만 + (3,435만 − 1,400만) × 15% = 3,892,500
  // 근로소득세액공제 = min(71.5만 + (3,892,500 − 130만) × 30% = 1,492,750, 한도 max(66만, 74만 − 1,500만 × 0.008 = 62만) = 66만) = 660,000
  // 연금계좌 = 300만 × 15% (총급여 5,500만 이하) = 450,000
  // 월세 = 780만 × 17% (총급여 5,500만 이하, 근로소득금액 4,500만 이하) = 1,326,000
  // 특별공제·월세 쪽: 3,892,500 − 660,000 − 450,000 − 1,326,000 = 1,456,500 (지방세 145,650 → 1,602,150)
  // 표준세액공제 쪽: 3,892,500 − 660,000 − 450,000 − 130,000 = 2,652,500 → 월세 쪽이 유리
  const r = settleYearEnd({ salary: 48_000_000, persons: 1, irp: 3_000_000, rent: 7_800_000 });
  assert.equal(r.earnedIncome, 35_850_000);
  assert.equal(r.taxBase, 34_350_000);
  assert.equal(r.calculatedTax, 3_892_500);
  assert.equal(r.earnedTaxCredit, 660_000);
  assert.equal(r.pensionCredit, 450_000);
  assert.equal(r.rentCredit, 1_326_000);
  assert.equal(r.usedStandard, false);
  assert.equal(r.finalTax, 1_456_500);
  assert.equal(r.localTax, 145_650);
  assert.equal(r.totalTax, 1_602_150);

  // 월세·IRP가 없으면 표준세액공제 13만 원을 받는다: 3,892,500 − 660,000 − 130,000 = 3,102,500
  const base = settleYearEnd({ salary: 48_000_000, persons: 1 });
  assert.equal(base.usedStandard, true);
  assert.equal(base.finalTax, 3_102_500);
  // 지방세까지 합친 실제 차이는 181만 600원이다. 노트의 "182만 원 이상"(132.6만 + 49.5만)은
  // 월세를 신청하면 표준세액공제 13만 원(지방세 포함 14.3만)을 잃는 점과 월세분 지방세(13.26만)를 빼고 더한 값이다.
  assert.equal(base.totalTax - r.totalTax, 1_810_600);
});

test("small earners with only an insurance premium still get the 13만 standard credit when it is larger", () => {
  const r = settleYearEnd({ salary: 30_000_000, persons: 1, insurancePremium: 500_000 });
  assert.equal(r.usedStandard, true); // 보험료 6만 원 < 표준 13만 원
  assert.equal(r.standardCredit, 130_000);
  assert.equal(r.insuranceCredit, 0);
});
