import { useState } from "react";
import { type AgeCountry, exactAge, japanSchoolStartYear, MILESTONES, reachDate } from "../../lib/age-milestones-countries";

// One age calculator per country's own law. The Korean rules live in KoreanAgeCalculator (ko/en).
interface Props {
  country: AgeCountry;
}

const ZODIAC_JA = ["申", "酉", "戌", "亥", "子", "丑", "寅", "卯", "辰", "巳", "午", "未"];
const ZODIAC_ZH = ["猴", "鸡", "狗", "猪", "鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊"];

const TEXT: Record<AgeCountry, {
  dateLocale: string;
  birth: string;
  base: string;
  age: (n: number) => string;
  ageNote: string;
  zodiac?: { label: string; value: (year: number) => string; note: string };
  milestonesTitle: string;
  labels: Record<string, string>;
  notes: Record<string, string>;
  reached: string;
  left: (years: number) => string;
  on: (date: string) => string;
}> = {
  jp: {
    dateLocale: "ja-JP",
    birth: "生年月日",
    base: "基準日",
    age: (n) => `満${n}歳`,
    ageNote: "年齢計算ニ関スル法律により、誕生日の前日の終わりに1歳加算されます",
    zodiac: { label: "干支（生まれ年）", value: (y) => `${ZODIAC_JA[y % 12]}年`, note: "暦年で数える一般的な数え方です" },
    milestonesTitle: "日本の法律で決まる年齢",
    labels: {
      school: "小学校入学",
      adult: "成年（民法）",
      vote: "選挙権",
      license: "普通自動車免許",
      alcohol: "飲酒・喫煙",
      pension: "老齢基礎年金の受給開始（原則）",
    },
    notes: {
      school: "1月1日〜4月1日生まれは「早生まれ」で1学年早く入学",
      adult: "2022年4月から20歳→18歳",
      alcohol: "成年年齢引下げ後も20歳のまま",
      pension: "60〜75歳の間で繰上げ・繰下げ可",
    },
    reached: "到達済み",
    left: (y) => `あと${y}年`,
    on: (s) => `${s}に到達`,
  },
  cn: {
    dateLocale: "zh-CN",
    birth: "出生日期",
    base: "计算日期",
    age: (n) => `${n}周岁`,
    ageNote: "法律上的年龄按周岁计算，过了生日当天才算满一岁",
    zodiac: { label: "生肖（按公历年份）", value: (y) => `属${ZODIAC_ZH[y % 12]}`, note: "生肖以农历春节为界，春节前出生的属上一年的生肖" },
    milestonesTitle: "中国法律规定的年龄",
    labels: {
      school: "小学入学",
      idCard: "申领居民身份证",
      adult: "成年（民法典）",
      vote: "选举权和被选举权",
      license: "小型汽车驾驶证",
      pension: "男职工法定退休年龄（逐步延迟至63岁）",
    },
    notes: {
      school: "一般为当年8月31日前满6周岁，各地规定略有不同",
      idCard: "16周岁以上应当申领，未满16周岁可以申领",
      pension: "2025年起逐步延迟：男职工60→63岁，女职工50/55→55/58岁，按出生年月确定",
    },
    reached: "已达到",
    left: (y) => `还差${y}年`,
    on: (s) => `${s}达到`,
  },
  fr: {
    dateLocale: "fr-FR",
    birth: "Date de naissance",
    base: "Date de référence",
    age: (n) => `${n} ans`,
    ageNote: "L'âge légal augmente le jour de l'anniversaire",
    milestonesTitle: "Les âges fixés par la loi en France",
    labels: {
      accompanied: "Conduite accompagnée (AAC)",
      license: "Permis B",
      adult: "Majorité",
      vote: "Droit de vote",
      alcohol: "Achat d'alcool et de tabac",
      pension: "Âge légal de départ à la retraite",
    },
    notes: {
      license: "17 ans depuis le 1er janvier 2024",
      pension: "64 ans pour les générations nées à partir de 1969 ; entre 62 ans 9 mois et 63 ans 9 mois pour 1964–1968 (suspension de la réforme par la LFSS 2026)",
    },
    reached: "Atteint",
    left: (y) => `encore ${y} an${y > 1 ? "s" : ""}`,
    on: (s) => `le ${s}`,
  },
  es: {
    dateLocale: "es-ES",
    birth: "Fecha de nacimiento",
    base: "Fecha de referencia",
    age: (n) => `${n} años`,
    ageNote: "La edad legal se cumple el día del cumpleaños",
    milestonesTitle: "Edades fijadas por la ley en España",
    labels: {
      idCard: "DNI obligatorio",
      adult: "Mayoría de edad",
      vote: "Derecho de voto",
      license: "Permiso de conducir B",
      alcohol: "Compra de alcohol y tabaco",
      pension: "Jubilación ordinaria",
    },
    notes: {
      pension: "67 años desde 2027; 65 si se han cotizado al menos 38 años y 6 meses",
    },
    reached: "Cumplido",
    left: (y) => `faltan ${y} año${y > 1 ? "s" : ""}`,
    on: (s) => `el ${s}`,
  },
};

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function AgeCountryCalculator({ country }: Props) {
  const t = TEXT[country];
  const [birthStr, setBirthStr] = useState("2008-05-15");
  const [baseStr, setBaseStr] = useState(iso(new Date()));
  const birth = new Date(`${birthStr}T00:00:00`);
  const base = new Date(`${baseStr}T00:00:00`);
  const valid = !Number.isNaN(birth.getTime()) && !Number.isNaN(base.getTime()) && birth <= base;
  const fmtDate = (d: Date) => new Intl.DateTimeFormat(t.dateLocale, { dateStyle: "long" }).format(d);
  const age = valid ? exactAge(birth, base, country) : 0;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-muted-foreground">{t.birth}</span>
            <input type="date" value={birthStr} onChange={(e) => setBirthStr(e.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3 text-base text-foreground" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-muted-foreground">{t.base}</span>
            <input type="date" value={baseStr} onChange={(e) => setBaseStr(e.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3 text-base text-foreground" />
          </label>
        </div>
        {valid && (
          <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-background px-4 py-3">
              <p className="font-mono text-3xl font-bold text-foreground">{t.age(age)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.ageNote}</p>
            </div>
            {t.zodiac && (
              <div className="rounded-md border border-border bg-background px-4 py-3">
                <p className="text-sm text-muted-foreground">{t.zodiac.label}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{t.zodiac.value(birth.getFullYear())}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.zodiac.note}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {valid && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-bold text-foreground">{t.milestonesTitle}</h3>
          <ul className="mt-3 divide-y divide-border/60">
            {MILESTONES[country].map((m) => {
              const reached = reachDate(birth, m.age, country);
              const when = country === "jp" && m.id === "school" ? new Date(japanSchoolStartYear(birth), 3, 1) : reached;
              const done = base >= when;
              return (
                <li key={m.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div>
                    <span className="font-semibold text-foreground">{t.labels[m.id]} ({t.age(m.age)})</span>
                    <span className="block text-xs text-muted-foreground">{t.on(fmtDate(when))}</span>
                    {t.notes[m.id] && <span className="block text-xs text-muted-foreground">{t.notes[m.id]}</span>}
                  </div>
                  <span className={"shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold " + (done ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                    {done ? t.reached : t.left(Math.max(1, m.age - age))}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
