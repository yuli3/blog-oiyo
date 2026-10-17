// 스트레스 DSR 주택담보대출 한도 추정 규칙. 기준일 2026-10-17.
// 근거(직접 확인):
// - 금융위원회 「3단계 스트레스 DSR 행정지도 변경시행」(관리번호 2024-002, 유효기간 2026-07-01~2026-12-31)
//   better.fsc.go.kr 행정지도 시행 postNo=4215 첨부 PDF
// - 금융위원회 카드뉴스 "3단계 스트레스 DSR 7월 1일부터 시행"(2025-05-21) fsc.go.kr/no040101?cnId=2741
// - 금융위원회 10.15 대출수요 관리 방안(2025-10-16 시행) fsc.go.kr/no010101/85432, 카드뉴스 cnId=2914
// - 은행연합회 「26년 하반기 스트레스 DSR 운영방안」(2026-06-30) m.kfb.or.kr/news/info_news_view.php?idx=1989
// 행정지도 유효기간이 끝나는 2026-12-31 뒤에는 이 파일과 테스트를 다시 확인해야 한다.

export const STRESS_DSR_AS_OF = "2026-10-17";
export const STRESS_DSR_VALID_UNTIL = "2026-12-31";

export const STRESS_DSR_RULES = {
  /** 3단계 산출 스트레스 금리(과거 5년 최고금리 − 현재금리, 하한 1.5%). 2026 하반기 적용값 */
  baseStressRate: 1.5,
  /** 수도권·규제지역 주담대 스트레스 금리 하한(10.15 대책, 2025-10-16~) */
  metroRegulatedMortgageFloor: 3.0,
  /** 수도권·규제지역 밖 주담대는 2단계 기본 적용비율 50% 유지(~2026-12-31) */
  nonMetroStage2BaseRatio: 0.5,
  /** 은행권 DSR 한도 */
  bankDsrLimit: 0.4,
  /** LTV(무주택·처분조건부 1주택 기준) */
  ltvRegulated: 0.4,
  ltvNonRegulated: 0.7,
} as const;

/** 수도권·규제지역 주택구입목적 주담대 최대 한도(10.15 대책). 시가 기준. */
export function metroRegulatedLoanCap(housePrice: number): number {
  if (housePrice <= 1_500_000_000) return 600_000_000;
  if (housePrice <= 2_500_000_000) return 400_000_000;
  return 200_000_000;
}

export type RateType = "variable" | "mixed" | "periodic";

/**
 * 대출유형별 적용비율. 고정금리 기간(혼합형) 또는 금리변동주기(주기형)가 5년 미만이면 변동형과 같이 100%.
 * 그 밖에는 [고정기간 or 변동주기] ÷ 만기 비중에 따라 차등(70% 이상은 미적용).
 * stage2=true는 수도권·규제지역 밖 주담대에 남아 있는 2단계 비율이다.
 */
export function rateTypeRatio(rateType: RateType, fixedYears: number, maturityYears: number, stage2: boolean): number {
  if (rateType === "variable" || fixedYears < 5) return 1;
  const share = maturityYears > 0 ? fixedYears / maturityYears : 1;
  if (share >= 0.7) return 0;
  const table = rateType === "mixed"
    ? (stage2 ? [0.6, 0.4, 0.2] : [0.8, 0.6, 0.4])
    : (stage2 ? [0.3, 0.2, 0.1] : [0.4, 0.3, 0.2]);
  if (share < 0.3) return table[0];
  if (share < 0.5) return table[1];
  return table[2];
}

export interface StressAddon {
  /** 수도권·규제지역이면 "3단계", 그 밖 지방 주담대는 "2단계 유지" */
  stage: "3단계" | "2단계 유지";
  baseRate: number;
  ratio: number;
  addon: number;
}

export function stressAddon(metroOrRegulated: boolean, rateType: RateType, fixedYears: number, maturityYears: number): StressAddon {
  const R = STRESS_DSR_RULES;
  if (metroOrRegulated) {
    const baseRate = Math.max(R.baseStressRate, R.metroRegulatedMortgageFloor);
    const ratio = rateTypeRatio(rateType, fixedYears, maturityYears, false);
    return { stage: "3단계", baseRate, ratio, addon: round2(baseRate * ratio) };
  }
  const baseRate = round2(R.baseStressRate * R.nonMetroStage2BaseRatio);
  const ratio = rateTypeRatio(rateType, fixedYears, maturityYears, true);
  return { stage: "2단계 유지", baseRate, ratio, addon: round2(baseRate * ratio) };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** 원리금균등 연간 상환액 */
export function annualPayment(principal: number, ratePercent: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0;
  const r = ratePercent / 100 / 12;
  const n = years * 12;
  if (r === 0) return Math.round(principal / years);
  return Math.round(((principal * r * (1 + r) ** n) / ((1 + r) ** n - 1)) * 12);
}

/** 연간 허용 상환액으로 역산한 최대 원금(원리금균등) */
export function principalFromAnnualPayment(annualLimit: number, ratePercent: number, years: number): number {
  if (annualLimit <= 0 || years <= 0) return 0;
  const m = annualLimit / 12;
  const r = ratePercent / 100 / 12;
  const n = years * 12;
  if (r === 0) return Math.round(m * n);
  return Math.round((m * ((1 + r) ** n - 1)) / (r * (1 + r) ** n));
}

export interface StressDsrInput {
  housePrice: number;
  annualIncome: number;
  existingAnnualPayment: number;
  interestRate: number;
  maturityYears: number;
  capitalArea: boolean;
  regulatedArea: boolean;
  rateType: RateType;
  fixedYears: number;
}

export interface StressDsrResult {
  stress: StressAddon;
  stressedRate: number;
  ltvPercent: number;
  ltvAmount: number;
  cap: number | null;
  normalDsrPrincipal: number;
  stressedDsrPrincipal: number;
  dsrReduction: number;
  finalMaxLoan: number;
  binding: "ltv" | "cap" | "dsr";
  finalAnnualPayment: number;
  finalMonthlyPayment: number;
  finalDsrPercent: number;
}

export function computeStressDsrMortgage(input: StressDsrInput): StressDsrResult {
  const R = STRESS_DSR_RULES;
  const metroOrRegulated = input.capitalArea || input.regulatedArea;
  const stress = stressAddon(metroOrRegulated, input.rateType, input.fixedYears, input.maturityYears);
  const stressedRate = round2(input.interestRate + stress.addon);

  const ltv = input.regulatedArea ? R.ltvRegulated : R.ltvNonRegulated;
  const ltvAmount = Math.round(input.housePrice * ltv);
  const cap = metroOrRegulated ? metroRegulatedLoanCap(input.housePrice) : null;

  const available = Math.max(0, input.annualIncome * R.bankDsrLimit - input.existingAnnualPayment);
  const normalDsrPrincipal = principalFromAnnualPayment(available, input.interestRate, input.maturityYears);
  const stressedDsrPrincipal = principalFromAnnualPayment(available, stressedRate, input.maturityYears);

  const candidates: [number, StressDsrResult["binding"]][] = [[ltvAmount, "ltv"], [stressedDsrPrincipal, "dsr"]];
  if (cap !== null) candidates.push([cap, "cap"]);
  const [finalMaxLoan, binding] = candidates.reduce((a, b) => (b[0] < a[0] ? b : a));

  const finalAnnualPayment = annualPayment(finalMaxLoan, input.interestRate, input.maturityYears);
  return {
    stress,
    stressedRate,
    ltvPercent: Math.round(ltv * 100),
    ltvAmount,
    cap,
    normalDsrPrincipal,
    stressedDsrPrincipal,
    dsrReduction: Math.max(0, normalDsrPrincipal - stressedDsrPrincipal),
    finalMaxLoan,
    binding,
    finalAnnualPayment,
    finalMonthlyPayment: Math.round(finalAnnualPayment / 12),
    finalDsrPercent: input.annualIncome > 0 ? ((finalAnnualPayment + input.existingAnnualPayment) / input.annualIncome) * 100 : 0,
  };
}
