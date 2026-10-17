import React, { useState, useMemo } from 'react';

export default function IsaTaxSavingsCalculator() {
  const [isaType, setIsaType] = useState<'normal' | 'farmer_subprime'>('normal'); // 일반형 vs 서민형
  const [useExpandedLimit, setUseExpandedLimit] = useState<boolean>(false); // 2024~2026 개정안 확대 한도 (일반 500만, 서민 1,000만)

  const [grossProfits, setGrossProfits] = useState<number>(7000000); // 총 이익 (배당, 해외주식형 ETF 매매차익)
  const [grossLosses, setGrossLosses] = useState<number>(1500000); // 총 손실 (손익통산용)

  const calculation = useMemo(() => {
    const profit = Math.max(0, grossProfits);
    const loss = Math.max(0, grossLosses);
    const netProfit = Math.max(0, profit - loss); // 손익통산 순수익

    // 1. 일반 증권계좌 과세 (손익통산 불가, 총 이익 전액에 15.4% 과세)
    const normalAccountTax = Math.round(profit * 0.154);
    const normalNetProfit = profit - normalAccountTax - loss;

    // 2. ISA 비과세 한도 설정
    let taxFreeLimit = 2000000; // 일반형 기본 200만원
    if (isaType === 'farmer_subprime') {
      taxFreeLimit = useExpandedLimit ? 10000000 : 4000000; // 서민형 기본 400만원 (개정안 1,000만원)
    } else {
      taxFreeLimit = useExpandedLimit ? 5000000 : 2000000; // 일반형 기본 200만원 (개정안 500만원)
    }

    // 3. ISA 과세 (손익통산 순수익 기준)
    const taxFreePortion = Math.min(netProfit, taxFreeLimit);
    const taxableExcess = Math.max(0, netProfit - taxFreePortion);
    const isaTax = Math.round(taxableExcess * 0.099); // 초과분 9.9% 분리과세
    const isaNetProfit = netProfit - isaTax;

    // 4. 절세 혜택
    const taxSaved = Math.max(0, normalAccountTax - isaTax);
    const taxSavingRate = normalAccountTax > 0 ? (taxSaved / normalAccountTax) * 100 : 0;

    return {
      profit,
      loss,
      netProfit,
      normalAccountTax,
      normalNetProfit,
      taxFreeLimit,
      taxFreePortion,
      taxableExcess,
      isaTax,
      isaNetProfit,
      taxSaved,
      taxSavingRate,
    };
  }, [isaType, useExpandedLimit, grossProfits, grossLosses]);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
      {/* Account Type Selection */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-foreground">ISA 가입 유형 선택</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setIsaType('normal')}
            className={`rounded-xl p-3.5 text-left border transition-all ${
              isaType === 'normal'
                ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/20'
                : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
            }`}
          >
            <div className="font-bold text-sm text-foreground">일반형 ISA</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              비과세 {useExpandedLimit ? '500만 원' : '200만 원'} / 대한민국 거주자 누구나
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsaType('farmer_subprime')}
            className={`rounded-xl p-3.5 text-left border transition-all ${
              isaType === 'farmer_subprime'
                ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/20'
                : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
            }`}
          >
            <div className="font-bold text-sm text-foreground">서민형 / 농어민형 ISA</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              비과세 {useExpandedLimit ? '1,000만 원' : '400만 원'} / 총급여 5,000만 원 이하
            </div>
          </button>
        </div>

        {/* Reform Limit Toggle */}
        <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3 border border-border">
          <div>
            <span className="text-xs font-bold text-foreground">2024~2026 개정 세법 확대 한도 비교</span>
            <p className="text-xs text-muted-foreground">비과세 한도 2.5배 확대안 (일반형 500만 / 서민형 1,000만 원)</p>
          </div>
          <button
            type="button"
            onClick={() => setUseExpandedLimit(!useExpandedLimit)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              useExpandedLimit
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border'
            }`}
          >
            {useExpandedLimit ? '개정 확대안 적용 중' : '현행 세법 기준'}
          </button>
        </div>
      </div>

      {/* Profits & Losses Input */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-foreground mb-1">
            계좌 내 발생 이익 (배당금 + 해외ETF 매매차익)
          </label>
          <div className="relative">
            <input
              type="number"
              step="1000000"
              value={grossProfits}
              onChange={(e) => setGrossProfits(Number(e.target.value) || 0)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground focus:border-primary focus:outline-hidden"
            />
            <span className="absolute right-4 top-2.5 text-xs text-muted-foreground">원</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground mb-1">
            계좌 내 발생 손실 (해외ETF·펀드 매매차손)
          </label>
          <div className="relative">
            <input
              type="number"
              step="500000"
              value={grossLosses}
              onChange={(e) => setGrossLosses(Number(e.target.value) || 0)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground focus:border-primary focus:outline-hidden"
            />
            <span className="absolute right-4 top-2.5 text-xs text-muted-foreground">원</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            * 일반 계좌는 손실 공제 불가, ISA는 손익통산 전액 반영
          </p>
        </div>
      </div>

      {/* Comparison Result Cards */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-primary/10 pb-4 gap-2">
          <div>
            <span className="text-xs font-bold text-primary">ISA 계좌 순 절세 혜택</span>
            <div className="text-3xl font-black text-foreground">
              +{calculation.taxSaved.toLocaleString()} <span className="text-sm font-medium">원 절약</span>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-muted-foreground">세금 절감율</span>
            <div className="text-lg font-bold text-primary">{calculation.taxSavingRate.toFixed(1)} % 감면</div>
          </div>
        </div>

        {/* Head-to-Head Comparison */}
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Normal Account */}
          <div className="rounded-xl border border-border bg-background p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">일반 증권 계좌</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">손익통산 불가</span>
            </div>
            <div className="text-xl font-bold text-foreground">
              세금: <span className="text-destructive font-black">-{calculation.normalAccountTax.toLocaleString()}원</span>
            </div>
            <p className="text-xs text-muted-foreground">
              수익 전액 15.4% 원천징수 (손실 {calculation.loss.toLocaleString()}원 불인정)
            </p>
            <div className="pt-2 border-t border-border flex justify-between text-xs">
              <span className="text-muted-foreground">최종 실수령 순수익:</span>
              <span className="font-bold text-foreground">{calculation.normalNetProfit.toLocaleString()}원</span>
            </div>
          </div>

          {/* ISA Account */}
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary">ISA 절세 계좌</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-primary/20 text-primary font-bold">비과세 + 9.9% 분리과세</span>
            </div>
            <div className="text-xl font-bold text-foreground">
              세금: <span className="text-primary font-black">-{calculation.isaTax.toLocaleString()}원</span>
            </div>
            <p className="text-xs text-muted-foreground">
              순수익({calculation.netProfit.toLocaleString()}원) 중 {calculation.taxFreePortion.toLocaleString()}원 비과세, 초과분만 9.9%
            </p>
            <div className="pt-2 border-t border-primary/20 flex justify-between text-xs">
              <span className="text-muted-foreground">최종 실수령 순수익:</span>
              <span className="font-bold text-primary">{calculation.isaNetProfit.toLocaleString()}원</span>
            </div>
          </div>
        </div>

        {/* Additional Benefits Note */}
        <div className="rounded-lg bg-background/80 p-3 text-xs text-muted-foreground space-y-1 border border-border">
          <div className="font-bold text-foreground">💡 금융소득종합과세 방어 효과:</div>
          <div>
            ISA 계좌에서 발생한 이자 및 배당소득은 금액 크기에 상관없이 전액 9.9% 분리과세 종결되며,
            <strong> 5월 종합소득세 합산 대상(2,000만 원 기준) 및 건강보험료 피부양자 자격 심사 소득에 포함되지 않습니다.</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
