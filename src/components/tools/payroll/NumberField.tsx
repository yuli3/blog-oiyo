interface Props {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  step?: number;
  min?: number;
}

export default function NumberField({ label, value, onChange, suffix, step = 1, min = 0 }: Props) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={Number.isFinite(value) ? value : ""}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-h-11 w-full rounded-md border border-border bg-background px-3 font-mono text-base text-foreground focus:outline-2 focus:outline-offset-2 focus:outline-primary"
        />
        {suffix && <span className="shrink-0 text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </label>
  );
}
