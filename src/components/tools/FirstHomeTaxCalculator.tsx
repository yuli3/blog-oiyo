import { useState } from "react";
import ChoiceChips from "./payroll/ChoiceChips";
import NumberField from "./payroll/NumberField";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

export default function FirstHomeTaxCalculator() {
  const [priceManwon, setPriceManwon] = useState(50000); // 5억
  const [areaOption, setAreaOption] = useState<"under85" | "over85">("under85");
  const [isFirstHome, setIsFirstHome] = useState<"yes" | "no">("yes");

  const price = priceManwon * 10000;

  // Base rate calculation (1-homeowner standard)
  let baseRate = 0.01;
  if (price <= 600000000) {
    baseRate = 0.01;
  } else if (price <= 900000000) {
    baseRate = (price * (2 / 300000000) - 3) / 100;
  } else {
    baseRate = 0.03;
  }

  const rawAcquisitionTax = price * baseRate;

  // First-home tax discount (Up to 2M KRW if price <= 1.2B KRW)
  const isEligible = isFirstHome === "yes" && price <= 1200000000;
  const discountAmount = isEligible ? Math.min(rawAcquisitionTax, 2000000) : 0;
  const netAcquisitionTax = Math.max(0, rawAcquisitionTax - discountAmount);

  // Local education tax (10% of base tax)
  const discountRatio = rawAcquisitionTax > 0 ? (rawAcquisitionTax - discountAmount) / rawAcquisitionTax : 1;
  const rawEducationTax = price * (baseRate * 0.1);
  const netEducationTax = isEligible ? rawEducationTax * discountRatio : rawEducationTax;

  // Special rural tax (0.2% if area > 85m2)
  const ruralTax = areaOption === "over85" ? price * 0.002 : 0;

  const totalRawTax = rawAcquisitionTax + rawEducationTax + ruralTax;
  const totalNetTax = netAcquisitionTax + netEducationTax + ruralTax;
  const totalSaved = totalRawTax - totalNetTax;

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
        <div>
          <NumberField
            label="주택 매수가액 (실거래가)"
            value={priceManwon}
            onChange={setPriceManwon}
            suffix="만원"
            step={1000}
            min={1000}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[30000, 50000, 60000, 80000, 90000, 110000, 120000, 150000].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setPriceManwon(v)}
                className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                {v / 10000}억
              </button>
            ))}
          </div>
        </div>

        <ChoiceChips
          legend="생애최초 주택 구입 여부 (세대원 전원 과거 무소유)"
          value={isFirstHome}
          options={[
            { value: "yes", label: "생애최초 대상 (최대 200만원 감면)" },
            { value: "no", label: "일반 취득 (기본 세율)" },
          ]}
          onChange={setIsFirstHome}
        />

        <ChoiceChips
          legend="전용면적 구분 (국민주택규모)"
          value={areaOption}
          options={[
            { value: "under85", label: "85㎡ 이하 (농특세 비과세)" },
            { value: "over85", label: "85㎡ 초과 (농특세 0.2% 부과)" },
          ]}
          onChange={setAreaOption}
        />
      </div>

      {/* Result Card */}
      <div className="rounded-2xl border-2 border-primary/30 bg-card p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-4">
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase">
              생애최초 취득세 최종 실납부 예상액
            </div>
            <div className="text-3xl font-black text-primary mt-1">
              {won(totalNetTax)}
            </div>
          </div>
          {isEligible && (
            <div className="rounded-xl bg-success/10 border border-success/20 px-3.5 py-2 text-right">
              <span className="text-xs font-bold text-success block">절세 혜택</span>
              <span className="text-sm font-black text-success">-{won(totalSaved)}</span>
            </div>
          )}
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>취득세 법정 기본세율</span>
            <span className="font-bold text-foreground">{(baseRate * 100).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>취득세 본세 (감면 전)</span>
            <span className="font-medium text-foreground">{won(rawAcquisitionTax)}</span>
          </div>
          <div className="flex justify-between text-success font-semibold">
            <span>- 생애최초 취득세 감면액 (지방세특례제한법 36조의3)</span>
            <span>-{won(discountAmount)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>지방교육세 (본세 연동)</span>
            <span className="font-medium text-foreground">{won(netEducationTax)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>농어촌특별세 (85㎡ {areaOption === "over85" ? "초과 0.2%" : "이하 면제"})</span>
            <span className="font-medium text-foreground">{won(ruralTax)}</span>
          </div>
        </div>

        {/* Requirement Notice */}
        <div className="rounded-xl bg-muted/30 p-4 border border-border/70 text-xs text-muted-foreground space-y-1.5">
          <div className="font-bold text-foreground flex items-center gap-1.5">
            <span>⚠️ 생애최초 취득세 감면 필수 유지 조건</span>
          </div>
          <p>• 매수가액 12억원 이하 주택에 한해 최대 200만원까지 감면됩니다.</p>
          <p>• 취득일로부터 3개월 이내에 상시 거주를 위한 주민등록 전입을 마쳐야 합니다.</p>
          <p>• 취득 후 3년 이내에 매도, 증여하거나 전월세 임대를 놓을 경우 감면된 세액이 추징됩니다.</p>
        </div>
      </div>
    </div>
  );
}
