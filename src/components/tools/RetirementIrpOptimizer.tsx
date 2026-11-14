import React, { useState, useMemo } from 'react';

export default function RetirementIrpOptimizer() {
  const [severancePay, setSeverancePay] = useState<number>(150000000); // 퇴직금 (원) - 기본 1.5억
  const [tenureYears, setTenureYears] = useState<number>(15); // 근속연수 - 기본 15년
  const [payoutYears, setPayoutYears] = useState<number>(15); // 연금 수령 기간 (10~30년)

  // 퇴직소득세 간이 계산 (2026 세법 기준)
  const calculation = useMemo(() => {
    // 1. 근속연수공제
    let tenureDeduction = 0;
    if (tenureYears <= 5) tenureDeduction = tenureYears * 1000000;
    else if (tenureYears <= 10) tenureDeduction = 5000000 + (tenureYears - 5) * 2000000;
    else if (tenureYears <= 20) tenureDeduction = 15000000 + (tenureYears - 10) * 2500000;
    else tenureDeduction = 40000000 + (tenureYears - 20) * 3000000;

    // 2. 환산급여
    const baseIncome = Math.max(0, severancePay - tenureDeduction);
    const convertedSalary = (baseIncome / Math.max(1, tenureYears)) * 12;

    // 3. 환산급여공제
    let convertedDeduction = 0;
    if (convertedSalary <= 8000000) convertedDeduction = convertedSalary;
    else if (convertedSalary <= 70000000) convertedDeduction = 8000000 + (convertedSalary - 8000000) * 0.6;
    else if (convertedSalary <= 100000000) convertedDeduction = 45200000 + (convertedSalary - 70000000) * 0.55;
    else if (convertedSalary <= 300000000) convertedDeduction = 61700000 + (convertedSalary - 100000000) * 0.45;
    else convertedDeduction = 151700000 + (convertedSalary - 300000000) * 0.35;

    // 4. 과세표준 및 산출세액 (기본 소득세율)
    const taxBase = Math.max(0, convertedSalary - convertedDeduction);
    let convertedTax = 0;
    if (taxBase <= 14000000) convertedTax = taxBase * 0.06;
    else if (taxBase <= 50000000) convertedTax = 840000 + (taxBase - 14000000) * 0.15;
    else if (taxBase <= 88000000) convertedTax = 6240000 + (taxBase - 50000000) * 0.24;
    else if (taxBase <= 150000000) convertedTax = 15360000 + (taxBase - 88000000) * 0.35;
    else convertedTax = 37060000 + (taxBase - 150000000) * 0.38;

    // 5. 퇴직소득세 = (환산산출세액 / 12) * 근속연수
    const lumpSumTaxNational = (convertedTax / 12) * tenureYears;
    const lumpSumTaxTotal = Math.round(lumpSumTaxNational * 1.1); // 지방소득세 10% 포함
    const effectiveLumpTaxRate = Math.round((lumpSumTaxTotal / severancePay) * 1000) / 10;

    // 6. IRP 연금 수령 시 세금 (1~10년차 70%, 11년차 이후 60% 적용)
    let pensionTaxTotal = 0;
    const yearlySeverance = severancePay / payoutYears;
    const yearlyBaseTax = lumpSumTaxTotal / payoutYears;

    for (let yr = 1; yr <= payoutYears; yr++) {
      const discountRate = yr <= 10 ? 0.7 : 0.6; // 30% 감면 -> 40% 감면
      pensionTaxTotal += yearlyBaseTax * discountRate;
    }
    pensionTaxTotal = Math.round(pensionTaxTotal);

    const taxSavings = lumpSumTaxTotal - pensionTaxTotal;
    const savingsPercent = lumpSumTaxTotal > 0 ? Math.round((taxSavings / lumpSumTaxTotal) * 1000) / 10 : 0;
    const monthlyPensionNet = Math.round((severancePay - pensionTaxTotal) / (payoutYears * 12));

    return {
      lumpSumTaxTotal,
      effectiveLumpTaxRate,
      pensionTaxTotal,
      taxSavings,
      savingsPercent,
      monthlyPensionNet,
      yearlySeverance: Math.round(yearlySeverance)
    };
  }, [severancePay, tenureYears, payoutYears]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold tracking-tight">퇴직금 & IRP 연금 절세 인출 시뮬레이터</h2>
            <p className="text-sm text-muted-foreground mt-1">
              일시금 수령 vs IRP 연금 분할 수령 시 퇴직소득세 30~40% 감면 혜택과 실수령액을 비교합니다.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-muted-foreground block">연금 수령 시 아끼는 세금</span>
            <span className="text-2xl font-extrabold text-success">
              ₩{calculation.taxSavings.toLocaleString()}원 절세
            </span>
            <span className="text-xs text-muted-foreground block">
              (세금 {calculation.savingsPercent}% 감면 효과)
            </span>
          </div>
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                예상 퇴직금 (세전)
              </label>
              <span className="text-xs font-bold text-foreground">{(severancePay / 10000).toLocaleString()}만원</span>
            </div>
            <input
              type="range"
              min={10000000}
              max={1000000000}
              step={5000000}
              value={severancePay}
              onChange={(e) => setSeverancePay(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                근속 연수
              </label>
              <span className="text-xs font-bold text-foreground">{tenureYears}년</span>
            </div>
            <input
              type="range"
              min={1}
              max={40}
              step={1}
              value={tenureYears}
              onChange={(e) => setTenureYears(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                연금 수령 기간
              </label>
              <span className="text-xs font-bold text-foreground">{payoutYears}년 분할</span>
            </div>
            <input
              type="range"
              min={10}
              max={30}
              step={1}
              value={payoutYears}
              onChange={(e) => setPayoutYears(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>

        {/* Comparison Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          <div className="p-5 rounded-xl border border-destructive/20 bg-destructive/5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-destructive uppercase tracking-wider">
                일시금 수령 시 (세금 폭탄)
              </span>
              <span className="text-xs text-muted-foreground">실효세율 {calculation.effectiveLumpTaxRate}%</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">공제되는 퇴직소득세</span>
              <span className="text-2xl font-black text-foreground">
                ₩{calculation.lumpSumTaxTotal.toLocaleString()}원
              </span>
            </div>
            <div className="pt-2 border-t border-destructive/10 text-xs text-muted-foreground flex justify-between">
              <span>일시금 실수령액:</span>
              <span className="font-bold text-foreground">
                ₩{(severancePay - calculation.lumpSumTaxTotal).toLocaleString()}원
              </span>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-success/30 bg-success/10 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-success uppercase tracking-wider">
                IRP 연금 수령 시 (절세 추천)
              </span>
              <span className="text-xs text-success font-semibold">세금 {calculation.savingsPercent}% 감면</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">총 감면 납부세액</span>
              <span className="text-2xl font-black text-foreground">
                ₩{calculation.pensionTaxTotal.toLocaleString()}원
              </span>
            </div>
            <div className="pt-2 border-t border-success/20 text-xs flex justify-between">
              <span className="text-muted-foreground">예상 월 실수령액 ({payoutYears}년 동안):</span>
              <span className="font-extrabold text-foreground">
                약 ₩{calculation.monthlyPensionNet.toLocaleString()}원/월
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
