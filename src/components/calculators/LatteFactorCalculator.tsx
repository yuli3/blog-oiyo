'use client';

import React, { useState } from 'react';
import type { Locale } from '../../lib/i18n';

// 2026-10-04: Copy and accessible names share one locale source; currency
// remains KRW, so changing language must never silently convert amounts.
const COPY = {
  ko: ['라떼 팩터 계산기', '0보다 큰 금액과 0~30% 사이의 이율을 입력해 주세요.', '한 번에 쓰는 금액 (원)', '커피·간식처럼 반복해서 쓰는 돈을 입력해요.', '소비 빈도', '매일 (월 30회)', '주중만 (월 약 21.6회)', '주 1회 (월 약 4.3회)', '연 수익률 (%)', '계산하기', '초기화', '한 달에 모이는 돈', '{n}년 후', '수익', '10년 뒤 모이는 돈으로 살 수 있는 것', '금액과 빈도를 입력해 주세요.', '연 수익률을 12로 나눠 매달 말에 넣는다고 가정한 근사 계산이에요. 세금·수수료·물가 상승은 빼고 계산했고, 수익을 보장하지 않아요. 아래 목표 금액은 시세가 아니라 예시예요.', '여행', '스마트폰', '중고차', '신차'],
  en: ['Latte Factor Calculator', 'Enter a positive finite amount and a finite rate from 0 to 30%.', 'Expense per purchase (KRW)', 'Enter a recurring expense, such as coffee or snacks.', 'Frequency', 'Daily (30/month)', 'Weekdays (~21.6/month)', 'Weekly (~4.3/month)', 'Nominal annual rate (%)', 'Calculate', 'Reset', 'Assumed monthly contribution', 'After {n} years', 'Hypothetical return', '10-year balance vs illustrative targets', 'Enter an amount and frequency.', 'KRW; nominal annual rate/12; month-end contributions; approximate frequencies. Taxes, fees and inflation excluded. Returns are not guaranteed. Target amounts are arbitrary examples, not market prices.', 'Travel', 'Smartphone', 'Used car', 'New car'],
  ja: ['ラテ・ファクター計算機', '有限の正の金額と0〜30%の有限の利率を入力してください。', '1回の支出額（KRW）', 'コーヒーや菓子などの繰り返す支出を入力してください。', '頻度', '毎日（月30回）', '平日（月約21.6回）', '週1回（月約4.3回）', '名目年利（%）', '計算する', 'リセット', '仮定した月の積立額', '{n}年後', '仮想の収益', '10年後の残高と仮の目安を比較', '金額と頻度を入力してください。', 'KRW・名目年利/12・月末積立・頻度は概算です。税金、手数料、物価上昇は含まず、収益は保証しません。目標金額は市場価格ではなく仮の例です。', '旅行', 'スマートフォン', '中古車', '新車'],
  zh: ['拿铁因子计算器', '请输入有限的正金额及0至30%的有限利率。', '每次支出金额（KRW）', '请输入咖啡、零食等重复支出。', '频率', '每天（每月30次）', '工作日（每月约21.6次）', '每周一次（每月约4.3次）', '名义年利率（%）', '计算', '重置', '假设的每月投入', '{n}年后', '假设收益', '10年余额与示例目标比较', '请输入金额和频率。', '以KRW计价，名义年利率/12，每月月底投入，频率为近似值。不含税费、管理费及通胀，不保证收益。目标金额是任意示例，不是市场价格。', '旅行', '智能手机', '二手车', '新车'],
  fr: ['Calculateur Latte Factor', 'Saisissez un montant positif fini et un taux fini entre 0 et 30 %.', 'Dépense par achat (KRW)', 'Indiquez une dépense récurrente, comme un café.', 'Fréquence', 'Chaque jour (30/mois)', 'Jours ouvrés (~21,6/mois)', 'Chaque semaine (~4,3/mois)', 'Taux annuel nominal (%)', 'Calculer', 'Réinitialiser', 'Versement mensuel supposé', 'Après {n} ans', 'Rendement hypothétique', 'Solde à 10 ans et objectifs illustratifs', 'Saisissez un montant et une fréquence.', 'KRW ; taux nominal annuel/12 ; versements en fin de mois ; fréquences approximatives. Impôts, frais et inflation exclus. Rendement non garanti. Les objectifs sont des exemples arbitraires, pas des prix de marché.', 'Voyage', 'Smartphone', "Voiture d’occasion", 'Voiture neuve'],
  es: ['Calculadora Latte Factor', 'Introduce un importe positivo finito y una tasa finita del 0 al 30%.', 'Gasto por compra (KRW)', 'Introduce un gasto recurrente, como café o snacks.', 'Frecuencia', 'Cada día (30/mes)', 'Días laborables (~21,6/mes)', 'Cada semana (~4,3/mes)', 'Tasa nominal anual (%)', 'Calcular', 'Restablecer', 'Aportación mensual supuesta', 'Después de {n} años', 'Rendimiento hipotético', 'Saldo a 10 años y objetivos ilustrativos', 'Introduce importe y frecuencia.', 'KRW; tasa nominal anual/12; aportaciones al final del mes; frecuencias aproximadas. Sin impuestos, comisiones ni inflación. Rendimiento no garantizado. Los objetivos son ejemplos arbitrarios, no precios de mercado.', 'Viaje', 'Smartphone', 'Coche usado', 'Coche nuevo'],
} as const satisfies Record<Locale, readonly string[]>;

interface LatteResult {
  monthlySaving: number;
  results: { years: number; principal: number; interest: number; total: number }[];
}

const LatteFactorCalculator: React.FC<{ locale?: Locale }> = ({ locale = 'ko' }) => {
  const [title, errorText, amountLabel, amountHelp, frequencyLabel, dailyLabel, weekdayLabel, weeklyLabel, rateLabel, calculateLabel, resetLabel, monthlyLabel, yearsLabel, returnLabel, goalsLabel, emptyLabel, disclaimer, ...goalNames] = COPY[locale];
  const [dailyCost, setDailyCost] = useState<string>('5000');
  const [frequency, setFrequency] = useState<string>('daily');
  const [annualRate, setAnnualRate] = useState<string>('5.0');
  const [result, setResult] = useState<LatteResult | null>(null);
  const [error, setError] = useState<string>('');

  // 2026-10-05: Korean readers expect '원'; other locales keep the explicit KRW code.
  const fmt = (n: number) => locale === 'ko'
    ? `${Math.round(n).toLocaleString('ko-KR')}원`
    : `${Math.round(n).toLocaleString(locale)} KRW`;

  const getMonthlySavings = (cost: number, freq: string): number => {
    if (freq === 'daily') return cost * 30;
    if (freq === 'weekday') return cost * 21.6;
    if (freq === 'weekly') return cost * 4.3;
    return 0;
  };

  const calculate = () => {
    setError('');
    // 2026-10-04: A failed recalculation must not leave an earlier projection
    // visible as though it described the newly entered (invalid) values.
    setResult(null);
    const cost = Number(dailyCost);
    const rate = Number(annualRate);

    if (!dailyCost.trim() || !annualRate.trim() || !Number.isFinite(cost) ||
        !Number.isFinite(rate) || cost <= 0 || rate < 0 || rate > 30 ||
        !['daily', 'weekday', 'weekly'].includes(frequency)) {
      setError(errorText);
      return;
    }

    const monthly = getMonthlySavings(cost, frequency);
    const r = rate / 100 / 12;

    const milestones = [10, 20, 30];
    const results = milestones.map((years) => {
      const n = years * 12;
      let futureValue = 0;
      if (r === 0) {
        futureValue = monthly * n;
      } else {
        futureValue = monthly * (Math.pow(1 + r, n) - 1) / r;
      }
      const principal = monthly * n;
      const interest = futureValue - principal;
      return { years, principal: Math.floor(principal), interest: Math.floor(interest), total: Math.floor(futureValue) };
    });

    // HTML input limits do not protect the model from numeric overflow.
    if (!Number.isFinite(monthly) || results.some(({ total, principal, interest }) =>
      !Number.isFinite(total) || !Number.isFinite(principal) || !Number.isFinite(interest))) {
      setError(errorText);
      return;
    }

    setResult({ monthlySaving: Math.floor(monthly), results });
  };

  const reset = () => {
    setDailyCost('5000');
    setFrequency('daily');
    setAnnualRate('5.0');
    setResult(null);
    setError('');
  };

  const goals = [
    { name: goalNames[0], amount: 2000000 },
    { name: goalNames[1], amount: 1500000 },
    { name: goalNames[2], amount: 10000000 },
    { name: goalNames[3], amount: 30000000 },
  ];

  return (
    <div className="not-prose my-7 sm:my-12 p-6 md:p-8 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-3xl shadow-xl">
      <h3 className="text-xl font-bold text-amber-900 mb-6">
        {title}
      </h3>

      <div className="grid md:grid-cols-2 gap-5 sm:gap-8">
        {/* Inputs */}
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-amber-800">
              {amountLabel}
            </label>
            <input
              type="number"
              value={dailyCost}
              onChange={(e) => setDailyCost(e.target.value)}
              min="0"
              className="w-full p-3 bg-card border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none"
              aria-label={amountLabel}
            />
            <p className="text-xs text-amber-500">
              {amountHelp}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-amber-800">
              {frequencyLabel}
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full p-3 bg-card border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none"
              aria-label={frequencyLabel}
            >
              <option value="daily">{dailyLabel}</option>
              <option value="weekday">{weekdayLabel}</option>
              <option value="weekly">{weeklyLabel}</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-amber-800">
              {rateLabel}
            </label>
            <input
              type="number"
              value={annualRate}
              onChange={(e) => setAnnualRate(e.target.value)}
              step="0.1"
              min="0"
              max="30"
              className="w-full p-3 bg-card border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none"
              aria-label={rateLabel}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={calculate}
              className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors"
              aria-label={calculateLabel}
            >
              {calculateLabel}
            </button>
            <button
              onClick={reset}
              className="px-5 py-3 bg-card border border-amber-300 hover:bg-amber-50 text-amber-700 font-bold rounded-xl transition-colors"
              aria-label={resetLabel}
            >
              {resetLabel}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {result ? (
            <>
              <div className="p-4 bg-card rounded-2xl border border-amber-100">
                <p className="text-xs text-amber-600 font-bold mb-1">
                  {monthlyLabel}
                </p>
                <p className="text-2xl font-bold text-amber-700 break-words">{fmt(result.monthlySaving)}</p>
              </div>

              {/* WHY 2026-10-04: this panel is half the page width on desktop; three columns split long localized KRW amounts into unreadable fragments. */}
              <div className="grid grid-cols-1 gap-3">
                {result.results.map((r) => (
                  <div key={r.years} className="p-4 bg-card rounded-2xl border border-amber-100 text-center">
                    <p className="text-xs text-amber-600 font-bold mb-1">{yearsLabel.replace('{n}', String(r.years))}</p>
                    <p className="text-xl font-bold text-amber-800 break-words">{fmt(r.total)}</p>
                    <p className="text-xs text-green-500 mt-1 break-words">{returnLabel}: +{fmt(r.interest)}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <p className="text-xs font-bold text-amber-700 mb-2">
                  {goalsLabel}
                </p>
                <div className="space-y-2">
                  {goals.map((goal) => {
                    const tenYearTotal = result.results.find((r) => r.years === 10)?.total ?? 0;
                    const achievable = tenYearTotal >= goal.amount;
                    return (
                      <div key={goal.name} className="flex justify-between items-center text-sm">
                        <span className={achievable ? 'text-green-700 font-bold' : 'text-slate-400'}>
                          {achievable ? '✓ ' : '○ '}{goal.name}
                        </span>
                        <span className="text-muted-foreground">{fmt(goal.amount)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-amber-200">
              <span className="text-4xl mb-2" aria-hidden="true">☕</span>
              <p className="text-sm font-bold text-amber-300">
                {emptyLabel}
              </p>
            </div>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-400 text-center">
        {disclaimer}
      </p>
    </div>
  );
};

export default LatteFactorCalculator;
