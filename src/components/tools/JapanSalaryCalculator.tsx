import React, { useState } from 'react';
import { GameContainer } from '@/components/ui/game/GamePrimitives';

interface Props {
    locale?: 'ja' | 'en';
}

const labels = {
    ja: {
        title: '日本の給与手取り計算機 2026',
        desc: '所得税・社会保険・住民税を自動計算します（令和8年分）。',
        annualSalary: '年収（円）',
        age40plus: '40歳以上（介護保険の対象）',
        monthlyGross: '月額総支給',
        monthlyNet: '月額手取り',
        annualNet: '年間手取り',
        deductions: '月額控除内訳',
        healthInsurance: '健康保険 (4.925%)',
        childSupport: '子ども・子育て支援金 (0.115%)',
        longTermCare: '介護保険 (0.81%)',
        pension: '厚生年金 (9.15%)',
        employment: '雇用保険 (0.5%)',
        incomeTax: '所得税（復興税込み）',
        residentTax: '住民税（概算）',
        totalDeduction: '合計控除額',
        note: '※ 令和8年分の概算です：協会けんぽ東京支部（健康保険9.85%・介護保険1.62%、子ども・子育て支援金0.23%は2026年4月分から）、雇用保険0.5%（令和8年度）、給与所得控除の最低保障74万円・基礎控除62万円＋特例加算（合計所得489万円以下は104万円）を反映。令和8年分の控除引上げは毎月の源泉徴収ではなく年末調整で精算されます。住民税は前年所得をもとに課税されるため、1年遅れで変動します。',
    },
    en: {
        title: 'Japan Salary Calculator 2026',
        desc: 'Automatically calculate income tax, social insurance, and resident tax (2026 tax year).',
        annualSalary: 'Annual Salary (¥)',
        age40plus: 'Age 40+ (Long-term care insurance applies)',
        monthlyGross: 'Monthly Gross',
        monthlyNet: 'Monthly Net',
        annualNet: 'Annual Net',
        deductions: 'Monthly Deductions',
        healthInsurance: 'Health Insurance (4.925%)',
        childSupport: 'Child & Childcare Support Levy (0.115%)',
        longTermCare: 'Long-term Care Ins. (0.81%)',
        pension: "Employee's Pension (9.15%)",
        employment: 'Employment Insurance (0.5%)',
        incomeTax: 'Income Tax (incl. reconstruction surtax)',
        residentTax: 'Resident Tax (estimate)',
        totalDeduction: 'Total Deductions',
        note: '* 2026 estimate: Kyokai Kenpo Tokyo (health 9.85%, long-term care 1.62%, child support levy 0.23% from April 2026), employment insurance 0.5% (FY2026), employment income deduction minimum ¥740,000 and basic deduction ¥620,000 plus the 2026–27 special addition (¥1,040,000 total up to ¥4.89M total income). The 2026 deduction increases are settled at year-end adjustment rather than in monthly withholding. Resident tax is based on prior-year income and lags by one year.',
    },
} as const;

/** 給与所得控除（令和8年分: 収入220万円以下は74万円＝本則69万円＋特例5万円）*/
function calcEmploymentIncomeDeduction(annual: number): number {
    if (annual <= 2_200_000) return Math.min(annual, 740_000);
    if (annual <= 3_600_000) return Math.floor(annual * 0.3 + 80_000);
    if (annual <= 6_600_000) return Math.floor(annual * 0.2 + 440_000);
    if (annual <= 8_500_000) return Math.floor(annual * 0.1 + 1_100_000);
    return 1_950_000;
}

/** 基礎控除（令和8年分: 本則62万円＋令和8・9年の特例加算）*/
function calcBasicDeduction(totalIncome: number): number {
    if (totalIncome <= 4_890_000) return 1_040_000;
    if (totalIncome <= 6_550_000) return 670_000;
    if (totalIncome <= 23_500_000) return 620_000;
    if (totalIncome <= 24_000_000) return 480_000;
    if (totalIncome <= 24_500_000) return 320_000;
    if (totalIncome <= 25_000_000) return 160_000;
    return 0;
}

/** 所得税額（課税所得に対する速算表＋復興特別所得税）*/
function calcIncomeTax(taxableIncome: number): number {
    if (taxableIncome <= 0) return 0;
    let base = 0;
    if (taxableIncome <= 1_950_000) {
        base = Math.floor(taxableIncome * 0.05);
    } else if (taxableIncome <= 3_300_000) {
        base = Math.floor(taxableIncome * 0.1 - 97_500);
    } else if (taxableIncome <= 6_950_000) {
        base = Math.floor(taxableIncome * 0.2 - 427_500);
    } else if (taxableIncome <= 9_000_000) {
        base = Math.floor(taxableIncome * 0.23 - 636_000);
    } else if (taxableIncome <= 18_000_000) {
        base = Math.floor(taxableIncome * 0.33 - 1_536_000);
    } else if (taxableIncome <= 40_000_000) {
        base = Math.floor(taxableIncome * 0.4 - 2_796_000);
    } else {
        base = Math.floor(taxableIncome * 0.45 - 4_796_000);
    }
    // 復興特別所得税: 2.1%
    return Math.floor(base * 1.021);
}

const JapanSalaryCalculator: React.FC<Props> = ({ locale = 'ja' }) => {
    const t = labels[locale === 'ja' ? 'ja' : 'en'];

    const [annualSalary, setAnnualSalary] = useState(5_000_000);
    const [age40plus, setAge40plus] = useState(false);

    const monthlyGross = Math.floor(annualSalary / 12);

    // 社会保険料（協会けんぽ東京支部 令和8年度、月額標準報酬 = 月額総支給で近似）
    // 健康保険 9.85% / 介護保険 1.62% / 子ども・子育て支援金 0.23% / 厚生年金 18.3% を労使折半、雇用保険 0.5%
    const healthIns = Math.floor(monthlyGross * 0.04925);
    const childSupportIns = Math.floor(monthlyGross * 0.00115);
    const longTermCareIns = age40plus ? Math.floor(monthlyGross * 0.0081) : 0;
    // 厚生年金の標準報酬月額上限 65万円（2026年時点）
    const pensionIns = Math.floor(Math.min(monthlyGross, 650_000) * 0.0915);
    const employmentIns = Math.floor(monthlyGross * 0.005);

    const annualSocialIns = (healthIns + childSupportIns + longTermCareIns + pensionIns + employmentIns) * 12;

    // 給与所得控除
    const employmentDeduction = calcEmploymentIncomeDeduction(annualSalary);

    // 合計所得金額（給与所得のみ）と基礎控除
    const employmentIncome = Math.max(0, annualSalary - employmentDeduction);
    const basicDeduction = calcBasicDeduction(employmentIncome);

    // 課税所得 = 給与所得 - 社会保険料 - 基礎控除
    const taxableIncome = Math.max(0, employmentIncome - annualSocialIns - basicDeduction);

    // 所得税（月割り）
    const annualIncomeTax = calcIncomeTax(taxableIncome);
    const monthlyIncomeTax = Math.floor(annualIncomeTax / 12);

    // 住民税: 所得割10%（住民税の基礎控除43万円）+ 均等割・森林環境税5,000円/年
    const residentTaxable = Math.max(0, employmentIncome - annualSocialIns - 430_000);
    const annualResidentTax = residentTaxable > 0 ? Math.floor(residentTaxable * 0.1) + 5_000 : 0;
    const monthlyResidentTax = Math.floor(annualResidentTax / 12);

    const totalMonthlyDeduction =
        healthIns + childSupportIns + longTermCareIns + pensionIns + employmentIns + monthlyIncomeTax + monthlyResidentTax;

    const monthlyNet = Math.max(0, monthlyGross - totalMonthlyDeduction);
    const annualNet = monthlyNet * 12;

    const fmt = (n: number) => n.toLocaleString('ja-JP');
    const fmtMan = (n: number) => {
        const man = Math.floor(n / 10_000);
        return man > 0 ? `${man.toLocaleString('ja-JP')}万${(n % 10_000).toLocaleString('ja-JP')}円` : `${n.toLocaleString('ja-JP')}円`;
    };

    const handleReset = () => {
        setAnnualSalary(5_000_000);
        setAge40plus(false);
    };

    const deductionRows = [
        { label: t.healthInsurance, value: healthIns },
        { label: t.childSupport, value: childSupportIns },
        ...(age40plus ? [{ label: t.longTermCare, value: longTermCareIns }] : []),
        { label: t.pension, value: pensionIns },
        { label: t.employment, value: employmentIns },
        { label: t.incomeTax, value: monthlyIncomeTax },
        { label: t.residentTax, value: monthlyResidentTax },
    ];

    return (
        <GameContainer title={t.title} subtitle="Net Pay Estimator — Japan 2026" onReset={handleReset}>
            <div className="flex flex-col gap-5 sm:gap-8">
                <p className="text-sm font-medium text-muted-foreground text-center">{t.desc}</p>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-foreground">{t.annualSalary}</label>
                        <input
                            type="number"
                            value={annualSalary}
                            onChange={(e) => setAnnualSalary(Math.max(0, Number(e.target.value)))}
                            step={100_000}
                            min={0}
                            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-success/30"
                            aria-label={t.annualSalary}
                        />
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={age40plus}
                            onChange={(e) => setAge40plus(e.target.checked)}
                            className="w-4 h-4 rounded accent-success"
                            aria-label={t.age40plus}
                        />
                        <span className="text-sm font-medium text-foreground">{t.age40plus}</span>
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-2xl bg-success/10 border border-success/30 p-5 flex flex-col gap-1">
                        <span className="text-xs font-bold text-success uppercase tracking-wide">{t.monthlyGross}</span>
                        <span className="text-2xl font-bold text-success">¥{fmt(monthlyGross)}</span>
                    </div>
                    <div className="rounded-2xl bg-success p-5 flex flex-col gap-1">
                        <span className="text-xs font-bold text-success uppercase tracking-wide">{t.monthlyNet}</span>
                        <span className="text-2xl font-bold text-white">¥{fmt(monthlyNet)}</span>
                    </div>
                    <div className="rounded-2xl bg-success/10 border border-success/30 p-5 flex flex-col gap-1">
                        <span className="text-xs font-bold text-success uppercase tracking-wide">{t.annualNet}</span>
                        <span className="text-xl font-bold text-success">{fmtMan(annualNet)}</span>
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-6 flex flex-col gap-3">
                    <h4 className="text-sm font-bold text-foreground">{t.deductions}</h4>
                    <div className="flex flex-col gap-2">
                        {deductionRows.map(({ label, value }) => (
                            <div key={label} className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium">{label}</span>
                                <span className="font-bold text-foreground">¥{fmt(value)}</span>
                            </div>
                        ))}
                        <div className="border-t border-border mt-2 pt-2 flex justify-between items-center">
                            <span className="text-sm font-bold text-foreground">{t.totalDeduction}</span>
                            <span className="text-sm font-bold text-destructive">¥{fmt(totalMonthlyDeduction)}</span>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">{t.note}</p>
            </div>
        </GameContainer>
    );
};

export default JapanSalaryCalculator;
