import { useState } from "react";
import type { JpBlueDeduction } from "../../lib/comprehensive-income-tax-countries";
import {
  chinaFreelance,
  chinaLabourWithholding,
  type FreelancerCountry,
  type FrMicroActivity,
  franceMicro,
  JP_NATIONAL_PENSION_MONTHLY_2026,
  japanFreelance,
  jpFeeWithholding,
  spainAutonomo,
} from "../../lib/freelancer-tax-countries";
import ChoiceChips from "./payroll/ChoiceChips";
import NumberField from "./payroll/NumberField";

// One calculator per country's own rules for the self-employed. The Korean 3.3% freelancer calculator lives
// in FreelancerTaxCalculator (ko/en).
interface Props {
  country: FreelancerCountry;
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

type BlueChoice = "650000" | "550000" | "100000" | "0";
type EnterpriseRate = "0.05" | "0.04" | "0.03" | "0";

function Japan() {
  const [revenue, setRevenue] = useState(6_000_000);
  const [expenses, setExpenses] = useState(1_500_000);
  const [blue, setBlue] = useState<BlueChoice>("650000");
  const [health, setHealth] = useState(450_000);
  const [pension, setPension] = useState(JP_NATIONAL_PENSION_MONTHLY_2026 * 12);
  const [otherDed, setOtherDed] = useState(0);
  const [spouse, setSpouse] = useState<YesNo>("no");
  const [dependents, setDependents] = useState(0);
  const [rate, setRate] = useState<EnterpriseRate>("0.05");
  const [withheld, setWithheld] = useState(0);
  const r = japanFreelance({
    revenue,
    expenses,
    blueDeduction: Number(blue) as JpBlueDeduction,
    healthInsurance: health,
    pension,
    otherDeductions: otherDed,
    spouse: spouse === "yes",
    dependents,
    enterpriseRate: Number(rate),
    withheld,
  });
  const yen = (n: number) => fmt("ja-JP", "JPY", n);
  return (
    <>
      <p className="text-sm text-muted-foreground">個人事業主・フリーランスの1年分（令和8年分）の所得税・住民税・個人事業税と、国民健康保険・国民年金を合わせた負担を見積もります。</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <NumberField label="売上（収入金額）" value={revenue} onChange={setRevenue} suffix="円" step={100_000} />
        <NumberField label="必要経費" value={expenses} onChange={setExpenses} suffix="円" step={10_000} />
        <NumberField label="国民健康保険料（年額、市区町村の試算額）" value={health} onChange={setHealth} suffix="円" step={10_000} />
        <NumberField label={`国民年金保険料（年額、令和8年度 月${JP_NATIONAL_PENSION_MONTHLY_2026.toLocaleString("ja-JP")}円）`} value={pension} onChange={setPension} suffix="円" step={1_000} />
        <NumberField label="その他の所得控除（小規模企業共済・iDeCo・生命保険料など）" value={otherDed} onChange={setOtherDed} suffix="円" step={10_000} />
        <NumberField label="報酬から源泉徴収された所得税" value={withheld} onChange={setWithheld} suffix="円" step={1_000} />
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
        <ChoiceChips
          legend="個人事業税の税率（業種）"
          value={rate}
          onChange={setRate}
          options={[
            { value: "0.05", label: "5%（デザイン・コンサル・ITなど多くの業種）" },
            { value: "0.04", label: "4%（畜産・水産業など）" },
            { value: "0.03", label: "3%（あん摩・はり等）" },
            { value: "0", label: "非課税（文筆業など法定外）" },
          ]}
        />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ChoiceChips legend="配偶者控除（38万円）" value={spouse} onChange={setSpouse} options={yesNo("あり", "なし")} />
        <NumberField label="扶養親族（16歳以上）" value={dependents} onChange={setDependents} suffix="人" step={1} />
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="事業所得" value={yen(r.businessIncome)} note={`売上 − 経費 − 青色申告特別控除 ${yen(r.blue)}`} />
        <Result label="所得税＋復興特別所得税" value={yen(r.incomeTax)} note={`課税所得 ${yen(r.taxable)}`} />
        <Result label="住民税（翌年度）" value={yen(r.residentTax)} note={`所得割 10% ＋ 均等割 ${yen(r.perCapita)}`} />
      </div>
      <div aria-live="polite" className="mt-3 grid gap-3 sm:grid-cols-3">
        <Result label="個人事業税" value={yen(r.enterpriseTax)} note="（青色控除前の所得 − 290万円）× 税率" />
        <Result label="税金と社会保険の合計" value={yen(r.burden)} note={`国保・年金 ${yen(r.social)} を含む`} />
        <Result label="手取り（年）" value={yen(r.takeHome)} note="売上 − 経費 − 税金 − 社会保険" />
      </div>
      <div aria-live="polite" className="mt-3 grid gap-3 sm:grid-cols-2">
        <Result label={r.balance >= 0 ? "確定申告で納める所得税" : "確定申告で還付される所得税"} value={yen(Math.abs(r.balance))} note="所得税 − 源泉徴収税額" />
        <Result label="参考: 報酬100万円あたりの源泉徴収" value={yen(jpFeeWithholding(1_000_000))} note="10.21%（100万円を超える部分は20.42%）" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">国民健康保険料は市区町村・世帯・年齢で大きく変わるので、お住まいの市区町村の試算額を入れてください。個人事業税は事業主控除290万円を引いた額にかかり、業種によって税率が違います。消費税（インボイス登録時）は含めていません。</p>
    </>
  );
}

function China() {
  const [revenue, setRevenue] = useState(500_000);
  const [costs, setCosts] = useState(200_000);
  const [hasWage, setHasWage] = useState<YesNo>("no");
  const [social, setSocial] = useState(20_000);
  const [special, setSpecial] = useState(0);
  const [other, setOther] = useState(0);
  const [half, setHalf] = useState<YesNo>("yes");
  const [prepaid, setPrepaid] = useState(0);
  const [payment, setPayment] = useState(10_000);
  const r = chinaFreelance({ revenue, costs, hasComprehensive: hasWage === "yes", socialInsurance: social, specialAdditional: special, other, selfEmployedHalf: half === "yes", prepaid });
  const w = chinaLabourWithholding(payment);
  const cny = (n: number) => fmt("zh-CN", "CNY", n, 2);
  return (
    <>
      <p className="text-sm text-muted-foreground">个体工商户、个人独资企业和独立从事经营活动的个人，按经营所得5%–35%计税；为单位提供劳务取得的报酬属于劳务报酬，并入综合所得。</p>
      <h3 className="mt-4 font-semibold text-foreground">经营所得（年度汇算）</h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <NumberField label="全年经营收入" value={revenue} onChange={setRevenue} suffix="元" step={1_000} />
        <NumberField label="成本、费用及损失" value={costs} onChange={setCosts} suffix="元" step={1_000} />
        <ChoiceChips legend="同时有工资等综合所得" value={hasWage} onChange={setHasWage} options={yesNo("有（扣除在综合所得中减）", "没有")} />
        <ChoiceChips legend="个体工商户（200万元以下部分减半征收）" value={half} onChange={setHalf} options={yesNo("是", "否")} />
        {hasWage === "no" && (
          <>
            <NumberField label="专项扣除（个人缴纳的社保、公积金）" value={social} onChange={setSocial} suffix="元" step={1_000} />
            <NumberField label="专项附加扣除全年合计" value={special} onChange={setSpecial} suffix="元" step={1_000} />
            <NumberField label="其他扣除（个人养老金等）" value={other} onChange={setOther} suffix="元" step={100} />
          </>
        )}
        <NumberField label="已预缴税额" value={prepaid} onChange={setPrepaid} suffix="元" step={100} />
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="应纳税所得额" value={cny(r.taxable)} note={r.allowances ? `收入 − 成本费用 − 60,000元及各项扣除 ${cny(r.allowances)}` : "收入 − 成本费用"} />
        <Result label="应纳税额" value={cny(r.tax)} note="经营所得税率表 5%–35%" />
        <Result label="减免后应纳税额" value={cny(r.due)} note={r.relief ? `个体工商户减半 −${cny(r.relief)}` : "无减半"} />
      </div>
      <div aria-live="polite" className="mt-3 grid gap-3 sm:grid-cols-2">
        <Result label={r.balance > 0 ? "汇算应补税额" : "汇算应退税额"} value={cny(Math.abs(r.balance))} note="次年3月31日前办理经营所得年度汇算" />
      </div>
      <h3 className="mt-6 font-semibold text-foreground">劳务报酬（每次预扣预缴）</h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <NumberField label="单次劳务报酬收入" value={payment} onChange={setPayment} suffix="元" step={500} />
      </div>
      <div aria-live="polite" className="mt-3 grid gap-3 sm:grid-cols-2">
        <Result label="预扣税额" value={cny(w.withheld)} note={`应纳税所得额 ${cny(w.base)} × 预扣率 ${Math.round(w.rate * 100)}%`} />
        <Result label="实际到手" value={cny(payment - w.withheld)} note="年度汇算时按收入的80%并入综合所得" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">个体工商户减半征收政策执行至2027年12月31日。实行核定征收的，按税务机关核定的应税所得率或定额计税，与本表不同。增值税及附加、社保费另计。</p>
    </>
  );
}

function France() {
  const [ca, setCa] = useState(50_000);
  const [activity, setActivity] = useState<FrMicroActivity>("bnc");
  const [acre, setAcre] = useState<"0" | "0.5" | "0.25">("0");
  const [vfl, setVfl] = useState<YesNo>("no");
  const [other, setOther] = useState(0);
  const [couple, setCouple] = useState<YesNo>("no");
  const [children, setChildren] = useState(0);
  const r = franceMicro({ turnover: ca, activity, acre: Number(acre), versementLiberatoire: vfl === "yes", otherHouseholdNet: other, couple: couple === "yes", children });
  const eur = (n: number) => fmt("fr-FR", "EUR", n);
  const p = (n: number) => `${(n * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
  return (
    <>
      <p className="text-sm text-muted-foreground">Régime micro-entrepreneur : cotisations sociales en pourcentage du chiffre d'affaires encaissé, et impôt sur le revenu au barème après abattement forfaitaire ou par versement libératoire.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <NumberField label="Chiffre d'affaires annuel encaissé" value={ca} onChange={setCa} suffix="€" step={500} />
        <NumberField label="Autres revenus nets imposables du foyer" value={other} onChange={setOther} suffix="€" step={500} />
      </div>
      <div className="mt-4 grid gap-4">
        <ChoiceChips
          legend="Activité"
          value={activity}
          onChange={setActivity}
          options={[
            { value: "bnc", label: "Libéral non réglementé (BNC, 25,6 %)" },
            { value: "cipav", label: "Libéral Cipav (23,2 %)" },
            { value: "bic-services", label: "Prestations BIC (21,2 %)" },
            { value: "vente", label: "Vente (12,3 %)" },
          ]}
        />
        <ChoiceChips
          legend="ACRE (première année)"
          value={acre}
          onChange={setAcre}
          options={[
            { value: "0", label: "Non" },
            { value: "0.5", label: "−50 % (création avant le 1er juillet 2026)" },
            { value: "0.25", label: "−25 % (création depuis le 1er juillet 2026)" },
          ]}
        />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <ChoiceChips legend="Versement libératoire" value={vfl} onChange={setVfl} options={yesNo("Oui", "Non")} />
        <ChoiceChips legend="Situation" value={couple} onChange={setCouple} options={yesNo("Marié ou pacsé", "Célibataire")} />
        <NumberField label="Enfants à charge" value={children} onChange={setChildren} suffix="enf." step={1} />
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="Cotisations sociales" value={eur(r.social)} note={`${p(r.rates.social)} du CA${acre !== "0" ? ", réduit par l'ACRE" : ""}`} />
        <Result label="Formation professionnelle (CFP)" value={eur(r.cfp)} note={`${p(r.rates.cfp)} du CA`} />
        <Result
          label="Impôt sur le revenu"
          value={eur(r.incomeTax)}
          note={vfl === "yes" ? `Versement libératoire ${p(r.rates.vfl)} du CA` : `Hausse de l'impôt du foyer, revenu imposable ${eur(r.taxableMicro)} (abattement ${p(r.rates.abattement)})`}
        />
      </div>
      <div aria-live="polite" className="mt-3 grid gap-3 sm:grid-cols-2">
        <Result label="Revenu après cotisations et impôt" value={eur(r.net)} note="Avant frais professionnels réels (non déductibles en micro)" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Taux 2026 : BNC 25,6 % depuis le 1er janvier 2026, BIC services 21,2 %, vente 12,3 %. Le versement libératoire suppose un revenu fiscal de référence 2024 inférieur à 29 315 € par part. Plafonds de chiffre d'affaires : 83 600 € (services) et 203 100 € (vente). CFP des prestations BIC à 0,3 % (artisans) ; 0,1 % pour les commerçants. Barème 2026 appliqué aux revenus de l'année ; la CFE et la TVA ne sont pas incluses.</p>
    </>
  );
}

function Spain() {
  const [income, setIncome] = useState(40_000);
  const [expenses, setExpenses] = useState(10_000);
  const [plana, setPlana] = useState<YesNo>("no");
  const [ret, setRet] = useState<"0.15" | "0.07" | "0">("0.15");
  const [children, setChildren] = useState(0);
  const [over65, setOver65] = useState<YesNo>("no");
  const r = spainAutonomo({ income, expenses, tarifaPlana: plana === "yes", withholdingRate: Number(ret), children, over65: over65 === "yes" });
  const eur = (n: number) => fmt("es-ES", "EUR", n, 2);
  return (
    <>
      <p className="text-sm text-muted-foreground">Autónomo persona física en estimación directa simplificada: cuota de la Seguridad Social por tramos de rendimientos e IRPF de la actividad.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <NumberField label="Ingresos anuales (sin IVA)" value={income} onChange={setIncome} suffix="€" step={500} />
        <NumberField label="Gastos deducibles (sin la cuota de autónomo)" value={expenses} onChange={setExpenses} suffix="€" step={500} />
        <ChoiceChips legend="Tarifa plana (80 €/mes, primeros 12 meses)" value={plana} onChange={setPlana} options={yesNo("Sí", "No")} />
        <ChoiceChips
          legend="Retención en tus facturas"
          value={ret}
          onChange={setRet}
          options={[
            { value: "0.15", label: "15 %" },
            { value: "0.07", label: "7 % (nuevos autónomos)" },
            { value: "0", label: "Sin retención (modelo 130)" },
          ]}
        />
        <NumberField label="Hijos que dan derecho al mínimo por descendientes" value={children} onChange={setChildren} suffix="hijos" step={1} />
        <ChoiceChips legend="65 años o más" value={over65} onChange={setOver65} options={yesNo("Sí", "No")} />
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="Cuota de autónomo (mes)" value={eur(r.quota.monthly)} note={plana === "yes" ? "Tarifa plana" : `Tramo ${r.quota.tramo}: rendimiento ${eur(r.quota.monthlyNet)}/mes, base ${eur(r.quota.base)} × 31,5 %`} />
        <Result label="Rendimiento neto (IRPF)" value={eur(r.base)} note={`Tras la cuota anual y gastos de difícil justificación ${eur(r.hardToJustify)}`} />
        <Result label="Cuota de IRPF" value={eur(r.cuota)} note={`Mínimo personal y familiar ${eur(r.minimo)} al 0 %`} />
      </div>
      <div aria-live="polite" className="mt-3 grid gap-3 sm:grid-cols-2">
        <Result label={r.result > 0 ? "Renta: a ingresar" : "Renta: a devolver"} value={eur(Math.abs(r.result))} note={`Cuota − retenciones (${eur(r.withheld)})`} />
        <Result label="Neto anual" value={eur(r.net)} note="Ingresos − gastos − cuota de autónomo − IRPF" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">La cuota usa los tramos de 2026 (bases mínimas iguales a 2025, tipo 31,5 % con el MEI). El tramo se calcula con los rendimientos netos menos un 7 % de gastos genéricos y se regulariza al año siguiente con los datos de Hacienda. En IRPF se restan los gastos de difícil justificación (5 %, máx. 2.000 €). Sin retención se pagan trimestralmente pagos fraccionados del 20 % (modelo 130), no incluidos aquí. Escala autonómica supletoria; no incluye IVA ni la reducción por rendimientos bajos de actividades.</p>
    </>
  );
}

export default function FreelancerTaxCountryCalculator({ country }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      {country === "jp" && <Japan />}
      {country === "cn" && <China />}
      {country === "fr" && <France />}
      {country === "es" && <Spain />}
    </div>
  );
}
