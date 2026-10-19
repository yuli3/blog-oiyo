import React, { useState } from 'react';
import { compareIsaTax } from '../../lib/finance/isa-tax-comparison';

export default function IsaTaxSavingsCalculator() {
  const [isaType, setIsaType] = useState<'normal' | 'farmer_subprime'>('normal'); // 일반형 vs 서민형

  const [grossProfits, setGrossProfits] = useState('7000000');
  const [grossLosses, setGrossLosses] = useState('1500000');
  const calculation = compareIsaTax({ type: isaType === 'normal' ? 'normal' : 'eligible', taxableProfit: grossProfits, deductibleLoss: grossLosses });

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
      {/* Account Type Selection */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-foreground">ISA 가입 유형 선택</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setIsaType('normal')}
            aria-pressed={isaType === 'normal'}
            className={`rounded-xl p-3.5 text-left border transition-all ${
              isaType === 'normal'
                ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/20'
                : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
            }`}
          >
            <div className="font-bold text-sm text-foreground">일반형 ISA</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              비과세 200만 원 / 연령·소득·가입 이력 요건 확인 필요
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsaType('farmer_subprime')}
            aria-pressed={isaType === 'farmer_subprime'}
            className={`rounded-xl p-3.5 text-left border transition-all ${
              isaType === 'farmer_subprime'
                ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/20'
                : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
            }`}
          >
            <div className="font-bold text-sm text-foreground">서민형 / 농어민형 ISA</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              비과세 400만 원 / 소득 및 유형별 요건 충족 시
            </div>
          </button>
        </div>

        <p className="text-xs text-muted-foreground">현행 200만·400만 원 한도로만 비교해요. 가입 요건과 3년 유지 등 특례 적용 조건을 충족했다고 가정해요.</p>
      </div>

      {/* Profits & Losses Input */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="isa-taxable-profit" className="block text-xs font-bold text-foreground mb-1">
            과세대상 이익 (일반계좌에서 15.4% 적용 가정)
          </label>
          <div className="relative">
            <input
              id="isa-taxable-profit"
              type="text"
              inputMode="numeric"
              aria-invalid={!calculation.ok}
              value={grossProfits}
              onChange={(e) => setGrossProfits(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground focus:border-primary focus:outline-hidden"
            />
            <span className="absolute right-4 top-2.5 text-xs text-muted-foreground">원</span>
          </div>
        </div>

        <div>
          <label htmlFor="isa-deductible-loss" className="block text-xs font-bold text-foreground mb-1">
            ISA 통산대상 손실 (금융회사 확인 금액)
          </label>
          <div className="relative">
            <input
              id="isa-deductible-loss"
              type="text"
              inputMode="numeric"
              aria-invalid={!calculation.ok}
              value={grossLosses}
              onChange={(e) => setGrossLosses(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground focus:border-primary focus:outline-hidden"
            />
            <span className="absolute right-4 top-2.5 text-xs text-muted-foreground">원</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            평가손실·모든 매매손실을 넣지 마세요. 상품별 과표와 통산 대상이 달라요.
          </p>
        </div>
      </div>

      {/* Comparison Result Cards */}
      {!calculation.ok ? <p role="alert" className="text-sm text-destructive">{calculation.error}</p> : <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-primary/10 pb-4 gap-2">
          <div>
            <span className="text-xs font-bold text-primary">가정에 따른 세금 차이</span>
            <div className="text-3xl font-black text-foreground">
              {calculation.taxSaved.toLocaleString()} <span className="text-sm font-medium">원</span>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-muted-foreground">가정상 세금 감소 비율</span>
            <div className="text-lg font-bold text-primary">{calculation.taxSavingRate.toFixed(1)} %</div>
          </div>
        </div>

        {/* Head-to-Head Comparison */}
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Normal Account */}
          <div className="rounded-xl border border-border bg-background p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">일반계좌 단순 가정</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">이 모형은 손실 미공제</span>
            </div>
            <div className="text-xl font-bold text-foreground">
              세금: <span className="text-destructive font-black">-{calculation.normalAccountTax.toLocaleString()}원</span>
            </div>
            <p className="text-xs text-muted-foreground">
              입력 이익에 15.4% 적용·입력 손실 {calculation.loss.toLocaleString()}원은 공제하지 않는 비교예요.
            </p>
            <div className="pt-2 border-t border-border flex justify-between text-xs">
              <span className="text-muted-foreground">모형상 세후 금액:</span>
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
              통산 후 과세 기준액({calculation.netProfit.toLocaleString()}원) 중 {calculation.taxFreePortion.toLocaleString()}원 비과세, 초과분만 9.9%
            </p>
            <div className="pt-2 border-t border-primary/20 flex justify-between text-xs">
              <span className="text-muted-foreground">모형상 세후 금액:</span>
              <span className="font-bold text-primary">{calculation.isaNetProfit.toLocaleString()}원</span>
            </div>
          </div>
        </div>

        {/* Additional Benefits Note */}
        <div className="rounded-lg bg-background/80 p-3 text-xs text-muted-foreground space-y-1 border border-border">
          <div className="font-bold text-foreground">결과를 읽을 때 확인하세요</div>
          <div>
            비과세 한도 이내는 비과세, 초과분은 9.9% 분리과세라는 단순 모형이에요.
            <strong> 전체 금융소득종합과세·건강보험 자격·실제 투자 순수익을 계산한 결과는 아니에요.</strong>
            상품별 과세손익과 수수료, 해지 조건은 금융회사에 확인하세요. 투자 원금손실 위험은 별도로 남아 있어요.
          </div>
        </div>
      </div>}
    </div>
  );
}
