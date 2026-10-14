import { useState } from "react";
import {
  APPLIANCE_PRESETS,
  applianceKwh,
  ELECTRICITY,
  electricityBill,
  parseElectricityText,
  seasonOf,
  type Season,
} from "../../lib/kr-electricity-2026";
import ChoiceChips from "./payroll/ChoiceChips";
import NumberField from "./payroll/NumberField";
import OneLineInput from "./payroll/OneLineInput";
import ResultSteps from "./payroll/ResultSteps";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
const kwhText = (n: number) => `${Math.round(n * 10) / 10}kWh`;

const SEASON_LABEL: Record<Season, string> = {
  other: "봄·가을 (구간 200 / 400kWh)",
  summer: "7~8월 (구간 300 / 450kWh)",
  winter: "12~2월 (구간 200 / 400kWh)",
};

export default function ElectricityBillCalculator() {
  const [kwh, setKwh] = useState(300);
  const [season, setSeason] = useState<Season>("other");
  const [preset, setPreset] = useState(APPLIANCE_PRESETS[0].id);
  const [watts, setWatts] = useState<number>(APPLIANCE_PRESETS[0].watts);
  const [hours, setHours] = useState<number>(APPLIANCE_PRESETS[0].hours);
  const [days, setDays] = useState(30);

  const valid = kwh >= 0 && kwh <= 5_000;
  const bill = valid ? electricityBill(kwh, season) : null;
  const extraKwh = applianceKwh(watts, hours, days);
  const withAppliance = valid ? electricityBill(kwh + extraKwh, season) : null;
  const added = bill && withAppliance ? withAppliance.total - bill.total : 0;
  const limits = season === "summer" ? ELECTRICITY.summerLimits : ELECTRICITY.otherLimits;
  const nextLimit = bill ? limits.find((l) => kwh <= l) : undefined;
  // nextLimit exists only in tier 1 or 2, so the next tier's index is 1 or 2.
  const nextIndex = bill ? (Math.min(bill.tier, 2) as 1 | 2) : 1;

  const pickPreset = (id: string) => {
    const p = APPLIANCE_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPreset(p.id);
    setWatts(p.watts);
    setHours(p.hours);
  };

  const applyText = (text: string) => {
    const p = parseElectricityText(text);
    const filled: string[] = [];
    if (p.kwh !== undefined) { setKwh(p.kwh); filled.push("사용량"); }
    if (p.month !== undefined) { setSeason(seasonOf(p.month)); filled.push("계절"); }
    if (p.watts !== undefined) { setWatts(p.watts); filled.push("소비전력"); }
    if (p.hours !== undefined) { setHours(p.hours); filled.push("사용 시간"); }
    return filled;
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card p-5">
        <OneLineInput
          label="이번 달 사용량을 한 줄로 적어 보세요"
          placeholder="예: 8월 350kWh 에어컨 700W 하루 8시간"
          examples={["10월 300kWh", "8월 350kWh 에어컨 700W 하루 8시간", "1월 280kWh 전기히터 1.5kW 3시간"]}
          onApply={applyText}
        />

        <div className="mt-4">
          <NumberField label="한 달 사용량 (고지서의 '사용량')" value={kwh} onChange={setKwh} suffix="kWh" step={10} />
        </div>
        <div className="mt-4">
          <ChoiceChips
            legend="사용한 달"
            value={season}
            onChange={setSeason}
            options={[
              { value: "other", label: "3~6월, 9~11월" },
              { value: "summer", label: "7~8월" },
              { value: "winter", label: "12~2월" },
            ]}
          />
        </div>

        <div aria-live="polite" className="mt-5">
          {bill === null ? (
            <p className="text-sm text-muted-foreground">사용량은 0~5,000kWh 사이로 넣어 주세요.</p>
          ) : (
            <div className="rounded-md border border-border bg-background px-4 py-4">
              <p className="text-sm text-muted-foreground">예상 청구액 ({SEASON_LABEL[season]}, {bill.tier}단계)</p>
              <p className="mt-1 font-mono text-3xl font-bold text-foreground">{won(bill.total)}</p>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">전기요금계</dt>
                  <dd className="font-mono font-semibold text-foreground">{won(bill.subtotal)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">부가세</dt>
                  <dd className="font-mono font-semibold text-foreground">{won(bill.vat)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">전력기금</dt>
                  <dd className="font-mono font-semibold text-foreground">{won(bill.fund)}</dd>
                </div>
              </dl>
              {nextLimit !== undefined && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {nextLimit - kwh}kWh를 더 쓰면 {bill.tier + 1}단계로 넘어가 기본요금이 {won(ELECTRICITY.basic[nextIndex])}으로 오르고, 넘는 부분은 kWh당 {ELECTRICITY.energy[nextIndex]}원이 붙습니다.
                </p>
              )}
              <ResultSteps
                steps={[
                  `기본요금(${bill.tier}단계) = ${won(bill.basic)}`,
                  `전력량요금 = ${bill.bands.map((b) => `${b.kwh}kWh × ${b.rate}원`).join(" + ")} = ${won(bill.energy)}`,
                  `기후환경요금 = ${bill.kwh}kWh × ${ELECTRICITY.climate}원 = ${won(bill.climate)}`,
                  `연료비조정요금 = ${bill.kwh}kWh × ${ELECTRICITY.fuelAdjustment}원 = ${won(bill.fuel)}`,
                  `부가세 10% ${won(bill.vat)} + 전력기금 2.7% ${won(bill.fund)}, 10원 미만 절사 → ${won(bill.total)}`,
                ]}
                next={[
                  { href: "/ko/magazine-electricity-progressive-tiers/", label: "누진 구간 넘지 않는 법" },
                  { href: "/ko/magazine-electricity-dehumidifier-cost/", label: "제습기 한 달 전기료" },
                  { href: "/ko/magazine-electricity-blanket-vs-heater/", label: "전기장판·히터 전기료" },
                ]}
              />
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold text-foreground">기기 하나 더 쓰면 얼마나 늘까</h2>
        <p className="mt-1 text-sm text-muted-foreground">누진제라 같은 기기라도 원래 사용량에 따라 늘어나는 요금이 다릅니다. 소비전력은 예시이니 제품 라벨 값으로 바꿔 넣으세요.</p>
        <div className="mt-4 space-y-4">
          <ChoiceChips
            legend="기기"
            value={preset}
            onChange={pickPreset}
            options={APPLIANCE_PRESETS.map((p) => ({ value: p.id, label: p.label }))}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <NumberField label="소비전력" value={watts} onChange={setWatts} suffix="W" step={10} />
            <NumberField label="하루 사용 시간" value={hours} onChange={setHours} suffix="시간" step={0.5} />
            <NumberField label="사용 일수" value={days} onChange={setDays} suffix="일" step={1} />
          </div>
        </div>
        {bill && withAppliance && (
          <div aria-live="polite" className="mt-4 rounded-md border border-border bg-background px-4 py-3">
            <p className="text-sm text-muted-foreground">이 기기 때문에 늘어나는 요금</p>
            <p className="mt-1 font-mono text-2xl font-bold text-foreground">+{won(added)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {watts}W × {hours}시간 × {days}일 = {kwhText(extraKwh)}. 사용량이 {kwh}kWh에서 {kwhText(kwh + extraKwh)}로 늘어 청구액이 {won(bill.total)}에서 {won(withAppliance.total)}이 됩니다
              {withAppliance.tier > bill.tier ? `. ${withAppliance.tier}단계로 넘어갔습니다.` : "."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
