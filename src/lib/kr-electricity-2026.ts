// 주택용 전력(저압) 요금 for the electricity bill calculator.
// Checked 2026-10-13: the residential tariff has not changed since the 2023-05-16 revision,
// and the Q4 2026 fuel cost adjustment stayed at the +5원/kWh cap (KEPCO notice 2026-09-21,
// as reported by secondary summaries; kepco.co.kr could not be fetched from the build container).
// When KEPCO revises the tariff, update ELECTRICITY and the tests, not the formulas.

import { parseKrAmount } from "./kr-vat-2026.ts";

export const ELECTRICITY_AS_OF = "2026-10-13";

export const ELECTRICITY = {
  /** 기타계절(1~6월, 9~12월) 구간 상한 kWh */
  otherLimits: [200, 400],
  /** 하계(7~8월) 구간 상한 kWh */
  summerLimits: [300, 450],
  basic: [910, 1_600, 7_300],
  energy: [120.0, 214.6, 307.3],
  superUserFrom: 1_000,
  superUserRate: 736.2,
  climate: 9.0,
  fuelAdjustment: 5.0,
  vatRate: 0.1,
  fundRate: 0.027,
} as const;

export type Season = "other" | "summer" | "winter";

export interface BillBreakdown {
  kwh: number;
  tier: 1 | 2 | 3;
  basic: number;
  energy: number;
  climate: number;
  fuel: number;
  /** 전기요금계 (기본 + 전력량 + 기후환경 + 연료비조정) */
  subtotal: number;
  vat: number;
  fund: number;
  total: number;
  /** 구간별 사용량과 단가 */
  bands: { kwh: number; rate: number }[];
}

export function seasonOf(month: number): Season {
  if (month === 7 || month === 8) return "summer";
  if (month === 12 || month === 1 || month === 2) return "winter";
  return "other";
}

/**
 * 한 달 청구액. 원 단위 처리는 한전 요금 안내 방식을 따른다(2026-10-13 확인):
 * 각 요금 원 미만 절사, 부가세 원 미만 반올림, 전력기금 10원 미만 절사, 청구액 10원 미만 절사.
 * 복지·대가족 할인과 취약계층 필수사용량 보장공제는 넣지 않았다.
 */
export function electricityBill(kwhInput: number, season: Season): BillBreakdown {
  const kwh = Math.max(0, Math.round(kwhInput));
  const [l1, l2] = season === "summer" ? ELECTRICITY.summerLimits : ELECTRICITY.otherLimits;
  const tier: 1 | 2 | 3 = kwh <= l1 ? 1 : kwh <= l2 ? 2 : 3;

  const bands: { kwh: number; rate: number }[] = [];
  const b1 = Math.min(kwh, l1);
  const b2 = Math.min(Math.max(kwh - l1, 0), l2 - l1);
  // 슈퍼유저 단가는 하계·동계(12~2월)에 1,000kWh를 넘는 부분에만 붙는다.
  const superCap = season === "other" ? Infinity : ELECTRICITY.superUserFrom;
  const b3 = Math.max(Math.min(kwh, superCap) - l2, 0);
  const b4 = Math.max(kwh - superCap, 0);
  if (b1) bands.push({ kwh: b1, rate: ELECTRICITY.energy[0] });
  if (b2) bands.push({ kwh: b2, rate: ELECTRICITY.energy[1] });
  if (b3) bands.push({ kwh: b3, rate: ELECTRICITY.energy[2] });
  if (b4) bands.push({ kwh: b4, rate: ELECTRICITY.superUserRate });

  const basic = ELECTRICITY.basic[tier - 1];
  const energy = Math.floor(bands.reduce((sum, b) => sum + b.kwh * b.rate, 0) + 1e-9);
  const climate = Math.floor(kwh * ELECTRICITY.climate);
  const fuel = Math.floor(kwh * ELECTRICITY.fuelAdjustment);
  const subtotal = basic + energy + climate + fuel;
  const vat = Math.round(subtotal * ELECTRICITY.vatRate);
  const fund = Math.floor((subtotal * ELECTRICITY.fundRate) / 10) * 10;
  const total = Math.floor((subtotal + vat + fund) / 10) * 10;
  return { kwh, tier, basic, energy, climate, fuel, subtotal, vat, fund, total, bands };
}

/** 하루 h시간, d일 쓰는 W짜리 기기의 사용량(kWh) */
export function applianceKwh(watts: number, hoursPerDay: number, days: number): number {
  return Math.max(0, (watts * hoursPerDay * days) / 1000);
}

export interface AppliancePreset {
  id: string;
  label: string;
  watts: number;
  hours: number;
}

// 소비전력은 흔한 가정용 제품의 평균 소비전력 예시다. 실제 값은 제품 라벨(정격·월간 소비전력량)을 따른다.
export const APPLIANCE_PRESETS: readonly AppliancePreset[] = [
  { id: "dehumidifier", label: "제습기", watts: 300, hours: 8 },
  { id: "electricBlanket", label: "전기장판(2인용)", watts: 150, hours: 8 },
  { id: "heater", label: "전기히터", watts: 1_500, hours: 3 },
  { id: "aircon", label: "벽걸이 에어컨", watts: 700, hours: 8 },
  { id: "humidifier", label: "가열식 가습기", watts: 250, hours: 8 },
  { id: "dryer", label: "건조기", watts: 1_000, hours: 1.5 },
];

export interface ElectricityText {
  kwh?: number;
  month?: number;
  watts?: number;
  hours?: number;
}

/** "8월 350kWh 에어컨 700W 하루 8시간" 같은 한 줄에서 값을 읽는다. */
export function parseElectricityText(text: string): ElectricityText {
  const out: ElectricityText = {};
  const kwh = text.match(/(\d[\d,]*(?:\.\d+)?)\s*(?:kwh|킬로와트시)/i);
  if (kwh) out.kwh = Number(kwh[1].replace(/,/g, ""));
  const month = text.match(/(\d{1,2})\s*월/);
  if (month) {
    const m = Number(month[1]);
    if (m >= 1 && m <= 12) out.month = m;
  }
  const watts = text.match(/(\d[\d,]*(?:\.\d+)?)\s*(k)?w(?!h)/i);
  if (watts) out.watts = Number(watts[1].replace(/,/g, "")) * (watts[2] ? 1000 : 1);
  const hours = text.match(/(\d+(?:\.\d+)?)\s*시간/);
  if (hours) out.hours = Number(hours[1]);
  if (out.kwh === undefined) {
    const amount = text.match(/(\d[\d,]*)\s*(?:킬로|키로)/);
    if (amount) out.kwh = parseKrAmount(amount[1]) ?? undefined;
  }
  return out;
}
