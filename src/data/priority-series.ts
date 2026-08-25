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
// translation yet — prioritySeriesName() below falls back to deriveSeriesLabel().
export const PRIORITY_SERIES_NAMES: Partial<Record<string, Record<string, string>>> = {
  "myth-dictionary": {
    ko: "신화 사전", en: "Myth Dictionary", ja: "神話事典",
    zh: "神话词典", fr: "Dictionnaire des mythes", es: "Diccionario de mitos",
  },
  "economics-basics": {
    ko: "경제학", en: "Economics", ja: "経済学",
    zh: "经济学", fr: "Économie", es: "Economía",
  },
  "business-basics": {
    ko: "경영학", en: "Business", ja: "経営学",
    zh: "管理学", fr: "Gestion", es: "Gestión",
  },
  "psychology-basics": {
    ko: "심리학", en: "Psychology", ja: "心理学",
    zh: "心理学", fr: "Psychologie", es: "Psicología",
  },
  "accounting-basics": {
    ko: "회계학", en: "Accounting", ja: "会計学",
    zh: "会计学", fr: "Comptabilité", es: "Contabilidad",
  },
  "english-grammar": {
    ko: "영어 문법", en: "English Grammar", ja: "英語文法",
    zh: "英语语法", fr: "Grammaire anglaise", es: "Gramática inglesa",
  },
  "public-administration-basics": {
    ko: "행정학", en: "Public Administration", ja: "行政学",
    zh: "行政学", fr: "Administration publique", es: "Administración pública",
  },
  "nursing-basics": {
    ko: "간호학", en: "Nursing", ja: "看護学",
    zh: "护理学", fr: "Soins infirmiers", es: "Enfermería",
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

/**
 * Fallback for series without a PRIORITY_SERIES_NAMES entry: prettifySlug()
 * always renders the raw English slug regardless of locale ("8 cognitive
 * functions deep dive" on a ko page). Titles already follow the
 * "{series name} — {chapter subtitle}" convention (established 2026-08-25)
 * and are written per-locale, so splitting on the dash recovers a real,
 * correctly-localized series name for free — no translation work needed.
 * Falls through to the raw title (single-article "series of 1") or the
 * slug only when neither is available.
 */
export function deriveSeriesLabel(title: string | undefined, slug: string): string {
  if (title) {
    const dashIdx = title.indexOf(" — ");
    return dashIdx === -1 ? title : title.slice(0, dashIdx).trim();
  }
  return prettifySlug(slug);
}
