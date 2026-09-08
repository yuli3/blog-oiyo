import React, { useId } from 'react';

/**
 * 밤 사이 수면 단계 곡선. 숫자 세 줄로는 성립하지 않는 설명을 그림이 진다 —
 * "주기 사이에서 깨라"는 조언은 주기가 오르내리는 모양을 봐야 이해된다.
 *
 * three.js 를 쓰지 않는다. blog 는 three 의존성이 없고, 이 한 화면을 위해
 * 넣으면 ~600KB 가 늘어난다. 2026-08-28 에 recharts 청크 617KB 가 height-converter
 * 로 새던 사고를 고친 repo다. SVG 로 충분한 그림에 번들을 얹지 않는다.
 *
 * 애니메이션이 없으므로 reduced-motion 계약이 자동으로 지켜진다.
 */

type Props = {
    /** 취침 시각(분, 0=자정 기준 하루 안). 곡선의 시작점 */
    startMinutes: number;
    /** 권장 기상 시각들 — 주기 경계. 세로선으로 표시한다 */
    wakeMarks: { cycles: number; minutes: number; label: string }[];
    cycleMinutes: number;
    title: string;
    hint: string;
    legend: { deep: string; rem: string; wake: string };
};

const W = 720;
const H = 210;
const PAD_X = 34;
const PAD_TOP = 18;
const PAD_BOTTOM = 34;

/** 한 주기 안의 깊이 곡선. 0 = 얕음(깨기 좋음), 1 = 깊음. */
function depthAt(t: number): number {
    // 주기 초반에 깊은 잠으로 내려갔다가 후반 렘에서 얕아진다.
    const eased = Math.sin(Math.PI * Math.min(Math.max(t, 0), 1));
    return Math.pow(eased, 1.5);
}

export default function SleepCycleChart({
    startMinutes, wakeMarks, cycleMinutes, title, hint, legend,
}: Props) {
    const uid = useId().replace(/:/g, '');
    const last = wakeMarks[wakeMarks.length - 1];
    if (!last) return null;

    const totalMinutes = last.minutes - startMinutes;
    if (totalMinutes <= 0) return null;

    const x = (m: number) => PAD_X + ((m - startMinutes) / totalMinutes) * (W - PAD_X * 2);
    const y = (depth: number) => PAD_TOP + depth * (H - PAD_TOP - PAD_BOTTOM);

    // 곡선을 5분 간격으로 샘플링한다. 주기 경계에서 깊이가 0이 되도록 위상을 맞춘다.
    const points: string[] = [];
    for (let m = startMinutes; m <= last.minutes; m += 5) {
        const phase = ((m - startMinutes) % cycleMinutes) / cycleMinutes;
        points.push(`${x(m).toFixed(1)},${y(depthAt(phase)).toFixed(1)}`);
    }
    const line = points.join(' ');
    const area = `${PAD_X},${y(0)} ${line} ${x(last.minutes).toFixed(1)},${y(0)}`;

    return (
        <section className="mt-6" aria-labelledby={`${uid}-title`}>
            <h3 id={`${uid}-title`} className="text-sm font-bold text-gray-900">{title}</h3>
            <p className="mt-1 text-xs leading-5 text-gray-600">{hint}</p>

            <div className="mt-3 overflow-x-auto">
                <svg
                    viewBox={`0 0 ${W} ${H}`}
                    className="min-w-[520px] w-full h-auto"
                    role="img"
                    aria-label={`${title}. ${hint}`}
                >
                    <defs>
                        <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#65a30d" stopOpacity="0.06" />
                            <stop offset="100%" stopColor="#365314" stopOpacity="0.24" />
                        </linearGradient>
                    </defs>

                    {/* 얕은 잠 기준선 — 깨기 좋은 높이 */}
                    <line x1={PAD_X} y1={y(0)} x2={W - PAD_X} y2={y(0)} stroke="#d6d3d1" strokeWidth="1" strokeDasharray="4 4" />

                    <polygon points={area} fill={`url(#${uid}-fill)`} />
                    <polyline points={line} fill="none" stroke="#4d7c0f" strokeWidth="2.5" strokeLinejoin="round" />

                    {wakeMarks.map((mark) => (
                        <g key={mark.cycles}>
                            <line
                                x1={x(mark.minutes)} y1={PAD_TOP - 6}
                                x2={x(mark.minutes)} y2={y(0) + 6}
                                stroke="#a16207" strokeWidth="1.5" strokeDasharray="3 3"
                            />
                            <circle cx={x(mark.minutes)} cy={y(0)} r="4.5" fill="#a16207" />
                            <text
                                x={x(mark.minutes)} y={H - 14}
                                textAnchor="middle" fontSize="13" fontWeight="700" fill="#3f3f46"
                            >
                                {mark.label}
                            </text>
                            <text
                                x={x(mark.minutes)} y={PAD_TOP - 8}
                                textAnchor="middle" fontSize="11" fill="#a16207"
                            >
                                {mark.cycles}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>

            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-600">
                <li className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-4 rounded-sm" style={{ background: '#365314' }} aria-hidden="true" />
                    {legend.deep}
                </li>
                <li className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-4 rounded-sm border border-dashed border-stone-400" aria-hidden="true" />
                    {legend.wake}
                </li>
            </ul>
        </section>
    );
}
