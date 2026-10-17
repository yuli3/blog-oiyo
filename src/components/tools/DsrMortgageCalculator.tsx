import { useMemo, useState } from 'react';
import { computeStressDsrMortgage, STRESS_DSR_AS_OF, type RateType } from '../../lib/finance/stress-dsr';

const formatWon = (val: number) => Math.round(val).toLocaleString('ko-KR') + '원';
const formatEok = (val: number) => {
  const eok = Math.floor(val / 100000000);
  const man = Math.floor((val % 100000000) / 10000);
  if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString('ko-KR')}만 원`;
  if (eok > 0) return `${eok}억 원`;
  return `${man.toLocaleString('ko-KR')}만 원`;
};

const inputClass = 'mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary';
const toggleClass = (active: boolean) =>
  `flex-1 rounded-xl py-2 text-xs font-bold transition ${active ? 'bg-primary text-primary-foreground shadow-xs' : 'border border-border bg-card text-muted-foreground'}`;

const BINDING_TEXT = {
  ltv: 'LTV 한도가 가장 낮아서 최종 한도를 정했어요.',
  cap: '수도권·규제지역 주담대 최대 한도(시가 15억 이하 6억, 25억 이하 4억, 초과 2억)가 최종 한도를 정했어요.',
  dsr: '스트레스 금리를 더한 DSR 40% 한도가 최종 한도를 정했어요.',
} as const;

export default function DsrMortgageCalculator() {
  const [housePrice, setHousePrice] = useState<number>(800000000);
  const [annualIncome, setAnnualIncome] = useState<number>(60000000);
  const [existingAnnualPayment, setExistingAnnualPayment] = useState<number>(5000000);
  const [interestRate, setInterestRate] = useState<number>(4.0);
  const [maturityYears, setMaturityYears] = useState<number>(30);
  const [capitalArea, setCapitalArea] = useState<boolean>(true);
  const [regulatedArea, setRegulatedArea] = useState<boolean>(false);
  const [rateType, setRateType] = useState<RateType>('variable');
  const [fixedYears, setFixedYears] = useState<number>(5);

  const r = useMemo(
    () => computeStressDsrMortgage({ housePrice, annualIncome, existingAnnualPayment, interestRate, maturityYears, capitalArea, regulatedArea, rateType, fixedYears: rateType === 'variable' ? 0 : fixedYears }),
    [housePrice, annualIncome, existingAnnualPayment, interestRate, maturityYears, capitalArea, regulatedArea, rateType, fixedYears],
  );

  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          기준일 {STRESS_DSR_AS_OF} · 3단계 스트레스 DSR
        </span>
        <h2 className="mt-2 text-2xl font-black text-foreground">주택담보대출 LTV · 스트레스 DSR 한도 계산기</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          수도권·규제지역 주담대는 스트레스 금리 3.0%, 그 밖 지방 주담대는 2026년 말까지 0.75%(2단계 비율)를 대출 유형별 비율만큼 더해 한도를 추정해요.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="dsr-house" className="block text-xs font-bold text-foreground">주택 매매 가격 (원)</label>
          <input id="dsr-house" type="number" min="0" step="10000000" value={housePrice} onChange={(e) => setHousePrice(Number(e.target.value) || 0)} className={inputClass} />
          <span className="text-xs text-muted-foreground">{formatEok(housePrice)}</span>
        </div>
        <div>
          <label htmlFor="dsr-income" className="block text-xs font-bold text-foreground">연소득 (세전, 원)</label>
          <input id="dsr-income" type="number" min="0" step="5000000" value={annualIncome} onChange={(e) => setAnnualIncome(Number(e.target.value) || 0)} className={inputClass} />
          <span className="text-xs text-muted-foreground">{formatEok(annualIncome)}</span>
        </div>
        <div>
          <label htmlFor="dsr-existing" className="block text-xs font-bold text-foreground">기존 대출 연간 원리금상환액 (원)</label>
          <input id="dsr-existing" type="number" min="0" step="1000000" value={existingAnnualPayment} onChange={(e) => setExistingAnnualPayment(Number(e.target.value) || 0)} className={inputClass} />
          <span className="text-xs text-muted-foreground">신용대출·마통·차량할부 등 (연 {formatEok(existingAnnualPayment)})</span>
        </div>
        <div>
          <label htmlFor="dsr-rate" className="block text-xs font-bold text-foreground">대출 금리 (%) & 만기 (년)</label>
          <div className="mt-1 flex gap-2">
            <input id="dsr-rate" type="number" step="0.1" min="1" max="15" value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value) || 0)} className={inputClass} />
            <select aria-label="대출 만기" value={maturityYears} onChange={(e) => setMaturityYears(Number(e.target.value))} className={inputClass}>
              <option value={10}>10년</option>
              <option value={20}>20년</option>
              <option value={30}>30년</option>
              <option value={40}>40년</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="dsr-type" className="block text-xs font-bold text-foreground">금리 유형</label>
          <div className="mt-1 flex gap-2">
            <select id="dsr-type" value={rateType} onChange={(e) => setRateType(e.target.value as RateType)} className={inputClass}>
              <option value="variable">변동형</option>
              <option value="mixed">혼합형 (일정 기간 고정 후 변동)</option>
              <option value="periodic">주기형 (일정 주기마다 금리 변경)</option>
            </select>
            {rateType !== 'variable' && (
              <select aria-label="고정 기간 또는 금리 변동 주기" value={fixedYears} onChange={(e) => setFixedYears(Number(e.target.value))} className={inputClass}>
                <option value={3}>3년</option>
                <option value={5}>5년</option>
                <option value={10}>10년</option>
                <option value={15}>15년</option>
                <option value={20}>20년</option>
              </select>
            )}
          </div>
        </div>
        <div>
          <span className="block text-xs font-bold text-foreground">주택 소재지</span>
          <div className="mt-1 flex gap-2">
            <button type="button" aria-pressed={capitalArea} onClick={() => setCapitalArea(true)} className={toggleClass(capitalArea)}>수도권</button>
            <button type="button" aria-pressed={!capitalArea} onClick={() => setCapitalArea(false)} className={toggleClass(!capitalArea)}>지방</button>
          </div>
        </div>
        <div>
          <span className="block text-xs font-bold text-foreground">규제지역(투기과열·조정대상) 여부</span>
          <div className="mt-1 flex gap-2">
            <button type="button" aria-pressed={!regulatedArea} onClick={() => setRegulatedArea(false)} className={toggleClass(!regulatedArea)}>비규제 (LTV 70%)</button>
            <button type="button" aria-pressed={regulatedArea} onClick={() => setRegulatedArea(true)} className={toggleClass(regulatedArea)}>규제지역 (LTV 40%)</button>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-secondary p-5" aria-live="polite">
        <p className="text-xs font-bold text-secondary-foreground">추정 최대 대출 가능 금액</p>
        <p className="mt-1 text-3xl font-black text-primary">{formatEok(r.finalMaxLoan)}</p>
        <p className="mt-1 text-sm text-foreground">{BINDING_TEXT[r.binding]}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          실제 월 상환액: 약 {formatWon(r.finalMonthlyPayment)} / 월 (연 {formatWon(r.finalAnnualPayment)}, DSR {r.finalDsrPercent.toFixed(1)}%)
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-muted-foreground">LTV {r.ltvPercent}% 한도</p>
          <p className="mt-1 text-base font-black text-foreground">{formatEok(r.ltvAmount)}</p>
          {r.cap !== null && <p className="mt-0.5 text-muted-foreground">주담대 최대 {formatEok(r.cap)}</p>}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-muted-foreground">일반 DSR 한도 (금리 {interestRate}%)</p>
          <p className="mt-1 text-base font-black text-foreground">{formatEok(r.normalDsrPrincipal)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-muted-foreground">스트레스 DSR 한도 (심사 금리 {r.stressedRate.toFixed(2)}%)</p>
          <p className="mt-1 text-base font-black text-foreground">{formatEok(r.stressedDsrPrincipal)}</p>
          <p className="mt-0.5 text-destructive">▼ {formatEok(r.dsrReduction)} 감소</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        적용 스트레스 금리: {r.stress.stage} {r.stress.baseRate}% × 유형 비율 {Math.round(r.stress.ratio * 100)}% = +{r.stress.addon.toFixed(2)}%p (한도 산정용 가상 금리이며 실제 이자에는 붙지 않아요)
      </p>
    </div>
  );
}
