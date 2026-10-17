import React, { useState, useMemo } from 'react';

// 원리금균등상환 연간 상환액 수식
function calculateAnnualPayment(principal: number, annualRatePercent: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0;
  const r = annualRatePercent / 100 / 12;
  const n = years * 12;
  if (r === 0) return Math.round(principal / years);
  const monthlyPayment = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(monthlyPayment * 12);
}

// 주어진 연간 허용 상환액(DSR 한도)으로부터 역산하는 최대 대출 가능 원금
function calculateMaxPrincipalFromPayment(annualPaymentLimit: number, annualRatePercent: number, years: number): number {
  if (annualPaymentLimit <= 0 || years <= 0) return 0;
  const monthlyPaymentLimit = annualPaymentLimit / 12;
  const r = annualRatePercent / 100 / 12;
  const n = years * 12;
  if (r === 0) return Math.round(monthlyPaymentLimit * n);
  const principal = (monthlyPaymentLimit * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n));
  return Math.round(principal);
}

export default function DsrMortgageCalculator() {
  const [housePrice, setHousePrice] = useState<number>(800000000); // 8억원
  const [annualIncome, setAnnualIncome] = useState<number>(60000000); // 6,000만원
  const [existingDebtAnnualPayment, setExistingDebtAnnualPayment] = useState<number>(5000000); // 연 500만원
  const [interestRate, setInterestRate] = useState<number>(4.0); // 4.0%
  const [loanYears, setLoanYears] = useState<number>(30); // 30년
  const [region, setRegion] = useState<'capital' | 'nonCapital'>('capital'); // 수도권 vs 비수도권
  const [isRegulatedArea, setIsRegulatedArea] = useState<boolean>(false); // 규제지역(투기과열지구) 여부

  const calculation = useMemo(() => {
    // 1. 스트레스 금리 2단계 가산폭 (수도권 1.2%p, 비수도권 0.75%p)
    const stressRateAddon = region === 'capital' ? 1.2 : 0.75;
    const stressedRate = interestRate + stressRateAddon;

    // 2. LTV 기준 한도
    const maxLtvPercent = isRegulatedArea ? 50 : 70;
    const maxLtvAmount = Math.round(housePrice * (maxLtvPercent / 100));

    // 3. DSR 기준 한도 (은행권 40%)
    const dsrMaxAnnualPayment = annualIncome * 0.4;
    const availableAnnualPayment = Math.max(0, dsrMaxAnnualPayment - existingDebtAnnualPayment);

    // 일반 DSR 기준 최대 한도 (스트레스 금리 미적용)
    const normalDsrPrincipal = calculateMaxPrincipalFromPayment(availableAnnualPayment, interestRate, loanYears);

    // 스트레스 DSR 2단계 기준 최대 한도 (스트레스 금리 적용)
    const stressedDsrPrincipal = calculateMaxPrincipalFromPayment(availableAnnualPayment, stressedRate, loanYears);

    // 한도 축소액
    const dsrReductionAmount = Math.max(0, normalDsrPrincipal - stressedDsrPrincipal);

    // 4. 최종 실행 가능 대출액 (LTV 한도와 스트레스 DSR 한도 중 작은 값)
    const finalMaxLoan = Math.min(maxLtvAmount, stressedDsrPrincipal);

    // 최종 실행 시 실제 연간 상환액 (기존 실제 금리 기준)
    const finalAnnualPayment = calculateAnnualPayment(finalMaxLoan, interestRate, loanYears);
    const finalMonthlyPayment = Math.round(finalAnnualPayment / 12);
    const finalDsr = annualIncome > 0
      ? ((finalAnnualPayment + existingDebtAnnualPayment) / annualIncome) * 100
      : 0;

    return {
      stressRateAddon,
      stressedRate,
      maxLtvPercent,
      maxLtvAmount,
      availableAnnualPayment,
      normalDsrPrincipal,
      stressedDsrPrincipal,
      dsrReductionAmount,
      finalMaxLoan,
      finalAnnualPayment,
      finalMonthlyPayment,
      finalDsr,
    };
  }, [housePrice, annualIncome, existingDebtAnnualPayment, interestRate, loanYears, region, isRegulatedArea]);

  const formatWon = (val: number) => Math.round(val).toLocaleString('ko-KR') + '원';
  const formatEok = (val: number) => {
    const eok = Math.floor(val / 100000000);
    const man = Math.floor((val % 100000000) / 10000);
    if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString('ko-KR')}만 원`;
    if (eok > 0) return `${eok}억 원`;
    return `${man.toLocaleString('ko-KR')}만 원`;
  };

  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          스트레스 DSR 2단계 규제 완벽 적용
        </span>
        <h2 className="mt-2 text-2xl font-black text-foreground">
          주택담보대출 LTV · 스트레스 DSR 2단계 한도 계산기
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          수도권(+1.2%p) 및 비수도권(+0.75%p) 가산 스트레스 금리를 반영하여 실제 대출 한도와 줄어드는 금액을 시뮬레이션합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-foreground">주택 매매 가격 (원)</label>
          <input
            type="number"
            min="0"
            step="10000000"
            value={housePrice}
            onChange={(e) => setHousePrice(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="text-xs text-muted-foreground">{formatEok(housePrice)}</span>
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground">연소득 (세전, 원)</label>
          <input
            type="number"
            min="0"
            step="5000000"
            value={annualIncome}
            onChange={(e) => setAnnualIncome(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="text-xs text-muted-foreground">{formatEok(annualIncome)}</span>
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground">기존 대출 연간 원리금상환액 (원)</label>
          <input
            type="number"
            min="0"
            step="1000000"
            value={existingDebtAnnualPayment}
            onChange={(e) => setExistingDebtAnnualPayment(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="text-xs text-muted-foreground">신용대출·마통·차량할부 등 (연 {formatEok(existingDebtAnnualPayment)})</span>
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground">대출 금리 (%) & 만기 (년)</label>
          <div className="mt-1 flex gap-2">
            <input
              type="number"
              step="0.1"
              min="1"
              max="15"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value) || 0)}
              className="w-1/2 rounded-xl border border-input bg-background px-3 py-2 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={loanYears}
              onChange={(e) => setLoanYears(Number(e.target.value))}
              className="w-1/2 rounded-xl border border-input bg-background px-3 py-2 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={20}>20년</option>
              <option value={30}>30년</option>
              <option value={40}>40년</option>
              <option value={50}>50년</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground">주택 소재지 (스트레스 2단계 구분)</label>
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={() => setRegion('capital')}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                region === 'capital' ? 'bg-primary text-primary-foreground shadow-xs' : 'border border-border bg-card text-muted-foreground'
              }`}
            >
              수도권 (+1.2%p)
            </button>
            <button
              type="button"
              onClick={() => setRegion('nonCapital')}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                region === 'nonCapital' ? 'bg-primary text-primary-foreground shadow-xs' : 'border border-border bg-card text-muted-foreground'
              }`}
            >
              비수도권 (+0.75%p)
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground">규제지역 여부</label>
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={() => setIsRegulatedArea(false)}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                !isRegulatedArea ? 'bg-primary text-primary-foreground shadow-xs' : 'border border-border bg-card text-muted-foreground'
              }`}
            >
              비규제 (LTV 70%)
            </button>
            <button
              type="button"
              onClick={() => setIsRegulatedArea(true)}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                isRegulatedArea ? 'bg-primary text-primary-foreground shadow-xs' : 'border border-border bg-card text-muted-foreground'
              }`}
            >
              규제지역 (LTV 50%)
            </button>
          </div>
        </div>
      </div>

      {/* Main Result */}
      <div className="mt-6 rounded-2xl border border-border bg-secondary p-5">
        <p className="text-xs font-bold text-secondary-foreground">최종 최대 대출 가능 금액</p>
        <p className="mt-1 text-3xl font-black text-primary">
          {formatEok(calculation.finalMaxLoan)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          실제 월 상환액: 약 {formatWon(calculation.finalMonthlyPayment)} / 월 (연 {formatWon(calculation.finalAnnualPayment)}, DSR {calculation.finalDsr.toFixed(1)}%)
        </p>
      </div>

      {/* Comparison Grid */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
        <div className="rounded-xl border border-border p-4 bg-card">
          <p className="text-muted-foreground">일반 DSR 한도 (금리 {interestRate}%)</p>
          <p className="mt-1 text-base font-black text-foreground">{formatEok(calculation.normalDsrPrincipal)}</p>
        </div>
        <div className="rounded-xl border border-border p-4 bg-card">
          <p className="text-muted-foreground">스트레스 DSR 한도 (가산 {calculation.stressedRate.toFixed(2)}%)</p>
          <p className="mt-1 text-base font-black text-chart-5">{formatEok(calculation.stressedDsrPrincipal)}</p>
          <p className="mt-0.5 text-xs text-destructive">▼ {formatEok(calculation.dsrReductionAmount)} 한도 감소</p>
        </div>
      </div>
    </div>
  );
}
