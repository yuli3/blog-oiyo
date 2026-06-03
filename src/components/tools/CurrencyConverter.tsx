import { useState } from "react";
import type { Locale } from "../../lib/i18n";

interface Props {
  locale: Locale;
}

const CURRENCIES = [
  "KRW", "USD", "EUR", "JPY", "GBP", "CNY", "TWD", "HKD",
  "CAD", "AUD", "CHF", "SGD", "THB", "MYR", "VND", "PHP",
  "IDR", "INR", "AED", "NZD",
] as const;

type Currency = typeof CURRENCIES[number];

// Static exchange rates relative to KRW (2025-01 기준)
const RATES_TO_KRW: Record<Currency, number> = {
  KRW: 1,
  USD: 1380,
  EUR: 1500,
  JPY: 9.2,
  GBP: 1740,
  CNY: 190,
  TWD: 43,
  HKD: 177,
  CAD: 1010,
  AUD: 890,
  CHF: 1550,
  SGD: 1030,
  THB: 40,
  MYR: 310,
  VND: 0.055,
  PHP: 24,
  IDR: 0.088,
  INR: 16.5,
  AED: 376,
  NZD: 810,
};

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  KRW: "₩",
  USD: "$",
  EUR: "€",
  JPY: "¥",
  GBP: "£",
  CNY: "¥",
  TWD: "NT$",
  HKD: "HK$",
  CAD: "C$",
  AUD: "A$",
  CHF: "Fr",
  SGD: "S$",
  THB: "฿",
  MYR: "RM",
  VND: "₫",
  PHP: "₱",
  IDR: "Rp",
  INR: "₹",
  AED: "AED",
  NZD: "NZ$",
};

function convert(amount: number, from: Currency, to: Currency): number {
  const inKRW = amount * RATES_TO_KRW[from];
  return inKRW / RATES_TO_KRW[to];
}

function formatAmount(amount: number): string {
  if (isNaN(amount) || !isFinite(amount)) return "—";
  if (Math.abs(amount) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(amount);
}

const PRESETS: [Currency, Currency][] = [
  ["USD", "KRW"],
  ["JPY", "KRW"],
  ["EUR", "KRW"],
];

const UI: Record<
  Locale,
  {
    title: string;
    subtitle: string;
    fromLabel: string;
    toLabel: string;
    swapBtn: string;
    presetsLabel: string;
    rateInfo: string;
    dataSource: string;
    result: string;
    rate: string;
  }
> = {
  ko: {
    title: "환율 계산기",
    subtitle: "주요 20개 통화 간 환율 변환",
    fromLabel: "변환할 금액",
    toLabel: "변환 결과",
    swapBtn: "↕ 통화 교체",
    presetsLabel: "자주 찾는 환율",
    rateInfo: "1 {from} = {rate} {to}",
    dataSource: "2025-01 기준 정적 데이터",
    result: "결과",
    rate: "기준 환율",
  },
  en: {
    title: "Currency Converter",
    subtitle: "Convert between 20 major currencies",
    fromLabel: "Amount",
    toLabel: "Converted",
    swapBtn: "↕ Swap",
    presetsLabel: "Popular Pairs",
    rateInfo: "1 {from} = {rate} {to}",
    dataSource: "Static data · Jan 2025",
    result: "Result",
    rate: "Exchange Rate",
  },
  ja: {
    title: "通貨換算機",
    subtitle: "主要20通貨の換算",
    fromLabel: "金額",
    toLabel: "換算結果",
    swapBtn: "↕ 通貨交換",
    presetsLabel: "よく使う換算",
    rateInfo: "1 {from} = {rate} {to}",
    dataSource: "2025年1月基準の静的データ",
    result: "結果",
    rate: "為替レート",
  },
  fr: {
    title: "Convertisseur de devises",
    subtitle: "Convertir entre 20 devises majeures",
    fromLabel: "Montant",
    toLabel: "Résultat",
    swapBtn: "↕ Inverser",
    presetsLabel: "Paires populaires",
    rateInfo: "1 {from} = {rate} {to}",
    dataSource: "Données statiques · Jan 2025",
    result: "Résultat",
    rate: "Taux de change",
  },
  es: {
    title: "Conversor de divisas",
    subtitle: "Convierte entre 20 divisas principales",
    fromLabel: "Cantidad",
    toLabel: "Resultado",
    swapBtn: "↕ Intercambiar",
    presetsLabel: "Pares populares",
    rateInfo: "1 {from} = {rate} {to}",
    dataSource: "Datos estáticos · Ene 2025",
    result: "Resultado",
    rate: "Tipo de cambio",
  },
  zh: {
    title: "汇率换算器",
    subtitle: "20种主要货币换算",
    fromLabel: "金额",
    toLabel: "换算结果",
    swapBtn: "↕ 交换货币",
    presetsLabel: "常用汇率",
    rateInfo: "1 {from} = {rate} {to}",
    dataSource: "2025年1月静态数据",
    result: "结果",
    rate: "汇率",
  },
  cn: {
    title: "匯率換算器",
    subtitle: "20種主要貨幣換算",
    fromLabel: "金額",
    toLabel: "換算結果",
    swapBtn: "↕ 交換貨幣",
    presetsLabel: "常用匯率",
    rateInfo: "1 {from} = {rate} {to}",
    dataSource: "2025年1月靜態資料",
    result: "結果",
    rate: "匯率",
  },
};

export default function CurrencyConverter({ locale }: Props) {
  const t = UI[locale] ?? UI.en;

  const [fromCurrency, setFromCurrency] = useState<Currency>("USD");
  const [toCurrency, setToCurrency] = useState<Currency>("KRW");
  const [fromAmount, setFromAmount] = useState("1");

  const parsedFrom = parseFloat(fromAmount) || 0;
  const toAmount = convert(parsedFrom, fromCurrency, toCurrency);
  const rateDisplay = convert(1, fromCurrency, toCurrency);

  function handleFromChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFromAmount(e.target.value);
  }

  function handleSwap() {
    const prevTo = toCurrency;
    setToCurrency(fromCurrency);
    setFromCurrency(prevTo);
  }

  function handlePreset(from: Currency, to: Currency) {
    setFromCurrency(from);
    setToCurrency(to);
    setFromAmount("1");
  }

  const rateText = t.rateInfo
    .replace("{from}", fromCurrency)
    .replace("{rate}", formatAmount(rateDisplay))
    .replace("{to}", toCurrency);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {t.title}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t.subtitle}
        </p>
      </div>

      {/* Preset buttons */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          {t.presetsLabel}
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(([from, to]) => (
            <button
              key={`${from}-${to}`}
              onClick={() => handlePreset(from, to)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                fromCurrency === from && toCurrency === to
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-blue-400"
              }`}
            >
              {CURRENCY_SYMBOLS[from]}{from} → {CURRENCY_SYMBOLS[to]}{to}
            </button>
          ))}
        </div>
      </div>

      {/* Converter card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
        {/* From */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.fromLabel}
          </label>
          <div className="flex gap-2">
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value as Currency)}
              className="w-28 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_SYMBOLS[c]} {c}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={fromAmount}
              onChange={handleFromChange}
              min="0"
              step="any"
              className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-right text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Swap button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwap}
            className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-blue-50 transition-colors"
          >
            {t.swapBtn}
          </button>
        </div>

        {/* To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.toLabel}
          </label>
          <div className="flex gap-2">
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value as Currency)}
              className="w-28 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_SYMBOLS[c]} {c}
                </option>
              ))}
            </select>
            <div className="flex-1 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-right text-lg font-semibold text-blue-700">
              {formatAmount(toAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* Rate info */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
            {t.rate}
          </p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">
            {rateText}
          </p>
        </div>
        <span className="text-xs text-gray-400 italic">
          {t.dataSource}
        </span>
      </div>
    </div>
  );
}
