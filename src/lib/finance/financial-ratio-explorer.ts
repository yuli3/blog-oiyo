// Ported from oiyo.net's FinancialRatioExplorer (src/lib/finance/financial-ratios.ts)
// when oiyo's standalone /financial-ratios/ tool was archived in favor of this
// blog-native educational widget (2026-08-25).
export function computeRatioPercent(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    throw new RangeError("ratio inputs must be finite and denominator must be non-zero");
  }
  return (numerator / denominator) * 100;
}
