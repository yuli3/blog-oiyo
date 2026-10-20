import { useState } from "react";
import {
  chinaDays,
  chinaUnusedPay,
  CN_MONTHLY_WORKDAYS,
  franceIndemnity,
  FR_OUVRABLES_PER_MONTH,
  japanDays,
  JP_GRANT_TABLE,
  type LeaveCountry,
  spainPayout,
} from "../../lib/annual-leave-countries";
import NumberField from "./payroll/NumberField";

// One calculator per country's own law. The Korean rule lives in AnnualLeaveCalculator (ko/en).
interface Props {
  country: LeaveCountry;
}

const fmt = (locale: string, currency: string, n: number, digits = 0) =>
  new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: digits }).format(n);

function Result({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-md border border-border bg-background px-4 py-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold text-foreground">{value}</p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

function Japan() {
  const [months, setMonths] = useState(30);
  const [dailyPay, setDailyPay] = useState(12_000);
  const [remaining, setRemaining] = useState(5);
  const days = japanDays(months);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField label="継続勤務期間" value={months} onChange={setMonths} suffix="か月" step={6} />
        <NumberField label="1日分の賃金" value={dailyPay} onChange={setDailyPay} suffix="円" step={500} />
        <NumberField label="残っている日数" value={remaining} onChange={setRemaining} suffix="日" step={0.5} />
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-2">
        <Result label="今年の付与日数（労基法39条）" value={`${days}日`} note={days === 0 ? "入社6か月までは付与されません" : "直前1年（初回は6か月）の出勤率8割以上が条件"} />
        <Result label="残日数を賃金に換算" value={fmt("ja-JP", "JPY", dailyPay * remaining)} note="未消化分の買取りは原則できません。退職時の扱いは会社しだいです" />
      </div>
      <table className="mt-4 w-full text-sm">
        <tbody>
          {JP_GRANT_TABLE.map(([m, d]) => (
            <tr key={m} className={d === days ? "font-semibold text-foreground" : "text-muted-foreground"}>
              <td className="py-1">{m < 12 ? `${m}か月` : `${Math.floor(m / 12)}年${m % 12 ? `${m % 12}か月` : ""}`}{m === 78 ? "以上" : ""}</td>
              <td className="py-1 text-right font-mono">{d}日</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function China() {
  const [years, setYears] = useState(5);
  const [monthly, setMonthly] = useState(8_700);
  const [unused, setUnused] = useState(3);
  const days = chinaDays(years);
  const pay = chinaUnusedPay(monthly, unused);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField label="累计工作年限（含以前单位）" value={years} onChange={setYears} suffix="年" step={1} />
        <NumberField label="月工资" value={monthly} onChange={setMonthly} suffix="元" step={500} />
        <NumberField label="单位未安排的未休天数" value={unused} onChange={setUnused} suffix="天" step={1} />
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="法定年休假" value={`${days}天`} note="满1年5天，满10年10天，满20年15天" />
        <Result label="日工资" value={fmt("zh-CN", "CNY", pay.daily, 2)} note={`月工资 ÷ ${CN_MONTHLY_WORKDAYS}天`} />
        <Result label="未休年假应另付" value={fmt("zh-CN", "CNY", pay.extra)} note={`按300%支付（含正常工资），另付200%；合计 ${fmt("zh-CN", "CNY", pay.total300)}`} />
      </div>
    </>
  );
}

function France() {
  const [months, setMonths] = useState(12);
  const [gross, setGross] = useState(2_600);
  const [remaining, setRemaining] = useState(10);
  const r = franceIndemnity(gross, months, remaining);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField label="Mois travaillés (période de référence)" value={months} onChange={setMonths} suffix="mois" step={1} />
        <NumberField label="Salaire brut mensuel" value={gross} onChange={setGross} suffix="€" step={100} />
        <NumberField label="Jours restants" value={remaining} onChange={setRemaining} suffix="jours" step={1} />
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="Congés acquis" value={`${r.acquired} jours ouvrables`} note="2,5 jours par mois, arrondi au supérieur, 30 maximum" />
        <Result label="Règle du dixième" value={fmt("fr-FR", "EUR", r.tenth, 2)} note={`10 % du brut de référence × ${r.remaining}/${r.acquired}`} />
        <Result label="Maintien de salaire" value={fmt("fr-FR", "EUR", r.maintenance, 2)} note={`brut ÷ ${FR_OUVRABLES_PER_MONTH} jours ouvrables × ${r.remaining}`} />
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">
        Indemnité compensatrice due : {fmt("fr-FR", "EUR", r.due, 2)} ({r.method === "tenth" ? "règle du dixième" : "maintien de salaire"}, la plus favorable)
      </p>
    </>
  );
}

function Spain() {
  const [months, setMonths] = useState(6);
  const [annual, setAnnual] = useState(30_000);
  const [taken, setTaken] = useState(5);
  const r = spainPayout(annual, months, taken);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField label="Meses trabajados este año" value={months} onChange={setMonths} suffix="meses" step={1} />
        <NumberField label="Salario bruto anual" value={annual} onChange={setAnnual} suffix="€" step={1000} />
        <NumberField label="Días ya disfrutados" value={taken} onChange={setTaken} suffix="días" step={1} />
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="Vacaciones generadas" value={`${r.accrued} días naturales`} note="30 días al año, en proporción a los meses" />
        <Result label="Días pendientes" value={`${Math.round(r.pending * 100) / 100} días`} />
        <Result label="Compensación en el finiquito" value={fmt("es-ES", "EUR", r.payout, 2)} note={`salario anual ÷ 365 = ${fmt("es-ES", "EUR", r.daily, 2)} por día`} />
      </div>
    </>
  );
}

export default function AnnualLeaveCountryCalculator({ country }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      {country === "jp" && <Japan />}
      {country === "cn" && <China />}
      {country === "fr" && <France />}
      {country === "es" && <Spain />}
    </div>
  );
}
