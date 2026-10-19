import { useState } from "react";
import { RECOGNITION_PERIOD_DAYS, UNEMPLOYMENT, threeMonthsFromMonthly, unemploymentBenefit } from "../../lib/kr-unemployment-2026";
import ChoiceChips from "./payroll/ChoiceChips";
import NumberField from "./payroll/NumberField";
import ResultSteps from "./payroll/ResultSteps";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

const BRACKET_LABEL = ["1년 미만", "1~3년", "3~5년", "5~10년", "10년 이상"];

export default function UnemploymentBenefitCalculator() {
  const [monthlyManwon, setMonthlyManwon] = useState(300);
  const [days3, setDays3] = useState(92);
  const [insuredYears, setInsuredYears] = useState(4);
  const [age, setAge] = useState<"under50" | "over50">("under50");
  const [hours, setHours] = useState(8);

  const valid = monthlyManwon >= 0 && monthlyManwon <= 10_000 && insuredYears >= 0 && insuredYears <= 50;
  const threeMonthWages = threeMonthsFromMonthly(monthlyManwon * 10_000);
  const r = valid
    ? unemploymentBenefit({ threeMonthWages, threeMonthDays: days3, insuredYears, over50OrDisabled: age === "over50", dailyHours: hours })
    : null;
  const table = age === "over50" ? UNEMPLOYMENT.daysOver50 : UNEMPLOYMENT.daysUnder50;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card p-5">
        <NumberField label="퇴사 전 3개월 평균 월급 (세전, 상여·수당 포함)" value={monthlyManwon} onChange={setMonthlyManwon} suffix="만원" step={10} />
        <div className="mt-4">
          <ChoiceChips
            legend="퇴사 전 3개월의 날수"
            value={String(days3)}
            onChange={(v) => setDays3(Number(v))}
            options={[
              { value: "89", label: "89일 (2월 포함)" },
              { value: "91", label: "91일" },
              { value: "92", label: "92일" },
            ]}
          />
        </div>
        <div className="mt-4">
          <NumberField label="고용보험 가입 기간 (여러 회사 합산)" value={insuredYears} onChange={setInsuredYears} suffix="년" step={0.5} />
        </div>
        <div className="mt-4">
          <ChoiceChips
            legend="퇴사일 기준 나이"
            value={age}
            onChange={setAge}
            options={[
              { value: "under50", label: "50세 미만" },
              { value: "over50", label: "50세 이상 또는 장애인" },
            ]}
          />
        </div>
        <div className="mt-4">
          <ChoiceChips
            legend="하루 소정근로시간 (최저 금액 계산용)"
            value={String(hours)}
            onChange={(v) => setHours(Number(v))}
            options={[
              { value: "8", label: "8시간" },
              { value: "6", label: "6시간" },
              { value: "4", label: "4시간" },
            ]}
          />
        </div>

        <div aria-live="polite" className="mt-5">
          {r === null ? (
            <p className="text-sm text-muted-foreground">월급은 0~1억 원, 가입 기간은 0~50년 사이로 넣어 주세요.</p>
          ) : (
            <div className="rounded-md border border-border bg-background px-4 py-4">
              <p className="text-sm text-muted-foreground">예상 총 수령액 ({r.days}일)</p>
              <p className="mt-1 font-mono text-3xl font-bold text-foreground">{won(r.total)}</p>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">하루</dt>
                  <dd className="font-mono font-semibold text-foreground">{won(r.daily)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">4주마다</dt>
                  <dd className="font-mono font-semibold text-foreground">{won(r.per28Days)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">받는 날수</dt>
                  <dd className="font-mono font-semibold text-foreground">{r.days}일</dd>
                </div>
              </dl>
              {r.limitedBy === "floor" && (
                <p className="mt-3 text-sm text-muted-foreground">
                  평균임금의 60%({won(r.rawDaily)})가 최저 금액보다 적어서 하한액 {won(r.floor)}을 받습니다.
                </p>
              )}
              {r.limitedBy === "cap" && (
                <p className="mt-3 text-sm text-muted-foreground">
                  월급이 높아도 하루 {won(UNEMPLOYMENT.dailyCap)}을 넘지 않습니다.
                </p>
              )}
              <ResultSteps
                steps={[
                  `하루 평균임금: ${won(threeMonthWages)} ÷ ${days3}일 = ${won(r.baseDaily)}${r.baseDaily === UNEMPLOYMENT.baseDailyCap ? " (상한)" : ""}`,
                  `평균임금의 60%: ${won(r.rawDaily)}`,
                  `하한 ${won(r.floor)}(최저임금 ${UNEMPLOYMENT.minimumWage.toLocaleString("ko-KR")}원 × ${Math.min(8, hours)}시간 × 80%) ~ 상한 ${won(UNEMPLOYMENT.dailyCap)} 사이로 맞춤 → ${won(r.daily)}`,
                  `받는 날수: ${age === "over50" ? "50세 이상·장애인" : "50세 미만"}, 가입 ${BRACKET_LABEL[r.bracketIndex]} → ${r.days}일`,
                  `${won(r.daily)} × ${r.days}일 = ${won(r.total)} (4주마다 ${RECOGNITION_PERIOD_DAYS}일분씩)`,
                ]}
                next={[
                  { href: "/ko/severance-calculator/", label: "퇴직금 계산" },
                  { href: "/ko/magazine-unemployment-eligibility/", label: "받을 수 있는지 먼저 확인" },
                  { href: "/ko/magazine-unemployment-voluntary-quit/", label: "자진 퇴사도 받는 경우" },
                ]}
              />
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-sm font-semibold text-foreground">받는 날수 표 ({age === "over50" ? "50세 이상·장애인" : "50세 미만"})</p>
        <table className="mt-2 w-full text-sm">
          <tbody>
            {table.map((d, i) => (
              <tr key={BRACKET_LABEL[i]} className={i === r?.bracketIndex ? "font-semibold text-foreground" : "text-muted-foreground"}>
                <td className="py-1">가입 {BRACKET_LABEL[i]}</td>
                <td className="py-1 text-right font-mono">{d}일</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
