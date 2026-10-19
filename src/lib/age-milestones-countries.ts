// Legal age milestones for the non-Korean pages of the age calculator. Each locale page uses its
// own country's law (세운 2026-10-19). Checked 2026-10-19:
// - Japan: 年齢計算ニ関スル法律 — you turn a year older at the end of the day before your birthday,
//   which is why 4/1 births join the earlier school year. 成年 18 (2022), 選挙権 18, 普通免許 18,
//   飲酒・喫煙 20, 老齢基礎年金 65 (60–75 by 繰上げ・繰下げ).
// - China: 居民身份证法 第9条 apply at 16, 民法典 成年 18, 选举权 18, 小型汽车驾照 18, 未成年人保护法
//   bans selling tobacco and alcohol to minors; 法定退休年龄 rises gradually from 2025 (men 60→63).
// - France: majorité 18, vote 18, permis B 17 (since 2024-01-01), alcool·tabac 18; âge légal de
//   la retraite 64 for people born from 1969 (2023 reform, partly suspended for 1964–1968 by the
//   LFSS 2026, so those generations fall between 62 ans 9 mois and 63 ans 9 mois).
// - Spain: DNI obligatorio 14, mayoría 18, voto 18, permiso B 18, alcohol·tabaco 18; jubilación
//   ordinaria 67 from 2027 (65 with 38 años y 6 meses cotizados).

export type AgeCountry = "jp" | "cn" | "fr" | "es";

export interface Milestone {
  id: string;
  age: number;
}

export const MILESTONES: Record<AgeCountry, Milestone[]> = {
  jp: [
    { id: "school", age: 6 },
    { id: "adult", age: 18 },
    { id: "vote", age: 18 },
    { id: "license", age: 18 },
    { id: "alcohol", age: 20 },
    { id: "pension", age: 65 },
  ],
  cn: [
    { id: "school", age: 6 },
    { id: "idCard", age: 16 },
    { id: "adult", age: 18 },
    { id: "vote", age: 18 },
    { id: "license", age: 18 },
    { id: "pension", age: 63 },
  ],
  fr: [
    { id: "accompanied", age: 15 },
    { id: "license", age: 17 },
    { id: "adult", age: 18 },
    { id: "vote", age: 18 },
    { id: "alcohol", age: 18 },
    { id: "pension", age: 64 },
  ],
  es: [
    { id: "idCard", age: 14 },
    { id: "adult", age: 18 },
    { id: "vote", age: 18 },
    { id: "license", age: 18 },
    { id: "alcohol", age: 18 },
    { id: "pension", age: 67 },
  ],
};

/** Completed years. Japan counts the year as finished on the day before the birthday. */
export function exactAge(birth: Date, on: Date, country: AgeCountry): number {
  const ref = new Date(on.getFullYear(), on.getMonth(), on.getDate() + (country === "jp" ? 1 : 0));
  let age = ref.getFullYear() - birth.getFullYear();
  if (ref.getMonth() < birth.getMonth() || (ref.getMonth() === birth.getMonth() && ref.getDate() < birth.getDate())) {
    age -= 1;
  }
  return Math.max(0, age);
}

/** Date a milestone age is reached (Japan: the day before the birthday). */
export function reachDate(birth: Date, age: number, country: AgeCountry): Date {
  return new Date(birth.getFullYear() + age, birth.getMonth(), birth.getDate() - (country === "jp" ? 1 : 0));
}

/**
 * Japan: school starts on the first April 1 after the day following the 6th-year end, i.e. the
 * 6th birthday. Births from 1/1 to 4/1 start in the year they turn 6, 4/2 onward the next year.
 */
export function japanSchoolStartYear(birth: Date): number {
  const m = birth.getMonth();
  const early = m < 3 || (m === 3 && birth.getDate() === 1);
  return birth.getFullYear() + (early ? 6 : 7);
}
