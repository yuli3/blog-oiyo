interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export default function DateField({ label, value, onChange }: Props) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3 font-mono text-base text-foreground focus:outline-2 focus:outline-offset-2 focus:outline-primary"
      />
    </label>
  );
}
