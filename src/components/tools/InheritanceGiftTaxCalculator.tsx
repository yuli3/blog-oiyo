import React, { useState, useMemo } from 'react';

import {
  INHERITANCE_GIFT_2026 as IG,
  filingCredit,
  financialAssetDeduction,
  funeralDeduction,
  inheritanceGiftProgressiveTax,
  spouseInheritanceDeduction,
} from '../../lib/kr-payroll-2026';

// 세율·공제 숫자는 src/lib/kr-payroll-2026.ts(INHERITANCE_GIFT_2026)에서만 읽어요. api kr-rates-2026과 테스트로 대조해요.
const man = (won: number) => (won >= 100_000_000 ? `${won / 100_000_000}억` : `${(won / 10_000).toLocaleString()}만`);

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
    const funeral = funeralDeduction(funeralExpense);

    const netEstate = Math.max(0, total - debts - funeral);

    // 일괄공제 5억(제21조). 배우자 단독 상속이면 일괄공제를 못 받는데, 이 계산기는 자녀 등과 함께 상속하는 경우를 가정해요.
    const lumpSumDeduction = IG.inheritanceLumpSum;

    // 배우자상속공제(제19조) 최소 5억~최대 30억. 법정상속분 한도는 반영하지 않아요.
    const spouseDeduction = hasSpouse ? spouseInheritanceDeduction(spouseInheritedAmount) : 0;

    // 금융재산상속공제(제22조)
    const finDeduction = financialAssetDeduction(financialAssets);

    const totalDeductions = lumpSumDeduction + spouseDeduction + finDeduction;
    const taxBase = Math.max(0, netEstate - totalDeductions);
    const rawTax = inheritanceGiftProgressiveTax(taxBase);
    const selfReportDiscount = filingCredit(rawTax); // 신고세액공제 3%(제69조)
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

    const D = IG.giftDeductions;
    const table = {
      marriage_child: [D.child_adult + IG.marriageBirthDeduction, `혼인·출산 공제 (기본 ${man(D.child_adult)} + ${man(IG.marriageBirthDeduction)})`],
      child_adult: [D.child_adult, `직계존속에게서 받는 성년 자녀 (10년 합산 ${man(D.child_adult)})`],
      child_minor: [D.child_minor, `직계존속에게서 받는 미성년 자녀 (10년 합산 ${man(D.child_minor)})`],
      spouse: [D.spouse, `배우자 (10년 합산 ${man(D.spouse)})`],
      parent: [D.parent, `직계비속에게서 받는 부모 (${man(D.parent)})`],
      relative: [D.other_relative, `기타 친족 (6촌 이내 혈족·4촌 이내 인척 ${man(D.other_relative)})`],
    } as const;
    const [deduction, label] = table[recipientRelation];

    const taxBase = Math.max(0, grossGift - deduction);
    const rawTax = inheritanceGiftProgressiveTax(taxBase);
    const selfReportDiscount = filingCredit(rawTax); // 신고세액공제 3%
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
                {hasSpouse ? `배우자 있음 (최소 ${man(IG.spouseInheritanceMin)} 공제)` : '배우자 없음'}
              </button>
            </div>

            {hasSpouse && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{`배우자 실제 상속재산가액 (최소 ${man(IG.spouseInheritanceMin)} ~ 최대 ${man(IG.spouseInheritanceMax)} 한도)`}</label>
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
              <p className="text-xs text-muted-foreground mt-1">{`* ${man(IG.financialAsset.fullUpTo)} 원 이하는 전액, 넘으면 ${man(IG.financialAsset.minDeduction)} 원과 ${IG.financialAsset.rate * 100}% 중 큰 금액(최대 ${man(IG.financialAsset.max)} 원)을 공제해요`}</p>
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
              <p className="text-xs text-muted-foreground mt-1">{`* 증빙이 없어도 최소 ${man(IG.funeral.min)} 원, 최대 ${man(IG.funeral.max)} 원까지 공제해요`}</p>
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
              <option value="marriage_child">{`혼인·출산 공제 성년 자녀 (${man(IG.giftDeductions.child_adult + IG.marriageBirthDeduction)} 공제)`}</option>
              <option value="child_adult">{`성년 자녀 (${man(IG.giftDeductions.child_adult)} 원 공제)`}</option>
              <option value="child_minor">{`미성년 자녀 (${man(IG.giftDeductions.child_minor)} 원 공제)`}</option>
              <option value="spouse">{`배우자 (${man(IG.giftDeductions.spouse)} 원 공제)`}</option>
              <option value="parent">{`자녀에게서 받는 부모 (${man(IG.giftDeductions.parent)} 원 공제)`}</option>
              <option value="relative">{`기타 친족 6촌 이내 혈족·4촌 이내 인척 (${man(IG.giftDeductions.other_relative)} 원 공제)`}</option>
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
              * 같은 사람(직계존속이면 그 배우자 포함)에게서 10년 안에 받은 증여는 합산해야 해요.
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
