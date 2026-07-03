import { useMemo, useState } from "react";
import type { Locale } from "../../lib/i18n";

// Q1·중앙값·Q3·IQR 계산기 — ahoxy /q1q3 이식(실트래픽 페이지).
// 사분위 방식: 배제법(Tukey) — 중앙값을 제외한 하/상반부의 중앙값.
const L: Record<Locale, {
  inputLabel: string; placeholder: string; calc: string; clear: string;
  n: string; min: string; q1: string; median: string; q3: string; max: string; iqr: string;
  outliers: string; none: string; fence: string; invalid: string; sorted: string;
}> = {
  ko: { inputLabel: "숫자 목록 (쉼표·공백·줄바꿈 구분)", placeholder: "예: 12, 7, 3, 15, 9, 21, 5", calc: "계산", clear: "지우기", n: "개수", min: "최솟값", q1: "제1사분위수 (Q1)", median: "중앙값", q3: "제3사분위수 (Q3)", max: "최댓값", iqr: "사분위범위 (IQR)", outliers: "이상치 (1.5×IQR 기준)", none: "없음", fence: "정상 범위", invalid: "숫자를 2개 이상 입력하세요.", sorted: "정렬된 데이터" },
  en: { inputLabel: "Numbers (comma, space or newline separated)", placeholder: "e.g. 12, 7, 3, 15, 9, 21, 5", calc: "Calculate", clear: "Clear", n: "Count", min: "Min", q1: "First quartile (Q1)", median: "Median", q3: "Third quartile (Q3)", max: "Max", iqr: "Interquartile range (IQR)", outliers: "Outliers (1.5×IQR rule)", none: "None", fence: "Normal range", invalid: "Enter at least 2 numbers.", sorted: "Sorted data" },
  ja: { inputLabel: "数値リスト（カンマ・空白・改行区切り）", placeholder: "例: 12, 7, 3, 15, 9, 21, 5", calc: "計算", clear: "クリア", n: "個数", min: "最小値", q1: "第1四分位数 (Q1)", median: "中央値", q3: "第3四分位数 (Q3)", max: "最大値", iqr: "四分位範囲 (IQR)", outliers: "外れ値（1.5×IQR基準）", none: "なし", fence: "正常範囲", invalid: "数値を2つ以上入力してください。", sorted: "整列データ" },
  zh: { inputLabel: "数字列表（逗号、空格或换行分隔）", placeholder: "例: 12, 7, 3, 15, 9, 21, 5", calc: "计算", clear: "清空", n: "个数", min: "最小值", q1: "第一四分位数 (Q1)", median: "中位数", q3: "第三四分位数 (Q3)", max: "最大值", iqr: "四分位距 (IQR)", outliers: "离群值（1.5×IQR 规则）", none: "无", fence: "正常范围", invalid: "请输入至少2个数字。", sorted: "排序后的数据" },
  fr: { inputLabel: "Nombres (séparés par virgule, espace ou retour)", placeholder: "ex. 12, 7, 3, 15, 9, 21, 5", calc: "Calculer", clear: "Effacer", n: "Effectif", min: "Min", q1: "Premier quartile (Q1)", median: "Médiane", q3: "Troisième quartile (Q3)", max: "Max", iqr: "Écart interquartile (IQR)", outliers: "Valeurs aberrantes (règle 1,5×IQR)", none: "Aucune", fence: "Plage normale", invalid: "Saisissez au moins 2 nombres.", sorted: "Données triées" },
  es: { inputLabel: "Números (separados por coma, espacio o salto)", placeholder: "ej. 12, 7, 3, 15, 9, 21, 5", calc: "Calcular", clear: "Borrar", n: "Cantidad", min: "Mín", q1: "Primer cuartil (Q1)", median: "Mediana", q3: "Tercer cuartil (Q3)", max: "Máx", iqr: "Rango intercuartílico (IQR)", outliers: "Valores atípicos (regla 1,5×IQR)", none: "Ninguno", fence: "Rango normal", invalid: "Introduce al menos 2 números.", sorted: "Datos ordenados" },
};

function median(sorted: number[]): number {
  const n = sorted.length;
  return n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

function fmt(x: number): string {
  return Number.isInteger(x) ? String(x) : x.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

export default function QuartileCalculator({ locale }: { locale: Locale }) {
  const t = L[locale] ?? L.en;
  const [raw, setRaw] = useState("");
  const [show, setShow] = useState(false);

  const result = useMemo(() => {
    const nums = raw.split(/[\s,;]+/).map(Number).filter((x) => Number.isFinite(x));
    if (nums.length < 2) return null;
    const s = [...nums].sort((a, b) => a - b);
    const n = s.length;
    const med = median(s);
    // Tukey(배제법): 홀수면 중앙값 제외
    const lower = s.slice(0, Math.floor(n / 2));
    const upper = s.slice(Math.ceil(n / 2));
    const q1 = median(lower);
    const q3 = median(upper);
    const iqr = q3 - q1;
    const lo = q1 - 1.5 * iqr;
    const hi = q3 + 1.5 * iqr;
    const outliers = s.filter((x) => x < lo || x > hi);
    return { s, n, min: s[0], max: s[n - 1], q1, med, q3, iqr, lo, hi, outliers };
  }, [raw]);

  return (
    <div className="not-prose my-8 mx-auto max-w-xl rounded-3xl border border-border bg-card p-6 shadow-sm">
      <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground" htmlFor="q1q3-in">{t.inputLabel}</label>
      <textarea id="q1q3-in" rows={3} value={raw} placeholder={t.placeholder}
        onChange={(e) => { setRaw(e.target.value); setShow(false); }}
        className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
      <div className="mt-3 flex gap-2">
        <button onClick={() => setShow(true)} disabled={!result}
          className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-40">{t.calc}</button>
        <button onClick={() => { setRaw(""); setShow(false); }}
          className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold hover:bg-muted">{t.clear}</button>
      </div>
      {raw.trim() && !result && <p className="mt-3 text-xs text-destructive">{t.invalid}</p>}
      {show && result && (
        <div className="mt-5 space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {([
              [t.n, String(result.n)], [t.min, fmt(result.min)], [t.max, fmt(result.max)],
              [t.q1, fmt(result.q1)], [t.median, fmt(result.med)], [t.q3, fmt(result.q3)],
            ] as const).map(([k, v]) => (
              <div key={k} className="rounded-xl bg-muted/60 p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{k}</p>
                <p className="text-lg font-black tabular-nums">{v}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{t.iqr}</p>
            <p className="text-2xl font-black tabular-nums text-primary">{fmt(result.iqr)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.fence}: {fmt(result.lo)} ~ {fmt(result.hi)}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3 text-xs">
            <b>{t.outliers}:</b> {result.outliers.length ? result.outliers.map(fmt).join(", ") : t.none}
          </div>
          <p className="break-all text-[11px] text-muted-foreground"><b>{t.sorted}:</b> {result.s.map(fmt).join(", ")}</p>
        </div>
      )}
    </div>
  );
}
