import { useState } from "react";

interface Props {
  label: string;
  placeholder: string;
  examples: string[];
  /** Returns the names of the fields it filled, or an empty list when nothing was read. */
  onApply: (text: string) => string[];
}

// ChatGPT-style entry (2026-10-12 세운 요청): one sentence fills the form below.
// Parsing is local and rule-based; nothing typed here leaves the browser.
export default function OneLineInput({ label, placeholder, examples, onApply }: Props) {
  const [text, setText] = useState("");
  const [filled, setFilled] = useState<string[] | null>(null);

  const apply = (value: string) => {
    setText(value);
    setFilled(onApply(value));
  };

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          apply(text);
        }}
      >
        <label className="block">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={text}
              placeholder={placeholder}
              autoComplete="off"
              onChange={(event) => setText(event.target.value)}
              className="min-h-11 w-full rounded-md border border-border bg-background px-3 text-base text-foreground focus:outline-2 focus:outline-offset-2 focus:outline-primary"
            />
            <button type="submit" className="min-h-11 shrink-0 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
              채우기
            </button>
          </div>
        </label>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => apply(example)}
            className="min-h-11 rounded-full border border-border bg-background px-3 text-sm text-muted-foreground hover:bg-accent"
          >
            {example}
          </button>
        ))}
      </div>
      {filled !== null && (
        <p aria-live="polite" className="mt-3 text-sm text-muted-foreground">
          {filled.length > 0 ? `${filled.join(", ")}을(를) 채웠어요. 아래에서 고칠 수 있습니다.` : "읽을 수 있는 값이 없었어요. 아래 칸에 직접 입력해 주세요."}
        </p>
      )}
    </div>
  );
}
