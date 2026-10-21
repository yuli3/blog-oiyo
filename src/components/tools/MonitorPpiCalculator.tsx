import { useEffect, useId, useState } from 'react';
import { calculateMonitorPpi } from '../../lib/monitor-ppi';
import { monitorPpiCopy, type PpiLocale } from '../../data/monitor-ppi-copy';

const PRESETS = [
  { name: '24″ FHD · 1920 × 1080', w: 1920, h: 1080, inches: 24 },
  { name: '27″ QHD · 2560 × 1440', w: 2560, h: 1440, inches: 27 },
  { name: '27″ 4K · 3840 × 2160', w: 3840, h: 2160, inches: 27 },
  { name: '32″ 4K · 3840 × 2160', w: 3840, h: 2160, inches: 32 },
  { name: '27″ 5K · 5120 × 2880', w: 5120, h: 2880, inches: 27 },
  { name: '34″ UWQHD · 3440 × 1440', w: 3440, h: 1440, inches: 34 },
];

export default function MonitorPpiCalculator({ locale = 'ko' }: { locale?: PpiLocale }) {
  const t = monitorPpiCopy[locale];
  const id = useId();
  // SSR results remain readable, but edits must wait until React owns the inputs;
  // otherwise hydration can overwrite an early user edit (2026-10-19 UI check).
  const [interactive, setInteractive] = useState(false);
  useEffect(() => { setInteractive(true); }, []);
  // Preserve an empty/invalid editing state; never silently turn it into 1.
  // The public geometry boundary rejects it instead (2026-10-19).
  const [width, setWidth] = useState('3840');
  const [height, setHeight] = useState('2160');
  const [diagonal, setDiagonal] = useState('27');
  const result = calculateMonitorPpi({
    widthPixels: Number(width), heightPixels: Number(height), diagonalInches: Number(diagonal),
  });
  const format = (value: number) => new Intl.NumberFormat(locale, {
    maximumSignificantDigits: 6,
    notation: value < 0.001 || value >= 1e7 ? 'scientific' : 'standard',
  }).format(value);
  const errorId = id + '-error';
  const fields = [
    { key: 'width', label: t.width, value: width, set: setWidth, step: '1', invalid: !Number.isSafeInteger(Number(width)) || Number(width) <= 0 },
    { key: 'height', label: t.height, value: height, set: setHeight, step: '1', invalid: !Number.isSafeInteger(Number(height)) || Number(height) <= 0 },
    { key: 'diagonal', label: t.diagonal, value: diagonal, set: setDiagonal, step: 'any', invalid: !Number.isFinite(Number(diagonal)) || Number(diagonal) <= 0 },
  ];

  return (
    <section aria-label={t.title} className="space-y-6 rounded-2xl border border-border bg-card p-4 sm:p-6">
      {!interactive && <p className="text-sm text-muted-foreground">{t.loading}</p>}
      <div>
        <p className="mb-2 text-sm font-semibold">{t.presets}</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button key={p.name} type="button" disabled={!interactive}
              aria-pressed={Number(width) === p.w && Number(height) === p.h && Number(diagonal) === p.inches}
              onClick={() => { setWidth(String(p.w)); setHeight(String(p.h)); setDiagonal(String(p.inches)); }}
              className="min-h-11 rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-secondary-foreground hover:bg-accent">
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4">
        {fields.map(field => (
          <div key={field.key}>
            <label htmlFor={id + field.key} className="mb-1 block text-sm font-medium">{field.label}</label>
            <input id={id + field.key} type="number" inputMode="decimal" min="0" step={field.step}
              value={field.value} onChange={e => field.set(e.target.value)} disabled={!interactive}
              aria-invalid={field.invalid} aria-describedby={!result.ok ? errorId : undefined}
              className="min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground" />
          </div>
        ))}
      </div>
      {!result.ok ? (
        <p id={errorId} role="alert" className="rounded-lg border border-destructive p-4 text-sm text-destructive">
          {result.reason === 'invalid-input' ? t.invalid : t.overflow}
        </p>
      ) : (
        <dl aria-live="polite" aria-atomic="true" className="grid gap-3">
          {[
            [t.ppi, format(result.ppi) + ' PPI'],
            [t.pitch, format(result.pixelPitchMm) + ' mm'],
            [t.size, format(result.widthCm) + ' × ' + format(result.heightCm) + ' cm'],
            [t.angle, format(result.oneArcminuteDistanceCm) + ' cm'],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0 rounded-xl border border-border bg-background p-4">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="mt-1 break-words font-mono text-xl font-semibold text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="text-sm text-muted-foreground">{t.assumptions}</p>
      <p className="text-sm text-muted-foreground">{t.angleNote}</p>
    </section>
  );
}
