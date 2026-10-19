import { useState } from "react";
import { PARENTAL, type ParentalMode, parentalLeaveBenefit, shortLeaveBenefit } from "../../lib/kr-parental-leave-2026";
import ChoiceChips from "./payroll/ChoiceChips";
import NumberField from "./payroll/NumberField";
import ResultSteps from "./payroll/ResultSteps";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
const man = (n: number) => `${(n / 10_000).toLocaleString("ko-KR")}만`;

export default function ParentalLeaveCalculator() {
  const [wageManwon, setWageManwon] = useState(300);
  const [months, setMonths] = useState(12);
  const [mode, setMode] = useState<ParentalMode>("general");
  const [otherMonths, setOtherMonths] = useState(6);

  const extendedOk = mode === "singleParent" || (mode === "sixPlusSix" && otherMonths >= 3);
  const maxMonths = extendedOk ? PARENTAL.maxMonthsExtended : PARENTAL.maxMonths;
  const valid = wageManwon > 0 && wageManwon <= 10_000 && months >= 1 && months <= maxMonths && otherMonths >= 0 && otherMonths <= 18;
  const r = valid ? parentalLeaveBenefit(wageManwon * 10_000, months, mode, otherMonths) : null;
  const general = valid && mode !== "general" ? parentalLeaveBenefit(wageManwon * 10_000, months, "general") : null;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card p-5">
        <NumberField label="월 통상임금 (세전, 기본급과 고정수당)" value={wageManwon} onChange={setWageManwon} suffix="만원" step={10} />
        <div className="mt-4">
          <NumberField label="내가 쉴 개월 수" value={months} onChange={setMonths} suffix="개월" step={1} min={1} />
        </div>
        <div className="mt-4">
          <ChoiceChips
            legend="상황"
            value={mode}
            onChange={setMode}
            options={[
              { value: "general", label: "일반" },
              { value: "sixPlusSix", label: "부모 모두 사용 (생후 18개월 안)" },
              { value: "singleParent", label: "한부모" },
            ]}
          />
        </div>
        {mode === "sixPlusSix" && (
          <div className="mt-4">
            <NumberField label="배우자가 쉬는 개월 수" value={otherMonths} onChange={setOtherMonths} suffix="개월" step={1} />
          </div>
        )}

        <div aria-live="polite" className="mt-5">
          {r === null ? (
            <p className="text-sm text-muted-foreground">
              통상임금은 1억 원 이하, 기간은 1~{maxMonths}개월로 넣어 주세요.
              {!extendedOk && " 1년 6개월은 부모가 각각 3개월 이상 쓰거나 한부모일 때만 가능해요."}
            </p>
          ) : (
            <div className="rounded-md border border-border bg-background px-4 py-4">
              <p className="text-sm text-muted-foreground">{months}개월 동안 받는 육아휴직 급여</p>
              <p className="mt-1 font-mono text-3xl font-bold text-foreground">{won(r.total)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                첫 달 {won(r.rows[0].amount)}
                {general && r.total > general.total && ` · 일반보다 ${won(r.total - general.total)} 더`}
              </p>
              <table className="mt-4 w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-1 font-medium">개월</th>
                    <th className="py-1 font-medium">지급률 · 상한</th>
                    <th className="py-1 text-right font-medium">받는 돈</th>
                  </tr>
                </thead>
                <tbody>
                  {r.rows.map((row) => (
                    <tr key={row.month} className="border-t border-border/60">
                      <td className="py-1">{row.month}개월차</td>
                      <td className="py-1 text-muted-foreground">
                        {row.rate * 100}% · {man(row.cap)}
                        {row.special && <span className="ml-1 text-xs font-semibold text-primary">특례</span>}
                      </td>
                      <td className="py-1 text-right font-mono">{won(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ResultSteps
                steps={[
                  `1~3개월: 통상임금 100%, 상한 ${mode === "singleParent" ? "300만" : "250만"}${mode === "sixPlusSix" ? " (특례 기간엔 250·250·300만)" : ""}`,
                  `4~6개월: 100%, 상한 200만${mode === "sixPlusSix" ? " (특례 기간엔 350·400·450만)" : ""}`,
                  "7개월부터: 80%, 상한 160만",
                  `어느 달이든 최소 ${man(PARENTAL.floor)}원, 사후지급금 없이 매달 전액`,
                  mode === "sixPlusSix"
                    ? `특례 상한은 두 사람 중 짧게 쉬는 기간(최대 6개월)까지: ${r.specialUntil}개월`
                    : `1주 단기 육아휴직이면 첫 달 기준 약 ${won(shortLeaveBenefit(r.rows[0].amount, 7))}`,
                ]}
                next={[
                  { href: "/ko/magazine-parental-leave-pay-table/", label: "개월별 상한 표" },
                  { href: "/ko/magazine-parental-leave-six-plus-six/", label: "부모 함께 쓰면 얼마 더" },
                  { href: "/ko/magazine-parental-leave-application/", label: "신청 방법" },
                ]}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
