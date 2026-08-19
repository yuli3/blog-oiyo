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

// ── Every ring system is a function of the finger's inside measurement ───────
// US:  inside diameter (mm) = 11.63 + 0.8128 x size.
//      Checked: US 7 -> 17.32 mm ID / 54.41 mm circumference, against the
//      54.4 mm published by jewellers' charts.
// JIS S 4700 (Japan, and the same scale Korean shops call 호):
//      inside diameter (mm) = 13.0 + (size - 1) / 3.   JIS 10 -> exactly 16.0 mm.
// BS 6820 (UK): inside circumference (mm) = 37.8 + 1.25 x letter index,
//      A = 0, B = 1 ... Z = 25; half sizes fall on the 0.625 mm midpoint.
// EU / ISO 8653: the size IS the inside circumference in mm, so no conversion.
//
// The systems do not land on each other's whole numbers. Published charts hide
// that by rounding, which is why two charts can disagree by a half size for the
// same finger. This tool shows the exact figure and the rounded one side by side.
const US_BASE = 11.63;
const US_STEP = 0.8128;
const JP_BASE = 13.0;
const JP_STEP = 1 / 3;
const UK_BASE = 37.8;
const UK_STEP = 1.25;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const idFromUs = (n: number) => US_BASE + US_STEP * n;
const usFromId = (d: number) => (d - US_BASE) / US_STEP;
const idFromJp = (n: number) => JP_BASE + (n - 1) * JP_STEP;
const jpFromId = (d: number) => (d - JP_BASE) / JP_STEP + 1;
const circFromUkIndex = (i: number) => UK_BASE + UK_STEP * i;
const ukIndexFromCirc = (c: number) => (c - UK_BASE) / UK_STEP;

const half = (n: number) => Math.round(n * 2) / 2;
const fmt = (n: number, d = 2) =>
  Number.isFinite(n) ? n.toFixed(d).replace(/\.?0+$/, "") : "—";

/** Renders a UK index snapped to a sold size, e.g. 19.5 -> "T½". */
const ukLabel = (index: number) => {
  const snapped = half(index);
  const letter = Math.floor(snapped);
  if (letter < 0 || letter > 25) return "—";
  return LETTERS[letter] + (snapped - letter >= 0.5 ? "½" : "");
};

/**
 * Renders an unrounded UK index readably. The scale is letters, so the bare
 * index ("13.28") means nothing to a reader -- show which letter it sits on
 * and how far past it, e.g. "N +0.28".
 */
const ukExactLabel = (index: number) => {
  const letter = Math.floor(index);
  if (letter < 0 || letter > 25) return "—";
  const past = index - letter;
  if (past < 0.02) return LETTERS[letter];
  return `${LETTERS[letter]} +${past.toFixed(2)}`;
};

/** UK letter options, A through Z with the half sizes between them. */
const UK_OPTIONS = Array.from({ length: 52 }, (_, i) => i / 2).map((i) => ({
  index: i,
  label: ukLabel(i),
}));

type From = "circ" | "us" | "uk" | "jp";

type Copy = {
  title: string;
  subtitle: string;
  reset: string;
  fromLabel: string;
  fromCirc: string;
  fromUs: string;
  fromUk: string;
  fromJp: string;
  circUnit: string;
  sizeUnit: string;
  circHint: string;
  usHint: string;
  jpHint: string;
  ukHint: string;
  resultTitle: string;
  resultDesc: string;
  colSystem: string;
  colExact: string;
  colRounded: string;
  rowCirc: string;
  rowDiam: string;
  rowUs: string;
  rowUk: string;
  rowJp: string;
  gapTitle: string;
  gapDesc: string;
  gapClean: string;
  measureTitle: string;
  measureSteps: string[];
  caveat: string;
  sources: string;
};

const COPY: Record<Locale, Copy> = {
  en: {
    title: "Ring Size Converter — US · UK · EU · Japan / Korea",
    subtitle: "Converts through the inside measurement, so you can see where each number comes from",
    reset: "Reset",
    fromLabel: "Convert from",
    fromCirc: "Inside circumference",
    fromUs: "US size",
    fromUk: "UK size",
    fromJp: "Japan / Korea",
    circUnit: "mm",
    sizeUnit: "size",
    circHint: "Wrap paper round the finger, mark the overlap, measure it flat. This is also the EU/ISO size.",
    usHint: "Half sizes are fine — try 7.5",
    jpHint: "The 号 / 호 scale, whole numbers",
    ukHint: "A to Z, including the half sizes",
    resultTitle: "The same finger in every system",
    resultDesc: "Inside circumference is the anchor; every other number is derived from it.",
    colSystem: "System",
    colExact: "Exact",
    colRounded: "Sold as",
    rowCirc: "Circumference (= EU / ISO)",
    rowDiam: "Inside diameter",
    rowUs: "US",
    rowUk: "UK (BS 6820)",
    rowJp: "Japan / Korea (JIS)",
    gapTitle: "Where the charts disagree",
    gapDesc: "The systems do not line up on whole numbers. Printed charts round silently, so two of them can name different sizes for the same finger. These are the gaps for your measurement:",
    gapClean: "This measurement happens to land close to a whole size in every system, so the charts agree here.",
    measureTitle: "Measuring it yourself",
    measureSteps: [
      "Use a strip of paper, not string — string stretches and reads small.",
      "Wrap it round the base of the finger, not over the knuckle, and mark where it overlaps.",
      "Lay it flat against a ruler and read the millimetres. Measure in the evening, when fingers are at their largest.",
    ],
    caveat:
      "A wide band sits tighter than a thin one at the same size, and fingers change with heat, salt and time of day. If you are between two sizes, take the larger one.",
    sources: "Formulas: US inside diameter = 11.63 + 0.8128 × size · JIS S 4700 = 13.0 + (size−1)/3 · BS 6820 = 37.8 mm + 1.25 mm per letter · EU/ISO 8653 = circumference in mm.",
  },
  ko: {
    title: "반지 호수 변환 — US · UK · EU · 일본/한국",
    subtitle: "손가락 실측치를 거쳐 변환하므로 숫자가 어디서 나왔는지 보입니다",
    reset: "초기화",
    fromLabel: "무엇으로 입력하나요",
    fromCirc: "손가락 둘레",
    fromUs: "US 사이즈",
    fromUk: "UK 사이즈",
    fromJp: "일본/한국 호수",
    circUnit: "mm",
    sizeUnit: "호",
    circHint: "종이를 손가락에 감아 겹치는 곳을 표시하고 펴서 재세요. 이 값이 곧 EU/ISO 사이즈입니다.",
    usHint: "반 사이즈도 됩니다 — 7.5 처럼",
    jpHint: "号 / 호 척도, 정수",
    ukHint: "A부터 Z까지, 반 사이즈 포함",
    resultTitle: "같은 손가락을 각 체계로",
    resultDesc: "둘레가 기준이고 나머지 숫자는 전부 거기서 나옵니다.",
    colSystem: "체계",
    colExact: "정확값",
    colRounded: "판매 호수",
    rowCirc: "둘레 (= EU / ISO)",
    rowDiam: "내경",
    rowUs: "US",
    rowUk: "UK (BS 6820)",
    rowJp: "일본/한국 (JIS)",
    gapTitle: "표들이 어긋나는 지점",
    gapDesc: "체계들은 서로의 정수에 맞아떨어지지 않습니다. 인쇄된 표는 이 반올림을 말없이 처리하기 때문에, 같은 손가락을 두고 표마다 다른 호수를 적습니다. 지금 입력값의 어긋남은 이렇습니다:",
    gapClean: "이 치수는 모든 체계에서 정수에 가깝게 떨어져서, 여기서는 표들이 일치합니다.",
    measureTitle: "직접 재는 법",
    measureSteps: [
      "실 대신 종이띠를 쓰세요. 실은 늘어나서 실제보다 작게 나옵니다.",
      "마디 위가 아니라 손가락 밑동에 감고, 겹치는 지점을 표시합니다.",
      "자에 펴서 밀리미터로 읽습니다. 손가락이 가장 굵은 저녁에 재는 편이 안전합니다.",
    ],
    caveat:
      "같은 호수라도 넓은 반지가 더 꽉 끼고, 손가락은 온도·염분·시간대에 따라 달라집니다. 두 호수 사이라면 큰 쪽을 고르세요.",
    sources: "공식: US 내경 = 11.63 + 0.8128 × 호수 · JIS S 4700 = 13.0 + (호수−1)/3 · BS 6820 = 37.8mm + 문자당 1.25mm · EU/ISO 8653 = 둘레 mm.",
  },
  ja: {
    title: "指輪サイズ変換 — US · UK · EU · 日本/韓国",
    subtitle: "指の実測値を経由して換算するので、数字の出どころが見えます",
    reset: "リセット",
    fromLabel: "何で入力しますか",
    fromCirc: "指の円周",
    fromUs: "USサイズ",
    fromUk: "UKサイズ",
    fromJp: "日本/韓国の号数",
    circUnit: "mm",
    sizeUnit: "号",
    circHint: "紙を指に巻いて重なる点に印を付け、伸ばして測ります。この値がそのままEU/ISOサイズです。",
    usHint: "ハーフサイズも使えます — 7.5 など",
    jpHint: "号 / 호 の目盛り、整数",
    ukHint: "AからZまで、ハーフサイズを含む",
    resultTitle: "同じ指を各体系で",
    resultDesc: "円周が基準で、ほかの数字はすべてそこから導かれます。",
    colSystem: "体系",
    colExact: "正確な値",
    colRounded: "販売号数",
    rowCirc: "円周 (= EU / ISO)",
    rowDiam: "内径",
    rowUs: "US",
    rowUk: "UK (BS 6820)",
    rowJp: "日本/韓国 (JIS)",
    gapTitle: "表がずれるところ",
    gapDesc: "各体系は互いの整数に一致しません。印刷された表はこの丸めを黙って処理するため、同じ指でも表ごとに違う号数を書きます。今の入力でのずれはこうです:",
    gapClean: "この寸法はどの体系でも整数に近く収まるため、ここでは表が一致します。",
    measureTitle: "自分で測る",
    measureSteps: [
      "糸ではなく紙の帯を使います。糸は伸びて実際より小さく出ます。",
      "関節の上ではなく指の付け根に巻き、重なる点に印を付けます。",
      "定規に伸ばしてミリで読みます。指が最も太い夕方に測ると安全です。",
    ],
    caveat:
      "同じ号数でも幅広の指輪はきつく感じ、指は温度・塩分・時間帯で変わります。二つの号数の間なら大きい方を選んでください。",
    sources: "式: US内径 = 11.63 + 0.8128 × 号数 · JIS S 4700 = 13.0 + (号数−1)/3 · BS 6820 = 37.8mm + 1文字あたり1.25mm · EU/ISO 8653 = 円周 mm。",
  },
  zh: {
    title: "戒指尺寸换算 — US · UK · EU · 日本/韩国",
    subtitle: "通过手指实测值换算，让你看见每个数字的来处",
    reset: "重置",
    fromLabel: "用什么输入",
    fromCirc: "手指周长",
    fromUs: "US 尺寸",
    fromUk: "UK 尺寸",
    fromJp: "日本/韩国号数",
    circUnit: "mm",
    sizeUnit: "号",
    circHint: "用纸条绕手指一圈，标出重叠处再摊平测量。这个值就是 EU/ISO 尺寸。",
    usHint: "可以用半码 — 例如 7.5",
    jpHint: "号 / 호 刻度，整数",
    ukHint: "A 到 Z，含半码",
    resultTitle: "同一根手指在各体系中",
    resultDesc: "周长是基准，其余数字都由它推导。",
    colSystem: "体系",
    colExact: "精确值",
    colRounded: "实售号数",
    rowCirc: "周长 (= EU / ISO)",
    rowDiam: "内径",
    rowUs: "US",
    rowUk: "UK (BS 6820)",
    rowJp: "日本/韩国 (JIS)",
    gapTitle: "各家表格分歧之处",
    gapDesc: "这些体系并不落在彼此的整数上。印制表格会默默四舍五入，所以同一根手指在不同表里会得到不同号数。你这次输入的偏差如下：",
    gapClean: "这个尺寸在各体系中都接近整数，所以这里各表一致。",
    measureTitle: "自己测量",
    measureSteps: [
      "用纸条而不是线，线会拉伸，量出来偏小。",
      "绕在指根而非指节上，标出重叠点。",
      "摊平贴着尺子读毫米。傍晚手指最粗，那时测更保险。",
    ],
    caveat:
      "同样号数下宽戒圈更紧，手指也会随温度、盐分与时段变化。若介于两个号数之间，取大的那个。",
    sources: "公式：US 内径 = 11.63 + 0.8128 × 号数 · JIS S 4700 = 13.0 + (号数−1)/3 · BS 6820 = 37.8mm + 每字母 1.25mm · EU/ISO 8653 = 周长 mm。",
  },
  fr: {
    title: "Convertisseur de taille de bague — US · UK · EU · Japon/Corée",
    subtitle: "La conversion passe par la mesure du doigt, pour voir d'où vient chaque chiffre",
    reset: "Réinitialiser",
    fromLabel: "Convertir à partir de",
    fromCirc: "Circonférence du doigt",
    fromUs: "Taille US",
    fromUk: "Taille UK",
    fromJp: "Japon / Corée",
    circUnit: "mm",
    sizeUnit: "taille",
    circHint: "Enroulez une bande de papier autour du doigt, marquez le chevauchement, mesurez à plat. Cette valeur est aussi la taille EU/ISO.",
    usHint: "Les demi-tailles fonctionnent — essayez 7,5",
    jpHint: "L'échelle 号 / 호, nombres entiers",
    ukHint: "De A à Z, demi-tailles comprises",
    resultTitle: "Le même doigt dans chaque système",
    resultDesc: "La circonférence est la référence ; tous les autres chiffres en découlent.",
    colSystem: "Système",
    colExact: "Valeur exacte",
    colRounded: "Taille vendue",
    rowCirc: "Circonférence (= EU / ISO)",
    rowDiam: "Diamètre intérieur",
    rowUs: "US",
    rowUk: "UK (BS 6820)",
    rowJp: "Japon / Corée (JIS)",
    gapTitle: "Là où les tableaux divergent",
    gapDesc: "Les systèmes ne tombent pas sur les entiers les uns des autres. Les tableaux imprimés arrondissent en silence : deux d'entre eux peuvent donc donner des tailles différentes pour le même doigt. Voici les écarts pour votre mesure :",
    gapClean: "Cette mesure tombe près d'un entier dans chaque système : ici les tableaux s'accordent.",
    measureTitle: "Mesurer soi-même",
    measureSteps: [
      "Utilisez une bande de papier, pas de la ficelle : la ficelle s'étire et sous-estime.",
      "Enroulez-la à la base du doigt, pas sur l'articulation, et marquez le chevauchement.",
      "Mettez-la à plat contre une règle et lisez en millimètres. Mesurez le soir, quand les doigts sont au plus large.",
    ],
    caveat:
      "À taille égale, un anneau large serre davantage, et les doigts varient selon la chaleur, le sel et l'heure. Entre deux tailles, prenez la plus grande.",
    sources: "Formules : diamètre intérieur US = 11,63 + 0,8128 × taille · JIS S 4700 = 13,0 + (taille−1)/3 · BS 6820 = 37,8 mm + 1,25 mm par lettre · EU/ISO 8653 = circonférence en mm.",
  },
  es: {
    title: "Conversor de talla de anillo — US · UK · EU · Japón/Corea",
    subtitle: "Convierte a través de la medida del dedo, para ver de dónde sale cada número",
    reset: "Reiniciar",
    fromLabel: "Convertir desde",
    fromCirc: "Circunferencia del dedo",
    fromUs: "Talla US",
    fromUk: "Talla UK",
    fromJp: "Japón / Corea",
    circUnit: "mm",
    sizeUnit: "talla",
    circHint: "Enrolla una tira de papel en el dedo, marca donde se solapa y mídela estirada. Ese valor es también la talla EU/ISO.",
    usHint: "Las medias tallas valen — prueba 7,5",
    jpHint: "La escala 号 / 호, números enteros",
    ukHint: "De la A a la Z, con medias tallas",
    resultTitle: "El mismo dedo en cada sistema",
    resultDesc: "La circunferencia es la referencia; los demás números se derivan de ella.",
    colSystem: "Sistema",
    colExact: "Valor exacto",
    colRounded: "Talla a la venta",
    rowCirc: "Circunferencia (= EU / ISO)",
    rowDiam: "Diámetro interior",
    rowUs: "US",
    rowUk: "UK (BS 6820)",
    rowJp: "Japón / Corea (JIS)",
    gapTitle: "Dónde discrepan las tablas",
    gapDesc: "Los sistemas no caen en los enteros de los demás. Las tablas impresas redondean sin avisar, así que dos de ellas pueden dar tallas distintas para el mismo dedo. Estas son las diferencias para tu medida:",
    gapClean: "Esta medida cae cerca de un entero en todos los sistemas, así que aquí las tablas coinciden.",
    measureTitle: "Medirlo tú mismo",
    measureSteps: [
      "Usa una tira de papel, no hilo: el hilo se estira y mide de menos.",
      "Enróllala en la base del dedo, no sobre el nudillo, y marca el solape.",
      "Estírala contra una regla y lee los milímetros. Mide por la tarde, cuando los dedos están más gruesos.",
    ],
    caveat:
      "Con la misma talla, un aro ancho aprieta más, y los dedos cambian con el calor, la sal y la hora del día. Si estás entre dos tallas, elige la mayor.",
    sources: "Fórmulas: diámetro interior US = 11,63 + 0,8128 × talla · JIS S 4700 = 13,0 + (talla−1)/3 · BS 6820 = 37,8 mm + 1,25 mm por letra · EU/ISO 8653 = circunferencia en mm.",
  },
};

export default function RingSizeConverter({ locale = "en" }: { locale?: Locale }) {
  const t = COPY[locale] ?? COPY.en;
  const [from, setFrom] = useState<From>("circ");
  const [circ, setCirc] = useState("54.4");
  const [us, setUs] = useState("7");
  const [jp, setJp] = useState("14");
  const [ukIndex, setUkIndex] = useState("13.5");

  const reset = useCallback(() => {
    setFrom("circ");
    setCirc("54.4");
    setUs("7");
    setJp("14");
    setUkIndex("13.5");
  }, []);

  // Everything resolves to one inside diameter, then fans back out.
  const diameter = useMemo(() => {
    if (from === "circ") return Number(circ) / Math.PI;
    if (from === "us") return idFromUs(Number(us));
    if (from === "jp") return idFromJp(Number(jp));
    return circFromUkIndex(Number(ukIndex)) / Math.PI;
  }, [from, circ, us, jp, ukIndex]);

  const rows = useMemo(() => {
    if (!Number.isFinite(diameter) || diameter <= 0) return null;
    const c = diameter * Math.PI;
    const usExact = usFromId(diameter);
    const jpExact = jpFromId(diameter);
    const ukExact = ukIndexFromCirc(c);
    return {
      c,
      usExact,
      jpExact,
      ukExact,
      usRound: half(usExact),
      jpRound: Math.round(jpExact),
      ukRound: half(ukExact),
    };
  }, [diameter]);

  // A "gap" is how far a system's real value sits from the whole size a chart
  // would print. Anything under a fifth of a size is not worth mentioning.
  const gaps = useMemo(() => {
    if (!rows) return [];
    const out: { label: string; text: string }[] = [];
    const usGap = rows.usExact - rows.usRound;
    const jpGap = rows.jpExact - rows.jpRound;
    const ukGap = rows.ukExact - rows.ukRound;
    if (Math.abs(usGap) >= 0.2)
      out.push({ label: t.rowUs, text: `${fmt(rows.usExact)} → ${fmt(rows.usRound)} (${usGap > 0 ? "−" : "+"}${fmt(Math.abs(usGap))})` });
    if (Math.abs(jpGap) >= 0.2)
      out.push({ label: t.rowJp, text: `${fmt(rows.jpExact)} → ${rows.jpRound} (${jpGap > 0 ? "−" : "+"}${fmt(Math.abs(jpGap))})` });
    if (Math.abs(ukGap) >= 0.2)
      out.push({ label: t.rowUk, text: `${ukExactLabel(rows.ukExact)} → ${ukLabel(rows.ukRound)} (${ukGap > 0 ? "−" : "+"}${fmt(Math.abs(ukGap))})` });
    return out;
  }, [rows, t]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription>{t.subtitle}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={reset} aria-label={t.reset}>
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel>{t.fromLabel}</FieldLabel>
            <ToggleGroup
              type="single"
              value={from}
              onValueChange={(v) => v && setFrom(v as From)}
              variant="outline"
              className="w-full"
            >
              <ToggleGroupItem value="circ" className="flex-1">{t.fromCirc}</ToggleGroupItem>
              <ToggleGroupItem value="us" className="flex-1">{t.fromUs}</ToggleGroupItem>
              <ToggleGroupItem value="uk" className="flex-1">{t.fromUk}</ToggleGroupItem>
              <ToggleGroupItem value="jp" className="flex-1">{t.fromJp}</ToggleGroupItem>
            </ToggleGroup>
          </Field>

          {from === "circ" && (
            <Field>
              <FieldLabel htmlFor="ring-circ">{t.fromCirc}</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="ring-circ"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={circ}
                  onChange={(e) => setCirc(e.target.value)}
                />
                <InputGroupAddon align="inline-end">{t.circUnit}</InputGroupAddon>
              </InputGroup>
              <FieldDescription>{t.circHint}</FieldDescription>
            </Field>
          )}

          {from === "us" && (
            <Field>
              <FieldLabel htmlFor="ring-us">{t.fromUs}</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="ring-us"
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  value={us}
                  onChange={(e) => setUs(e.target.value)}
                />
                <InputGroupAddon align="inline-end">US</InputGroupAddon>
              </InputGroup>
              <FieldDescription>{t.usHint}</FieldDescription>
            </Field>
          )}

          {from === "jp" && (
            <Field>
              <FieldLabel htmlFor="ring-jp">{t.fromJp}</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="ring-jp"
                  type="number"
                  inputMode="numeric"
                  step="1"
                  value={jp}
                  onChange={(e) => setJp(e.target.value)}
                />
                <InputGroupAddon align="inline-end">{t.sizeUnit}</InputGroupAddon>
              </InputGroup>
              <FieldDescription>{t.jpHint}</FieldDescription>
            </Field>
          )}

          {from === "uk" && (
            <Field>
              <FieldLabel htmlFor="ring-uk">{t.fromUk}</FieldLabel>
              <select
                id="ring-uk"
                value={ukIndex}
                onChange={(e) => setUkIndex(e.target.value)}
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              >
                {UK_OPTIONS.map((o) => (
                  <option key={o.index} value={String(o.index)}>
                    {o.label}
                  </option>
                ))}
              </select>
              <FieldDescription>{t.ukHint}</FieldDescription>
            </Field>
          )}
        </FieldGroup>

        {rows && (
          <div className="mt-8">
            <h3 className="text-base font-semibold">{t.resultTitle}</h3>
            <p className="text-muted-foreground mt-1 text-sm">{t.resultDesc}</p>
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>{t.colSystem}</TableHead>
                  <TableHead className="text-right tabular-nums">{t.colExact}</TableHead>
                  <TableHead className="text-right tabular-nums">{t.colRounded}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>{t.rowCirc}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(rows.c)} mm</TableCell>
                  <TableCell className="text-right tabular-nums">{Math.round(rows.c)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t.rowDiam}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(diameter)} mm</TableCell>
                  <TableCell className="text-right tabular-nums">—</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t.rowUs}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(rows.usExact)}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{fmt(rows.usRound)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t.rowUk}</TableCell>
                  <TableCell className="text-right tabular-nums">{ukExactLabel(rows.ukExact)}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{ukLabel(rows.ukRound)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t.rowJp}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(rows.jpExact)}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{rows.jpRound}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="bg-muted/40 mt-6 rounded-lg p-4">
              <h4 className="text-sm font-semibold">{t.gapTitle}</h4>
              {gaps.length > 0 ? (
                <>
                  <p className="text-muted-foreground mt-1 text-sm">{t.gapDesc}</p>
                  <ul className="mt-3 space-y-1 text-sm">
                    {gaps.map((g) => (
                      <li key={g.label} className="flex justify-between gap-4">
                        <span className="text-muted-foreground">{g.label}</span>
                        <span className="tabular-nums">{g.text}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-muted-foreground mt-1 text-sm">{t.gapClean}</p>
              )}
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-semibold">{t.measureTitle}</h4>
              <ol className="text-muted-foreground mt-2 list-decimal space-y-1 pl-5 text-sm">
                {t.measureSteps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>

            <p className="text-muted-foreground mt-6 text-sm leading-6">{t.caveat}</p>
            <p className="text-muted-foreground mt-3 text-xs leading-5">{t.sources}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
