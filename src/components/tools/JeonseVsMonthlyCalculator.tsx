import { useState } from "react";
import ChoiceChips from "./payroll/ChoiceChips";
import NumberField from "./payroll/NumberField";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

export default function JeonseVsMonthlyCalculator() {
  // Jeonse state
  const [jeonseDepMan, setJeonseDepMan] = useState(30000); // 3억
  const [jeonseLoanRatio, setJeonseLoanRatio] = useState<"0" | "50" | "70" | "80">("70");
  const [loanRate, setLoanRate] = useState(3.8); // 3.8%
  const [savingsRate, setSavingsRate] = useState(3.2); // 3.2%

  // Monthly Rent state
  const [rentDepMan, setRentDepMan] = useState(3000); // 3천만
  const [monthlyRentMan, setMonthlyRentMan] = useState(100); // 100만
  const [applyTaxCredit, setApplyTaxCredit] = useState<"yes" | "no">("yes"); // 15% credit

  const jeonseDeposit = jeonseDepMan * 10000;
  const rentDeposit = rentDepMan * 10000;
  const monthlyRent = monthlyRentMan * 10000;

  // Jeonse cost breakdown
  const loanRatioNum = Number(jeonseLoanRatio) / 100;
  const jeonseLoan = jeonseDeposit * loanRatioNum;
  const jeonseEquity = jeonseDeposit - jeonseLoan;

  const monthlyLoanInterest = (jeonseLoan * (loanRate / 100)) / 12;
  const monthlyEquityOppCost = (jeonseEquity * (savingsRate / 100)) / 12;
  const totalJeonseMonthlyCost = monthlyLoanInterest + monthlyEquityOppCost;

  // Monthly rent cost breakdown
  const monthlyRentEquityOppCost = (rentDeposit * (savingsRate / 100)) / 12;
  // Tax credit: 15% up to 7.5M yearly cap (max 1.125M / year => 93,750 / mo)
  const monthlyTaxCredit = applyTaxCredit === "yes" ? Math.min(monthlyRent * 0.15, 93750) : 0;
  const totalRentMonthlyCost = monthlyRent + monthlyRentEquityOppCost - monthlyTaxCredit;

  // Comparison
  const diffMonthly = Math.abs(totalJeonseMonthlyCost - totalRentMonthlyCost);
  const diffYearly = diffMonthly * 12;
  const isJeonseCheaper = totalJeonseMonthlyCost < totalRentMonthlyCost;

  // Implied jeonse conversion rate
  const depositDiff = jeonseDeposit - rentDeposit;
  const impliedConversionRate = depositDiff > 0 ? (monthlyRent * 12 / depositDiff) * 100 : 0;
  const legalConversionRate = 5.25; // Base rate + 2.0%

  return (
    <div className="space-y-6">
      {/* Input Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Jeonse Section */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <span>🏠 전세 조건</span>
            </h3>
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
              보증금 {won(jeonseDeposit)}
            </span>
          </div>

          <NumberField
            label="전세 보증금"
            value={jeonseDepMan}
            onChange={setJeonseDepMan}
            suffix="만원"
            step={1000}
            min={1000}
          />

          <ChoiceChips
            legend="전세대출 비율"
            value={jeonseLoanRatio}
            options={[
              { value: "0", label: "0% (전액 자기자본)" },
              { value: "50", label: "50% 대출" },
              { value: "70", label: "70% 대출" },
              { value: "80", label: "80% 대출" },
            ]}
            onChange={setJeonseLoanRatio}
          />

          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="전세대출 금리"
              value={loanRate}
              onChange={setLoanRate}
              suffix="%"
              step={0.1}
              min={0.1}
            />
            <NumberField
              label="예금 기회비용 금리"
              value={savingsRate}
              onChange={setSavingsRate}
              suffix="%"
              step={0.1}
              min={0.1}
            />
          </div>

          <div className="rounded-xl bg-muted/30 p-3 text-xs space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>대출 이자 부담</span>
              <span className="font-semibold text-foreground">{won(monthlyLoanInterest)} /월</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>자기자본 기회비용</span>
              <span className="font-semibold text-foreground">{won(monthlyEquityOppCost)} /월</span>
            </div>
            <div className="flex justify-between text-primary font-bold border-t border-border pt-1 mt-1">
              <span>전세 월 실질 주거비</span>
              <span>{won(totalJeonseMonthlyCost)} /월</span>
            </div>
          </div>
        </div>

        {/* Monthly Rent Section */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <span>🏢 월세 조건</span>
            </h3>
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
              보증금 {won(rentDeposit)} / 월 {won(monthlyRent)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="월세 보증금"
              value={rentDepMan}
              onChange={setRentDepMan}
              suffix="만원"
              step={500}
              min={0}
            />
            <NumberField
              label="월세액 (관리비 제외)"
              value={monthlyRentMan}
              onChange={setMonthlyRentMan}
              suffix="만원"
              step={5}
              min={5}
            />
          </div>

          <ChoiceChips
            legend="월세 세액공제 대상 여부 (총급여 7천만 이하 무주택자)"
            value={applyTaxCredit}
            options={[
              { value: "yes", label: "공제 대상 (월 최대 약 9.3만원 환급)" },
              { value: "no", label: "공제 미대상" },
            ]}
            onChange={setApplyTaxCredit}
          />

          <div className="rounded-xl bg-muted/30 p-3 text-xs space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>월세 납부액</span>
              <span className="font-semibold text-foreground">{won(monthlyRent)} /월</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>보증금 기회비용</span>
              <span className="font-semibold text-foreground">{won(monthlyRentEquityOppCost)} /월</span>
            </div>
            {applyTaxCredit === "yes" && (
              <div className="flex justify-between text-success font-semibold">
                <span>월세 세액공제 혜택</span>
                <span>-{won(monthlyTaxCredit)} /월</span>
              </div>
            )}
            <div className="flex justify-between text-primary font-bold border-t border-border pt-1 mt-1">
              <span>월세 실질 주거비</span>
              <span>{won(totalRentMonthlyCost)} /월</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Result Banner */}
      <div className="rounded-2xl border-2 border-primary/30 bg-card p-6 shadow-sm space-y-4">
        <div className="text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase">
              실질 주거비용 판정 결과
            </span>
            <div className="text-2xl sm:text-3xl font-black text-primary mt-1">
              {isJeonseCheaper ? "전세 계약이 더 유리합니다" : "월세 계약이 더 유리합니다"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              매월 약 <strong className="text-foreground">{won(diffMonthly)}</strong> (연간 약{" "}
              <strong className="text-foreground">{won(diffYearly)}</strong>) 절약됩니다.
            </p>
          </div>

          <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-center">
            <span className="text-xs font-semibold text-muted-foreground block">
              이 매물의 실질 전월세전환율
            </span>
            <span className="text-xl font-black text-primary">
              {impliedConversionRate.toFixed(2)}%
            </span>
            <span className="text-xs text-muted-foreground block mt-0.5">
              (법정 기준: {legalConversionRate}%)
            </span>
          </div>
        </div>

        {/* Financial Insight */}
        <div className="border-t border-border pt-4 text-xs text-muted-foreground space-y-1">
          <p>
            • 실질 전월세전환율({impliedConversionRate.toFixed(2)}%)이 전세대출 금리({loanRate}%)보다 높으면
            <strong> 전세가 유리</strong>하고, 대출 금리보다 낮으면 <strong>월세가 유리</strong>합니다.
          </p>
          <p>
            • 전세사기 보증금 미반환 리스크를 고려할 경우 HUG/SGI 보증보험료(연 약 0.1~0.2%)를 감안하여 최종 선택하는 것을 권장합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
