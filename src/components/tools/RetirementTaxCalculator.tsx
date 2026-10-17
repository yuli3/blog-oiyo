import React, { useState, useMemo } from 'react';

// 2023~2026 Revised South Korea Retirement Income Tax Law
// 근속연수공제 계산
function calculateServiceYearDeduction(years: number): number {
  if (years <= 5) {
    return years * 1000000;
  } else if (years <= 10) {
    return 5000000 + (years - 5) * 2000000;
  } else if (years <= 20) {
    return 15000000 + (years - 10) * 2500000;
  } else {
    return 40000000 + (years - 20) * 3000000;
  }
}

// 환산급여별 소득공제 계산
function calculateConvertedSalaryDeduction(convertedSalary: number): number {
  if (convertedSalary <= 8000000) {
    return convertedSalary;
  } else if (convertedSalary <= 70000000) {
    return 8000000 + (convertedSalary - 8000000) * 0.6;
  } else if (convertedSalary <= 100000000) {
    return 45200000 + (convertedSalary - 70000000) * 0.55;
  } else if (convertedSalary <= 300000000) {
    return 61700000 + (convertedSalary - 100000000) * 0.45;
  } else {
    return 151700000 + (convertedSalary - 300000000) * 0.35;
  }
}

// 소득세 기본세율 누진 계산
function calculateProgressiveIncomeTax(taxBase: number): number {
  if (taxBase <= 14000000) {
    return Math.round(taxBase * 0.06);
  } else if (taxBase <= 50000000) {
    return Math.round(taxBase * 0.14 - 1120000);
  } else if (taxBase <= 88000000) {
    return Math.round(taxBase * 0.24 - 6120000);
  } else if (taxBase <= 150000000) {
    return Math.round(taxBase * 0.35 - 15800000);
  } else if (taxBase <= 300000000) {
    return Math.round(taxBase * 0.38 - 20300000);
  } else if (taxBase <= 500000000) {
    return Math.round(taxBase * 0.40 - 29300000);
  } else if (taxBase <= 1000000000) {
    return Math.round(taxBase * 0.42 - 39300000);
  } else {
    return Math.round(taxBase * 0.45 - 69300000);
  }
}

export default function RetirementTaxCalculator() {
  const [grossSeverance, setGrossSeverance] = useState<number>(80000000); // 8,000만원
  const [serviceYears, setServiceYears] = useState<number>(10); // 10년

  const calculation = useMemo(() => {
    const gross = Math.max(0, grossSeverance);
    const years = Math.max(1, Math.round(serviceYears));

    // 1. 근속연수 공제
    const serviceDeduction = calculateServiceYearDeduction(years);
    const afterServiceDeduction = Math.max(0, gross - serviceDeduction);

    // 2. 환산급여: (퇴직소득 - 근속연수공제) × 12 / 근속연수
    const convertedSalary = Math.round((afterServiceDeduction * 12) / years);

    // 3. 환산급여별 소득공제
    const salaryDeduction = calculateConvertedSalaryDeduction(convertedSalary);

    // 4. 환산 과세표준
    const convertedTaxBase = Math.max(0, convertedSalary - salaryDeduction);

    // 5. 환산 산출세액 (누진세율 적용)
    const convertedCalculatedTax = calculateProgressiveIncomeTax(convertedTaxBase);

    // 6. 퇴직소득 산출세액: 환산 산출세액 / 12 × 근속연수
    const nationalTax = Math.round((convertedCalculatedTax / 12) * years);

    // 7. 지방소득세 (10%)
    const localTax = Math.floor(nationalTax * 0.1);
    const totalTax = nationalTax + localTax;

    // 8. 실수령액
    const netPayout = Math.max(0, gross - totalTax);
    const effectiveTaxRate = gross > 0 ? (totalTax / gross) * 100 : 0;

    return {
      gross,
      years,
      serviceDeduction,
      convertedSalary,
      salaryDeduction,
      convertedTaxBase,
      convertedCalculatedTax,
      nationalTax,
      localTax,
      totalTax,
      netPayout,
      effectiveTaxRate,
    };
  }, [grossSeverance, serviceYears]);

  const formatWon = (val: number) => Math.round(val).toLocaleString('ko-KR') + '원';

  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          2026 최신 퇴직소득세법 반영
        </span>
        <h2 className="mt-2 text-2xl font-black text-foreground">
          퇴직소득세 & 퇴직금 실수령액 정밀 계산기
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          근속연수 공제 및 환산급여 공제율을 적용하여 실제 통장에 입금되는 세후 퇴직금과 공제 세액을 계산합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-foreground">
            세전 퇴직금 총액 (원)
          </label>
          <input
            type="number"
            min="0"
            step="1000000"
            value={grossSeverance}
            onChange={(e) => setGrossSeverance(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="text-xs text-muted-foreground">
            {(grossSeverance / 10000).toLocaleString('ko-KR')}만 원
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground">
            근속연수 (년)
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={serviceYears}
            onChange={(e) => setServiceYears(Number(e.target.value) || 1)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="text-xs text-muted-foreground">
            만 {serviceYears}년 근무
          </span>
        </div>
      </div>

      {/* Main Result Card */}
      <div className="mt-6 rounded-2xl border border-border bg-secondary p-5">
        <p className="text-xs font-bold text-secondary-foreground">실제 수령하는 세후 퇴직금</p>
        <p className="mt-1 text-3xl font-black text-primary">
          {formatWon(calculation.netPayout)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          총 퇴직소득세 공제: {formatWon(calculation.totalTax)} (실효세율 {calculation.effectiveTaxRate.toFixed(2)}%)
        </p>
      </div>

      {/* Breakdown Details */}
      <div className="mt-6 space-y-2 rounded-xl border border-border p-4 text-xs">
        <div className="flex justify-between border-b border-border/60 pb-2">
          <span className="text-muted-foreground">세전 퇴직소득</span>
          <span className="font-bold text-foreground">{formatWon(calculation.gross)}</span>
        </div>
        <div className="flex justify-between border-b border-border/60 pb-2">
          <span className="text-muted-foreground">근속연수 공제 ({calculation.years}년)</span>
          <span className="font-bold text-chart-1">-{formatWon(calculation.serviceDeduction)}</span>
        </div>
        <div className="flex justify-between border-b border-border/60 pb-2">
          <span className="text-muted-foreground">환산급여 (연환산액)</span>
          <span className="font-bold text-foreground">{formatWon(calculation.convertedSalary)}</span>
        </div>
        <div className="flex justify-between border-b border-border/60 pb-2">
          <span className="text-muted-foreground">환산급여 소득공제</span>
          <span className="font-bold text-chart-1">-{formatWon(calculation.salaryDeduction)}</span>
        </div>
        <div className="flex justify-between border-b border-border/60 pb-2">
          <span className="text-muted-foreground">환산 과세표준</span>
          <span className="font-bold text-foreground">{formatWon(calculation.convertedTaxBase)}</span>
        </div>
        <div className="flex justify-between border-b border-border/60 pb-2">
          <span className="text-muted-foreground">퇴직소득세 (국세)</span>
          <span className="font-bold text-destructive">{formatWon(calculation.nationalTax)}</span>
        </div>
        <div className="flex justify-between pt-1">
          <span className="text-muted-foreground">지방소득세 (10%)</span>
          <span className="font-bold text-destructive">{formatWon(calculation.localTax)}</span>
        </div>
      </div>
    </div>
  );
}
