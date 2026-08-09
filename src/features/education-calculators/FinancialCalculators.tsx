import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupTextarea } from '@/components/ui/input-group';
import { calculateNpv, validateNpvInput, type NpvValidationError } from '@/lib/finance/npv';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up'
import Calculator from 'lucide-react/dist/esm/icons/calculator'
import Target from 'lucide-react/dist/esm/icons/target';

/**
 * CVP (Cost-Volume-Profit) Calculator
 * Useful for Cost Accounting (원가회계)
 */
export const CVPCalculator: React.FC = () => {
  const [sellingPrice, setSellingPrice] = useState<number>(1000);
  const [variableCost, setVariableCost] = useState<number>(600);
  const [fixedCost, setFixedCost] = useState<number>(400000);

  const contributionMargin = sellingPrice - variableCost;
  const breakEvenPoint = contributionMargin > 0 ? Math.ceil(fixedCost / contributionMargin) : 0;
  const contributionMarginRatio = (contributionMargin / sellingPrice) * 100;

  return (
    <Card className="p-6 bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
        <Calculator className="text-blue-400 w-6 h-6" />
        <h3 className="text-xl font-bold">CVP (손익분기점) 계산기</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">단위당 판매가격 (P)</label>
            <input 
              type="number" 
              value={sellingPrice} 
              onChange={(e) => setSellingPrice(Number(e.target.value))}
              className="w-full bg-slate-800 border-slate-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">단위당 변동원가 (VC)</label>
            <input 
              type="number" 
              value={variableCost} 
              onChange={(e) => setVariableCost(Number(e.target.value))}
              className="w-full bg-slate-800 border-slate-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">총 고정원가 (FC)</label>
            <input 
              type="number" 
              value={fixedCost} 
              onChange={(e) => setFixedCost(Number(e.target.value))}
              className="w-full bg-slate-800 border-slate-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 flex flex-col justify-center gap-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">단위당 공헌이익</span>
            <span className="text-xl font-mono text-emerald-400">{contributionMargin.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">공헌이익률</span>
            <span>{contributionMarginRatio.toFixed(1)}%</span>
          </div>
          <div className="h-px bg-slate-700 my-2" />
          <div className="flex flex-col gap-1 items-center py-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <span className="text-blue-400 text-sm font-bold flex items-center gap-1">
              <Target size={14} /> 손익분기점 판매량
            </span>
            <span className="text-3xl font-bold font-mono text-white">
              {breakEvenPoint.toLocaleString()} <span className="text-lg font-normal text-slate-400 italic">units</span>
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

/**
 * NPV (Net Present Value) Calculator
 * Essential for Financial Management (재무관리)
 */
const npvCopy = {
    ko: {
        title: 'NPV (순현재가치) 계산기',
        initialInvestment: '초기 투자액 (I₀)',
        discountRate: '할인율 (r)',
        cashFlows: '연도별 현금흐름',
        cashFlowHelp: '1년 차부터 순서대로 쉼표로 구분하세요.',
        cashFlowPlaceholder: '예: 300000, 400000, 400000',
        won: '원',
        percent: '%',
        result: '순현재가치 (NPV)',
        accept: '수락 검토 (NPV > 0)',
        reject: '기각 검토 (NPV < 0)',
        neutral: '손익 균형 (NPV = 0)',
        errors: {
            initialInvestment: '초기 투자액은 0 이상의 숫자여야 합니다.',
            discountRate: '할인율은 -100%보다 커야 합니다.',
            cashFlows: '현금흐름을 숫자로 입력하고 쉼표로 구분하세요.',
        },
    },
    en: {
        title: 'NPV (Net Present Value) Calculator',
        initialInvestment: 'Initial investment (I₀)',
        discountRate: 'Discount rate (r)',
        cashFlows: 'Annual cash flows',
        cashFlowHelp: 'Enter cash flows from year 1 onward, separated by commas.',
        cashFlowPlaceholder: 'e.g. 300000, 400000, 400000',
        won: 'KRW',
        percent: '%',
        result: 'Net present value (NPV)',
        accept: 'Consider accepting (NPV > 0)',
        reject: 'Consider rejecting (NPV < 0)',
        neutral: 'Break-even (NPV = 0)',
        errors: {
            initialInvestment: 'Initial investment must be a number of 0 or more.',
            discountRate: 'Discount rate must be greater than -100%.',
            cashFlows: 'Enter numeric cash flows separated by commas.',
        },
    },
} as const;

export const NPVCalculator: React.FC<{ locale?: keyof typeof npvCopy }> = ({ locale = 'ko' }) => {
    const [initialInvestment, setInitialInvestment] = useState<number>(1000000);
    const [cashFlows, setCashFlows] = useState<string>("300000, 400000, 400000, 400000");
    const [discountRate, setDiscountRate] = useState<number>(10);
    const copy = npvCopy[locale];
    const input = useMemo(() => ({ initialInvestment, cashFlows, discountRate }), [initialInvestment, cashFlows, discountRate]);
    const validationError = useMemo(() => validateNpvInput(input), [input]);
    const npv = useMemo(() => calculateNpv(input), [input]);
    const errorFor = (field: NpvValidationError) => validationError === field ? copy.errors[field] : undefined;
    const decision = npv === null ? null : npv > 0 ? copy.accept : npv < 0 ? copy.reject : copy.neutral;

    return (
        <Card className="p-6 bg-slate-900 border-slate-800 text-slate-100 shadow-xl mt-8">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                <TrendingUp className="text-green-300 w-6 h-6" />
                <h3 className="text-xl font-bold">{copy.title}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FieldGroup>
                    <Field>
                        <FieldLabel htmlFor={`npv-initial-${locale}`}>{copy.initialInvestment}</FieldLabel>
                        <InputGroup>
                          <InputGroupInput
                            id={`npv-initial-${locale}`}
                            type="number" 
                            value={initialInvestment} 
                            onChange={(e) => setInitialInvestment(Number(e.target.value))}
                            min="0"
                            aria-invalid={Boolean(errorFor('initialInvestment'))}
                            aria-describedby={errorFor('initialInvestment') ? `npv-initial-error-${locale}` : undefined}
                          />
                          <InputGroupAddon>{copy.won}</InputGroupAddon>
                        </InputGroup>
                        {errorFor('initialInvestment') && <FieldError id={`npv-initial-error-${locale}`}>{errorFor('initialInvestment')}</FieldError>}
                    </Field>
                    <Field>
                        <FieldLabel htmlFor={`npv-rate-${locale}`}>{copy.discountRate}</FieldLabel>
                        <InputGroup>
                          <InputGroupInput
                            id={`npv-rate-${locale}`}
                            type="number" 
                            value={discountRate} 
                            onChange={(e) => setDiscountRate(Number(e.target.value))}
                            min="-99.99"
                            step="0.1"
                            aria-invalid={Boolean(errorFor('discountRate'))}
                            aria-describedby={errorFor('discountRate') ? `npv-rate-error-${locale}` : undefined}
                          />
                          <InputGroupAddon>{copy.percent}</InputGroupAddon>
                        </InputGroup>
                        {errorFor('discountRate') && <FieldError id={`npv-rate-error-${locale}`}>{errorFor('discountRate')}</FieldError>}
                    </Field>
                    <Field>
                        <FieldLabel htmlFor={`npv-flows-${locale}`}>{copy.cashFlows}</FieldLabel>
                        <InputGroup>
                          <InputGroupTextarea
                            id={`npv-flows-${locale}`}
                            value={cashFlows} 
                            onChange={(e) => setCashFlows(e.target.value)}
                            placeholder={copy.cashFlowPlaceholder}
                            aria-invalid={Boolean(errorFor('cashFlows'))}
                            aria-describedby={`npv-flows-help-${locale}${errorFor('cashFlows') ? ` npv-flows-error-${locale}` : ''}`}
                          />
                        </InputGroup>
                        <FieldDescription id={`npv-flows-help-${locale}`}>{copy.cashFlowHelp}</FieldDescription>
                        {errorFor('cashFlows') && <FieldError id={`npv-flows-error-${locale}`}>{errorFor('cashFlows')}</FieldError>}
                    </Field>
                </FieldGroup>

                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 flex flex-col justify-center gap-4">
                    <div className="flex flex-col gap-2 items-center rounded-lg border border-green-500/30 bg-green-500/10 py-6">
                        <span className="text-green-300 text-sm font-bold">{copy.result}</span>
                        <span aria-live="polite" className={`text-4xl font-bold font-mono ${npv === null ? 'text-slate-400' : npv >= 0 ? 'text-green-300' : 'text-rose-300'}`}>
                            {npv === null ? '—' : `${Math.round(npv).toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US')} ${copy.won}`}
                        </span>
                        {decision && <div className="mt-4 rounded-full bg-slate-700 px-4 py-1 text-xs font-bold tracking-wide text-slate-200">{decision}</div>}
                    </div>
                </div>
            </div>
        </Card>
    );
};
