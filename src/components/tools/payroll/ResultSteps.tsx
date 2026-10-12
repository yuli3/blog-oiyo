export interface NextLink {
  href: string;
  label: string;
}

interface Props {
  steps: string[];
  next: NextLink[];
}

// The answer card's lower half: how the number was reached, then where to go next.
export default function ResultSteps({ steps, next }: Props) {
  return (
    <div className="mt-4 space-y-4">
      <details open className="rounded-md border border-border bg-background px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">어떻게 계산했나요?</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </details>
      {next.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-foreground">다음에 확인할 것</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {next.map((link) => (
              <a key={link.href} href={link.href} className="inline-flex min-h-11 items-center rounded-full border border-border bg-background px-3 text-sm text-foreground hover:bg-accent">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
