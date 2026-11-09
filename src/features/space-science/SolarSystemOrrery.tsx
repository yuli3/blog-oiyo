import { Component, Suspense, lazy, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Play from "lucide-react/dist/esm/icons/play";
import Pause from "lucide-react/dist/esm/icons/pause";
import CalendarDays from "lucide-react/dist/esm/icons/calendar-days";
import Orbit from "lucide-react/dist/esm/icons/orbit";
import { Body, Ecliptic, Elongation, GeoVector, HelioVector } from "astronomy-engine";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  LIGHT_SECONDS_PER_AU,
  PLANETS,
  PLANET_NAMES,
  asLocale,
  formatDate,
  formatDuration,
  fromDateInput,
  toDateInput,
  type PlanetId,
  type SpaceLocale,
} from "./data";
import type { SceneMoon, ScenePlanet } from "./OrreryScene";

const REFERENCE_DATE = "2026-01-01T12:00:00Z";

const OrreryScene = lazy(() => import("./OrreryScene"));

const COPY: Record<SpaceLocale, Record<string, string>> = {
  ko: {
    title: "날짜로 움직이는 태양계 3D",
    lead: "행성 위치는 천체력 계산(astronomy-engine)으로 고른 날짜의 실제 배치예요. 드래그해서 돌려 보고, 행성을 누르면 카메라가 날아가 가까이 보여 주고, 지구에서의 거리와 오늘 밤 보이는지 알려 줘요.",
    date: "날짜",
    today: "오늘",
    play: "시간 흐르게",
    pause: "멈춤",
    scale: "거리",
    compressed: "보기 편하게",
    trueScale: "실제 비율",
    note: "행성 크기는 보이도록 키웠어요. '보기 편하게'는 거리를 제곱근으로 줄였고, '실제 비율'은 태양에서의 거리를 그대로 썼어요.",
    pick: "행성을 누르면 자세한 정보가 나와요.",
    fromSun: "태양에서",
    fromEarth: "지구에서",
    light: "빛이 오는 데",
    period: "공전 주기",
    days: "일",
    years: "년",
    sky: "밤하늘",
    evening: "저녁 서쪽 하늘",
    morning: "새벽 동쪽 하늘",
    hidden: "태양에 너무 가까워 보기 어려움",
    elong: "태양과의 각거리",
    tonight: "이 날 맨눈으로 찾기 좋은 행성",
    none: "태양과 가까워 찾기 어려운 날이에요.",
    noWebgl: "이 기기에서는 3D를 표시할 수 없어요. 아래 표로 같은 정보를 볼 수 있어요.",
    loading: "3D 장면을 불러오는 중",
    tableCaption: "고른 날짜의 행성 위치 요약",
    name: "행성",
    overview: "전체 보기",
    credit: "행성 표면 이미지: Solar System Scope (CC BY 4.0, NASA 자료 기반). 달 위치는 실제 방향이고 거리는 줄였어요. 소행성대는 분포를 보여 주는 그림이에요.",
  },
  en: {
    title: "3D Solar System on Any Date",
    lead: "Planet positions are computed from an ephemeris (astronomy-engine) for the date you pick. Drag to rotate, and tap a planet to fly in for a close look and see its distance from Earth and whether it is up tonight.",
    date: "Date",
    today: "Today",
    play: "Run time",
    pause: "Pause",
    scale: "Distance",
    compressed: "Compressed",
    trueScale: "True scale",
    note: "Planet sizes are enlarged so you can see them. 'Compressed' shrinks distance with a square root; 'True scale' uses the real distance from the Sun.",
    pick: "Tap a planet for details.",
    fromSun: "From the Sun",
    fromEarth: "From Earth",
    light: "Light travel time",
    period: "Orbital period",
    days: "days",
    years: "years",
    sky: "Night sky",
    evening: "Evening, western sky",
    morning: "Before dawn, eastern sky",
    hidden: "Too close to the Sun to see",
    elong: "Angle from the Sun",
    tonight: "Naked-eye planets worth looking for on this date",
    none: "All bright planets are too close to the Sun on this date.",
    noWebgl: "3D is not available on this device. The table below has the same information.",
    loading: "Loading 3D scene",
    tableCaption: "Planet positions on the selected date",
    name: "Planet",
    overview: "Whole system",
    credit: "Planet surface maps: Solar System Scope (CC BY 4.0, based on NASA data). The Moon points in its true direction at a reduced distance; the asteroid belt is illustrative.",
  },
};

const NAKED_EYE: PlanetId[] = ["mercury", "venus", "mars", "jupiter", "saturn"];

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function SolarSystemOrrery({ locale: rawLocale }: { locale?: string }) {
  const locale = asLocale(rawLocale);
  const t = COPY[locale];
  const names = PLANET_NAMES[locale];
  // SSR renders a fixed reference date (identical on server and client); the reader's "today" is applied after hydration to avoid a mismatch.
  const [date, setDate] = useState(() => new Date(REFERENCE_DATE));
  useEffect(() => setDate(new Date()), []);
  const [running, setRunning] = useState(false);
  const [trueScale, setTrueScale] = useState(false);
  const [selected, setSelected] = useState<PlanetId | null>("earth");
  const [focus, setFocus] = useState<PlanetId | null>(null);
  const choose = (id: PlanetId) => {
    setSelected(id);
    setFocus(id);
  };
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const last = useRef<number | null>(null);

  useEffect(() => setWebgl(hasWebGL()), []);

  useEffect(() => {
    if (!running) {
      last.current = null;
      return;
    }
    let frame = 0;
    const tick = (now: number) => {
      if (last.current !== null) {
        const dtDays = ((now - last.current) / 1000) * 20; // 20 days per second
        setDate((d) => new Date(d.getTime() + dtDays * 86_400_000));
      }
      last.current = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  const planets: ScenePlanet[] = useMemo(
    () =>
      PLANETS.map((p) => {
        const v = HelioVector(p.body, date);
        const e = Ecliptic(v);
        return { id: p.id, elon: e.elon, elat: e.elat, r: Math.hypot(v.x, v.y, v.z) };
      }),
    [date],
  );

  const moon: SceneMoon = useMemo(() => {
    const e = Ecliptic(GeoVector(Body.Moon, date, true));
    return { elon: e.elon, elat: e.elat };
  }, [date]);

  const rows = useMemo(
    () =>
      PLANETS.map((p) => {
        const helio = planets.find((s) => s.id === p.id)?.r ?? p.aAu;
        if (p.id === "earth") return { p, helio, geo: 0, elong: null as null | { deg: number; vis: string } };
        const g = GeoVector(p.body, date, true);
        const geo = Math.hypot(g.x, g.y, g.z);
        const el = Elongation(p.body, date);
        return { p, helio, geo, elong: { deg: el.elongation, vis: el.visibility } };
      }),
    [planets, date],
  );

  const visible = rows.filter(
    (r) => r.elong && NAKED_EYE.includes(r.p.id) && r.elong.deg >= (r.p.id === "mercury" ? 18 : 15),
  );
  const sel = rows.find((r) => r.p.id === selected) ?? null;

  const skyText = (r: (typeof rows)[number]) => {
    if (!r.elong) return "";
    if (r.elong.deg < 15) return t.hidden;
    return r.elong.vis === "evening" ? t.evening : t.morning;
  };

  const fallbackTable = (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">{t.tableCaption}</caption>
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="py-2 pr-3 font-semibold">{t.name}</th>
            <th className="py-2 pr-3 font-semibold">{t.fromSun}</th>
            <th className="py-2 pr-3 font-semibold">{t.fromEarth}</th>
            <th className="py-2 font-semibold">{t.sky}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.p.id} className="border-b border-border">
              <td className="py-2 pr-3 font-medium text-foreground">{names[r.p.id]}</td>
              <td className="py-2 pr-3 font-mono text-muted-foreground">{r.helio.toFixed(2)} AU</td>
              <td className="py-2 pr-3 font-mono text-muted-foreground">{r.p.id === "earth" ? "—" : `${r.geo.toFixed(2)} AU`}</td>
              <td className="py-2 text-muted-foreground">{skyText(r) || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const loadingBox = (
    <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
      <Spinner />
      {t.loading}
    </div>
  );

  return (
    <section className="not-prose my-8 flex flex-col gap-5 rounded-xl bg-card p-4 text-sm text-card-foreground ring-1 ring-foreground/10 sm:p-6">
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-foreground">{t.title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{t.lead}</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
          {t.date}
          <input
            type="date"
            value={toDateInput(date)}
            onChange={(e) => {
              const d = fromDateInput(e.target.value);
              if (d) {
                setRunning(false);
                setDate(d);
              }
            }}
            className="min-h-11 rounded-lg border border-input bg-background px-3 text-base text-foreground"
          />
        </label>
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            setRunning(false);
            setDate(new Date());
          }}
        >
          <CalendarDays aria-hidden="true" />
          {t.today}
        </Button>
        <Button size="lg" aria-pressed={running} onClick={() => setRunning((r) => !r)}>
          {running ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          {running ? t.pause : t.play}
        </Button>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted-foreground">{t.scale}</span>
          <ToggleGroup
            type="single"
            variant="outline"
            value={trueScale ? "true" : "compressed"}
            onValueChange={(v) => v && setTrueScale(v === "true")}
            aria-label={t.scale}
          >
            <ToggleGroupItem value="compressed" size="lg">
              {t.compressed}
            </ToggleGroupItem>
            <ToggleGroupItem value="true" size="lg">
              {t.trueScale}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {webgl === false ? (
        <p className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">{t.noWebgl}</p>
      ) : (
        <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-muted sm:aspect-video">
          {webgl && (
            <SceneBoundary fallback={<p className="p-4 text-sm text-muted-foreground">{t.noWebgl}</p>}>
              <Suspense fallback={loadingBox}>
                <OrreryScene
                  planets={planets}
                  moon={moon}
                  names={names}
                  selected={selected}
                  focus={focus}
                  onSelect={choose}
                  trueScale={trueScale}
                />
              </Suspense>
            </SceneBoundary>
          )}
          {webgl && focus && (
            <Button variant="secondary" size="lg" className="absolute top-3 right-3" onClick={() => setFocus(null)}>
              <Orbit aria-hidden="true" />
              {t.overview}
            </Button>
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground">{t.note}</p>
      <p className="text-xs text-muted-foreground">{t.credit}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-muted p-4" aria-live="polite">
          {sel ? (
            <>
              <div className="mb-2 text-base font-bold text-foreground">
                {names[sel.p.id]} · {formatDate(date, locale)}
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <dt className="text-muted-foreground">{t.fromSun}</dt>
                <dd className="font-mono text-foreground">{sel.helio.toFixed(3)} AU</dd>
                {sel.p.id !== "earth" && (
                  <>
                    <dt className="text-muted-foreground">{t.fromEarth}</dt>
                    <dd className="font-mono text-foreground">{sel.geo.toFixed(3)} AU</dd>
                    <dt className="text-muted-foreground">{t.light}</dt>
                    <dd className="font-mono text-foreground">{formatDuration(sel.geo * LIGHT_SECONDS_PER_AU, locale)}</dd>
                    <dt className="text-muted-foreground">{t.elong}</dt>
                    <dd className="font-mono text-foreground">{sel.elong?.deg.toFixed(1)}°</dd>
                    <dt className="text-muted-foreground">{t.sky}</dt>
                    <dd className="text-foreground">{skyText(sel)}</dd>
                  </>
                )}
                <dt className="text-muted-foreground">{t.period}</dt>
                <dd className="font-mono text-foreground">
                  {sel.p.periodDays < 1000
                    ? `${sel.p.periodDays.toFixed(1)} ${t.days}`
                    : `${(sel.p.periodDays / 365.25).toFixed(1)} ${t.years}`}
                </dd>
              </dl>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t.pick}</p>
          )}
        </div>
        <div className="rounded-xl border border-border p-4">
          <div className="mb-2 text-sm font-bold text-foreground">{t.tonight}</div>
          {visible.length ? (
            <ul className="space-y-1 text-sm">
              {visible.map((r) => (
                <li key={r.p.id}>
                  <button
                    type="button"
                    onClick={() => choose(r.p.id)}
                    className="flex min-h-11 w-full items-center justify-between rounded-lg px-2 text-left hover:bg-muted"
                  >
                    <span className="font-medium text-foreground">{names[r.p.id]}</span>
                    <span className="text-xs text-muted-foreground">{skyText(r)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t.none}</p>
          )}
        </div>
      </div>

      <details className="rounded-xl border border-border p-4">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">{t.tableCaption}</summary>
        <div className="mt-3">{fallbackTable}</div>
      </details>
    </section>
  );
}

export default SolarSystemOrrery;
