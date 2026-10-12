import { useState } from "react";
import { daysBetween, deemedRent, isIsoDate, parseRentText, VAT_RATES, vatPeriod } from "../../lib/kr-vat-2026";
import ChoiceChips from "./payroll/ChoiceChips";
import DateField from "./payroll/DateField";
import NumberField from "./payroll/NumberField";
import OneLineInput from "./payroll/OneLineInput";
import ResultSteps from "./payroll/ResultSteps";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

type Payer = "landlord" | "tenant";
const PAYER_OPTIONS = [
  { value: "landlord", label: "임대인이 부담" },
  { value: "tenant", label: "임차인에게 받음" },
] as const satisfies readonly { value: Payer; label: string }[];

export default function DeemedRentVatCalculator() {
  const second = vatPeriod(2026, 2);
  const [deposit, setDeposit] = useState(100_000_000);
  const [start, setStart] = useState(second.start);
  const [end, setEnd] = useState(second.end);
  const [ratePct, setRatePct] = useState(VAT_RATES.deemedRentInterest * 100);
  const [payer, setPayer] = useState<Payer>("landlord");

  const valid = deposit > 0 && ratePct > 0 && isIsoDate(start) && isIsoDate(end) && daysBetween(start, end) >= 0 && daysBetween(start, end) < 366;
  const r = valid ? deemedRent({ deposit, start, end, rate: ratePct / 100 }) : null;

  const applyText = (text: string) => {
    const p = parseRentText(text);
    const filled: string[] = [];
    if (p.deposit !== undefined) { setDeposit(p.deposit); filled.push("보증금"); }
    if (p.start) { setStart(p.start); filled.push("시작일"); }
    if (p.end) { setEnd(p.end); filled.push("종료일"); }
    if (p.rate !== undefined) { setRatePct(Number((p.rate * 100).toFixed(3))); filled.push("이자율"); }
    return filled;
  };

  const entries = r
    ? payer === "landlord"
      ? [["(차) 세금과공과", won(r.vat)], ["(대) 부가세예수금", won(r.vat)]]
      : [["(차) 보통예금", won(r.vat)], ["(대) 부가세예수금", won(r.vat)]]
    : [];

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <OneLineInput
        label="보증금과 기간을 한 줄로 적어 보세요"
        placeholder="예: 보증금 1억 2기"
        examples={["보증금 1억 2기", "보증금 3억 7월 1일부터 9월 30일까지", "보증금 5천만 1기"]}
        onApply={applyText}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <NumberField label="임대보증금(전세금)" value={deposit} onChange={setDeposit} suffix="원" step={1_000_000} />
        <NumberField label="정기예금이자율(연)" value={ratePct} onChange={setRatePct} suffix="%" step={0.1} />
        <DateField label="과세대상 시작일" value={start} onChange={setStart} />
        <DateField label="과세대상 종료일" value={end} onChange={setEnd} />
      </div>
      <div className="mt-4">
        <ChoiceChips legend="간주임대료 부가세는 누가 내나요?" value={payer} options={PAYER_OPTIONS} onChange={setPayer} />
      </div>

      <div aria-live="polite" className="mt-5">
        {r === null ? (
          <p className="text-sm text-muted-foreground">보증금과 이자율을 넣고, 종료일은 시작일과 같거나 뒤(1년 이내)로 맞춰 주세요.</p>
        ) : (
          <div className="rounded-md border border-border bg-background px-4 py-4">
            <p className="text-sm text-muted-foreground">이번 과세기간 간주임대료에 붙는 부가세</p>
            <p className="mt-1 font-mono text-3xl font-bold text-foreground">{won(r.vat)}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">간주임대료(과세표준)</dt>
                <dd className="font-mono font-semibold text-foreground">{won(r.deemedRent)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">과세대상 일수</dt>
                <dd className="font-mono font-semibold text-foreground">{r.days}일</dd>
              </div>
            </dl>
            <div className="mt-4">
              <p className="text-sm font-semibold text-foreground">회계처리</p>
              <ul className="mt-1 text-sm">
                {entries.map(([account, amount]) => (
                  <li key={account} className="flex justify-between gap-3 py-1">
                    <span className="text-muted-foreground">{account}</span>
                    <span className="font-mono text-foreground">{amount}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs text-muted-foreground">
                {payer === "landlord"
                  ? "임대인이 부담한 부가세는 세금과공과(비용)로 처리합니다."
                  : "임차인에게 받은 부가세는 임대인의 부가세예수금이고, 임차인은 매입세액 공제를 받을 수 없습니다(세금계산서 발급 대상 아님)."}
              </p>
            </div>
            <ResultSteps
              steps={[
                `과세대상 일수 = ${start} ~ ${end} = ${r.days}일`,
                `간주임대료 = ${won(deposit)} × ${r.days}일 × ${Number(ratePct.toFixed(3))}% ÷ ${r.yearDays}일 = ${won(r.deemedRent)} (원 미만 버림)`,
                `부가세 = ${won(r.deemedRent)} × 10% = ${won(r.vat)}`,
                "부가세 신고서 과세표준의 '과세 기타' 칸에 간주임대료를 넣고, 부동산임대공급가액명세서를 함께 제출합니다.",
              ]}
              next={[
                { href: "/ko/vat-penalty-calculator/", label: "늦게 신고하면 가산세는?" },
                { href: "/ko/rental-yield-calculator/", label: "임대수익률 계산" },
                { href: "/ko/magazine-commercial-lease-rights-guide/", label: "상가임대차 권리 정리" },
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
