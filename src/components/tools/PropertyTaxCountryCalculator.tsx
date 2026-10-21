import { useState } from "react";
import {
  ES_DEFAULT_IBI_RATE,
  FR_DEFAULT_TFPB_RATE,
  franceTaxeFonciere,
  japanPropertyTax,
  type PropertyCountry,
  shanghaiPilotTax,
  spainIbi,
} from "../../lib/property-tax-countries";
import ChoiceChips from "./payroll/ChoiceChips";
import NumberField from "./payroll/NumberField";

// One calculator per country's own law. The Korean rule lives in PropertyTaxCalculator (ko/en).
interface Props {
  country: PropertyCountry;
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
  const [landValue, setLandValue] = useState(30_000_000);
  const [landArea, setLandArea] = useState(150);
  const [residential, setResidential] = useState<"yes" | "no">("yes");
  const [dwellings, setDwellings] = useState(1);
  const [buildingValue, setBuildingValue] = useState(10_000_000);
  const [floorArea, setFloorArea] = useState(100);
  const [newRelief, setNewRelief] = useState<"yes" | "no">("no");
  const [fixedRate, setFixedRate] = useState(1.4);
  const [cityRate, setCityRate] = useState(0.3);
  const r = japanPropertyTax({ landValue, landArea, residential: residential === "yes", dwellings, buildingValue, floorArea, newHouseRelief: newRelief === "yes", fixedRate: fixedRate / 100, cityPlanRate: cityRate / 100 });
  const yen = (n: number) => fmt("ja-JP", "JPY", n);
  return (
    <>
      <p className="text-sm text-muted-foreground">評価額は納税通知書の課税明細書に載っています。都市計画税は市街化区域だけにかかり、税率（上限0.3%）は市町村が決めます。</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <NumberField label="土地の評価額" value={landValue} onChange={setLandValue} suffix="円" step={100_000} />
        <NumberField label="土地の面積" value={landArea} onChange={setLandArea} suffix="㎡" step={1} />
        <NumberField label="家屋の評価額" value={buildingValue} onChange={setBuildingValue} suffix="円" step={100_000} />
        <NumberField label="家屋の床面積（居住部分）" value={floorArea} onChange={setFloorArea} suffix="㎡" step={1} />
        <NumberField label="住宅の戸数" value={dwellings} onChange={setDwellings} suffix="戸" step={1} />
        <NumberField label="固定資産税の税率（標準1.4%）" value={fixedRate} onChange={setFixedRate} suffix="%" step={0.1} />
        <NumberField label="都市計画税の税率（市街化区域外は0）" value={cityRate} onChange={setCityRate} suffix="%" step={0.05} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ChoiceChips
          legend="土地の用途"
          value={residential}
          onChange={setResidential}
          options={[
            { value: "yes", label: "住宅用地" },
            { value: "no", label: "住宅用地以外" },
          ]}
        />
        <ChoiceChips
          legend="新築住宅の減額（3年度分、長期優良住宅は5年度分）"
          value={newRelief}
          onChange={setNewRelief}
          options={[
            { value: "no", label: "対象外" },
            { value: "yes", label: "適用期間中" },
          ]}
        />
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="固定資産税" value={yen(r.fixedAssetTax)} note={`土地の課税標準 ${yen(r.landFixedBase)}（200㎡/戸まで1/6、超える部分1/3）${r.relief ? `、新築減額 −${yen(r.relief)}` : ""}`} />
        <Result label="都市計画税" value={yen(r.cityPlanningTax)} note={`土地の課税標準 ${yen(r.landCityBase)}（1/3・2/3）`} />
        <Result label="年税額の合計" value={yen(r.total)} note="負担調整措置で実際の課税標準が低い場合があります" />
      </div>
    </>
  );
}

function China() {
  const [price, setPrice] = useState(6_000_000);
  const [area, setArea] = useState(100);
  const [existing, setExisting] = useState(120);
  const [members, setMembers] = useState(3);
  const [resident, setResident] = useState<"yes" | "no">("yes");
  const [low, setLow] = useState<"yes" | "no">("no");
  const r = shanghaiPilotTax({ price, area, existingArea: existing, members, lowPrice: low === "yes", resident: resident === "yes" });
  const yuan = (n: number) => fmt("zh-CN", "CNY", n, 2);
  return (
    <>
      <div className="rounded-md border border-border bg-background px-4 py-3">
        <p className="text-base font-bold text-foreground">中国目前没有普遍征收的个人住房持有税</p>
        <p className="mt-1 text-sm text-muted-foreground">《房产税暂行条例》第5条对个人所有的非营业用房产免征房产税。只有2011年起的上海、重庆两地试点对部分个人住房征税。下面按上海试点（沪府发〔2011〕3号）计算；重庆试点主要针对独栋别墅和高档住房，规则不同。</p>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <NumberField label="新购住房成交价" value={price} onChange={setPrice} suffix="元" step={100_000} />
        <NumberField label="新购住房面积" value={area} onChange={setArea} suffix="㎡" step={1} />
        <NumberField label="家庭已有住房面积" value={existing} onChange={setExisting} suffix="㎡" step={1} />
        <NumberField label="家庭人数" value={members} onChange={setMembers} suffix="人" step={1} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ChoiceChips
          legend="家庭户籍"
          value={resident}
          onChange={setResident}
          options={[
            { value: "yes", label: "本市居民家庭（第二套及以上）" },
            { value: "no", label: "非本市居民家庭" },
          ]}
        />
        <ChoiceChips
          legend="每平方米单价"
          value={low}
          onChange={setLow}
          options={[
            { value: "no", label: "高于上年新建商品住房均价2倍" },
            { value: "yes", label: "不超过2倍" },
          ]}
        />
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="应税面积" value={`${r.taxableArea}㎡`} note={resident === "yes" ? "家庭全部住房面积超过人均60㎡的部分" : "非本市居民家庭不扣除人均60㎡（符合条件者除外）"} />
        <Result label="计税依据" value={yuan(r.base)} note="单价 × 应税面积 × 70%" />
        <Result label="每年房产税" value={yuan(r.tax)} note={`税率 ${low === "yes" ? "0.4%" : "0.6%"}`} />
      </div>
    </>
  );
}

function France() {
  const [vlc, setVlc] = useState(4_000);
  const [rate, setRate] = useState(FR_DEFAULT_TFPB_RATE);
  const r = franceTaxeFonciere(vlc, rate);
  const eur = (n: number) => fmt("fr-FR", "EUR", n);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Valeur locative cadastrale (brute)" value={vlc} onChange={setVlc} suffix="€" step={100} />
        <NumberField label="Taux commune + intercommunalité (avis)" value={rate} onChange={setRate} suffix="%" step={0.5} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Par défaut {FR_DEFAULT_TFPB_RATE} % : taux moyen communal 2025 (DGCL). Ajoutez le taux intercommunal et les taxes spéciales indiqués sur votre avis.</p>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-2">
        <Result label="Base d'imposition" value={eur(r.base)} note="Valeur locative cadastrale × 50 % (revenu cadastral)" />
        <Result label="Taxe foncière (bâti)" value={eur(r.tax)} note="Base × taux voté ; hors taxe d'enlèvement des ordures ménagères" />
      </div>
    </>
  );
}

function Spain() {
  const [vc, setVc] = useState(150_000);
  const [rate, setRate] = useState(ES_DEFAULT_IBI_RATE);
  const r = spainIbi(vc, rate);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Base liquidable (valor catastral)" value={vc} onChange={setVc} suffix="€" step={1_000} />
        <NumberField label="Tipo de gravamen municipal" value={rate} onChange={setRate} suffix="%" step={0.01} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">El tipo lo fija cada ayuntamiento y aparece en el recibo del IBI. {ES_DEFAULT_IBI_RATE} % es solo un ejemplo.</p>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-2">
        <Result label="IBI anual" value={fmt("es-ES", "EUR", r.tax, 2)} note="Base liquidable × tipo (art. 71–72 TRLRHL)" />
        <Result label="Tipo introducido" value={`${rate} %`} note={r.inLegalRange ? "Dentro del rango general urbano 0,4 %–1,10 %" : "Fuera del rango general 0,4 %–1,10 %; compruébalo en el recibo"} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Algunos ayuntamientos aplican bonificaciones (familia numerosa, placas solares) o recargos a viviendas vacías.</p>
    </>
  );
}

export default function PropertyTaxCountryCalculator({ country }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      {country === "jp" && <Japan />}
      {country === "cn" && <China />}
      {country === "fr" && <France />}
      {country === "es" && <Spain />}
    </div>
  );
}
