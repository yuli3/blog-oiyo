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
  "management-principles",
  "economics-introduction",
  "accounting-basics",
  "qualification-roadmaps",
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
  "economics-introduction": {
    ko: "경제학개론", en: "Introduction to Economics", ja: "経済学概論",
    zh: "经济学概论", fr: "Introduction à l’économie", es: "Introducción a la economía",
  },
  "management-principles": {
    ko: "경영학원론", en: "Principles of Management", ja: "経営学原論",
    zh: "管理学原理", fr: "Principes de gestion", es: "Principios de administración",
  },
  "organizational-behavior": {
    ko: "조직행동론", en: "Organizational Behavior", ja: "組織行動論",
    zh: "组织行为学", fr: "Comportement organisationnel", es: "Comportamiento organizacional",
  },
  "human-resource-management": {
    ko: "인적자원관리", en: "Human Resource Management", ja: "人的資源管理",
    zh: "人力资源管理", fr: "Gestion des ressources humaines", es: "Gestión de recursos humanos",
  },
  "marketing-management": {
    ko: "마케팅관리", en: "Marketing Management", ja: "マーケティング管理",
    zh: "营销管理", fr: "Gestion du marketing", es: "Gestión de marketing",
  },
  "operations-management": {
    ko: "생산운영관리", en: "Operations Management", ja: "生産管理",
    zh: "运营管理", fr: "Gestion des opérations", es: "Dirección de operaciones",
  },
  "financial-management": {
    ko: "재무관리", en: "Financial Management", ja: "財務管理",
    zh: "财务管理", fr: "Gestion financière", es: "Gestión financiera",
  },
  "psychology-basics": {
    ko: "심리학", en: "Psychology", ja: "心理学",
    zh: "心理学", fr: "Psychologie", es: "Psicología",
  },
  "accounting-basics": {
    ko: "회계학", en: "Accounting", ja: "会計学",
    zh: "会计学", fr: "Comptabilité", es: "Contabilidad",
  },
  "qualification-roadmaps": {
    ko: "시험", en: "Exams", ja: "試験",
    zh: "考试", fr: "Examens", es: "Exámenes",
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

/**
 * Locked display-name order for series surfaces (B3, 2026-09-11):
 * 1. prioritySeriesName map hit
 * 2. non-URL-safe key → use key itself (FM series is already a human label)
 * 3. else deriveSeriesLabel(firstPost.title, key)
 *
 * Does NOT rename chapter titles.
 */
/** Must stay in sync with isUrlSafeSeriesKey() in src/lib/wiki-index.ts. */
function isUrlSafeSeriesKeyLocal(key: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(key);
}

export function seriesDisplayName(
  key: string,
  locale: string,
  firstPostTitle?: string,
): string {
  const mapped = prioritySeriesName(key, locale);
  if (mapped) return mapped;
  if (!isUrlSafeSeriesKeyLocal(key)) return key;
  return deriveSeriesLabel(firstPostTitle, key);
}
