import { useState, useCallback, useRef } from "react";
import { RotateCcw } from "lucide-react";
import AnimatedNumber from "../ui/AnimatedNumber";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "../ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
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
import { nearestFigures } from "../../data/height-reference-figures";
import {
  heightConverterAnalyticsPayload,
  type HeightConversionDirection,
  type HeightConverterEvent,
} from "../../lib/height-converter-analytics";

// ── Korean height distributions ──────────────────────────────────────────────
const KR_MALE_MEAN = 173.5;
const KR_MALE_SD = 5.7;
const KR_FEMALE_MEAN = 160.9;
const KR_FEMALE_SD = 5.2;
const DEFAULT_CM = "170";

// Approximate normalCDF via Horner / rational polynomial (accurate to ~1e-4)
function normalCDF(z: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + p * x);
  const y =
    1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

function getPercentile(height: number, mean: number, sd: number): number {
  const z = (height - mean) / sd;
  return normalCDF(z) * 100;
}

// ── i18n labels ───────────────────────────────────────────────────────────────
type L = Locale;

interface Labels {
  title: string;
  subtitle: string;
  reset: string;
  tabCompare: string;
  tabUnits: string;
  sec1: string;
  sec1Desc: string;
  sec2: string;
  sec3: string;
  sec4: string;
  cmLabel: string;
  ftLabel: string;
  inLabel: string;
  myHeight: string;
  myGender: string;
  male: string;
  female: string;
  equivalentIn: string;
  equivalentDesc: string;
  topPct: string;
  bottomPct: string;
  category: string;
  maleCm: string;
  femaleCm: string;
  veryShort: string;
  short: string;
  average: string;
  tall: string;
  veryTall: string;
  country: string;
  avgMale: string;
  avgFemale: string;
  sec5: string;
  sec5Note: string;
  resultReady: string;
  enterHeight: string;
}

const LABELS: Record<L, Labels> = {
  ko: {
    title: "키 변환 & 비교기",
    subtitle: "Height Converter & Comparison",
    reset: "초기화",
    tabCompare: "성별 비교",
    tabUnits: "단위 변환",
    sec1: "단위 변환 (cm ↔ ft + in)",
    sec1Desc: "한쪽에 입력하면 다른 쪽이 함께 바뀝니다.",
    sec2: "성별 키 비교",
    sec3: "키 참고표",
    sec4: "국가별 평균 신장",
    cmLabel: "cm",
    ftLabel: "ft",
    inLabel: "in",
    myHeight: "내 키 (cm)",
    myGender: "내 성별",
    male: "남성",
    female: "여성",
    equivalentIn: "상대 성별 기준 동등 키",
    equivalentDesc:
      "이 페이지의 한국 남녀 평균 차이 12.6cm를 가감한 참고값입니다",
    topPct: "상위",
    bottomPct: "하위",
    category: "범주",
    maleCm: "남성 (cm)",
    femaleCm: "여성 (cm)",
    veryShort: "매우 작음",
    short: "작음",
    average: "보통",
    tall: "큼",
    veryTall: "매우 큼",
    country: "국가",
    avgMale: "평균 남성 (cm)",
    avgFemale: "평균 여성 (cm)",
    sec5: "당신과 비슷한 키의 인물",
    sec5Note: "공개된 프로필 기준 신장이며 참고용입니다.",
    resultReady: "비교 결과",
    enterHeight: "키를 입력하면 동등 키와 백분위가 바로 나타납니다.",
  },
  en: {
    title: "Height Converter & Comparison",
    subtitle: "cm ↔ ft/in · Gender Height Comparison",
    reset: "Reset",
    tabCompare: "Gender compare",
    tabUnits: "Unit convert",
    sec1: "Unit Conversion (cm ↔ ft + in)",
    sec1Desc: "Type in either field and the other updates with it.",
    sec2: "Gender Height Comparison",
    sec3: "Height Reference Table",
    sec4: "Average Height by Country",
    cmLabel: "cm",
    ftLabel: "ft",
    inLabel: "in",
    myHeight: "My Height (cm)",
    myGender: "My Gender",
    male: "Male",
    female: "Female",
    equivalentIn: "Equivalent height in opposite gender",
    equivalentDesc:
      "Reference height after applying the 12.6 cm gap between the Korean averages used here",
    topPct: "Top",
    bottomPct: "Bottom",
    category: "Category",
    maleCm: "Male (cm)",
    femaleCm: "Female (cm)",
    veryShort: "Very Short",
    short: "Short",
    average: "Average",
    tall: "Tall",
    veryTall: "Very Tall",
    country: "Country",
    avgMale: "Avg. Male (cm)",
    avgFemale: "Avg. Female (cm)",
    sec5: "People close to your height",
    sec5Note: "Heights are approximate, based on public profiles.",
    resultReady: "Comparison result",
    enterHeight: "Enter a height to see the equivalent and percentile right away.",
  },
  ja: {
    title: "身長変換・比較ツール",
    subtitle: "cm ↔ フィート/インチ · 性別身長比較",
    reset: "リセット",
    tabCompare: "性別比較",
    tabUnits: "単位変換",
    sec1: "単位変換 (cm ↔ ft + in)",
    sec1Desc: "どちらかに入力すると、もう一方も一緒に変わります。",
    sec2: "性別身長比較",
    sec3: "身長参考表",
    sec4: "国別平均身長",
    cmLabel: "cm",
    ftLabel: "フィート",
    inLabel: "インチ",
    myHeight: "身長 (cm)",
    myGender: "性別",
    male: "男性",
    female: "女性",
    equivalentIn: "相手の性別での同等身長",
    equivalentDesc:
      "このページで使用する韓国男女平均の差12.6cmを加減した参考値です",
    topPct: "上位",
    bottomPct: "下位",
    category: "カテゴリ",
    maleCm: "男性 (cm)",
    femaleCm: "女性 (cm)",
    veryShort: "非常に低い",
    short: "低い",
    average: "普通",
    tall: "高い",
    veryTall: "非常に高い",
    country: "国",
    avgMale: "平均男性 (cm)",
    avgFemale: "平均女性 (cm)",
    sec5: "あなたと近い身長の人物",
    sec5Note: "公開プロフィール基準の身長で、参考値です。",
    resultReady: "比較結果",
    enterHeight: "身長を入力すると同等身長とパーセンタイルがすぐ表示されます。",
  },
  fr: {
    title: "Convertisseur & Comparateur de Taille",
    subtitle: "cm ↔ pieds/pouces · Comparaison par sexe",
    reset: "Réinitialiser",
    tabCompare: "Comparer",
    tabUnits: "Convertir",
    sec1: "Conversion d'unités (cm ↔ ft + in)",
    sec1Desc: "Saisissez dans l'un des champs, l'autre se met à jour.",
    sec2: "Comparaison de taille par sexe",
    sec3: "Tableau de référence",
    sec4: "Taille moyenne par pays",
    cmLabel: "cm",
    ftLabel: "pi",
    inLabel: "po",
    myHeight: "Ma taille (cm)",
    myGender: "Mon sexe",
    male: "Homme",
    female: "Femme",
    equivalentIn: "Taille équivalente pour le sexe opposé",
    equivalentDesc:
      "Repère obtenu avec l'écart de 12,6 cm entre les moyennes coréennes utilisées ici",
    topPct: "Top",
    bottomPct: "Bas",
    category: "Catégorie",
    maleCm: "Homme (cm)",
    femaleCm: "Femme (cm)",
    veryShort: "Très petit(e)",
    short: "Petit(e)",
    average: "Moyen(ne)",
    tall: "Grand(e)",
    veryTall: "Très grand(e)",
    country: "Pays",
    avgMale: "Moy. Homme (cm)",
    avgFemale: "Moy. Femme (cm)",
    sec5: "Des personnalités proches de votre taille",
    sec5Note: "Tailles approximatives, d'après des profils publics.",
    resultReady: "Résultat de comparaison",
    enterHeight: "Saisissez une taille pour voir l'équivalent et le percentile.",
  },
  es: {
    title: "Conversor y Comparador de Estatura",
    subtitle: "cm ↔ pies/pulgadas · Comparación por género",
    reset: "Restablecer",
    tabCompare: "Comparar",
    tabUnits: "Convertir",
    sec1: "Conversión de unidades (cm ↔ ft + in)",
    sec1Desc: "Escribe en cualquiera de los campos y el otro se actualiza.",
    sec2: "Comparación de estatura por género",
    sec3: "Tabla de referencia de estatura",
    sec4: "Estatura promedio por país",
    cmLabel: "cm",
    ftLabel: "ft",
    inLabel: "in",
    myHeight: "Mi estatura (cm)",
    myGender: "Mi género",
    male: "Hombre",
    female: "Mujer",
    equivalentIn: "Estatura equivalente en el género opuesto",
    equivalentDesc:
      "Referencia tras aplicar la diferencia de 12,6 cm entre los promedios coreanos usados aquí",
    topPct: "Top",
    bottomPct: "Inferior",
    category: "Categoría",
    maleCm: "Hombre (cm)",
    femaleCm: "Mujer (cm)",
    veryShort: "Muy bajo/a",
    short: "Bajo/a",
    average: "Promedio",
    tall: "Alto/a",
    veryTall: "Muy alto/a",
    country: "País",
    avgMale: "Prom. Hombre (cm)",
    avgFemale: "Prom. Mujer (cm)",
    sec5: "Personas con una estatura similar a la tuya",
    sec5Note: "Estaturas aproximadas, según perfiles públicos.",
    resultReady: "Resultado de comparación",
    enterHeight: "Introduce una estatura para ver el equivalente y el percentil.",
  },
  zh: {
    title: "身高换算与比较工具",
    subtitle: "厘米 ↔ 英尺/英寸 · 性别身高比较",
    reset: "重置",
    tabCompare: "性别比较",
    tabUnits: "单位换算",
    sec1: "单位换算（厘米 ↔ 英尺 + 英寸）",
    sec1Desc: "在任一栏输入，另一栏会同步更新。",
    sec2: "性别身高比较",
    sec3: "身高参考表",
    sec4: "各国平均身高",
    cmLabel: "厘米",
    ftLabel: "英尺",
    inLabel: "英寸",
    myHeight: "我的身高（厘米）",
    myGender: "我的性别",
    male: "男性",
    female: "女性",
    equivalentIn: "换算为异性别的等效身高",
    equivalentDesc: "按本页采用的韩国男女平均身高差12.6厘米加减得出的参考值",
    topPct: "前",
    bottomPct: "后",
    category: "类别",
    maleCm: "男性（厘米）",
    femaleCm: "女性（厘米）",
    veryShort: "非常矮",
    short: "较矮",
    average: "普通",
    tall: "较高",
    veryTall: "非常高",
    country: "国家",
    avgMale: "平均男性（厘米）",
    avgFemale: "平均女性（厘米）",
    sec5: "与你身高相近的人物",
    sec5Note: "身高数据来自公开资料，仅供参考。",
    resultReady: "比较结果",
    enterHeight: "输入身高后立即显示等效身高与百分位。",
  },
};

// ── Data ─────────────────────────────────────────────────────────────────────
interface CategoryRow {
  label: keyof Pick<
    Labels,
    "veryShort" | "short" | "average" | "tall" | "veryTall"
  >;
  male: string;
  female: string;
}

const HEIGHT_CATEGORIES: CategoryRow[] = [
  { label: "veryShort", male: "~163", female: "~150" },
  { label: "short", male: "163~168", female: "150~156" },
  { label: "average", male: "168~178", female: "156~166" },
  { label: "tall", male: "178~183", female: "166~171" },
  { label: "veryTall", male: "183~", female: "171~" },
];

interface CountryRow {
  name: Record<L, string>;
  male: number;
  female: number;
}

const COUNTRY_DATA: CountryRow[] = [
  {
    name: {
      ko: "한국",
      en: "South Korea",
      ja: "韓国",
      fr: "Corée du Sud",
      es: "Corea del Sur",
      zh: "韩国",
    },
    male: 173.5,
    female: 160.9,
  },
  {
    name: {
      ko: "미국",
      en: "USA",
      ja: "アメリカ",
      fr: "États-Unis",
      es: "EE.UU.",
      zh: "美国",
    },
    male: 175.4,
    female: 162.1,
  },
  {
    name: {
      ko: "일본",
      en: "Japan",
      ja: "日本",
      fr: "Japon",
      es: "Japón",
      zh: "日本",
    },
    male: 171.2,
    female: 158.0,
  },
  {
    name: {
      ko: "네덜란드",
      en: "Netherlands",
      ja: "オランダ",
      fr: "Pays-Bas",
      es: "Países Bajos",
      zh: "荷兰",
    },
    male: 182.5,
    female: 170.4,
  },
  {
    name: {
      ko: "중국",
      en: "China",
      ja: "中国",
      fr: "Chine",
      es: "China",
      zh: "中国",
    },
    male: 171.8,
    female: 159.7,
  },
];

// ── cm ↔ ft/in helpers ───────────────────────────────────────────────────────
function cmToFtIn(cm: number): { ft: number; inch: number } {
  const totalInches = cm / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inch = Math.round((totalInches % 12) * 10) / 10;
  return { ft, inch };
}

function ftInToCm(ft: number, inch: number): number {
  return Math.round((ft * 12 + inch) * 2.54 * 10) / 10;
}

type Panel = "compare" | "units";

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  locale: Locale;
}

export default function HeightConverter({ locale }: Props) {
  const t = LABELS[locale] ?? LABELS.en;
  const trackedInteractions = useRef(new Set<string>());

  const trackOnce = useCallback((event: HeightConverterEvent, direction?: HeightConversionDirection) => {
    const key = direction ? `${event}:${direction}` : event;
    if (trackedInteractions.current.has(key)) return;
    trackedInteractions.current.add(key);
    const analytics = window as Window & { gtag?: (...args: unknown[]) => void };
    analytics.gtag?.("event", event, heightConverterAnalyticsPayload({ locale, direction }));
  }, [locale]);

  // Single height source of truth — compare + unit tabs stay in sync for the
  // recalculation loop (change value → both surfaces update).
  const initialFtIn = cmToFtIn(parseFloat(DEFAULT_CM));
  const [cmVal, setCmVal] = useState(DEFAULT_CM);
  const [ftVal, setFtVal] = useState(String(initialFtIn.ft));
  const [inVal, setInVal] = useState(String(initialFtIn.inch));
  const [myGender, setMyGender] = useState<"male" | "female">("male");
  const [panel, setPanel] = useState<Panel>("compare");

  const handleCmChange = useCallback((val: string) => {
    setCmVal(val);
    const n = parseFloat(val);
    if (!isNaN(n) && n > 0) {
      const { ft, inch } = cmToFtIn(n);
      setFtVal(String(ft));
      setInVal(String(inch));
    } else if (val.trim() === "") {
      setFtVal("");
      setInVal("");
    }
  }, []);

  const handleFtInChange = useCallback((newFt: string, newIn: string) => {
    setFtVal(newFt);
    setInVal(newIn);
    if (newFt.trim() === "" && newIn.trim() === "") {
      setCmVal("");
      return;
    }
    const ft = parseFloat(newFt);
    const inch = parseFloat(newIn);
    if (!isNaN(ft) && !isNaN(inch)) {
      setCmVal(String(ftInToCm(ft, inch)));
    }
  }, []);

  const heightNum = parseFloat(cmVal);
  const validHeight = !isNaN(heightNum) && heightNum > 0;

  const DIFF = KR_MALE_MEAN - KR_FEMALE_MEAN; // 12.6

  const equivalentHeight = validHeight
    ? myGender === "male"
      ? heightNum - DIFF
      : heightNum + DIFF
    : null;

  const myMean = myGender === "male" ? KR_MALE_MEAN : KR_FEMALE_MEAN;
  const mySd = myGender === "male" ? KR_MALE_SD : KR_FEMALE_SD;
  const percentile = validHeight
    ? getPercentile(heightNum, myMean, mySd)
    : null;

  const isTop = percentile !== null ? percentile >= 50 : false;
  const pctDisplay =
    percentile !== null
      ? isTop
        ? `${t.topPct} ${(100 - percentile).toFixed(1)}%`
        : `${t.bottomPct} ${percentile.toFixed(1)}%`
      : "—";
  const percentileDistance =
    percentile !== null ? (isTop ? 100 - percentile : percentile) : null;

  const similarFigures = validHeight ? nearestFigures(heightNum, 3) : [];

  const reset = useCallback(() => {
    trackOnce("height_tool_reset");
    setCmVal("");
    setFtVal("");
    setInVal("");
    setMyGender("male");
    setPanel("compare");
  }, [trackOnce]);

  // 결과 수치는 세 곳에서 같은 모양이어야 한다. 크기·색을 각자 정하면 "값이 세 종류로
  // 보이는" 화면이 된다 — 강조는 자리와 여백이 하고, 글꼴은 한 단계만 올린다.
  const readout = "text-3xl font-semibold tabular-nums";

  const comparisonResult = (
    <div
      className="grid min-w-0 gap-4 rounded-lg border bg-muted/50 p-4 sm:grid-cols-2"
      aria-live="polite"
    >
      <div className="min-w-0 space-y-1">
        <p className="text-sm text-muted-foreground">{t.equivalentIn}</p>
        <p className={`${readout} break-words`}>
          {equivalentHeight !== null ? (
            <AnimatedNumber
              value={equivalentHeight}
              locales={locale}
              format={{
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              }}
              suffix={` ${t.cmLabel}`}
            />
          ) : (
            "—"
          )}
        </p>
      </div>
      <div className="min-w-0 space-y-1 sm:border-l sm:pl-4">
        <p className="text-sm text-muted-foreground">
          {myGender === "male" ? t.male : t.female} · KR
        </p>
        <p className={`${readout} break-words`}>
          {percentileDistance !== null ? (
            <>
              {isTop ? t.topPct : t.bottomPct}{" "}
              <AnimatedNumber
                value={percentileDistance}
                locales={locale}
                format={{
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                }}
                suffix="%"
              />
            </>
          ) : (
            pctDisplay
          )}
        </p>
      </div>
    </div>
  );

  return (
    // not-prose: MDX 본문 안에 들어가므로 typography 플러그인 스타일을 차단해야 한다.
    <div className="not-prose my-6 flex w-full min-w-0 max-w-2xl flex-col gap-5 mx-auto overflow-x-hidden">
      {/* shadcn 기본 컨트롤 높이는 데스크톱 기준 32px 이라 모바일 탭 타깃(44px)에
          못 미친다. 이전 파일럿들이 390px 44px 을 기준으로 삼았으므로 **모바일에서만**
          올리고, sm: 이상에서는 기본값으로 되돌린다 — 기본값을 통째로 덮지 않는다. */}

      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h3 className="text-xl font-semibold tracking-tight">{t.title}</h3>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={reset} className="h-11 shrink-0 sm:h-8">
          <RotateCcw />
          {t.reset}
        </Button>
      </div>

      {/* Primary job first: gender compare is the default tab so equivalent
          height + percentile land above the fold / within one tap. */}
      <ToggleGroup
        type="single"
        variant="outline"
        value={panel}
        onValueChange={(v) => {
          if (!v) return;
          setPanel(v as Panel);
        }}
        className="grid w-full min-w-0 grid-cols-2"
        aria-label={`${t.tabCompare} / ${t.tabUnits}`}
      >
        <ToggleGroupItem value="compare" className="h-11 flex-1 sm:h-9">
          {t.tabCompare}
        </ToggleGroupItem>
        <ToggleGroupItem value="units" className="h-11 flex-1 sm:h-9">
          {t.tabUnits}
        </ToggleGroupItem>
      </ToggleGroup>

      {panel === "compare" && (
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle id="height-comparison-title">{t.sec2}</CardTitle>
            <CardDescription>{t.equivalentDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              {/* Result first — ATF answer after valid input. */}
              <div className="space-y-2">
                <p className="text-sm font-medium">{t.resultReady}</p>
                {validHeight ? comparisonResult : (
                  <p className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                    {t.enterHeight}
                  </p>
                )}
              </div>

              <div className="grid min-w-0 gap-6 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="height-comparison">
                    {t.myHeight}
                  </FieldLabel>
                  <InputGroup className="h-11 sm:h-8">
                    <InputGroupInput
                      id="height-comparison"
                      type="number"
                      inputMode="decimal"
                      value={cmVal}
                      onChange={(e) => handleCmChange(e.target.value)}
                      onBlur={() => validHeight && trackOnce("height_comparison_view")}
                      placeholder="170"
                    />
                    <InputGroupAddon align="inline-end">
                      {t.cmLabel}
                    </InputGroupAddon>
                  </InputGroup>
                </Field>

                <Field>
                  <FieldLabel htmlFor="height-gender">{t.myGender}</FieldLabel>
                  <ToggleGroup
                    id="height-gender"
                    type="single"
                    variant="outline"
                    value={myGender}
                    onValueChange={(v) => {
                      if (!v) return;
                      setMyGender(v as "male" | "female");
                      trackOnce("height_comparison_view");
                    }}
                    className="w-full"
                  >
                    <ToggleGroupItem value="male" className="h-11 flex-1 sm:h-8">
                      {t.male}
                    </ToggleGroupItem>
                    <ToggleGroupItem value="female" className="h-11 flex-1 sm:h-8">
                      {t.female}
                    </ToggleGroupItem>
                  </ToggleGroup>
                </Field>
              </div>

              <FieldDescription>{t.equivalentDesc}</FieldDescription>
            </FieldGroup>
          </CardContent>
        </Card>
      )}

      {panel === "units" && (
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle id="height-conversion-title">{t.sec1}</CardTitle>
            <CardDescription>{t.sec1Desc}</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid min-w-0 gap-6 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="height-centimeters">
                    {t.cmLabel}
                  </FieldLabel>
                  <InputGroup className="h-11 sm:h-8">
                    <InputGroupInput
                      id="height-centimeters"
                      type="number"
                      inputMode="decimal"
                      value={cmVal}
                      onChange={(e) => handleCmChange(e.target.value)}
                      onBlur={() => parseFloat(cmVal) > 0 && trackOnce("height_conversion_complete", "cm_to_ft_in")}
                      placeholder="170"
                    />
                    <InputGroupAddon align="inline-end">
                      {t.cmLabel}
                    </InputGroupAddon>
                  </InputGroup>
                </Field>

                <Field>
                  <FieldLabel htmlFor="height-feet">
                    {t.ftLabel} + {t.inLabel}
                  </FieldLabel>
                  <div className="flex min-w-0 gap-2">
                    <InputGroup className="h-11 min-w-0 sm:h-8">
                      <InputGroupInput
                        id="height-feet"
                        type="number"
                        inputMode="decimal"
                        value={ftVal}
                        onChange={(e) => handleFtInChange(e.target.value, inVal)}
                        onBlur={() => parseFloat(ftVal) >= 0 && parseFloat(inVal) >= 0 && trackOnce("height_conversion_complete", "ft_in_to_cm")}
                        aria-label={t.ftLabel}
                        placeholder="5"
                      />
                      <InputGroupAddon align="inline-end">
                        {t.ftLabel}
                      </InputGroupAddon>
                    </InputGroup>
                    <InputGroup className="h-11 min-w-0 sm:h-8">
                      <InputGroupInput
                        id="height-inches"
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        value={inVal}
                        onChange={(e) => handleFtInChange(ftVal, e.target.value)}
                        onBlur={() => parseFloat(ftVal) >= 0 && parseFloat(inVal) >= 0 && trackOnce("height_conversion_complete", "ft_in_to_cm")}
                        aria-label={t.inLabel}
                        placeholder="7"
                      />
                      <InputGroupAddon align="inline-end">
                        {t.inLabel}
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                </Field>
              </div>

              <div className="grid min-w-0 gap-4 rounded-lg border bg-muted/50 p-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm text-muted-foreground">{t.cmLabel}</p>
                  <p className={readout}>
                    {parseFloat(cmVal) > 0 ? (
                      <AnimatedNumber
                        value={parseFloat(cmVal)}
                        locales={locale}
                        format={{
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        }}
                      />
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
                <div className="min-w-0 space-y-1 sm:border-l sm:pl-4">
                  <p className="text-sm text-muted-foreground">
                    {t.ftLabel} / {t.inLabel}
                  </p>
                  <p className={readout}>
                    {validHeight ? (
                      <>
                        <AnimatedNumber value={parseFloat(ftVal) || 0} locales={locale} />
                        ′{" "}
                        <AnimatedNumber
                          value={parseFloat(inVal) || 0}
                          locales={locale}
                          format={{ maximumFractionDigits: 1 }}
                        />
                        ″
                      </>
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>
      )}

      {/* ── Similar-height public figures ─────────────────────── */}
      {similarFigures.length > 0 && (
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>{t.sec5}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid min-w-0 gap-3 sm:grid-cols-3">
              {similarFigures.map((f) => (
                <div key={f.name} className="min-w-0 rounded-lg border bg-muted/50 p-3 text-center">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className={readout}>~{f.heightCm}{t.cmLabel}</p>
                  <p className="text-xs text-muted-foreground">{f.field}</p>
                </div>
              ))}
            </div>
            <FieldDescription>{t.sec5Note}</FieldDescription>
          </CardContent>
        </Card>
      )}

      {/* ── Reference Table — overflow contained so the page never scrolls sideways */}
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>{t.sec3}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.category}</TableHead>
                <TableHead className="text-right">{t.maleCm}</TableHead>
                <TableHead className="text-right">{t.femaleCm}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {HEIGHT_CATEGORIES.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="font-medium">{t[row.label]}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.male}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.female}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Country Average ────────────────────────────────────── */}
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>{t.sec4}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.country}</TableHead>
                <TableHead className="text-right">{t.avgMale}</TableHead>
                <TableHead className="text-right">{t.avgFemale}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COUNTRY_DATA.map((row) => (
                <TableRow key={row.name.en}>
                  <TableCell className="font-medium">
                    {row.name[locale] ?? row.name.en}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.male}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.female}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
