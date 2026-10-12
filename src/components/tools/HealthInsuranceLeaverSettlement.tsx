import { useState } from "react";
import { leaverHealthSettlement, parseLeaverText, RATES } from "../../lib/kr-payroll-2026";
import NumberField from "./payroll/NumberField";
import OneLineInput from "./payroll/OneLineInput";
import ResultSteps from "./payroll/ResultSteps";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

export default function HealthInsuranceLeaverSettlement() {
  const [totalPay, setTotalPay] = useState(30_000_000);
  const [monthsWorked, setMonthsWorked] = useState(6);
  const [monthsCharged, setMonthsCharged] = useState(6);
  const [noticeMonthly, setNoticeMonthly] = useState(4_500_000);

  const valid = totalPay > 0 && monthsWorked >= 1 && monthsWorked <= 12 && monthsCharged >= 0 && monthsCharged <= monthsWorked && noticeMonthly > 0;
  const r = valid ? leaverHealthSettlement({ totalPay, monthsWorked, monthsCharged, noticeMonthly }) : null;

  const applyText = (text: string) => {
    const p = parseLeaverText(text);
    const filled: string[] = [];
    if (p.totalPay !== undefined) { setTotalPay(p.totalPay); filled.push("보수 총액"); }
    if (p.monthsWorked) { setMonthsWorked(p.monthsWorked); filled.push("근무 월수"); }
    if (p.monthsCharged !== undefined) { setMonthsCharged(p.monthsCharged); filled.push("부과 월수"); }
    else if (p.monthsWorked) setMonthsCharged(p.monthsWorked);
    if (p.noticeMonthly !== undefined) { setNoticeMonthly(p.noticeMonthly); filled.push("고지 기준 보수월액"); }
    return filled;
  };

  const owe = r !== null && r.total > 0;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <OneLineInput
        label="올해 급여와 근무 기간을 한 줄로 적어 보세요"
        placeholder="예: 올해 총급여 3000만원 6개월 근무 기준 보수월액 450만원"
        examples={["올해 총급여 3000만원 6개월 근무 기준 보수월액 450만원", "총급여 2750만원 10개월 근무 부과 9개월 기준 250만원", "총급여 1800만원 6개월 근무 기준 330만원"]}
        onApply={applyText}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <NumberField label="올해 받은 보수 총액(비과세 제외)" value={totalPay} onChange={setTotalPay} suffix="원" step={100_000} />
        <NumberField label="고지 기준 보수월액" value={noticeMonthly} onChange={setNoticeMonthly} suffix="원" step={10_000} />
        <NumberField label="올해 보수를 받은 달 수" value={monthsWorked} onChange={setMonthsWorked} suffix="개월" />
        <NumberField label="보험료가 부과된 달 수" value={monthsCharged} onChange={setMonthsCharged} suffix="개월" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">월 중간(2일 이후)에 입사했다면 입사한 달은 보험료가 없어 부과 달 수가 하나 적습니다.</p>

      <div aria-live="polite" className="mt-5">
        {r === null ? (
          <p className="text-sm text-muted-foreground">근무 달 수는 1~12, 부과 달 수는 근무 달 수 이하로 넣어 주세요.</p>
        ) : (
          <div className="rounded-md border border-border bg-background px-4 py-4">
            <p className="text-sm text-muted-foreground">
              {r.total === 0 ? "정산할 금액이 없습니다" : owe ? "퇴사월 급여에서 더 떼는 금액 (근로자분)" : "퇴사자에게 돌려주는 금액 (근로자분)"}
            </p>
            <p className="mt-1 font-mono text-3xl font-bold text-foreground">{won(Math.abs(r.total))}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">건강보험</dt>
                <dd className="font-mono font-semibold text-foreground">{won(r.health)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">장기요양</dt>
                <dd className="font-mono font-semibold text-foreground">{won(r.care)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-sm text-muted-foreground">사업주도 같은 금액을 정산하므로, 사업장 전체로는 {won(Math.abs(r.total) * 2)}이 {owe ? "추가로 고지" : "환급 또는 다음 고지에서 차감"}됩니다.</p>
            <ResultSteps
              steps={[
                `실제 보수월액 = ${won(totalPay)} ÷ ${monthsWorked}개월 = ${won(r.actualMonthly)} (원 미만 버림)`,
                `냈어야 할 건강보험 = ${won(r.actualMonthly)} × ${(RATES.healthEmployee * 100).toFixed(3)}%(10원 미만 버림) × ${monthsCharged}개월 = ${won(r.owedHealth)}`,
                `이미 낸 건강보험 = ${won(noticeMonthly)} × ${(RATES.healthEmployee * 100).toFixed(3)}% × ${monthsCharged}개월 = ${won(r.paidHealth)}`,
                `장기요양 = 매달 건강보험료 × ${(RATES.longTermCareOfHealth * 100).toFixed(2)}% → 냈어야 할 ${won(r.owedCare)} − 낸 ${won(r.paidCare)} = ${won(r.care)}`,
                `정산액 = ${won(r.health)} + ${won(r.care)} = ${won(r.total)}`,
              ]}
              next={[
                { href: "/ko/severance-calculator/", label: "퇴직금 계산" },
                { href: "/ko/salary-calculator/", label: "월급 실수령액 계산" },
                { href: "/ko/4-insurance-complete-guide/", label: "4대보험 정리" },
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
