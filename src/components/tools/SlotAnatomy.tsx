import React, { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import {
  REELS, PAYOUTS, SYMBOL_LABELS,
  evaluateStops, nearMissAmplification, simulate, theoreticalReturnRate, varianceBands,
} from "../../lib/gambling/slot-anatomy";

// A teaching aid, not a game. There is deliberately no spin button, no balance,
// no bet and no win animation — those are the mechanics our gambling-prevention
// series identifies as the addictive part (see ch3 and ch6). Everything here runs
// in a batch and reports aggregates, so no single outcome is ever suspenseful.

type Copy = {
  reelTitle: string; reelNote: string; paylineLabel: string; adjacentLabel: string;
  payoutTitle: string; comboCol: string; multiplierCol: string; probCol: string;
  runLabel: string; running: string;
  designTitle: string; designNote: (rtp: string) => string;
  bandTitle: string; bandNote: string; spinsCol: string; rangeCol: string; spreadCol: string;
  certainLoss: string; couldProfit: string;
  nearTitle: string; nearNote: (amp: string, near: string, jp: string) => string;
  curveTitle: string; curveX: string; curveY: string;
  closing: string;
};

const COPY: Record<string, Copy> = {
  ko: {
    reelTitle: "1. 릴은 어떻게 배치돼 있나",
    reelNote: "각 릴에 7은 딱 하나입니다. 그런데 7의 양옆이 빈칸이라, 한 칸만 어긋나 멈추면 7이 당첨선 바로 위나 아래에 보입니다. 이 '아깝다'는 배치의 결과입니다.",
    paylineLabel: "당첨선",
    adjacentLabel: "7이 인접 = 니어미스",
    payoutTitle: "2. 배당표와 실제 확률",
    comboCol: "조합", multiplierCol: "배당", probCol: "확률",
    runLabel: "규모별로 돌려보기",
    running: "계산 중…",
    designTitle: "3. 이 기계가 설계상 돌려주는 비율",
    designNote: (rtp) => `릴 구성과 배당표만으로 계산하면 이 기계의 환수율은 ${rtp}%입니다. 나머지는 운영자 몫이고, 이 값은 운과 무관하게 고정입니다.`,
    bandTitle: "4. 짧게 하면 이겨 보이고, 길게 하면 못 이깁니다",
    bandNote: "같은 기계를 서로 다른 5개 조건으로 돌린 결과입니다. 회전수가 적을 때는 환수율이 100%를 넘기도 합니다 — 짧은 시간 안에서는 \"슬롯은 돈이 된다\"는 결론이 실제로 가능합니다. 회전수가 늘면 그 폭이 설계값으로 좁혀지고, 이길 여지가 사라집니다.",
    spinsCol: "회전수", rangeCol: "환수율 범위", spreadCol: "폭",
    certainLoss: "손실 확정",
    couldProfit: "이익도 가능",
    nearTitle: "5. '거의 맞았다'는 몇 배나 자주 오는가",
    nearNote: (amp, near, jp) => `100만 회 중 잭팟은 ${jp}회, 7이 당첨선 옆에 붙은 니어미스는 ${near}회였습니다. 아깝다는 느낌이 실제 당첨보다 ${amp}배 자주 옵니다. 실력이 늘어서 아깝게 진 것이 아니라, 아깝게 지도록 배치된 것입니다.`,
    curveTitle: "누적 손익 (100만 회)",
    curveX: "회전수", curveY: "누적 크레딧",
    closing: "이 페이지에는 베팅 버튼도, 잔고도, 당첨 연출도 없습니다. 그 세 가지가 도박을 멈추기 어렵게 만드는 장치이기 때문입니다.",
  },
  en: {
    reelTitle: "1. How the reels are laid out",
    reelNote: "Each reel holds exactly one 7 — but it sits between blanks, so stopping one position off puts the 7 directly above or below the payline. That \"so close\" feeling is a layout decision.",
    paylineLabel: "Payline",
    adjacentLabel: "7 adjacent = near miss",
    payoutTitle: "2. Payout table and real odds",
    comboCol: "Combo", multiplierCol: "Pays", probCol: "Odds",
    runLabel: "Run it at several scales",
    running: "Computing…",
    designTitle: "3. What this machine is designed to return",
    designNote: (rtp) => `From reel composition and payouts alone, this machine returns ${rtp}%. The rest is the operator's, and that figure is fixed regardless of luck.`,
    bandTitle: "4. Short sessions look winnable. Long ones are not.",
    bandNote: "The same machine, run under five different conditions at each scale. At low spin counts the return can exceed 100% — a short session really can \"prove\" that slots pay. As spins rise the range collapses onto the designed figure and the room to win disappears.",
    spinsCol: "Spins", rangeCol: "Return range", spreadCol: "Spread",
    certainLoss: "loss certain",
    couldProfit: "profit possible",
    nearTitle: "5. How much more often \"almost\" arrives",
    nearNote: (amp, near, jp) => `Across a million spins there were ${jp} jackpots and ${near} near misses with a 7 beside the payline. The feeling of almost arrives ${amp}x more often than the prize. You did not get closer because you improved — it is arranged to look close.`,
    curveTitle: "Cumulative balance (1,000,000 spins)",
    curveX: "Spins", curveY: "Cumulative credits",
    closing: "This page has no bet button, no balance and no win animation, because those three are what make gambling hard to stop.",
  },
  ja: {
    reelTitle: "1. リールはどう配置されているか",
    reelNote: "各リールに7はひとつだけ。しかし7の両隣が空白なので、一コマずれて止まると7が当たりラインのすぐ上か下に見えます。この「惜しい」は配置の結果です。",
    paylineLabel: "当たりライン",
    adjacentLabel: "7が隣接＝ニアミス",
    payoutTitle: "2. 配当表と実際の確率",
    comboCol: "組み合わせ", multiplierCol: "配当", probCol: "確率",
    runLabel: "規模別に回してみる",
    running: "計算中…",
    designTitle: "3. この機械が設計上返す割合",
    designNote: (rtp) => `リール構成と配当表だけで計算すると、この機械の還元率は${rtp}%です。残りは運営者のもので、この値は運と無関係に固定です。`,
    bandTitle: "4. 短く回せば勝てるように見え、長く回せば勝てません",
    bandNote: "同じ機械を各規模で5通りの条件で回した結果です。回転数が少ないうちは還元率が100%を超えることもあります——短時間なら「スロットは儲かる」という結論が実際に成立します。回転数が増えると幅は設計値に収束し、勝つ余地は消えます。",
    spinsCol: "回転数", rangeCol: "還元率の範囲", spreadCol: "幅",
    certainLoss: "損失確定",
    couldProfit: "利益も可能",
    nearTitle: "5. 「惜しい」は何倍の頻度で来るのか",
    nearNote: (amp, near, jp) => `100万回のうちジャックポットは${jp}回、7が当たりラインの隣に来たニアミスは${near}回でした。惜しいという感覚は実際の当選より${amp}倍多く訪れます。腕が上がって惜しくなったのではなく、惜しく見えるように配置されているのです。`,
    curveTitle: "累積損益（100万回）",
    curveX: "回転数", curveY: "累積クレジット",
    closing: "このページにはベットボタンも残高も当選演出もありません。その三つが、ギャンブルをやめにくくする仕掛けだからです。",
  },
};

function ReelStrip({ reel, stop, t }: { reel: typeof REELS[number]; stop: number; t: Copy }) {
  const at = (i: number) => reel[((i % reel.length) + reel.length) % reel.length];
  const rows = [
    { pos: stop - 1, symbol: at(stop - 1) },
    { pos: stop, symbol: at(stop) },
    { pos: stop + 1, symbol: at(stop + 1) },
  ];
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border-2 border-slate-300">
      {rows.map((r, i) => (
        <div
          key={r.pos}
          className={`flex h-12 w-16 items-center justify-center text-2xl ${
            i === 1 ? "bg-amber-100 font-black" : "bg-slate-50 text-slate-400"
          } ${r.symbol === "seven" && i !== 1 ? "text-rose-500" : ""}`}
          aria-label={i === 1 ? `${t.paylineLabel}: ${SYMBOL_LABELS[r.symbol]}` : SYMBOL_LABELS[r.symbol]}
        >
          {SYMBOL_LABELS[r.symbol]}
        </div>
      ))}
    </div>
  );
}

const SlotAnatomy: React.FC<{ locale?: string }> = ({ locale = "ko" }) => {
  const t = COPY[locale] ?? COPY.en;
  const [bands, setBands] = useState<ReturnType<typeof varianceBands> | null>(null);
  const [big, setBig] = useState<ReturnType<typeof simulate> | null>(null);
  const [busy, setBusy] = useState(false);

  const designRtp = useMemo(() => theoreticalReturnRate(), []);

  // A stop offset of 1 puts the 7 one position off the payline on every reel —
  // the canonical near miss, shown statically rather than spun to.
  const nearMissStops = [1, 1, 1];
  const nearMissOutcome = useMemo(() => evaluateStops(nearMissStops), []);

  const run = () => {
    setBusy(true);
    // Yield once so the button can show its pending state before the main thread
    // blocks for ~1s on a million iterations.
    setTimeout(() => {
      setBands(varianceBands());
      setBig(simulate(1_000_000));
      setBusy(false);
    }, 30);
  };

  const probabilityOf = (combo: string) =>
    REELS.reduce((p, reel) => p * (reel.filter((s) => s === combo).length / reel.length), 1);

  const amp = big ? nearMissAmplification(big) : null;

  return (
    <div className="space-y-10">
      {/* 1. reel layout */}
      <section>
        <h2 className="text-xl font-bold text-slate-900">{t.reelTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{t.reelNote}</p>
        <div className="mt-4 flex items-center gap-3">
          {REELS.map((reel, i) => (
            <ReelStrip key={i} reel={reel} stop={nearMissStops[i]} t={t} />
          ))}
          <div className="ml-2 rounded-md bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
            {t.adjacentLabel}
            <span className="ml-2 font-normal">
              {nearMissOutcome.nearMiss ? "✓" : "—"} ({nearMissOutcome.payout} credits)
            </span>
          </div>
        </div>
      </section>

      {/* 2. payout table */}
      <section>
        <h2 className="text-xl font-bold text-slate-900">{t.payoutTitle}</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2">{t.comboCol}</th>
                <th className="py-2 text-right">{t.multiplierCol}</th>
                <th className="py-2 text-right">{t.probCol}</th>
              </tr>
            </thead>
            <tbody>
              {PAYOUTS.map((p) => (
                <tr key={p.combo} className="border-b border-slate-100">
                  <td className="py-2 text-lg">{SYMBOL_LABELS[p.combo].repeat(3)}</td>
                  <td className="py-2 text-right font-bold">×{p.multiplier}</td>
                  <td className="py-2 text-right tabular-nums text-slate-600">
                    1 / {Math.round(1 / probabilityOf(p.combo)).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. designed return */}
      <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-xl font-bold text-slate-900">{t.designTitle}</h2>
        <p className="mt-2 text-3xl font-black tabular-nums text-slate-900">{designRtp.toFixed(2)}%</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{t.designNote(designRtp.toFixed(2))}</p>
      </section>

      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="w-full rounded-xl bg-slate-900 px-6 py-4 text-base font-bold text-white transition-colors hover:bg-slate-700 disabled:opacity-60"
      >
        {busy ? t.running : t.runLabel}
      </button>

      {/* 4. variance bands */}
      {bands && (
        <section>
          <h2 className="text-xl font-bold text-slate-900">{t.bandTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{t.bandNote}</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2">{t.spinsCol}</th>
                  <th className="py-2 text-right">{t.rangeCol}</th>
                  <th className="py-2 text-right">{t.spreadCol}</th>
                  <th className="py-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {bands.map((b) => (
                  <tr key={b.spins} className="border-b border-slate-100">
                    <td className="py-2 tabular-nums">{b.spins.toLocaleString()}</td>
                    <td className="py-2 text-right tabular-nums">
                      {b.min.toFixed(1)} – {b.max.toFixed(1)}%
                    </td>
                    <td className="py-2 text-right tabular-nums font-bold">{b.spread.toFixed(1)}pp</td>
                    <td className="py-2 text-right">
                      <span className={`rounded px-2 py-0.5 text-xs font-bold ${
                        b.losingIsCertain ? "bg-slate-800 text-white" : "bg-amber-100 text-amber-800"
                      }`}>
                        {b.losingIsCertain ? t.certainLoss : t.couldProfit}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 5. near-miss amplification + balance curve */}
      {big && amp !== null && (
        <>
          <section>
            <h2 className="text-xl font-bold text-slate-900">{t.nearTitle}</h2>
            <p className="mt-2 text-4xl font-black tabular-nums text-rose-600">{amp.toFixed(1)}×</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {t.nearNote(amp.toFixed(1), big.nearMisses.toLocaleString(), big.jackpots.toLocaleString())}
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-900">{t.curveTitle}</h3>
            <div className="mt-3 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={big.curve} margin={{ top: 8, right: 8, bottom: 24, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="spin" tick={{ fontSize: 11 }} stroke="#94a3b8"
                    tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                    label={{ value: t.curveX, position: "insideBottom", offset: -12, fontSize: 11 }}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }} stroke="#94a3b8"
                    tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(v) => Number(v).toLocaleString()}
                    labelFormatter={(v) => `${Number(v).toLocaleString()} ${t.curveX}`}
                  />
                  <ReferenceLine y={0} stroke="#0f172a" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="credits" stroke="#e11d48" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}

      <p className="rounded-lg bg-slate-100 p-4 text-xs leading-relaxed text-slate-600">{t.closing}</p>
    </div>
  );
};

export default SlotAnatomy;
