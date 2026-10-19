import { useState, useMemo } from 'react';
import type { Locale } from '../../lib/i18n';
import { Calendar, Clock, DollarSign, HelpCircle, Briefcase, AlertCircle } from 'lucide-react';

interface Props {
  locale: Locale;
}

// Korean Labor Standards Act only: ko, plus en for people working in Korea. Other locales use
// AnnualLeaveCountryCalculator with their own country's law.
const UI_TEXT: Record<"ko" | "en", {
  title: string;
  subtitle: string;
  yearsService: string;
  hourlyWage: string;
  dailyHours: string;
  unusedDays: string;
  statutoryDays: string;
  dailyWage: string;
  totalAllowance: string;
  formulaNote: string;
  promotionTitle: string;
  promotionDesc: string;
  accountingNote: string;
  unitYears: string;
  unitWon: string;
  unitDays: string;
  hoursOption: (h: number) => string;
  underOneYear: string;
  baseNote: string;
  dailyWageNote: (h: number) => string;
  allowanceNote: (d: number) => string;
}> = {
  ko: {
    title: "연차 발생일수 & 미사용 연차수당 계산기",
    subtitle: "근속연수에 따른 근로기준법 법정 연차 휴가 일수(최대 25일)와 미사용 연차에 대한 통상임금 보상 수당을 정밀 산출합니다.",
    yearsService: "근속연수 (입사 연차)",
    hourlyWage: "통상시급 (원)",
    dailyHours: "1일 소정 근로시간",
    unusedDays: "미사용 잔여 연차일수",
    statutoryDays: "법정 발생 연차일수",
    dailyWage: "1일 통상임금",
    totalAllowance: "미사용 연차수당 총액",
    formulaNote: "근로기준법 제60조: 1년 미만 매월 1일(최대 11일), 1년 이상 15일, 이후 매 2년마다 1일 가산(최대 25일).",
    promotionTitle: "연차유급휴가 사용촉진제도 주의사항",
    promotionDesc: "회사가 법정 절차에 따라 서면으로 연차 사용을 촉진하고 시기를 지정하였음에도 근로자가 사용하지 않은 경우, 회사는 미사용 연차수당 지급 의무가 면제됩니다.",
    accountingNote: "회계연도 기준(1월 1일)과 입사일 기준 정산 시 퇴사 시점에는 근로자에게 더 유리한 일수를 보장해야 합니다.",
    unitYears: "년차",
    unitWon: "원",
    unitDays: "일",
    hoursOption: (h) => `${h}시간${h === 8 ? " (전일제)" : h === 4 ? " (단시간)" : ""}`,
    underOneYear: "1년 미만 월차 기준",
    baseNote: "기본 15일 + 근속가산",
    dailyWageNote: (h) => `시급 × 1일 ${h}시간`,
    allowanceNote: (d) => `잔여 ${d}일 × 1일 통상임금`,
  },
  en: {
    title: "Annual Paid Leave & Allowance Calculator",
    subtitle: "Calculate your statutory annual leave entitlement (up to 25 days) and unused leave cash-out allowance based on ordinary wages.",
    yearsService: "Years of Service",
    hourlyWage: "Ordinary Hourly Wage",
    dailyHours: "Contractual Daily Hours",
    unusedDays: "Unused Leave Days",
    statutoryDays: "Statutory Leave Entitlement",
    dailyWage: "Daily Ordinary Wage",
    totalAllowance: "Total Unused Leave Allowance",
    formulaNote: "Korean Labor Standards Act, Art. 60: 1 day per month in the first year (max 11), 15 days after 1 year, +1 day every 2 years thereafter (capped at 25 days).",
    promotionTitle: "Leave Promotion Scheme Note",
    promotionDesc: "If the employer formally initiates the statutory leave promotion process in writing and the employee fails to use the leave, the employer may be exempt from paying cash-out allowances.",
    accountingNote: "When calculating by fiscal year vs. hire date, the method more advantageous to the employee must be guaranteed upon departure.",
    unitYears: "yrs",
    unitWon: "KRW",
    unitDays: "days",
    hoursOption: (h) => `${h} hours${h === 8 ? " (full-time)" : h === 4 ? " (part-time)" : ""}`,
    underOneYear: "Under 1 year: 1 day per full month",
    baseNote: "15 days + seniority days",
    dailyWageNote: (h) => `Hourly wage × ${h} hours`,
    allowanceNote: (d) => `${d} unused days × daily ordinary wage`,
  },
};

export default function AnnualLeaveCalculator({ locale }: Props) {
  const [yearsService, setYearsService] = useState<number>(3);
  const [hourlyWage, setHourlyWage] = useState<number>(12000);
  const [dailyHours, setDailyHours] = useState<number>(8);
  const [unusedDays, setUnusedDays] = useState<number>(5);

  const t = locale === "ko" ? UI_TEXT.ko : UI_TEXT.en;

  const result = useMemo(() => {
    const years = Math.max(0, yearsService);
    const wage = Math.max(0, hourlyWage);
    const hours = Math.max(1, Math.min(12, dailyHours));
    const unused = Math.max(0, unusedDays);

    let statutoryDays = 0;
    if (years < 1) {
      statutoryDays = 11;
    } else {
      const extra = Math.floor((years - 1) / 2);
      statutoryDays = Math.min(25, 15 + extra);
    }

    const dailyWage = wage * hours;
    const totalAllowance = Math.floor(unused * dailyWage);

    return {
      statutoryDays,
      dailyWage,
      totalAllowance,
    };
  }, [yearsService, hourlyWage, dailyHours, unusedDays]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Inputs Panel */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-primary" />
              <span>{t.yearsService}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="40"
                value={yearsService}
                onChange={(e) => setYearsService(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-muted-foreground font-medium">{t.unitYears}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-primary" />
              <span>{t.hourlyWage}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="500"
                value={hourlyWage}
                onChange={(e) => setHourlyWage(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-muted-foreground font-medium">{t.unitWon}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              <span>{t.dailyHours}</span>
            </label>
            <select
              value={dailyHours}
              onChange={(e) => setDailyHours(parseInt(e.target.value) || 8)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="8">{t.hoursOption(8)}</option>
              <option value="7">{t.hoursOption(7)}</option>
              <option value="6">{t.hoursOption(6)}</option>
              <option value="5">{t.hoursOption(5)}</option>
              <option value="4">{t.hoursOption(4)}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{t.unusedDays}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="30"
                step="0.5"
                value={unusedDays}
                onChange={(e) => setUnusedDays(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-muted-foreground font-medium">{t.unitDays}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Output Results */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
          <span className="text-xs font-bold text-muted-foreground block">{t.statutoryDays}</span>
          <div className="mt-2 text-3xl font-black text-foreground font-mono">
            {result.statutoryDays}
            <span className="text-base font-bold text-muted-foreground ml-1">{t.unitDays}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {yearsService < 1 ? t.underOneYear : t.baseNote}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
          <span className="text-xs font-bold text-muted-foreground block">{t.dailyWage}</span>
          <div className="mt-2 text-3xl font-black text-foreground font-mono">
            {result.dailyWage.toLocaleString()}
            <span className="text-base font-bold text-muted-foreground ml-1">{t.unitWon}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t.dailyWageNote(dailyHours)}
          </p>
        </div>

        <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5 text-center shadow-sm">
          <span className="text-xs font-bold text-primary block">{t.totalAllowance}</span>
          <div className="mt-2 text-3xl font-black text-primary font-mono">
            {result.totalAllowance.toLocaleString()}
            <span className="text-base font-bold text-foreground ml-1">{t.unitWon}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t.allowanceNote(unusedDays)}
          </p>
        </div>
      </div>

      {/* Legal & Educational Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">{t.promotionTitle}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t.promotionDesc}
            </p>
          </div>
        </div>

        <div className="border-t border-border/60 pt-3 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t.accountingNote}
          </p>
        </div>
      </div>
    </div>
  );
}
