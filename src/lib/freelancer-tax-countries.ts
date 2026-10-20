// Tax and social contributions of a self-employed person, for the non-Korean pages of the freelancer tax
// calculator. Each locale page uses its own country's law (세운 2026-10-19). Checked 2026-10-20:
// - Japan 個人事業主 (令和8年分): 事業所得 = 売上 − 経費 − 青色申告特別控除 (65万/55万/10万円). 所得税・住民税は
//   japanIncomeTax. 国民年金 令和8年度 月額17,920円 (日本年金機構). 国民健康保険料は市区町村ごとに違うため入力値.
//   個人事業税 (地方税法 第72条の49の8〜, 都道府県税; article numbers not re-checked): (事業所得 青色控除前 − 事業主控除290万円) × 業種別 5%/4%/3%,
//   文筆業など法定業種外は非課税. 報酬の源泉徴収 10.21% (100万円超の部分 20.42%, 所得税法 第204条・第205条).
// - China 经营所得 (个人所得税法 第3条・第6条, 实施条例 第15条): 5%–35% 五级超额累进; 没有综合所得的, 减除
//   60,000元、专项扣除、专项附加扣除和其他扣除. 个体工商户 年应纳税所得额不超过200万元的部分减半征收
//   (财政部 税务总局公告2023年第12号, 至2027-12-31; 减免税额 = 不超过200万元部分的应纳税额 × 50%, 税务总局
//   公告2023年第5号). 劳务报酬 预扣: 每次收入 ≤4,000元 减800元, 以上减20%; 预扣率 20%/30%/40%
//   (速算扣除 0/2,000/7,000, 国家税务总局公告2018年第61号).
// - France micro-entrepreneur 2026: cotisations sociales vente 12,3 %, BIC services 21,2 %, BNC (SSI) 25,6 %
//   (décret 2025-943, au lieu des 26,1 % prévus par le décret 2024-484), BNC Cipav 23,2 %; CFP 0,1 % commerçants,
//   0,3 % artisans, 0,2 % libéraux; versement libératoire 1 % / 1,7 % / 2,2 % (RFR N-2 ≤ 29 315 € par part).
//   ACRE: −50 % la première année, −25 % pour les créations à partir du 1er juillet 2026 (décret 2026-69).
//   Sources: legisocial.fr (cotisations auto-entrepreneurs 2026), salaireclair.fr (2026), legifiscal.fr.
//   Sans versement libératoire, l'impôt est la hausse du barème (2026) due au revenu micro après abattement.
// - Spain autónomo 2026: cuota por tramos de rendimientos netos mensuales (bases mínimas de 2025 prorrogadas),
//   tipo 31,5 % (con MEI 0,9 %); rendimiento computable = (ingresos − gastos) − 7 % de gastos genéricos
//   (art. 308 LGSS). Tarifa plana 80 €/mes los primeros 12 meses. IRPF estimación directa simplificada:
//   rendimiento neto previo − 5 % de gastos de difícil justificación (máx. 2.000 €; Manual Renta 2025 AEAT),
//   escala general 2026; retención en factura 15 % (7 % el año de inicio y los dos siguientes).
//   Sources: declarando.es (tabla 2026), ultimahora.es 2026-01-01 (cuotas 2026 = 2025, MEI 0,9 %),
//   sede.agenciatributaria.gob.es/Sede/Ayuda/25Presentacion/100/7_4_2.html.

import { japanIncomeTax, type JpBlueDeduction } from "./comprehensive-income-tax-countries.ts";
import { franceIncomeTax, spainGeneralQuota, spainPersonalMinimum } from "./year-end-settlement-countries.ts";

export type FreelancerCountry = "jp" | "cn" | "fr" | "es";

export const FREELANCER_TAX_AS_OF = "2026-10-20";

const floorTo = (n: number, unit: number) => Math.floor(n / unit) * unit;
const r2 = (n: number) => Math.round(n * 100) / 100;
const pos = (n: number) => Math.max(0, Number.isFinite(n) ? n : 0);

// ── Japan ────────────────────────────────────────────────────────────────

export const JP_NATIONAL_PENSION_MONTHLY_2026 = 17_920;

/** 報酬・料金の源泉徴収税額: 100万円以下 10.21%, 超える部分 20.42%. */
export function jpFeeWithholding(fee: number) {
  const f = pos(fee);
  return Math.floor(Math.min(f, 1_000_000) * 0.1021 + Math.max(0, f - 1_000_000) * 0.2042);
}

/** 個人事業税: (青色申告特別控除前の事業所得 − 事業主控除290万円) × 税率. */
export function jpEnterpriseTax(incomeBeforeBlue: number, rate: number) {
  return floorTo(pos(floorTo(incomeBeforeBlue, 1000) - 2_900_000) * rate, 100);
}

export interface JapanFreelanceInput {
  revenue: number;
  expenses: number;
  blueDeduction: JpBlueDeduction;
  /** 国民健康保険料 (市区町村の試算額) */
  healthInsurance: number;
  /** 国民年金保険料 (年額) */
  pension: number;
  otherDeductions: number;
  spouse: boolean;
  dependents: number;
  /** 個人事業税の税率 (0 = 法定業種外) */
  enterpriseRate: number;
  /** 源泉徴収された所得税・予定納税 */
  withheld: number;
}

export function japanFreelance(i: JapanFreelanceInput) {
  const tax = japanIncomeTax({
    salary: 0,
    businessRevenue: i.revenue,
    businessExpenses: i.expenses,
    blueDeduction: i.blueDeduction,
    otherIncome: 0,
    socialInsurance: pos(i.healthInsurance) + pos(i.pension),
    otherDeductions: i.otherDeductions,
    spouse: i.spouse,
    dependents: i.dependents,
    specificDependents: 0,
  });
  const enterpriseTax = jpEnterpriseTax(i.revenue - i.expenses, i.enterpriseRate);
  const social = pos(i.healthInsurance) + pos(i.pension);
  const burden = tax.incomeTax + tax.residentTax + enterpriseTax + social;
  const takeHome = i.revenue - i.expenses - burden;
  return { ...tax, enterpriseTax, social, burden, takeHome, balance: tax.incomeTax - pos(i.withheld) };
}

// ── China ────────────────────────────────────────────────────────────────

/** 经营所得税率表: [上限, 税率, 速算扣除数]. */
export const CN_BUSINESS_BRACKETS: [number, number, number][] = [
  [30_000, 0.05, 0],
  [90_000, 0.1, 1_500],
  [300_000, 0.2, 10_500],
  [500_000, 0.3, 40_500],
  [Infinity, 0.35, 65_500],
];

export function chinaBusinessTax(taxable: number) {
  if (taxable <= 0) return 0;
  const [, rate, quick] = CN_BUSINESS_BRACKETS.find(([upper]) => taxable <= upper) ?? CN_BUSINESS_BRACKETS[CN_BUSINESS_BRACKETS.length - 1];
  return r2(taxable * rate - quick);
}

export interface ChinaFreelanceInput {
  revenue: number;
  costs: number;
  /** 同时取得综合所得 (工资等) 的, 60,000元和专项扣除在综合所得中减除 */
  hasComprehensive: boolean;
  socialInsurance: number;
  specialAdditional: number;
  other: number;
  /** 个体工商户: 不超过200万元部分减半征收 */
  selfEmployedHalf: boolean;
  prepaid: number;
}

export function chinaFreelance(i: ChinaFreelanceInput) {
  const allowances = i.hasComprehensive ? 0 : 60_000 + pos(i.socialInsurance) + pos(i.specialAdditional) + pos(i.other);
  const taxable = r2(pos(i.revenue - i.costs - allowances));
  const tax = chinaBusinessTax(taxable);
  const relief = i.selfEmployedHalf ? r2(chinaBusinessTax(Math.min(taxable, 2_000_000)) * 0.5) : 0;
  const due = r2(tax - relief);
  return { allowances, taxable, tax, relief, due, balance: r2(due - pos(i.prepaid)) };
}

/** 劳务报酬所得 每次预扣预缴. */
export function chinaLabourWithholding(payment: number) {
  const p = pos(payment);
  const base = p <= 4_000 ? pos(p - 800) : p * 0.8;
  const [rate, quick] = base <= 20_000 ? [0.2, 0] : base <= 50_000 ? [0.3, 2_000] : [0.4, 7_000];
  return { base: r2(base), rate, withheld: r2(pos(base * rate - quick)) };
}

// ── France ───────────────────────────────────────────────────────────────

export type FrMicroActivity = "vente" | "bic-services" | "bnc" | "cipav";

export const FR_MICRO_RATES_2026: Record<FrMicroActivity, { social: number; cfp: number; vfl: number; abattement: number }> = {
  vente: { social: 0.123, cfp: 0.001, vfl: 0.01, abattement: 0.71 },
  "bic-services": { social: 0.212, cfp: 0.003, vfl: 0.017, abattement: 0.5 },
  bnc: { social: 0.256, cfp: 0.002, vfl: 0.022, abattement: 0.34 },
  cipav: { social: 0.232, cfp: 0.002, vfl: 0.022, abattement: 0.34 },
};

export interface FranceMicroInput {
  turnover: number;
  activity: FrMicroActivity;
  /** Réduction ACRE sur les cotisations: 0, 0.5 (création avant le 1er juillet 2026) ou 0.25 */
  acre: number;
  versementLiberatoire: boolean;
  /** Autres revenus nets imposables du foyer (salaires après abattement, etc.) */
  otherHouseholdNet: number;
  couple: boolean;
  children: number;
}

export function franceMicro(i: FranceMicroInput) {
  const r = FR_MICRO_RATES_2026[i.activity];
  const ca = pos(i.turnover);
  const social = Math.round(ca * r.social * (1 - Math.min(0.5, pos(i.acre))));
  const cfp = Math.round(ca * r.cfp);
  const taxableMicro = Math.max(0, ca - Math.min(ca, Math.max(305, Math.round(ca * r.abattement))));
  const other = pos(i.otherHouseholdNet);
  const without = franceIncomeTax(other, i.couple, i.children).impot;
  const incomeTax = i.versementLiberatoire ? Math.round(ca * r.vfl) : franceIncomeTax(other + taxableMicro, i.couple, i.children).impot - without;
  const net = ca - social - cfp - incomeTax;
  return { social, cfp, taxableMicro, incomeTax, net, rates: r };
}

// ── Spain ────────────────────────────────────────────────────────────────

/** [límite superior del tramo de rendimientos netos mensuales, base mínima]. 2026 = bases de 2025. */
export const ES_AUTONOMO_TRAMOS_2026: [number, number][] = [
  [670, 653.59],
  [900, 718.95],
  [1_166.7, 849.67],
  [1_300, 950.98],
  [1_500, 960.78],
  [1_700, 960.78],
  [1_850, 1_143.79],
  [2_030, 1_209.15],
  [2_330, 1_274.51],
  [2_760, 1_356.21],
  [3_190, 1_437.91],
  [3_620, 1_519.61],
  [4_050, 1_601.31],
  [6_000, 1_732.03],
  [Infinity, 1_928.1],
];
export const ES_AUTONOMO_RATE_2026 = 0.315;
export const ES_TARIFA_PLANA = 80;

export function spainAutonomoQuota(annualIncome: number, annualExpenses: number, tarifaPlana: boolean) {
  const monthlyNet = r2((annualIncome - annualExpenses) * 0.93 / 12);
  const tramo = ES_AUTONOMO_TRAMOS_2026.findIndex(([upper]) => monthlyNet <= upper);
  const base = ES_AUTONOMO_TRAMOS_2026[tramo][1];
  const monthly = tarifaPlana ? ES_TARIFA_PLANA : r2(base * ES_AUTONOMO_RATE_2026);
  return { monthlyNet, tramo: tramo + 1, base, monthly, annual: r2(monthly * 12) };
}

export interface SpainAutonomoInput {
  income: number;
  expenses: number;
  tarifaPlana: boolean;
  /** Retención aplicada en factura: 0, 0.07 o 0.15 */
  withholdingRate: number;
  children: number;
  over65: boolean;
}

export function spainAutonomo(i: SpainAutonomoInput) {
  const quota = spainAutonomoQuota(i.income, i.expenses, i.tarifaPlana);
  const previous = r2(i.income - i.expenses - quota.annual);
  const hardToJustify = r2(Math.min(2_000, pos(previous) * 0.05));
  const base = r2(pos(previous - hardToJustify));
  const minimo = spainPersonalMinimum(i.children, i.over65);
  const cuota = spainGeneralQuota(base, minimo);
  const withheld = r2(pos(i.income) * pos(i.withholdingRate));
  const net = r2(i.income - i.expenses - quota.annual - cuota);
  return { quota, previous, hardToJustify, base, minimo, cuota, withheld, result: r2(cuota - withheld), net };
}
