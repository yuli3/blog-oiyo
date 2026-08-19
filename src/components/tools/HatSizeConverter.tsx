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

// ── Hat sizes are head circumference wearing three different costumes ────────
// US fitted size = head circumference in inches / pi, rounded to the nearest
// eighth. It is the head's diameter, which is why the numbers look like 7 1/4.
// UK runs exactly one eighth below US. European sizing is the circumference in
// centimetres, unconverted.
//
// Checked against a published 15-row chart: EU 50/56/58/60/62/64 come out as US
// 6 1/4 / 7 / 7 1/4 / 7 1/2 / 7 3/4 / 8 and UK one eighth below each. Every row
// matched.
//
// Alpha sizing (S/M/L) is the one with no standard behind it: it is a two
// centimetre bucket, so the same head is an M at one brand and an L at another.
// This tool shows the bucket AND how close you are to its edge, rather than
// printing a single letter as though it were a fact.
const INCH = 2.54;
const ALPHA: { label: string; minCm: number; maxCm: number }[] = [
  { label: "XXS", minCm: 49, maxCm: 52 },
  { label: "XS", minCm: 53, maxCm: 54 },
  { label: "S", minCm: 55, maxCm: 56 },
  { label: "M", minCm: 57, maxCm: 58 },
  { label: "L", minCm: 59, maxCm: 60 },
  { label: "XL", minCm: 61, maxCm: 62 },
  { label: "XXL", minCm: 63, maxCm: 65 },
];

const EDGE_CM = 0.5;

const eighth = (n: number) => Math.round(n * 8) / 8;
const usFromCm = (cm: number) => cm / INCH / Math.PI;
const cmFromUs = (size: number) => size * Math.PI * INCH;

/** 7.25 -> "7 1/4". Hat sizes are always written in eighths. */
const asEighths = (x: number) => {
  if (!Number.isFinite(x)) return "—";
  const whole = Math.floor(x);
  let num = Math.round((x - whole) * 8);
  if (num === 8) return String(whole + 1);
  if (num === 0) return String(whole);
  let den = 8;
  while (num % 2 === 0) {
    num /= 2;
    den /= 2;
  }
  return `${whole} ${num}/${den}`;
};

const fmt = (n: number, d = 1) =>
  Number.isFinite(n) ? n.toFixed(d).replace(/\.0$/, "") : "—";

type From = "cm" | "in" | "us";

type Copy = {
  title: string;
  subtitle: string;
  reset: string;
  fromLabel: string;
  fromCm: string;
  fromIn: string;
  fromUs: string;
  cmUnit: string;
  inUnit: string;
  cmHint: string;
  inHint: string;
  usHint: string;
  resultTitle: string;
  resultDesc: string;
  colSystem: string;
  colValue: string;
  rowCm: string;
  rowIn: string;
  rowUs: string;
  rowUk: string;
  rowEu: string;
  rowAlpha: string;
  alphaTitle: string;
  alphaDesc: string;
  alphaEdge: (letter: string, other: string, gap: string) => string;
  alphaSafe: (letter: string) => string;
  measureTitle: string;
  measureSteps: string[];
  caveat: string;
  sources: string;
};

const COPY: Record<Locale, Copy> = {
  en: {
    title: "Hat Size Converter — US, UK, EU and S/M/L",
    subtitle: "Every hat size is your head circumference in disguise. This shows the disguise.",
    reset: "Reset",
    fromLabel: "Measure by",
    fromCm: "Circumference (cm)",
    fromIn: "Circumference (in)",
    fromUs: "US fitted size",
    cmUnit: "cm",
    inUnit: "in",
    cmHint: "Tape around the head, just above the ears and mid-forehead.",
    inHint: "Same measurement, in inches.",
    usHint: "The number on a fitted cap, e.g. 7.25 for 7 1/4",
    resultTitle: "The same head in every system",
    resultDesc: "Circumference is the anchor. US is that measurement in inches divided by pi.",
    colSystem: "System",
    colValue: "Size",
    rowCm: "Circumference",
    rowIn: "Circumference",
    rowUs: "US fitted",
    rowUk: "UK",
    rowEu: "EU (= cm)",
    rowAlpha: "Alpha",
    alphaTitle: "The letter is the shakiest number here",
    alphaDesc: "US, UK and EU are arithmetic on one measurement. S/M/L is not — it is a two centimetre bucket with no standard behind it, so brands draw the lines in different places.",
    alphaEdge: (letter, other, gap) =>
      `You are ${gap} cm from the ${other} boundary. At this measurement, expect to be ${letter} at some brands and ${other} at others — buy on circumference, not on the letter.`,
    alphaSafe: (letter) =>
      `You sit near the middle of ${letter}, so the letter is unusually safe here. It still is not a standard.`,
    measureTitle: "Measuring your head",
    measureSteps: [
      "Run a soft tape around the widest part — just above the ears and across the middle of the forehead.",
      "Keep it snug but not tight; a hat should sit on the head, not grip it.",
      "Measure twice. A centimetre is most of a hat size, so a sloppy reading changes the answer.",
    ],
    caveat:
      "Crown shape matters as much as circumference — a long oval head and a round head with identical measurements do not fit the same hat. If you are between sizes, take the larger and use a sizing tape inside the band.",
    sources: "US fitted size = head circumference in inches ÷ π, rounded to the nearest eighth. UK = US − 1/8. EU = circumference in centimetres. Verified against a published 15-row conversion chart from 50 cm to 64 cm; every row matched.",
  },
  ko: {
    title: "모자 사이즈 변환 — US · UK · EU · S/M/L",
    subtitle: "모자 사이즈는 전부 머리둘레가 옷을 갈아입은 것입니다. 그 옷을 벗겨서 보여줍니다.",
    reset: "초기화",
    fromLabel: "무엇으로 재나요",
    fromCm: "머리둘레 (cm)",
    fromIn: "머리둘레 (인치)",
    fromUs: "US 피티드 사이즈",
    cmUnit: "cm",
    inUnit: "in",
    cmHint: "귀 바로 위와 이마 중간을 지나도록 머리에 줄자를 감으세요.",
    inHint: "같은 치수를 인치로.",
    usHint: "피티드 캡에 적힌 숫자. 7 1/4 이면 7.25",
    resultTitle: "같은 머리를 각 체계로",
    resultDesc: "둘레가 기준입니다. US는 그 둘레를 인치로 바꿔 π로 나눈 값입니다.",
    colSystem: "체계",
    colValue: "사이즈",
    rowCm: "머리둘레",
    rowIn: "머리둘레",
    rowUs: "US 피티드",
    rowUk: "UK",
    rowEu: "EU (= cm)",
    rowAlpha: "알파",
    alphaTitle: "여기서 가장 흔들리는 숫자가 알파벳입니다",
    alphaDesc: "US·UK·EU는 하나의 측정값에 대한 산수입니다. S/M/L은 아닙니다 — 표준 없이 2cm씩 끊은 양동이라, 브랜드마다 선을 다른 곳에 긋습니다.",
    alphaEdge: (letter, other, gap) =>
      `${other} 경계에서 ${gap}cm 떨어져 있습니다. 이 치수라면 어떤 브랜드에선 ${letter}, 어떤 브랜드에선 ${other}로 나옵니다 — 알파벳 말고 둘레로 사세요.`,
    alphaSafe: (letter) =>
      `${letter} 구간의 가운데쯤이라 이 경우엔 알파벳이 비교적 안전합니다. 그래도 표준은 아닙니다.`,
    measureTitle: "머리 재는 법",
    measureSteps: [
      "가장 굵은 곳 — 귀 바로 위, 이마 한가운데를 지나도록 부드러운 줄자를 감습니다.",
      "붙되 조이지 않게. 모자는 머리에 얹히는 것이지 죄는 것이 아닙니다.",
      "두 번 재세요. 1cm면 거의 한 사이즈라, 대충 재면 답이 바뀝니다.",
    ],
    caveat:
      "둘레만큼 두상 모양도 중요합니다 — 둘레가 같아도 장두형과 원형은 같은 모자가 맞지 않습니다. 두 사이즈 사이라면 큰 쪽을 고르고 밴드 안쪽에 사이즈 테이프를 쓰세요.",
    sources: "US 피티드 = 머리둘레(인치) ÷ π 를 1/8 단위로 반올림. UK = US − 1/8. EU = 둘레 cm. 50~64cm 15행짜리 공개 변환표와 대조해 전 행이 일치했습니다.",
  },
  ja: {
    title: "帽子サイズ変換 — US・UK・EU・S/M/L",
    subtitle: "帽子のサイズはすべて頭囲が姿を変えたものです。その中身を見せます。",
    reset: "リセット",
    fromLabel: "何で測りますか",
    fromCm: "頭囲 (cm)",
    fromIn: "頭囲 (インチ)",
    fromUs: "US フィッテッドサイズ",
    cmUnit: "cm",
    inUnit: "in",
    cmHint: "耳のすぐ上と額の中央を通るように、メジャーを頭に回します。",
    inHint: "同じ寸法をインチで。",
    usHint: "フィッテッドキャップに書かれた数字。7 1/4 なら 7.25",
    resultTitle: "同じ頭を各体系で",
    resultDesc: "頭囲が基準です。US はその頭囲をインチにして π で割った値です。",
    colSystem: "体系",
    colValue: "サイズ",
    rowCm: "頭囲",
    rowIn: "頭囲",
    rowUs: "US フィッテッド",
    rowUk: "UK",
    rowEu: "EU (= cm)",
    rowAlpha: "アルファ",
    alphaTitle: "ここで最も揺れる数字がアルファベットです",
    alphaDesc: "US・UK・EU は一つの実測値に対する算術です。S/M/L は違います — 標準なしに2cmで区切ったバケツなので、ブランドごとに線の位置が変わります。",
    alphaEdge: (letter, other, gap) =>
      `${other} の境界まで ${gap}cm です。この寸法だと、あるブランドでは ${letter}、別のブランドでは ${other} になります — アルファベットではなく頭囲で選んでください。`,
    alphaSafe: (letter) =>
      `${letter} の中ほどなので、この場合はアルファベットが比較的安全です。それでも標準ではありません。`,
    measureTitle: "頭の測り方",
    measureSteps: [
      "いちばん太いところ — 耳のすぐ上、額の中央を通るように柔らかいメジャーを回します。",
      "密着させつつ締めない。帽子は頭に載るもので、締めつけるものではありません。",
      "二度測ってください。1cm はほぼ一サイズ分なので、雑に測ると答えが変わります。",
    ],
    caveat:
      "頭囲と同じくらい頭の形も重要です — 頭囲が同じでも長頭型と丸型では同じ帽子が合いません。二つのサイズの間なら大きい方を選び、バンド内側にサイズテープを使ってください。",
    sources: "US フィッテッド = 頭囲(インチ) ÷ π を 1/8 単位で四捨五入。UK = US − 1/8。EU = 頭囲 cm。50〜64cm の15行の公開換算表と照合し、全行が一致しました。",
  },
  zh: {
    title: "帽子尺寸换算 — US · UK · EU · S/M/L",
    subtitle: "所有帽子尺寸都是头围换了件衣服。这里把衣服脱下来给你看。",
    reset: "重置",
    fromLabel: "用什么测量",
    fromCm: "头围 (cm)",
    fromIn: "头围 (英寸)",
    fromUs: "US 平顶帽尺寸",
    cmUnit: "cm",
    inUnit: "in",
    cmHint: "软尺绕头一圈，经过耳朵上方与额头中部。",
    inHint: "同一测量值，用英寸。",
    usHint: "平顶帽上标的数字，7 1/4 即 7.25",
    resultTitle: "同一个头在各体系中",
    resultDesc: "头围是基准。US 就是把头围换成英寸再除以 π。",
    colSystem: "体系",
    colValue: "尺寸",
    rowCm: "头围",
    rowIn: "头围",
    rowUs: "US 平顶帽",
    rowUk: "UK",
    rowEu: "EU (= cm)",
    rowAlpha: "字母码",
    alphaTitle: "这里最不稳的数字是字母",
    alphaDesc: "US、UK、EU 都是对同一测量值做算术。S/M/L 不是 —— 它是没有标准的 2cm 分桶，各品牌把线画在不同位置。",
    alphaEdge: (letter, other, gap) =>
      `距离 ${other} 的分界还有 ${gap}cm。这个尺寸下，有的品牌算 ${letter}，有的算 ${other} —— 按头围买，别按字母。`,
    alphaSafe: (letter) =>
      `你落在 ${letter} 区间中部，这种情况下字母相对安全。但它仍然不是标准。`,
    measureTitle: "怎么量头",
    measureSteps: [
      "沿最粗处绕一圈 —— 经过耳朵正上方与额头正中。",
      "贴合但不勒紧；帽子是戴在头上，不是箍住头。",
      "量两次。1cm 差不多就是一个尺码，量得随意答案就变了。",
    ],
    caveat:
      "头型和头围一样重要 —— 头围相同，长头型和圆头型戴同一顶帽子未必都合适。介于两码之间时取大的，并在帽圈内侧加尺寸胶条。",
    sources: "US 平顶帽尺寸 = 头围(英寸) ÷ π，四舍五入到 1/8。UK = US − 1/8。EU = 头围厘米数。已与 50–64cm 共 15 行的公开换算表比对，全部吻合。",
  },
  fr: {
    title: "Convertisseur de taille de chapeau — US, UK, EU et S/M/L",
    subtitle: "Toutes les tailles de chapeau sont votre tour de tête déguisé. Voici le déguisement.",
    reset: "Réinitialiser",
    fromLabel: "Mesurer par",
    fromCm: "Tour de tête (cm)",
    fromIn: "Tour de tête (pouces)",
    fromUs: "Taille US fitted",
    cmUnit: "cm",
    inUnit: "in",
    cmHint: "Passez le mètre autour de la tête, juste au-dessus des oreilles et au milieu du front.",
    inHint: "La même mesure, en pouces.",
    usHint: "Le nombre inscrit sur une casquette fitted, par ex. 7,25 pour 7 1/4",
    resultTitle: "La même tête dans chaque système",
    resultDesc: "Le tour de tête est la référence. La taille US, c'est cette mesure en pouces divisée par π.",
    colSystem: "Système",
    colValue: "Taille",
    rowCm: "Tour de tête",
    rowIn: "Tour de tête",
    rowUs: "US fitted",
    rowUk: "UK",
    rowEu: "EU (= cm)",
    rowAlpha: "Lettre",
    alphaTitle: "La lettre est le chiffre le plus fragile ici",
    alphaDesc: "US, UK et EU sont de l'arithmétique sur une seule mesure. S/M/L ne l'est pas : c'est un seau de deux centimètres sans norme derrière, et chaque marque trace la ligne ailleurs.",
    alphaEdge: (letter, other, gap) =>
      `Vous êtes à ${gap} cm de la limite ${other}. À cette mesure, attendez-vous à être ${letter} chez certaines marques et ${other} chez d'autres — achetez au tour de tête, pas à la lettre.`,
    alphaSafe: (letter) =>
      `Vous êtes vers le milieu du ${letter}, la lettre est donc plutôt sûre ici. Cela n'en fait pas une norme.`,
    measureTitle: "Mesurer sa tête",
    measureSteps: [
      "Faites passer un mètre souple à l'endroit le plus large — juste au-dessus des oreilles et au milieu du front.",
      "Ajusté mais pas serré : un chapeau se pose sur la tête, il ne la comprime pas.",
      "Mesurez deux fois. Un centimètre vaut presque une taille, une lecture approximative change la réponse.",
    ],
    caveat:
      "La forme du crâne compte autant que le tour de tête : à mesure égale, une tête ovale et une tête ronde ne portent pas le même chapeau. Entre deux tailles, prenez la plus grande et ajoutez un ruban de mise à taille à l'intérieur du bandeau.",
    sources: "Taille US fitted = tour de tête en pouces ÷ π, arrondi au huitième. UK = US − 1/8. EU = tour de tête en centimètres. Vérifié sur un tableau publié de 15 lignes, de 50 à 64 cm : toutes les lignes correspondent.",
  },
  es: {
    title: "Conversor de talla de sombrero — US, UK, EU y S/M/L",
    subtitle: "Todas las tallas de sombrero son tu perímetro craneal disfrazado. Aquí está el disfraz.",
    reset: "Reiniciar",
    fromLabel: "Medir por",
    fromCm: "Perímetro (cm)",
    fromIn: "Perímetro (pulgadas)",
    fromUs: "Talla US fitted",
    cmUnit: "cm",
    inUnit: "in",
    cmHint: "Pasa la cinta alrededor de la cabeza, justo por encima de las orejas y por el centro de la frente.",
    inHint: "La misma medida, en pulgadas.",
    usHint: "El número de una gorra fitted, p. ej. 7,25 para 7 1/4",
    resultTitle: "La misma cabeza en cada sistema",
    resultDesc: "El perímetro es la referencia. La talla US es esa medida en pulgadas dividida entre π.",
    colSystem: "Sistema",
    colValue: "Talla",
    rowCm: "Perímetro",
    rowIn: "Perímetro",
    rowUs: "US fitted",
    rowUk: "UK",
    rowEu: "EU (= cm)",
    rowAlpha: "Letra",
    alphaTitle: "La letra es el número más frágil de todos",
    alphaDesc: "US, UK y EU son aritmética sobre una sola medida. S/M/L no lo es: es un cubo de dos centímetros sin norma detrás, y cada marca traza la línea en otro sitio.",
    alphaEdge: (letter, other, gap) =>
      `Estás a ${gap} cm del límite de ${other}. Con esta medida, serás ${letter} en unas marcas y ${other} en otras: compra por perímetro, no por la letra.`,
    alphaSafe: (letter) =>
      `Estás cerca del centro de ${letter}, así que aquí la letra es bastante fiable. Aun así no es una norma.`,
    measureTitle: "Cómo medir la cabeza",
    measureSteps: [
      "Rodea la parte más ancha con una cinta blanda: justo por encima de las orejas y por el centro de la frente.",
      "Ajustada pero sin apretar; un sombrero se apoya en la cabeza, no la comprime.",
      "Mide dos veces. Un centímetro es casi una talla, y una lectura descuidada cambia la respuesta.",
    ],
    caveat:
      "La forma del cráneo importa tanto como el perímetro: con la misma medida, una cabeza ovalada y una redonda no llevan el mismo sombrero. Entre dos tallas, elige la mayor y usa cinta de ajuste por dentro de la badana.",
    sources: "Talla US fitted = perímetro en pulgadas ÷ π, redondeado al octavo. UK = US − 1/8. EU = perímetro en centímetros. Verificado contra una tabla publicada de 15 filas, de 50 a 64 cm: todas las filas coinciden.",
  },
};

export default function HatSizeConverter({ locale = "en" }: { locale?: Locale }) {
  const t = COPY[locale] ?? COPY.en;
  const [from, setFrom] = useState<From>("cm");
  const [cm, setCm] = useState("58");
  const [inch, setInch] = useState("22.8");
  const [us, setUs] = useState("7.25");

  const reset = useCallback(() => {
    setFrom("cm");
    setCm("58");
    setInch("22.8");
    setUs("7.25");
  }, []);

  const circCm = useMemo(() => {
    if (from === "cm") return Number(cm);
    if (from === "in") return Number(inch) * INCH;
    return cmFromUs(Number(us));
  }, [from, cm, inch, us]);

  const result = useMemo(() => {
    if (!Number.isFinite(circCm) || circCm <= 0) return null;
    const usExact = usFromCm(circCm);
    const usSize = eighth(usExact);
    const band = ALPHA.find((a) => circCm >= a.minCm && circCm <= a.maxCm + 0.999) ?? null;
    return {
      circCm,
      circIn: circCm / INCH,
      usExact,
      usSize,
      ukSize: usSize - 0.125,
      eu: Math.round(circCm),
      band,
    };
  }, [circCm]);

  // How close the measurement sits to the edge of its alpha bucket. The buckets
  // are 2 cm wide, so the threshold has to be under half that -- at 1 cm every
  // value in a bucket is "near an edge" and the warning stops carrying
  // information. At 0.5 cm the middle centimetre reads as safe and only the
  // genuinely ambiguous edges are flagged.
  const alphaEdge = useMemo(() => {
    if (!result?.band) return null;
    const i = ALPHA.indexOf(result.band);
    const toLow = result.circCm - result.band.minCm;
    const toHigh = result.band.maxCm + 1 - result.circCm;
    if (toLow <= EDGE_CM && i > 0)
      return { other: ALPHA[i - 1].label, gap: fmt(toLow) };
    if (toHigh <= EDGE_CM && i < ALPHA.length - 1)
      return { other: ALPHA[i + 1].label, gap: fmt(toHigh) };
    return null;
  }, [result]);

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
              <ToggleGroupItem value="cm" className="flex-1">{t.fromCm}</ToggleGroupItem>
              <ToggleGroupItem value="in" className="flex-1">{t.fromIn}</ToggleGroupItem>
              <ToggleGroupItem value="us" className="flex-1">{t.fromUs}</ToggleGroupItem>
            </ToggleGroup>
          </Field>

          {from === "cm" && (
            <Field>
              <FieldLabel htmlFor="hat-cm">{t.fromCm}</FieldLabel>
              <InputGroup>
                <InputGroupInput id="hat-cm" type="number" inputMode="decimal" step="0.5"
                  value={cm} onChange={(e) => setCm(e.target.value)} />
                <InputGroupAddon align="inline-end">{t.cmUnit}</InputGroupAddon>
              </InputGroup>
              <FieldDescription>{t.cmHint}</FieldDescription>
            </Field>
          )}

          {from === "in" && (
            <Field>
              <FieldLabel htmlFor="hat-in">{t.fromIn}</FieldLabel>
              <InputGroup>
                <InputGroupInput id="hat-in" type="number" inputMode="decimal" step="0.25"
                  value={inch} onChange={(e) => setInch(e.target.value)} />
                <InputGroupAddon align="inline-end">{t.inUnit}</InputGroupAddon>
              </InputGroup>
              <FieldDescription>{t.inHint}</FieldDescription>
            </Field>
          )}

          {from === "us" && (
            <Field>
              <FieldLabel htmlFor="hat-us">{t.fromUs}</FieldLabel>
              <InputGroup>
                <InputGroupInput id="hat-us" type="number" inputMode="decimal" step="0.125"
                  value={us} onChange={(e) => setUs(e.target.value)} />
                <InputGroupAddon align="inline-end">US</InputGroupAddon>
              </InputGroup>
              <FieldDescription>{t.usHint}</FieldDescription>
            </Field>
          )}
        </FieldGroup>

        {result && (
          <div className="mt-8">
            <h3 className="text-base font-semibold">{t.resultTitle}</h3>
            <p className="text-muted-foreground mt-1 text-sm">{t.resultDesc}</p>
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>{t.colSystem}</TableHead>
                  <TableHead className="text-right tabular-nums">{t.colValue}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>{t.rowCm}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(result.circCm)} cm</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t.rowIn}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(result.circIn, 2)} in</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t.rowUs}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{asEighths(result.usSize)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t.rowUk}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{asEighths(result.ukSize)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t.rowEu}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{result.eu}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t.rowAlpha}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{result.band?.label ?? "—"}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="bg-muted/40 mt-6 rounded-lg p-4">
              <h4 className="text-sm font-semibold">{t.alphaTitle}</h4>
              <p className="text-muted-foreground mt-1 text-sm leading-6">{t.alphaDesc}</p>
              {result.band && (
                <p className="mt-3 text-sm leading-6">
                  {alphaEdge
                    ? t.alphaEdge(result.band.label, alphaEdge.other, alphaEdge.gap)
                    : t.alphaSafe(result.band.label)}
                </p>
              )}
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-semibold">{t.measureTitle}</h4>
              <ol className="text-muted-foreground mt-2 list-decimal space-y-1 pl-5 text-sm">
                {t.measureSteps.map((s) => (<li key={s}>{s}</li>))}
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
