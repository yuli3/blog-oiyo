// Tax on selling a home, for the non-Korean pages of the capital gains tax calculator. Each locale page
// uses its own country's law (세운 2026-10-19). Checked 2026-10-19:
// - Japan 譲渡所得 (租税特別措置法 第31条・第32条・第31条の3・第35条): 譲渡した年の1月1日に所有期間5年超なら
//   長期 15.315% + 住民税 5% = 20.315%, 5年以下は短期 30.63% + 9% = 39.63%. 居住用財産は特別控除 3,000万円
//   (第35条). 所有期間10年超の居住用は軽減税率: 課税長期譲渡所得 6,000万円以下 10.21% + 4% = 14.21%,
//   超える部分は 20.315% (第31条の3, 3,000万円控除と併用可). 取得費が分からなければ譲渡価額の5% (概算取得費).
//   Sources: 国税庁 タックスアンサー No.1440, 3202, 3208, 3302, 3305, 3258.
// - China 个人转让住房 个人所得税: (转让收入 − 房屋原值 − 合理费用) × 20% (个人所得税法 第3条・第6条);
//   原值无法核实的按转让收入 1%–3% 核定征收, 具体比例由各省确定 (国税发〔2006〕108号). 个人转让自用5年以上并且
//   是家庭唯一生活用房免征 (财税字〔1999〕278号). 增值税、土地增值税、附加税 not modelled (个人销售住房
//   满2年免征增值税, 财政部 税务总局 住房城乡建设部公告2024年第17号).
// - France plus-value immobilière (CGI art. 150 U à 150 VH, 200 B, 1609 nonies G): IR 19% + prélèvements
//   sociaux 17.2%. Abattement pour durée de détention: IR 6%/an de la 6e à la 21e année, 4% la 22e
//   (exonération après 22 ans); PS 1.65%/an de la 6e à la 21e, 1.60% la 22e, 9%/an de la 23e à la 30e
//   (exonération après 30 ans). Prix d'acquisition majoré des frais d'acquisition (forfait 7.5%) et des travaux
//   (forfait 15% après 5 ans de détention). Résidence principale exonérée (art. 150 U II 1°). Surtaxe sur la
//   plus-value nette imposable > 50 000 € (2% à 6% avec lissage, art. 1609 nonies G).
//   Sources: service-public.gouv.fr/particuliers/vosdroits/F10864, impots.gouv.fr (plus-values immobilières),
//   BOI-RFPI-PVI-20-20 (abattements), BOI-RFPI-TPVIE (surtaxe).
// - Spain IRPF ganancia patrimonial (LIRPF art. 33–35, 38, 66, 76): base del ahorro 2026 19% hasta 6.000 €,
//   21% hasta 50.000, 23% hasta 200.000, 27% hasta 300.000 y 30% por encima (el 28% anterior subió al 30%
//   desde 2025, Ley 7/2024). Exención por reinversión en vivienda habitual proporcional a lo reinvertido
//   (art. 38.1); mayores de 65 que venden su vivienda habitual, exentos (art. 33.4.b). Coeficientes de
//   abatimiento anteriores a 1994 no modelados. La plusvalía municipal (IIVTNU) es un impuesto local aparte.
//   Sources: guiafiscal.es/irpf/tramos-irpf-2026/, sede.agenciatributaria.gob.es (Manual Renta, ganancias).

export type CapitalGainsCountry = "jp" | "cn" | "fr" | "es";

export const CAPITAL_GAINS_TAX_AS_OF = "2026-10-19";

const floorTo = (n: number, unit: number) => Math.floor(n / unit) * unit;
const r2 = (n: number) => Math.round(n * 100) / 100;

export function bandTax(base: number, bands: [number, number][]): number {
  let tax = 0;
  let lower = 0;
  for (const [upper, rate] of bands) {
    if (base <= lower) break;
    tax += (Math.min(base, upper) - lower) * rate;
    lower = upper;
  }
  return tax;
}

// ── Japan ────────────────────────────────────────────────────────────────

export interface JapanCapitalGainsInput {
  salePrice: number;
  /** 取得費 (建物は減価償却後). Ignored when estimatedCost. */
  acquisitionCost: number;
  /** 取得費が分からないので譲渡価額の5%を使う */
  estimatedCost: boolean;
  /** 仲介手数料・印紙税など */
  sellingCosts: number;
  acquisitionYear: number;
  saleYear: number;
  /** 居住用財産の3,000万円特別控除 */
  residence: boolean;
  /** 10年超所有の居住用財産の軽減税率 (residence でなければ使えない) */
  reducedRate: boolean;
}

export function japanCapitalGainsTax(i: JapanCapitalGainsInput) {
  const cost = i.estimatedCost ? Math.floor(i.salePrice * 0.05) : i.acquisitionCost;
  const gain = Math.max(0, i.salePrice - cost - i.sellingCosts);
  // 所有期間は譲渡した年の1月1日で判定: 5年超 ⇔ 取得年 ≤ 譲渡年 − 6, 10年超 ⇔ 取得年 ≤ 譲渡年 − 11.
  const longTerm = i.saleYear - i.acquisitionYear >= 6;
  const over10 = i.saleYear - i.acquisitionYear >= 11;
  const special = i.residence ? Math.min(gain, 30_000_000) : 0;
  const taxable = floorTo(gain - special, 1000);

  let incomeTaxBase: number;
  let residentTax: number;
  let regime: "short" | "long" | "reduced";
  if (!longTerm) {
    regime = "short";
    incomeTaxBase = taxable * 0.3;
    residentTax = taxable * 0.09;
  } else if (i.residence && i.reducedRate && over10) {
    regime = "reduced";
    const low = Math.min(taxable, 60_000_000);
    const high = taxable - low;
    incomeTaxBase = low * 0.1 + high * 0.15;
    residentTax = low * 0.04 + high * 0.05;
  } else {
    regime = "long";
    incomeTaxBase = taxable * 0.15;
    residentTax = taxable * 0.05;
  }
  const base = Math.floor(incomeTaxBase);
  const incomeTax = floorTo(base + Math.floor(base * 0.021), 100);
  const resident = floorTo(residentTax, 100);
  return { cost, gain, longTerm, over10, regime, special, taxable, incomeTax, residentTax: resident, total: incomeTax + resident };
}

// ── China ────────────────────────────────────────────────────────────────

export type ChinaCgMethod = "actual" | "deemed";

export interface ChinaCapitalGainsInput {
  salePrice: number;
  originalValue: number;
  /** 合理费用: 装修费、贷款利息、手续费、缴纳的税金 */
  expenses: number;
  method: ChinaCgMethod;
  /** 核定征收率 (fraction, 0.01–0.03) */
  deemedRate: number;
  /** 自用满5年且家庭唯一生活用房 */
  fiveYearsOnly: boolean;
}

export function chinaCapitalGainsTax(i: ChinaCapitalGainsInput) {
  const gain = Math.max(0, i.salePrice - i.originalValue - i.expenses);
  if (i.fiveYearsOnly) return { gain, base: 0, rate: 0, tax: 0, exempt: true };
  if (i.method === "deemed") return { gain, base: i.salePrice, rate: i.deemedRate, tax: r2(i.salePrice * i.deemedRate), exempt: false };
  return { gain, base: gain, rate: 0.2, tax: r2(gain * 0.2), exempt: false };
}

// ── France ───────────────────────────────────────────────────────────────

/** Cumulative abattement after `years` full years of ownership. */
export function franceAbattementIR(years: number) {
  if (years < 6) return 0;
  if (years >= 22) return 1;
  return (Math.min(years, 21) - 5) * 0.06;
}

export function franceAbattementPS(years: number) {
  if (years < 6) return 0;
  if (years >= 30) return 1;
  const base = (Math.min(years, 21) - 5) * 0.0165;
  if (years <= 21) return base;
  return base + 0.016 + (years - 22) * 0.09;
}

/** Surtaxe on the IR-taxable net gain (art. 1609 nonies G, with lissage). */
export function franceSurtaxe(pv: number) {
  if (pv <= 50_000) return 0;
  if (pv <= 60_000) return 0.02 * pv - (60_000 - pv) / 20;
  if (pv <= 100_000) return 0.02 * pv;
  if (pv <= 110_000) return 0.03 * pv - (110_000 - pv) / 10;
  if (pv <= 150_000) return 0.03 * pv;
  if (pv <= 160_000) return 0.04 * pv - (160_000 - pv) * 0.15;
  if (pv <= 200_000) return 0.04 * pv;
  if (pv <= 210_000) return 0.05 * pv - (210_000 - pv) * 0.2;
  if (pv <= 250_000) return 0.05 * pv;
  if (pv <= 260_000) return 0.06 * pv - (260_000 - pv) * 0.25;
  return 0.06 * pv;
}

export interface FranceCapitalGainsInput {
  salePrice: number;
  purchasePrice: number;
  /** Frais d'acquisition réels; ignored when forfaitAcquisition. */
  acquisitionFees: number;
  forfaitAcquisition: boolean;
  /** Travaux réels; ignored when forfaitTravaux (requires > 5 years). */
  works: number;
  forfaitTravaux: boolean;
  years: number;
  residencePrincipale: boolean;
}

export function franceCapitalGainsTax(i: FranceCapitalGainsInput) {
  const fees = i.forfaitAcquisition ? i.purchasePrice * 0.075 : i.acquisitionFees;
  const works = i.forfaitTravaux && i.years > 5 ? i.purchasePrice * 0.15 : i.works;
  const adjustedCost = i.purchasePrice + fees + works;
  const gross = Math.max(0, i.salePrice - adjustedCost);
  const abIR = franceAbattementIR(i.years);
  const abPS = franceAbattementPS(i.years);
  if (i.residencePrincipale) {
    return { adjustedCost: r2(adjustedCost), gross: r2(gross), abIR, abPS, netIR: 0, netPS: 0, ir: 0, ps: 0, surtaxe: 0, total: 0, exempt: true };
  }
  const netIR = Math.round(gross * (1 - abIR));
  const netPS = Math.round(gross * (1 - abPS));
  const ir = r2(netIR * 0.19);
  const ps = r2(netPS * 0.172);
  const surtaxe = r2(franceSurtaxe(netIR));
  return { adjustedCost: r2(adjustedCost), gross: r2(gross), abIR, abPS, netIR, netPS, ir, ps, surtaxe, total: r2(ir + ps + surtaxe), exempt: false };
}

// ── Spain ────────────────────────────────────────────────────────────────

/** Escala del ahorro 2026, territorio común (estatal + autonómica). */
export const ES_SAVINGS_BANDS: [number, number][] = [
  [6_000, 0.19],
  [50_000, 0.21],
  [200_000, 0.23],
  [300_000, 0.27],
  [Infinity, 0.3],
];

export interface SpainCapitalGainsInput {
  /** Valor de transmisión: precio menos gastos de venta (comisión, plusvalía municipal pagada). */
  salePrice: number;
  saleCosts: number;
  /** Valor de adquisición: precio más gastos y tributos de compra (ITP/IVA, notaría, registro) y mejoras. */
  purchasePrice: number;
  purchaseCosts: number;
  /** Vivienda habitual: amount reinvested in a new one within 2 years. */
  reinvested: number;
  viviendaHabitual: boolean;
  over65: boolean;
}

export function spainCapitalGainsTax(i: SpainCapitalGainsInput) {
  const transmission = Math.max(0, i.salePrice - i.saleCosts);
  const gain = Math.max(0, transmission - i.purchasePrice - i.purchaseCosts);
  let exemptShare = 0;
  if (i.viviendaHabitual) {
    if (i.over65) exemptShare = 1;
    else if (transmission > 0) exemptShare = Math.min(1, Math.max(0, i.reinvested) / transmission);
  }
  const exempt = r2(gain * exemptShare);
  const taxable = r2(gain - exempt);
  const tax = r2(bandTax(taxable, ES_SAVINGS_BANDS));
  return { transmission, gain: r2(gain), exempt, taxable, tax, effective: taxable > 0 ? tax / taxable : 0 };
}
