import { inlineMd } from "../../../lib/utils";
import { jitter, planScale } from "./rung-scale";

/**
 * F9 Rung Waterfall — lieflat-charts 포팅 (2026-09-04).
 *
 * 원본: `templates/basics-gallery.html` 의 `C5 · rung waterfall`.
 * "From gross to net, step by step" — 총액에서 시작해 한 단계씩 빼고 더해
 * 최종액에 닿는 과정을 사다리로 보여준다. 더하는 칸은 실선, 빼는 칸은
 * 점선이다. 단계 사이는 파선 계단으로 이어 "여기서 저기로 내려간다"를 잇는다.
 *
 * 원본 코드는 러닝 합계를 두 번 계산한다(`levels` 를 만들었다가 버리고
 * `rows` 를 다시 만든다). 여기서는 한 번만 계산한다.
 *
 * **원본에 없는 검증을 하나 더한다.** 저자가 선언한 총계(`total: true`)가
 * 앞선 증감의 누적과 어긋나면 그리지 않는다. 폭포도는 "이 숫자들이 저
 * 숫자로 이어진다"는 주장이라, 실제로 이어지지 않으면 그림이 거짓말이 된다.
 * 표는 어긋나도 독자가 각 줄을 따로 읽지만 폭포도는 그럴 수 없다.
 */

export interface WaterfallStep {
  name: string;
  /** 총계면 절대값, 아니면 증감(음수 = 차감). */
  value: number;
  /** 0 에서 올라오는 기둥으로 그린다(시작 총액·최종 총액). */
  total?: boolean;
}

const MAX_STEPS = 8;
/** 선언된 총계와 누적의 허용 오차(반올림된 학습용 수치를 고려). */
const TOTAL_TOLERANCE = 0.01;

interface Level {
  step: WaterfallStep;
  /** 기둥이 차지하는 구간 [lo, hi] (단위: 값). */
  lo: number;
  hi: number;
  negative: boolean;
}

/** 단계들을 기둥 구간으로 푼다. 앞뒤가 안 맞으면 null. */
export function planWaterfall(steps: WaterfallStep[]) {
  if (!steps.length || steps.length > MAX_STEPS) return null;
  if (steps.some((s) => !Number.isFinite(s.value))) return null;
  if (!steps[0]?.total) return null; // 폭포는 총액에서 출발한다

  const levels: Level[] = [];
  let running = 0;
  for (const step of steps) {
    if (step.total) {
      // 첫 단계가 아니면 지금까지의 누적과 맞아야 한다.
      if (levels.length && Math.abs(running - step.value) > Math.max(TOTAL_TOLERANCE, Math.abs(step.value) * 0.005)) {
        return null;
      }
      running = step.value;
      levels.push({ step, lo: 0, hi: step.value, negative: false });
    } else {
      const next = running + step.value;
      levels.push({
        step,
        lo: Math.min(running, next),
        hi: Math.max(running, next),
        negative: step.value < 0,
      });
      running = next;
    }
  }

  // 눈금 단위는 기둥의 "꼭대기"들로 정한다 — 0 에서 hi 까지 세어야 하므로.
  const scale = planScale(levels.map((l) => Math.abs(l.hi)));
  if (!scale) return null;

  // 값이 0 인 단계(예: 매출원가 0)는 칸이 없다. 그건 거짓말이 아니라
  // "뺀 게 없다"는 사실이므로 허용한다 — 숫자 라벨이 0 을 밝힌다.
  return { levels, unit: scale.unit };
}

const md = (s: unknown) => ({ __html: inlineMd(String(s ?? "")) });

interface Props {
  title?: string;
  description?: string;
  steps: WaterfallStep[];
  unitLabel?: string;
}

export default function RungWaterfall({ title, description, steps, unitLabel = "" }: Props) {
  const plan = planWaterfall(steps);
  if (!plan) return null;
  const { levels, unit } = plan;

  const COL = 72;
  const PAD = 34;
  const W = PAD * 2 + COL * levels.length;
  const BASE = 252;
  const H = 320;
  const HALF = 11;

  const topLevel = Math.max(...levels.map((l) => l.hi)) / unit;
  const step = Math.min(5.2, (BASE - 46) / Math.max(topLevel, 1));
  const yOf = (rungs: number) => BASE - rungs * step;
  const colX = (i: number) => PAD + COL * i + COL / 2;

  return (
    <figure className="my-12 rounded-3xl border border-border/40 bg-muted/20 p-8">
      {title && (
        <h3 className="mb-2 text-center text-sm font-bold uppercase tracking-[0.2em] text-primary/60">{title}</h3>
      )}
      {description && (
        <p
          className="mb-6 text-center text-sm leading-relaxed text-muted-foreground"
          dangerouslySetInnerHTML={md(description)}
        />
      )}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="rung-bars mx-auto block w-full max-h-[340px]"
        role="img"
        aria-label={`${title ? `${title}. ` : ""}${steps
          .map((s) => `${s.name} ${s.value > 0 && !s.total ? "+" : ""}${s.value}${unitLabel}`)
          .join(", ")}`}
      >
        {levels.map(({ step: s, lo, hi, negative }, i) => {
          const x = colX(i);
          const loR = Math.round(lo / unit);
          const hiR = Math.round(hi / unit);
          const n = hiR - loR;
          const nextLevel = s.total ? hiR : negative ? loR : hiR;
          return (
            <g key={`${s.name}-${i}`}>
              {Array.from({ length: n }, (_, k) => {
                const y = yOf(loR + k);
                const w = HALF - 1.2 + jitter(k + 1, i + 2) * 2.4;
                return (
                  <line
                    key={k}
                    x1={x - w}
                    y1={y}
                    x2={x + w}
                    y2={y}
                    className={negative ? "rung-minus" : "rung-ink"}
                    strokeWidth={1}
                    strokeDasharray={negative ? "2.5 2.5" : undefined}
                    opacity={negative ? 0.7 : 0.6 + jitter(k + 2, i + 4) * 0.4}
                    style={{ animationDelay: `${i * 0.12 + k * 0.014}s` }}
                  />
                );
              })}

              {/* 계단 이음: 다음 기둥이 출발할 높이까지 파선을 긋는다. */}
              {i < levels.length - 1 && (
                <line
                  x1={x + HALF + 2}
                  y1={yOf(nextLevel)}
                  x2={colX(i + 1) - HALF - 2}
                  y2={yOf(nextLevel)}
                  className="rung-axis"
                  strokeWidth={0.7}
                  strokeDasharray="2 3"
                  style={{ animationDelay: `${0.3 + i * 0.12}s` }}
                />
              )}

              <text
                x={x}
                y={yOf(hiR) - 8}
                fontSize={10}
                fontWeight={800}
                textAnchor="middle"
                className={negative ? "rung-minus-text" : undefined}
                fill={negative ? undefined : "currentColor"}
                style={{ animationDelay: `${0.4 + i * 0.12}s` }}
              >
                {`${negative ? "−" : ""}${Math.abs(s.value)}`}
              </text>
              <text
                x={x}
                y={BASE + 18}
                fontSize={7.5}
                fontWeight={700}
                textAnchor="middle"
                letterSpacing=".08em"
                className="rung-label"
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                {s.name}
              </text>
            </g>
          );
        })}

        <line x1={PAD - 6} y1={BASE + 4} x2={W - PAD + 6} y2={BASE + 4} className="rung-axis" strokeWidth={0.8} />

        {/* 범례: 실선은 더하고 점선은 뺀다. 기호만 쓴다(6로케일). */}
        <g style={{ animationDelay: "1.2s" }}>
          <line x1={W / 2 - 78} y1={302} x2={W / 2 - 66} y2={302} className="rung-ink" strokeWidth={1.4} />
          <text x={W / 2 - 61} y={305} fontSize={7.5} fontWeight={700} className="rung-legend">
            +
          </text>
          <line
            x1={W / 2 - 40}
            y1={302}
            x2={W / 2 - 28}
            y2={302}
            className="rung-minus"
            strokeWidth={1.4}
            strokeDasharray="2.5 2.5"
          />
          <text x={W / 2 - 23} y={305} fontSize={7.5} fontWeight={700} className="rung-legend">
            −
          </text>
          <text x={W / 2 + 34} y={305} fontSize={7} fontWeight={600} textAnchor="middle" className="rung-legend">
            {`▬ = ${unit}${unitLabel}`}
          </text>
        </g>
      </svg>
    </figure>
  );
}
