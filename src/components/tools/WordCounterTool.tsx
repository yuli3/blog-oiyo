import React, { useState, useMemo } from 'react';

const WordCounterTool: React.FC<{ locale?: 'ko' | 'en' }> = ({ locale = 'ko' }) => {
  const t = locale === 'ko'
    ? {
        title: '글자수 세기 & 단어 수 계산기',
        placeholder: '여기에 텍스트를 붙여넣거나 입력하세요...',
        clear: '지우기',
        words: '단어 수',
        chars: '글자 수',
        charsNoSpace: '공백 제외',
        sentences: '문장 수',
        paragraphs: '단락 수',
        readingTime: '읽기 시간',
        minutes: '분',
        seconds: '초',
        topWords: '자주 쓴 단어 TOP 5',
        times: '회',
        noText: '텍스트를 입력하면 통계가 표시됩니다.',
      }
    : {
        title: 'Word & Character Counter',
        placeholder: 'Paste or type your text here...',
        clear: 'Clear',
        words: 'Words',
        chars: 'Characters',
        charsNoSpace: 'No Spaces',
        sentences: 'Sentences',
        paragraphs: 'Paragraphs',
        readingTime: 'Reading Time',
        minutes: 'min',
        seconds: 'sec',
        topWords: 'Top 5 Words',
        times: 'times',
        noText: 'Enter text to see statistics.',
      };

  const [text, setText] = useState('');

  const stats = useMemo(() => {
    if (!text.trim()) return null;

    const words = text.trim().split(/\s+/).filter(Boolean);
    const charCount = text.length;
    const charNoSpace = text.replace(/\s/g, '').length;
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

    return { wordCount: words.length, charCount, charNoSpace, sentences, paragraphs, readMin, readSec, topWords };
  }, [text]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 font-sans">
      <h1 className="text-2xl font-bold text-center text-emerald-800">{t.title}</h1>

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.placeholder}
          className="w-full min-h-[220px] rounded-2xl border border-emerald-200 bg-white/80 p-4 text-sm leading-relaxed text-gray-800 shadow-sm outline-none focus:ring-2 focus:ring-emerald-400 resize-y"
          aria-label={t.placeholder}
        />
        {text && (
          <button
            type="button"
            onClick={() => setText('')}
            className="absolute top-3 right-3 rounded-xl bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-200 transition-colors"
            aria-label={t.clear}
          >
            {t.clear}
          </button>
        )}
      </div>

      {!stats && (
        <p className="text-center text-sm text-gray-400">{t.noText}</p>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: t.words, value: stats.wordCount.toLocaleString() },
              { label: t.chars, value: stats.charCount.toLocaleString() },
              { label: t.charsNoSpace, value: stats.charNoSpace.toLocaleString() },
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
                className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-center shadow-sm"
              >
                <div className="text-xl font-bold text-emerald-700">{value}</div>
                <div className="text-xs text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>

          {stats.topWords.length > 0 && (
            <div className="rounded-2xl border border-emerald-100 bg-white/70 p-4 shadow-sm">
              <h2 className="text-sm font-bold text-emerald-800 mb-3">{t.topWords}</h2>
              <ol className="space-y-2">
                {stats.topWords.map(([word, count], i) => (
                  <li key={word} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-bold text-gray-700">{word}</span>
                    <span className="text-xs text-gray-400">{count} {t.times}</span>
                    <div
                      className="h-2 rounded-full bg-emerald-300"
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
