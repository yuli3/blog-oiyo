import React, { useState, useMemo } from 'react';

export default function SalaryNegotiationAdvisor() {
  const [currentBase, setCurrentBase] = useState<number>(60000000); // 현재 연봉 (원)
  const [offeredBase, setOfferedBase] = useState<number>(72000000); // 제안 연봉 (원)
  const [incentiveBonus, setIncentiveBonus] = useState<number>(10); // 성과급 (%)
  const [nontaxableMonthly, setNontaxableMonthly] = useState<number>(200000); // 월 비과세 (식대 등)
  const [dependents, setDependents] = useState<number>(1); // 본인 포함 부양가족

  // 4대보험 & 세금 간이 계산 (2026 요율)
  const calculateNetPay = (grossAnnual: number) => {
    const monthlyGross = grossAnnual / 12;
    const taxableMonthly = Math.max(0, monthlyGross - nontaxableMonthly);

    // 4대보험 요율
    // 국민연금: 4.5% (상한 약 617만원)
    const np = Math.min(taxableMonthly, 6170000) * 0.045;
    // 건강보험: 3.545%
    const hi = taxableMonthly * 0.03545;
    // 장기요양보험: 건보료의 12.95%
    const ltc = hi * 0.1295;
    // 고용보험: 0.9%
    const ei = taxableMonthly * 0.009;

    const totalInsurance = np + hi + ltc + ei;

    // 근로소득 간이세액 (약식)
    let incomeTax = 0;
    if (taxableMonthly > 10000000) incomeTax = taxableMonthly * 0.22;
    else if (taxableMonthly > 6000000) incomeTax = taxableMonthly * 0.14;
    else if (taxableMonthly > 4000000) incomeTax = taxableMonthly * 0.08;
    else if (taxableMonthly > 2500000) incomeTax = taxableMonthly * 0.04;
    else incomeTax = taxableMonthly * 0.015;

    // 부양가족 경감
    if (dependents > 1) incomeTax = incomeTax * (1 - (dependents - 1) * 0.08);
    const localTax = incomeTax * 0.1;
    const totalTax = incomeTax + localTax;

    const netMonthly = Math.round(monthlyGross - totalInsurance - totalTax);
    return {
      monthlyGross: Math.round(monthlyGross),
      totalInsurance: Math.round(totalInsurance),
      totalTax: Math.round(totalTax),
      netMonthly
    };
  };

  const currentResult = useMemo(() => calculateNetPay(currentBase), [currentBase, nontaxableMonthly, dependents]);
  const offeredResult = useMemo(() => {
    const totalOfferedGross = offeredBase * (1 + incentiveBonus / 100);
    return calculateNetPay(totalOfferedGross);
  }, [offeredBase, incentiveBonus, nontaxableMonthly, dependents]);

  const diffMonthly = offeredResult.netMonthly - currentResult.netMonthly;
  const increaseRate = Math.round(((offeredBase - currentBase) / currentBase) * 1000) / 10;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold tracking-tight">이직자 연봉 실수령액 & 협상 가치 계산기</h2>
            <p className="text-sm text-muted-foreground mt-1">
              성과급과 4대보험, 소득세를 반영한 실제 통장 입금액 차이와 최적의 연봉 협상 레인지를 진단합니다.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-muted-foreground block">이직 시 월 실수령액 증가분</span>
            <span className="text-2xl font-extrabold text-success">
              +₩{diffMonthly.toLocaleString()}원/월
            </span>
            <span className="text-xs text-muted-foreground block">
              (기본급 인상률: +{increaseRate}%)
            </span>
          </div>
        </div>

        {/* Input Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                현재 기본 연봉
              </label>
              <span className="text-xs font-bold text-foreground">₩{(currentBase / 10000).toLocaleString()}만원</span>
            </div>
            <input
              type="range"
              min={25000000}
              max={200000000}
              step={1000000}
              value={currentBase}
              onChange={(e) => setCurrentBase(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                제안받은 기본 연봉
              </label>
              <span className="text-xs font-bold text-foreground">₩{(offeredBase / 10000).toLocaleString()}만원</span>
            </div>
            <input
              type="range"
              min={25000000}
              max={250000000}
              step={1000000}
              value={offeredBase}
              onChange={(e) => setOfferedBase(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                예상 인센티브/성과급 비율
              </label>
              <span className="text-xs font-bold text-foreground">{incentiveBonus}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              step={5}
              value={incentiveBonus}
              onChange={(e) => setIncentiveBonus(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                부양가족 수 (본인 포함)
              </label>
              <span className="text-xs font-bold text-foreground">{dependents}인 가구</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={dependents}
              onChange={(e) => setDependents(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>

        {/* Comparison Result Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          <div className="p-5 rounded-xl border border-border bg-muted/20 space-y-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              현재 직장 월 입금액
            </span>
            <div>
              <span className="text-xs text-muted-foreground block">월 통장 실수령액</span>
              <span className="text-2xl font-black text-foreground">
                ₩{currentResult.netMonthly.toLocaleString()}원
              </span>
            </div>
            <div className="pt-2 border-t border-border text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>4대보험 공제:</span>
                <span>-₩{currentResult.totalInsurance.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span>소득세/지방세:</span>
                <span>-₩{currentResult.totalTax.toLocaleString()}원</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-success/30 bg-success/10 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-success uppercase tracking-wider">
                제안 직장 월 입금액 (성과급 포함)
              </span>
              <span className="text-xs text-success font-semibold">+{increaseRate}% 인상</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">월 통장 실수령액</span>
              <span className="text-2xl font-black text-foreground">
                ₩{offeredResult.netMonthly.toLocaleString()}원
              </span>
            </div>
            <div className="pt-2 border-t border-success/20 text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>4대보험 공제:</span>
                <span>-₩{offeredResult.totalInsurance.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span>소득세/지방세:</span>
                <span>-₩{offeredResult.totalTax.toLocaleString()}원</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
