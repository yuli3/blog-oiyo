import { useState } from "react";
import { type ChinaRentTier, chinaYearEnd, franceYearEnd, japanYearEnd, spainYearEnd, type YearEndCountry } from "../../lib/year-end-settlement-countries";
import ChoiceChips from "./payroll/ChoiceChips";
import NumberField from "./payroll/NumberField";

// One calculator per country's own procedure. The Korean 연말정산 lives in YearEndSettlementCalculator (ko/en).
interface Props {
  country: YearEndCountry;
}

type YesNo = "yes" | "no";

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

const yesNo = (yes: string, no: string) => [
  { value: "yes" as const, label: yes },
  { value: "no" as const, label: no },
];

function Japan() {
  const [salary, setSalary] = useState(5_000_000);
  const [withheld, setWithheld] = useState(130_000);
  const [social, setSocial] = useState(750_000);
  const [general, setGeneral] = useState(0);
  const [medical, setMedical] = useState(0);
  const [pension, setPension] = useState(0);
  const [spouse, setSpouse] = useState<YesNo>("no");
  const [dependents, setDependents] = useState(0);
  const [specific, setSpecific] = useState(0);
  const [loan, setLoan] = useState(0);
  const r = japanYearEnd({ salary, withheld, socialInsurance: social, lifePremiums: [general, medical, pension], spouse: spouse === "yes", dependents, specificDependents: specific, housingLoanCredit: loan });
  const yen = (n: number) => fmt("ja-JP", "JPY", n);
  return (
    <>
      <p className="text-sm text-muted-foreground">源泉徴収票または12月の給与明細の累計額を入れます。</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <NumberField label="給与・賞与の年間支払額" value={salary} onChange={setSalary} suffix="円" step={100_000} />
        <NumberField label="源泉徴収された所得税（1〜12月の合計）" value={withheld} onChange={setWithheld} suffix="円" step={1_000} />
        <NumberField label="社会保険料（健康保険・厚生年金・雇用保険など）" value={social} onChange={setSocial} suffix="円" step={10_000} />
        <NumberField label="住宅借入金等特別控除額（証明書の額、2年目以降）" value={loan} onChange={setLoan} suffix="円" step={1_000} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <NumberField label="一般生命保険料（新制度）" value={general} onChange={setGeneral} suffix="円" step={1_000} />
        <NumberField label="介護医療保険料" value={medical} onChange={setMedical} suffix="円" step={1_000} />
        <NumberField label="個人年金保険料（新制度）" value={pension} onChange={setPension} suffix="円" step={1_000} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <ChoiceChips legend="配偶者控除（38万円、配偶者の所得が基準以下）" value={spouse} onChange={setSpouse} options={yesNo("あり", "なし")} />
        <NumberField label="一般の扶養親族（16歳以上）" value={dependents} onChange={setDependents} suffix="人" step={1} />
        <NumberField label="特定扶養親族（19〜22歳）" value={specific} onChange={setSpecific} suffix="人" step={1} />
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="給与所得" value={yen(r.employmentIncome)} note="給与 − 給与所得控除" />
        <Result label="課税給与所得" value={yen(r.taxable)} note={`所得控除 ${yen(r.deductions)}（基礎控除 ${yen(r.basic)}、生命保険料控除 ${yen(r.life)}）`} />
        <Result label="年調年税額" value={yen(r.annualTax)} note={r.loanCredit ? `算出税額 ${yen(r.computed)} − 住宅ローン控除 ${yen(r.loanCredit)}、×102.1%` : `算出税額 ${yen(r.computed)} × 102.1%`} />
      </div>
      <div aria-live="polite" className="mt-3 grid gap-3 sm:grid-cols-2">
        <Result label={r.refund >= 0 ? "還付される額（見込み）" : "追加で徴収される額（見込み）"} value={yen(Math.abs(r.refund))} note="源泉徴収税額 − 年調年税額" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">令和8年分の給与所得控除（最低74万円）と基礎控除（合計所得489万円以下は104万円）で計算します。実際の年末調整は給与所得控除を4千円刻みの表で求めるため、数百円ずれることがあります。給与が2,000万円を超える人、医療費控除・ふるさと納税（6団体以上）・住宅ローン控除の1年目は確定申告が必要です。</p>
    </>
  );
}

function China() {
  const [income, setIncome] = useState(200_000);
  const [social, setSocial] = useState(24_000);
  const [children, setChildren] = useState(1);
  const [elderly, setElderly] = useState(3_000);
  const [rent, setRent] = useState<ChinaRentTier>("none");
  const [mortgage, setMortgage] = useState<YesNo>("no");
  const [edu, setEdu] = useState(0);
  const [medical, setMedical] = useState(0);
  const [other, setOther] = useState(0);
  const [prepaid, setPrepaid] = useState(3_000);
  const r = chinaYearEnd({ income, socialInsurance: social, children, elderlyMonthly: elderly, rent, mortgage: mortgage === "yes", continuingEducation: edu, medical, other, prepaid });
  const cny = (n: number) => fmt("zh-CN", "CNY", n, 2);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="综合所得年收入额（工资薪金＋劳务报酬等）" value={income} onChange={setIncome} suffix="元" step={1_000} />
        <NumberField label="已预缴税额" value={prepaid} onChange={setPrepaid} suffix="元" step={100} />
        <NumberField label="专项扣除（个人缴纳的三险一金）" value={social} onChange={setSocial} suffix="元" step={1_000} />
        <NumberField label="其他扣除（个人养老金、商业健康险等）" value={other} onChange={setOther} suffix="元" step={100} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <NumberField label="子女教育＋3岁以下婴幼儿照护（孩子数，每孩每月2,000元）" value={children} onChange={setChildren} suffix="人" step={1} />
        <NumberField label="赡养老人（每月，独生子女3,000元，分摊不超过1,500元）" value={elderly} onChange={setElderly} suffix="元/月" step={100} />
        <ChoiceChips legend="住房贷款利息（首套，每月1,000元）" value={mortgage} onChange={setMortgage} options={yesNo("有", "无")} />
        {mortgage === "no" && (
          <ChoiceChips
            legend="住房租金（每月）"
            value={rent}
            onChange={setRent}
            options={[
              { value: "none", label: "无" },
              { value: "1500", label: "1,500元（直辖市、省会等）" },
              { value: "1100", label: "1,100元（人口超100万）" },
              { value: "800", label: "800元（其他城市）" },
            ]}
          />
        )}
        <NumberField label="继续教育（学历4,800元/年或职业资格3,600元）" value={edu} onChange={setEdu} suffix="元" step={400} />
        <NumberField label="大病医疗（自付超过15,000元的部分，限80,000元）" value={medical} onChange={setMedical} suffix="元" step={1_000} />
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="专项附加扣除合计" value={cny(r.special)} />
        <Result label="应纳税所得额" value={cny(r.taxable)} note="收入 − 60,000 − 专项扣除 − 专项附加扣除 − 其他扣除" />
        <Result label="全年应纳税额" value={cny(r.due)} note="综合所得年度税率表 3%–45%" />
      </div>
      <div aria-live="polite" className="mt-3 grid gap-3 sm:grid-cols-2">
        <Result label={r.refund >= 0 ? "应退税额" : "应补税额"} value={cny(Math.abs(r.refund))} note="已预缴税额 − 全年应纳税额" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">年度汇算在次年3月1日至6月30日通过个人所得税App办理。年收入不超过12万元需补税，或补税不超过400元的，可免予办理。劳务报酬、特许权使用费按收入的80%、稿酬按56%计入收入额。全年一次性奖金选择单独计税的不计入本表。</p>
    </>
  );
}

function France() {
  const [net, setNet] = useState(42_000);
  const [couple, setCouple] = useState<YesNo>("no");
  const [children, setChildren] = useState(0);
  const [withheld, setWithheld] = useState(2_600);
  const r = franceYearEnd({ netTaxable: net, couple: couple === "yes", children, withheld });
  const eur = (n: number) => fmt("fr-FR", "EUR", n);
  return (
    <>
      <p className="text-sm text-muted-foreground">La France n'a pas de régularisation de fin d'année par l'employeur : l'impôt de l'année est recalculé après la déclaration de revenus du printemps, puis comparé au prélèvement à la source déjà payé.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <NumberField label="Salaires nets imposables du foyer (cumul annuel)" value={net} onChange={setNet} suffix="€" step={500} />
        <NumberField label="Prélèvement à la source payé sur l'année" value={withheld} onChange={setWithheld} suffix="€" step={100} />
        <ChoiceChips legend="Situation" value={couple} onChange={setCouple} options={yesNo("Marié ou pacsé", "Célibataire")} />
        <NumberField label="Enfants à charge" value={children} onChange={setChildren} suffix="enf." step={1} />
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="Revenu net imposable" value={eur(r.revenu)} note={`Après abattement de 10 % (${eur(r.abattement)})`} />
        <Result label="Impôt brut" value={eur(r.brut)} note={`${r.parts} part${r.parts > 1 ? "s" : ""}${r.capped ? ", quotient familial plafonné (1 807 € par demi-part)" : ""}`} />
        <Result label="Impôt dû" value={eur(r.impot)} note={r.decote ? `Décote ${eur(r.decote)}` : "Barème 2026 sur les revenus 2025"} />
      </div>
      <div aria-live="polite" className="mt-3 grid gap-3 sm:grid-cols-2">
        <Result label={r.balance >= 0 ? "Remboursement attendu" : "Solde à payer"} value={eur(Math.abs(r.balance))} note={r.balance >= 0 ? "Versé fin juillet ou début août" : "Prélevé de septembre à décembre (en une fois si ≤ 300 €)"} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Calcul sur les seuls salaires. La demi-part de parent isolé, les réductions et crédits d'impôt (emploi à domicile, garde d'enfant, dons) et les autres revenus ne sont pas pris en compte.</p>
    </>
  );
}

function Spain() {
  const [gross, setGross] = useState(30_000);
  const [ss, setSs] = useState(1_950);
  const [withheld, setWithheld] = useState(4_200);
  const [children, setChildren] = useState(0);
  const [over65, setOver65] = useState<YesNo>("no");
  const [pension, setPension] = useState(0);
  const r = spainYearEnd({ grossSalary: gross, socialSecurity: ss, withheld, children, over65: over65 === "yes", pensionPlan: pension });
  const eur = (n: number) => fmt("es-ES", "EUR", n, 2);
  return (
    <>
      <p className="text-sm text-muted-foreground">Copia los importes del certificado de retenciones de tu empresa o de los datos fiscales de la Agencia Tributaria.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <NumberField label="Rendimientos íntegros del trabajo" value={gross} onChange={setGross} suffix="€" step={500} />
        <NumberField label="Retenciones e ingresos a cuenta" value={withheld} onChange={setWithheld} suffix="€" step={100} />
        <NumberField label="Cotizaciones a la Seguridad Social" value={ss} onChange={setSs} suffix="€" step={100} />
        <NumberField label="Aportaciones a planes de pensiones (máx. 1.500 €)" value={pension} onChange={setPension} suffix="€" step={100} />
        <NumberField label="Hijos que dan derecho al mínimo por descendientes" value={children} onChange={setChildren} suffix="hijos" step={1} />
        <ChoiceChips legend="65 años o más" value={over65} onChange={setOver65} options={yesNo("Sí", "No")} />
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="Base liquidable general" value={eur(r.base)} note={`Rendimiento neto − reducción ${eur(r.reduction)}${r.pension ? ` − plan de pensiones ${eur(r.pension)}` : ""}`} />
        <Result label="Mínimo personal y familiar" value={eur(r.minimo)} note="Tributa al 0 %" />
        <Result label="Cuota íntegra" value={eur(r.cuota)} note="Escala estatal + autonómica (19 % a 47 %)" />
      </div>
      <div aria-live="polite" className="mt-3 grid gap-3 sm:grid-cols-2">
        <Result label={r.result > 0 ? "Resultado: a ingresar" : "Resultado: a devolver"} value={eur(Math.abs(r.result))} note="Cuota − retenciones" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Se usa la escala autonómica supletoria (igual a la estatal); cada comunidad tiene la suya, así que el resultado real puede variar. No se incluyen deducciones autonómicas, la deducción por maternidad, la deducción por rendimientos del trabajo bajos ni otras rentas. Con un solo pagador y menos de 22.000 € no es obligatorio declarar, aunque conviene si sale a devolver.</p>
    </>
  );
}

export default function YearEndSettlementCountryCalculator({ country }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      {country === "jp" && <Japan />}
      {country === "cn" && <China />}
      {country === "fr" && <France />}
      {country === "es" && <Spain />}
    </div>
  );
}
