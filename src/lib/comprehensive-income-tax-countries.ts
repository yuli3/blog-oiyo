// Annual income tax on combined income, for the non-Korean pages of the comprehensive income tax calculator.
// Each locale page uses its own country's law (세운 2026-10-19). The 2026 scales come from
// year-end-settlement-countries.ts. Checked 2026-10-20:
// - Japan 確定申告 (令和8年分): 合計所得 = 給与所得 + 事業所得 (青色申告特別控除 65万/55万/10万円、事業所得が上限)
//   + その他の所得. 所得税 = 速算表 × 102.1% (復興特別所得税), 100円未満切捨て. 住民税 (令和9年度) 所得割 10%
//   (基礎控除43万円、配偶者・一般扶養33万円、特定扶養45万円), 調整控除 (人的控除差額: 基礎5万・配偶者5万・
//   一般扶養5万・特定扶養18万), 均等割 5,000円 (森林環境税1,000円を含む標準額). 令和9年度の住民税も給与所得控除
//   最低74万円、基礎控除は改正なし (仙台市 令和9年度税制改正). Sources: 国税庁 タックスアンサー No.2260, 2072,
//   1199; 地方税法 第314条の6 (調整控除).
// - China 综合所得年度汇算: 收入额 = 工资薪金 + 劳务报酬×80% + 特许权使用费×80% + 稿酬×80%×70%
//   (个人所得税法 第6条), 减除60,000元、专项扣除、专项附加扣除、其他扣除, 年度税率表 3%–45%.
// - France impôt sur le revenu (barème 2026, revenus 2025): salaires après abattement de 10 %, micro-BNC
//   abattement 34 %, micro-BIC services 50 %, micro-BIC vente 71 % (minimum 305 €, CGI art. 50-0 et 102 ter),
//   autres revenus nets catégoriels. Quotient familial plafonné et décote as in franceIncomeTax.
// - Spain IRPF base liquidable general: rendimientos del trabajo (reducción art. 20 solo si las demás rentas no
//   superan 6.500 €) + actividades económicas (rendimiento neto) + capital inmobiliario y otras rentas generales.
//   Escala general 2026 (estatal + autonómica supletoria). Base del ahorro no incluida.

import {
  chinaAnnualTax,
  ES_GENERAL_BANDS,
  franceIncomeTax,
  franceSalaryAbattement,
  jpBasicDeduction,
  jpEmploymentDeduction,
  jpIncomeTax,
  spainGeneralQuota,
  spainPersonalMinimum,
  spainWorkReduction,
} from "./year-end-settlement-countries.ts";

export type IncomeTaxCountry = "jp" | "cn" | "fr" | "es";

export const COMPREHENSIVE_INCOME_TAX_AS_OF = "2026-10-20";

const floorTo = (n: number, unit: number) => Math.floor(n / unit) * unit;
const r2 = (n: number) => Math.round(n * 100) / 100;
const pos = (n: number) => Math.max(0, Number.isFinite(n) ? n : 0);

// ── Japan ────────────────────────────────────────────────────────────────

export type JpBlueDeduction = 0 | 100_000 | 550_000 | 650_000;

export interface JapanIncomeInput {
  /** 給与・賞与の収入金額 */
  salary: number;
  /** 事業の売上 (収入金額) */
  businessRevenue: number;
  businessExpenses: number;
  /** 青色申告特別控除 (白色は0) */
  blueDeduction: JpBlueDeduction;
  /** 雑所得など、その他の所得金額 (経費控除後) */
  otherIncome: number;
  /** 社会保険料 (健康保険・年金など、本人が払った額) */
  socialInsurance: number;
  /** 生命保険料控除・医療費控除・小規模企業共済等掛金控除など、その他の所得控除 */
  otherDeductions: number;
  spouse: boolean;
  dependents: number;
  specificDependents: number;
}

/** 調整控除 (地方税法 第314条の6). 人的控除差額: 基礎5万・配偶者5万・一般扶養5万・特定扶養18万. */
export function jpAdjustmentCredit(residentTaxable: number, spouse: boolean, dependents: number, specificDependents: number) {
  const diff = 50_000 + (spouse ? 50_000 : 0) + pos(dependents) * 50_000 + pos(specificDependents) * 180_000;
  if (residentTaxable <= 0) return 0;
  if (residentTaxable <= 2_000_000) return Math.floor(Math.min(diff, residentTaxable) * 0.05);
  return Math.floor(Math.max(diff - (residentTaxable - 2_000_000), 50_000) * 0.05);
}

/** 所得税・復興特別所得税と住民税 (所得割＋均等割). */
export function japanIncomeTax(i: JapanIncomeInput) {
  const employmentIncome = pos(i.salary) > 0 ? pos(i.salary - jpEmploymentDeduction(pos(i.salary))) : 0;
  const businessBefore = i.businessRevenue - i.businessExpenses;
  const blue = Math.min(i.blueDeduction, pos(businessBefore));
  const businessIncome = businessBefore - blue;
  const totalIncome = pos(employmentIncome + businessIncome + i.otherIncome);
  const basic = jpBasicDeduction(totalIncome);
  const spouse = i.spouse && totalIncome <= 9_000_000;
  const common = pos(i.socialInsurance) + pos(i.otherDeductions);
  const deductions = common + basic + (spouse ? 380_000 : 0) + pos(i.dependents) * 380_000 + pos(i.specificDependents) * 630_000;
  const taxable = floorTo(pos(totalIncome - deductions), 1000);
  const computed = jpIncomeTax(taxable);
  const incomeTax = floorTo(computed * 1.021, 100);
  // 住民税は翌年度 (令和9年度) に課税. 人的控除の額が所得税と異なる.
  const residentDeductions = common + 430_000 + (spouse ? 330_000 : 0) + pos(i.dependents) * 330_000 + pos(i.specificDependents) * 450_000;
  const residentTaxable = floorTo(pos(totalIncome - residentDeductions), 1000);
  const adjustment = jpAdjustmentCredit(residentTaxable, spouse, i.dependents, i.specificDependents);
  const incomeLevy = floorTo(pos(residentTaxable * 0.1 - adjustment), 100);
  const perCapita = totalIncome > 0 ? 5_000 : 0;
  const residentTax = incomeLevy + perCapita;
  return { employmentIncome, businessIncome, blue, totalIncome, basic, deductions, taxable, computed, incomeTax, residentTaxable, adjustment, incomeLevy, perCapita, residentTax, total: incomeTax + residentTax };
}

export interface JapanFilingInput extends JapanIncomeInput {
  /** 源泉徴収税額・予定納税額 */
  prepaid: number;
}

export function japanFiling(i: JapanFilingInput) {
  const r = japanIncomeTax(i);
  return { ...r, balance: r.incomeTax - pos(i.prepaid) };
}

// ── China ────────────────────────────────────────────────────────────────

export interface ChinaComprehensiveInput {
  wages: number;
  /** 劳务报酬 收入 */
  labour: number;
  /** 特许权使用费 收入 */
  royalties: number;
  /** 稿酬 收入 */
  authorFees: number;
  /** 专项扣除 (个人缴纳三险一金) */
  socialInsurance: number;
  /** 专项附加扣除 全年合计 */
  specialAdditional: number;
  /** 其他扣除 (个人养老金、商业健康险等) */
  other: number;
  prepaid: number;
}

export function chinaIncomeAmount(i: Pick<ChinaComprehensiveInput, "wages" | "labour" | "royalties" | "authorFees">) {
  return r2(pos(i.wages) + pos(i.labour) * 0.8 + pos(i.royalties) * 0.8 + pos(i.authorFees) * 0.8 * 0.7);
}

export function chinaComprehensive(i: ChinaComprehensiveInput) {
  const incomeAmount = chinaIncomeAmount(i);
  const taxable = r2(pos(incomeAmount - 60_000 - pos(i.socialInsurance) - pos(i.specialAdditional) - pos(i.other)));
  const due = chinaAnnualTax(taxable);
  return { incomeAmount, taxable, due, balance: r2(due - pos(i.prepaid)) };
}

// ── France ───────────────────────────────────────────────────────────────

export type FrMicroKind = "bnc" | "bic-services" | "bic-vente";

export const FR_MICRO_ABATTEMENT: Record<FrMicroKind, number> = { bnc: 0.34, "bic-services": 0.5, "bic-vente": 0.71 };

/** Revenu imposable d'une micro-entreprise au régime micro-fiscal (abattement forfaitaire, minimum 305 €). */
export function franceMicroIncome(turnover: number, kind: FrMicroKind) {
  const ca = pos(turnover);
  return Math.max(0, ca - Math.min(ca, Math.max(305, Math.round(ca * FR_MICRO_ABATTEMENT[kind]))));
}

export interface FranceIncomeInput {
  /** Salaires nets imposables du foyer */
  salaries: number;
  /** Recettes d'une micro-entreprise (régime micro-fiscal, sans versement libératoire) */
  microTurnover: number;
  microKind: FrMicroKind;
  /** Autres revenus nets imposables (bénéfices au réel, revenus fonciers, pensions après abattement) */
  otherNet: number;
  couple: boolean;
  children: number;
  /** Prélèvement à la source et acomptes déjà payés */
  prepaid: number;
}

export function franceComprehensive(i: FranceIncomeInput) {
  const abattement = pos(i.salaries) > 0 ? franceSalaryAbattement(pos(i.salaries), i.couple ? 2 : 1) : 0;
  const salaryNet = pos(i.salaries) - abattement;
  const microNet = franceMicroIncome(i.microTurnover, i.microKind);
  const revenu = Math.round(salaryNet + microNet + pos(i.otherNet));
  const t = franceIncomeTax(revenu, i.couple, i.children);
  return { abattement, salaryNet, microNet, revenu, ...t, balance: t.impot - Math.round(pos(i.prepaid)) };
}

// ── Spain ────────────────────────────────────────────────────────────────

export interface SpainIncomeInput {
  grossSalary: number;
  socialSecurity: number;
  /** Rendimiento neto de actividades económicas */
  activityNet: number;
  /** Rendimiento neto del capital inmobiliario y otras rentas de la base general */
  otherGeneral: number;
  children: number;
  over65: boolean;
  /** Retenciones y pagos fraccionados */
  prepaid: number;
}

export function spainComprehensive(i: SpainIncomeInput) {
  const hasWork = pos(i.grossSalary) > 0;
  const workNetPrevious = hasWork ? pos(i.grossSalary - pos(i.socialSecurity)) : 0;
  const workNet = hasWork ? pos(workNetPrevious - 2_000) : 0;
  // art. 20 LIRPF: la reducción solo se aplica si las rentas distintas del trabajo no superan 6.500 €.
  const otherRents = i.activityNet + i.otherGeneral;
  const reduction = hasWork && otherRents <= 6_500 ? r2(Math.min(workNet, pos(spainWorkReduction(workNetPrevious)))) : 0;
  const base = r2(pos(workNet - reduction + i.activityNet + i.otherGeneral));
  const minimo = spainPersonalMinimum(i.children, i.over65);
  const cuota = spainGeneralQuota(base, minimo);
  const marginal = (ES_GENERAL_BANDS.find(([upper]) => base <= upper) ?? ES_GENERAL_BANDS[ES_GENERAL_BANDS.length - 1])[1];
  return { workNet, reduction, base, minimo, cuota, marginal, effective: base > 0 ? cuota / base : 0, result: r2(cuota - pos(i.prepaid)) };
}
