import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { RotateCcw, Trophy, Sparkles } from 'lucide-react';

interface Props {
  locale: string;
}

const SAMPLE_TEXTS: Record<string, string[]> = {
  ko: [
    "동해 물과 백두산이 마르고 닳도록 하느님이 보우하사 우리나라 만세.",
    "빠른 갈색 여우가 게으른 개를 뛰어넘습니다. 성실한 노력은 결코 배신하지 않습니다.",
    "오늘 걷지 않으면 내일은 뛰어야 한다. 배움에는 끝이 없고 생각에는 국경이 없다.",
    "키보드를 두드리는 순간마다 당신의 생각과 아이디어가 현실로 기록됩니다.",
  ],
  en: [
    "The quick brown fox jumps over the lazy dog near the riverbank.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.",
    "Typing fast and accurately is one of the most valuable foundational skills in modern technology.",
  ],
  ja: [
    "色はにほへど散りぬるを我が世たれぞ常ならむ有為の奥山今日越えて浅き夢見じ酔ひもせず。",
    "継続は力なり。毎日少しずつの積み重ねが、やがて大きな成果を生み出します。",
  ],
  zh: [
    "千里之行，始于足下。不积跬步，无以至千里；不积小流，无以成江海。",
    "快速而准确的打字是数字时代不可或缺的核心技能，每一次敲击都记录着思考。",
  ],
  fr: [
    "Portez ce vieux whisky au juge blond qui fume sur son île paisible.",
    "Le succès n'est pas la clé du bonheur. Le bonheur est la clé du succès.",
  ],
  es: [
    "El veloz murciélago hindú comía feliz cardillo y kiwi bajo la sombra.",
    "La perseverancia transforma los pequeños esfuerzos diarios en logros extraordinarios.",
  ],
};

function getTier(cpm: number, isKo: boolean): { name: string; rank: string; color: string } {
  if (cpm >= 600) return { name: isKo ? "그랜드마스터 (속기사급)" : "Grandmaster", rank: "Top 0.5%", color: "text-warning" };
  if (cpm >= 450) return { name: isKo ? "1급 (전문가)" : "Tier 1 Expert", rank: "Top 5%", color: "text-primary" };
  if (cpm >= 300) return { name: isKo ? "2급 (숙련자)" : "Tier 2 Proficient", rank: "Top 25%", color: "text-success" };
  if (cpm >= 200) return { name: isKo ? "3급 (일반 실무)" : "Tier 3 Standard", rank: "Average", color: "text-foreground" };
  return { name: isKo ? "연습 필요" : "Novice", rank: "Practice Needed", color: "text-muted-foreground" };
}

export default function TypingSpeedCalculator({ locale = 'ko' }: Props) {
  const isKo = locale === 'ko';
  const texts = SAMPLE_TEXTS[locale] || SAMPLE_TEXTS.en;

  const [textIndex, setTextIndex] = useState(0);
  const targetText = texts[textIndex % texts.length];

  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const timerRef = useRef<number | null>(null);

  // Live timer
  useEffect(() => {
    if (startTime && !isFinished) {
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((Date.now() - startTime) / 1000);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTime, isFinished]);

  // Calculate live stats
  const { correctChars, totalTyped, accuracy, cpm, wpm } = useMemo(() => {
    let correct = 0;
    const typed = userInput.length;
    for (let i = 0; i < typed; i++) {
      if (userInput[i] === targetText[i]) correct++;
    }
    const acc = typed > 0 ? (correct / typed) * 100 : 100;
    const minutes = Math.max(elapsedSeconds / 60, 0.01);
    const calculatedCpm = startTime ? Math.round((correct / minutes)) : 0;
    const calculatedWpm = Math.round(calculatedCpm / 5);

    return {
      correctChars: correct,
      totalTyped: typed,
      accuracy: Number(acc.toFixed(1)),
      cpm: calculatedCpm,
      wpm: calculatedWpm,
    };
  }, [userInput, targetText, elapsedSeconds, startTime]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (!startTime && val.length > 0) {
      setStartTime(Date.now());
    }

    setUserInput(val);

    if (val.length >= targetText.length) {
      setIsFinished(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resetTest = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setUserInput('');
    setStartTime(null);
    setElapsedSeconds(0);
    setIsFinished(false);
  }, []);

  const nextText = useCallback(() => {
    resetTest();
    setTextIndex((prev) => prev + 1);
  }, [resetTest]);

  const tier = getTier(cpm, isKo);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6">
      {/* Target Sentence Display with character matching */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>{isKo ? "제시된 문장" : "Target Prompt"}</span>
          <span>{userInput.length} / {targetText.length}</span>
        </div>
        <div className="p-4 rounded-xl border border-border bg-muted/40 font-mono text-base sm:text-lg leading-relaxed tracking-wide select-none">
          {targetText.split('').map((char, idx) => {
            let color = "text-muted-foreground/60";
            let bg = "";
            if (idx < userInput.length) {
              if (userInput[idx] === char) {
                color = "text-success font-bold";
              } else {
                color = "text-destructive font-bold";
                bg = "bg-destructive/20 rounded-xs";
              }
            } else if (idx === userInput.length) {
              bg = "border-b-2 border-primary animate-pulse";
            }
            return (
              <span key={idx} className={`${color} ${bg}`}>
                {char}
              </span>
            );
          })}
        </div>
      </div>

      {/* Typing Input Field */}
      <div>
        <textarea
          rows={3}
          value={userInput}
          onChange={handleInputChange}
          disabled={isFinished}
          placeholder={isKo ? "위 문장을 보고 입력하면 측정이 자동 시작됩니다..." : "Type the prompt above to automatically begin measuring..."}
          className="w-full rounded-xl border border-input bg-background p-4 text-base sm:text-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-primary leading-relaxed resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={resetTest}
          className="px-4 py-2 rounded-xl border border-border hover:bg-muted font-bold text-xs flex items-center gap-2 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          {isKo ? "다시 치기" : "Restart"}
        </button>
        <button
          onClick={nextText}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-2 shadow-xs hover:opacity-90 transition-opacity"
        >
          <Sparkles className="w-4 h-4" />
          {isKo ? "다음 문장" : "Next Prompt"}
        </button>
      </div>

      {/* Live Measurement Results */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-border">
        <div className="p-4 rounded-xl border border-border bg-background text-center">
          <div className="text-xs text-muted-foreground font-medium mb-1">CPM (타/분)</div>
          <div className="text-2xl sm:text-3xl font-black text-foreground">{cpm}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Characters / min</div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-background text-center">
          <div className="text-xs text-muted-foreground font-medium mb-1">WPM (단어/분)</div>
          <div className="text-2xl sm:text-3xl font-black text-foreground">{wpm}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Words / min</div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-background text-center">
          <div className="text-xs text-muted-foreground font-medium mb-1">{isKo ? "정확도" : "Accuracy"}</div>
          <div className="text-2xl sm:text-3xl font-black text-success">{accuracy}%</div>
          <div className="text-xs text-muted-foreground mt-0.5">{correctChars}/{totalTyped}</div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-background text-center">
          <div className="text-xs text-muted-foreground font-medium mb-1">{isKo ? "소요 시간" : "Time"}</div>
          <div className="text-2xl sm:text-3xl font-black text-foreground">{elapsedSeconds.toFixed(1)}s</div>
          <div className="text-xs text-muted-foreground mt-0.5">{isFinished ? (isKo ? "완료됨" : "Finished") : (isKo ? "측정 중" : "Running")}</div>
        </div>
      </div>

      {/* Grade / Tier Evaluation Card */}
      {cpm > 0 && (
        <div className="p-5 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-warning" />
            <div>
              <div className="text-xs text-muted-foreground font-medium">{isKo ? "판정 등급" : "Evaluated Tier"}</div>
              <div className={`text-lg font-black ${tier.color}`}>{tier.name}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground font-medium">{isKo ? "국내 상위 백분위" : "Percentile"}</div>
            <div className="text-sm font-bold text-foreground">{tier.rank}</div>
          </div>
        </div>
      )}
    </div>
  );
}
