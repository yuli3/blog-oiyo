import React, { useState, useMemo } from 'react';
import { GameContainer } from '../ui/game/GamePrimitives';

interface Props {
  locale?: string;
}

const PRESETS = [
  { label: '매 5분마다', cron: '*/5 * * * *', labelEn: 'Every 5 mins' },
  { label: '매시간 정각', cron: '0 * * * *', labelEn: 'Hourly' },
  { label: '매일 자정', cron: '0 0 * * *', labelEn: 'Daily Midnight' },
  { label: '매주 평일 오전 9시', cron: '0 9 * * 1-5', labelEn: 'Weekdays 9 AM' },
  { label: '매월 1일 새벽 2시', cron: '0 2 1 * *', labelEn: '1st of Month 2 AM' },
];

const DAYS_KO = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function explainCronSimple(cronStr: string, isKo: boolean): string {
  const parts = cronStr.trim().split(/\s+/);
  if (parts.length !== 5) {
    return isKo ? '5개 필드(분 시 일 월 요일)를 입력해주세요.' : 'Please enter 5 fields (min hour day month dow).';
  }

  const [min, hour, dom, mon, dow] = parts;

  if (min === '*' && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
    return isKo ? '매 1분마다 실행' : 'Runs every minute';
  }
  if (min.startsWith('*/') && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
    const step = min.substring(2);
    return isKo ? `매 ${step}분마다 실행` : `Runs every ${step} minutes`;
  }
  if (min === '0' && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
    return isKo ? '매시간 0분(정각)에 실행' : 'Runs every hour on the hour';
  }
  if (min === '0' && hour.startsWith('*/') && dom === '*' && mon === '*' && dow === '*') {
    const step = hour.substring(2);
    return isKo ? `매 ${step}시간마다 정각에 실행` : `Runs every ${step} hours`;
  }

  // Format time
  let timeStr = '';
  if (min !== '*' && hour !== '*') {
    const h = parseInt(hour, 10);
    const m = parseInt(min, 10);
    if (!isNaN(h) && !isNaN(m)) {
      if (isKo) {
        const ampm = h < 12 ? '오전' : '오후';
        const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
        timeStr = `${ampm} ${displayH}시 ${m}분`;
      } else {
        const ampm = h < 12 ? 'AM' : 'PM';
        const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
        timeStr = `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
      }
    }
  }

  let dowStr = '';
  if (dow === '1-5') dowStr = isKo ? '매주 평일(월~금)' : 'Monday through Friday';
  else if (dow === '0,6' || dow === '6,0') dowStr = isKo ? '매주 주말' : 'on weekends';
  else if (dow !== '*') {
    const idx = parseInt(dow, 10);
    if (!isNaN(idx) && idx >= 0 && idx <= 6) {
      dowStr = isKo ? `매주 ${DAYS_KO[idx]}` : `on ${DAYS_EN[idx]}`;
    }
  }

  let domStr = '';
  if (dom !== '*') {
    domStr = isKo ? `매월 ${dom}일` : `on day ${dom} of the month`;
  }

  if (isKo) {
    const tokens = [domStr, dowStr, timeStr].filter(Boolean);
    return tokens.length > 0 ? `${tokens.join(' ')}에 실행` : `크론식: ${cronStr}`;
  } else {
    const tokens = [timeStr ? `At ${timeStr}` : '', dowStr, domStr].filter(Boolean);
    return tokens.length > 0 ? tokens.join(', ') : `Schedule: ${cronStr}`;
  }
}

function textToCronSimple(text: string): string {
  const norm = text.toLowerCase().trim();
  if (norm.includes('1분') || norm.includes('every minute')) return '* * * * *';
  const minMatch = norm.match(/(?:every|매)\s*(\d+)\s*(?:minutes?|분마다|분)/);
  if (minMatch) return `*/${minMatch[1]} * * * *`;
  if (norm.includes('every hour') || norm.includes('매시간')) return '0 * * * *';
  const hourMatch = norm.match(/(?:every|매)\s*(\d+)\s*(?:hours?|시간마다|시간)/);
  if (hourMatch) return `0 */${hourMatch[1]} * * *`;
  if (norm.includes('midnight') || norm.includes('자정')) return '0 0 * * *';
  if (norm.includes('weekday') || norm.includes('평일')) return '0 9 * * 1-5';

  const timeMatch = norm.match(/(?:at|오전|오후)?\s*(\d{1,2})(?::(\d{2})|시\s*(\d{1,2})?분?)/);
  if (timeMatch) {
    let h = parseInt(timeMatch[1], 10);
    const m = parseInt(timeMatch[2] || timeMatch[3] || '0', 10);
    if (norm.includes('오후') || norm.includes('pm')) {
      if (h < 12) h += 12;
    }
    return `${m} ${h} * * *`;
  }
  return '0 0 * * *';
}

export default function CronHumanCalculator({ locale = 'ko' }: Props) {
  const isKo = locale === 'ko';
  const [tab, setTab] = useState<'cronToHuman' | 'humanToCron'>('cronToHuman');
  const [cronInput, setCronInput] = useState('*/15 * * * *');
  const [naturalInput, setNaturalInput] = useState('매주 평일 오전 9시');
  const [copied, setCopied] = useState(false);

  const explanation = useMemo(() => explainCronSimple(cronInput, isKo), [cronInput, isKo]);
  const generatedCron = useMemo(() => textToCronSimple(naturalInput), [naturalInput]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <GameContainer
      title={isKo ? '크론식 자연어 변환기' : 'Cron to Human Readable Schedule'}
      subtitle={isKo ? '크론 표현식 ↔ 한글/영어 자연어 양방향 해석기' : 'Bidirectional Crontab Schedule Translator'}
      onReset={() => {
        setCronInput('*/15 * * * *');
        setNaturalInput('매주 평일 오전 9시');
      }}
    >
      <div className="w-full space-y-6">
        {/* Mode switcher tabs */}
        <div className="flex rounded-xl bg-muted/40 p-1 border border-border">
          <button
            onClick={() => setTab('cronToHuman')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'cronToHuman' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {isKo ? '크론식 ➔ 자연어 해석' : 'Cron ➔ Natural Language'}
          </button>
          <button
            onClick={() => setTab('humanToCron')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'humanToCron' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {isKo ? '자연어 ➔ 크론식 생성' : 'Natural Language ➔ Cron'}
          </button>
        </div>

        {tab === 'cronToHuman' ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">
                {isKo ? '5필드 크론 표현식 입력 (분 시 일 월 요일)' : 'Enter 5-field Cron Expression'}
              </label>
              <input
                type="text"
                value={cronInput}
                onChange={(e) => setCronInput(e.target.value)}
                placeholder="*/15 * * * *"
                className="w-full font-mono text-base bg-muted/20 px-4 py-3 rounded-xl border border-border text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              {PRESETS.map((p) => (
                <button
                  key={p.cron}
                  onClick={() => setCronInput(p.cron)}
                  className="text-xs font-medium bg-card hover:bg-muted/60 px-3 py-1.5 rounded-lg border border-border text-foreground transition-colors"
                >
                  {isKo ? p.label : p.labelEn}
                </button>
              ))}
            </div>

            {/* Result Box */}
            <div className="mt-4 p-5 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                {isKo ? '일정 해석 결과' : 'Schedule Meaning'}
              </span>
              <p className="text-lg font-bold text-foreground leading-relaxed">{explanation}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">
                {isKo ? '원하는 실행 주기 입력' : 'Describe your schedule in natural words'}
              </label>
              <input
                type="text"
                value={naturalInput}
                onChange={(e) => setNaturalInput(e.target.value)}
                placeholder={isKo ? '예: 매 10분마다, 평일 오전 9시' : 'e.g. every 10 minutes, weekdays at 9am'}
                className="w-full text-base bg-muted/20 px-4 py-3 rounded-xl border border-border text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Generated Cron Box */}
            <div className="mt-4 p-5 rounded-2xl bg-card border border-border space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {isKo ? '생성된 5필드 크론식' : 'Generated 5-Field Cron'}
                </span>
                <button
                  onClick={() => copyToClipboard(generatedCron)}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  {copied ? (isKo ? '복사 완료!' : 'Copied!') : isKo ? '복사하기' : 'Copy'}
                </button>
              </div>
              <p className="text-2xl font-mono font-bold text-primary tracking-widest">{generatedCron}</p>
            </div>
          </div>
        )}
      </div>
    </GameContainer>
  );
}
