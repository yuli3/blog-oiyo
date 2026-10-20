import { useState } from "react";
import {
  type ChinaCase,
  chinaCompensation,
  ES_RULES,
  franceIndemnity,
  japanNoticePay,
  japanRetirementTax,
  type SeveranceCountry,
  type SpainCase,
  spainIndemnity,
} from "../../lib/severance-countries";
import ChoiceChips from "./payroll/ChoiceChips";
import NumberField from "./payroll/NumberField";

// One calculator per country's own law. The Korean rule lives in SeveranceCalculator (ko/en).
interface Props {
  country: SeveranceCountry;
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
  const [years, setYears] = useState(10);
  const [payment, setPayment] = useState(5_000_000);
  const [wages3, setWages3] = useState(900_000);
  const [notice, setNotice] = useState(0);
  const yen = (n: number) => fmt("ja-JP", "JPY", n);
  const tax = japanRetirementTax(payment, years);
  const noticePay = japanNoticePay(wages3, 92, notice);
  return (
    <>
      <p className="text-sm text-muted-foreground">退職金は法律上の義務ではなく、就業規則・退職金規程がある会社だけが支払います。会社の規程で決まった額を入れると、手取りを計算します。</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <NumberField label="勤続年数（1年未満の端数は切上げ）" value={years} onChange={setYears} suffix="年" step={1} />
        <NumberField label="会社規程による退職金（額面）" value={payment} onChange={setPayment} suffix="円" step={100_000} />
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="退職所得控除" value={yen(tax.deduction)} note="20年まで40万円×年数、超える分は70万円×年数" />
        <Result label="課税退職所得" value={yen(tax.taxable)} note={tax.shortTerm ? "勤続5年以下：300万円を超える部分は1/2にしません" : "（退職金 − 控除）× 1/2"} />
        <Result label="手取り" value={yen(tax.net)} note={`所得税・復興税 ${yen(tax.incomeTax)}、住民税 ${yen(tax.residentTax)}（「退職所得の受給に関する申告書」提出時）`} />
      </div>
      <h3 className="mt-6 text-base font-bold text-foreground">解雇予告手当（労基法20条・法律上の義務）</h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <NumberField label="直前3か月の賃金総額" value={wages3} onChange={setWages3} suffix="円" step={10_000} />
        <NumberField label="解雇予告から解雇日までの日数" value={notice} onChange={setNotice} suffix="日" step={1} />
      </div>
      <div aria-live="polite" className="mt-4 grid gap-3 sm:grid-cols-2">
        <Result label="解雇予告手当" value={yen(noticePay)} note={`平均賃金 ${yen(wages3 / 92)}／日（3か月の暦日数92日で概算）× ${Math.max(0, 30 - notice)}日`} />
      </div>
    </>
  );
}

function China() {
  const [months, setMonths] = useState(42);
  const [wage, setWage] = useState(9_000);
  const [localAvg, setLocalAvg] = useState(10_000);
  const [kind, setKind] = useState<ChinaCase>("normal");
  const r = chinaCompensation(months, wage, localAvg, kind);
  const yuan = (n: number) => fmt("zh-CN", "CNY", n);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField label="在本单位工作时间" value={months} onChange={setMonths} suffix="个月" step={1} />
        <NumberField label="离职前12个月平均工资" value={wage} onChange={setWage} suffix="元" step={500} />
        <NumberField label="当地上年度职工月平均工资" value={localAvg} onChange={setLocalAvg} suffix="元" step={500} />
      </div>
      <div className="mt-4">
        <ChoiceChips
          legend="解除情形"
          value={kind}
          onChange={setKind}
          options={[
            { value: "normal", label: "经济补偿 N" },
            { value: "noNotice", label: "未提前30天通知 N+1" },
            { value: "unlawful", label: "违法解除 2N" },
          ]}
        />
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="计算年限 N" value={`${r.years}年`} note="满1年算1个月；6个月以上不满1年按1年，不满6个月按半个月" />
        <Result label="计算基数（月工资）" value={yuan(r.wage)} note={r.capped ? "超过当地月平均工资3倍：按3倍计算，年限最多12年" : "未超过当地月平均工资3倍"} />
        <Result label={kind === "unlawful" ? "赔偿金" : "经济补偿"} value={yuan(r.total)} note="劳动合同法第47条、第40条、第87条" />
      </div>
    </>
  );
}

function France() {
  const [months, setMonths] = useState(60);
  const [ref, setRef] = useState(2_800);
  const r = franceIndemnity(months, ref);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Ancienneté (préavis inclus)" value={months} onChange={setMonths} suffix="mois" step={1} />
        <NumberField label="Salaire de référence brut mensuel" value={ref} onChange={setRef} suffix="€" step={100} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Salaire de référence : la moyenne la plus favorable entre les 12 derniers mois et les 3 derniers mois (primes annuelles proratisées).</p>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-2">
        <Result label="Ancienneté retenue" value={`${Math.floor(r.years)} an(s) ${months % 12} mois`} note={r.eligible ? "Années incomplètes au prorata des mois" : "Il faut 8 mois d'ancienneté ininterrompue"} />
        <Result label="Indemnité légale de licenciement" value={fmt("fr-FR", "EUR", r.amount, 2)} note="1/4 de mois par année jusqu'à 10 ans, 1/3 au-delà (art. R1234-2)" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">La convention collective peut prévoir plus : c'est alors le montant le plus élevé qui s'applique. Même minimum pour une rupture conventionnelle.</p>
    </>
  );
}

function Spain() {
  const [months, setMonths] = useState(60);
  const [annual, setAnnual] = useState(30_000);
  const [kind, setKind] = useState<SpainCase>("improcedente");
  const r = spainIndemnity(months, annual, kind);
  const cap = ES_RULES[kind].capMonths;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Antigüedad" value={months} onChange={setMonths} suffix="meses" step={1} />
        <NumberField label="Salario bruto anual (con pagas extra)" value={annual} onChange={setAnnual} suffix="€" step={1000} />
      </div>
      <div className="mt-4">
        <ChoiceChips
          legend="Tipo de extinción"
          value={kind}
          onChange={setKind}
          options={[
            { value: "improcedente", label: "Improcedente · 33 días" },
            { value: "objetivo", label: "Objetivo · 20 días" },
            { value: "temporal", label: "Fin de contrato temporal · 12 días" },
          ]}
        />
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="Salario diario" value={fmt("es-ES", "EUR", r.daily, 2)} note="salario anual ÷ 365" />
        <Result label="Días de indemnización" value={`${r.days} días`} note={`${ES_RULES[kind].daysPerYear} días por año, prorrateado por meses`} />
        <Result label="Indemnización" value={fmt("es-ES", "EUR", r.amount, 2)} note={cap ? (r.capped ? `Tope de ${cap} mensualidades aplicado` : `Tope: ${cap} mensualidades`) : "Sin tope"} />
      </div>
      {kind === "improcedente" && <p className="mt-3 text-sm text-muted-foreground">Si el contrato empezó antes del 12/02/2012, el tiempo anterior se calcula a 45 días por año (tope 42 mensualidades). Esta calculadora aplica solo la regla de 33 días.</p>}
    </>
  );
}

export default function SeveranceCountryCalculator({ country }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      {country === "jp" && <Japan />}
      {country === "cn" && <China />}
      {country === "fr" && <France />}
      {country === "es" && <Spain />}
    </div>
  );
}
