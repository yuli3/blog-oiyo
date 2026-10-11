import { useState } from "react";
import { equivalentWeight, formatWeight, matchingStandards, RATIO, roundToStep, type Direction, type Unit } from "../../lib/crossfit-weight-equivalent";

const chip = (on: boolean) =>
  "min-h-11 rounded-md border px-3 text-sm font-semibold transition-colors " +
  (on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:bg-accent");

// English only (2026-10-11): the search test in company-brain 2026-10-07-revenue-content-discovery.md (Test 2) is EN.
export default function CrossfitWeightEquivalent() {
  const [unit, setUnit] = useState<Unit>("lb");
  const [direction, setDirection] = useState<Direction>("toWomen");
  const [input, setInput] = useState("95");

  const value = Number(input);
  const valid = input.trim() !== "" && Number.isFinite(value) && value > 0 && value < 2000;
  const exact = valid ? equivalentWeight(value, direction) : 0;
  const matches = valid ? matchingStandards(value, unit, direction) : [];
  const to = direction === "toWomen" ? "women" : "men";
  const published = matches.length > 0 ? matches[0][unit][to] : null;
  const pct = Math.round(RATIO * 1000) / 10;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <fieldset>
        <legend className="text-sm font-medium text-muted-foreground">Convert</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(["toWomen", "toMen"] as const).map((id) => (
            <button key={id} type="button" aria-pressed={direction === id} onClick={() => setDirection(id)} className={chip(direction === id)}>
              {id === "toWomen" ? "Men's → women's" : "Women's → men's"}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-muted-foreground">Unit</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(["lb", "kg"] as const).map((id) => (
            <button key={id} type="button" aria-pressed={unit === id} onClick={() => setUnit(id)} className={chip(unit === id)}>
              {id}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-muted-foreground">{direction === "toWomen" ? "Men's" : "Women's"} weight ({unit})</span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-base text-foreground focus:outline-2 focus:outline-offset-2 focus:outline-primary"
        />
      </label>

      <div aria-live="polite" className="mt-5">
        {!valid ? (
          <p className="text-sm text-muted-foreground">Enter a weight, for example 95 or 135.</p>
        ) : (
          <div className="rounded-md border border-border bg-background px-4 py-3">
            <p className="text-sm text-muted-foreground">Equivalent {to}'s weight</p>
            <p className="mt-1 font-mono text-3xl font-bold text-foreground">
              {formatWeight(published ?? roundToStep(exact, unit))} {unit}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {published !== null
                ? `Published Rx pair (${matches.map((row) => row.name).join(", ")}). The ${pct}% ratio gives ${formatWeight(Math.round(exact * 10) / 10)} ${unit}.`
                : `${formatWeight(Math.round(exact * 10) / 10)} ${unit} at the ${pct}% ratio, rounded to the nearest ${unit === "lb" ? "5 lb" : "2.5 kg"}.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
