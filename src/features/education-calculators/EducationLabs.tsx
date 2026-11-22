import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import Target from 'lucide-react/dist/esm/icons/target'
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import { CVPChart } from "@/features/education-calculators/FinancialCharts";
import { drawSampleRates } from "@/lib/sampling-lab";

type Lang = "ko" | "en";

const CVP_COPY = {
  ko: { title: "CVP 손익분기점 실험실", p: "단위당 판매가격 (P)", vc: "단위당 변동원가 (VC)", fc: "총 고정원가 (FC)", key: "핵심 지표", cm: "단위당 공헌이익", cmr: "공헌이익률", bep: "손익분기 판매량", won: (v: number) => `${v.toLocaleString("ko-KR")}원`, units: (v: number) => `${v.toLocaleString("ko-KR")}개`, viz: "손익분기점 시각화" },
  en: { title: "CVP break-even lab", p: "Selling price per unit (P)", vc: "Variable cost per unit (VC)", fc: "Total fixed cost (FC)", key: "Key figures", cm: "Contribution margin per unit", cmr: "Contribution margin ratio", bep: "Break-even volume", won: (v: number) => `₩${v.toLocaleString("en-US")}`, units: (v: number) => `${v.toLocaleString("en-US")} units`, viz: "Break-even chart" },
} as const;

const SAMPLING_COPY = {
  ko: { title: "표본오차 실험실", rate: "모집단 비율 (예: 찬성률, %)", n: "표본 크기 (n)", trials: "반복 횟수", summary: "결과 요약", avg: "평균 추정치", spread: "변동성 (표준편차)", dist: "표본별 추정치 분포", redraw: "다시 뽑기", note: "* 표본 크기가 커질수록 평균은 안정되고 변동성이 줄어듭니다." },
  en: { title: "Sampling error lab", rate: "Population rate (e.g. approval, %)", n: "Sample size (n)", trials: "Repetitions", summary: "Summary", avg: "Average estimate", spread: "Spread (standard deviation)", dist: "Estimate from each sample", redraw: "Draw again", note: "* As the sample grows, the average settles and the spread shrinks." },
} as const;


/**
 * CVP Light Lab (Education Magazine)
 * Focused on break-even intuition with live chart
 */
export const CVPLab: React.FC<{ lang?: Lang }> = ({ lang = "ko" }) => {
  const c = CVP_COPY[lang];
  const [sellingPrice, setSellingPrice] = useState<number>(1200);
  const [variableCost, setVariableCost] = useState<number>(700);
  const [fixedCost, setFixedCost] = useState<number>(500000);

  const contributionMargin = sellingPrice - variableCost;
  const breakEvenPoint = useMemo(() => {
    if (contributionMargin <= 0) return 0;
    return Math.ceil(fixedCost / contributionMargin);
  }, [contributionMargin, fixedCost]);

  const contributionMarginRatio = useMemo(() => {
    if (sellingPrice <= 0) return 0;
    return (contributionMargin / sellingPrice) * 100;
  }, [contributionMargin, sellingPrice]);

  return (
    <Card className="p-4 sm:p-6 bg-card border-border shadow-xl mt-5 sm:mt-8">
      <div className="flex items-center gap-2 mb-6 text-foreground border-b pb-4">
        <Target className="text-green-500" />
        <h3 className="text-xl font-bold">{c.title}</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4 lg:col-span-1">
          <div className="p-4 rounded-xl border border-border bg-card">
            <label className="text-xs font-bold text-muted-foreground block mb-2">{c.p}</label>
            <input
              type="number"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground"
            />
          </div>
          <div className="p-4 rounded-xl border border-border bg-card">
            <label className="text-xs font-bold text-muted-foreground block mb-2">{c.vc}</label>
            <input
              type="number"
              value={variableCost}
              onChange={(e) => setVariableCost(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground"
            />
          </div>
          <div className="p-4 rounded-xl border border-border bg-card">
            <label className="text-xs font-bold text-muted-foreground block mb-2">{c.fc}</label>
            <input
              type="number"
              value={fixedCost}
              onChange={(e) => setFixedCost(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground"
            />
          </div>

          <div className="p-4 rounded-xl border border-green-200 bg-green-50/50">
            <div className="text-[10px] font-black uppercase tracking-widest text-green-700 mb-3">
              {c.key}
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{c.cm}</span>
                <span className="font-mono font-bold text-foreground">
                  {c.won(contributionMargin)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{c.cmr}</span>
                <span className="font-mono font-bold text-foreground">
                  {contributionMarginRatio.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{c.bep}</span>
                <span className="font-mono font-bold text-green-700">
                  {c.units(breakEvenPoint)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
            <TrendingUp className="text-green-500" size={14} /> {c.viz}
          </div>
          <CVPChart
            sellingPrice={sellingPrice}
            variableCost={variableCost}
            fixedCost={fixedCost}
            maxVolume={Math.max(1200, breakEvenPoint * 1.6)}
            lang={lang}
          />
        </div>
      </div>
    </Card>
  );
};

/**
 * Sampling Error Lab (Statistics Magazine)
 * Demonstrates how sample size affects estimate stability
 */
export const SamplingErrorLab: React.FC<{ lang?: Lang }> = ({ lang = "ko" }) => {
  const c = SAMPLING_COPY[lang];
  const [seed, setSeed] = useState<number>(1);
  const [populationRate, setPopulationRate] = useState<number>(55);
  const [sampleSize, setSampleSize] = useState<number>(30);
  const [trials, setTrials] = useState<number>(50);

  const results = useMemo(
    () => drawSampleRates(populationRate, sampleSize, trials, seed),
    [populationRate, sampleSize, trials, seed],
  );

  const avg = useMemo(() => {
    if (!results.length) return 0;
    return results.reduce((acc, v) => acc + v, 0) / results.length;
  }, [results]);

  const spread = useMemo(() => {
    if (!results.length) return 0;
    const variance =
      results.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / results.length;
    return Math.sqrt(variance);
  }, [results, avg]);

  return (
    <Card className="p-4 sm:p-6 bg-card border-border shadow-xl mt-5 sm:mt-8">
      <div className="flex items-center gap-2 mb-6 text-foreground border-b pb-4">
        <Target className="text-green-500" />
        <h3 className="text-xl font-bold">{c.title}</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4 lg:col-span-1">
          <div className="p-4 rounded-xl border border-border bg-card">
            <label className="text-xs font-bold text-muted-foreground block mb-2">{c.rate}</label>
            <input
              type="number"
              value={populationRate}
              onChange={(e) => setPopulationRate(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground"
            />
          </div>
          <div className="p-4 rounded-xl border border-border bg-card">
            <label className="text-xs font-bold text-muted-foreground block mb-2">{c.n}</label>
            <input
              type="number"
              value={sampleSize}
              onChange={(e) => setSampleSize(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground"
            />
          </div>
          <div className="p-4 rounded-xl border border-border bg-card">
            <label className="text-xs font-bold text-muted-foreground block mb-2">{c.trials}</label>
            <input
              type="number"
              value={trials}
              onChange={(e) => setTrials(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground"
            />
          </div>
          <div className="p-4 rounded-xl border border-green-200 bg-green-50/50">
            <div className="text-[10px] font-black uppercase tracking-widest text-green-700 mb-3">
              {c.summary}
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{c.avg}</span>
                <span className="font-mono font-bold text-foreground">
                  {avg.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{c.spread}</span>
                <span className="font-mono font-bold text-green-700">
                  {spread.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
            {c.dist}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {results.map((value, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border bg-card px-2 py-3 text-center text-sm font-bold text-slate-700"
              >
                {value.toFixed(0)}%
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 italic">
            {c.note}
          </p>
          <button
            type="button"
            onClick={() => setSeed((v) => v + 1)}
            className="mt-3 min-h-11 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted"
          >
            {c.redraw}
          </button>
        </div>
      </div>
    </Card>
  );
};
