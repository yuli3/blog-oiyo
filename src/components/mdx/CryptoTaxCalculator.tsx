'use client';

import { useState } from 'react';

function formatKRW(n: number): string {
  return Math.round(n).toLocaleString('ko-KR');
}

interface TxRow {
  id: number;
  buyPrice: string;
  sellPrice: string;
  quantity: string;
  fee: string;
}

export default function CryptoTaxCalculator({ locale = 'ko' }: { locale?: 'ko' | 'en' }) {
  const en = locale === 'en';
  const [rows, setRows] = useState<TxRow[]>([
    { id: 1, buyPrice: '30000000', sellPrice: '60000000', quantity: '1', fee: '30000' },
  ]);
  const [otherIncome, setOtherIncome] = useState('0');
  const [result, setResult] = useState<{
    totalProfit: number;
    deductible: number;
    taxableIncome: number;
    tax: number;
    localTax: number;
    total: number;
  } | null>(null);

  const addRow = () => setRows((r) => [...r, { id: Date.now(), buyPrice: '', sellPrice: '', quantity: '1', fee: '0' }]);
  const removeRow = (id: number) => setRows((r) => r.filter((row) => row.id !== id));
  const updateRow = (id: number, field: keyof TxRow, value: string) =>
    setRows((r) => r.map((row) => (row.id === id ? { ...row, [field]: value } : row)));

  const calculate = () => {
    let totalProfit = 0;
    for (const row of rows) {
      const buy = parseFloat(row.buyPrice.replace(/,/g, '')) || 0;
      const sell = parseFloat(row.sellPrice.replace(/,/g, '')) || 0;
      const qty = parseFloat(row.quantity) || 0;
      const fee = parseFloat(row.fee.replace(/,/g, '')) || 0;
      totalProfit += (sell - buy) * qty - fee;
    }
    const other = parseFloat(otherIncome.replace(/,/g, '')) || 0;
    totalProfit += other;

    // Scheduled Korean virtual-asset income rules: ₩2.5M deduction, 20% national tax.
    const DEDUCTIBLE = 2_500_000;
    const deductible = Math.min(totalProfit, DEDUCTIBLE);
    const taxableIncome = Math.max(0, totalProfit - deductible);
    const tax = taxableIncome * 0.20;
    const localTax = tax * 0.10;
    const total = tax + localTax;

    setResult({ totalProfit, deductible, taxableIncome, tax, localTax, total });
  };

  return (
    <div className="my-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-6 text-xl font-bold text-gray-900">{en ? 'Korea Crypto Tax Estimator' : '가상자산 세금 예상 계산기'}</h3>
      <p className="mb-4 text-xs text-gray-400">
        {en ? 'Scheduled from 2027: ₩2.5M deduction, 20% income tax + 2% local income tax' : '2027년 적용 예정 기준: 기본공제 250만원, 소득세 20% + 지방소득세 2%'}
      </p>

      <div className="mb-4 space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="rounded-xl border border-gray-200 p-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: en ? 'Buy price (KRW)' : '매수가(원/개)', field: 'buyPrice' as const, val: row.buyPrice },
                { label: en ? 'Sell price (KRW)' : '매도가(원/개)', field: 'sellPrice' as const, val: row.sellPrice },
                { label: en ? 'Quantity' : '수량', field: 'quantity' as const, val: row.quantity },
                { label: en ? 'Fee (KRW)' : '수수료(원)', field: 'fee' as const, val: row.fee },
              ].map(({ label, field, val }) => (
                <div key={field}>
                  <label className="mb-0.5 block text-xs text-gray-500">{label}</label>
                  <input type="number" value={val} onChange={(e) => updateRow(row.id, field, e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs" />
                </div>
              ))}
            </div>
            {rows.length > 1 && (
              <button onClick={() => removeRow(row.id)}
                className="mt-2 text-xs text-red-400 hover:text-red-600">{en ? 'Remove' : '삭제'}</button>
            )}
          </div>
        ))}
      </div>

      <button onClick={addRow}
        className="mb-4 w-full rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:bg-gray-50">
        {en ? '+ Add transaction' : '+ 거래 추가'}
      </button>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {en ? 'Other virtual-asset income (KRW)' : '기타 가상자산 이익 (원, 에어드랍·스테이킹 등)'}
        </label>
        <input type="number" value={otherIncome} onChange={(e) => setOtherIncome(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </div>

      <button onClick={calculate}
        className="mt-5 w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-600">
        {en ? 'Estimate tax' : '예상 세액 계산하기'}
      </button>

      {result && (
        <div className="mt-6 space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: en ? 'Realized gain' : '총 실현 이익', value: result.totalProfit, color: 'text-gray-800' },
              { label: en ? 'Deduction' : '기본공제 (250만)', value: result.deductible, color: 'text-green-600' },
              { label: en ? 'Taxable income' : '과세표준', value: result.taxableIncome, color: 'text-orange-600' },
              { label: en ? 'Income tax (20%)' : '소득세(20%)', value: result.tax, color: 'text-red-600' },
              { label: en ? 'Local tax (2%)' : '지방소득세(2%)', value: result.localTax, color: 'text-red-500' },
              { label: en ? 'Estimated total' : '예상 총세액', value: result.total, color: 'text-red-700' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl bg-gray-50 p-3 text-center">
                <p className="text-xs text-gray-500">{label}</p>
                <p className={`text-sm font-bold ${color}`}>{formatKRW(value)}원</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            {en ? '* Educational estimate using the rules scheduled for 2027. Verify current law before filing.' : '* 2027년 적용 예정 규정에 따른 참고용 예상치입니다. 신고 전 최신 법령을 확인하세요.'}
          </p>
        </div>
      )}
    </div>
  );
}
