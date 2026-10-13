import { useState } from "react";
import {
  classifyYouthSavings,
  contributionRate,
  parseSavingsText,
  YOUTH_SAVINGS,
  youthFutureSavings,
  type HouseholdBand,
  type SavingsKind,
  type WorkKind,
} from "../../lib/kr-youth-savings-2026";
import ChoiceChips from "./payroll/ChoiceChips";
import NumberField from "./payroll/NumberField";
import OneLineInput from "./payroll/OneLineInput";
import ResultSteps from "./payroll/ResultSteps";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
const pct = (r: number) => `${(r * 100).toFixed(1).replace(/\.0$/, "")}%`;

const KIND_LABEL: Record<SavingsKind, string> = { preferred: "우대형", general: "일반형", taxFreeOnly: "비과세만" };

export default function YouthFutureSavingsCalculator() {
  const [monthly, setMonthly] = useState(500_000);
  const [ratePercent, setRatePercent] = useState(5);
  const [kind, setKind] = useState<SavingsKind>("general");

  const [work, setWork] = useState<WorkKind>("otherEmployee");
  const [pay, setPay] = useState(32_000_000);
  const [revenue, setRevenue] = useState(80_000_000);
  const [household, setHousehold] = useState<HouseholdBand>("upTo200");

  const annualRate = ratePercent / 100;
  const valid = monthly >= 1_000 && monthly <= YOUTH_SAVINGS.monthlyMax && ratePercent >= 0 && ratePercent <= 15;
  const r = valid ? youthFutureSavings({ monthly, annualRate, kind }) : null;
  const check = classifyYouthSavings({ work, pay, revenue, household });

  const applyText = (text: string) => {
    const p = parseSavingsText(text);
    const filled: string[] = [];
    if (p.monthly !== undefined) { setMonthly(p.monthly); filled.push("월 납입액"); }
    if (p.annualRate !== undefined) { setRatePercent(Math.round(p.annualRate * 1000) / 10); filled.push("금리"); }
    if (p.kind) { setKind(p.kind); filled.push("유형"); }
    if (p.pay !== undefined) { setPay(p.pay); filled.push("총급여"); }
    return filled;
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card p-5">
        <OneLineInput
          label="얼마씩, 어떤 유형으로 넣을지 한 줄로 적어 보세요"
          placeholder="예: 월 50만원 우대형 금리 7%"
          examples={["월 50만원 우대형 금리 7%", "월 50만원 일반형 금리 5.5%", "월 30만원 일반형 금리 5%"]}
          onApply={applyText}
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <NumberField label="월 납입액 (최대 50만 원)" value={monthly} onChange={setMonthly} suffix="원" step={10_000} />
          <NumberField label="적용 금리 (기본 5%, 우대 포함)" value={ratePercent} onChange={setRatePercent} suffix="%" step={0.1} />
        </div>
        <div className="mt-4">
          <ChoiceChips
            legend="가입 유형"
            value={kind}
            onChange={setKind}
            options={[
              { value: "general", label: "일반형 (기여금 6%)" },
              { value: "preferred", label: "우대형 (기여금 12%)" },
              { value: "taxFreeOnly", label: "비과세만" },
            ]}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          금리는 기본 5%에 총급여 3,600만 원 이하 0.5%p, 재무상담 이수 0.2%p, 은행별 우대를 더한 값입니다. 유형을 모르면 아래 미리 보기를 먼저 해 보세요.
        </p>

        <div aria-live="polite" className="mt-5">
          {r === null ? (
            <p className="text-sm text-muted-foreground">월 납입액은 1,000원~50만 원, 금리는 0~15% 사이로 넣어 주세요.</p>
          ) : (
            <div className="rounded-md border border-border bg-background px-4 py-4">
              <p className="text-sm text-muted-foreground">3년 만기 예상 수령액 ({KIND_LABEL[kind]}, 세금 없음)</p>
              <p className="mt-1 font-mono text-3xl font-bold text-foreground">{won(r.total)}</p>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">낸 원금</dt>
                  <dd className="font-mono font-semibold text-foreground">{won(r.principal)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">이자</dt>
                  <dd className="font-mono font-semibold text-foreground">{won(r.interest)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">정부기여금</dt>
                  <dd className="font-mono font-semibold text-foreground">{won(r.contribution)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-sm text-muted-foreground">
                같은 금리의 일반 적금이었다면 이자에서 {won(r.taxSaved)}(15.4%)이 세금으로 빠지고 기여금도 없습니다. 원금 대비 더 받는 돈은 {won(r.interest + r.contribution)}입니다.
              </p>
              <ResultSteps
                steps={[
                  `원금 = ${won(monthly)} × ${YOUTH_SAVINGS.months}개월 = ${won(r.principal)}`,
                  `이자(적금 단리) = ${won(monthly)} × ${pct(annualRate)} × (36 × 37 ÷ 2) ÷ 12 = ${won(r.interest)}`,
                  `정부기여금 = ${won(monthly)} × ${pct(contributionRate(kind))} = 월 ${won(r.monthlyContribution)} × 36개월 = ${won(r.contribution)}`,
                  `합계 = ${won(r.principal)} + ${won(r.interest)} + ${won(r.contribution)} = ${won(r.total)}`,
                ]}
                next={[
                  { href: "/ko/magazine-youth-future-savings-payout/", label: "유형별 수령액 비교" },
                  { href: "/ko/magazine-youth-future-savings-eligibility/", label: "가입 조건 자세히" },
                  { href: "/ko/isa-calculator/", label: "ISA 계산기" },
                ]}
              />
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold text-foreground">내 유형 미리 보기</h2>
        <p className="mt-1 text-sm text-muted-foreground">공개된 소득 기준으로 일반형·우대형을 가늠합니다. 실제 유형은 국세청 확정 소득과 가구소득 심사로 정해집니다.</p>
        <div className="mt-4 space-y-4">
          <ChoiceChips
            legend="지금 하는 일"
            value={work}
            onChange={setWork}
            options={[
              { value: "smeEmployee", label: "중소기업 재직" },
              { value: "smeNewHire", label: "중소기업 입사 6개월 이내" },
              { value: "otherEmployee", label: "그 외 직장·프리랜서" },
              { value: "smallBusiness", label: "소상공인" },
            ]}
          />
          {work === "smallBusiness" ? (
            <NumberField label="연 매출" value={revenue} onChange={setRevenue} suffix="원" step={1_000_000} />
          ) : (
            <NumberField label="작년 총급여 (비과세 제외)" value={pay} onChange={setPay} suffix="원" step={1_000_000} />
          )}
          <ChoiceChips
            legend="가구소득 (기준중위소득 대비)"
            value={household}
            onChange={setHousehold}
            options={[
              { value: "upTo150", label: "150% 이하" },
              { value: "upTo200", label: "150~200%" },
              { value: "over200", label: "200% 초과" },
            ]}
          />
        </div>
        <div aria-live="polite" className="mt-4 rounded-md border border-border bg-background px-4 py-3">
          <p className="text-sm text-muted-foreground">예상 유형</p>
          <p className="mt-1 text-xl font-bold text-foreground">{check.kind === "ineligible" ? "가입 어려움" : KIND_LABEL[check.kind]}</p>
          <p className="mt-1 text-sm text-muted-foreground">{check.reason}</p>
          {check.lowIncomeBonus && check.kind !== "ineligible" && (
            <p className="mt-1 text-sm text-muted-foreground">총급여 3,600만 원 이하라 우대금리 0.5%p 대상입니다.</p>
          )}
          {check.kind !== "ineligible" && (
            <button
              type="button"
              onClick={() => {
                setKind(check.kind as SavingsKind);
                setRatePercent(check.lowIncomeBonus ? 5.5 : 5);
              }}
              className="mt-3 inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              이 유형으로 위 계산에 넣기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
