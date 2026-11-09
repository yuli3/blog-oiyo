import { useEffect, useMemo, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { asLocale, type SpaceLocale } from "./data";

// Simplified insolation model (circular orbit, top of atmosphere).
// Daily mean insolation: Q = (S0/π)(H0 sinφ sinδ + cosφ cosδ sinH0), S0 = 1361 W/m².
// Sunrise uses the standard -0.833° altitude (refraction + solar radius).
const S0 = 1361;
const EARTH_TILT = 23.44;
const RAD = Math.PI / 180;

const COPY: Record<SpaceLocale, Record<string, string>> = {
  ko: {
    title: "자전축 기울기와 계절 시뮬레이터",
    lead: "자전축 기울기, 위도, 날짜를 바꾸며 낮의 길이와 한낮의 해 높이, 땅에 닿는 햇빛 에너지가 어떻게 달라지는지 확인해 보세요. 기울기를 0°로 만들면 계절이 사라져요.",
    tilt: "자전축 기울기",
    lat: "위도",
    day: "날짜",
    dayLen: "낮의 길이",
    noon: "한낮 해의 고도",
    insol: "하루 평균 햇빛 에너지(대기 위)",
    decl: "태양의 적위",
    polarDay: "백야(해가 지지 않음)",
    polarNight: "극야(해가 뜨지 않음)",
    chart: "1년 동안 낮의 길이",
    chartLegendNow: "선택한 기울기",
    chartLegendEarth: "지구(23.4°)",
    hours: "시간",
    presets: "기울기 예시",
    earth: "지구",
    none: "기울기 0°",
    mars: "화성",
    uranus: "천왕성",
    note: "원 궤도를 가정한 단순 모형이에요. 실제로는 1월 초에 지구가 태양에 가장 가깝지만(근일점), 그 차이(약 7%)보다 기울기 효과가 훨씬 커요.",
    north: "북위",
    south: "남위",
    months: "1,2,3,4,5,6,7,8,9,10,11,12",
  },
  en: {
    title: "Axial Tilt and Seasons Simulator",
    lead: "Change the axial tilt, latitude and date to see how day length, the Sun's noon altitude and incoming sunlight change. Set the tilt to 0° and the seasons disappear.",
    tilt: "Axial tilt",
    lat: "Latitude",
    day: "Date",
    dayLen: "Day length",
    noon: "Noon Sun altitude",
    insol: "Daily mean sunlight (top of atmosphere)",
    decl: "Solar declination",
    polarDay: "Midnight sun (no sunset)",
    polarNight: "Polar night (no sunrise)",
    chart: "Day length over a year",
    chartLegendNow: "Selected tilt",
    chartLegendEarth: "Earth (23.4°)",
    hours: "h",
    presets: "Tilt presets",
    earth: "Earth",
    none: "0° tilt",
    mars: "Mars",
    uranus: "Uranus",
    note: "Simple circular-orbit model. Earth is actually closest to the Sun in early January (perihelion), but that ~7% effect is much smaller than the tilt effect.",
    north: "N",
    south: "S",
    months: "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec",
  },
};

const PRESETS = [
  { id: "none", tilt: 0 },
  { id: "earth", tilt: EARTH_TILT },
  { id: "mars", tilt: 25.19 },
  { id: "uranus", tilt: 97.77 },
] as const;

function declination(dayOfYear: number, tilt: number): number {
  // Solar longitude ≈ 0 at the March equinox (~day 80).
  const lambda = (2 * Math.PI * (dayOfYear - 80)) / 365.2422;
  return Math.asin(Math.sin(tilt * RAD) * Math.sin(lambda)) / RAD;
}

function sunStats(latDeg: number, declDeg: number) {
  const phi = latDeg * RAD;
  const d = declDeg * RAD;
  const h0Alt = -0.833 * RAD;
  const cosH = (Math.sin(h0Alt) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d));
  let dayHours: number;
  if (cosH <= -1) dayHours = 24;
  else if (cosH >= 1) dayHours = 0;
  else dayHours = (2 * Math.acos(cosH)) / RAD / 15;

  const cosH0 = -Math.tan(phi) * Math.tan(d);
  const H0 = cosH0 <= -1 ? Math.PI : cosH0 >= 1 ? 0 : Math.acos(cosH0);
  const q = (S0 / Math.PI) * (H0 * Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.sin(H0));
  const noonAlt = 90 - Math.abs(latDeg - declDeg);
  return { dayHours, noonAlt: noonAlt > 90 ? 180 - noonAlt : noonAlt, insolation: Math.max(0, q) };
}

function dayOfYearNow(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
}

function fmtHours(h: number, locale: SpaceLocale): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  const [H, M] = mm === 60 ? [hh + 1, 0] : [hh, mm];
  return locale === "ko" ? `${H}시간 ${M}분` : `${H} h ${M} min`;
}

const W = 600;
const H = 200;
const PAD_L = 34;
const PAD_B = 22;

export function SeasonsTiltLab({ locale: rawLocale }: { locale?: string }) {
  const locale = asLocale(rawLocale);
  const t = COPY[locale];
  const [tilt, setTilt] = useState(EARTH_TILT);
  const [lat, setLat] = useState(locale === "ko" ? 37.6 : 40.7);
  // SSR renders a fixed reference date (identical on server and client); the reader's "today" is applied after hydration to avoid a mismatch.
  const [day, setDay] = useState(172);
  useEffect(() => setDay(dayOfYearNow()), []);

  const decl = declination(day, tilt);
  const stats = sunStats(lat, decl);

  const curves = useMemo(() => {
    const toPath = (tl: number) =>
      Array.from({ length: 73 }, (_, i) => {
        const d = 1 + i * 5;
        const x = PAD_L + ((d - 1) / 364) * (W - PAD_L - 6);
        const y = 6 + (1 - sunStats(lat, declination(d, tl)).dayHours / 24) * (H - PAD_B - 6);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(" ");
    return { now: toPath(tilt), earth: toPath(EARTH_TILT) };
  }, [lat, tilt]);

  // Rounded so server and client agree to the last digit during hydration.
  const markerX = Math.round((PAD_L + ((day - 1) / 364) * (W - PAD_L - 6)) * 10) / 10;
  const markerY = Math.round((6 + (1 - stats.dayHours / 24) * (H - PAD_B - 6)) * 10) / 10;
  const dateLabel = new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", { month: "long", day: "numeric" }).format(
    new Date(2026, 0, day),
  );
  const presetValue = PRESETS.find((p) => Math.abs(p.tilt - tilt) < 0.01)?.id ?? "";
  const months = t.months.split(",");

  const dayLenText =
    stats.dayHours >= 24 ? t.polarDay : stats.dayHours <= 0 ? t.polarNight : fmtHours(stats.dayHours, locale);

  return (
    <section className="not-prose my-8 flex flex-col gap-5 rounded-xl bg-card p-4 text-sm text-card-foreground ring-1 ring-foreground/10 sm:p-6">
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-foreground">{t.title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{t.lead}</p>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted-foreground">{t.presets}</span>
        <ToggleGroup
          type="single"
          variant="outline"
          value={presetValue}
          onValueChange={(v) => {
            const p = PRESETS.find((x) => x.id === v);
            if (p) setTilt(p.tilt);
          }}
          aria-label={t.presets}
          className="flex-wrap"
        >
          {PRESETS.map((p) => (
            <ToggleGroupItem key={p.id} value={p.id} size="lg">
              {t[p.id]} {p.id !== "none" && `${p.tilt.toFixed(1)}°`}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
          <span>
            {t.tilt}: <span className="font-mono text-foreground">{tilt.toFixed(1)}°</span>
          </span>
          <input type="range" min={0} max={98} step={0.1} value={tilt} onChange={(e) => setTilt(Number(e.target.value))} className="h-11 w-full accent-primary" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
          <span>
            {t.lat}:{" "}
            <span className="font-mono text-foreground">
              {lat >= 0 ? t.north : t.south} {Math.abs(lat).toFixed(1)}°
            </span>
          </span>
          <input type="range" min={-89} max={89} step={0.1} value={lat} onChange={(e) => setLat(Number(e.target.value))} className="h-11 w-full accent-primary" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
          <span>
            {t.day}: <span className="text-foreground">{dateLabel}</span>
          </span>
          <input type="range" min={1} max={365} value={day} onChange={(e) => setDay(Number(e.target.value))} className="h-11 w-full accent-primary" />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-live="polite">
        <div className="rounded-lg border border-border bg-muted p-3">
          <div className="text-xs text-muted-foreground">{t.dayLen}</div>
          <div className="font-mono text-base font-bold text-foreground">{dayLenText}</div>
        </div>
        <div className="rounded-lg border border-border bg-muted p-3">
          <div className="text-xs text-muted-foreground">{t.noon}</div>
          <div className="font-mono text-base font-bold text-foreground">{Math.max(stats.noonAlt, 0).toFixed(1)}°</div>
        </div>
        <div className="rounded-lg border border-border bg-muted p-3">
          <div className="text-xs text-muted-foreground">{t.insol}</div>
          <div className="font-mono text-base font-bold text-foreground">{stats.insolation.toFixed(0)} W/m²</div>
        </div>
        <div className="rounded-lg border border-border bg-muted p-3">
          <div className="text-xs text-muted-foreground">{t.decl}</div>
          <div className="font-mono text-base font-bold text-foreground">{decl.toFixed(1)}°</div>
        </div>
      </div>

      <figure className="space-y-2">
        <figcaption className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{t.chart}</span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-1 w-5 rounded bg-primary" aria-hidden="true" />
            {t.chartLegendNow}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-1 w-5 rounded bg-muted-foreground" aria-hidden="true" />
            {t.chartLegendEarth}
          </span>
        </figcaption>
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full text-muted-foreground" role="img" aria-label={t.chart}>
          {[0, 6, 12, 18, 24].map((h) => {
            const y = 6 + (1 - h / 24) * (H - PAD_B - 6);
            return (
              <g key={h}>
                <line x1={PAD_L} x2={W - 6} y1={y} y2={y} stroke="currentColor" strokeOpacity={0.2} />
                <text x={PAD_L - 6} y={y + 4} textAnchor="end" fontSize={11} fill="currentColor">
                  {h}
                  {locale === "ko" ? "h" : ""}
                </text>
              </g>
            );
          })}
          {months.map((m, i) => (
            <text key={m} x={PAD_L + ((i * 30.4 + 15) / 364) * (W - PAD_L - 6)} y={H - 6} textAnchor="middle" fontSize={11} fill="currentColor">
              {m}
            </text>
          ))}
          <path d={curves.earth} fill="none" stroke="currentColor" strokeWidth={1.5} strokeDasharray="5 4" />
          <path d={curves.now} fill="none" className="stroke-primary" strokeWidth={2.5} />
          <line x1={markerX} x2={markerX} y1={6} y2={H - PAD_B} className="stroke-primary" strokeOpacity={0.4} />
          <circle cx={markerX} cy={markerY} r={5} className="fill-primary" />
        </svg>
      </figure>
      <p className="text-xs text-muted-foreground">{t.note}</p>
    </section>
  );
}

export default SeasonsTiltLab;
