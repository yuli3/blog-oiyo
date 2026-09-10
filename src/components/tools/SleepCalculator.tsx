import React, { useState } from 'react';
import { GameContainer } from '@/components/ui/game/GamePrimitives';
import SleepCycleChart from './SleepCycleChart';

type Mode = 'bedtime' | 'wakeup';
type Chronotype = 'early' | 'normal' | 'late';

const CYCLE_MINUTES = 90;
const FALL_ASLEEP_MINUTES = 14;

const formatTime = (totalMinutes: number): string => {
    const normalized = ((totalMinutes % 1440) + 1440) % 1440;
    const h = Math.floor(normalized / 60);
    const m = normalized % 60;
    const hStr = h.toString().padStart(2, '0');
    const mStr = m.toString().padStart(2, '0');
    return `${hStr}:${mStr}`;
};

const timeToMinutes = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
};

type Lang = 'ko' | 'en' | 'ja' | 'fr' | 'es' | 'zh';

interface Copy {
    title: string; subtitle: string; desc: string;
    mode: string; modeBedtime: string; modeWakeup: string;
    bedtime: string; wakeup: string; results: string; cycles: string; hours: string;
    chronotype: string; early: string; normal: string; late: string;
    chronotypeAdvice: Record<Chronotype, string>;
    chronotypeShort: Record<Chronotype, string>;
    sleepDebt: string; actualSleep: string; debtResult: string; none: string; fallAsleep: string;
    cycleTitle: string; cycleHint: string; cycleLegendDeep: string; cycleLegendRem: string; cycleLegendWake: string;
}

// The page ranked for French queries while this widget rendered in English —
// a locale gap that cost the one asset with measured demand outside ko/en.
const COPY: Record<Lang, Copy> = {
    ko: {
        title: '수면 계산기', subtitle: '최적 수면 시간',
        desc: '90분 수면 주기를 기반으로 최적의 기상 시간 또는 취침 시간을 계산합니다.',
        mode: '계산 방향', modeBedtime: '취침 → 기상', modeWakeup: '기상 → 취침',
        bedtime: '취침 시각', wakeup: '기상 시각', results: '권장 시각 (수면 주기 기준)', cycles: '주기', hours: '시간',
        chronotype: '수면 유형 (크로노타입)', early: '아침형 (5–7시 기상)', normal: '중간형 (7–9시 기상)', late: '저녁형 (9시+ 기상)',
        chronotypeAdvice: {
            early: '아침형: 21–22시 취침, 05–06시 기상이 최적입니다.',
            normal: '중간형: 22–23시 취침, 07–08시 기상이 최적입니다.',
            late: '저녁형: 00–01시 취침, 08–09시 기상이 최적입니다.',
        },
        chronotypeShort: { early: '아침형', normal: '중간형', late: '저녁형' },
        sleepDebt: '수면 부채 계산기', actualSleep: '어젯밤 실제 수면 시간 (시간)', debtResult: '수면 부채', none: '없음',
        fallAsleep: '잠들기까지 약 14분 소요 포함',
        cycleTitle: '밤 사이 주기', cycleHint: '주기 사이(얕은 잠)에서 깨면 같은 시간을 자도 덜 피곤합니다. 세로선이 권장 기상 시각입니다.',
        cycleLegendDeep: '깊은 잠', cycleLegendRem: '렘', cycleLegendWake: '얕은 잠 · 깨기 좋은 지점',
    },
    en: {
        title: 'Sleep Calculator', subtitle: 'Optimal Sleep',
        desc: 'Calculate optimal wake-up or bedtime based on 90-minute sleep cycles.',
        mode: 'Mode', modeBedtime: 'Bedtime → Wake up', modeWakeup: 'Wake up → Bedtime',
        bedtime: 'Bedtime', wakeup: 'Wake-up Time', results: 'Recommended Times (by cycle)', cycles: 'cycles', hours: 'h',
        chronotype: 'Chronotype', early: 'Morning (5–7am wake)', normal: 'Intermediate (7–9am wake)', late: 'Evening (9am+ wake)',
        chronotypeAdvice: {
            early: 'Morning type: Aim for 9–10pm bedtime, 5–6am wake.',
            normal: 'Intermediate: Aim for 10–11pm bedtime, 7–8am wake.',
            late: 'Evening type: Aim for midnight–1am bedtime, 8–9am wake.',
        },
        chronotypeShort: { early: 'Morning', normal: 'Intermediate', late: 'Evening' },
        sleepDebt: 'Sleep Debt Calculator', actualSleep: 'Last night actual sleep (hours)', debtResult: 'Sleep Debt', none: 'None',
        fallAsleep: 'Includes ~14 min to fall asleep',
        cycleTitle: 'Cycles through the night',
        cycleHint: 'Waking between cycles, in light sleep, feels better than waking mid-cycle on the same total sleep. The vertical lines are the recommended wake times.',
        cycleLegendDeep: 'Deep', cycleLegendRem: 'REM', cycleLegendWake: 'Light · good place to wake',
    },
    ja: {
        title: '睡眠計算機', subtitle: '最適な睡眠時間',
        desc: '90分の睡眠サイクルをもとに、最適な起床時刻または就寝時刻を計算します。',
        mode: '計算方向', modeBedtime: '就寝 → 起床', modeWakeup: '起床 → 就寝',
        bedtime: '就寝時刻', wakeup: '起床時刻', results: '推奨時刻（睡眠サイクル基準）', cycles: 'サイクル', hours: '時間',
        chronotype: '睡眠タイプ（クロノタイプ）', early: '朝型（5–7時起床）', normal: '中間型（7–9時起床）', late: '夜型（9時以降起床）',
        chronotypeAdvice: {
            early: '朝型：21–22時就寝、05–06時起床が最適です。',
            normal: '中間型：22–23時就寝、07–08時起床が最適です。',
            late: '夜型：00–01時就寝、08–09時起床が最適です。',
        },
        chronotypeShort: { early: '朝型', normal: '中間型', late: '夜型' },
        sleepDebt: '睡眠負債の計算', actualSleep: '昨夜の実際の睡眠時間（時間）', debtResult: '睡眠負債', none: 'なし',
        fallAsleep: '寝つくまで約14分を含みます',
        cycleTitle: '一晩のサイクル',
        cycleHint: '同じ睡眠時間でも、サイクルの切れ目（浅い眠り）で起きるほうが楽です。縦線が推奨起床時刻です。',
        cycleLegendDeep: '深い眠り', cycleLegendRem: 'レム', cycleLegendWake: '浅い眠り・起きやすい',
    },
    fr: {
        title: 'Calculateur de sommeil', subtitle: 'Sommeil optimal',
        desc: 'Calculez l’heure de réveil ou de coucher optimale à partir des cycles de sommeil de 90 minutes.',
        mode: 'Sens du calcul', modeBedtime: 'Coucher → Réveil', modeWakeup: 'Réveil → Coucher',
        bedtime: 'Heure du coucher', wakeup: 'Heure du réveil', results: 'Heures recommandées (par cycle)', cycles: 'cycles', hours: 'h',
        chronotype: 'Chronotype', early: 'Matinal (réveil 5–7 h)', normal: 'Intermédiaire (réveil 7–9 h)', late: 'Tardif (réveil après 9 h)',
        chronotypeAdvice: {
            early: 'Type matinal : couchez-vous entre 21 h et 22 h, réveil entre 5 h et 6 h.',
            normal: 'Type intermédiaire : couchez-vous entre 22 h et 23 h, réveil entre 7 h et 8 h.',
            late: 'Type tardif : couchez-vous entre minuit et 1 h, réveil entre 8 h et 9 h.',
        },
        chronotypeShort: { early: 'Matinal', normal: 'Intermédiaire', late: 'Tardif' },
        sleepDebt: 'Dette de sommeil', actualSleep: 'Sommeil réel la nuit dernière (heures)', debtResult: 'Dette de sommeil', none: 'Aucune',
        fallAsleep: 'Inclut environ 14 min pour s’endormir',
        cycleTitle: 'Les cycles de la nuit',
        cycleHint: 'Se réveiller entre deux cycles, en sommeil léger, est plus confortable qu’au milieu d’un cycle à durée égale. Les lignes verticales sont les heures de réveil recommandées.',
        cycleLegendDeep: 'Sommeil profond', cycleLegendRem: 'Paradoxal', cycleLegendWake: 'Sommeil léger · bon moment pour se réveiller',
    },
    es: {
        title: 'Calculadora de sueño', subtitle: 'Sueño óptimo',
        desc: 'Calcula la hora ideal para despertarte o acostarte según los ciclos de sueño de 90 minutos.',
        mode: 'Dirección del cálculo', modeBedtime: 'Acostarse → Despertar', modeWakeup: 'Despertar → Acostarse',
        bedtime: 'Hora de acostarse', wakeup: 'Hora de despertar', results: 'Horas recomendadas (por ciclo)', cycles: 'ciclos', hours: 'h',
        chronotype: 'Cronotipo', early: 'Matutino (despertar 5–7 h)', normal: 'Intermedio (despertar 7–9 h)', late: 'Vespertino (despertar tras las 9 h)',
        chronotypeAdvice: {
            early: 'Tipo matutino: acuéstate entre las 21 y las 22 h y despierta entre las 5 y las 6 h.',
            normal: 'Tipo intermedio: acuéstate entre las 22 y las 23 h y despierta entre las 7 y las 8 h.',
            late: 'Tipo vespertino: acuéstate entre medianoche y la 1 h y despierta entre las 8 y las 9 h.',
        },
        chronotypeShort: { early: 'Matutino', normal: 'Intermedio', late: 'Vespertino' },
        sleepDebt: 'Deuda de sueño', actualSleep: 'Sueño real de anoche (horas)', debtResult: 'Deuda de sueño', none: 'Ninguna',
        fallAsleep: 'Incluye unos 14 min para conciliar el sueño',
        cycleTitle: 'Los ciclos de la noche',
        cycleHint: 'Despertarse entre ciclos, en sueño ligero, sienta mejor que hacerlo a mitad de ciclo con las mismas horas dormidas. Las líneas verticales son las horas recomendadas.',
        cycleLegendDeep: 'Sueño profundo', cycleLegendRem: 'REM', cycleLegendWake: 'Sueño ligero · buen momento para despertar',
    },
    zh: {
        title: '睡眠计算器', subtitle: '最佳睡眠时间',
        desc: '根据90分钟睡眠周期计算最佳的起床或就寝时间。',
        mode: '计算方向', modeBedtime: '就寝 → 起床', modeWakeup: '起床 → 就寝',
        bedtime: '就寝时间', wakeup: '起床时间', results: '推荐时间（按睡眠周期）', cycles: '周期', hours: '小时',
        chronotype: '睡眠类型（生理时钟）', early: '早睡型（5–7点起床）', normal: '中间型（7–9点起床）', late: '晚睡型（9点后起床）',
        chronotypeAdvice: {
            early: '早睡型：21–22点就寝、05–06点起床最合适。',
            normal: '中间型：22–23点就寝、07–08点起床最合适。',
            late: '晚睡型：00–01点就寝、08–09点起床最合适。',
        },
        chronotypeShort: { early: '早睡型', normal: '中间型', late: '晚睡型' },
        sleepDebt: '睡眠负债计算', actualSleep: '昨晚实际睡眠时间（小时）', debtResult: '睡眠负债', none: '无',
        fallAsleep: '已包含约14分钟入睡时间',
        cycleTitle: '一夜的周期',
        cycleHint: '在周期之间的浅睡阶段醒来，比在周期中途醒来更轻松，即使睡眠总时长相同。竖线为推荐起床时间。',
        cycleLegendDeep: '深睡', cycleLegendRem: '快速动眼', cycleLegendWake: '浅睡 · 适合醒来',
    },
};

const SleepCalculator: React.FC<{ locale?: Lang }> = ({ locale = 'ko' }) => {

    const t = COPY[locale] ?? COPY.en;

    type State = {
        mode: Mode;
        time: string;
        chronotype: Chronotype;
        actualSleep: number;
    };

    const [state, setState] = useState<State>({
        mode: 'bedtime',
        time: '23:00',
        chronotype: 'normal',
        actualSleep: 7,
    });

    const { mode, time, chronotype, actualSleep } = state;

    const baseMinutes = timeToMinutes(time);

    // 5 cycles (7.5h), 6 cycles (9h), 7 cycles (10.5h)
    const cycleCounts = [5, 6, 7];
    const results = cycleCounts.map(cycles => {
        const durationMinutes = cycles * CYCLE_MINUTES;
        let targetMinutes: number;
        if (mode === 'bedtime') {
            // bedtime → wake up: add duration + fall asleep time
            targetMinutes = baseMinutes + FALL_ASLEEP_MINUTES + durationMinutes;
        } else {
            // wakeup → bedtime: subtract duration + fall asleep time
            targetMinutes = baseMinutes - FALL_ASLEEP_MINUTES - durationMinutes;
        }
        return {
            cycles,
            hours: durationMinutes / 60,
            time: formatTime(targetMinutes),
            // 그래프는 '잠든 시각 -> 기상 시각'을 그리므로 자정을 넘어도 단조 증가해야 한다.
            // formatTime 은 하루로 감싸지만 여기서는 감싸지 않은 값을 쓴다.
            wakeMinutes: baseMinutes + FALL_ASLEEP_MINUTES + durationMinutes,
        };
    });

    // 그래프는 bedtime 모드에서만 그린다. wakeup 모드의 출력은 '기상 시각'이 아니라
    // 세 개의 취침 시각이라 주기 곡선의 세로선과 대응하지 않는다 — 세 마크가 같은
    // 기상점에 겹쳐 그래프가 거짓이 된다. 대응하지 않는 그림은 그리지 않는다.
    const chartStart = baseMinutes + FALL_ASLEEP_MINUTES;

    const idealHours = 8;
    const debtHours = Math.max(0, idealHours - actualSleep);

    const handleReset = () => setState({ mode: 'bedtime', time: '23:00', chronotype: 'normal', actualSleep: 7 });

    return (
        <GameContainer title={t.title} subtitle={t.subtitle} onReset={handleReset}>
            <div className="flex flex-col gap-5 sm:gap-8">
                <p className="text-sm font-medium text-muted-foreground text-center">{t.desc}</p>

                <div className="flex gap-2 p-1 bg-muted rounded-xl">
                    <button
                        type="button"
                        onClick={() => setState(prev => ({ ...prev, mode: 'bedtime' }))}
                        className={`flex-1 py-2 rounded-lg font-black text-xs transition-colors ${state.mode === 'bedtime' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
                        aria-pressed={state.mode === 'bedtime'}
                    >{t.modeBedtime}</button>
                    <button
                        type="button"
                        onClick={() => setState(prev => ({ ...prev, mode: 'wakeup' }))}
                        className={`flex-1 py-2 rounded-lg font-black text-xs transition-colors ${state.mode === 'wakeup' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
                        aria-pressed={state.mode === 'wakeup'}
                    >{t.modeWakeup}</button>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase">
                        {mode === 'bedtime' ? t.bedtime : t.wakeup}
                    </label>
                    <input
                        type="time"
                        value={state.time}
                        onChange={e => setState(prev => ({ ...prev, time: e.target.value }))}
                        className="w-full p-3 bg-muted/30 rounded-2xl border border-border font-black text-sm"
                        aria-label={mode === 'bedtime' ? t.bedtime : t.wakeup}
                    />
                </div>

                <div className="p-4 sm:p-6 bg-foreground rounded-[32px] text-background flex flex-col gap-4 shadow-2xl">
                    <p className="text-[10px] font-black text-background/60 uppercase tracking-widest text-center">{t.results}</p>
                    <div className="grid grid-cols-3 gap-3">
                        {results.map(r => (
                            <div key={r.cycles} className="text-center p-3 bg-foreground/60 rounded-2xl">
                                <p className="text-[9px] font-black text-background/60 uppercase">{r.cycles} {t.cycles}</p>
                                <p className="text-2xl font-black text-primary mt-1">{r.time}</p>
                                <p className="text-[10px] text-background/50 font-bold">{r.hours}{t.hours}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-background/50 text-center">{t.fallAsleep}</p>
                </div>

                {mode === 'bedtime' && <SleepCycleChart
                    startMinutes={chartStart}
                    wakeMarks={results.map(r => ({ cycles: r.cycles, minutes: r.wakeMinutes, label: r.time }))}
                    cycleMinutes={CYCLE_MINUTES}
                    title={t.cycleTitle}
                    hint={t.cycleHint}
                    legend={{ deep: t.cycleLegendDeep, rem: t.cycleLegendRem, wake: t.cycleLegendWake }}
                />}

                <div className="space-y-3">
                    <p className="text-[10px] font-black text-muted-foreground uppercase">{t.chronotype}</p>
                    <div className="grid grid-cols-3 gap-2">
                        {(['early', 'normal', 'late'] as Chronotype[]).map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setState(prev => ({ ...prev, chronotype: type }))}
                                className={`py-2 px-1 rounded-xl text-[11px] font-black transition-colors ${state.chronotype === type ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                                aria-pressed={state.chronotype === type}
                            >
                                {t.chronotypeShort[type]}
                            </button>
                        ))}
                    </div>
                    <p className="text-sm text-muted-foreground font-medium p-3 bg-muted/40 rounded-2xl">
                        {t.chronotypeAdvice[chronotype]}
                    </p>
                </div>

                <div className="space-y-3 p-5 bg-muted/30 rounded-2xl border border-border">
                    <p className="text-[10px] font-black text-muted-foreground uppercase">{t.sleepDebt}</p>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-foreground">{t.actualSleep}</label>
                        <input
                            type="number"
                            value={state.actualSleep}
                            onChange={e => setState(prev => ({ ...prev, actualSleep: Number(e.target.value) }))}
                            className="w-full p-3 bg-background rounded-2xl border border-border font-black text-sm"
                            aria-label={t.actualSleep}
                            min={0}
                            max={24}
                            step={0.5}
                        />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-black text-muted-foreground">{t.debtResult}</span>
                        <span className={`text-xl font-black ${debtHours > 0 ? 'text-destructive' : 'text-success'}`}>
                            {debtHours > 0 ? `-${debtHours.toFixed(1)}h` : t.none}
                        </span>
                    </div>
                </div>
            </div>
        </GameContainer>
    );
};

export default SleepCalculator;
