interface Props<T extends string> {
  legend: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}

// One-tap choice row; the pressed chip is the current answer.
export default function ChoiceChips<T extends string>({ legend, value, options, onChange }: Props<T>) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-muted-foreground">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={
              "min-h-11 rounded-md border px-3 text-sm font-semibold transition-colors " +
              (value === option.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:bg-accent")
            }
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
