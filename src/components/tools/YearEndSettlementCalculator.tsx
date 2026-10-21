import React, { useState } from 'react';
import { GameContainer } from '../ui/game/GamePrimitives';
import { PERSONAL_DEDUCTION_PER_PERSON, settleYearEnd } from '../../lib/kr-year-end-2026';

const YearEndSettlementCalculator: React.FC<{ locale?: 'ko' | 'en' }> = ({ locale = 'ko' }) => {
    const t = {
        ko: {
            title: "연말정산 환급 예측기",
            desc: "주요 공제 항목을 입력해 예상 환급액 또는 추가 납부 세액을 계산합니다.",
            grossSalary: "연봉 (원)",
            dependents: "부양가족 수 (본인 포함)",
            insurancePremium: "보험료 납부액 (연, 원)",
            creditCardTotal: "신용카드 사용액 (연, 원)",
            debitCardTotal: "체크카드·현금영수증 (연, 원)",
            pensionSavings: "연금저축 납입액 (연, 원)",
            irpTotal: "IRP 납입액 (연, 원)",
            rentTotal: "월세 납부액 (연, 원)",
            children: "기본공제 대상 자녀 수 (카드 한도 상향)",
            creditChildren: "자녀세액공제 대상 자녀 수 (9~20세)",
            medicalExpenses: "의료비 (연, 원)",
            alreadyWithheld: "이미 납부한 근로소득세 (연, 원, 지방소득세 제외)",
            calcBtn: "연말정산 계산",
            result: "예상 결과",
            totalIncomeTax: "산출 소득세",
            totalDeduction: "세액공제 합계",
            finalTax: "결정 세액",
            alreadyPaid: "기납부 세액",
            refund: "환급 예상액",
            additionalTax: "추가 납부 예상액",
            breakdown: "공제 내역",
            personalDeduction: "인적공제",
            taxBase: "과세표준",
            earnedTaxCredit: "근로소득세액공제",
            childCredit: "자녀세액공제",
            insuranceDeduction: "보험료 세액공제 (12%, 100만 원 한도)",
            creditCardDeduction: "신용카드 등 소득공제 (총급여 25% 초과분)",
            pensionDeduction: "연금계좌 세액공제 (15%/12%)",
            medicalDeduction: "의료비 세액공제",
            rentDeduction: "월세 세액공제",
            standardCredit: "표준세액공제 (특별공제 대신)",
            note: "* 2026년 귀속(2027년 1~2월 정산) 기준 간이 계산이에요(법령 확인 2026-10-19). 근로소득만 있다고 보고, 특별공제와 표준세액공제 13만 원 중 유리한 쪽을 골라요. 의료비는 일반 부양가족 700만 원 한도로 계산해요. 정확한 세액은 국세청 홈택스에서 확인해 주세요.",
        },
        en: {
            title: "Year-End Tax Settlement Estimator",
            desc: "Enter key deduction items to estimate your expected tax refund or additional payment.",
            grossSalary: "Annual Gross Salary (KRW)",
            dependents: "Dependents (incl. yourself)",
            insurancePremium: "Insurance Premiums (annual, KRW)",
            creditCardTotal: "Credit Card Spending (annual, KRW)",
            debitCardTotal: "Debit Card / Cash Receipts (annual, KRW)",
            pensionSavings: "Pension Savings Account (annual, KRW)",
            irpTotal: "IRP Contributions (annual, KRW)",
            rentTotal: "Monthly Rent Paid (annual total, KRW)",
            children: "Dependent Children (raises card limit)",
            creditChildren: "Children Eligible for Child Credit (age 9–20)",
            medicalExpenses: "Medical Expenses (annual, KRW)",
            alreadyWithheld: "Withheld Income Tax (annual, KRW, excl. local tax)",
            calcBtn: "Calculate Settlement",
            result: "Estimated Result",
            totalIncomeTax: "Calculated Income Tax",
            totalDeduction: "Total Tax Credits",
            finalTax: "Final Tax Due",
            alreadyPaid: "Already Withheld",
            refund: "Estimated Refund",
            additionalTax: "Additional Tax Due",
            breakdown: "Deduction Breakdown",
            personalDeduction: "Personal Deduction",
            taxBase: "Tax Base",
            earnedTaxCredit: "Earned Income Tax Credit",
            childCredit: "Child Tax Credit",
            insuranceDeduction: "Insurance Tax Credit (12%, up to ₩1M premium)",
            creditCardDeduction: "Card Spending Income Deduction (above 25% of salary)",
            pensionDeduction: "Pension Account Tax Credit (15%/12%)",
            medicalDeduction: "Medical Expense Tax Credit",
            rentDeduction: "Monthly Rent Tax Credit",
            standardCredit: "Standard Tax Credit (instead of itemized)",
            note: "* Simplified estimate under Korean rules for tax year 2026 (settled Jan–Feb 2027; law checked 2026-10-19). Assumes wage income only and picks the better of itemized credits or the ₩130,000 standard credit. Use NTS Hometax for exact figures.",
        },
    }[locale === 'ko' ? 'ko' : 'en'];

    const [grossSalary, setGrossSalary] = useState(50000000);
    const [dependents, setDependents] = useState(1);
    const [insurancePremium, setInsurancePremium] = useState(1200000);
    const [creditCardTotal, setCreditCardTotal] = useState(10000000);
    const [debitCardTotal, setDebitCardTotal] = useState(5000000);
    const [pensionSavings, setPensionSavings] = useState(3000000);
    const [irpTotal, setIrpTotal] = useState(0);
    const [medicalExpenses, setMedicalExpenses] = useState(1000000);
    const [rentTotal, setRentTotal] = useState(0);
    const [children, setChildren] = useState(0);
    const [creditChildren, setCreditChildren] = useState(0);
    const [alreadyWithheld, setAlreadyWithheld] = useState(2000000);

    const fmt = (n: number) => Math.abs(Math.round(n)).toLocaleString('ko-KR');

    // Every rate, limit and threshold lives in src/lib/kr-year-end-2026.ts (2026년 귀속, checked 2026-10-19).
    const r = settleYearEnd({
        salary: grossSalary,
        persons: dependents,
        card: { credit: creditCardTotal, debit: debitCardTotal },
        cardChildren: children,
        creditChildren,
        insurancePremium,
        medical: medicalExpenses,
        pensionSavings,
        irp: irpTotal,
        rent: rentTotal,
    });
    const personalDeductionAmt = Math.max(1, dependents) * PERSONAL_DEDUCTION_PER_PERSON;

    // Refund or additional payment (national income tax only; 지방소득세 is settled separately)
    const diff = alreadyWithheld - r.finalTax;
    const isRefund = diff >= 0;

    const handleReset = () => {
        setGrossSalary(50000000);
        setDependents(1);
        setInsurancePremium(1200000);
        setCreditCardTotal(10000000);
        setDebitCardTotal(5000000);
        setPensionSavings(3000000);
        setIrpTotal(0);
        setMedicalExpenses(1000000);
        setRentTotal(0);
        setChildren(0);
        setCreditChildren(0);
        setAlreadyWithheld(2000000);
    };

    const inputClass = "w-full rounded-xl border border-border bg-background px-4 py-3 text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-success/30";

    return (
        <GameContainer title={t.title} subtitle="Year-End Tax Settlement" onReset={handleReset}>
            <div className="flex flex-col gap-5 sm:gap-8">
                <p className="text-sm font-medium text-muted-foreground text-center">{t.desc}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-foreground">{t.grossSalary}</label>
                        <input type="number" value={grossSalary} onChange={(e) => setGrossSalary(Math.max(0, Number(e.target.value)))} step={1000000} min={0} className={inputClass} aria-label={t.grossSalary} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-foreground">{t.dependents}</label>
                        <input type="number" value={dependents} onChange={(e) => setDependents(Math.max(1, Math.min(10, Number(e.target.value))))} step={1} min={1} max={10} className={inputClass} aria-label={t.dependents} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-foreground">{t.insurancePremium}</label>
                        <input type="number" value={insurancePremium} onChange={(e) => setInsurancePremium(Math.max(0, Number(e.target.value)))} step={100000} min={0} className={inputClass} aria-label={t.insurancePremium} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-foreground">{t.medicalExpenses}</label>
                        <input type="number" value={medicalExpenses} onChange={(e) => setMedicalExpenses(Math.max(0, Number(e.target.value)))} step={100000} min={0} className={inputClass} aria-label={t.medicalExpenses} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-foreground">{t.creditCardTotal}</label>
                        <input type="number" value={creditCardTotal} onChange={(e) => setCreditCardTotal(Math.max(0, Number(e.target.value)))} step={500000} min={0} className={inputClass} aria-label={t.creditCardTotal} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-foreground">{t.debitCardTotal}</label>
                        <input type="number" value={debitCardTotal} onChange={(e) => setDebitCardTotal(Math.max(0, Number(e.target.value)))} step={500000} min={0} className={inputClass} aria-label={t.debitCardTotal} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-foreground">{t.pensionSavings}</label>
                        <input type="number" value={pensionSavings} onChange={(e) => setPensionSavings(Math.max(0, Number(e.target.value)))} step={100000} min={0} className={inputClass} aria-label={t.pensionSavings} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-foreground">{t.irpTotal}</label>
                        <input type="number" value={irpTotal} onChange={(e) => setIrpTotal(Math.max(0, Number(e.target.value)))} step={100000} min={0} className={inputClass} aria-label={t.irpTotal} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-foreground">{t.rentTotal}</label>
                        <input type="number" value={rentTotal} onChange={(e) => setRentTotal(Math.max(0, Number(e.target.value)))} step={100000} min={0} className={inputClass} aria-label={t.rentTotal} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-foreground">{t.children}</label>
                        <input type="number" value={children} onChange={(e) => setChildren(Math.max(0, Math.min(10, Number(e.target.value))))} step={1} min={0} max={10} className={inputClass} aria-label={t.children} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-foreground">{t.creditChildren}</label>
                        <input type="number" value={creditChildren} onChange={(e) => setCreditChildren(Math.max(0, Math.min(10, Number(e.target.value))))} step={1} min={0} max={10} className={inputClass} aria-label={t.creditChildren} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-foreground">{t.alreadyWithheld}</label>
                        <input type="number" value={alreadyWithheld} onChange={(e) => setAlreadyWithheld(Math.max(0, Number(e.target.value)))} step={100000} min={0} className={inputClass} aria-label={t.alreadyWithheld} />
                    </div>
                </div>

                {/* Result summary */}
                <div className={`rounded-2xl p-4 sm:p-6 border-2 text-center ${isRefund ? 'bg-success/10 border-success' : 'bg-warning/10 border-warning'}`}>
                    <p className={`text-sm font-bold uppercase tracking-wide mb-2 ${isRefund ? 'text-success' : 'text-warning'}`}>
                        {isRefund ? t.refund : t.additionalTax}
                    </p>
                    <p className={`text-4xl font-bold ${isRefund ? 'text-success' : 'text-warning'}`}>
                        {isRefund ? '+' : '-'}₩{fmt(Math.abs(diff))}
                    </p>
                </div>

                {/* Breakdown */}
                <div className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-6 flex flex-col gap-3">
                    <h4 className="text-sm font-bold text-foreground">{t.breakdown}</h4>
                    {[
                        { label: t.personalDeduction, value: `-₩${fmt(personalDeductionAmt)}` },
                        { label: t.creditCardDeduction, value: `-₩${fmt(r.cardDeduction)}` },
                        { label: t.taxBase, value: `₩${fmt(r.taxBase)}` },
                        { label: t.totalIncomeTax, value: `₩${fmt(r.calculatedTax)}` },
                        { label: t.earnedTaxCredit, value: `-₩${fmt(r.earnedTaxCredit)}` },
                        { label: t.childCredit, value: `-₩${fmt(r.childCredit)}` },
                        { label: t.pensionDeduction, value: `-₩${fmt(r.pensionCredit)}` },
                        ...(r.usedStandard
                            ? [{ label: t.standardCredit, value: `-₩${fmt(r.standardCredit)}` }]
                            : [
                                { label: t.insuranceDeduction, value: `-₩${fmt(r.insuranceCredit)}` },
                                { label: t.medicalDeduction, value: `-₩${fmt(r.medicalCredit)}` },
                                { label: t.rentDeduction, value: `-₩${fmt(r.rentCredit)}` },
                            ]),
                        { label: t.totalDeduction, value: `-₩${fmt(r.totalCredits)}` },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground font-medium">{label}</span>
                            <span className="font-bold text-foreground">{value}</span>
                        </div>
                    ))}
                    <div className="border-t border-border mt-1 pt-3 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-foreground">{t.finalTax}</span>
                            <span className="text-sm font-bold text-foreground">₩{fmt(r.finalTax)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-muted-foreground">{t.alreadyPaid}</span>
                            <span className="text-sm font-bold text-foreground">₩{fmt(alreadyWithheld)}</span>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">{t.note}</p>
            </div>
        </GameContainer>
    );
};

export default YearEndSettlementCalculator;
