import React, { useState, useMemo } from 'react';
import { settleYearEnd } from '../../lib/kr-year-end-2026';
import { parseYearEndSalary } from '../../lib/year-end-salary-input';

function fmt(n: number) {
  return Math.round(n).toLocaleString('ko-KR');
}

// Every rate, limit and threshold lives in src/lib/kr-year-end-2026.ts (2026년 귀속, checked 2026-10-19).
// This component only collects inputs and shows the result.

interface DeductionItem {
  id: string;
  label: string;
  sublabel: string;
  value: string;
}

const INITIAL_DEDUCTIONS: DeductionItem[] = [
  { id: 'insurance', label: '국민연금 보험료', sublabel: '연간 납부액 (전액 소득공제)', value: '' },
  { id: 'health', label: '건강보험료', sublabel: '연간 납부액 (장기요양 포함, 전액 소득공제)', value: '' },
  { id: 'employment', label: '고용보험료', sublabel: '연간 납부액 (전액 소득공제)', value: '' },
  { id: 'credit', label: '신용카드 사용액', sublabel: '연간 총액 (총급여 25% 초과분 15%, 한도 300만/250만 원)', value: '' },
  { id: 'debit', label: '체크카드·현금영수증', sublabel: '연간 총액 (25% 문턱을 넘은 금액의 30%)', value: '' },
  { id: 'premium', label: '보장성 보험료', sublabel: '연간 납입액 (100만 원까지 12% 세액공제)', value: '' },
  { id: 'medical', label: '의료비', sublabel: '본인·부양가족 의료비 (총급여 3% 초과분 15%, 700만 원 한도로 단순화)', value: '' },
  { id: 'education', label: '교육비', sublabel: '본인·부양가족 교육비 (15%, 1인 한도는 단순화)', value: '' },
  { id: 'donation', label: '기부금', sublabel: '1,000만 원 이하 15%, 초과분 30% (소득금액 한도 생략)', value: '' },
  { id: 'pension_savings', label: '연금저축 납입액', sublabel: '연간 납입액 (600만 원 한도, 15%·12%, 지방세 별도)', value: '' },
  { id: 'irp', label: 'IRP 납입액', sublabel: '연금저축과 합산 900만 원 한도 (총급여 5,500만 원 이하 15%, 초과 12%)', value: '' },
  { id: 'rent', label: '월세 납부액', sublabel: '연간 합계 (무주택 세대주, 총급여 8,000만 원 이하, 1,000만 원 한도 15~17%)', value: '' },
];

export default function YearEndTaxCalculator({ locale = 'ko' }: { locale?: 'ko' | 'en' } = {}) {
  const [salary, setSalary] = useState('');
  const [salaryDisplay, setSalaryDisplay] = useState('');
  const [paidTax, setPaidTax] = useState('');
  const [paidTaxDisplay, setPaidTaxDisplay] = useState('');
  const [dependents, setDependents] = useState(0);
  const [deductions, setDeductions] = useState(INITIAL_DEDUCTIONS);
  const [rentEligible, setRentEligible] = useState(false);

  const handleSalary = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setSalary(raw);
    setSalaryDisplay(raw);
  };

  const handlePaidTax = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '').replace(/[^0-9]/g, '');
    setPaidTax(raw);
    const num = parseInt(raw) || 0;
    setPaidTaxDisplay(num > 0 ? num.toLocaleString('ko-KR') : raw);
  };

  const handleDeduction = (id: string, raw: string) => {
    const cleaned = raw.replace(/,/g, '').replace(/[^0-9]/g, '');
    setDeductions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, value: cleaned } : d))
    );
  };

  const result = useMemo(() => {
    const annualSalary = parseYearEndSalary(salary);
    if (annualSalary === null || annualSalary === 0) return null;
    const val = (id: string) => parseInt(deductions.find((d) => d.id === id)?.value || '0') || 0;

    // 본인 1명 + 부양가족. 표준세액공제와 특별공제 중 유리한 쪽은 settleYearEnd가 고른다.
    const r = settleYearEnd({
      salary: annualSalary,
      persons: 1 + dependents,
      nationalPension: val('insurance'),
      healthEmployment: val('health') + val('employment'),
      card: { credit: val('credit'), debit: val('debit') },
      insurancePremium: val('premium'),
      medical: val('medical'),
      education: val('education'),
      donation: val('donation'),
      pensionSavings: val('pension_savings'),
      irp: val('irp'),
      rent: val('rent'),
      rentEligible,
    });

    // 기납부세액은 소득세+지방소득세로 입력받으므로 지방세 포함 결정세액과 비교한다.
    const alreadyPaid = parseInt(paidTax) || 0;
    return {
      annualSalary,
      earnedDeduction: r.earnedDeduction,
      otherIncomeDeductions: r.incomeDeductions,
      taxableIncome: r.taxBase,
      calculatedTax: r.calculatedTax,
      earnedTaxCredit: r.earnedTaxCredit,
      otherTaxCredits: r.totalCredits - r.earnedTaxCredit,
      usedStandard: r.usedStandard,
      totalFinalTax: r.totalTax,
      alreadyPaid,
      refundOrPay: alreadyPaid - r.totalTax,
    };
  }, [salary, paidTax, dependents, deductions, rentEligible]);

  return (
    <div className="not-prose my-5 sm:my-8 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💸</span>
          <div>
            <h3 className="font-bold text-white text-lg leading-tight">연말정산 간이 계산기</h3>
            <p className="text-green-100 text-xs mt-0.5">
              2026년 귀속(2027년 1~2월 정산) 기준 간이 추정 (실제와 차이 있을 수 있음)
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* 기본 정보 */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold mb-1.5">연간 총급여 (원)</label>
            <input
              type="text"
              inputMode="numeric"
              value={salaryDisplay}
              onChange={handleSalary}
              aria-label={locale === 'en' ? 'Annual gross salary (KRW)' : '연간 총급여 (원)'}
              aria-invalid={salary.trim() !== '' && parseYearEndSalary(salary) === null}
              aria-describedby="year-end-salary-error"
              placeholder="예: 50,000,000"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-right font-mono font-semibold focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
            {salary.trim() !== '' && parseYearEndSalary(salary) === null && (
              <p id="year-end-salary-error" role="alert" className="mt-2 text-sm text-destructive">{locale === 'en' ? 'Enter a non-negative whole amount in KRW. Commas may separate groups of three digits. No result is calculated from an invalid value.' : '총급여는 0 이상의 원 단위 정수로 입력해 주세요. 쉼표는 세 자리마다 쓸 수 있어요. 잘못된 값으로 결과를 계산하지 않아요.'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">기납부 세액 (원)</label>
            <input
              type="text"
              inputMode="numeric"
              value={paidTaxDisplay}
              onChange={handlePaidTax}
              placeholder="이미 납부한 소득세+지방세"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-right font-mono font-semibold focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
          </div>
        </div>

        {/* 부양가족 */}
        <div>
          <label className="block text-sm font-semibold mb-2">부양가족 수 (본인 제외)</label>
          <div className="flex gap-2 flex-wrap">
            {[0, 1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setDependents(n)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  dependents === n
                    ? 'bg-green-600 text-white border-green-600'
                    : 'border-border text-muted-foreground hover:border-green-400'
                }`}
              >
                {n}명
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            배우자·자녀·부모 등 기본공제 대상 (1인당 연 150만 원 소득공제)
          </p>
        </div>

        {/* 주요 공제 항목 */}
        <div>
          <p className="text-sm font-semibold mb-3 text-foreground">주요 공제 항목 입력 (선택)</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {deductions.map((d) => (
              <div key={d.id}>
                <label className="block text-xs font-semibold mb-1 text-foreground">{d.label}</label>
                <p className="text-xs text-muted-foreground mb-1">{d.sublabel}</p>
                <input
                  type="text"
                  inputMode="numeric"
                  value={d.value ? parseInt(d.value).toLocaleString('ko-KR') : ''}
                  onChange={(e) => handleDeduction(d.id, e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-right text-sm font-mono focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>
            ))}
          </div>
        </div>

        <label className="block text-sm">
          <input type="checkbox" checked={rentEligible} onChange={(e) => setRentEligible(e.target.checked)} />
          한국 월세 세액공제 요건(무주택 세대·주택 기준·계약자·전입·지급 증빙 등)을 확인했어요
        </label>
        <p className="text-sm text-muted-foreground">확인 전에는 입력한 월세를 공제에 적용하지 않아요. 체크는 본인 확인이며 자동 자격 판정이 아니에요. 소득 한도 등 다른 계산 조건도 충족해야 해요.</p>

        {/* 결과 */}
        {result && (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="bg-muted/40 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              계산 결과
            </div>
            <div className="divide-y divide-border/60">
              {[
                { label: '연간 총급여', value: fmt(result.annualSalary), unit: '원' },
                { label: '근로소득공제', value: `− ${fmt(result.earnedDeduction)}`, unit: '원', muted: true },
                { label: '소득공제 합계 (인적·보험료·카드)', value: `− ${fmt(result.otherIncomeDeductions)}`, unit: '원', muted: true },
                { label: '과세표준', value: fmt(result.taxableIncome), unit: '원', bold: true },
                { label: '산출세액', value: fmt(result.calculatedTax), unit: '원' },
                { label: '근로소득세액공제', value: `− ${fmt(result.earnedTaxCredit)}`, unit: '원', muted: true },
                {
                  label: result.usedStandard ? '기타 세액공제 (표준세액공제 13만 원 포함)' : '기타 세액공제 (연금·특별·월세)',
                  value: `− ${fmt(result.otherTaxCredits)}`,
                  unit: '원',
                  muted: true,
                },
                { label: '결정세액 (지방세 포함)', value: fmt(result.totalFinalTax), unit: '원', bold: true },
                { label: '기납부세액', value: fmt(result.alreadyPaid), unit: '원', muted: true },
              ].map((row) => (
                <div key={row.label} className={`flex justify-between items-center px-5 py-3 ${row.bold ? 'bg-muted/20' : ''}`}>
                  <span className={`text-sm ${row.muted ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                    {row.label}
                  </span>
                  <span className={`font-mono text-sm ${row.bold ? 'font-bold' : ''}`}>
                    {row.value} {row.unit}
                  </span>
                </div>
              ))}
              {/* 환급/추가납부 */}
              <div className={`flex justify-between items-center px-5 py-4 ${
                result.refundOrPay >= 0
                  ? 'bg-green-50'
                  : 'bg-red-50'
              }`}>
                <span className={`font-bold text-base ${result.refundOrPay >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {result.refundOrPay >= 0 ? '예상 환급액' : '예상 추가 납부액'}
                </span>
                <span className={`font-mono font-extrabold text-xl ${result.refundOrPay >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {result.refundOrPay >= 0 ? '+' : ''}{fmt(result.refundOrPay)} 원
                </span>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          ※ 간이 계산 결과입니다. 실제 연말정산은 개인 상황에 따라 달라집니다.
          정확한 계산은 <a href="https://www.hometax.go.kr" target="_blank" rel="noopener noreferrer" className="text-green-600 underline">국세청 홈택스</a>를 이용하세요.
        </p>
      </div>
    </div>
  );
}
