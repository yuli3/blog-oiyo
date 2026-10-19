import { useState, useMemo } from 'react';
import type { Locale } from '../../lib/i18n';
import { Calendar, User, Clock, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface Props {
  locale: Locale;
}

const ZODIAC_ANIMALS_KO = [
  "원숭이 (申)", "닭 (酉)", "개 (戌)", "돼지 (亥)",
  "쥐 (子)", "소 (丑)", "호랑이 (寅)", "토끼 (卯)",
  "용 (辰)", "뱀 (巳)", "말 (午)", "양 (未)",
];

const ZODIAC_ANIMALS_EN = [
  "Monkey", "Rooster", "Dog", "Pig",
  "Rat", "Ox", "Tiger", "Rabbit",
  "Dragon", "Snake", "Horse", "Goat",
];

// Korean law only: ko, plus en for people living in Korea. Other locales use AgeCountryCalculator.
const UI_TEXT: Record<"ko" | "en", {
  title: string;
  subtitle: string;
  birthdate: string;
  baseDate: string;
  internationalAge: string;
  yearAge: string;
  traditionalAge: string;
  zodiacSign: string;
  daysAlive: string;
  nextBirthday: string;
  milestonesTitle: string;
  elementary: string;
  idCard: string;
  license: string;
  voting: string;
  adultLiquor: string;
  pensionAge: string;
  eligible: string;
  remaining: string;
  manAge: (n: number) => string;
  yearsUnit: string;
  toBirthday: (d: number) => string;
  yearAgeNote: string;
  tradAgeNote: string;
  days: (n: string) => string;
  baseYear: (y: number) => string;
}> = {
  ko: {
    title: "만 나이 & 법적 연령 조견표 계산기",
    subtitle: "생년월일을 기준으로 법정 만 나이, 연 나이, 12간지 띠 및 선거·운전·정년·연금 개시 연령을 판정합니다.",
    birthdate: "생년월일 선택",
    baseDate: "기준일",
    internationalAge: "만 나이 (법적 표준)",
    yearAge: "연 나이 (병역·청소년보호법)",
    traditionalAge: "세는 나이 (한국식 구 나이)",
    zodiacSign: "12간지 띠",
    daysAlive: "살아온 날수",
    nextBirthday: "다음 생일까지",
    milestonesTitle: "주요 생애 주기 및 법적 자격 취득표",
    elementary: "초등학교 입학",
    idCard: "주민등록증 발급 (만 17세)",
    license: "운전면허 취득 자격 (만 18세)",
    voting: "공직선거 투표권 (만 18세)",
    adultLiquor: "술·담배 구매 가능 (연 19세)",
    pensionAge: "국민연금 수령 개시 연령",
    eligible: "도달 완료",
    remaining: "년 남음",
    manAge: (n) => `만 ${n}`,
    yearsUnit: "세",
    toBirthday: (d) => `다음 생일까지 ${d}일 남음`,
    yearAgeNote: "현재 연도 - 출생 연도",
    tradAgeNote: "한국식 태어난 해 1세 기준",
    days: (n) => `${n}일`,
    baseYear: (y) => `기준 연도: ${y}년`,
  },
  en: {
    title: "International & Legal Age Calculator",
    subtitle: "Calculate your international age, Korean age, Chinese zodiac animal, and official legal milestone eligibility.",
    birthdate: "Select Birthdate",
    baseDate: "Reference Date",
    internationalAge: "International Age",
    yearAge: "Calendar Year Age",
    traditionalAge: "Traditional Korean Age",
    zodiacSign: "Zodiac Sign",
    daysAlive: "Days Alive",
    nextBirthday: "Days until Next Birthday",
    milestonesTitle: "Life Milestones & Legal Eligibility Matrix",
    elementary: "Primary School Entry",
    idCard: "National ID Card (Age 17)",
    license: "Driver's License (Age 18)",
    voting: "Voting Rights (Age 18)",
    adultLiquor: "Legal Adult Purchases (Year 19)",
    pensionAge: "State Pension Starting Age",
    eligible: "Reached",
    remaining: "yr left",
    manAge: (n) => `${n}`,
    yearsUnit: "yrs",
    toBirthday: (d) => `${d} days to next birthday`,
    yearAgeNote: "Current year − birth year",
    tradAgeNote: "Counts 1 at birth, +1 every Jan 1",
    days: (n) => `${n} days`,
    baseYear: (y) => `Year reached: ${y}`,
  },
};

export default function KoreanAgeCalculator({ locale }: Props) {
  const [birthdateStr, setBirthdateStr] = useState<string>("2000-05-15");
  const [baseDateStr, setBaseDateStr] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const t = locale === "ko" ? UI_TEXT.ko : UI_TEXT.en;

  const calculations = useMemo(() => {
    const bDate = new Date(birthdateStr);
    const cDate = new Date(baseDateStr);

    if (isNaN(bDate.getTime()) || isNaN(cDate.getTime())) {
      return null;
    }

    const bYear = bDate.getFullYear();
    const bMonth = bDate.getMonth();
    const bDay = bDate.getDate();

    const cYear = cDate.getFullYear();
    const cMonth = cDate.getMonth();
    const cDay = cDate.getDate();

    // 1. 만 나이 (International Age)
    let intAge = cYear - bYear;
    if (cMonth < bMonth || (cMonth === bMonth && cDay < bDay)) {
      intAge -= 1;
    }

    // 2. 연 나이 (Year Age)
    const yearAge = cYear - bYear;

    // 3. 세는 나이 (Traditional Korean Age)
    const tradAge = cYear - bYear + 1;

    // 4. Zodiac Animal (based on Gregorian birth year index)
    const zodiacIdx = bYear % 12;
    const zodiacAnimal =
      locale === "ko" ? ZODIAC_ANIMALS_KO[zodiacIdx] : ZODIAC_ANIMALS_EN[zodiacIdx];

    // 5. Days alive
    const diffTime = Math.max(0, cDate.getTime() - bDate.getTime());
    const daysAlive = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // 6. Next Birthday
    let nextBdayYear = cYear;
    const thisYearBday = new Date(nextBdayYear, bMonth, bDay);
    if (thisYearBday < cDate) {
      nextBdayYear += 1;
    }
    const nextBday = new Date(nextBdayYear, bMonth, bDay);
    const daysToNextBday = Math.ceil(
      (nextBday.getTime() - cDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // 7. National Pension starting age by birth year
    let pensionAge = 65;
    if (bYear <= 1952) pensionAge = 60;
    else if (bYear <= 1956) pensionAge = 61;
    else if (bYear <= 1960) pensionAge = 62;
    else if (bYear <= 1964) pensionAge = 63;
    else if (bYear <= 1968) pensionAge = 64;

    const milestones = [
      {
        title: t.elementary,
        targetAge: 7,
        currentAge: intAge,
        year: bYear + 7,
      },
      {
        title: t.idCard,
        targetAge: 17,
        currentAge: intAge,
        year: bYear + 17,
      },
      {
        title: t.license,
        targetAge: 18,
        currentAge: intAge,
        year: bYear + 18,
      },
      {
        title: t.voting,
        targetAge: 18,
        currentAge: intAge,
        year: bYear + 18,
      },
      {
        title: t.adultLiquor,
        targetAge: 19,
        currentAge: yearAge,
        year: bYear + 19,
      },
      {
        title: `${t.pensionAge} (만 ${pensionAge}세)`,
        targetAge: pensionAge,
        currentAge: intAge,
        year: bYear + pensionAge,
      },
    ];

    return {
      intAge: Math.max(0, intAge),
      yearAge: Math.max(0, yearAge),
      tradAge: Math.max(0, tradAge),
      zodiacAnimal,
      daysAlive,
      daysToNextBday,
      milestones,
    };
  }, [birthdateStr, baseDateStr, locale, t]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Date Inputs Panel */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{t.birthdate}</span>
            </label>
            <input
              type="date"
              value={birthdateStr}
              onChange={(e) => setBirthdateStr(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              <span>{t.baseDate}</span>
            </label>
            <input
              type="date"
              value={baseDateStr}
              onChange={(e) => setBaseDateStr(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {calculations && (
        <>
          {/* Main 3 Age Results Grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5 text-center shadow-sm">
              <span className="text-xs font-bold text-primary block">{t.internationalAge}</span>
              <div className="mt-2 text-3xl sm:text-4xl font-black text-foreground font-mono">
                {t.manAge(calculations.intAge)}
                <span className="text-base font-bold text-muted-foreground ml-1">{t.yearsUnit}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t.toBirthday(calculations.daysToNextBday)}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
              <span className="text-xs font-bold text-muted-foreground block">{t.yearAge}</span>
              <div className="mt-2 text-3xl sm:text-4xl font-black text-foreground font-mono">
                {calculations.yearAge}
                <span className="text-base font-bold text-muted-foreground ml-1">{t.yearsUnit}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t.yearAgeNote}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
              <span className="text-xs font-bold text-muted-foreground block">{t.traditionalAge}</span>
              <div className="mt-2 text-3xl sm:text-4xl font-black text-foreground font-mono">
                {calculations.tradAge}
                <span className="text-base font-bold text-muted-foreground ml-1">{t.yearsUnit}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t.tradAgeNote}
              </p>
            </div>
          </div>

          {/* Secondary Details (Zodiac & Days alive) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <span className="text-xs font-bold text-foreground">{t.zodiacSign}</span>
              </div>
              <span className="text-sm font-black text-primary">
                {calculations.zodiacAnimal}
              </span>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <span className="text-xs font-bold text-foreground">{t.daysAlive}</span>
              </div>
              <span className="text-sm font-mono font-bold text-foreground">
                {t.days(calculations.daysAlive.toLocaleString())}
              </span>
            </div>
          </div>

          {/* Legal Milestones Matrix */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>{t.milestonesTitle}</span>
            </h3>

            <div className="divide-y divide-border/60">
              {calculations.milestones.map((m, idx) => {
                const isReached = m.currentAge >= m.targetAge;
                const diff = m.targetAge - m.currentAge;

                return (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-foreground block">{m.title}</span>
                      <span className="text-muted-foreground">
                        {t.baseYear(m.year)}
                      </span>
                    </div>

                    <div>
                      {isReached ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-success/10 text-success font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t.eligible}</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium font-mono">
                          {diff}{t.remaining}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
