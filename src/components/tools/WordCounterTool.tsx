import React, { useState, useMemo } from 'react';

/**
 * 바이트 수·플랫폼별 글자 제한을 더했다(2026-09-03, 세운 지시).
 *
 * 바이트: UTF-8 기준. 한글·한자 등 CJK 는 1글자가 3바이트라, 같은 "글자 수"라도
 * 옛 시스템(공공기관 서식, SMS 등)의 바이트 제한에서는 영문보다 훨씬 빨리
 * 찬다 — 그래서 글자 수와 별도로 보여줄 값이다.
 *
 * X(트위터): 자체 가중치 규칙이 있다 — 라틴 문자는 1, CJK·전각 문자는 2로
 * 센다(공식 문서: developer.x.com/en/docs/counting-characters). 그래서 단순
 * text.length 로는 X 의 280자 제한과 안 맞는다.
 */
const X_WEIGHTED_RANGES: [number, number][] = [
  [0x1100, 0x115f], [0x2e80, 0xa4cf], [0xac00, 0xd7a3], // 한글 자모·CJK·한글 음절
  [0xf900, 0xfaff], [0xff00, 0xffef], [0x20000, 0x2fffd], // 호환용 한자·전각·CJK 확장
];
function xWeightedLength(text: string): number {
  let n = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    n += X_WEIGHTED_RANGES.some(([lo, hi]) => cp >= lo && cp <= hi) ? 2 : 1;
  }
  return n;
}

const PLATFORM_LIMITS: { key: string; limit: number; kind: 'chars' | 'weighted' }[] = [
  { key: 'x', limit: 280, kind: 'weighted' },
  { key: 'threads', limit: 500, kind: 'chars' },
  { key: 'instagram', limit: 2200, kind: 'chars' },
  { key: 'facebook', limit: 477, kind: 'chars' },
  { key: 'youtubeTitle', limit: 100, kind: 'chars' },
];

const WordCounterTool: React.FC<{ locale?: 'ko' | 'en' }> = ({ locale = 'ko' }) => {
  const t = locale === 'ko'
    ? {
        title: '글자수 세기 & 단어 수 계산기',
        placeholder: '여기에 텍스트를 붙여넣거나 입력하세요...',
        clear: '지우기',
        words: '단어 수',
        chars: '글자 수',
        charsNoSpace: '공백 제외',
        bytes: '바이트 수 (UTF-8)',
        sentences: '문장 수',
        paragraphs: '단락 수',
        readingTime: '읽기 시간',
        minutes: '분',
        seconds: '초',
        topWords: '자주 쓴 단어 TOP 5',
        times: '회',
        noText: '텍스트를 입력하면 통계가 표시됩니다.',
        platformTitle: '플랫폼별 글자수 제한',
        platformNote: 'X(트위터)는 한글·한자를 2자로 계산합니다(공식 규칙). 다른 항목은 글자 수 기준입니다.',
        over: '초과',
        platforms: {
          x: 'X (트위터, 280자)',
          threads: 'Threads (500자)',
          instagram: 'Instagram 캡션 (2,200자)',
          facebook: 'Facebook 피드 노출 (477자, 그 이상은 "더 보기")',
          youtubeTitle: 'YouTube 제목 (100자)',
        } as Record<string, string>,
      }
    : {
        title: 'Word & Character Counter',
        placeholder: 'Paste or type your text here...',
        clear: 'Clear',
        words: 'Words',
        chars: 'Characters',
        charsNoSpace: 'No Spaces',
        bytes: 'Bytes (UTF-8)',
        sentences: 'Sentences',
        paragraphs: 'Paragraphs',
        readingTime: 'Reading Time',
        minutes: 'min',
        seconds: 'sec',
        topWords: 'Top 5 Words',
        times: 'times',
        noText: 'Enter text to see statistics.',
        platformTitle: 'Platform Character Limits',
        platformNote: 'X (Twitter) counts CJK characters as 2 (official rule). Other limits are plain character counts.',
        over: 'over',
        platforms: {
          x: 'X / Twitter (280 chars)',
          threads: 'Threads (500 chars)',
          instagram: 'Instagram caption (2,200 chars)',
          facebook: 'Facebook feed preview (477 chars before "See More")',
          youtubeTitle: 'YouTube title (100 chars)',
        } as Record<string, string>,
      };

  const [text, setText] = useState('');

  const stats = useMemo(() => {
    if (!text.trim()) return null;

    const words = text.trim().split(/\s+/).filter(Boolean);
    const charCount = text.length;
    const charNoSpace = text.replace(/\s/g, '').length;
    const byteCount = new TextEncoder().encode(text).length;
    const xWeighted = xWeightedLength(text);
    const sentences = text.split(/[.!?。！？]+/).filter((s) => s.trim().length > 0).length;
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length || 1;
    const wordsPerMin = 200;
    const totalSeconds = Math.ceil((words.length / wordsPerMin) * 60);
    const readMin = Math.floor(totalSeconds / 60);
    const readSec = totalSeconds % 60;

    const freq: Record<string, number> = {};
    words.forEach((w) => {
      const clean = w.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
      if (clean.length > 1) freq[clean] = (freq[clean] ?? 0) + 1;
    });
    const topWords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { wordCount: words.length, charCount, charNoSpace, byteCount, xWeighted, sentences, paragraphs, readMin, readSec, topWords };
  }, [text]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 font-sans">
      <h1 className="text-2xl font-bold text-center text-success">{t.title}</h1>

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.placeholder}
          className="w-full min-h-[220px] rounded-2xl border border-success/30 bg-white/80 p-4 text-sm leading-relaxed text-foreground shadow-sm outline-none focus:ring-2 focus:ring-success/30 resize-y"
          aria-label={t.placeholder}
        />
        {text && (
          <button
            type="button"
            onClick={() => setText('')}
            className="absolute top-3 right-3 rounded-xl bg-success/15 px-3 py-1 text-xs font-bold text-success hover:bg-success/20 transition-colors"
            aria-label={t.clear}
          >
            {t.clear}
          </button>
        )}
      </div>

      {!stats && (
        <p className="text-center text-sm text-muted-foreground">{t.noText}</p>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: t.words, value: stats.wordCount.toLocaleString() },
              { label: t.chars, value: stats.charCount.toLocaleString() },
              { label: t.charsNoSpace, value: stats.charNoSpace.toLocaleString() },
              { label: t.bytes, value: stats.byteCount.toLocaleString() },
              { label: t.sentences, value: stats.sentences.toLocaleString() },
              { label: t.paragraphs, value: stats.paragraphs.toLocaleString() },
              {
                label: t.readingTime,
                value: stats.readMin > 0
                  ? `${stats.readMin}${t.minutes} ${stats.readSec}${t.seconds}`
                  : `${stats.readSec}${t.seconds}`,
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-2xl bg-success/10 border border-success/20 px-4 py-3 text-center shadow-sm"
              >
                <div className="text-xl font-bold text-success">{value}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-success/20 bg-white/70 p-4 shadow-sm">
            <h2 className="text-sm font-bold text-success mb-1">{t.platformTitle}</h2>
            <p className="text-xs text-muted-foreground mb-4">{t.platformNote}</p>
            <div className="space-y-3">
              {PLATFORM_LIMITS.map(({ key, limit, kind }) => {
                const used = kind === 'weighted' ? stats.xWeighted : stats.charCount;
                const pct = Math.min((used / limit) * 100, 100);
                const isOver = used > limit;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-muted-foreground">{t.platforms[key]}</span>
                      <span className={isOver ? 'font-bold text-red-500' : 'text-muted-foreground'}>
                        {used.toLocaleString()} / {limit.toLocaleString()}
                        {isOver && ` (+${(used - limit).toLocaleString()} ${t.over})`}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-success/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isOver ? 'bg-red-500' : 'bg-success/50'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {stats.topWords.length > 0 && (
            <div className="rounded-2xl border border-success/20 bg-white/70 p-4 shadow-sm">
              <h2 className="text-sm font-bold text-success mb-3">{t.topWords}</h2>
              <ol className="space-y-2">
                {stats.topWords.map(([word, count], i) => (
                  <li key={word} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-success/15 text-success text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-bold text-muted-foreground">{word}</span>
                    <span className="text-xs text-muted-foreground">{count} {t.times}</span>
                    <div
                      className="h-2 rounded-full bg-success/40"
                      style={{ width: `${Math.min((count / (stats.topWords[0]?.[1] ?? 1)) * 80, 80)}px` }}
                      role="presentation"
                    />
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WordCounterTool;
