import { useState, useCallback, useMemo } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "../ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import type { Locale } from "../../lib/i18n";

// ── Brannock device, the measuring plate US shoe stores actually use ─────────
// Men's US    = 3 x (foot length in inches) - 24
// Women's US  = 3 x (foot length in inches) - 22.5
// Solving both for the same foot gives women = men + 1.5, which is where the
// "one and a half sizes" rule comes from. It is a derivation, not a standard:
// many US retailers publish +2 instead, and individual brands sit anywhere from
// +1 to +2. That disagreement is the honest answer, so the tool shows both.
const MEN_CONST = 24;
const WOMEN_CONST = 22.5;
const INCH_CM = 2.54;

type Offset = "1.5" | "2";
type From = "men" | "women" | "cm";

const lenFromMen = (s: number) => (s + MEN_CONST) / 3;
const lenFromWomen = (s: number) => (s + WOMEN_CONST) / 3;
const menFromLen = (inches: number) => inches * 3 - MEN_CONST;
const womenFromLen = (inches: number) => inches * 3 - WOMEN_CONST;

// UK runs one size below US men's. EU uses the Paris point: one point is 2/3 cm,
// so the size is foot length in cm times 1.5. Checked against known pairs -- US
// men's 8/9/10/11 land on 40.6/41.9/43.2/44.5 against a real 41/42/43/44.5.
const ukFromMen = (s: number) => s - 1;
const euFromLen = (inches: number) => inches * INCH_CM * 1.5;

const half = (n: number) => Math.round(n * 2) / 2;
const fmt = (n: number, d = 1) =>
  Number.isFinite(n) ? n.toFixed(d).replace(/\.0$/, "") : "—";

type Copy = {
  title: string;
  subtitle: string;
  reset: string;
  fromLabel: string;
  men: string;
  women: string;
  cm: string;
  sizeUnit: string;
  cmUnit: string;
  inputHint: string;
  convLabel: string;
  conv15: string;
  conv2: string;
  convHint: string;
  resultTitle: string;
  resultDesc: string;
  colMetric: string;
  colValue: string;
  rowMen: string;
  rowWomen: string;
  rowUk: string;
  rowEu: string;
  rowCm: string;
  rangeTitle: string;
  rangeDesc: string;
  rangeBrannock: string;
  rangeRetail: string;
  caveat: string;
};

const COPY: Record<Locale, Copy> = {
  en: {
    title: "Men's ↔ Women's Shoe Size Converter",
    subtitle: "Converts through foot length, so you can see where the number comes from",
    reset: "Reset",
    fromLabel: "Convert from",
    men: "US Men's",
    women: "US Women's",
    cm: "Foot length",
    sizeUnit: "US",
    cmUnit: "cm",
    inputHint: "Half sizes are fine — try 9.5",
    convLabel: "Which convention",
    conv15: "+1.5 (Brannock)",
    conv2: "+2 (retail)",
    convHint: "Brannock is the plate US shops measure on. Many retailers publish +2 instead.",
    resultTitle: "Your size across systems",
    resultDesc: "Foot length is the anchor; everything else is derived from it.",
    colMetric: "System",
    colValue: "Size",
    rowMen: "US Men's",
    rowWomen: "US Women's",
    rowUk: "UK",
    rowEu: "EU",
    rowCm: "Foot length",
    rangeTitle: "Why answers differ",
    rangeDesc: "There is no single standard for this conversion, so the useful answer is a range.",
    rangeBrannock: "Brannock device (US shoe shops)",
    rangeRetail: "Common retailer charts",
    caveat:
      "Women's lasts are cut narrower at the same length, so a converted size can fit shorter. If you are between the two numbers, size on foot length and check the brand's own chart.",
  },
  ko: {
    title: "남성 ↔ 여성 신발 사이즈 변환",
    subtitle: "발 길이를 거쳐 변환하므로 숫자가 어디서 나왔는지 보입니다",
    reset: "초기화",
    fromLabel: "무엇으로 입력하나요",
    men: "US 남성",
    women: "US 여성",
    cm: "발 길이",
    sizeUnit: "US",
    cmUnit: "cm",
    inputHint: "반 사이즈도 됩니다 — 9.5 처럼",
    convLabel: "어느 관례로",
    conv15: "+1.5 (브래녹)",
    conv2: "+2 (소매점)",
    convHint: "브래녹은 미국 신발가게가 발을 재는 기구입니다. 소매점은 +2로 적는 곳이 많습니다.",
    resultTitle: "규격별 내 사이즈",
    resultDesc: "발 길이가 기준이고 나머지는 거기서 나옵니다.",
    colMetric: "규격",
    colValue: "사이즈",
    rowMen: "US 남성",
    rowWomen: "US 여성",
    rowUk: "UK",
    rowEu: "EU",
    rowCm: "발 길이",
    rangeTitle: "답이 갈리는 이유",
    rangeDesc: "이 변환에는 표준이 없습니다. 그래서 쓸모 있는 답은 범위입니다.",
    rangeBrannock: "브래녹 기구 (미국 신발가게)",
    rangeRetail: "흔한 소매점 표",
    caveat:
      "같은 길이라도 여성화는 발볼이 좁게 나옵니다. 두 숫자 사이라면 발 길이를 기준으로 고르고 브랜드 자체 표를 확인하세요.",
  },
  ja: {
    title: "メンズ ↔ レディース 靴サイズ変換",
    subtitle: "足長を経由して変換するので、数字の出どころが分かります",
    reset: "リセット",
    fromLabel: "入力する基準",
    men: "US メンズ",
    women: "US レディース",
    cm: "足長",
    sizeUnit: "US",
    cmUnit: "cm",
    inputHint: "ハーフサイズも可 — 9.5 など",
    convLabel: "どの慣例で",
    conv15: "+1.5（ブラノック）",
    conv2: "+2（小売）",
    convHint: "ブラノックは米国の靴店が足を測る器具です。小売店では +2 と表記することが多くあります。",
    resultTitle: "規格別のサイズ",
    resultDesc: "足長が基準で、他はそこから導かれます。",
    colMetric: "規格",
    colValue: "サイズ",
    rowMen: "US メンズ",
    rowWomen: "US レディース",
    rowUk: "UK",
    rowEu: "EU",
    rowCm: "足長",
    rangeTitle: "答えが分かれる理由",
    rangeDesc: "この変換に単一の標準はありません。だから有用な答えは幅です。",
    rangeBrannock: "ブラノック器具（米国の靴店）",
    rangeRetail: "一般的な小売表",
    caveat:
      "同じ長さでもレディースは細身に作られます。二つの数字の間なら足長を基準に選び、ブランド自身の表を確認してください。",
  },
  zh: {
    title: "男码 ↔ 女码 鞋码换算",
    subtitle: "通过脚长换算，你能看到数字从哪里来",
    reset: "重置",
    fromLabel: "以什么输入",
    men: "US 男码",
    women: "US 女码",
    cm: "脚长",
    sizeUnit: "US",
    cmUnit: "厘米",
    inputHint: "支持半码 — 例如 9.5",
    convLabel: "按哪种惯例",
    conv15: "+1.5（Brannock）",
    conv2: "+2（零售）",
    convHint: "Brannock 是美国鞋店量脚的器具。许多零售商则标注 +2。",
    resultTitle: "各规格下的尺码",
    resultDesc: "脚长是基准，其余都由它推导。",
    colMetric: "规格",
    colValue: "尺码",
    rowMen: "US 男码",
    rowWomen: "US 女码",
    rowUk: "UK",
    rowEu: "EU",
    rowCm: "脚长",
    rangeTitle: "为什么答案不一致",
    rangeDesc: "这项换算没有统一标准，所以有用的答案是一个区间。",
    rangeBrannock: "Brannock 器具（美国鞋店）",
    rangeRetail: "常见零售对照表",
    caveat:
      "同样长度下女鞋楦型更窄，换算后的尺码可能偏紧。若介于两个数字之间，按脚长选择并核对品牌自己的尺码表。",
  },
  fr: {
    title: "Convertisseur de pointure homme ↔ femme",
    subtitle: "La conversion passe par la longueur du pied, on voit d'où vient le chiffre",
    reset: "Réinitialiser",
    fromLabel: "Convertir depuis",
    men: "US homme",
    women: "US femme",
    cm: "Longueur du pied",
    sizeUnit: "US",
    cmUnit: "cm",
    inputHint: "Les demi-pointures fonctionnent — essayez 9,5",
    convLabel: "Quelle convention",
    conv15: "+1,5 (Brannock)",
    conv2: "+2 (commerce)",
    convHint: "Le Brannock est l'appareil de mesure des magasins américains. Beaucoup d'enseignes publient +2.",
    resultTitle: "Votre pointure selon les systèmes",
    resultDesc: "La longueur du pied sert de référence, le reste en découle.",
    colMetric: "Système",
    colValue: "Pointure",
    rowMen: "US homme",
    rowWomen: "US femme",
    rowUk: "UK",
    rowEu: "EU",
    rowCm: "Longueur du pied",
    rangeTitle: "Pourquoi les réponses divergent",
    rangeDesc: "Il n'existe pas de norme unique : la réponse utile est un intervalle.",
    rangeBrannock: "Appareil Brannock (magasins US)",
    rangeRetail: "Tableaux commerciaux courants",
    caveat:
      "À longueur égale, les formes femme sont plus étroites. Entre les deux chiffres, choisissez selon la longueur du pied et vérifiez le tableau de la marque.",
  },
  es: {
    title: "Conversor de talla de calzado hombre ↔ mujer",
    subtitle: "Convierte a través del largo del pie, así se ve de dónde sale el número",
    reset: "Reiniciar",
    fromLabel: "Convertir desde",
    men: "US hombre",
    women: "US mujer",
    cm: "Largo del pie",
    sizeUnit: "US",
    cmUnit: "cm",
    inputHint: "Las medias tallas valen — prueba 9,5",
    convLabel: "Qué convención",
    conv15: "+1,5 (Brannock)",
    conv2: "+2 (comercio)",
    convHint: "El Brannock es el aparato con el que miden en las zapaterías de EE. UU. Muchas tiendas publican +2.",
    resultTitle: "Tu talla en cada sistema",
    resultDesc: "El largo del pie es la referencia; lo demás se deriva de él.",
    colMetric: "Sistema",
    colValue: "Talla",
    rowMen: "US hombre",
    rowWomen: "US mujer",
    rowUk: "UK",
    rowEu: "EU",
    rowCm: "Largo del pie",
    rangeTitle: "Por qué las respuestas difieren",
    rangeDesc: "No hay una norma única, así que la respuesta útil es un intervalo.",
    rangeBrannock: "Aparato Brannock (zapaterías de EE. UU.)",
    rangeRetail: "Tablas comerciales habituales",
    caveat:
      "A igual largo, las hormas de mujer son más estrechas. Si estás entre los dos números, elige por largo del pie y consulta la tabla de la marca.",
  },
};

export default function ShoeSizeConverter({ locale }: { locale: Locale }) {
  const t = COPY[locale] ?? COPY.en;
  const [from, setFrom] = useState<From>("men");
  const [raw, setRaw] = useState("9");
  const [offset, setOffset] = useState<Offset>("1.5");

  const reset = useCallback(() => {
    setFrom("men");
    setRaw("9");
    setOffset("1.5");
  }, []);

  const rows = useMemo(() => {
    const v = parseFloat(raw);
    if (!Number.isFinite(v) || v <= 0) return null;

    // Everything resolves to foot length first — that is the physical quantity.
    const inches =
      from === "men" ? lenFromMen(v) : from === "women" ? lenFromWomen(v) : v / INCH_CM;
    if (inches <= 0) return null;

    const men = menFromLen(inches);
    // The convention toggle only changes the men -> women step, which is the
    // part the world disagrees about. Everything else stays on foot length.
    const women = offset === "1.5" ? womenFromLen(inches) : men + 2;

    return {
      inches,
      men: half(men),
      women: half(women),
      uk: half(ukFromMen(men)),
      eu: half(euFromLen(inches)),
      cm: inches * INCH_CM,
      womenBrannock: half(womenFromLen(inches)),
      womenRetail: half(men + 2),
    };
  }, [raw, from, offset]);

  return (
    <div className="not-prose my-10 flex max-w-2xl flex-col gap-6 mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold tracking-tight">{t.title}</h3>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={reset} className="h-11 sm:h-8">
          <RotateCcw />
          {t.reset}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <FieldGroup>
            <Field>
              <FieldLabel>{t.fromLabel}</FieldLabel>
              <ToggleGroup
                type="single"
                value={from}
                onValueChange={(v) => v && setFrom(v as From)}
                className="justify-start"
              >
                <ToggleGroupItem value="men" className="h-11 sm:h-8 px-4">
                  {t.men}
                </ToggleGroupItem>
                <ToggleGroupItem value="women" className="h-11 sm:h-8 px-4">
                  {t.women}
                </ToggleGroupItem>
                <ToggleGroupItem value="cm" className="h-11 sm:h-8 px-4">
                  {t.cm}
                </ToggleGroupItem>
              </ToggleGroup>
            </Field>

            <Field>
              <FieldLabel htmlFor="shoe-size-input">
                {from === "cm" ? t.cm : from === "men" ? t.men : t.women}
              </FieldLabel>
              <InputGroup className="h-11 sm:h-8">
                <InputGroupInput
                  id="shoe-size-input"
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="0"
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                />
                <InputGroupAddon align="inline-end">
                  {from === "cm" ? t.cmUnit : t.sizeUnit}
                </InputGroupAddon>
              </InputGroup>
              <FieldDescription>{t.inputHint}</FieldDescription>
            </Field>

            <Field>
              <FieldLabel>{t.convLabel}</FieldLabel>
              <ToggleGroup
                type="single"
                value={offset}
                onValueChange={(v) => v && setOffset(v as Offset)}
                className="justify-start"
              >
                <ToggleGroupItem value="1.5" className="h-11 sm:h-8 px-4">
                  {t.conv15}
                </ToggleGroupItem>
                <ToggleGroupItem value="2" className="h-11 sm:h-8 px-4">
                  {t.conv2}
                </ToggleGroupItem>
              </ToggleGroup>
              <FieldDescription>{t.convHint}</FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.resultTitle}</CardTitle>
          <CardDescription>{t.resultDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.colMetric}</TableHead>
                <TableHead className="text-right">{t.colValue}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>{t.rowMen}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {rows ? fmt(rows.men) : "—"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t.rowWomen}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {rows ? fmt(rows.women) : "—"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t.rowUk}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {rows ? fmt(rows.uk) : "—"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t.rowEu}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {rows ? fmt(rows.eu) : "—"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t.rowCm}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {rows ? `${fmt(rows.cm)} cm` : "—"}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.rangeTitle}</CardTitle>
          <CardDescription>{t.rangeDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>{t.rangeBrannock}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {rows ? fmt(rows.womenBrannock) : "—"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t.rangeRetail}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {rows ? fmt(rows.womenRetail) : "—"}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p className="mt-4 text-sm text-muted-foreground">{t.caveat}</p>
        </CardContent>
      </Card>
    </div>
  );
}
