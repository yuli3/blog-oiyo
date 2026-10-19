// Recurring tax on owning a home, for the non-Korean pages of the property tax calculator. Each locale
// page uses its own country's law (세운 2026-10-19). Checked 2026-10-19:
// - Japan 固定資産税 (地方税法 第350条 標準税率 1.4%, 第349条の3の2 住宅用地特例) and 都市計画税 (第702条の3,
//   制限税率 0.3%, 第702条の3 住宅用地特例). 小規模住宅用地 (1戸 200㎡まで): 固定資産税 1/6, 都市計画税 1/3;
//   一般住宅用地 (200㎡超の部分): 1/3 and 2/3. 新築住宅の減額: 居住部分 120㎡までの固定資産税を 1/2 (一般 3年度、
//   認定長期優良住宅・中高層耐火は 5〜7年度). 免税点: 土地 30万円、家屋 20万円. 負担調整措置 can make the
//   real 課税標準 lower than the 本則 figure computed here. Source: city.ikeda.osaka.jp
//   R08koteishisantoshikeikakuzeiver2.pdf (令和8年度), city.sagamihara.kanagawa.jp (長期優良住宅の減額).
// - China: there is no general recurring tax on individually owned homes (房产税暂行条例 第5条 exempts
//   non-business homes). Only the 2011 pilots exist; Shanghai (沪府发〔2011〕3号, from 2011-01-28, no end
//   date): a Shanghai household's newly bought second-or-later home, or any new home bought by a
//   non-resident household. Area above 60㎡ per household member (all homes counted) is taxed;
//   base = market price × 70%; rate 0.6%, or 0.4% when the price per ㎡ is at most twice the previous
//   year's average new-home price. Source: shanghai.gov.cn (沪府发〔2011〕3号 PDF).
// - France taxe foncière sur les propriétés bâties (CGI art. 1388): base = valeur locative cadastrale
//   × 50%; rate = taux communal + intercommunal voted locally (shown on the avis). Default 37.18% is the
//   2025 average communal rate (DGCL, Note REI 2025); TEOM and other lines on the avis are not included.
// - Spain IBI (TRLRHL RDLeg 2/2004 art. 65, 72): cuota = base liquidable (valor catastral, less any
//   reducción) × tipo municipal; urban rate 0.4%–1.10% (higher in some cases, art. 72.3). The rate is the
//   one on the council's recibo; default 0.5% is only an example.

export type PropertyCountry = "jp" | "cn" | "fr" | "es";

export const PROPERTY_TAX_AS_OF = "2026-10-19";

const floorTo = (n: number, unit: number) => Math.floor(n / unit) * unit;

// ── Japan ────────────────────────────────────────────────────────────────

export interface JapanPropertyInput {
  landValue: number;
  landArea: number;
  residential: boolean;
  dwellings: number;
  buildingValue: number;
  floorArea: number;
  newHouseRelief: boolean;
  /** fractions, e.g. 0.014 and 0.003 */
  fixedRate: number;
  cityPlanRate: number;
}

export function japanPropertyTax(i: JapanPropertyInput) {
  const small = i.residential ? Math.min(i.landArea, 200 * Math.max(1, i.dwellings)) : 0;
  const smallShare = i.landArea > 0 ? small / i.landArea : 0;
  const generalShare = i.residential ? 1 - smallShare : 0;
  const plainShare = i.residential ? 0 : 1;

  const landFixedBase = floorTo(i.landValue * (smallShare / 6 + generalShare / 3 + plainShare), 1000);
  const landCityBase = floorTo(i.landValue * (smallShare / 3 + (generalShare * 2) / 3 + plainShare), 1000);
  const buildingBase = floorTo(i.buildingValue, 1000);

  const landExempt = i.landValue < 300_000;
  const buildingExempt = i.buildingValue < 200_000;

  const landFixed = landExempt ? 0 : landFixedBase * i.fixedRate;
  const landCity = landExempt ? 0 : landCityBase * i.cityPlanRate;
  const buildingFixedGross = buildingExempt ? 0 : buildingBase * i.fixedRate;
  const relief = i.newHouseRelief && i.floorArea > 0 ? (buildingFixedGross * Math.min(1, 120 / i.floorArea)) / 2 : 0;
  const buildingFixed = buildingFixedGross - relief;
  const buildingCity = buildingExempt ? 0 : buildingBase * i.cityPlanRate;

  const fixedAssetTax = floorTo(landFixed + buildingFixed, 100);
  const cityPlanningTax = floorTo(landCity + buildingCity, 100);
  return {
    landFixedBase,
    landCityBase,
    buildingBase,
    relief: Math.round(relief),
    fixedAssetTax,
    cityPlanningTax,
    total: fixedAssetTax + cityPlanningTax,
  };
}

// ── China (Shanghai pilot) ───────────────────────────────────────────────

export interface ShanghaiPilotInput {
  price: number;
  area: number;
  /** area of homes the household already owns */
  existingArea: number;
  members: number;
  /** price per ㎡ at most twice last year's average new-home price */
  lowPrice: boolean;
  /** Shanghai household (the 60㎡ per person exemption applies) */
  resident: boolean;
}

export function shanghaiPilotTax(i: ShanghaiPilotInput) {
  const allowance = i.resident ? 60 * Math.max(1, i.members) : 0;
  const taxableArea = Math.max(0, Math.min(i.area, i.existingArea + i.area - allowance));
  const base = i.area > 0 ? (i.price / i.area) * taxableArea * 0.7 : 0;
  const rate = i.lowPrice ? 0.004 : 0.006;
  return { taxableArea, base: Math.round(base * 100) / 100, rate, tax: Math.round(base * rate * 100) / 100 };
}

// ── France ───────────────────────────────────────────────────────────────

export const FR_DEFAULT_TFPB_RATE = 37.18;

/** ratePercent: taux communal + intercommunal from the avis, in percent. */
export function franceTaxeFonciere(valeurLocative: number, ratePercent: number) {
  const base = valeurLocative * 0.5;
  const tax = base * (ratePercent / 100);
  return { base: Math.round(base), tax: Math.round(tax) };
}

// ── Spain ────────────────────────────────────────────────────────────────

export const ES_DEFAULT_IBI_RATE = 0.5;

/** ratePercent: tipo municipal from the recibo, in percent. */
export function spainIbi(valorCatastral: number, ratePercent: number) {
  return { tax: Math.round(valorCatastral * (ratePercent / 100) * 100) / 100, inLegalRange: ratePercent >= 0.4 && ratePercent <= 1.1 };
}
