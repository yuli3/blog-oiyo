import { useState } from "react";
import { parseWorkText, RATES, weeklyHolidayPay, WEEKLY_COMPARISON_WEEKS } from "../../lib/kr-payroll-2026";
import NumberField from "./payroll/NumberField";
import OneLineInput from "./payroll/OneLineInput";
import ResultSteps from "./payroll/ResultSteps";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
const hours = (n: number) => `${Number(n.toFixed(2))}시간`;

export default function WeeklyHolidayPayCalculator() {
  const [hourlyWage, setHourlyWage] = useState<number>(RATES.minimumWage);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [hoursPerDay, setHoursPerDay] = useState(4);
  const [wholeWeek, setWholeWeek] = useState("unknown");
  const [attendance, setAttendance] = useState("unknown");
  const condition = (value: string) => value === "unknown" ? undefined : value === "yes";

  const valid = [hourlyWage, daysPerWeek, hoursPerDay].every(Number.isFinite) && hourlyWage > 0 && daysPerWeek > 0 && daysPerWeek <= 7 && hoursPerDay > 0 && hoursPerDay <= 24;
  let r: ReturnType<typeof weeklyHolidayPay> | null = null;
  try {
    if (valid) r = weeklyHolidayPay({ hourlyWage, daysPerWeek, hoursPerDay, employedWholeWeek: condition(wholeWeek), completedScheduledDays: condition(attendance) });
  } catch { /* WHY 2026-10-24: keep oversized edits in the form and show the existing error instead of crashing React. */ }

  const applyText = (text: string) => {
    const parsed = parseWorkText(text);
    const filled: string[] = [];
    if (parsed.hourlyWage) { setHourlyWage(parsed.hourlyWage); filled.push("시급"); }
    if (parsed.daysPerWeek) { setDaysPerWeek(parsed.daysPerWeek); filled.push("주 근무일"); }
    if (parsed.hoursPerDay) { setHoursPerDay(parsed.hoursPerDay); filled.push("하루 근무시간"); }
    return filled;
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <OneLineInput
        label="근무 조건을 한 줄로 적어 보세요"
        placeholder="예: 주 5일 하루 4시간 시급 10320원"
        examples={["주 5일 하루 4시간 시급 10320원", "주 3일 하루 6시간 시급 1만1천원", "주 2일 하루 7시간 시급 10320원"]}
        onApply={applyText}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <NumberField label="시급" value={hourlyWage} onChange={setHourlyWage} suffix="원" step={10} />
        <NumberField label="주 근무일" value={daysPerWeek} onChange={setDaysPerWeek} suffix="일" />
        <NumberField label="하루 근무시간" value={hoursPerDay} onChange={setHoursPerDay} suffix="시간" step={0.5} />
      </div>

      <fieldset className="mt-4 grid gap-3">
        <legend>한국 주휴수당 요건 확인</legend>
        <label>해당 7일 동안 근로관계가 유지됐나요?
          <select value={wholeWeek} onChange={(e) => setWholeWeek(e.target.value)}>
            <option value="unknown">미확인</option><option value="yes">충족</option><option value="no">미충족</option>
          </select>
        </label>
        <label>근로의무가 있는 소정근로일에 개근했나요?
          <select value={attendance} onChange={(e) => setAttendance(e.target.value)}>
            <option value="unknown">미확인</option><option value="yes">충족</option><option value="no">미충족</option>
          </select>
        </label>
        <p>시간은 4주 평균 소정근로시간(4주 미만은 해당 기간)을 입력해요. 40시간·5일 통상근로자 비교모델이며 초과근로 가산은 제외해요. 다음 주 근무 여부와 근로의무 없는 공휴일은 위 질문과 구분해요.</p>
      </fieldset>

      <div aria-live="polite" className="mt-5">
        {r === null ? (
          <p className="text-sm text-muted-foreground">시급과 근무일(1~7일), 하루 근무시간을 입력해 주세요. 계산 범위를 넘는 큰 값은 줄여 주세요.</p>
        ) : (
          <div className="rounded-md border border-border bg-background px-4 py-4">
            <p className="text-sm text-muted-foreground">
              {r.eligibilityStatus === "unknown" ? "자격 확인 전 조건부 예상액이에요. 아래 금액은 요건 충족을 가정한 비교액이에요." : r.eligible ? "입력하신 요건을 충족한다고 확인한 비교액이에요. 법적 자격을 확정하지는 않아요." : "입력한 조건이 충족되지 않아 주휴수당을 적용하지 않았어요."}
            </p>
            <p className="mt-1 font-mono text-3xl font-bold text-foreground">{won(r.holidayPay)}</p>
            <p className="text-xs text-muted-foreground">한 주 주휴수당 (결근 없이 일한 주 기준)</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">주급 (주휴 포함)</dt>
                <dd className="font-mono font-semibold text-foreground">{won(r.weeklyPay)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">월 환산 (주 4.345회)</dt>
                <dd className="font-mono font-semibold text-foreground">{won(r.monthlyPay)}</dd>
              </div>
            </dl>
            {r.belowMinimumWage && (
              <p role="alert" className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-foreground">
                시급 {won(hourlyWage)}은 2026년 최저임금 {won(RATES.minimumWage)}보다 낮습니다. 최저임금법 위반이 될 수 있어요.
              </p>
            )}
            <ResultSteps
              steps={[
                `주 소정근로시간 = ${daysPerWeek}일 × ${hours(hoursPerDay)} = ${hours(r.weeklyHours)}`,
                r.eligible !== false
                  ? `15시간 이상이므로 주휴시간 = ${r.weeklyHours >= 40 ? "40시간 이상은 8시간으로 고정" : `${hours(r.weeklyHours)} ÷ 40 × 8`} = ${hours(r.holidayHours)}`
                  : "시간 또는 확인 요건 미충족으로 비교 주휴시간 0",
                `주휴수당 = ${hours(r.holidayHours)} × ${won(hourlyWage)} = ${won(r.holidayPay)}`,
                `월 환산 = 주급 ${won(r.weeklyPay)} × ${WEEKLY_COMPARISON_WEEKS}주. 주급 요소별·월환산 원 미만 버림은 API 비교모델이며 법정 절사 규칙이나 확정 월급이 아니에요.`,
              ]}
              next={[
                { href: "/ko/daily-worker-insurance-checker/", label: "알바도 4대보험 들어야 할까?" },
                { href: "https://tools.oiyo.net/ko/salary-calculator/", label: "월급 실수령액 계산" },
                { href: "/ko/magazine-tax-office-part-time-insurance/", label: "알바 기준선 4개 정리" },
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
