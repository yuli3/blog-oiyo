// Simplified Korean take-home pay estimate: 4 social insurances + earned-income tax
// withholding approximation. Matches the 2024 simplified withholding table basis
// stated in the SalaryCalculator UI copy ("2024년 기준"). Reference/estimate only —
// actual withholding depends on company policy and individual tax credits.

export interface SalaryBreakdown {
  gross: number;
  pension: number;
  health: number;
  ltc: number;
  employment: number;
  incomeTax: number;
  localTax: number;
  totalDed: number;
  net: number;
  effectiveRate: string;
}

export function computeIncomeTax(monthlyTaxable: number, dependents: number): number {
  const annual = monthlyTaxable * 12;
  let tax = 0;
  if (annual <= 14000000) tax = annual * 0.06;
  else if (annual <= 50000000) tax = 840000 + (annual - 14000000) * 0.15;
  else if (annual <= 88000000) tax = 6240000 + (annual - 50000000) * 0.24;
  else if (annual <= 150000000) tax = 15360000 + (annual - 88000000) * 0.35;
  else if (annual <= 300000000) tax = 37060000 + (annual - 150000000) * 0.38;
  else tax = 94060000 + (annual - 300000000) * 0.40;

  const deduction = dependents * 1500000;
  tax = Math.max(0, tax - deduction * 0.15);
  return Math.max(0, Math.round(tax / 12));
}

/** grossManwon/nonTaxableManwon are in units of 10,000 KRW (만원), matching the UI sliders. */
export function computeSalaryBreakdown(grossManwon: number, dependents: number, nonTaxableManwon: number): SalaryBreakdown {
  const grossKRW = grossManwon * 10000;
  const nonTaxableKRW = nonTaxableManwon * 10000;
  const taxableBase = grossKRW - nonTaxableKRW;

  const pension = Math.round(grossKRW * 0.045);
  const health = Math.round(grossKRW * 0.03545);
  const ltc = Math.round(health * 0.1281);
  const employment = Math.round(grossKRW * 0.009);
  const incomeTax = computeIncomeTax(taxableBase, dependents);
  const localTax = Math.round(incomeTax * 0.1);

  const totalDed = pension + health + ltc + employment + incomeTax + localTax;
  const net = grossKRW - totalDed;
  const effectiveRate = ((totalDed / grossKRW) * 100).toFixed(1);

  return { gross: grossKRW, pension, health, ltc, employment, incomeTax, localTax, totalDed, net, effectiveRate };
}
