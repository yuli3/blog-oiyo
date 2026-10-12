import { useState } from "react";
import {
  daysBetween,
  INVOICE_PENALTIES,
  isIsoDate,
  nextWeekday,
  parsePenaltyText,
  VAT_RATES,
  vatPenalty,
  type FilingIssue,
  type InvoiceIssue,
} from "../../lib/kr-vat-2026";
import ChoiceChips from "./payroll/ChoiceChips";
import DateField from "./payroll/DateField";
import NumberField from "./payroll/NumberField";
import OneLineInput from "./payroll/OneLineInput";
import ResultSteps from "./payroll/ResultSteps";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
const pct = (rate: number) => `${Number((rate * 100).toFixed(3))}%`;

const FILING_OPTIONS = [
  { value: "late", label: "기한 안에 신고 못 함" },
  { value: "under", label: "신고했지만 적게 냄" },
  { value: "none", label: "신고는 정상" },
] as const satisfies readonly { value: FilingIssue; label: string }[];

const INVOICE_OPTIONS = [
  { value: "none", label: "없음" },
  ...(Object.keys(INVOICE_PENALTIES) as InvoiceIssue[]).map((value) => ({ value, label: INVOICE_PENALTIES[value].label.replace("전자 의무자의 ", "") })),
] as const;

export default function VatPenaltyCalculator() {
  const [filing, setFiling] = useState<FilingIssue>("late");
  const [tax, setTax] = useState(3_000_000);
  const [fraud, setFraud] = useState(false);
  const [deadline, setDeadline] = useState("2026-07-27");
  const [filed, setFiled] = useState("2026-08-10");
  const [invoice, setInvoice] = useState<InvoiceIssue | "none">("none");
  const [supply, setSupply] = useState(0);

  const datesOk = isIsoDate(deadline) && isIsoDate(filed) && daysBetween(deadline, filed) >= 0;
  const valid = tax >= 0 && supply >= 0 && (filing === "none" || datesOk);
  const r = valid ? vatPenalty({ filing, tax, fraud, deadline, filed, invoice, supply }) : null;
  const movedDeadline = isIsoDate(deadline) && nextWeekday(deadline) !== deadline;

  const applyText = (text: string) => {
    const p = parsePenaltyText(text);
    const filled: string[] = [];
    if (p.filing) { setFiling(p.filing); filled.push("신고 상황"); }
    if (p.fraud) { setFraud(true); filled.push("부정행위"); }
    if (p.tax !== undefined) { setTax(p.tax); filled.push("추가 세액"); }
    if (p.deadline) { setDeadline(p.deadline); filled.push("법정기한"); }
    if (p.filed) { setFiled(p.filed); filled.push("신고·납부일"); }
    if (p.invoice) { setInvoice(p.invoice); filled.push("세금계산서 문제"); }
    if (p.supply !== undefined) { setSupply(p.supply); filled.push("공급가액"); }
    if (p.invoice && !p.filing && p.tax === undefined) setFiling("none");
    return filled;
  };

  const filingLine = r?.lines.find((line) => line.id === "filing");
  const paymentLine = r?.lines.find((line) => line.id === "payment");
  const invoiceLine = r?.lines.find((line) => line.id === "invoice");

  const steps: string[] = [];
  if (r && filingLine) {
    steps.push(`${filingLine.label} = ${won(tax)} × ${pct(filingLine.rate)} = ${won(filingLine.gross)}`);
    steps.push(
      r.reliefBand
        ? `법정기한 ${deadline} 뒤 ${r.reliefBand} 감면 (${filing === "late" ? "기한후신고" : "수정신고"}) → ${won(filingLine.gross)} − ${won(filingLine.relief)} = ${won(filingLine.amount)}`
        : `${filing === "late" ? "6개월" : "2년"}이 지나 감면이 없습니다`,
    );
  }
  if (r && paymentLine) steps.push(`납부지연가산세 = ${won(tax)} × ${r.daysLate}일 × 0.022% = ${won(paymentLine.amount)} (감면 없음)`);
  if (r && invoiceLine) steps.push(`${invoiceLine.label} = 공급가액 ${won(supply)} × ${pct(invoiceLine.rate)} = ${won(invoiceLine.amount)} (감면 없음)`);

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <OneLineInput
        label="무슨 일이 있었는지 한 줄로 적어 보세요"
        placeholder="예: 1기 확정 기한후신고 세액 300만원 8월 10일 신고"
        examples={["1기 확정 기한후신고 세액 300만원 8월 10일 신고", "매출 누락 수정신고 세액 100만원 2026-07-27 기한, 2026-11-30 신고", "종이 세금계산서 공급가액 1000만원"]}
        onApply={applyText}
      />

      <div className="mt-4 space-y-4">
        <ChoiceChips legend="신고 상황" value={filing} options={FILING_OPTIONS} onChange={setFiling} />
        {filing !== "none" && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <NumberField label="더 내야 하는 세액" value={tax} onChange={setTax} suffix="원" step={10_000} />
              <DateField label="법정신고·납부기한" value={deadline} onChange={setDeadline} />
              <DateField label="실제 신고·납부일" value={filed} onChange={setFiled} />
            </div>
            {movedDeadline && (
              <p className="text-sm text-muted-foreground">
                {deadline}은 주말입니다. 기한이 주말·공휴일이면 다음 영업일이 기한이므로 {nextWeekday(deadline)}로 고치는 것이 맞을 수 있어요.
              </p>
            )}
            <label className="flex min-h-11 items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={fraud} onChange={(event) => setFraud(event.target.checked)} className="size-5" />
              이중장부·허위 증빙 같은 부정행위가 있었다 (40%)
            </label>
          </>
        )}
        <ChoiceChips legend="세금계산서 문제" value={invoice} options={INVOICE_OPTIONS} onChange={setInvoice} />
        {invoice !== "none" && <NumberField label="문제가 된 공급가액" value={supply} onChange={setSupply} suffix="원" step={10_000} />}
      </div>

      <div aria-live="polite" className="mt-5">
        {r === null ? (
          <p className="text-sm text-muted-foreground">금액은 0 이상, 신고·납부일은 법정기한과 같거나 뒤여야 합니다.</p>
        ) : r.lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">가산세가 붙는 상황을 고르거나 금액을 넣어 주세요.</p>
        ) : (
          <div className="rounded-md border border-border bg-background px-4 py-4">
            <p className="text-sm text-muted-foreground">예상 가산세 합계</p>
            <p className="mt-1 font-mono text-3xl font-bold text-foreground">{won(r.total)}</p>
            <ul className="mt-4 divide-y divide-border text-sm">
              {r.lines.map((line) => (
                <li key={line.id} className="flex items-baseline justify-between gap-3 py-2">
                  <span className="text-muted-foreground">
                    {line.label}
                    {line.relief > 0 && <span className="ml-1 text-xs">(감면 {won(line.relief)})</span>}
                  </span>
                  <span className="font-mono font-semibold text-foreground">{won(line.amount)}</span>
                </li>
              ))}
            </ul>
            {filing !== "none" && tax > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">본세까지 더하면 이번에 낼 돈은 {won(tax + r.total)}입니다(본세 {won(tax)} 포함).</p>
            )}
            <ResultSteps
              steps={steps}
              next={[
                { href: "/ko/magazine-tax-office-deadline-night/", label: "하루 늦은 신고 vs 늦은 납부" },
                { href: "/ko/tax-calendar/", label: "다음 신고기한 보기" },
                { href: "/ko/academy-computerized-accounting-ch6/", label: "부가세 신고 실무 강의" },
              ]}
            />
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">납부지연가산세 1일 {pct(VAT_RATES.latePaymentPerDay)}는 신고일에 함께 냈다고 보고 계산합니다.</p>
    </div>
  );
}
