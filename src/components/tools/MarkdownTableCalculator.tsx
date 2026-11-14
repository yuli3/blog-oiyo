import React, { useState, useMemo } from 'react';
import { GameContainer } from '../ui/game/GamePrimitives';

interface Props {
  locale?: string;
}

const SAMPLE_TABLE = `| 이름 | 직책 | 부서 | 상태 |
|---|---|---|---|
| 김철수 | 수석 엔지니어 | 플랫폼 개발팀 | 활성 |
| Jane Doe | Tech Lead | Core Systems | Active |
| 박영희 | 프로덕트 매니저 | 데이터 분석 | 대기 |`;

function getDisplayWidth(str: string): number {
  let width = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    // East Asian Wide / Fullwidth characters (Hangul, Hanzi, Kana, CJK)
    if (
      (code >= 0x1100 && code <= 0x11ff) ||
      (code >= 0x2e80 && code <= 0xa4cf) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xfe30 && code <= 0xfe4f) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6)
    ) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}

function padString(str: string, targetWidth: number, align: 'left' | 'center' | 'right' = 'left'): string {
  const currentWidth = getDisplayWidth(str);
  const diff = Math.max(0, targetWidth - currentWidth);

  if (diff === 0) return str;

  if (align === 'right') {
    return ' '.repeat(diff) + str;
  }
  if (align === 'center') {
    const leftPad = Math.floor(diff / 2);
    const rightPad = diff - leftPad;
    return ' '.repeat(leftPad) + str + ' '.repeat(rightPad);
  }
  return str + ' '.repeat(diff);
}

function formatMarkdownTable(raw: string, align: 'left' | 'center' | 'right' = 'left'): string {
  const lines = raw.trim().split('\n').filter((l) => l.trim().length > 0);
  if (lines.length === 0) return '';

  const rows: string[][] = [];

  for (const line of lines) {
    let clean = line.trim();
    if (clean.startsWith('|')) clean = clean.substring(1);
    if (clean.endsWith('|')) clean = clean.substring(0, clean.length - 1);
    const cells = clean.split('|').map((c) => c.trim());
    rows.push(cells);
  }

  // Calculate max columns and max widths
  let colCount = 0;
  rows.forEach((r) => {
    if (r.length > colCount) colCount = r.length;
  });

  const colWidths = new Array(colCount).fill(3);

  // Compute widths ignoring delimiter row
  rows.forEach((r, rowIdx) => {
    if (rowIdx === 1 && r.every((c) => /^:?-+:?$/.test(c))) {
      return; // delimiter row
    }
    r.forEach((cell, colIdx) => {
      const w = getDisplayWidth(cell);
      if (w > colWidths[colIdx]) colWidths[colIdx] = w;
    });
  });

  const formattedLines: string[] = [];

  rows.forEach((r, rowIdx) => {
    // Delimiter row
    if (rowIdx === 1 && r.every((c) => /^:?-+:?$/.test(c))) {
      const delims = colWidths.map((w) => {
        if (align === 'center') return ':' + '-'.repeat(Math.max(1, w - 2)) + ':';
        if (align === 'right') return '-'.repeat(Math.max(1, w - 1)) + ':';
        return '-'.repeat(w);
      });
      formattedLines.push(`| ${delims.join(' | ')} |`);
      return;
    }

    const paddedCells = colWidths.map((w, colIdx) => {
      const val = r[colIdx] || '';
      return padString(val, w, align);
    });

    formattedLines.push(`| ${paddedCells.join(' | ')} |`);
  });

  return formattedLines.join('\n');
}

export default function MarkdownTableCalculator({ locale = 'ko' }: Props) {
  const isKo = locale === 'ko';
  const [input, setInput] = useState(SAMPLE_TABLE);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left');
  const [copied, setCopied] = useState(false);

  const formatted = useMemo(() => formatMarkdownTable(input, align), [input, align]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <GameContainer
      title={isKo ? '마크다운 테이블 포맷터' : 'Markdown Table Prettifier'}
      subtitle={isKo ? '한글·동아시아 전각 문자 너비 보정 & 파이프 열 정렬기' : 'East-Asian Double-Width Pipe Aligner'}
      onReset={() => setInput(SAMPLE_TABLE)}
    >
      <div className="w-full space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">{isKo ? '열 정렬:' : 'Align:'}</span>
            <div className="flex rounded-lg bg-muted/40 p-1 border border-border">
              {(['left', 'center', 'right'] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => setAlign(a)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    align === a ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {a.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={copyToClipboard}
            className="text-xs font-bold bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
          >
            {copied ? (isKo ? '복사 완료! 🎉' : 'Copied! 🎉') : isKo ? '정렬된 표 복사' : 'Copy Table'}
          </button>
        </div>

        {/* Input Textarea */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground block">
            {isKo ? '원본 마크다운 표 입력' : 'Paste Raw Markdown Table'}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={6}
            className="w-full font-mono text-xs sm:text-sm bg-muted/20 p-4 rounded-xl border border-border text-foreground outline-none focus:ring-2 focus:ring-primary"
            placeholder="| Col 1 | Col 2 |..."
          />
        </div>

        {/* Formatted Output Area */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground block">
            {isKo ? '너비 보정된 결과 (고정폭 폰트 정렬)' : 'Formatted Output (Pixel-Perfect Alignment)'}
          </label>
          <pre className="w-full font-mono text-xs sm:text-sm bg-card p-4 rounded-xl border border-border text-foreground overflow-x-auto whitespace-pre">
            {formatted}
          </pre>
        </div>
      </div>
    </GameContainer>
  );
}
