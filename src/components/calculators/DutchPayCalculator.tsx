'use client';

import React, { useState } from 'react';

interface Person {
  id: number;
  name: string;
  ratio: number;
  fixedAmount: number;
  useFixed: boolean;
}

interface DutchResult {
  rows: { name: string; amount: number }[];
  total: number;
}

const DutchPayCalculator: React.FC<{ locale?: 'ko' | 'en' }> = ({ locale = 'ko' }) => {
  const [totalAmount, setTotalAmount] = useState<string>('100000');
  const [people, setPeople] = useState<Person[]>([
    { id: 1, name: locale === 'ko' ? '참가자 1' : 'Person 1', ratio: 1, fixedAmount: 0, useFixed: false },
    { id: 2, name: locale === 'ko' ? '참가자 2' : 'Person 2', ratio: 1, fixedAmount: 0, useFixed: false },
    { id: 3, name: locale === 'ko' ? '참가자 3' : 'Person 3', ratio: 1, fixedAmount: 0, useFixed: false },
  ]);
  const [result, setResult] = useState<DutchResult | null>(null);
  const [error, setError] = useState<string>('');
  const [splitMode, setSplitMode] = useState<'equal' | 'ratio' | 'custom'>('equal');

  const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');

  const addPerson = () => {
    const id = Date.now();
    setPeople((prev) => [
      ...prev,
      {
        id,
        name: locale === 'ko' ? `참가자 ${prev.length + 1}` : `Person ${prev.length + 1}`,
        ratio: 1,
        fixedAmount: 0,
        useFixed: false,
      },
    ]);
  };

  const removePerson = (id: number) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePerson = (id: number, field: keyof Person, value: string | number | boolean) => {
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const calculate = () => {
    setError('');
    const total = Number(totalAmount);

    if (total <= 0 || people.length === 0) {
      setError(locale === 'ko' ? '입력값을 올바르게 확인해 주세요.' : 'Please check your inputs.');
      return;
    }

    let rows: { name: string; amount: number }[] = [];

    if (splitMode === 'equal') {
      const perPerson = total / people.length;
      rows = people.map((p) => ({ name: p.name, amount: Math.round(perPerson) }));
    } else if (splitMode === 'ratio') {
      const totalRatio = people.reduce((sum, p) => sum + p.ratio, 0);
      rows = people.map((p) => ({ name: p.name, amount: Math.round((p.ratio / totalRatio) * total) }));
    } else {
      // custom: some fixed, rest split equally
      const fixedTotal = people.filter((p) => p.useFixed).reduce((sum, p) => sum + p.fixedAmount, 0);
      const remaining = total - fixedTotal;
      const equalSplitPeople = people.filter((p) => !p.useFixed);
      const perEqualPerson = equalSplitPeople.length > 0 ? remaining / equalSplitPeople.length : 0;
      rows = people.map((p) => ({
        name: p.name,
        amount: p.useFixed ? p.fixedAmount : Math.round(perEqualPerson),
      }));
    }

    setResult({ rows, total });
  };

  const reset = () => {
    setTotalAmount('100000');
    setPeople([
      { id: 1, name: locale === 'ko' ? '참가자 1' : 'Person 1', ratio: 1, fixedAmount: 0, useFixed: false },
      { id: 2, name: locale === 'ko' ? '참가자 2' : 'Person 2', ratio: 1, fixedAmount: 0, useFixed: false },
      { id: 3, name: locale === 'ko' ? '참가자 3' : 'Person 3', ratio: 1, fixedAmount: 0, useFixed: false },
    ]);
    setSplitMode('equal');
    setResult(null);
    setError('');
  };

  return (
    <div className="not-prose my-12 p-6 md:p-8 bg-gradient-to-br from-green-50 to-green-50 border border-green-200 rounded-3xl shadow-xl">
      <h3 className="text-xl font-bold text-green-900 mb-6">
        {locale === 'ko' ? '더치페이 계산기' : 'Dutch Pay Calculator'}
      </h3>

      <div className="space-y-5">
        <div className="space-y-1">
          <label className="text-sm font-bold text-green-800">
            {locale === 'ko' ? '총 금액 (원)' : 'Total Amount (KRW)'}
          </label>
          <input
            type="number"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            min="0"
            className="w-full p-3 bg-white border border-green-200 rounded-xl focus:ring-2 focus:ring-green-400 outline-none"
            aria-label={locale === 'ko' ? '총 금액' : 'Total Amount'}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-bold text-green-800">
            {locale === 'ko' ? '분배 방식' : 'Split Mode'}
          </label>
          <div className="flex gap-2">
            {(['equal', 'ratio', 'custom'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSplitMode(mode)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors border ${
                  splitMode === mode
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-green-700 border-green-200 hover:bg-green-50'
                }`}
                aria-pressed={splitMode === mode}
              >
                {mode === 'equal' && (locale === 'ko' ? '균등' : 'Equal')}
                {mode === 'ratio' && (locale === 'ko' ? '비율' : 'Ratio')}
                {mode === 'custom' && (locale === 'ko' ? '개별지정' : 'Custom')}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-green-800">
              {locale === 'ko' ? '참가자' : 'Participants'}
            </label>
            <button
              onClick={addPerson}
              className="text-xs py-1 px-3 bg-green-100 hover:bg-green-200 text-green-700 font-bold rounded-lg transition-colors"
              aria-label={locale === 'ko' ? '참가자 추가' : 'Add person'}
            >
              + {locale === 'ko' ? '추가' : 'Add'}
            </button>
          </div>

          <div className="space-y-2">
            {people.map((person) => (
              <div key={person.id} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={person.name}
                  onChange={(e) => updatePerson(person.id, 'name', e.target.value)}
                  className="flex-1 p-2 bg-white border border-green-200 rounded-xl text-sm focus:ring-2 focus:ring-green-400 outline-none"
                  aria-label={locale === 'ko' ? '이름' : 'Name'}
                />
                {splitMode === 'ratio' && (
                  <input
                    type="number"
                    value={person.ratio}
                    onChange={(e) => updatePerson(person.id, 'ratio', Number(e.target.value))}
                    min="1"
                    className="w-16 p-2 bg-white border border-green-200 rounded-xl text-sm text-center focus:ring-2 focus:ring-green-400 outline-none"
                    aria-label={locale === 'ko' ? '비율' : 'Ratio'}
                  />
                )}
                {splitMode === 'custom' && (
                  <>
                    <label className="text-xs text-green-600 font-bold whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={person.useFixed}
                        onChange={(e) => updatePerson(person.id, 'useFixed', e.target.checked)}
                        className="mr-1"
                        aria-label={locale === 'ko' ? '고정금액 사용' : 'Use fixed amount'}
                      />
                      {locale === 'ko' ? '고정' : 'Fixed'}
                    </label>
                    {person.useFixed && (
                      <input
                        type="number"
                        value={person.fixedAmount}
                        onChange={(e) => updatePerson(person.id, 'fixedAmount', Number(e.target.value))}
                        min="0"
                        className="w-28 p-2 bg-white border border-green-200 rounded-xl text-sm focus:ring-2 focus:ring-green-400 outline-none"
                        aria-label={locale === 'ko' ? '고정금액' : 'Fixed amount'}
                      />
                    )}
                  </>
                )}
                <button
                  onClick={() => removePerson(person.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label={locale === 'ko' ? '제거' : 'Remove'}
                  disabled={people.length <= 1}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={calculate}
            className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors"
            aria-label={locale === 'ko' ? '계산하기' : 'Calculate'}
          >
            {locale === 'ko' ? '계산하기' : 'Calculate'}
          </button>
          <button
            onClick={reset}
            className="px-5 py-3 bg-white border border-green-300 hover:bg-green-50 text-green-700 font-bold rounded-xl transition-colors"
            aria-label={locale === 'ko' ? '초기화' : 'Reset'}
          >
            {locale === 'ko' ? '초기화' : 'Reset'}
          </button>
        </div>

        {result && (
          <div className="mt-4">
            <table className="w-full text-sm border-collapse" aria-label={locale === 'ko' ? '더치페이 내역' : 'Dutch pay breakdown'}>
              <thead>
                <tr className="bg-green-100">
                  <th className="p-3 text-left font-bold text-green-800 rounded-tl-xl">
                    {locale === 'ko' ? '참가자' : 'Person'}
                  </th>
                  <th className="p-3 text-right font-bold text-green-800 rounded-tr-xl">
                    {locale === 'ko' ? '부담액' : 'Amount'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i} className="border-b border-green-100 hover:bg-green-50">
                    <td className="p-3 font-bold text-green-700">{row.name}</td>
                    <td className="p-3 text-right font-bold text-green-800">{fmt(row.amount)}원</td>
                  </tr>
                ))}
                <tr className="bg-green-50">
                  <td className="p-3 font-bold text-green-900">
                    {locale === 'ko' ? '합계' : 'Total'}
                  </td>
                  <td className="p-3 text-right font-bold text-green-900">{fmt(result.total)}원</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-slate-400 text-center">
        * 반올림으로 인해 합계가 1~2원 차이날 수 있습니다.
      </p>
    </div>
  );
};

export default DutchPayCalculator;
