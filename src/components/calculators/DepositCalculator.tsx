'use client';

import React, { useState } from 'react';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';

type CalcType = 'deposit' | 'savings';
type TaxType = 'normal' | 'preferential' | 'none';

interface DepositResult {
  principal: number;
  interest: number;
  tax: number;
  afterTaxInterest: number;
  total: number;
}

const DepositCalculator: React.FC<{ locale?: 'ko' | 'en' }> = ({ locale = 'ko' }) => {
  const ko = locale === 'ko';

  const [calcType, setCalcType] = useState<CalcType>('deposit');
  const [amount, setAmount] = useState<string>('10000000');
  const [rate, setRate] = useState<string>('3.5');
  const [period, setPeriod] = useState<string>('12');
  const [taxType, setTaxType] = useState<TaxType>('normal');
  const [isCompound, setIsCompound] = useState<boolean>(false);
  const [result, setResult] = useState<DepositResult | null>(null);
  const [error, setError] = useState<string>('');

  const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR') + '원';

  const calculate = () => {
    setError('');
    const a = Number(amount);
    const r = Number(rate) / 100;
    const n = Number(period);

    if (a <= 0 || r < 0 || n <= 0) {
      setError(ko ? '입력값을 올바르게 확인해 주세요.' : 'Please check your inputs.');
      return;
    }

    let principal = 0;
    let interest = 0;

    if (calcType === 'deposit') {
      principal = a;
      if (isCompound) {
        interest = principal * (Math.pow(1 + r / 12, n) - 1);
      } else {
        interest = principal * r * (n / 12);
      }
    } else {
      // savings (monthly contribution)
      principal = a * n;
      if (isCompound) {
        const mRate = r / 12;
        const fv = a * ((1 + mRate) * (Math.pow(1 + mRate, n) - 1)) / mRate;
        interest = fv - principal;
      } else {
        interest = a * (n * (n + 1) / 2) * (r / 12);
      }
    }

    const taxRate = taxType === 'preferential' ? 0.095 : taxType === 'none' ? 0 : 0.154;
    const taxAmount = interest * taxRate;
    const afterTaxInterest = interest - taxAmount;
    const total = principal + afterTaxInterest;

    setResult({
      principal: Math.round(principal),
      interest: Math.round(interest),
      tax: Math.round(taxAmount),
      afterTaxInterest: Math.round(afterTaxInterest),
      total: Math.round(total),
    });
  };

  const reset = () => {
    setCalcType('deposit');
    setAmount('10000000');
    setRate('3.5');
    setPeriod('12');
    setTaxType('normal');
    setIsCompound(false);
    setResult(null);
    setError('');
  };

  const taxLabels: Record<TaxType, string> = {
    normal: ko ? '일반과세 (15.4%)' : 'Normal (15.4%)',
    preferential: ko ? '세금우대 (9.9%)' : 'Preferential (9.9%)',
    none: ko ? '비과세' : 'Tax-Free',
  };

  const invalidAmount = Boolean(error) && Number(amount) <= 0;
  const invalidRate = Boolean(error) && Number(rate) < 0;
  const invalidPeriod = Boolean(error) && Number(period) <= 0;

  return (
    <div className="not-prose my-12 p-6 md:p-8 bg-gradient-to-br from-green-50 to-green-50 border border-green-200 rounded-3xl shadow-xl">
      <h3 className="text-xl font-bold text-green-900 mb-6">
        {ko ? '예금·적금 계산기' : 'Deposit & Savings Calculator'}
      </h3>

      <div className="space-y-5">
        {/* Type toggle */}
        <div className="flex gap-2">
          {(['deposit', 'savings'] as CalcType[]).map((t) => (
            <button
              key={t}
              onClick={() => { setCalcType(t); setResult(null); }}
              className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${
                calcType === t
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-green-700 border-green-200 hover:bg-green-50'
              }`}
            >
              {t === 'deposit'
                ? (ko ? '정기예금 (목돈)' : 'Lump-Sum Deposit')
                : (ko ? '적금 (월납)' : 'Monthly Savings')}
            </button>
          ))}
        </div>

        <Field>
          <FieldLabel htmlFor="deposit-amount" className="text-sm font-bold text-green-800">
            {calcType === 'deposit'
              ? (ko ? '예금액' : 'Deposit Amount')
              : (ko ? '월 납입액' : 'Monthly Amount')}
          </FieldLabel>
          <InputGroup className="min-h-12 border-green-200 bg-white focus-within:border-green-500 focus-within:ring-green-500/20">
            <InputGroupInput
              id="deposit-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              aria-invalid={invalidAmount}
              aria-describedby={invalidAmount ? 'deposit-input-error' : undefined}
            />
            <InputGroupAddon className="border-green-100 text-xs text-green-700">
              {ko ? '원' : 'KRW'}
            </InputGroupAddon>
          </InputGroup>
        </Field>

        <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="deposit-rate" className="text-sm font-bold text-green-800">
              {ko ? '연 이율' : 'Annual Rate'}
            </FieldLabel>
            <InputGroup className="min-h-12 border-green-200 bg-white focus-within:border-green-500 focus-within:ring-green-500/20">
              <InputGroupInput
                id="deposit-rate"
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                min="0"
                step="0.1"
                aria-invalid={invalidRate}
                aria-describedby={invalidRate ? 'deposit-input-error' : undefined}
              />
              <InputGroupAddon className="border-green-100 text-xs text-green-700">%</InputGroupAddon>
            </InputGroup>
          </Field>
          <Field>
            <FieldLabel htmlFor="deposit-period" className="text-sm font-bold text-green-800">
              {ko ? '기간' : 'Period'}
            </FieldLabel>
            <InputGroup className="min-h-12 border-green-200 bg-white focus-within:border-green-500 focus-within:ring-green-500/20">
              <InputGroupInput
                id="deposit-period"
                type="number"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                min="1"
                aria-invalid={invalidPeriod}
                aria-describedby={invalidPeriod ? 'deposit-input-error' : undefined}
              />
              <InputGroupAddon className="border-green-100 text-xs text-green-700">
                {ko ? '개월' : 'months'}
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </FieldGroup>

        {/* Tax type */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-green-800">
            {ko ? '과세 유형' : 'Tax Type'}
          </label>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(taxLabels) as TaxType[]).map((t) => (
              <button
                key={t}
                onClick={() => setTaxType(t)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                  taxType === t
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-green-700 border-green-200 hover:bg-green-50'
                }`}
              >
                {taxLabels[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Interest method */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-green-800">
            {ko ? '이자 방식' : 'Interest Method'}
          </label>
          <div className="flex gap-2">
            {[false, true].map((v) => (
              <button
                key={String(v)}
                onClick={() => setIsCompound(v)}
                className={`py-1.5 px-4 rounded-xl text-xs font-bold border transition-colors ${
                  isCompound === v
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-green-700 border-green-200 hover:bg-green-50'
                }`}
              >
                {v ? (ko ? '복리' : 'Compound') : (ko ? '단리' : 'Simple')}
              </button>
            ))}
          </div>
        </div>

        {error && <FieldError id="deposit-input-error" className="rounded-xl border border-destructive/20 bg-destructive/5 p-3">{error}</FieldError>}

        <div className="flex gap-3">
          <button
            onClick={calculate}
            className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors"
          >
            {ko ? '계산하기' : 'Calculate'}
          </button>
          <button
            onClick={reset}
            className="px-5 py-3 bg-white border border-green-300 hover:bg-green-50 text-green-700 font-bold rounded-xl transition-colors"
          >
            {ko ? '초기화' : 'Reset'}
          </button>
        </div>

        {result && (
          <div className="mt-4 space-y-3" aria-live="polite">
            <div className="bg-green-600 text-white rounded-2xl p-5 text-center">
              <p className="text-sm font-semibold opacity-80 mb-1">
                {ko ? '세후 수령액' : 'After-Tax Total'}
              </p>
              <p className="text-3xl font-black">{fmt(result.total)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: ko ? '원금' : 'Principal', value: fmt(result.principal), color: 'text-green-900' },
                { label: ko ? '세전 이자' : 'Interest (Gross)', value: fmt(result.interest), color: 'text-green-700' },
                { label: ko ? '세금' : 'Tax', value: '-' + fmt(result.tax), color: 'text-red-600' },
                { label: ko ? '세후 이자' : 'After-Tax Interest', value: '+' + fmt(result.afterTaxInterest), color: 'text-green-700' },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-xl p-3 border border-green-100">
                  <p className="text-xs text-green-500 font-semibold mb-1">{item.label}</p>
                  <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-slate-400 text-center">
        * {ko ? '세율: 일반 15.4%, 세금우대 9.9%, 비과세 0%' : 'Tax rates: Normal 15.4%, Preferential 9.9%, Tax-Free 0%'}
      </p>
    </div>
  );
};

export default DepositCalculator;
