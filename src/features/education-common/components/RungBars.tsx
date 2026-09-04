import { inlineMd } from "../../../lib/utils";
import { jitter, planScale } from "./rung-scale";

/**
 * F1 Rung Bars — lieflat-charts 시험 포팅 (2026-09-04, 세운 지시).
 *
 * 원본: github.com/larashero3-dotcom/lieflat-charts, `templates/basics-gallery.html`
 * 의 `B1 · rung bars`. 발상은 하나다 — **막대를 세로로 칠하지 말고, 셀 수 있는
 * 가로 눈금(rung)을 쌓아 올린다.** 멀리서 보면 막대그래프 실루엣이고, 가까이
 * 보면 한 칸 한 칸이 실제 단위다. 눈금 길이와 투명도를 아주 조금 흔들어
 * 손그림 질감을 낸다.
 *
 * 우리 쪽으로 옮기며 바꾼 것 넷:
 *
 * 1. **서버에서 그린다.** 원본은 IntersectionObserver 로 뷰포트 진입 때
 *    innerHTML 을 채운다 — JS 가 없으면 빈 SVG 다. blog 는 정적 빌드라
 *    SVG 를 서버에서 완성하고 애니메이션만 CSS 로 얹었다. JS 꺼도 읽힌다.
 * 2. **눈금 단위를 데이터에서 유도한다.** 원본은 "1 rung = $1k" 고정이다.
 *    우리 데이터는 1~225 로 흩어져 있어서(실측 n=171, 중앙값 30) 가장 큰
 *    막대가 12~38칸에 들어오도록 1·2·5·10·20·25·50·100 중에서 고른다.
 * 3. **정직하게 못 그리면 안 그린다.** 항목이 8개를 넘거나, 유도한 단위로
 *    최대 막대가 40칸을 넘거나, 0이 아닌 값이 반올림으로 0칸이 되면
 *    `null` 을 돌려준다. 호출부가 기존 막대로 넘어간다 — 셀 수 없는 눈금은
 *    이 도표의 존재 이유를 부순다.
 * 4. **색은 토큰, 테마는 양방향.** 원본의 #1C1C1A/#F0EFEB 하드코딩 대신
 *    --foreground/--muted-foreground/--border 를 쓴다.
 *
 * 흔들림(`jitter`)은 원본 그대로 해시 기반이라 결정적이다 — 서버와 클라이언트가
 * 같은 그림을 낸다.
 */

export interface RungRow {
  name: string;
  value: number;
  color?: string;
}

const MAX_CATEGORIES = 8;

export function planRungs(rows: RungRow[]): { unit: number; counts: number[] } | null {
  if (!rows.length || rows.length > MAX_CATEGORIES) return null;
  return planScale(rows.map((r) => r.value));
}

const md = (s: unknown) => ({ __html: inlineMd(String(s ?? "")) });

interface Props {
  title?: string;
  description?: string;
  rows: RungRow[];
  /** 눈금 하나가 뜻하는 단위의 이름. 예: "만원", "%" */
  unitLabel?: string;
}

/**
 * 정직하게 그릴 수 없는 데이터면 `null` 을 돌려준다 — 호출부에서 기존
 * 막대로 대체할 것.
 */
export default function RungBars({ title, description, rows, unitLabel = "" }: Props) {
  const plan = planRungs(rows);
  if (!plan) return null;
  const { unit, counts } = plan;

  // 뷰박스는 항목 수에 따라 늘린다 — 3개든 8개든 눈금 간격이 같아야
  // "한 칸 = 한 단위" 라는 약속이 유지된다.
  const COL = 62;
  const PAD = 34;
  const W = PAD * 2 + COL * rows.length;
  const BASE = 266;
  const STEP = 5.6; // 눈금 하나의 세로 간격
  const HALF = 14; // 눈금 반폭
  const H = 320;

  const maxCount = Math.max(...counts);
  // 가장 높은 막대가 위로 넘치면 간격을 줄인다.
  const step = Math.min(STEP, (BASE - 46) / Math.max(maxCount, 1));

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
        aria-label={`${title ? `${title}. ` : ""}${rows
          .map((r) => `${r.name} ${r.value}${unitLabel}`)
          .join(", ")}`}
      >
        {rows.map((row, i) => {
          const x = colX(i);
          const n = counts[i];
          const topY = BASE - Math.max(n - 1, 0) * step;
          return (
            <g key={`${row.name}-${i}`}>
              {Array.from({ length: n }, (_, k) => {
                const y = BASE - k * step;
                const w = HALF - 1.5 + jitter(k + 1, i + 2) * 3;
                const delay = i * 0.08 + k * 0.012;
                return (
                  <g key={k}>
                    <line
                      x1={x - w}
                      y1={y}
                      x2={x + w}
                      y2={y}
                      stroke={row.color || "currentColor"}
                      strokeWidth={1}
                      opacity={0.5 + jitter(k + 2, i + 4) * 0.5}
                      style={{ animationDelay: `${delay}s` }}
                    />
                    {/* 5칸마다 점 — 세는 걸 돕는다. 원본의 핵심 장치다. */}
                    {k % 5 === 4 && (
                      <circle
                        cx={x + HALF + 4.5}
                        cy={y}
                        r={0.8}
                        className="rung-tick"
                        style={{ animationDelay: `${delay}s` }}
                      />
                    )}
                  </g>
                );
              })}

              <text
                x={x}
                y={topY - 10}
                fontSize={11}
                fontWeight={800}
                textAnchor="middle"
                fill="currentColor"
                style={{ animationDelay: `${0.4 + i * 0.08}s` }}
              >
                {row.value}
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
        {/*
          범례는 기호만 쓴다. blog 는 6로케일인데 이 컴포넌트는 로케일을 받지
          않는다(MDX 레지스트리가 넘겨주지 않는다). 산문을 넣으면 다섯 나라
          독자에게 한국어가 보인다 — 기호는 어디서나 읽힌다.
        */}
        <text
          x={W / 2}
          y={306}
          fontSize={7.5}
          fontWeight={600}
          textAnchor="middle"
          letterSpacing=".12em"
          className="rung-legend"
          style={{ animationDelay: ".9s" }}
        >
          {`▬ = ${unit}${unitLabel}    ● = 5▬`}
        </text>
      </svg>
    </figure>
  );
}
