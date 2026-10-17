import React, { useState, useMemo } from 'react';
import { PAYROLL_TAX_AS_OF, RATES, ratePct } from '../../lib/kr-payroll-2026';
import { computeSalaryBreakdownWon } from '../../lib/finance/salary-calculator';

function fmt(n: number) {
  return Math.round(n).toLocaleString('ko-KR');
}

export default function SalaryCalculator() {
  const [annualSalary, setAnnualSalary] = useState('');
  const [annualSalaryDisplay, setAnnualSalaryDisplay] = useState('');
  const [dependents, setDependents] = useState('1'); // 본인 포함

  const handleSalary = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '').replace(/[^0-9]/g, '');
    setAnnualSalary(raw);
    const num = parseInt(raw) || 0;
    setAnnualSalaryDisplay(num > 0 ? num.toLocaleString('ko-KR') : raw);
  };

  const result = useMemo(() => {
    const total = parseInt(annualSalary) || 0;
    if (total <= 0) return null;

    const dep = Math.max(1, Math.min(10, parseInt(dependents) || 1));
    // 요율·세율·공제는 kr-payroll-2026.ts(SSOT) → finance/salary-calculator.ts가 계산한다.
    const r = computeSalaryBreakdownWon(Math.round(total / 12), dep, 0);

    return {
      monthly: r.gross,
      nationalPension: r.pension,
      healthInsurance: r.health,
      longTermCare: r.ltc,
      employmentInsurance: r.employment,
      incomeTax: r.incomeTax,
      localTax: r.localTax,
      totalDeductions: r.totalDed,
      netMonthly: r.net,
      netAnnual: r.net * 12,
      effectiveRate: r.effectiveRate,
    };
  }, [annualSalary, dependents]);

  return (
    <div className="not-prose my-5 sm:my-8 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💼</span>
          <div>
            <h3 className="font-bold text-white text-lg leading-tight">연봉 실수령액 계산기</h3>
            <p className="text-green-100 text-xs mt-0.5">4대보험·소득세·지방세 차감 후 월 실수령액</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* Inputs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-foreground">
              연간 총급여 (원)
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={annualSalaryDisplay}
                onChange={handleSalary}
                placeholder="예: 40,000,000"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-right font-mono font-semibold focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 placeholder:text-muted-foreground/40 text-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">원</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5 text-foreground">
              공제 대상 가족 수 (본인 포함)
            </label>
            <select
              value={dependents}
              onChange={(e) => setDependents(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 font-semibold focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 text-sm"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}명{n === 1 ? ' (본인만)' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-3">
            {/* Monthly breakdown */}
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-3 bg-muted/30 border-b border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">월 급여 공제 내역</span>
              </div>
              <div className="divide-y divide-border">
                <div className="flex justify-between items-center px-5 py-3">
                  <span className="text-sm text-muted-foreground">월 총급여</span>
                  <span className="font-mono font-bold">{fmt(result.monthly)} 원</span>
                </div>
                <div className="flex justify-between items-center px-5 py-2.5">
                  <span className="text-sm text-muted-foreground">국민연금 ({ratePct(RATES.pensionEmployee)})</span>
                  <span className="font-mono text-red-600">- {fmt(result.nationalPension)} 원</span>
                </div>
                <div className="flex justify-between items-center px-5 py-2.5">
                  <span className="text-sm text-muted-foreground">건강보험 ({ratePct(RATES.healthEmployee)})</span>
                  <span className="font-mono text-red-600">- {fmt(result.healthInsurance)} 원</span>
                </div>
                <div className="flex justify-between items-center px-5 py-2.5">
                  <span className="text-sm text-muted-foreground">장기요양보험 (건강보험료 × {ratePct(RATES.longTermCareOfHealth)})</span>
                  <span className="font-mono text-red-600">- {fmt(result.longTermCare)} 원</span>
                </div>
                <div className="flex justify-between items-center px-5 py-2.5">
                  <span className="text-sm text-muted-foreground">고용보험 ({ratePct(RATES.employmentEmployee)})</span>
                  <span className="font-mono text-red-600">- {fmt(result.employmentInsurance)} 원</span>
                </div>
                <div className="flex justify-between items-center px-5 py-2.5">
                  <span className="text-sm text-muted-foreground">근로소득세 (추정)</span>
                  <span className="font-mono text-red-600">- {fmt(result.incomeTax)} 원</span>
                </div>
                <div className="flex justify-between items-center px-5 py-2.5">
                  <span className="text-sm text-muted-foreground">지방소득세 (소득세 × 10%)</span>
                  <span className="font-mono text-red-600">- {fmt(result.localTax)} 원</span>
                </div>
                <div className="flex justify-between items-center px-5 py-3 bg-red-50/50">
                  <span className="text-sm font-semibold text-red-700">총 공제액 (실효세율 {result.effectiveRate}%)</span>
                  <span className="font-mono font-bold text-red-700">- {fmt(result.totalDeductions)} 원</span>
                </div>
                <div className="flex justify-between items-center px-5 py-4 bg-green-50/50">
                  <span className="text-sm font-bold text-green-800">월 실수령액</span>
                  <span className="font-mono font-extrabold text-green-700 text-xl">{fmt(result.netMonthly)} 원</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-green-200 bg-green-50/30 px-5 py-3.5 flex justify-between items-center">
              <span className="text-sm font-bold text-green-800">연간 실수령액</span>
              <span className="font-mono font-extrabold text-green-700 text-lg">{fmt(result.netAnnual)} 원</span>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          ※ {PAYROLL_TAX_AS_OF} 기준 2026년 요율이에요. 비과세는 0원으로 보고, 소득세는 간이세액표가 아니라 연간 세액(근로소득공제·인적공제·보험료공제·근로소득세액공제)을 12로 나눈 추정값이에요. 실제 원천징수액과 연말정산 결과는 달라질 수 있어요.
        </p>
      </div>
    </div>
  );
}
