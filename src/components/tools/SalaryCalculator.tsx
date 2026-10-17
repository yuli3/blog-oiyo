import React, { useState } from 'react';
import { GameContainer } from '../ui/game/GamePrimitives';
import { RATES, ratePct } from '../../lib/kr-payroll-2026';
import { computeSalaryBreakdownWon } from '../../lib/finance/salary-calculator';

const SalaryCalculator: React.FC<{ locale?: 'ko' | 'en' }> = ({ locale = 'ko' }) => {
    const t = {
        ko: {
            title: "연봉 실수령액 계산기",
            desc: "세금과 4대보험 공제 후 실제 수령액을 계산합니다.",
            annualSalary: "연봉 (원)",
            calcBtn: "계산하기",
            monthlyGross: "월 세전 급여",
            monthlyNet: "월 실수령액",
            annualNet: "연 실수령액",
            deductions: "월 공제 내역",
            nationalPension: `국민연금 (${ratePct(RATES.pensionEmployee)})`,
            healthInsurance: `건강보험 (${ratePct(RATES.healthEmployee)})`,
            longTermCare: `장기요양 (건강보험료 × ${ratePct(RATES.longTermCareOfHealth)})`,
            employmentInsurance: `고용보험 (${ratePct(RATES.employmentEmployee)})`,
            incomeTax: "근로소득세 (추정)",
            localTax: "지방소득세",
            totalDeduction: "총 공제액",
            note: "* 2026년 요율 기준이에요. 근로소득세는 간이세액표가 아니라 연간 세액(근로소득공제·인적공제·보험료공제·근로소득세액공제)을 12로 나눈 추정치예요. 실제 납부액은 연말정산 후 확정돼요.",
        },
        en: {
            title: "Salary Net Pay Calculator",
            desc: "Calculate your actual take-home pay after taxes and social insurance deductions.",
            annualSalary: "Annual Salary (KRW)",
            calcBtn: "Calculate",
            monthlyGross: "Monthly Gross",
            monthlyNet: "Monthly Net Pay",
            annualNet: "Annual Net Pay",
            deductions: "Monthly Deductions",
            nationalPension: `National Pension (${ratePct(RATES.pensionEmployee)})`,
            healthInsurance: `Health Insurance (${ratePct(RATES.healthEmployee)})`,
            longTermCare: `Long-term Care (${ratePct(RATES.longTermCareOfHealth)} of health)`,
            employmentInsurance: `Employment Insurance (${ratePct(RATES.employmentEmployee)})`,
            incomeTax: "Income Tax (est.)",
            localTax: "Local Income Tax",
            totalDeduction: "Total Deductions",
            note: "* 2026 rates. Income tax is an annual estimate (earned income deduction, personal deduction, insurance deduction, earned income tax credit) divided by 12, not the withholding table. The actual amount is finalized at year-end settlement.",
        },
    }[locale === 'ko' ? 'ko' : 'en'];

    const [annualSalary, setAnnualSalary] = useState(40000000);

    const monthlyGross = annualSalary / 12;

    // 4대보험·근로소득세는 kr-payroll-2026.ts(SSOT) 기반 finance/salary-calculator.ts가 계산한다.
    const r = computeSalaryBreakdownWon(Math.round(monthlyGross), 1, 0);
    const nationalPension = r.pension;
    const healthInsurance = r.health;
    const longTermCare = r.ltc;
    const employmentInsurance = r.employment;
    const monthlyIncomeTax = r.incomeTax;
    const monthlyLocalTax = r.localTax;

    const totalMonthlyDeduction = r.totalDed;
    const monthlyNet = r.net;
    const annualNet = monthlyNet * 12;

    const fmt = (n: number) => n.toLocaleString('ko-KR');

    const handleReset = () => setAnnualSalary(40000000);

    return (
        <GameContainer title={t.title} subtitle="Net Pay Estimator" onReset={handleReset}>
            <div className="flex flex-col gap-5 sm:gap-8">
                <p className="text-sm font-medium text-muted-foreground text-center">{t.desc}</p>

                <div className="flex flex-col gap-3">
                    <label className="text-sm font-bold text-foreground">{t.annualSalary}</label>
                    <input
                        type="number"
                        value={annualSalary}
                        onChange={(e) => setAnnualSalary(Math.max(0, Number(e.target.value)))}
                        step={1000000}
                        min={0}
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-success/30"
                        aria-label={t.annualSalary}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-2xl bg-success/10 border border-success/30 p-5 flex flex-col gap-1">
                        <span className="text-xs font-bold text-success uppercase tracking-wide">{t.monthlyGross}</span>
                        <span className="text-2xl font-bold text-success">₩{fmt(Math.floor(monthlyGross))}</span>
                    </div>
                    <div className="rounded-2xl bg-success p-5 flex flex-col gap-1">
                        <span className="text-xs font-bold text-success uppercase tracking-wide">{t.monthlyNet}</span>
                        <span className="text-2xl font-bold text-white">₩{fmt(monthlyNet)}</span>
                    </div>
                    <div className="rounded-2xl bg-success/10 border border-success/30 p-5 flex flex-col gap-1">
                        <span className="text-xs font-bold text-success uppercase tracking-wide">{t.annualNet}</span>
                        <span className="text-2xl font-bold text-success">₩{fmt(annualNet)}</span>
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-6 flex flex-col gap-3">
                    <h4 className="text-sm font-bold text-foreground">{t.deductions}</h4>
                    <div className="flex flex-col gap-2">
                        {[
                            { label: t.nationalPension, value: nationalPension },
                            { label: t.healthInsurance, value: healthInsurance },
                            { label: t.longTermCare, value: longTermCare },
                            { label: t.employmentInsurance, value: employmentInsurance },
                            { label: t.incomeTax, value: monthlyIncomeTax },
                            { label: t.localTax, value: monthlyLocalTax },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium">{label}</span>
                                <span className="font-bold text-foreground">₩{fmt(value)}</span>
                            </div>
                        ))}
                        <div className="border-t border-border mt-2 pt-2 flex justify-between items-center">
                            <span className="text-sm font-bold text-foreground">{t.totalDeduction}</span>
                            <span className="text-sm font-bold text-destructive">₩{fmt(totalMonthlyDeduction)}</span>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">{t.note}</p>
            </div>
        </GameContainer>
    );
};

export default SalaryCalculator;
