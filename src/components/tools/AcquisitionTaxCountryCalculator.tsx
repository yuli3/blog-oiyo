import { useState } from "react";
import {
  type AcquisitionCountry,
  type ChinaHomeOrder,
  chinaDeedTax,
  ES_REGIONS,
  type FranceProperty,
  franceTransferDuties,
  japanAcquisitionTax,
  type JapanHouseKind,
  type SpainProperty,
  spainPurchaseTax,
  type SpainRegion,
} from "../../lib/acquisition-tax-countries";
import ChoiceChips from "./payroll/ChoiceChips";
import NumberField from "./payroll/NumberField";

// One calculator per country's own law. The Korean rule lives in AcquisitionTaxCalculator (ko/en).
interface Props {
  country: AcquisitionCountry;
}

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

function Japan() {
  const [landValue, setLandValue] = useState(20_000_000);
  const [landArea, setLandArea] = useState(120);
  const [takuchi, setTakuchi] = useState<"yes" | "no">("yes");
  const [buildingValue, setBuildingValue] = useState(15_000_000);
  const [floorArea, setFloorArea] = useState(95);
  const [kind, setKind] = useState<JapanHouseKind>("new");
  const [deduction, setDeduction] = useState(12_000_000);
  const [qualifies, setQualifies] = useState<"yes" | "no">("yes");
  const r = japanAcquisitionTax({ landValue, landArea, takuchi: takuchi === "yes", buildingValue, floorArea, kind, houseDeduction: deduction, qualifies: qualifies === "yes" });
  const yen = (n: number) => fmt("ja-JP", "JPY", n);
  return (
    <>
      <p className="text-sm text-muted-foreground">金額は売買価格ではなく、固定資産課税台帳の評価額（固定資産税の納税通知書・評価証明書に載っている額）を入れます。</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <NumberField label="土地の固定資産税評価額" value={landValue} onChange={setLandValue} suffix="円" step={100_000} />
        <NumberField label="土地の面積" value={landArea} onChange={setLandArea} suffix="㎡" step={1} />
        <NumberField label="家屋の評価額" value={buildingValue} onChange={setBuildingValue} suffix="円" step={100_000} />
        <NumberField label="家屋の床面積（登記面積）" value={floorArea} onChange={setFloorArea} suffix="㎡" step={1} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ChoiceChips
          legend="住宅"
          value={kind}
          onChange={(v) => {
            setKind(v);
            setDeduction(12_000_000);
          }}
          options={[
            { value: "new", label: "新築" },
            { value: "used", label: "中古" },
          ]}
        />
        <ChoiceChips
          legend="宅地（課税標準1/2）"
          value={takuchi}
          onChange={setTakuchi}
          options={[
            { value: "yes", label: "宅地" },
            { value: "no", label: "宅地以外" },
          ]}
        />
        <ChoiceChips
          legend="自己居住・床面積・耐震などの軽減要件"
          value={qualifies}
          onChange={setQualifies}
          options={[
            { value: "yes", label: "満たす" },
            { value: "no", label: "満たさない" },
          ]}
        />
        <NumberField label={kind === "new" ? "住宅の控除額（認定長期優良住宅は1,300万円）" : "住宅の控除額（1997年4月以降の新築なら1,200万円）"} value={deduction} onChange={setDeduction} suffix="円" step={100_000} />
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        <Result label="不動産取得税（土地）" value={yen(r.landTax)} note={`課税標準 ${yen(r.landBase)} × 3%${r.landRelief ? ` − 住宅用土地の減額 ${yen(r.landRelief)}` : ""}`} />
        <Result label="不動産取得税（家屋）" value={yen(r.buildingTax)} note={`（評価額 − 控除）${yen(r.buildingBase)} × 3%`} />
        <Result label="登録免許税" value={yen(r.registrationTax)} note={`土地 1.5% ${yen(r.registrationLand)}、家屋 ${pct(r.regBuildingRate)} ${yen(r.registrationBuilding)}`} />
      </div>
      <div aria-live="polite" className="mt-3 grid gap-3 sm:grid-cols-2">
        <Result label="税金の合計" value={yen(r.total)} note="司法書士報酬、印紙税、住宅ローンの抵当権設定（0.1%）は含みません" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">税率3%・宅地1/2は令和9年3月31日までの取得、土地の登録免許税1.5%は令和11年3月31日まで、住宅用家屋の軽減は令和9年3月31日までの特例です。新築の家屋の登録免許税は法務局の認定価格で計算されます。</p>
    </>
  );
}

function China() {
  const [price, setPrice] = useState(3_000_000);
  const [area, setArea] = useState(100);
  const [order, setOrder] = useState<ChinaHomeOrder>("first");
  const [localRate, setLocalRate] = useState(3);
  const r = chinaDeedTax(price, area, order, localRate / 100);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField label="成交价（不含增值税）" value={price} onChange={setPrice} suffix="元" step={10_000} />
        <NumberField label="住房面积" value={area} onChange={setArea} suffix="㎡" step={1} />
        <NumberField label="本省契税适用税率（3%–5%）" value={localRate} onChange={setLocalRate} suffix="%" step={0.5} />
      </div>
      <div className="mt-4">
        <ChoiceChips
          legend="家庭住房套数（购房人、配偶、未成年子女）"
          value={order}
          onChange={setOrder}
          options={[
            { value: "first", label: "家庭唯一住房" },
            { value: "second", label: "家庭第二套住房" },
            { value: "other", label: "第三套及以上" },
          ]}
        />
      </div>
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-2">
        <Result label="适用税率" value={pct(r.rate)} note={order === "other" ? "不享受优惠，按本省规定税率" : "财政部 税务总局 住房城乡建设部公告2024年第16号"} />
        <Result label="契税" value={fmt("zh-CN", "CNY", r.tax, 2)} note="成交价 × 税率" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">本省税率默认3%（多数省份），请按当地规定修改。印花税、登记费等不包括在内。</p>
    </>
  );
}

function France() {
  const [price, setPrice] = useState(300_000);
  const [kind, setKind] = useState<FranceProperty>("ancien");
  const [dept, setDept] = useState<"5" | "4.5" | "3.8">("5");
  const [primo, setPrimo] = useState<"yes" | "no">("no");
  const r = franceTransferDuties(price, kind, Number(dept) / 100, primo === "yes");
  const eur = (n: number) => fmt("fr-FR", "EUR", n, 2);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Prix de vente (hors mobilier)" value={price} onChange={setPrice} suffix="€" step={5_000} />
        <ChoiceChips
          legend="Type de bien"
          value={kind}
          onChange={setKind}
          options={[
            { value: "ancien", label: "Ancien" },
            { value: "neuf", label: "Neuf (VEFA, moins de 5 ans)" },
          ]}
        />
      </div>
      {kind === "ancien" && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ChoiceChips
            legend="Taux départemental"
            value={dept}
            onChange={setDept}
            options={[
              { value: "5", label: "5 % (84 départements)" },
              { value: "4.5", label: "4,5 %" },
              { value: "3.8", label: "3,8 % (Indre, Mayotte)" },
            ]}
          />
          <ChoiceChips
            legend="Primo-accédant (résidence principale)"
            value={primo}
            onChange={setPrimo}
            options={[
              { value: "no", label: "Non" },
              { value: "yes", label: "Oui" },
            ]}
          />
        </div>
      )}
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        {kind === "ancien" ? (
          <>
            <Result label="Taxe départementale" value={eur(r.departmental)} note={`${pct(r.departmentRate)} du prix${primo === "yes" && dept === "5" ? " (hausse de 0,5 point non appliquée)" : ""}`} />
            <Result label="Taxe communale + frais d'assiette" value={eur(r.communal + r.assiette)} note="1,2 % du prix + 2,37 % de la taxe départementale" />
          </>
        ) : (
          <Result label="Taxe de publicité foncière" value={eur(r.total)} note="0,715 % du prix ; la TVA est déjà dans le prix" />
        )}
        <Result label="Droits de mutation" value={eur(r.total)} note={`${pct(price > 0 ? r.total / price : 0)} du prix`} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Les « frais de notaire » ajoutent les émoluments du notaire, la contribution de sécurité immobilière et les débours, non comptés ici.</p>
    </>
  );
}

function Spain() {
  const [price, setPrice] = useState(250_000);
  const [region, setRegion] = useState<SpainRegion>("madrid");
  const [kind, setKind] = useState<SpainProperty>("usada");
  const [itp, setItp] = useState(8);
  const [ajd, setAjd] = useState(1.5);
  const r = spainPurchaseTax(price, region, kind, itp / 100, ajd / 100);
  const eur = (n: number) => fmt("es-ES", "EUR", n, 2);
  const known = region === "otra" ? null : ES_REGIONS[region];
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Precio de compra (o valor de referencia si es mayor)" value={price} onChange={setPrice} suffix="€" step={5_000} />
        <ChoiceChips
          legend="Vivienda"
          value={kind}
          onChange={setKind}
          options={[
            { value: "usada", label: "Usada (ITP)" },
            { value: "nueva", label: "Obra nueva (IVA + AJD)" },
          ]}
        />
      </div>
      <div className="mt-4">
        <ChoiceChips
          legend="Comunidad autónoma"
          value={region}
          onChange={setRegion}
          options={[
            { value: "madrid", label: "Madrid" },
            { value: "cataluna", label: "Cataluña" },
            { value: "andalucia", label: "Andalucía" },
            { value: "valenciana", label: "C. Valenciana" },
            { value: "otra", label: "Otra" },
          ]}
        />
      </div>
      {region === "otra" && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <NumberField label="Tipo ITP de tu comunidad" value={itp} onChange={setItp} suffix="%" step={0.25} />
          <NumberField label="Tipo AJD de tu comunidad" value={ajd} onChange={setAjd} suffix="%" step={0.05} />
        </div>
      )}
      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
        {kind === "usada" ? (
          <Result label="ITP" value={eur(r.itp)} note={known ? `${known.name}: ${known.itp.map(([top, rate]) => (top === Infinity ? pct(rate) : `${pct(rate)} hasta ${top.toLocaleString("es-ES")} €`)).join(", ")}` : `${itp} % introducido`} />
        ) : (
          <>
            <Result label="IVA" value={eur(r.iva)} note="10 % (vivienda nueva del promotor)" />
            <Result label="AJD" value={eur(r.ajd)} note={known ? `${known.name}: ${pct(known.ajd)}` : `${ajd} % introducido`} />
          </>
        )}
        <Result label="Total impuestos" value={eur(r.total)} note="Sin notaría, registro ni gestoría" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Tipos generales 2026. No se aplican los tipos reducidos (jóvenes, familia numerosa, VPO); consulta tu comunidad. País Vasco y Navarra tienen régimen foral: usa «Otra».</p>
    </>
  );
}

export default function AcquisitionTaxCountryCalculator({ country }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      {country === "jp" && <Japan />}
      {country === "cn" && <China />}
      {country === "fr" && <France />}
      {country === "es" && <Spain />}
    </div>
  );
}
