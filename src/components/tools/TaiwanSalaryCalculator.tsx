import React, { useState } from 'react';
import { GameContainer } from '@/components/ui/game/GamePrimitives';

interface Props {
    locale?: 'zh' | 'en';
}

const labels = {
    zh: {
        title: '台湾薪资试算表 2026',
        desc: '输入月薪，试算劳保、健保及所得税后实际到手金额（2026年费率）。',
        monthlyGross: '月薪税前（新台币）',
        dependents: '扶养人数（含本人）',
        cardGross: '月薪税前',
        cardNet: '月薪税后到手',
        cardAnnual: '年薪到手（估算）',
        deductions: '月扣款明细',
        laborIns: '劳保费（员工自付 2.5%）',
        nhiIns: '健保费（员工自付 1.551%）',
        totalIns: '保费合计',
        incomeTax: '所得税（月估算）',
        note: '* 2026年（115年）：劳保费率12.5%（普通事故11.5%＋就业保险1%，员工负担20%），投保薪资上限45,800元；健保费率5.17%（员工负担30%，未计眷属），投保金额上限313,000元。所得税以115年度综合所得税试算（标准扣除额13.6万、薪资特扣额22.7万、免税额10.1万/人，级距61万/138万/277万/519万），115年度所得于2027年5月申报。',
    },
    en: {
        title: 'Taiwan Salary Calculator 2026',
        desc: 'Enter monthly salary to estimate take-home pay after labor insurance, NHI, and income tax (2026 rates).',
        monthlyGross: 'Monthly Gross Salary (NTD)',
        dependents: 'Dependents (including yourself)',
        cardGross: 'Monthly Gross',
        cardNet: 'Monthly Net',
        cardAnnual: 'Annual Net (estimate)',
        deductions: 'Monthly deductions',
        laborIns: 'Labor Insurance (employee 2.5%)',
        nhiIns: 'NHI (employee 1.551%)',
        totalIns: 'Total insurance',
        incomeTax: 'Income tax (monthly estimate)',
        note: '* 2026: labor insurance 12.5% (11.5% ordinary + 1% employment insurance, employee pays 20%), insured salary cap 45,800 NTD; NHI 5.17% (employee pays 30%, dependents not included), cap 313,000 NTD. Income tax estimated with the 2026 (ROC 115) comprehensive income tax figures: standard deduction 136,000 + salary deduction 227,000 + personal exemption 101,000/person, brackets at 610K/1.38M/2.77M/5.19M; 2026 income is filed in May 2027.',
    },
} as const;

// Labor Insurance 2026: employee pays 20% of 12.5% (11.5% ordinary + 1% employment) = 2.5%,
// capped at 45,800 NTD/month
const LI_CAP = 45_800;
const LI_RATE = 0.025;

// NHI 2026: employee pays 30% of 5.17% = 1.551%, capped at 313,000 NTD/month
const NHI_CAP = 313_000;
const NHI_RATE = 0.01551;

// Income tax 2026 (ROC 115, MOF announcement 2025-11-27)
// Standard deduction (single): 136,000
// Salary special deduction: 227,000 (capped at salary income)
// Personal exemption: 101,000 per person
const STANDARD_DEDUCTION = 136_000;
const SALARY_DEDUCTION   = 227_000;
const PERSONAL_EXEMPTION = 101_000;

function calcAnnualTax(annualGross: number, dependents: number): number {
    const totalDeduction =
        STANDARD_DEDUCTION +
        Math.min(SALARY_DEDUCTION, annualGross) +
        PERSONAL_EXEMPTION * dependents;

    const taxableIncome = Math.max(0, annualGross - totalDeduction);

    const brackets: [number, number][] = [
        [610_000, 0.05],
        [1_380_000 - 610_000, 0.12],
        [2_770_000 - 1_380_000, 0.20],
        [5_190_000 - 2_770_000, 0.30],
    ];

    let tax = 0;
    let remaining = taxableIncome;
    for (const [limit, rate] of brackets) {
        if (remaining <= 0) break;
        const taxable = Math.min(remaining, limit);
        tax += taxable * rate;
        remaining -= taxable;
    }
    if (remaining > 0) tax += remaining * 0.40;

    return Math.round(Math.max(0, tax));
}

const TaiwanSalaryCalculator: React.FC<Props> = ({ locale = 'zh' }) => {
    const t = labels[locale === 'en' ? 'en' : 'zh'];

    const [monthlyGross, setMonthlyGross] = useState(50_000);
    const [dependents, setDependents] = useState(1);

    // Labor Insurance
    const liBase = Math.min(monthlyGross, LI_CAP);
    const laborIns = Math.round(liBase * LI_RATE);

    // NHI
    const nhiBase = Math.min(monthlyGross, NHI_CAP);
    const nhiIns = Math.round(nhiBase * NHI_RATE);

    const totalIns = laborIns + nhiIns;

    // Income tax (annual estimate, divided monthly)
    const annualTax    = calcAnnualTax(monthlyGross * 12, dependents);
    const monthlyTax   = Math.round(annualTax / 12);

    const monthlyNet = Math.max(0, monthlyGross - totalIns - monthlyTax);
    const annualNet  = monthlyNet * 12;

    const fmt = (n: number) => `NT$${n.toLocaleString('zh-TW')}`;

    const handleReset = () => {
        setMonthlyGross(50_000);
        setDependents(1);
    };

    return (
        <GameContainer title={t.title} subtitle="Net Pay Estimator — Taiwan 2026" onReset={handleReset}>
            <div className="flex flex-col gap-5 sm:gap-8">
                <p className="text-sm font-medium text-muted-foreground text-center">{t.desc}</p>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-foreground">{t.monthlyGross}</label>
                        <input
                            type="number"
                            value={monthlyGross}
                            onChange={(e) => setMonthlyGross(Math.max(0, Number(e.target.value)))}
                            step={5_000}
                            min={0}
                            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-info/30"
                            aria-label={t.monthlyGross}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-foreground">{t.dependents}</label>
                        <input
                            type="number"
                            value={dependents}
                            onChange={(e) => setDependents(Math.max(1, Math.min(10, Number(e.target.value))))}
                            step={1}
                            min={1}
                            max={10}
                            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-info/30"
                            aria-label={t.dependents}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-2xl bg-info/10 border border-info/30 p-5 flex flex-col gap-1">
                        <span className="text-xs font-bold text-info uppercase tracking-wide">{t.cardGross}</span>
                        <span className="text-2xl font-bold text-info">{fmt(monthlyGross)}</span>
                    </div>
                    <div className="rounded-2xl bg-info p-5 flex flex-col gap-1">
                        <span className="text-xs font-bold text-info uppercase tracking-wide">{t.cardNet}</span>
                        <span className="text-2xl font-bold text-white">{fmt(monthlyNet)}</span>
                    </div>
                    <div className="rounded-2xl bg-info/10 border border-info/30 p-5 flex flex-col gap-1">
                        <span className="text-xs font-bold text-info uppercase tracking-wide">{t.cardAnnual}</span>
                        <span className="text-2xl font-bold text-info">{fmt(annualNet)}</span>
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-6 flex flex-col gap-3">
                    <h4 className="text-sm font-bold text-foreground">{t.deductions}</h4>
                    <div className="flex flex-col gap-2">
                        {[
                            { label: t.laborIns, value: laborIns },
                            { label: t.nhiIns,   value: nhiIns },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium">{label}</span>
                                <span className="font-bold text-foreground">{fmt(value)}</span>
                            </div>
                        ))}
                        <div className="border-t border-border mt-2 pt-2 flex justify-between items-center">
                            <span className="text-sm font-bold text-foreground">{t.totalIns}</span>
                            <span className="text-sm font-bold text-destructive">{fmt(totalIns)}</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-6 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-sm border-t border-border pt-2">
                        <span className="font-bold text-foreground">{t.incomeTax}</span>
                        <span className="font-bold text-destructive">{fmt(monthlyTax)}</span>
                    </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">{t.note}</p>
            </div>
        </GameContainer>
    );
};

export default TaiwanSalaryCalculator;
