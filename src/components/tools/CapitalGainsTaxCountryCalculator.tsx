import { useState } from "react";
import {
  type CapitalGainsCountry,
  type ChinaCgMethod,
  chinaCapitalGainsTax,
  ES_SAVINGS_BANDS,
  franceCapitalGainsTax,
  japanCapitalGainsTax,
  spainCapitalGainsTax,
} from "../../lib/capital-gains-tax-countries";
import ChoiceChips from "./payroll/ChoiceChips";
import NumberField from "./payroll/NumberField";

// One calculator per country's own law. The Korean rule lives in CapitalGainsTaxCalculator (ko/en).
interface Props {
  country: CapitalGainsCountry;
}

type YesNo = "yes" | "no";

const fmt = (locale: string, currency: string, n: number, digits = 0) =>
  new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: digits }).format(n);

const pct = (n: number) => `${Math.round(n * 100_000) / 1000}%`;

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
  const [salePrice, setSalePrice] = useState(50_000_000);
  const [cost, setCost] = useState(30_000_000);
  const [estimated, setEstimated] = useState<YesNo>("no");
  const [sellingCosts, setSellingCosts] = useState(1_700_000);
  const [acquisitionYear, setAcquisitionYear] = useState(2015);
  const [saleYear, setSaleYear] = useState(2026);
  const [residence, setResidence] = useState<YesNo>("yes");
  const [reduced, setReduced] = useState<YesNo>("yes");
  const r = japanCapitalGainsTax({
    salePrice,
    acquisitionCost: cost,
    estimatedCost: estimated === "yes",
    sellingCosts,
    acquisitionYear,
    saleYear,
    residence: residence === "yes",
    reducedRate: reduced === "yes",
  });
  const yen = (n: number) => fmt("ja-JP", "JPY", n);
  const regimeLabel = r.regime === "short" ? "短期譲渡所得 39.63%" : r.regime === "reduced" ? "10年超居住用の軽減税率 14.21%（6,000万円超は20.315%）" : "長期譲渡所得 20.315%";
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="譲渡価額（売却価格）" value={salePrice} onChange={setSalePrice} suffix="円" step={1_000_000} />
        <NumberField label="譲渡費用（仲介手数料・印紙税など）" value={sellingCosts} onChange={setSellingCosts} suffix="円" step={100_000} />
        <NumberField label="取得費（購入代金＋購入費用、建物は減価償却後）" value={cost} onChange={setCost} suffix="円" step={1_000_000} />
        <ChoiceChips legend="取得費が分からない" value={estimated} onChange={setEstimated} options={yesNo("概算取得費（5%）を使う", "実額を使う")} />
        <NumberField label="取得した年" value={acquisitionYear} onChange={setAcquisitionYear} suffix="年" step={1} />
        <NumberField label="売却した年" value={saleYear} onChange={setSaleYear} suffix="年" step={1} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ChoiceChips legend="自分が住んでいた家（居住用財産）" value={residence} onChange={setResidence} options={yesNo("はい（3,000万円控除）", "いいえ")} />
        {residence === "yes" && <ChoiceChips legend="10年超所有の軽減税率の特例" value={reduced} onChange={setReduced} options={yesNo("使う", "使わない")} />}
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="譲渡所得" value={yen(r.gain)} note={`譲渡価額 − 取得費 ${yen(r.cost)} − 譲渡費用`} />
        <Result label="課税譲渡所得" value={yen(r.taxable)} note={r.special ? `特別控除 ${yen(r.special)}` : "特別控除なし"} />
        <Result label="税金の合計" value={yen(r.total)} note={regimeLabel} />
      </div>
      <div aria-live="polite" className="mt-3 grid gap-3 sm:grid-cols-2">
        <Result label="所得税＋復興特別所得税" value={yen(r.incomeTax)} />
        <Result label="住民税" value={yen(r.residentTax)} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        所有期間は売った年の1月1日で数えるため、{saleYear}年に売る場合は{saleYear - 6}年以前の取得が長期、{saleYear - 11}年以前の取得が10年超です。
        {reduced === "yes" && residence === "yes" && !r.over10 ? "所有期間が10年以下なので軽減税率は使えません。" : ""}
        3,000万円控除は前年・前々年に同じ特例を使っていないこと、親子・夫婦間の売買でないことなどが条件です。
      </p>
    </>
  );
}

function China() {
  const [salePrice, setSalePrice] = useState(3_000_000);
  const [original, setOriginal] = useState(2_000_000);
  const [expenses, setExpenses] = useState(100_000);
  const [method, setMethod] = useState<ChinaCgMethod>("actual");
  const [deemed, setDeemed] = useState(1);
  const [fiveOnly, setFiveOnly] = useState<YesNo>("no");
  const r = chinaCapitalGainsTax({ salePrice, originalValue: original, expenses, method, deemedRate: deemed / 100, fiveYearsOnly: fiveOnly === "yes" });
  const cny = (n: number) => fmt("zh-CN", "CNY", n, 2);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField label="转让收入（不含增值税）" value={salePrice} onChange={setSalePrice} suffix="元" step={10_000} />
        <NumberField label="房屋原值（购房价款＋契税等）" value={original} onChange={setOriginal} suffix="元" step={10_000} />
        <NumberField label="合理费用（装修费、贷款利息、手续费等）" value={expenses} onChange={setExpenses} suffix="元" step={1_000} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ChoiceChips
          legend="计税方式"
          value={method}
          onChange={setMethod}
          options={[
            { value: "actual", label: "据实征收（差额 × 20%）" },
            { value: "deemed", label: "核定征收（原值无法核实）" },
          ]}
        />
        <ChoiceChips legend="自用满5年且家庭唯一生活用房" value={fiveOnly} onChange={setFiveOnly} options={yesNo("是（免征个税）", "否")} />
        {method === "deemed" && <NumberField label="本地核定征收率（1%–3%）" value={deemed} onChange={setDeemed} suffix="%" step={0.5} />}
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="转让所得" value={cny(r.gain)} note="转让收入 − 房屋原值 − 合理费用" />
        <Result label="计税依据 × 税率" value={r.exempt ? "免征" : `${cny(r.base)} × ${pct(r.rate)}`} />
        <Result label="个人所得税" value={cny(r.tax)} note={r.exempt ? "财税字〔1999〕278号" : method === "deemed" ? "国税发〔2006〕108号" : "财产转让所得 20%"} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">核定征收率由各省确定，常见为1%（普通住房）至1.5%–2%（非普通住房），请按当地规定填写。增值税（个人出售住房满2年免征）、附加税、土地增值税（个人转让住房暂免）和印花税不包括在内。</p>
    </>
  );
}

function France() {
  const [sale, setSale] = useState(350_000);
  const [purchase, setPurchase] = useState(220_000);
  const [forfaitFees, setForfaitFees] = useState<YesNo>("yes");
  const [fees, setFees] = useState(16_000);
  const [forfaitWorks, setForfaitWorks] = useState<YesNo>("yes");
  const [works, setWorks] = useState(0);
  const [years, setYears] = useState(12);
  const [rp, setRp] = useState<YesNo>("no");
  const r = franceCapitalGainsTax({
    salePrice: sale,
    purchasePrice: purchase,
    acquisitionFees: fees,
    forfaitAcquisition: forfaitFees === "yes",
    works,
    forfaitTravaux: forfaitWorks === "yes",
    years,
    residencePrincipale: rp === "yes",
  });
  const eur = (n: number) => fmt("fr-FR", "EUR", n, 2);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Prix de cession (net des frais de vente)" value={sale} onChange={setSale} suffix="€" step={5_000} />
        <NumberField label="Prix d'acquisition" value={purchase} onChange={setPurchase} suffix="€" step={5_000} />
        <NumberField label="Années de détention (complètes)" value={years} onChange={setYears} suffix="ans" step={1} />
        <ChoiceChips legend="Résidence principale au jour de la vente" value={rp} onChange={setRp} options={yesNo("Oui (exonérée)", "Non")} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ChoiceChips legend="Frais d'acquisition" value={forfaitFees} onChange={setForfaitFees} options={yesNo("Forfait 7,5 %", "Montant réel")} />
        {forfaitFees === "no" && <NumberField label="Frais d'acquisition réels" value={fees} onChange={setFees} suffix="€" step={500} />}
        <ChoiceChips legend="Travaux" value={forfaitWorks} onChange={setForfaitWorks} options={yesNo("Forfait 15 % (plus de 5 ans)", "Montant réel")} />
        {(forfaitWorks === "no" || years <= 5) && <NumberField label="Travaux réels (justifiés)" value={works} onChange={setWorks} suffix="€" step={1_000} />}
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="Plus-value brute" value={eur(r.gross)} note={`Prix de cession − prix d'acquisition majoré ${eur(r.adjustedCost)}`} />
        <Result label="Impôt sur le revenu (19 %)" value={eur(r.ir)} note={r.exempt ? "Exonérée" : `Abattement ${pct(r.abIR)} → base ${eur(r.netIR)}`} />
        <Result label="Prélèvements sociaux (17,2 %)" value={eur(r.ps)} note={r.exempt ? "Exonérée" : `Abattement ${pct(r.abPS)} → base ${eur(r.netPS)}`} />
      </div>
      <div aria-live="polite" className="mt-3 grid gap-3 sm:grid-cols-2">
        <Result label="Surtaxe (plus-value > 50 000 €)" value={eur(r.surtaxe)} note="2 % à 6 % de la plus-value imposable à l'IR, avec lissage" />
        <Result label="Total à payer" value={eur(r.total)} note="Prélevé par le notaire lors de la vente" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Exonération d'impôt sur le revenu après 22 ans, de prélèvements sociaux après 30 ans. Les autres exonérations (prix de cession ≤ 15 000 €, première cession d'un logement autre que la résidence principale avec remploi, retraités modestes) ne sont pas calculées.</p>
    </>
  );
}

function Spain() {
  const [sale, setSale] = useState(320_000);
  const [saleCosts, setSaleCosts] = useState(12_000);
  const [purchase, setPurchase] = useState(200_000);
  const [purchaseCosts, setPurchaseCosts] = useState(18_000);
  const [habitual, setHabitual] = useState<YesNo>("no");
  const [reinvested, setReinvested] = useState(0);
  const [over65, setOver65] = useState<YesNo>("no");
  const r = spainCapitalGainsTax({ salePrice: sale, saleCosts, purchasePrice: purchase, purchaseCosts, reinvested, viviendaHabitual: habitual === "yes", over65: over65 === "yes" });
  const eur = (n: number) => fmt("es-ES", "EUR", n, 2);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Precio de venta" value={sale} onChange={setSale} suffix="€" step={5_000} />
        <NumberField label="Gastos de venta (agencia, plusvalía municipal pagada)" value={saleCosts} onChange={setSaleCosts} suffix="€" step={500} />
        <NumberField label="Precio de compra (más mejoras)" value={purchase} onChange={setPurchase} suffix="€" step={5_000} />
        <NumberField label="Gastos y tributos de compra (ITP/IVA, notaría, registro)" value={purchaseCosts} onChange={setPurchaseCosts} suffix="€" step={500} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ChoiceChips legend="Vivienda habitual" value={habitual} onChange={setHabitual} options={yesNo("Sí", "No")} />
        {habitual === "yes" && <ChoiceChips legend="Mayor de 65 años" value={over65} onChange={setOver65} options={yesNo("Sí (exenta)", "No")} />}
        {habitual === "yes" && over65 === "no" && <NumberField label="Importe reinvertido en nueva vivienda habitual (2 años)" value={reinvested} onChange={setReinvested} suffix="€" step={5_000} />}
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="Ganancia patrimonial" value={eur(r.gain)} note={`Valor de transmisión ${eur(r.transmission)} − valor de adquisición`} />
        <Result label="Ganancia exenta" value={eur(r.exempt)} note={habitual === "yes" ? (over65 === "yes" ? "Mayor de 65 que vende su vivienda habitual" : "Proporción reinvertida sobre el valor de transmisión") : "Sin exención"} />
        <Result label="IRPF (base del ahorro)" value={eur(r.tax)} note={`Tipo medio ${pct(Math.round(r.effective * 10_000) / 10_000)} sobre ${eur(r.taxable)}`} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Escala del ahorro 2026: {ES_SAVINGS_BANDS.map(([top, rate]) => (top === Infinity ? `${pct(rate)} desde 300.000 €` : `${pct(rate)} hasta ${top.toLocaleString("es-ES")} €`)).join(", ")}. La plusvalía municipal (IIVTNU) es un impuesto local aparte que paga el vendedor al ayuntamiento; no está incluida en este cálculo. Los no residentes tributan al 19 % y el comprador retiene el 3 %.
      </p>
    </>
  );
}

export default function CapitalGainsTaxCountryCalculator({ country }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      {country === "jp" && <Japan />}
      {country === "cn" && <China />}
      {country === "fr" && <France />}
      {country === "es" && <Spain />}
    </div>
  );
}
