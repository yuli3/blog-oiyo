import { inlineMd } from "../../../lib/utils";
import { jitter, planScale } from "./rung-scale";

/**
 * F6 Paired Rungs — lieflat-charts 포팅 (2026-09-04).
 *
 * 원본: `templates/basics-gallery.html` 의 `C2 · paired rungs`.
 * 한 항목에 사다리 둘을 나란히 세운다 — 흐린 쪽이 이전, 진한 쪽이 이후.
 * 두 사다리의 칸 수 차이가 곧 증감이라 **차이를 눈으로 세어** 알 수 있다.
 * catalog.md 가 "This year against last, plan by plan" 이라 적어 둔 자리다.
 *
 * F1 과 같은 정직성 계약을 따른다 — `planScale` 이 null 이면 이 도표를
 * 그리지 않는다(호출부가 표로 넘어간다). 단위는 두 계열을 합쳐 유도한다.
 *
 * 범례는 저자가 준 `beforeLabel`/`afterLabel` 을 쓴다. 이 컴포넌트는 로케일을
 * 못 받는데(MDX 레지스트리가 안 넘긴다) blog 는 6로케일이라, 우리가 산문을
 * 넣으면 다섯 나라 독자에게 한국어가 보인다. 저자는 이미 자기 로케일로
 * 쓰고 있으니 그쪽에 맡긴다.
 */

export interface PairedRow {
  name: string;
  before: number;
  after: number;
}

const MAX_CATEGORIES = 6; // 사다리가 둘이라 F1 보다 좁게 잡는다

export function planPaired(rows: PairedRow[]) {
  if (!rows.length || rows.length > MAX_CATEGORIES) return null;
  const mags = rows.flatMap((r) => [r.before, r.after]);
  const plan = planScale(mags);
  if (!plan) return null;

  // F1 에 없는 추가 조건: **차이도 셀 수 있어야 한다.**
  // 이 도표의 약속은 "두 사다리의 칸 수 차이가 곧 증감"이다. 실제로는 값이
  // 다른데 칸 수가 같아지면 그 약속이 깨진다 — 실측: 실제 75 vs 예측 73 은
  // 단위 5 에서 둘 다 15칸이 되어 차이가 사라진다. 그럴 바엔 표가 낫다.
  const gapLost = rows.some((r, i) => {
    const [b, a] = [plan.counts[i * 2], plan.counts[i * 2 + 1]];
    return r.before !== r.after && b === a;
  });
  if (gapLost) return null;

  return plan;
}

const md = (s: unknown) => ({ __html: inlineMd(String(s ?? "")) });

interface Props {
  title?: string;
  description?: string;
  rows: PairedRow[];
  beforeLabel?: string;
  afterLabel?: string;
  unitLabel?: string;
}

export default function PairedRungs({
  title,
  description,
  rows,
  beforeLabel = "before",
  afterLabel = "after",
  unitLabel = "",
}: Props) {
  const plan = planPaired(rows);
  if (!plan) return null;
  const { unit, counts } = plan;

  const COL = 74;
  const PAD = 36;
  const W = PAD * 2 + COL * rows.length;
  const BASE = 258;
  const H = 320;
  const HALF = 10;
  const GAP = 13; // 중심에서 각 사다리까지

  const maxCount = Math.max(...counts);
  const step = Math.min(5.4, (BASE - 46) / Math.max(maxCount, 1));
  const colX = (i: number) => PAD + COL * i + COL / 2;

  /** 사다리 하나. `tone` 이 흐림/진함을 가른다. */
  const ladder = (x: number, n: number, i: number, seed: number, faint: boolean) =>
    Array.from({ length: n }, (_, k) => {
      const y = BASE - k * step;
      const w = HALF - 1.2 + jitter(k + 1, i + seed) * 2.4;
      return (
        <line
          key={k}
          x1={x - w}
          y1={y}
          x2={x + w}
          y2={y}
          className={faint ? "rung-faint" : "rung-ink"}
          strokeWidth={1}
          opacity={(faint ? 0.5 : 0.6) + jitter(k + 2, i + seed + 1) * 0.4}
          style={{ animationDelay: `${(faint ? 0 : 0.15) + i * 0.08 + k * 0.01}s` }}
        />
      );
    });

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
        aria-label={`${title ? `${title}. ` : ""}${rows
          .map((r) => `${r.name}: ${beforeLabel} ${r.before}${unitLabel}, ${afterLabel} ${r.after}${unitLabel}`)
          .join(". ")}`}
      >
        {rows.map((row, i) => {
          const x = colX(i);
          const nBefore = counts[i * 2];
          const nAfter = counts[i * 2 + 1];
          return (
            <g key={`${row.name}-${i}`}>
              {ladder(x - GAP, nBefore, i, 2, true)}
              {ladder(x + GAP, nAfter, i, 7, false)}

              <text
                x={x - GAP}
                y={BASE - Math.max(nBefore - 1, 0) * step - 9}
                fontSize={8.5}
                fontWeight={700}
                textAnchor="middle"
                className="rung-faint-text"
                style={{ animationDelay: `${0.5 + i * 0.08}s` }}
              >
                {row.before}
              </text>
              <text
                x={x + GAP}
                y={BASE - Math.max(nAfter - 1, 0) * step - 9}
                fontSize={10.5}
                fontWeight={800}
                textAnchor="middle"
                fill="currentColor"
                style={{ animationDelay: `${0.5 + i * 0.08}s` }}
              >
                {row.after}
              </text>
              <text
                x={x}
                y={BASE + 18}
                fontSize={7.5}
                fontWeight={700}
                textAnchor="middle"
                letterSpacing=".08em"
                className="rung-label"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                {row.name}
              </text>
            </g>
          );
        })}

        <line x1={PAD - 6} y1={BASE + 4} x2={W - PAD + 6} y2={BASE + 4} className="rung-axis" strokeWidth={0.8} />

        {/* 범례: 흐림/진함이 무엇인지 저자가 준 이름으로 밝힌다. */}
        <g style={{ animationDelay: "1s" }}>
          <line x1={W / 2 - 96} y1={302} x2={W / 2 - 84} y2={302} className="rung-faint" strokeWidth={1.4} opacity={0.8} />
          <text x={W / 2 - 79} y={305} fontSize={7.5} fontWeight={600} className="rung-legend">
            {beforeLabel}
          </text>
          <line x1={W / 2 + 4} y1={302} x2={W / 2 + 16} y2={302} className="rung-ink" strokeWidth={1.4} />
          <text x={W / 2 + 21} y={305} fontSize={7.5} fontWeight={600} className="rung-legend">
            {afterLabel}
          </text>
          <text x={W / 2} y={317} fontSize={7} fontWeight={600} textAnchor="middle" className="rung-legend">
            {`▬ = ${unit}${unitLabel}`}
          </text>
        </g>
      </svg>
    </figure>
  );
}
