import React, { useState, useMemo } from 'react';

// Statutory Inheritance & Gift Tax Rates in South Korea
// 소득세법 및 상속세및증여세법 제26조 (동일 5단계 초과누진세율)
function calculateBaseTax(taxBase: number): number {
  if (taxBase <= 0) return 0;
  if (taxBase <= 100000000) {
    return Math.round(taxBase * 0.1);
  } else if (taxBase <= 500000000) {
    return Math.round(taxBase * 0.2 - 10000000);
  } else if (taxBase <= 1000000000) {
    return Math.round(taxBase * 0.3 - 60000000);
  } else if (taxBase <= 3000000000) {
    return Math.round(taxBase * 0.4 - 160000000);
  } else {
    return Math.round(taxBase * 0.5 - 460000000);
  }
}

export default function InheritanceGiftTaxCalculator() {
  const [mode, setMode] = useState<'inheritance' | 'gift'>('inheritance');

  // --- Inheritance State ---
  const [estateTotal, setEstateTotal] = useState<number>(1200000000); // 총 상속재산 12억
  const [estateDebts, setEstateDebts] = useState<number>(100000000); // 채무·공과금 1억
  const [hasSpouse, setHasSpouse] = useState<boolean>(true); // 배우자 유무
  const [spouseInheritedAmount, setSpouseInheritedAmount] = useState<number>(500000000); // 배우자 실제 상속액
  const [financialAssets, setFinancialAssets] = useState<number>(200000000); // 순금융재산
  const [funeralExpense, setFuneralExpense] = useState<number>(10000000); // 장례비용

  // --- Gift State ---
  const [giftAmount, setGiftAmount] = useState<number>(150000000); // 증여가액 1.5억
  const [recipientRelation, setRecipientRelation] = useState<'spouse' | 'child_adult' | 'child_minor' | 'parent' | 'marriage_child' | 'relative'>('marriage_child');

  // Inheritance Calculation
  const inheritanceCalc = useMemo(() => {
    const total = Math.max(0, estateTotal);
    const debts = Math.max(0, estateDebts);
    const funeral = Math.min(10000000, Math.max(5000000, funeralExpense)); // 최소 500만 ~ 최대 1,000만

    const netEstate = Math.max(0, total - debts - funeral);

    // 1. 일괄공제 (5억원) vs 기초공제(2억원)+인적공제
    // 실무상 대부분 일괄공제 5억원 적용 (단, 배우자 단독 상속 시에는 일괄공제 배제되고 기초공제 2억만 적용)
    const lumpSumDeduction = hasSpouse ? 500000000 : 500000000;

    // 2. 배우자 상속공제 (법정 최소 5억원 ~ 최대 30억원)
    let spouseDeduction = 0;
    if (hasSpouse) {
      // 배우자가 실제로 상속받은 금액 기준 (최소 5억원 보장)
      spouseDeduction = Math.min(3000000000, Math.max(500000000, spouseInheritedAmount));
    }

    // 3. 금융재산 상속공제
    // 2천만원 이하: 전액, 1억원 이하: 2천만원, 1억원 초과: 20% (한도 2억원)
    let finDeduction = 0;
    const fin = Math.max(0, financialAssets);
    if (fin <= 20000000) {
      finDeduction = fin;
    } else if (fin <= 100000000) {
      finDeduction = 20000000;
    } else {
      finDeduction = Math.min(200000000, Math.round(fin * 0.2));
    }

    const totalDeductions = lumpSumDeduction + spouseDeduction + finDeduction;
    const taxBase = Math.max(0, netEstate - totalDeductions);
    const rawTax = calculateBaseTax(taxBase);
    const selfReportDiscount = Math.round(rawTax * 0.03); // 자진신고세액공제 3%
    const finalTax = Math.max(0, rawTax - selfReportDiscount);
    const effectiveRate = netEstate > 0 ? (finalTax / netEstate) * 100 : 0;

    return {
      netEstate,
      lumpSumDeduction,
      spouseDeduction,
      finDeduction,
      totalDeductions,
      taxBase,
      rawTax,
      selfReportDiscount,
      finalTax,
      effectiveRate,
    };
  }, [estateTotal, estateDebts, hasSpouse, spouseInheritedAmount, financialAssets, funeralExpense]);

  // Gift Calculation
  const giftCalc = useMemo(() => {
    const grossGift = Math.max(0, giftAmount);

    let deduction = 50000000;
    let label = '직계존속(성인 자녀)';

    if (recipientRelation === 'spouse') {
      deduction = 600000000; // 배우자 6억
      label = '배우자 (10년 누적 6억)';
    } else if (recipientRelation === 'child_adult') {
      deduction = 50000000; // 성인 직계비속 5천만
      label = '직계비속 성인 (10년 누적 5,000만)';
    } else if (recipientRelation === 'child_minor') {
      deduction = 20000000; // 미성년자 직계비속 2천만
      label = '직계비속 미성년 (10년 누적 2,000만)';
    } else if (recipientRelation === 'marriage_child') {
      deduction = 150000000; // 혼인·출산 특별공제 1억 + 기본 5천만 = 1.5억
      label = '혼인·출산 특별공제 (기본 5천만 + 특별 1억 = 1.5억)';
    } else if (recipientRelation === 'parent') {
      deduction = 50000000; // 직계존속 5천만
      label = '직계존속 (부모님 수증 5,000만)';
    } else if (recipientRelation === 'relative') {
      deduction = 10000000; // 기타 친족 1천만
      label = '기타 친족 (6촌이내 혈족·4촌이내 인척 1,000만)';
    }

    const taxBase = Math.max(0, grossGift - deduction);
    const rawTax = calculateBaseTax(taxBase);
    const selfReportDiscount = Math.round(rawTax * 0.03); // 자진신고공제 3%
    const finalTax = Math.max(0, rawTax - selfReportDiscount);
    const effectiveRate = grossGift > 0 ? (finalTax / grossGift) * 100 : 0;

    return {
      grossGift,
      deduction,
      label,
      taxBase,
      rawTax,
      selfReportDiscount,
      finalTax,
      effectiveRate,
    };
  }, [giftAmount, recipientRelation]);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
      {/* Mode Tab */}
      <div className="flex rounded-xl bg-muted p-1">
        <button
          type="button"
          onClick={() => setMode('inheritance')}
          className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
            mode === 'inheritance'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          상속세 시뮬레이션
        </button>
        <button
          type="button"
          onClick={() => setMode('gift')}
          className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
            mode === 'gift'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          증여세 시뮬레이션
        </button>
      </div>

      {mode === 'inheritance' ? (
        /* Inheritance Form */
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">총 상속재산가액 (부동산·예금·주식 등)</label>
              <div className="relative">
                <input
                  type="number"
                  step="10000000"
                  value={estateTotal}
                  onChange={(e) => setEstateTotal(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground focus:border-primary focus:outline-hidden"
                />
                <span className="absolute right-4 top-2.5 text-xs text-muted-foreground">원</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">피상속인 채무 및 공과금</label>
              <div className="relative">
                <input
                  type="number"
                  step="10000000"
                  value={estateDebts}
                  onChange={(e) => setEstateDebts(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground focus:border-primary focus:outline-hidden"
                />
                <span className="absolute right-4 top-2.5 text-xs text-muted-foreground">원</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">배우자 생존 및 상속 여부</span>
              <button
                type="button"
                onClick={() => setHasSpouse(!hasSpouse)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  hasSpouse ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border'
                }`}
              >
                {hasSpouse ? '배우자 있음 (최소 5억 공제)' : '배우자 없음'}
              </button>
            </div>

            {hasSpouse && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">배우자 실제 상속재산가액 (최소 5억 ~ 최대 30억 한도)</label>
                <input
                  type="number"
                  step="10000000"
                  value={spouseInheritedAmount}
                  onChange={(e) => setSpouseInheritedAmount(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">순금융재산가액 (예금·주식·펀드 - 대출)</label>
              <input
                type="number"
                step="10000000"
                value={financialAssets}
                onChange={(e) => setFinancialAssets(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground focus:border-primary focus:outline-hidden"
              />
              <p className="text-xs text-muted-foreground mt-1">* 2천만~1억: 2천만 원, 1억 초과 시 20%(최대 2억 한도) 공제</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">장례비용 공제</label>
              <input
                type="number"
                step="1000000"
                value={funeralExpense}
                onChange={(e) => setFuneralExpense(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground focus:border-primary focus:outline-hidden"
              />
              <p className="text-xs text-muted-foreground mt-1">* 증빙 없어도 최소 500만 원, 최대 1,000만 원 한도</p>
            </div>
          </div>

          {/* Result Card */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-primary/10 pb-3">
              <div>
                <span className="text-xs font-bold text-primary">최종 납부 상속세 (3% 신고공제 반영)</span>
                <div className="text-2xl font-black text-foreground">
                  {inheritanceCalc.finalTax.toLocaleString()} <span className="text-sm font-medium">원</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">실효세율</span>
                <div className="text-lg font-bold text-foreground">{inheritanceCalc.effectiveRate.toFixed(2)} %</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg bg-background/80 p-2.5 border border-border">
                <span className="text-muted-foreground block mb-0.5">순상속재산가액</span>
                <span className="font-bold text-foreground">{inheritanceCalc.netEstate.toLocaleString()}원</span>
              </div>
              <div className="rounded-lg bg-background/80 p-2.5 border border-border">
                <span className="text-muted-foreground block mb-0.5">상속공제 합계</span>
                <span className="font-bold text-primary">-{inheritanceCalc.totalDeductions.toLocaleString()}원</span>
              </div>
              <div className="rounded-lg bg-background/80 p-2.5 border border-border">
                <span className="text-muted-foreground block mb-0.5">과세표준</span>
                <span className="font-bold text-foreground">{inheritanceCalc.taxBase.toLocaleString()}원</span>
              </div>
              <div className="rounded-lg bg-background/80 p-2.5 border border-border">
                <span className="text-muted-foreground block mb-0.5">자진신고세액공제</span>
                <span className="font-bold text-primary">-{inheritanceCalc.selfReportDiscount.toLocaleString()}원</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Gift Form */
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">증여자와의 관계 (수증인 기준)</label>
            <select
              value={recipientRelation}
              onChange={(e) => setRecipientRelation(e.target.value as any)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground focus:border-primary focus:outline-hidden"
            >
              <option value="marriage_child">💍 혼인·출산 특별공제 성인자녀 (1.5억 공제)</option>
              <option value="child_adult">직계비속 성인자녀 (5,000만 원 공제)</option>
              <option value="child_minor">직계비속 미성년자녀 (2,000만 원 공제)</option>
              <option value="spouse">배우자 (6억 원 공제)</option>
              <option value="parent">직계존속 부모님 (5,000만 원 공제)</option>
              <option value="relative">기타 친족 6촌이내/4촌인척 (1,000만 원 공제)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">증여재산가액</label>
            <div className="relative">
              <input
                type="number"
                step="5000000"
                value={giftAmount}
                onChange={(e) => setGiftAmount(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground focus:border-primary focus:outline-hidden"
              />
              <span className="absolute right-4 top-2.5 text-xs text-muted-foreground">원</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              * 동일인(직계존속은 배우자 포함)으로부터 과거 10년 이내에 증여받은 가액을 합산해야 합니다.
            </p>
          </div>

          {/* Result Card */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-primary/10 pb-3">
              <div>
                <span className="text-xs font-bold text-primary">최종 납부 증여세 (3% 신고공제 반영)</span>
                <div className="text-2xl font-black text-foreground">
                  {giftCalc.finalTax.toLocaleString()} <span className="text-sm font-medium">원</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">실효세율</span>
                <div className="text-lg font-bold text-foreground">{giftCalc.effectiveRate.toFixed(2)} %</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg bg-background/80 p-2.5 border border-border">
                <span className="text-muted-foreground block mb-0.5">증여가액</span>
                <span className="font-bold text-foreground">{giftCalc.grossGift.toLocaleString()}원</span>
              </div>
              <div className="rounded-lg bg-background/80 p-2.5 border border-border">
                <span className="text-muted-foreground block mb-0.5">증여재산공제</span>
                <span className="font-bold text-primary">-{giftCalc.deduction.toLocaleString()}원</span>
              </div>
              <div className="rounded-lg bg-background/80 p-2.5 border border-border">
                <span className="text-muted-foreground block mb-0.5">과세표준</span>
                <span className="font-bold text-foreground">{giftCalc.taxBase.toLocaleString()}원</span>
              </div>
              <div className="rounded-lg bg-background/80 p-2.5 border border-border">
                <span className="text-muted-foreground block mb-0.5">자진신고공제</span>
                <span className="font-bold text-primary">-{giftCalc.selfReportDiscount.toLocaleString()}원</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
