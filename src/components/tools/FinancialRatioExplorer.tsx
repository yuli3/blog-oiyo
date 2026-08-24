import { useState } from 'react';
import type { Locale } from '../../lib/i18n';
import { computeRatioPercent } from '../../lib/finance/financial-ratio-explorer';

/* ────────────────────────────────────────────────────────────────────────────
 * FinancialRatioExplorer — a realistic sample Balance Sheet + Income Statement
 * with an interactive ratio picker. Selecting a ratio highlights its numerator
 * (blue) and denominator (amber) rows in the statements and shows the formula in
 * the same two colors, the computed value, and a plain-language read. Educational
 * only; the figures are an illustrative sample company. ko-first, en fallback
 * (ja/zh/fr/es render the en copy — matches this component's original scope
 * when it lived at oiyo.net/financial-ratios, ported here 2026-08-25).
 * ────────────────────────────────────────────────────────────────────────── */

type Group = 'asset' | 'liabeq' | 'is';
interface Line {
  id: string;
  label: Record<'ko' | 'en', string>;
  value: number;      // 백만원 / KRW millions
  group: Group;
  indent?: boolean;   // sub-item
  subtotal?: boolean; // bold subtotal row
  spacer?: boolean;   // blank spacer before
}

// 단위: 백만원. 자산총계 2000 = 부채 1000 + 자본 1000 (대차평형)
const LINES: Line[] = [
  // ── Balance Sheet · Assets ──
  { id: 'cash', label: { ko: '현금및현금성자산', en: 'Cash & equivalents' }, value: 300, group: 'asset', indent: true },
  { id: 'ar', label: { ko: '매출채권', en: 'Accounts receivable' }, value: 250, group: 'asset', indent: true },
  { id: 'inventory', label: { ko: '재고자산', en: 'Inventory' }, value: 200, group: 'asset', indent: true },
  { id: 'other_ca', label: { ko: '기타유동자산', en: 'Other current assets' }, value: 50, group: 'asset', indent: true },
  { id: 'current_assets', label: { ko: '유동자산 계', en: 'Total current assets' }, value: 800, group: 'asset', subtotal: true },
  { id: 'ppe', label: { ko: '유형자산', en: 'Property & equipment' }, value: 900, group: 'asset', indent: true, spacer: true },
  { id: 'intangible', label: { ko: '무형자산', en: 'Intangible assets' }, value: 100, group: 'asset', indent: true },
  { id: 'other_nca', label: { ko: '기타비유동자산', en: 'Other non-current' }, value: 200, group: 'asset', indent: true },
  { id: 'noncurrent_assets', label: { ko: '비유동자산 계', en: 'Total non-current assets' }, value: 1200, group: 'asset', subtotal: true },
  { id: 'total_assets', label: { ko: '자산총계', en: 'Total assets' }, value: 2000, group: 'asset', subtotal: true, spacer: true },
  // ── Balance Sheet · Liabilities & Equity ──
  { id: 'ap', label: { ko: '매입채무', en: 'Accounts payable' }, value: 200, group: 'liabeq', indent: true },
  { id: 'st_debt', label: { ko: '단기차입금', en: 'Short-term debt' }, value: 300, group: 'liabeq', indent: true },
  { id: 'other_cl', label: { ko: '기타유동부채', en: 'Other current liab.' }, value: 100, group: 'liabeq', indent: true },
  { id: 'current_liab', label: { ko: '유동부채 계', en: 'Total current liabilities' }, value: 600, group: 'liabeq', subtotal: true },
  { id: 'lt_debt', label: { ko: '장기차입금', en: 'Long-term debt' }, value: 400, group: 'liabeq', indent: true, spacer: true },
  { id: 'total_liab', label: { ko: '부채총계', en: 'Total liabilities' }, value: 1000, group: 'liabeq', subtotal: true },
  { id: 'capital', label: { ko: '자본금', en: 'Paid-in capital' }, value: 500, group: 'liabeq', indent: true, spacer: true },
  { id: 'retained', label: { ko: '이익잉여금', en: 'Retained earnings' }, value: 500, group: 'liabeq', indent: true },
  { id: 'total_equity', label: { ko: '자본총계', en: 'Total equity' }, value: 1000, group: 'liabeq', subtotal: true },
  // ── Income Statement ──
  { id: 'revenue', label: { ko: '매출액', en: 'Revenue' }, value: 3000, group: 'is', subtotal: true },
  { id: 'cogs', label: { ko: '매출원가', en: 'Cost of goods sold' }, value: 1800, group: 'is', indent: true },
  { id: 'gross_profit', label: { ko: '매출총이익', en: 'Gross profit' }, value: 1200, group: 'is', subtotal: true },
  { id: 'sga', label: { ko: '판매비와관리비', en: 'SG&A' }, value: 800, group: 'is', indent: true },
  { id: 'operating_income', label: { ko: '영업이익', en: 'Operating income' }, value: 400, group: 'is', subtotal: true },
  { id: 'non_op', label: { ko: '영업외손익(순)', en: 'Non-operating (net)' }, value: -50, group: 'is', indent: true },
  { id: 'pretax', label: { ko: '법인세차감전순이익', en: 'Pre-tax income' }, value: 350, group: 'is', subtotal: true },
  { id: 'tax', label: { ko: '법인세비용', en: 'Income tax' }, value: 70, group: 'is', indent: true },
  { id: 'net_income', label: { ko: '당기순이익', en: 'Net income' }, value: 280, group: 'is', subtotal: true },
];

const byId = (id: string) => LINES.find((l) => l.id === id)!;

interface Ratio {
  id: string;
  name: Record<'ko' | 'en', string>;
  num: string; den: string;         // line ids
  numLabel: Record<'ko' | 'en', string>;
  denLabel: Record<'ko' | 'en', string>;
  good: (v: number) => boolean;     // v is percent
  read: Record<'ko' | 'en', string>;
}

const RATIOS: Ratio[] = [
  { id: 'current', name: { ko: '유동비율', en: 'Current ratio' }, num: 'current_assets', den: 'current_liab', numLabel: { ko: '유동자산', en: 'Current assets' }, denLabel: { ko: '유동부채', en: 'Current liab.' }, good: (v) => v >= 100, read: { ko: '단기 지급능력. 100% 이상이면 1년 내 갚을 빚을 유동자산으로 감당할 수 있다는 뜻(통상 150~200% 선호).', en: 'Short-term liquidity. ≥100% means current assets cover debts due within a year (150–200% often preferred).' } },
  { id: 'debt', name: { ko: '부채비율', en: 'Debt-to-equity' }, num: 'total_liab', den: 'total_equity', numLabel: { ko: '부채총계', en: 'Total liabilities' }, denLabel: { ko: '자본총계', en: 'Total equity' }, good: (v) => v <= 200, read: { ko: '재무 안정성. 낮을수록 빚 의존도가 낮음. 통상 200% 이하를 건전하게 봄.', en: 'Financial leverage. Lower = less reliance on debt; ≤200% is generally seen as healthy.' } },
  { id: 'equity', name: { ko: '자기자본비율', en: 'Equity ratio' }, num: 'total_equity', den: 'total_assets', numLabel: { ko: '자본총계', en: 'Total equity' }, denLabel: { ko: '자산총계', en: 'Total assets' }, good: (v) => v >= 30, read: { ko: '자산 중 내 돈(자본)의 비중. 높을수록 안정적. 통상 30% 이상.', en: 'Share of assets funded by equity. Higher = more stable; 30%+ typical.' } },
  { id: 'gpm', name: { ko: '매출총이익률', en: 'Gross margin' }, num: 'gross_profit', den: 'revenue', numLabel: { ko: '매출총이익', en: 'Gross profit' }, denLabel: { ko: '매출액', en: 'Revenue' }, good: (v) => v >= 20, read: { ko: '파는 것 자체의 수익성(매출−원가). 업종별 차이가 큼.', en: 'Profitability of the product itself (revenue − COGS). Varies a lot by industry.' } },
  { id: 'opm', name: { ko: '영업이익률', en: 'Operating margin' }, num: 'operating_income', den: 'revenue', numLabel: { ko: '영업이익', en: 'Operating income' }, denLabel: { ko: '매출액', en: 'Revenue' }, good: (v) => v >= 10, read: { ko: '본업의 진짜 이익률. 운영비까지 뺀 뒤의 수익성.', en: 'Core-business profitability after operating costs.' } },
  { id: 'npm', name: { ko: '순이익률', en: 'Net margin' }, num: 'net_income', den: 'revenue', numLabel: { ko: '당기순이익', en: 'Net income' }, denLabel: { ko: '매출액', en: 'Revenue' }, good: (v) => v >= 5, read: { ko: '모든 비용·세금을 뺀 최종 이익률.', en: 'Bottom-line profitability after all costs and tax.' } },
  { id: 'roe', name: { ko: 'ROE(자기자본이익률)', en: 'ROE' }, num: 'net_income', den: 'total_equity', numLabel: { ko: '당기순이익', en: 'Net income' }, denLabel: { ko: '자본총계', en: 'Total equity' }, good: (v) => v >= 10, read: { ko: '주주 돈으로 얼마를 벌었나. 투자 관점의 핵심 지표(통상 10%+).', en: 'Return generated on shareholders’ equity — a key investor metric (10%+ typical).' } },
  { id: 'roa', name: { ko: 'ROA(총자산이익률)', en: 'ROA' }, num: 'net_income', den: 'total_assets', numLabel: { ko: '당기순이익', en: 'Net income' }, denLabel: { ko: '자산총계', en: 'Total assets' }, good: (v) => v >= 5, read: { ko: '자산을 얼마나 효율적으로 굴려 이익을 냈나.', en: 'How efficiently assets are used to generate profit.' } },
];

interface Ui { title: string; subtitle: string; pick: string; bs: string; is: string; assets: string; liabeq: string; formula: string; result: string; healthy: string; watch: string; unit: string; note: string; }
const L: Partial<Record<Locale, Ui>> = {
  ko: { title: '재무비율 탐색기', subtitle: '비율을 고르면 재무제표에서 분자·분모가 색으로 이어집니다', pick: '재무비율 선택', bs: '재무상태표 (B/S)', is: '손익계산서 (I/S)', assets: '자산', liabeq: '부채 · 자본', formula: '공식', result: '결과', healthy: '양호', watch: '주의', unit: '백만원', note: '예시용 가상 회사 수치입니다. 적정 기준은 업종·상황에 따라 다르며, 투자·재무 판단의 근거로 삼지 마세요.' },
  en: { title: 'Financial Ratio Explorer', subtitle: 'Pick a ratio — its numerator and denominator light up in the statements', pick: 'Pick a ratio', bs: 'Balance Sheet (B/S)', is: 'Income Statement (I/S)', assets: 'Assets', liabeq: 'Liabilities & Equity', formula: 'Formula', result: 'Result', healthy: 'Healthy', watch: 'Watch', unit: 'KRW mn', note: 'Figures are an illustrative sample company. Healthy ranges vary by industry; do not use as a basis for investment decisions.' },
};

interface Props { locale: Locale }

export default function FinancialRatioExplorer({ locale }: Props) {
  const t = L[locale] ?? L.en!;
  const lang: 'ko' | 'en' = locale === 'ko' ? 'ko' : 'en';
  const [ratioId, setRatioId] = useState<string>('current');
  const ratio = RATIOS.find((r) => r.id === ratioId)!;

  const numVal = byId(ratio.num).value;
  const denVal = byId(ratio.den).value;
  const pct = computeRatioPercent(numVal, denVal);
  const isGood = ratio.good(pct);

  const rowClass = (id: string) => {
    if (id === ratio.num) return 'bg-blue-100 text-blue-800 ring-1 ring-blue-300';
    if (id === ratio.den) return 'bg-amber-100 text-amber-800 ring-1 ring-amber-300';
    return '';
  };

  const fmt = (v: number) => v.toLocaleString();

  const renderTable = (group: Group) => (
    <table className="w-full border-collapse text-sm">
      <tbody>
        {LINES.filter((l) => l.group === group).map((l) => (
          <tr key={l.id} className={`transition-colors ${rowClass(l.id)}`}>
            <td className={`py-1 pr-2 ${l.indent ? 'pl-4 text-gray-600' : 'font-semibold text-gray-800'} ${l.subtotal ? 'font-bold' : ''} ${l.spacer ? 'pt-3' : ''}`}>
              {l.label[lang]}
            </td>
            <td className={`py-1 text-right tabular-nums ${l.subtotal ? 'font-bold text-gray-900' : 'text-gray-600'} ${l.spacer ? 'pt-3' : ''}`}>
              {fmt(l.value)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="not-prose my-8 space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-black text-gray-900">{t.title}</h2>
        <p className="text-sm text-gray-500">{t.subtitle}</p>
      </div>

      {/* ratio picker */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">{t.pick}</p>
        <div className="flex flex-wrap gap-2">
          {RATIOS.map((r) => (
            <button
              key={r.id}
              onClick={() => setRatioId(r.id)}
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                ratioId === r.id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
              }`}
            >
              {r.name[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* formula + result */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center">
          <span className="text-base font-bold text-gray-800">{ratio.name[lang]}</span>
          <span className="text-gray-400">=</span>
          <span className="inline-flex flex-col items-center">
            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-sm font-bold text-blue-800">{ratio.numLabel[lang]} {fmt(numVal)}</span>
            <span className="my-0.5 h-px w-full bg-gray-300" />
            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-sm font-bold text-amber-800">{ratio.denLabel[lang]} {fmt(denVal)}</span>
          </span>
          <span className="text-gray-400">=</span>
          <span className={`text-2xl font-black ${isGood ? 'text-emerald-600' : 'text-orange-500'}`}>{pct.toFixed(1)}%</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${isGood ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
            {isGood ? t.healthy : t.watch}
          </span>
        </div>
        <p className="mt-3 text-center text-xs leading-relaxed text-gray-500">{ratio.read[lang]}</p>
      </div>

      {/* statements */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 p-4">
          <h3 className="mb-2 text-sm font-black text-gray-800">{t.bs} <span className="font-normal text-gray-400">· {t.unit}</span></h3>
          <p className="mb-1 text-xs font-bold text-gray-400">{t.assets}</p>
          {renderTable('asset')}
          <p className="mb-1 mt-3 text-xs font-bold text-gray-400">{t.liabeq}</p>
          {renderTable('liabeq')}
        </div>
        <div className="rounded-2xl border border-gray-200 p-4">
          <h3 className="mb-2 text-sm font-black text-gray-800">{t.is} <span className="font-normal text-gray-400">· {t.unit}</span></h3>
          {renderTable('is')}
        </div>
      </div>

      <p className="text-center text-[11px] leading-relaxed text-gray-400">{t.note}</p>
    </div>
  );
}
