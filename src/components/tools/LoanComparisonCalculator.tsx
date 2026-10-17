import React, { useState, useMemo } from 'react';
import { TrendingDown } from 'lucide-react';

interface Props {
  locale: string;
}

export default function LoanComparisonCalculator({ locale = 'ko' }: Props) {
  const isKo = locale === 'ko';

  const [principal, setPrincipal] = useState<number>(200000000); // 2억원
  const [annualRate, setAnnualRate] = useState<number>(4.2); // 4.2%
  const [loanYears, setLoanYears] = useState<number>(30); // 30년
  const [graceMonths, setGraceMonths] = useState<number>(0); // 거치기간 0개월

  const totalMonths = loanYears * 12;

  const comparison = useMemo(() => {
    const P = principal;
    const r = (annualRate / 100) / 12;
    const n = Math.max(1, totalMonths - graceMonths);

    // 1. Equal PI (원리금균등)
    let equalPiFirstMonth = 0;
    let equalPiLastMonth = 0;
    let equalPiTotalInterest = 0;

    if (r > 0) {
      const factor = Math.pow(1 + r, n);
      const monthlyPayment = (P * r * factor) / (factor - 1);
      equalPiFirstMonth = graceMonths > 0 ? P * r : monthlyPayment;
      equalPiLastMonth = monthlyPayment;
      equalPiTotalInterest = (graceMonths * P * r) + (monthlyPayment * n - P);
    } else {
      equalPiFirstMonth = P / n;
      equalPiLastMonth = P / n;
      equalPiTotalInterest = 0;
    }

    // 2. Equal P (원금균등)
    const monthlyPrincipal = P / n;
    const equalPFirstInterest = P * r;
    const equalPLastInterest = monthlyPrincipal * r;
    const equalPFirstMonth = graceMonths > 0 ? P * r : (monthlyPrincipal + equalPFirstInterest);
    const equalPLastMonth = monthlyPrincipal + equalPLastInterest;
    const equalPTotalInterest = (graceMonths * P * r) + (((n + 1) * P * r) / 2);

    // 3. Bullet (만기일시)
    const bulletMonthly = P * r;
    const bulletTotalInterest = P * r * totalMonths;

    // Savings comparing Equal P vs Equal PI
    const savings = Math.max(0, equalPiTotalInterest - equalPTotalInterest);

    return {
      equalPi: {
        firstMonth: Math.round(equalPiFirstMonth),
        lastMonth: Math.round(equalPiLastMonth),
        totalInterest: Math.round(equalPiTotalInterest),
        totalPayment: Math.round(P + equalPiTotalInterest),
      },
      equalP: {
        firstMonth: Math.round(equalPFirstMonth),
        lastMonth: Math.round(equalPLastMonth),
        totalInterest: Math.round(equalPTotalInterest),
        totalPayment: Math.round(P + equalPTotalInterest),
      },
      bullet: {
        firstMonth: Math.round(bulletMonthly),
        lastMonth: Math.round(P + bulletMonthly),
        totalInterest: Math.round(bulletTotalInterest),
        totalPayment: Math.round(P + bulletTotalInterest),
      },
      savings: Math.round(savings),
      savingsPercent: equalPiTotalInterest > 0 ? Number(((savings / equalPiTotalInterest) * 100).toFixed(1)) : 0,
    };
  }, [principal, annualRate, totalMonths, graceMonths]);

  const formatWon = (val: number) => {
    return Math.round(val).toLocaleString('ko-KR') + (isKo ? '원' : ' KRW');
  };

  const toKoreanManWon = (val: number) => {
    const eok = Math.floor(val / 100000000);
    const man = Math.floor((val % 100000000) / 10000);
    let res = '';
    if (eok > 0) res += `${eok}억 `;
    if (man > 0) res += `${man.toLocaleString('ko-KR')}만 `;
    return res.trim() + '원';
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-8">
      {/* Input Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="text-xs font-bold text-foreground block mb-1.5">
            {isKo ? '대출 원금' : 'Loan Principal'}
          </label>
          <input
            type="number"
            value={principal}
            step={10000000}
            onChange={(e) => setPrincipal(Number(e.target.value) || 0)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
          />
          <span className="text-xs text-muted-foreground mt-1 block">
            {toKoreanManWon(principal)}
          </span>
        </div>

        <div>
          <label className="text-xs font-bold text-foreground block mb-1.5">
            {isKo ? '연 이자율 (%)' : 'Annual Interest Rate (%)'}
          </label>
          <input
            type="number"
            value={annualRate}
            step={0.1}
            onChange={(e) => setAnnualRate(Number(e.target.value) || 0)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-foreground block mb-1.5">
            {isKo ? '대출 기간 (년)' : 'Duration (Years)'}
          </label>
          <select
            value={loanYears}
            onChange={(e) => setLoanYears(Number(e.target.value))}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
          >
            {[10, 15, 20, 25, 30, 35, 40].map((y) => (
              <option key={y} value={y}>
                {y}{isKo ? '년' : ' Years'} ({y * 12}{isKo ? '개월' : ' Mo'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-foreground block mb-1.5">
            {isKo ? '거치 기간 (개월)' : 'Grace Period (Months)'}
          </label>
          <input
            type="number"
            value={graceMonths}
            min={0}
            max={totalMonths - 1}
            onChange={(e) => setGraceMonths(Math.max(0, Number(e.target.value) || 0))}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
          />
          <span className="text-xs text-muted-foreground mt-1 block">
            {isKo ? '이자만 납부하는 기간' : 'Interest-only period'}
          </span>
        </div>
      </div>

      {/* Savings Highlight Banner */}
      <div className="p-5 rounded-2xl border border-success/20 bg-success/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-success/20 text-success">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-success">
              {isKo ? '원금균등 상환 선택 시 이자 절감액' : 'Interest Saved with Equal Principal'}
            </div>
            <div className="text-xl sm:text-2xl font-black text-success">
              {formatWon(comparison.savings)}
              <span className="text-xs font-bold ml-2">({comparison.savingsPercent}% {isKo ? '절감' : 'saved'})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Equal PI */}
        <div className="rounded-xl border border-border bg-background p-5 space-y-4">
          <div className="border-b border-border pb-3">
            <span className="inline-block text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md mb-1.5">
              {isKo ? '가장 대중적' : 'Most Popular'}
            </span>
            <h3 className="text-base font-bold text-foreground">
              {isKo ? '원리금균등분할' : 'Equal P + I'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isKo ? '매달 동일한 원리금을 안정적으로 납부' : 'Fixed predictable monthly payments'}
            </p>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{isKo ? '첫 회차 납입액' : 'First Payment'}:</span>
              <span className="font-bold text-foreground">{formatWon(comparison.equalPi.firstMonth)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{isKo ? '마지막 회차' : 'Last Payment'}:</span>
              <span className="font-bold text-foreground">{formatWon(comparison.equalPi.lastMonth)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-semibold">
              <span className="text-muted-foreground">{isKo ? '총 납부 이자' : 'Total Interest'}:</span>
              <span className="font-bold text-foreground">{formatWon(comparison.equalPi.totalInterest)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-sm">
              <span className="font-bold text-foreground">{isKo ? '총 상환액' : 'Total Payout'}:</span>
              <span className="font-black text-primary">{formatWon(comparison.equalPi.totalPayment)}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Equal P */}
        <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-5 space-y-4 relative">
          <div className="border-b border-primary/20 pb-3">
            <span className="inline-block text-xs font-bold text-success bg-success/20 px-2 py-0.5 rounded-md mb-1.5">
              {isKo ? '총 이자 최소' : 'Lowest Interest'}
            </span>
            <h3 className="text-base font-bold text-foreground">
              {isKo ? '원금균등분할' : 'Equal Principal'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isKo ? '초기 부담 크지만 갈수록 납입액 감소' : 'Highest first payment, decreasing monthly'}
            </p>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{isKo ? '첫 회차 납입액' : 'First Payment'}:</span>
              <span className="font-bold text-foreground">{formatWon(comparison.equalP.firstMonth)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{isKo ? '마지막 회차' : 'Last Payment'}:</span>
              <span className="font-bold text-success">{formatWon(comparison.equalP.lastMonth)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-semibold">
              <span className="text-muted-foreground">{isKo ? '총 납부 이자' : 'Total Interest'}:</span>
              <span className="font-bold text-success">{formatWon(comparison.equalP.totalInterest)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-sm">
              <span className="font-bold text-foreground">{isKo ? '총 상환액' : 'Total Payout'}:</span>
              <span className="font-black text-success">{formatWon(comparison.equalP.totalPayment)}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Bullet */}
        <div className="rounded-xl border border-border bg-background p-5 space-y-4">
          <div className="border-b border-border pb-3">
            <span className="inline-block text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md mb-1.5">
              {isKo ? '단기 운용' : 'Short Term'}
            </span>
            <h3 className="text-base font-bold text-foreground">
              {isKo ? '만기일시상환' : 'Bullet Loan'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isKo ? '기간 중 이자만 내고 만기에 원금 상환' : 'Interest-only until lump sum at maturity'}
            </p>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{isKo ? '매월 납부 이자' : 'Monthly Interest'}:</span>
              <span className="font-bold text-foreground">{formatWon(comparison.bullet.firstMonth)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{isKo ? '만기 원리금' : 'Maturity Lump Sum'}:</span>
              <span className="font-bold text-foreground">{formatWon(comparison.bullet.lastMonth)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-semibold">
              <span className="text-muted-foreground">{isKo ? '총 납부 이자' : 'Total Interest'}:</span>
              <span className="font-bold text-destructive">{formatWon(comparison.bullet.totalInterest)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-sm">
              <span className="font-bold text-foreground">{isKo ? '총 상환액' : 'Total Payout'}:</span>
              <span className="font-black text-foreground">{formatWon(comparison.bullet.totalPayment)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
