/**
 * Curated priority series for the wikidocs-style landing sidebar/sections.
 *
 * Selection basis: frontmatter `series:` chapter counts across all published
 * locales in data/catalog/content-inventory.master.csv (chapter count is the
 * best static proxy we have for traffic/importance until a GSC-derived
 * ranking lands — see AGENT_WORKLOG 2026-08 batch notes).
 *
 * Counts at selection time (published chapters, all locales):
 *   myth-dictionary 606 · economics-basics 84 · business-basics 61 ·
 *   psychology-basics 56 · accounting-basics 42 · english-grammar 45 ·
 *   public-administration-basics 45 · nursing-basics 39
 */
export const PRIORITY_SERIES = [
  "myth-dictionary",
  "economics-basics",
  "business-basics",
  "psychology-basics",
  "accounting-basics",
  "english-grammar",
  "public-administration-basics",
  "nursing-basics",
] as const;

export type PrioritySeriesKey = (typeof PRIORITY_SERIES)[number];

/** Manually tuned display names per locale (user chose manual over auto-layout reuse). */
export const PRIORITY_SERIES_NAMES: Record<PrioritySeriesKey, Record<string, string>> = {
  "myth-dictionary": {
    ko: "신화 사전", en: "Myth Dictionary", ja: "神話事典",
    zh: "神话词典", fr: "Dictionnaire des mythes", es: "Diccionario de mitos",
  },
  "economics-basics": {
    ko: "경제학 기초", en: "Economics Basics", ja: "経済学基礎",
    zh: "经济学基础", fr: "Économie : les bases", es: "Fundamentos de economía",
  },
  "business-basics": {
    ko: "경영학 기초", en: "Business Basics", ja: "経営学基礎",
    zh: "管理学基础", fr: "Gestion : les bases", es: "Fundamentos de gestión",
  },
  "psychology-basics": {
    ko: "심리학 기초", en: "Psychology Basics", ja: "心理学基礎",
    zh: "心理学基础", fr: "Psychologie : les bases", es: "Fundamentos de psicología",
  },
  "accounting-basics": {
    ko: "회계학 기초", en: "Accounting Basics", ja: "会計学基礎",
    zh: "会计学基础", fr: "Comptabilité : les bases", es: "Fundamentos de contabilidad",
  },
  "english-grammar": {
    ko: "영어 문법", en: "English Grammar", ja: "英語文法",
    zh: "英语语法", fr: "Grammaire anglaise", es: "Gramática inglesa",
  },
  "public-administration-basics": {
    ko: "행정학 기초", en: "Public Administration Basics", ja: "行政学基礎",
    zh: "行政学基础", fr: "Administration publique", es: "Administración pública",
  },
  "nursing-basics": {
    ko: "간호학 기초", en: "Nursing Basics", ja: "看護学基礎",
    zh: "护理学基础", fr: "Soins infirmiers", es: "Fundamentos de enfermería",
  },
};

export function prioritySeriesName(key: string, locale: string): string | undefined {
  const entry = (PRIORITY_SERIES_NAMES as Record<string, Record<string, string>>)[key];
  return entry?.[locale];
}

/** Fallback: prettify a series slug ("economics-basics" → "Economics basics"). */
export function prettifySlug(slug: string): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
}
