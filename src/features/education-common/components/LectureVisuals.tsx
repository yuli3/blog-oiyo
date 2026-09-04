import { inlineMd } from "../../../lib/utils";
import RungBars, { planRungs } from "./RungBars";

/**
 * 강의형 본문의 표·단계·차트.
 *
 * 2026-09-03 발견: LecturePieChart·LectureBarChart 는 실제 렌더링 코드가 없고
 * "(Please use <BarChart /> for actual rendering)" 라는 작성용 메모를 독자에게
 * 그대로 보여주는 자리표시자였다. 71개 문서가 이 컴포넌트를 실제 데이터
 * (`data={[{name,value,color}]}` + `description`)와 함께 호출하고 있었는데
 * 컴포넌트가 그 props 를 아예 받지 않았다 — 화면엔 항상 이모지 카드만 떴다.
 * (oiyo 로 이관된 4편은 다른 호출 형태 `labels`/`values` 를 썼는데, 그쪽도 같은
 * 증상이라 2026-09-03 4단계에서 먼저 고쳤다. 이 파일은 그 짝이다.)
 *
 * 여기서는 두 호출 형태를 모두 받는다 — 실사용은 data= 이지만 labels/values
 * 로 오는 것도 같은 내부 형태로 정규화해 같은 렌더러를 쓴다.
 *
 * 색은 하드코딩(#e2e8f0·#3b82f6 등)에서 토큰으로 옮겼다. 표 셀·설명문의
 * **강조** 도 마크다운 파서를 거치지 않던 것을 inlineMd 로 편다.
 */

interface Row {
  name: string;
  value: number;
  color?: string;
}

function normalize({ data, labels, values, colors }: any): Row[] {
  if (Array.isArray(data)) {
    return data.map((d: any) => ({ name: String(d.name ?? d.label ?? ""), value: Number(d.value) || 0, color: d.color }));
  }
  if (Array.isArray(labels)) {
    return labels.map((label: string, i: number) => ({
      name: label,
      value: Number(values?.[i]) || 0,
      color: colors?.[i],
    }));
  }
  return [];
}

const md = (s: unknown) => ({ __html: inlineMd(String(s ?? "")) });

// ── LectureTable ────────────────────────────────────────────────────────
export function LectureTable({ title, headers, rows, highlightColumns = [] }: any) {
  return (
    <div className="my-10 overflow-x-auto rounded-2xl border border-border/40 bg-card shadow-sm">
      <table className="w-full border-collapse text-left text-[0.95rem]">
        {title && (
          <caption className="border-b border-border/40 bg-muted/20 px-6 py-5 text-left text-lg font-bold text-foreground">
            {title}
          </caption>
        )}
        {headers?.length ? (
          <thead className="bg-muted/30">
            <tr>
              {headers.map((h: any, i: number) => (
                <th key={i} className="whitespace-nowrap px-6 py-4 font-semibold text-muted-foreground" dangerouslySetInnerHTML={md(h)} />
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {rows?.map((r: any, i: number) => (
            <tr key={i} className="border-b border-border/30 last:border-0">
              {r.map((c: any, j: number) => (
                <td
                  key={j}
                  className={`px-6 py-4 leading-relaxed text-foreground ${
                    highlightColumns.includes(j) ? "bg-primary/5 font-medium" : ""
                  }`}
                  dangerouslySetInnerHTML={md(c)}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── LectureProcess ──────────────────────────────────────────────────────
export function LectureProcess({ title, steps }: any) {
  return (
    <div className="my-10 rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
      {title && <h4 className="mb-8 mt-0 text-center text-xl font-bold text-foreground">{title}</h4>}
      <div className="flex flex-col gap-6">
        {steps?.map((step: any, i: number) => (
          <div key={i} className="flex gap-6">
            <div className="flex flex-col items-center">
              <div className="z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground shadow">
                {i + 1}
              </div>
              {i < steps.length - 1 && <div className="my-2 w-0.5 grow bg-primary/25" />}
            </div>
            <div className={i < steps.length - 1 ? "pb-6" : ""}>
              <strong className="mb-1.5 block text-[1.05rem] text-foreground" dangerouslySetInnerHTML={md(step.label)} />
              {step.description && (
                <p className="m-0 text-[0.95rem] leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={md(step.description)} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── LectureBarChart ─────────────────────────────────────────────────────
// blog 의 실제 BarChart.astro 와 같은 언어(세로 막대, 호버 툴팁)로 맞춘다 —
// 같은 사이트 안에 같은 종류 차트가 둘 있으면서 모양이 다르면 그것도 중복이다.
export function LectureBarChart(props: any) {
  const rows = normalize(props);
  if (!rows.length) return null;

  // 2026-09-04: lieflat-charts 의 F1 Rung Bars 를 먼저 시도한다. 막대를 셀 수
  // 있는 눈금으로 쌓는 쪽이 같은 데이터를 더 정직하게 보여준다. 눈금으로
  // 정직하게 못 그리는 데이터(항목 8개 초과, 단위가 안 맞아 작은 값이 0칸이
  // 되는 경우 등)에는 RungBars 가 null 을 돌려주고, 아래 기존 막대가 받는다.
  const rungs = <RungBars title={props.title} description={props.description} rows={rows} unitLabel={props.unitLabel} />;
  if (planRungs(rows)) return rungs;

  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="my-12 rounded-3xl border border-border/40 bg-muted/20 p-8">
      {props.title && (
        <h3 className="mb-2 text-center text-sm font-bold uppercase tracking-[0.2em] text-primary/60">{props.title}</h3>
      )}
      {props.description && (
        <p
          className="mb-8 text-center text-sm leading-relaxed text-muted-foreground"
          dangerouslySetInnerHTML={md(props.description)}
        />
      )}
      <div className="flex h-[240px] w-full items-end gap-4 sm:gap-6">
        {rows.map((r, i) => (
          <div key={i} className="group flex h-full flex-1 flex-col items-center gap-4">
            <div className="flex w-full flex-1 items-end">
              <div
                className="group relative w-full rounded-xl opacity-80 shadow-lg shadow-primary/5 transition-all duration-500 group-hover:scale-x-105 group-hover:opacity-100"
                style={{ height: `${(r.value / max) * 100}%`, background: r.color || "var(--color-primary)" }}
              >
                <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[10px] font-bold text-background opacity-0 transition-opacity group-hover:opacity-100">
                  {r.value}
                </div>
              </div>
            </div>
            <span className="w-full truncate text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              {r.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── LecturePieChart ─────────────────────────────────────────────────────
// SVG 파이 대신 누적 막대 + 목록으로 그린다 — 조각 몇 개짜리 정적 데이터에서
// 각도 계산 오류 없이 항상 정확하고, 값도 함께 보여줄 수 있다.
export function LecturePieChart(props: any) {
  const rows = normalize(props);
  if (!rows.length) return null;
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;
  const palette = ["var(--color-primary)", "#f43f5e", "#f59e0b", "#0ea5e9", "#8b5cf6", "#10b981"];
  return (
    <div className="my-12 rounded-3xl border border-border/40 bg-muted/20 p-8">
      {props.title && (
        <h3 className="mb-2 text-center text-sm font-bold uppercase tracking-[0.2em] text-primary/60">{props.title}</h3>
      )}
      {props.description && (
        <p
          className="mb-8 text-center text-sm leading-relaxed text-muted-foreground"
          dangerouslySetInnerHTML={md(props.description)}
        />
      )}
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {rows.map((r, i) => (
          <div
            key={i}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${(r.value / total) * 100}%`, background: r.color || palette[i % palette.length] }}
          />
        ))}
      </div>
      <ul className="mt-5 flex flex-col gap-2 text-sm">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: r.color || palette[i % palette.length] }}
              />
              <span dangerouslySetInnerHTML={md(r.name)} />
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-foreground">
              {Math.round((r.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
