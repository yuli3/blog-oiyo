import { useState } from "react";
import { dailyWageTax, dailyWorkerInsurance, parseWorkText, type InsuranceId } from "../../lib/kr-payroll-2026";
import NumberField from "./payroll/NumberField";
import OneLineInput from "./payroll/OneLineInput";
import ResultSteps from "./payroll/ResultSteps";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
const NAMES: Record<InsuranceId, string> = { pension: "국민연금", health: "건강보험", employment: "고용보험", accident: "산재보험" };

export default function DailyWorkerInsuranceChecker() {
  const [daysWorked, setDaysWorked] = useState(7);
  const [hoursWorked, setHoursWorked] = useState(56);
  const [dailyWage, setDailyWage] = useState(120_000);
  const [overOneMonth, setOverOneMonth] = useState(true);

  const monthlyPay = daysWorked * dailyWage;
  const valid = daysWorked > 0 && daysWorked <= 31 && hoursWorked >= 0 && dailyWage > 0;
  const rows = valid ? dailyWorkerInsurance({ daysWorked, hoursWorked, monthlyPay, overOneMonth }) : null;
  const tax = dailyWageTax(dailyWage);
  const deductions = rows ? rows.reduce((sum, row) => sum + row.employeeDeduction, 0) : 0;
  const monthTax = (tax.incomeTax + tax.localTax) * daysWorked;

  const applyText = (text: string) => {
    const parsed = parseWorkText(text);
    const filled: string[] = [];
    if (parsed.daysPerMonth) { setDaysWorked(parsed.daysPerMonth); filled.push("근무일수"); }
    if (parsed.hoursPerMonth) { setHoursWorked(parsed.hoursPerMonth); filled.push("근무시간"); }
    if (parsed.dailyWage) { setDailyWage(parsed.dailyWage); filled.push("일당"); }
    else if (parsed.hourlyWage && parsed.hoursPerDay) { setDailyWage(parsed.hourlyWage * parsed.hoursPerDay); filled.push("일당(시급 × 시간)"); }
    if (/처음|신규|이번\s*달만|1개월\s*미만/.test(text)) { setOverOneMonth(false); filled.push("근무 기간 1개월 미만"); }
    return filled;
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <OneLineInput
        label="이번 달 근무를 한 줄로 적어 보세요"
        placeholder="예: 이번 달 7일 56시간 일당 12만원"
        examples={["이번 달 7일 56시간 일당 12만원", "한 달 10일 80시간 일당 10만원", "월 4일 32시간 일당 20만원 이번 달만"]}
        onApply={applyText}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <NumberField label="한 달 근무일수" value={daysWorked} onChange={setDaysWorked} suffix="일" />
        <NumberField label="한 달 근무시간" value={hoursWorked} onChange={setHoursWorked} suffix="시간" />
        <NumberField label="일당" value={dailyWage} onChange={setDailyWage} suffix="원" step={1000} />
      </div>
      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-muted-foreground">같은 사업장에서 1개월 이상 계속 일하나요?</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[true, false].map((value) => (
            <button
              key={String(value)}
              type="button"
              aria-pressed={overOneMonth === value}
              onClick={() => setOverOneMonth(value)}
              className={
                "min-h-11 rounded-md border px-3 text-sm font-semibold transition-colors " +
                (overOneMonth === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:bg-accent")
              }
            >
              {value ? "예, 1개월 이상" : "아니요, 1개월 미만"}
            </button>
          ))}
        </div>
      </fieldset>

      <div aria-live="polite" className="mt-5">
        {rows === null ? (
          <p className="text-sm text-muted-foreground">근무일수(1~31일), 근무시간, 일당을 입력해 주세요.</p>
        ) : (
          <div className="rounded-md border border-border bg-background px-4 py-4">
            <p className="text-sm text-muted-foreground">이번 달 지급액 {won(monthlyPay)} 기준</p>
            <ul className="mt-3 divide-y divide-border">
              {rows.map((row) => (
                <li key={row.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-foreground">{NAMES[row.id]}</span>
                    <span className={"rounded-full px-3 py-1 text-xs font-semibold " + (row.applies ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      {row.applies ? "가입 대상" : "가입 안 함"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{row.reason}</p>
                  {row.employeeDeduction > 0 && <p className="mt-1 font-mono text-sm text-foreground">근로자 부담 약 {won(row.employeeDeduction)}</p>}
                </li>
              ))}
            </ul>
            <dl className="mt-2 grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
              <div>
                <dt className="text-muted-foreground">4대보험 근로자 부담 합계</dt>
                <dd className="font-mono font-semibold text-foreground">{won(deductions)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">원천세 (소득세+지방세, 한 달)</dt>
                <dd className="font-mono font-semibold text-foreground">{won(monthTax)}</dd>
              </div>
            </dl>
            <ResultSteps
              steps={[
                `국민연금·건강보험은 1개월 이상 일하면서 한 달 8일 이상 또는 60시간 이상일 때 가입합니다. 지금은 ${daysWorked}일, ${hoursWorked}시간입니다.`,
                "국민연금은 월 소득 220만 원 이상이면 일수와 관계없이 가입합니다.",
                "고용·산재보험은 일용근로자도 하루부터 적용됩니다.",
                `일당 원천세 = (일당 ${won(dailyWage)} − 15만 원) × 6% × 45% = ${won(tax.incomeTax)}${tax.incomeTax === 0 ? " (1천 원 미만은 떼지 않음)" : ""}, 지방소득세는 그 10%`,
                "사업주는 다음 달 15일까지 근로내용확인신고서를, 다음 달 말일까지 일용근로소득 지급명세서를 냅니다.",
              ]}
              next={[
                { href: "/ko/weekly-holiday-pay-calculator/", label: "주휴수당도 줘야 할까?" },
                { href: "/ko/4-insurance-complete-guide/", label: "4대보험 정리" },
                { href: "/ko/magazine-minimum-wage-guide/", label: "최저임금 정리" },
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
