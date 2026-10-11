import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { equivalentSeconds, formatTime, parseTime, ratioFor, type Direction, type RaceId } from "../../lib/running-gender-equivalent";

interface UiLabels {
  distance: string;
  direction: string;
  toWomen: string;
  toMen: string;
  time: string;
  placeholder: string;
  invalid: string;
  result: (from: string, to: string) => string;
  gap: (pct: string) => string;
  races: Record<RaceId, string>;
}

const LABELS: Record<"en" | "ko", UiLabels> = {
  en: {
    distance: "Distance", direction: "Convert", toWomen: "Men's → women's", toMen: "Women's → men's",
    time: "Your time (h:mm:ss or mm:ss)", placeholder: "e.g. 25:00", invalid: "Enter a time such as 25:00 or 1:45:30",
    result: (from, to) => `${from} time → equivalent ${to} time`, gap: (pct) => `Women's record is ${pct}% slower at this distance`,
    races: { "5k": "5K", "10k": "10K", half: "Half marathon", marathon: "Marathon" },
  },
  ko: {
    distance: "거리", direction: "환산 방향", toWomen: "남자 → 여자", toMen: "여자 → 남자",
    time: "기록 (시:분:초 또는 분:초)", placeholder: "예: 25:00", invalid: "25:00이나 1:45:30처럼 입력해 주세요",
    result: (from, to) => `${from} 기록 → 같은 수준의 ${to} 기록`, gap: (pct) => `이 거리에서 여자 세계기록은 남자보다 ${pct}% 길어요`,
    races: { "5k": "5K", "10k": "10K", half: "하프", marathon: "풀코스" },
  },
};
const SIDES: Record<"en" | "ko", { men: string; women: string }> = { en: { men: "men's", women: "women's" }, ko: { men: "남자", women: "여자" } };
const RACES: RaceId[] = ["5k", "10k", "half", "marathon"];

const chip = (on: boolean) =>
  "min-h-11 rounded-md border px-3 text-sm font-semibold transition-colors " +
  (on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:bg-accent");

export default function RunningTimeEquivalent({ locale }: { locale: Locale }) {
  const lang = locale === "ko" ? "ko" : "en";
  const t = LABELS[lang];
  const side = SIDES[lang];
  const [race, setRace] = useState<RaceId>("10k");
  const [direction, setDirection] = useState<Direction>("toWomen");
  const [input, setInput] = useState("50:00");

  const seconds = parseTime(input);
  const result = seconds === null ? null : equivalentSeconds(seconds, race, direction);
  const pct = ((ratioFor(race) - 1) * 100).toFixed(1);
  const [from, to] = direction === "toWomen" ? [side.men, side.women] : [side.women, side.men];

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <fieldset>
        <legend className="text-sm font-medium text-muted-foreground">{t.distance}</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {RACES.map((id) => (
            <button key={id} type="button" aria-pressed={race === id} onClick={() => setRace(id)} className={chip(race === id)}>
              {t.races[id]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-muted-foreground">{t.direction}</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(["toWomen", "toMen"] as const).map((id) => (
            <button key={id} type="button" aria-pressed={direction === id} onClick={() => setDirection(id)} className={chip(direction === id)}>
              {t[id]}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-muted-foreground">{t.time}</span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={input}
          placeholder={t.placeholder}
          onChange={(event) => setInput(event.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-base text-foreground focus:outline-2 focus:outline-offset-2 focus:outline-primary"
        />
      </label>

      <div aria-live="polite" className="mt-5">
        {result === null ? (
          <p className="text-sm text-muted-foreground">{t.invalid}</p>
        ) : (
          <div className="rounded-md border border-border bg-background px-4 py-3">
            <p className="text-sm text-muted-foreground">{t.result(from, to)}</p>
            <p className="mt-1 font-mono text-3xl font-bold text-foreground">{formatTime(result)}</p>
            <p className="mt-2 text-xs text-muted-foreground">{t.gap(pct)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
