import { useState } from "react";
import {
  chinaComprehensive,
  type FrMicroKind,
  franceComprehensive,
  type IncomeTaxCountry,
  japanFiling,
  type JpBlueDeduction,
  spainComprehensive,
} from "../../lib/comprehensive-income-tax-countries";
import ChoiceChips from "./payroll/ChoiceChips";
import NumberField from "./payroll/NumberField";

// One calculator per country's own income tax on combined income. The Korean 종합소득세 lives in
// ComprehensiveIncomeTaxCalc (ko/en).
interface Props {
  country: IncomeTaxCountry;
}

type YesNo = "yes" | "no";

const fmt = (locale: string, currency: string, n: number, digits = 0) =>
  new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: digits }).format(n);
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

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

type BlueChoice = "650000" | "550000" | "100000" | "0";

function Japan() {
  const [salary, setSalary] = useState(5_000_000);
  const [revenue, setRevenue] = useState(3_000_000);
  const [expenses, setExpenses] = useState(1_000_000);
  const [blue, setBlue] = useState<BlueChoice>("650000");
  const [other, setOther] = useState(0);
  const [social, setSocial] = useState(750_000);
  const [otherDed, setOtherDed] = useState(0);
  const [spouse, setSpouse] = useState<YesNo>("no");
  const [dependents, setDependents] = useState(0);
  const [specific, setSpecific] = useState(0);
  const [prepaid, setPrepaid] = useState(120_000);
  const r = japanFiling({
    salary,
    businessRevenue: revenue,
    businessExpenses: expenses,
    blueDeduction: Number(blue) as JpBlueDeduction,
    otherIncome: other,
    socialInsurance: social,
    otherDeductions: otherDed,
    spouse: spouse === "yes",
    dependents,
    specificDependents: specific,
    prepaid,
  });
  const yen = (n: number) => fmt("ja-JP", "JPY", n);
  return (
    <>
      <p className="text-sm text-muted-foreground">給与と事業・副業の所得を合わせて確定申告する場合の、令和8年分の所得税と翌年度の住民税を見積もります。</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <NumberField label="給与・賞与の収入金額（源泉徴収票の支払金額）" value={salary} onChange={setSalary} suffix="円" step={100_000} />
        <NumberField label="源泉徴収税額・予定納税額の合計" value={prepaid} onChange={setPrepaid} suffix="円" step={1_000} />
        <NumberField label="事業の売上（収入金額）" value={revenue} onChange={setRevenue} suffix="円" step={100_000} />
        <NumberField label="事業の必要経費" value={expenses} onChange={setExpenses} suffix="円" step={10_000} />
        <NumberField label="雑所得など、その他の所得（経費を引いた額）" value={other} onChange={setOther} suffix="円" step={10_000} />
        <NumberField label="社会保険料（健康保険・年金など、本人負担の合計）" value={social} onChange={setSocial} suffix="円" step={10_000} />
        <NumberField label="その他の所得控除（生命保険料・医療費・iDeCo など）" value={otherDed} onChange={setOtherDed} suffix="円" step={10_000} />
      </div>
      <div className="mt-4 grid gap-4">
        <ChoiceChips
          legend="青色申告特別控除"
          value={blue}
          onChange={setBlue}
          options={[
            { value: "650000", label: "65万円（e-Tax・電子帳簿）" },
            { value: "550000", label: "55万円" },
            { value: "100000", label: "10万円" },
            { value: "0", label: "白色申告" },
          ]}
        />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <ChoiceChips legend="配偶者控除（38万円）" value={spouse} onChange={setSpouse} options={yesNo("あり", "なし")} />
        <NumberField label="一般の扶養親族（16歳以上）" value={dependents} onChange={setDependents} suffix="人" step={1} />
        <NumberField label="特定扶養親族（19〜22歳）" value={specific} onChange={setSpecific} suffix="人" step={1} />
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="合計所得金額" value={yen(r.totalIncome)} note={`給与所得 ${yen(r.employmentIncome)} ＋ 事業所得 ${yen(r.businessIncome)}（青色控除 ${yen(r.blue)}）`} />
        <Result label="課税所得金額" value={yen(r.taxable)} note={`所得控除 ${yen(r.deductions)}（基礎控除 ${yen(r.basic)}）`} />
        <Result label="所得税＋復興特別所得税" value={yen(r.incomeTax)} note={`算出税額 ${yen(r.computed)} × 102.1%`} />
      </div>
      <div aria-live="polite" className="mt-3 grid gap-3 sm:grid-cols-2">
        <Result label={r.balance >= 0 ? "確定申告で納める所得税" : "確定申告で還付される所得税"} value={yen(Math.abs(r.balance))} note="年税額 − 源泉徴収税額・予定納税額" />
        <Result label="住民税（翌年度）" value={yen(r.residentTax)} note={`所得割 10% ${yen(r.incomeLevy)}（調整控除 ${yen(r.adjustment)}）＋ 均等割 ${yen(r.perCapita)}`} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">令和8年分の給与所得控除（最低74万円）・基礎控除（合計所得489万円以下は104万円、655万円以下は67万円）で計算します。住民税は基礎控除43万円で、均等割は標準額（森林環境税を含む5,000円）です。配偶者控除は本人の合計所得900万円以下として扱い、所得金額調整控除・寡婦控除・税額控除（住宅ローン控除・配当控除）、分離課税の所得は含めていません。</p>
    </>
  );
}

function China() {
  const [wages, setWages] = useState(200_000);
  const [labour, setLabour] = useState(50_000);
  const [royalties, setRoyalties] = useState(0);
  const [author, setAuthor] = useState(0);
  const [social, setSocial] = useState(24_000);
  const [special, setSpecial] = useState(36_000);
  const [other, setOther] = useState(0);
  const [prepaid, setPrepaid] = useState(15_000);
  const r = chinaComprehensive({ wages, labour, royalties, authorFees: author, socialInsurance: social, specialAdditional: special, other, prepaid });
  const cny = (n: number) => fmt("zh-CN", "CNY", n, 2);
  return (
    <>
      <p className="text-sm text-muted-foreground">工资薪金、劳务报酬、稿酬和特许权使用费合并为综合所得，按年计算个人所得税。</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <NumberField label="工资薪金（全年税前）" value={wages} onChange={setWages} suffix="元" step={1_000} />
        <NumberField label="劳务报酬（全年收入，按80%计入）" value={labour} onChange={setLabour} suffix="元" step={1_000} />
        <NumberField label="特许权使用费（按80%计入）" value={royalties} onChange={setRoyalties} suffix="元" step={1_000} />
        <NumberField label="稿酬（按80%再减按70%计入）" value={author} onChange={setAuthor} suffix="元" step={1_000} />
        <NumberField label="专项扣除（个人缴纳的三险一金）" value={social} onChange={setSocial} suffix="元" step={1_000} />
        <NumberField label="专项附加扣除全年合计（子女、赡养老人、住房等）" value={special} onChange={setSpecial} suffix="元" step={1_000} />
        <NumberField label="其他扣除（个人养老金、商业健康险等）" value={other} onChange={setOther} suffix="元" step={100} />
        <NumberField label="已预扣预缴税额" value={prepaid} onChange={setPrepaid} suffix="元" step={100} />
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="综合所得收入额" value={cny(r.incomeAmount)} />
        <Result label="应纳税所得额" value={cny(r.taxable)} note="收入额 − 60,000 − 专项扣除 − 专项附加扣除 − 其他扣除" />
        <Result label="全年应纳税额" value={cny(r.due)} note="综合所得年度税率表 3%–45%" />
      </div>
      <div aria-live="polite" className="mt-3 grid gap-3 sm:grid-cols-2">
        <Result label={r.balance > 0 ? "汇算应补税额" : "汇算应退税额"} value={cny(Math.abs(r.balance))} note="全年应纳税额 − 已预缴税额" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">经营所得（个体工商户、个人独资企业）、利息股息红利、财产转让等分类所得不并入综合所得，另行计税。全年一次性奖金选择单独计税的，不要计入工资薪金。</p>
    </>
  );
}

function France() {
  const [salaries, setSalaries] = useState(30_000);
  const [micro, setMicro] = useState(20_000);
  const [kind, setKind] = useState<FrMicroKind>("bnc");
  const [other, setOther] = useState(0);
  const [couple, setCouple] = useState<YesNo>("no");
  const [children, setChildren] = useState(0);
  const [prepaid, setPrepaid] = useState(2_000);
  const r = franceComprehensive({ salaries, microTurnover: micro, microKind: kind, otherNet: other, couple: couple === "yes", children, prepaid });
  const eur = (n: number) => fmt("fr-FR", "EUR", n);
  return (
    <>
      <p className="text-sm text-muted-foreground">Tous les revenus du foyer sont additionnés puis imposés au barème progressif avec le quotient familial.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <NumberField label="Salaires nets imposables du foyer" value={salaries} onChange={setSalaries} suffix="€" step={500} />
        <NumberField label="Chiffre d'affaires micro-entreprise (sans versement libératoire)" value={micro} onChange={setMicro} suffix="€" step={500} />
        <NumberField label="Autres revenus nets imposables (fonciers, BNC/BIC au réel, pensions)" value={other} onChange={setOther} suffix="€" step={500} />
        <NumberField label="Prélèvement à la source et acomptes payés" value={prepaid} onChange={setPrepaid} suffix="€" step={100} />
      </div>
      <div className="mt-4 grid gap-4">
        <ChoiceChips
          legend="Activité de la micro-entreprise"
          value={kind}
          onChange={setKind}
          options={[
            { value: "bnc", label: "BNC (abattement 34 %)" },
            { value: "bic-services", label: "BIC services (50 %)" },
            { value: "bic-vente", label: "BIC vente (71 %)" },
          ]}
        />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ChoiceChips legend="Situation" value={couple} onChange={setCouple} options={yesNo("Marié ou pacsé", "Célibataire")} />
        <NumberField label="Enfants à charge" value={children} onChange={setChildren} suffix="enf." step={1} />
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="Revenu net imposable" value={eur(r.revenu)} note={`Salaires ${eur(r.salaryNet)} + micro ${eur(r.microNet)} + autres`} />
        <Result label="Impôt brut" value={eur(r.brut)} note={`${r.parts} part${r.parts > 1 ? "s" : ""}${r.capped ? ", quotient familial plafonné" : ""}`} />
        <Result label="Impôt sur le revenu" value={eur(r.impot)} note={r.decote ? `Décote ${eur(r.decote)}` : `Taux moyen ${r.revenu > 0 ? pct(r.impot / r.revenu) : "0 %"}`} />
      </div>
      <div aria-live="polite" className="mt-3 grid gap-3 sm:grid-cols-2">
        <Result label={r.balance > 0 ? "Solde à payer" : "Remboursement attendu"} value={eur(Math.abs(r.balance))} note="Impôt − prélèvement à la source et acomptes" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Barème 2026 (revenus 2025). Les revenus de capitaux mobiliers et plus-values au prélèvement forfaitaire unique, la demi-part de parent isolé, les réductions et crédits d'impôt et les prélèvements sociaux ne sont pas inclus.</p>
    </>
  );
}

function Spain() {
  const [gross, setGross] = useState(30_000);
  const [ss, setSs] = useState(1_950);
  const [activity, setActivity] = useState(10_000);
  const [other, setOther] = useState(0);
  const [children, setChildren] = useState(0);
  const [over65, setOver65] = useState<YesNo>("no");
  const [prepaid, setPrepaid] = useState(5_500);
  const r = spainComprehensive({ grossSalary: gross, socialSecurity: ss, activityNet: activity, otherGeneral: other, children, over65: over65 === "yes", prepaid });
  const eur = (n: number) => fmt("es-ES", "EUR", n, 2);
  return (
    <>
      <p className="text-sm text-muted-foreground">Suma los rendimientos que van a la base imponible general del IRPF: trabajo, actividades económicas y alquileres.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <NumberField label="Rendimientos íntegros del trabajo" value={gross} onChange={setGross} suffix="€" step={500} />
        <NumberField label="Cotizaciones a la Seguridad Social (trabajo)" value={ss} onChange={setSs} suffix="€" step={100} />
        <NumberField label="Rendimiento neto de actividades económicas" value={activity} onChange={setActivity} suffix="€" step={500} />
        <NumberField label="Rendimiento neto de alquileres y otras rentas generales" value={other} onChange={setOther} suffix="€" step={500} />
        <NumberField label="Retenciones y pagos fraccionados" value={prepaid} onChange={setPrepaid} suffix="€" step={100} />
        <NumberField label="Hijos que dan derecho al mínimo por descendientes" value={children} onChange={setChildren} suffix="hijos" step={1} />
        <ChoiceChips legend="65 años o más" value={over65} onChange={setOver65} options={yesNo("Sí", "No")} />
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="Base liquidable general" value={eur(r.base)} note={r.reduction ? `Incluye la reducción por rendimientos del trabajo (${eur(r.reduction)})` : "Sin reducción por rendimientos del trabajo"} />
        <Result label="Cuota íntegra" value={eur(r.cuota)} note={`Mínimo personal y familiar ${eur(r.minimo)} al 0 %`} />
        <Result label="Tipo marginal / medio" value={`${pct(r.marginal)} / ${pct(r.effective)}`} note="Escala estatal + autonómica supletoria" />
      </div>
      <div aria-live="polite" className="mt-3 grid gap-3 sm:grid-cols-2">
        <Result label={r.result > 0 ? "Resultado: a ingresar" : "Resultado: a devolver"} value={eur(Math.abs(r.result))} note="Cuota − retenciones y pagos a cuenta" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">La reducción por rendimientos del trabajo solo se aplica si las demás rentas no superan 6.500 €. Intereses, dividendos y ganancias por venta van a la base del ahorro (19 % a 30 %) y no se incluyen. Cada comunidad autónoma tiene su escala y sus deducciones, así que el resultado real puede variar.</p>
    </>
  );
}

export default function ComprehensiveIncomeTaxCountryCalculator({ country }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      {country === "jp" && <Japan />}
      {country === "cn" && <China />}
      {country === "fr" && <France />}
      {country === "es" && <Spain />}
    </div>
  );
}
