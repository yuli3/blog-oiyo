export interface ExchangeInput {
  foreignAmount: number;
  enteredRate: number;
  rateUnit: number;
  networkPercent: number;
  issuerPercent: number;
  issuerBasis: 'base' | 'base_plus_network';
  mode: 'offered_final' | 'assumed_markup';
  offeredFinalAmount: number;
  assumedDccMarkupPercent: number;
}

/** Comparison arithmetic only: rates and fees are user assumptions, never live quotes. */
export function compareForeignExchange(input: ExchangeInput) {
  const { foreignAmount, enteredRate, rateUnit, networkPercent, issuerPercent, issuerBasis, mode, offeredFinalAmount, assumedDccMarkupPercent } = input;
  const common = [foreignAmount, enteredRate, networkPercent, issuerPercent];
  if (!common.every(Number.isFinite) || foreignAmount < 0 || enteredRate <= 0 || ![1, 100].includes(rateUnit) || networkPercent < 0 || issuerPercent < 0) throw new RangeError('Invalid exchange input');
  if (!['base', 'base_plus_network'].includes(issuerBasis) || !['offered_final', 'assumed_markup'].includes(mode)) throw new RangeError('Invalid comparison mode');
  const selected = mode === 'offered_final' ? offeredFinalAmount : assumedDccMarkupPercent;
  if (!Number.isFinite(selected) || selected < 0) throw new RangeError('Invalid DCC input');
  const base = foreignAmount / rateUnit * enteredRate;
  const networkFee = base * networkPercent / 100;
  const issuerFee = (issuerBasis === 'base' ? base : base + networkFee) * issuerPercent / 100;
  const localScenario = base + networkFee + issuerFee;
  // WHY 2026-10-24: an offered fees-included total must not be surcharged a second time.
  const dccScenario = mode === 'offered_final' ? offeredFinalAmount : base * (1 + assumedDccMarkupPercent / 100);
  const delta = dccScenario - localScenario;
  if (![base, networkFee, issuerFee, localScenario, dccScenario, delta].every(Number.isFinite)) throw new RangeError('Amount exceeds supported range');
  return { base, networkFee, issuerFee, localScenario, dccScenario, delta };
}
