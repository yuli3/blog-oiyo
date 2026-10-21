export type IsaComparisonInput = {
  type: 'normal' | 'eligible';
  taxableProfit: string;
  deductibleLoss: string;
};

// 2026-10-18 조특법91의18: 금융회사가 확인한 과세/통산 대상 금액만 비교한다.
// 상품별 과표손익 계산이나 가입자격 판정은 이 함수의 입력에서 추론하지 않는다.
export function compareIsaTax(input: IsaComparisonInput) {
  // 정수 원 단위만 허용한다. 빈칸/음수/지수표기를 0이나 유효금액으로 강제하지 않는다.
  if (![input.taxableProfit, input.deductibleLoss].every(value => /^\d+$/.test(value) && Number.isSafeInteger(Number(value)))) {
    return { ok: false as const, error: '금액은 0 이상의 안전한 원 단위 정수로 입력해 주세요.' };
  }
  const profit = Number(input.taxableProfit);
  const loss = Number(input.deductibleLoss);
  const netProfit = Math.max(0, profit - loss);
  const taxFreeLimit = input.type === 'eligible' ? 4000000 : 2000000;
  const taxFreePortion = Math.min(netProfit, taxFreeLimit);
  const taxableExcess = Math.max(0, netProfit - taxFreePortion);
  const normalAccountTax = Math.round(profit * 0.154);
  const isaTax = Math.round(taxableExcess * 0.099);
  return { ok: true as const, profit, loss, netProfit, taxFreeLimit, taxFreePortion, taxableExcess,
    normalAccountTax, isaTax, taxSaved: normalAccountTax - isaTax,
    normalNetProfit: profit - normalAccountTax - loss, isaNetProfit: profit - loss - isaTax,
    taxSavingRate: normalAccountTax > 0 ? (normalAccountTax - isaTax) / normalAccountTax * 100 : 0 };
}
