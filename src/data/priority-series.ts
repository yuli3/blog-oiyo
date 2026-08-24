/**
 * Curated priority series for the wikidocs-style landing sidebar/sections.
 *
 * Selection basis: GSC (Google Search Console) impressions over the trailing
 * 90 days for blog.oiyo.net, aggregated per series across all chapters
 * and locales (clicks as tiebreak). Impressions, not clicks, because at
 * blog's current traffic (~125 clicks / 2,870 impressions per 90d across
 * 673 pages) per-series clicks are almost all 0-1 ties with no real signal;
 * impressions are ~23x denser and actually differentiate. Only series whose
 * key is already a clean URL-safe slug are eligible (matches the
 * /series/{key}/ route's own filter — see isUrlSafeSeriesKey() in
 * src/lib/wiki-index.ts). Generated 2026-08-25 by
 * scripts/generate-priority-series.py (re-run: npm run priority-series:sync).
 * Supersedes the earlier static chapter-count proxy.
 */
export const PRIORITY_SERIES = [
  "zoology-basics",
  "economics-basics",
  "music-history",
  "academy-economics-core",
  "business-basics",
  "myth-dictionary",
  "public-administration-basics",
  "calculus",
] as const;

export type PrioritySeriesKey = (typeof PRIORITY_SERIES)[number];

/** Manually tuned display names per locale (user chose manual over auto-layout reuse). */
// Partial, not Record<PrioritySeriesKey, ...>: PRIORITY_SERIES is now
// GSC-ranked and changes over time, so it can include a key with no manual
// translation yet — prioritySeriesName() below falls back to prettifySlug().
export const PRIORITY_SERIES_NAMES: Partial<Record<string, Record<string, string>>> = {
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
