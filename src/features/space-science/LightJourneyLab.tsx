import { useEffect, useMemo, useRef, useState } from "react";
import Play from "lucide-react/dist/esm/icons/play";
import Pause from "lucide-react/dist/esm/icons/pause";
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  AU_KM,
  LIGHT_SECONDS_PER_AU,
  PLANETS,
  PLANET_NAMES,
  SUN_RADIUS_KM,
  asLocale,
  formatDuration,
  SCENE,
  type SpaceLocale,
} from "./data";

const COPY: Record<SpaceLocale, Record<string, string>> = {
  ko: {
    title: "빛의 속도로 태양계 건너기",
    lead: "태양 표면을 떠난 빛이 행성에 닿는 순간을 실제 시간으로 따라가 보세요. 배속을 올리면 해왕성까지 가는 4시간을 몇 초로 줄일 수 있어요.",
    play: "출발",
    pause: "멈춤",
    reset: "처음으로",
    speed: "배속",
    scale: "거리 축척",
    linear: "실제 비율",
    log: "로그 비율",
    elapsed: "경과 시간",
    distance: "이동 거리",
    reached: "도착",
    arrives: "도착까지",
    sizeTitle: "같은 축척으로 본 크기",
    sizeLead: "태양 반지름을 100으로 놓으면 지구는 0.9, 목성은 10이에요. 왼쪽 큰 호가 태양의 가장자리입니다.",
    scrub: "시간 이동",
    linearNote: "실제 비율에서는 수성~화성이 왼쪽 5% 안에 몰려 있어요. 태양계 대부분이 빈 공간이라는 뜻이에요.",
    logNote: "로그 비율은 거리가 10배 늘 때마다 같은 간격을 줘서 안쪽 행성을 구분해 보기 쉽게 만든 그림이에요.",
    km: "만 km",
    inner: "수성~화성",
  },
  en: {
    title: "Cross the Solar System at the Speed of Light",
    lead: "Follow light leaving the Sun's surface in real time and watch it reach each planet. Speed it up to squeeze the four-hour trip to Neptune into seconds.",
    play: "Start",
    pause: "Pause",
    reset: "Reset",
    speed: "Speed",
    scale: "Distance scale",
    linear: "True scale",
    log: "Log scale",
    elapsed: "Elapsed",
    distance: "Distance travelled",
    reached: "Reached",
    arrives: "Arrives in",
    sizeTitle: "Sizes on one scale",
    sizeLead: "If the Sun's radius is 100, Earth is 0.9 and Jupiter is 10. The large arc on the left is the edge of the Sun.",
    scrub: "Scrub time",
    linearNote: "On the true scale Mercury to Mars sit in the first 5% of the track. Most of the Solar System is empty space.",
    logNote: "The log scale gives each tenfold step in distance the same width, so the inner planets are easier to tell apart.",
    km: "million km",
    inner: "Mercury–Mars",
  },
};

const SPEEDS = [1, 60, 600, 3600] as const;
const TRACK_X0 = 40;
const TRACK_X1 = 980;
const MAX_AU = 30.5;
const MIN_LOG_AU = 0.3;
const TOTAL_SECONDS = MAX_AU * LIGHT_SECONDS_PER_AU;

function auToX(au: number, mode: "linear" | "log"): number {
  if (mode === "linear") return TRACK_X0 + (au / MAX_AU) * (TRACK_X1 - TRACK_X0);
  const clamped = Math.max(MIN_LOG_AU, au);
  const t = Math.log10(clamped / MIN_LOG_AU) / Math.log10(MAX_AU / MIN_LOG_AU);
  return TRACK_X0 + t * (TRACK_X1 - TRACK_X0);
}

export function LightJourneyLab({ locale: rawLocale }: { locale?: string }) {
  const locale = asLocale(rawLocale);
  const t = COPY[locale];
  const names = PLANET_NAMES[locale];
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<number>(600);
  const [mode, setMode] = useState<"linear" | "log">("linear");
  const last = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      last.current = null;
      return;
    }
    let frame = 0;
    const tick = (now: number) => {
      if (last.current !== null) {
        const dt = (now - last.current) / 1000;
        setSeconds((s) => {
          const next = s + dt * speed;
          if (next >= TOTAL_SECONDS) {
            setRunning(false);
            return TOTAL_SECONDS;
          }
          return next;
        });
      }
      last.current = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, speed]);

  const au = seconds / LIGHT_SECONDS_PER_AU;
  const pulseX = auToX(au, mode);
  const reachedCount = PLANETS.filter((p) => au >= p.aAu).length;

  const sizeCircles = useMemo(() => {
    // Sun radius = 100 units → Jupiter ≈ 10, Earth ≈ 0.92. Render ×4 so small planets stay visible.
    const k = 4 * (100 / SUN_RADIUS_KM);
    let x = 70;
    return PLANETS.map((p) => {
      const r = Math.max(p.radiusKm * k, 1.2);
      const ring = p.id === "saturn" ? r * 1.2 : 0;
      x += r + ring + 34;
      const cx = x;
      x += r + ring;
      return { p, r, cx };
    });
  }, []);

  const toggleRun = () => {
    if (seconds >= TOTAL_SECONDS) setSeconds(0);
    setRunning((r) => !r);
  };

  return (
    <section className="not-prose my-8 flex flex-col gap-5 rounded-xl bg-card p-4 text-sm text-card-foreground ring-1 ring-foreground/10 sm:p-6">
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-foreground">{t.title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{t.lead}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={toggleRun} aria-pressed={running} size="lg">
          {running ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          {running ? t.pause : t.play}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            setRunning(false);
            setSeconds(0);
          }}
        >
          <RotateCcw aria-hidden="true" />
          {t.reset}
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">{t.speed}</span>
          <ToggleGroup
            type="single"
            variant="outline"
            value={String(speed)}
            onValueChange={(v) => v && setSpeed(Number(v))}
            aria-label={t.speed}
          >
            {SPEEDS.map((s) => (
              <ToggleGroupItem key={s} value={String(s)} size="lg">
                ×{s.toLocaleString()}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">{t.scale}</span>
          <ToggleGroup
            type="single"
            variant="outline"
            value={mode}
            onValueChange={(v) => v && setMode(v as "linear" | "log")}
            aria-label={t.scale}
          >
            <ToggleGroupItem value="linear" size="lg">
              {t.linear}
            </ToggleGroupItem>
            <ToggleGroupItem value="log" size="lg">
              {t.log}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <svg viewBox="0 0 1000 170" className="block h-auto w-full " role="img" aria-label={t.title}>
          <rect width={1000} height={170} fill={SCENE.space} />
          <circle cx={0} cy={85} r={36} fill={SCENE.sun} />
          <circle cx={0} cy={85} r={48} fill={SCENE.sun} opacity={0.18} />
          <line x1={TRACK_X0} x2={TRACK_X1} y1={85} y2={85} stroke={SCENE.orbit} strokeWidth={1} strokeDasharray="3 6" />
          {PLANETS.map((p, i) => {
            const x = auToX(p.aAu, mode);
            const hit = au >= p.aAu;
            const labelY = i % 2 === 0 ? 50 : 132;
            // On the true scale the four rocky planets sit within ~50px; one shared label replaces theirs.
            const grouped = mode === "linear" && p.kind === "rocky";
            return (
              <g key={p.id}>
                {!grouped && <line x1={x} x2={x} y1={labelY < 85 ? 56 : 114} y2={85} stroke={SCENE.orbit} strokeWidth={1} />}
                <circle cx={x} cy={85} r={p.kind === "giant" ? 7 : 4.5} fill={p.color} stroke={hit ? SCENE.highlight : "none"} strokeWidth={2} />
                {!grouped && (
                  <text x={x} y={labelY} textAnchor="middle" fontSize={14} fill={hit ? SCENE.highlight : SCENE.label}>
                    {names[p.id]}
                  </text>
                )}
              </g>
            );
          })}
          {mode === "linear" && (
            <g>
              <line x1={auToX(0.387, mode)} x2={auToX(1.524, mode)} y1={64} y2={64} stroke={SCENE.label} strokeWidth={1} />
              <line x1={auToX(1, mode)} x2={auToX(1, mode)} y1={64} y2={76} stroke={SCENE.label} strokeWidth={1} />
              <text x={auToX(0.387, mode)} y={52} fontSize={14} fill={au >= 1.524 ? SCENE.highlight : SCENE.label}>
                {t.inner}
              </text>
            </g>
          )}
          <circle cx={pulseX} cy={85} r={5} fill={SCENE.sunlight} />
          <circle cx={pulseX} cy={85} r={12} fill={SCENE.sunlight} opacity={0.25} />
        </svg>
      </div>
      <p className="text-xs text-muted-foreground">{mode === "linear" ? t.linearNote : t.logNote}</p>

      <label className="flex flex-col gap-2 text-xs font-semibold text-muted-foreground">
        {t.scrub}
        <input
          type="range"
          min={0}
          max={Math.round(TOTAL_SECONDS)}
          value={Math.round(seconds)}
          onChange={(e) => {
            setRunning(false);
            setSeconds(Number(e.target.value));
          }}
          className="h-11 w-full accent-primary"
        />
      </label>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-live="polite">
        <div className="rounded-lg border border-border bg-muted p-3">
          <div className="text-xs text-muted-foreground">{t.elapsed}</div>
          <div className="font-mono text-lg font-bold text-foreground">{formatDuration(seconds, locale)}</div>
        </div>
        <div className="rounded-lg border border-border bg-muted p-3">
          <div className="text-xs text-muted-foreground">{t.distance}</div>
          <div className="font-mono text-lg font-bold text-foreground">
            {((au * AU_KM) / 1e6).toLocaleString(locale === "ko" ? "ko-KR" : "en-US", { maximumFractionDigits: 0 })} {locale === "ko" ? "백만 km" : t.km}
          </div>
        </div>
        <div className="col-span-2 rounded-lg border border-border bg-muted p-3 sm:col-span-1">
          <div className="text-xs text-muted-foreground">{t.reached}</div>
          <div className="font-mono text-lg font-bold text-foreground">
            {reachedCount} / {PLANETS.length}
          </div>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {PLANETS.map((p) => {
          const arrival = p.aAu * LIGHT_SECONDS_PER_AU;
          const hit = seconds >= arrival;
          return (
            <li key={p.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span className={hit ? "font-semibold text-foreground" : "text-muted-foreground"}>{names[p.id]}</span>
              <span className="font-mono text-xs text-muted-foreground">{formatDuration(arrival, locale)}</span>
            </li>
          );
        })}
      </ul>

      <div className="space-y-2 border-t border-border pt-4">
        <h4 className="text-sm font-bold text-foreground">{t.sizeTitle}</h4>
        <p className="text-xs text-muted-foreground">{t.sizeLead}</p>
        <div className="overflow-x-auto rounded-xl border border-border">
          <svg viewBox="0 0 1000 140" className="block h-auto w-full min-w-xl " role="img" aria-label={t.sizeTitle}>
            <rect width={1000} height={140} fill={SCENE.space} />
            <circle cx={-330} cy={70} r={400} fill={SCENE.sun} />
            {sizeCircles.map(({ p, r, cx }) => (
              <g key={p.id}>
                {p.id === "saturn" && (
                  <ellipse cx={cx} cy={70} rx={r * 2.1} ry={r * 0.5} fill="none" stroke={SCENE.ring} strokeWidth={2} />
                )}
                <circle cx={cx} cy={70} r={r} fill={p.color} />
                <text x={cx} y={128} textAnchor="middle" fontSize={13} fill={SCENE.label}>
                  {names[p.id]}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}

export default LightJourneyLab;
