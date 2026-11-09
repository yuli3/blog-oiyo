import { useEffect, useMemo, useState } from "react";
import CalendarDays from "lucide-react/dist/esm/icons/calendar-days";
import {
  Body,
  Equator,
  Horizon,
  Illumination,
  MoonPhase,
  NextLunarEclipse,
  NextMoonQuarter,
  Observer,
  SearchLocalSolarEclipse,
  SearchLunarEclipse,
  SearchMoonQuarter,
  SearchRiseSet,
  type AstroTime,
} from "astronomy-engine";
import { Button } from "@/components/ui/button";
import { SCENE, asLocale, fromDateInput, toDateInput, type SpaceLocale } from "./data";

interface City {
  id: string;
  ko: string;
  en: string;
  lat: number;
  lon: number;
  tz: string;
}

const CITIES: City[] = [
  { id: "seoul", ko: "서울", en: "Seoul", lat: 37.5665, lon: 126.978, tz: "Asia/Seoul" },
  { id: "busan", ko: "부산", en: "Busan", lat: 35.1796, lon: 129.0756, tz: "Asia/Seoul" },
  { id: "jeju", ko: "제주", en: "Jeju", lat: 33.4996, lon: 126.5312, tz: "Asia/Seoul" },
  { id: "tokyo", ko: "도쿄", en: "Tokyo", lat: 35.6762, lon: 139.6503, tz: "Asia/Tokyo" },
  { id: "newyork", ko: "뉴욕", en: "New York", lat: 40.7128, lon: -74.006, tz: "America/New_York" },
  { id: "losangeles", ko: "로스앤젤레스", en: "Los Angeles", lat: 34.0522, lon: -118.2437, tz: "America/Los_Angeles" },
  { id: "london", ko: "런던", en: "London", lat: 51.5072, lon: -0.1276, tz: "Europe/London" },
  { id: "sydney", ko: "시드니", en: "Sydney", lat: -33.8688, lon: 151.2093, tz: "Australia/Sydney" },
];

const COPY: Record<SpaceLocale, Record<string, string>> = {
  ko: {
    title: "내 하늘의 달과 일식·월식 계산기",
    lead: "날짜와 도시를 고르면 그날 달의 모양, 뜨고 지는 시각, 그 도시에서 실제로 볼 수 있는 다음 월식과 일식을 계산해요.",
    date: "날짜",
    city: "도시",
    today: "오늘",
    illum: "밝게 보이는 면",
    age: "월령",
    days: "일",
    rise: "달 뜨는 시각",
    set: "달 지는 시각",
    none: "이날 없음",
    quarters: "다음 주요 위상",
    lunar: "이 도시에서 볼 수 있는 다음 월식",
    solar: "이 도시에서 볼 수 있는 다음 일식",
    altitude: "최대 식 때 달의 고도",
    sunAlt: "최대 식 때 해의 고도",
    obsc: "가려지는 비율",
    notFound: "10년 안에 찾지 못했어요",
    hemisphere: "남반구 도시에서는 달의 밝은 쪽이 좌우 반대로 보여요.",
    note: "계산: astronomy-engine(VSOP87·ELP 기반 천체력). 시각은 도시 현지 시각이며, 지형·대기 굴절에 따라 몇 분 차이가 날 수 있어요.",
    penumbral: "반영",
    partial: "부분",
    total: "개기",
    annular: "금환",
    lunarSuffix: "월식",
    solarSuffix: "일식",
  },
  en: {
    title: "Moon and Eclipse Calculator for Your Sky",
    lead: "Pick a date and a city to see the Moon's shape, when it rises and sets, and the next lunar and solar eclipses you can actually see from that city.",
    date: "Date",
    city: "City",
    today: "Today",
    illum: "Illuminated",
    age: "Moon age",
    days: "days",
    rise: "Moonrise",
    set: "Moonset",
    none: "None that day",
    quarters: "Next principal phases",
    lunar: "Next lunar eclipse visible from this city",
    solar: "Next solar eclipse visible from this city",
    altitude: "Moon altitude at maximum",
    sunAlt: "Sun altitude at maximum",
    obsc: "Fraction of the Sun covered",
    notFound: "None found within 10 years",
    hemisphere: "From a southern-hemisphere city the lit side appears mirrored left to right.",
    note: "Computed with astronomy-engine (VSOP87/ELP-based ephemeris). Times are local to the city and can differ by a few minutes with terrain and refraction.",
    penumbral: "Penumbral",
    partial: "Partial",
    total: "Total",
    annular: "Annular",
    lunarSuffix: "lunar eclipse",
    solarSuffix: "solar eclipse",
  },
};

const PHASE_NAMES: Record<SpaceLocale, string[]> = {
  ko: ["삭(신월)", "초승달", "상현달", "차가는 볼록달", "보름달", "기우는 볼록달", "하현달", "그믐달"],
  en: ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"],
};
const QUARTER_NAMES: Record<SpaceLocale, string[]> = {
  ko: ["삭", "상현", "망(보름)", "하현"],
  en: ["New Moon", "First Quarter", "Full Moon", "Last Quarter"],
};

const SYNODIC_DAYS = 29.530588;

function phaseIndex(angle: number): number {
  return Math.floor(((angle + 22.5) % 360) / 45);
}

/** SVG path of the lit part of the Moon disc (northern-hemisphere view, waxing lit on the right). */
function litPath(angle: number, r: number): string {
  const a = ((angle % 360) + 360) % 360;
  const waxing = a < 180;
  // terminator ellipse x-radius: cos of phase angle
  const k = Math.cos((a * Math.PI) / 180);
  const rx = Math.abs(k) * r;
  const outerSweep = waxing ? 1 : 0; // right half when waxing
  // terminator bulges toward the lit side when gibbous (k < 0)
  const innerSweep = waxing ? (k > 0 ? 0 : 1) : k > 0 ? 1 : 0;
  return `M 0 ${-r} A ${r} ${r} 0 0 ${outerSweep} 0 ${r} A ${rx} ${r} 0 0 ${innerSweep} 0 ${-r} Z`;
}

function localDayStart(dateStr: string, tz: string): Date {
  const parts = dateStr.split("-").map(Number);
  const guess = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0));
  const offset = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" })
    .formatToParts(guess)
    .find((p) => p.type === "timeZoneName")?.value;
  const m = offset?.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  const minutes = m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0)) : 0;
  return new Date(guess.getTime() - minutes * 60_000);
}

function fmt(time: AstroTime | Date | null, locale: SpaceLocale, tz: string, withDate = false): string {
  if (!time) return "";
  const d = time instanceof Date ? time : time.date;
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    timeZone: tz,
    ...(withDate ? { year: "numeric", month: "short", day: "numeric" } : {}),
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function MoonSkyLab({ locale: rawLocale }: { locale?: string }) {
  const locale = asLocale(rawLocale);
  const t = COPY[locale];
  // SSR renders a fixed reference date (identical on server and client); the reader's "today" is applied after hydration to avoid a mismatch.
  const [dateStr, setDateStr] = useState("2026-01-01");
  useEffect(() => setDateStr(toDateInput(new Date())), []);
  const [cityId, setCityId] = useState(locale === "ko" ? "seoul" : "newyork");
  const city = CITIES.find((c) => c.id === cityId) ?? CITIES[0];

  const result = useMemo(() => {
    const start = localDayStart(dateStr, city.tz);
    const evening = new Date(start.getTime() + 21 * 3_600_000);
    const observer = new Observer(city.lat, city.lon, 0);
    const angle = MoonPhase(evening);
    const illum = Illumination(Body.Moon, evening).phase_fraction;
    const rise = SearchRiseSet(Body.Moon, observer, +1, start, 1);
    const set = SearchRiseSet(Body.Moon, observer, -1, start, 1);

    const quarters: { q: number; time: AstroTime }[] = [];
    let mq = SearchMoonQuarter(start);
    for (let i = 0; i < 4; i++) {
      quarters.push({ q: mq.quarter, time: mq.time });
      mq = NextMoonQuarter(mq);
    }

    let lunar: { kind: string; peak: AstroTime; alt: number } | null = null;
    let le = SearchLunarEclipse(start);
    for (let i = 0; i < 25; i++) {
      const eq = Equator(Body.Moon, le.peak, observer, true, true);
      const alt = Horizon(le.peak, observer, eq.ra, eq.dec, "normal").altitude;
      if (alt > 0) {
        lunar = { kind: le.kind, peak: le.peak, alt };
        break;
      }
      le = NextLunarEclipse(le.peak);
    }

    let solar: { kind: string; peak: AstroTime; alt: number; obsc?: number } | null = null;
    try {
      const se = SearchLocalSolarEclipse(start, observer);
      solar = { kind: se.kind, peak: se.peak.time, alt: se.peak.altitude, obsc: se.obscuration };
    } catch {
      solar = null;
    }
    if (solar && solar.peak.date.getTime() - start.getTime() > 3653 * 86_400_000) solar = null;

    return { angle, illum, rise, set, quarters, lunar, solar };
  }, [dateStr, city]);

  const kindLabel = (kind: string, suffix: string) => {
    const k = t[kind] ?? kind;
    return locale === "ko" ? `${k}${suffix}` : `${k} ${suffix}`;
  };

  const r = 60;
  const southern = city.lat < 0;

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
            value={dateStr}
            onChange={(e) => fromDateInput(e.target.value) && setDateStr(e.target.value)}
            className="min-h-11 rounded-lg border border-input bg-background px-3 text-base text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
          {t.city}
          <select
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            className="min-h-11 rounded-lg border border-input bg-background px-3 text-base text-foreground"
          >
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c[locale]}
              </option>
            ))}
          </select>
        </label>
        <Button variant="outline" size="lg" onClick={() => setDateStr(toDateInput(new Date()))}>
          <CalendarDays aria-hidden="true" />
          {t.today}
        </Button>
      </div>

      <div className="grid items-center gap-5 sm:grid-cols-3">
        <div className="justify-self-center overflow-hidden rounded-xl border border-border">
          <svg
            viewBox="-80 -80 160 160"
            className="block size-48"
            role="img"
            aria-label={`${PHASE_NAMES[locale][phaseIndex(result.angle)]} ${(result.illum * 100).toFixed(0)}%`}
          >
            <rect x={-80} y={-80} width={160} height={160} fill={SCENE.space} />
            <g transform={southern ? "scale(-1 1)" : undefined}>
              <circle r={r} fill={SCENE.moonDark} />
              <path d={litPath(result.angle, r)} fill={SCENE.moonLit} />
              <circle r={r} fill="none" stroke={SCENE.orbit} strokeWidth={1} />
            </g>
          </svg>
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm sm:col-span-2" aria-live="polite">
          <dt className="text-muted-foreground">{locale === "ko" ? "위상" : "Phase"}</dt>
          <dd className="font-semibold text-foreground">{PHASE_NAMES[locale][phaseIndex(result.angle)]}</dd>
          <dt className="text-muted-foreground">{t.illum}</dt>
          <dd className="font-mono text-foreground">{(result.illum * 100).toFixed(1)}%</dd>
          <dt className="text-muted-foreground">{t.age}</dt>
          <dd className="font-mono text-foreground">
            {((result.angle / 360) * SYNODIC_DAYS).toFixed(1)} {t.days}
          </dd>
          <dt className="text-muted-foreground">{t.rise}</dt>
          <dd className="font-mono text-foreground">{result.rise ? fmt(result.rise, locale, city.tz) : t.none}</dd>
          <dt className="text-muted-foreground">{t.set}</dt>
          <dd className="font-mono text-foreground">{result.set ? fmt(result.set, locale, city.tz) : t.none}</dd>
        </dl>
      </div>
      {southern && <p className="text-xs text-muted-foreground">{t.hemisphere}</p>}

      <div className="space-y-2">
        <h4 className="text-sm font-bold text-foreground">{t.quarters}</h4>
        <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          {result.quarters.map((q) => (
            <li key={q.time.ut} className="rounded-lg border border-border px-3 py-2">
              <div className="font-semibold text-foreground">{QUARTER_NAMES[locale][q.q]}</div>
              <div className="font-mono text-xs text-muted-foreground">{fmt(q.time, locale, city.tz, true)}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-muted p-4">
          <div className="mb-1 text-xs font-semibold text-muted-foreground">{t.lunar}</div>
          {result.lunar ? (
            <>
              <div className="text-base font-bold text-foreground">{kindLabel(result.lunar.kind, t.lunarSuffix)}</div>
              <div className="font-mono text-sm text-foreground">{fmt(result.lunar.peak, locale, city.tz, true)}</div>
              <div className="text-xs text-muted-foreground">
                {t.altitude}: {result.lunar.alt.toFixed(0)}°
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">{t.notFound}</div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-muted p-4">
          <div className="mb-1 text-xs font-semibold text-muted-foreground">{t.solar}</div>
          {result.solar ? (
            <>
              <div className="text-base font-bold text-foreground">{kindLabel(result.solar.kind, t.solarSuffix)}</div>
              <div className="font-mono text-sm text-foreground">{fmt(result.solar.peak, locale, city.tz, true)}</div>
              <div className="text-xs text-muted-foreground">
                {t.sunAlt}: {result.solar.alt.toFixed(0)}°
                {result.solar.obsc !== undefined && ` · ${t.obsc}: ${(result.solar.obsc * 100).toFixed(0)}%`}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">{t.notFound}</div>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t.note}</p>
    </section>
  );
}

export default MoonSkyLab;
