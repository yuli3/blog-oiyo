import React, { useState, useMemo } from 'react';

interface DiffLine {
  type: 'same' | 'added' | 'removed';
  leftLine?: number;
  rightLine?: number;
  leftText?: string;
  rightText?: string;
}

const DEFAULT_LEFT = `export function calculateTax(income: number) {
  // Legacy rate calculation
  const rate = 0.15;
  return income * rate;
}`;

const DEFAULT_RIGHT = `export function calculateTax(income: number, deductions = 0) {
  // 2026 updated bracket with standard deductions
  const taxable = Math.max(0, income - deductions);
  const rate = taxable > 50000000 ? 0.24 : 0.15;
  return taxable * rate;
}`;

export default function DiffVisualizer() {
  const [leftText, setLeftText] = useState(DEFAULT_LEFT);
  const [rightText, setRightText] = useState(DEFAULT_RIGHT);
  const [copied, setCopied] = useState(false);

  const diffLines = useMemo(() => {
    const lefts = leftText.split('\n');
    const rights = rightText.split('\n');
    const result: DiffLine[] = [];
    const maxLen = Math.max(lefts.length, rights.length);

    let lIdx = 1;
    let rIdx = 1;

    for (let i = 0; i < maxLen; i++) {
      const l = lefts[i];
      const r = rights[i];

      if (l === r) {
        result.push({ type: 'same', leftLine: lIdx++, rightLine: rIdx++, leftText: l, rightText: r });
      } else if (l !== undefined && r === undefined) {
        result.push({ type: 'removed', leftLine: lIdx++, leftText: l });
      } else if (l === undefined && r !== undefined) {
        result.push({ type: 'added', rightLine: rIdx++, rightText: r });
      } else {
        result.push({ type: 'removed', leftLine: lIdx++, leftText: l });
        result.push({ type: 'added', rightLine: rIdx++, rightText: r });
      }
    }
    return result;
  }, [leftText, rightText]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const d of diffLines) {
      if (d.type === 'added') added++;
      if (d.type === 'removed') removed++;
    }
    return { added, removed, total: diffLines.length };
  }, [diffLines]);

  const copyAsText = () => {
    const textOut = diffLines.map(d => {
      if (d.type === 'added') return `+ ${d.rightText ?? ''}`;
      if (d.type === 'removed') return `- ${d.leftText ?? ''}`;
      return `  ${d.leftText ?? ''}`;
    }).join('\n');

    navigator.clipboard.writeText(textOut);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold tracking-tight">AI Agent Diff Visualizer</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Zero-dependency side-by-side terminal diff viewer & responsive diff generator.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
              +{stats.added} Added
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
              -{stats.removed} Removed
            </span>
            <button
              type="button"
              onClick={copyAsText}
              className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy Unified Diff'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Original (Before)
            </label>
            <textarea
              value={leftText}
              onChange={(e) => setLeftText(e.target.value)}
              rows={6}
              className="w-full font-mono text-xs bg-muted/40 border border-border rounded-lg p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Paste original source..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Modified (After)
            </label>
            <textarea
              value={rightText}
              onChange={(e) => setRightText(e.target.value)}
              rows={6}
              className="w-full font-mono text-xs bg-muted/40 border border-border rounded-lg p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Paste modified source..."
            />
          </div>
        </div>

        {/* Diff Output Table */}
        <div className="border border-border rounded-lg overflow-hidden bg-muted/30 font-mono text-xs">
          <div className="bg-muted/60 px-4 py-2 border-b border-border text-muted-foreground flex items-center justify-between">
            <span className="font-semibold text-foreground">Terminal Diff Inspector</span>
            <span className="text-xs text-muted-foreground">@oiyonet/diff-visualizer engine</span>
          </div>
          <div className="overflow-x-auto max-h-96 divide-y divide-border">
            {diffLines.map((line, idx) => {
              const isAdd = line.type === 'added';
              const isRem = line.type === 'removed';
              const bgClass = isAdd ? 'bg-success/15' : isRem ? 'bg-destructive/15' : '';
              const textColor = isAdd ? 'text-success' : isRem ? 'text-destructive' : 'text-foreground';
              const sign = isAdd ? '+' : isRem ? '-' : ' ';

              return (
                <div key={idx} className={`flex items-start hover:bg-muted/50 ${bgClass} py-0.5 px-3`}>
                  <div className="w-8 shrink-0 text-right pr-2 text-muted-foreground select-none">
                    {line.leftLine ?? ''}
                  </div>
                  <div className="w-8 shrink-0 text-right pr-3 text-muted-foreground select-none">
                    {line.rightLine ?? ''}
                  </div>
                  <div className="w-4 shrink-0 text-muted-foreground font-bold select-none">
                    {sign}
                  </div>
                  <div className={`flex-1 whitespace-pre-wrap break-all ${textColor}`}>
                    {isAdd ? line.rightText : line.leftText}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
