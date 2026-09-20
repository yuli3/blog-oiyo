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
  "accounting-principles",
  "qualification-roadmaps",
] as const;

/**
 * Landing centre axis — **학문(카테고리)** 기준이다. 시리즈(과목)가 아니다.
 *
 * 2026-09-20 세운 확정: 랜딩 가운데는 경영학·경제학·회계학·세법학·시험 다섯
 * 학문을 고정 축으로 둔다. 그전까지는 PRIORITY_SERIES(과목 시리즈 4개)를 그려서
 * 「경영학원론·경제학개론·회계원리·시험」처럼 **과목명**이 노출됐고, 학문명 목차
 * 원칙(company-brain/projects/oiyo-ecosystem/blog-wiki-academic-curriculum-audit-plan-2026-09-14.md)과
 * 어긋났다. 값은 src/locales/*.json 의 category.names 키와 같아야 한다.
 *
 * PRIORITY_SERIES 는 남긴다 — "다음 한 페이지" CTA(firstChapterSlugs)가 과목
 * 단위 진입점을 쓰기 때문이다.
 */
export const PRIORITY_CATEGORIES = [
  "Business",
  "Economics",
  "Accounting",
  "Tax",
  "Exam",
] as const;

export type PriorityCategoryKey = (typeof PRIORITY_CATEGORIES)[number];

export type PrioritySeriesKey = (typeof PRIORITY_SERIES)[number];

/** Manually tuned display names per locale (user chose manual over auto-layout reuse). */
// Partial, not Record<PrioritySeriesKey, ...>: PRIORITY_SERIES is now
// GSC-ranked and changes over time, so it can include a key with no manual
// translation yet — prioritySeriesName() below falls back to deriveSeriesLabel().
export const PRIORITY_SERIES_NAMES: Partial<Record<string, Record<string, string>>> = {
  // 시험 시리즈 키는 "공인노무사-시험"처럼 하이픈이 섞인 한글이라 화면에 날것으로
  // 나왔다(2026-09-19 A1 감사). 표시 이름만 6개 로케일로 정리한다 — 키와 URL은 그대로다.
  "행정사-시험": {
    ko: "행정사 시험", en: "Certified Administrative Agent Exam", ja: "行政士試験",
    zh: "行政士考试", fr: "Examen d’agent administratif", es: "Examen de gestor administrativo",
  },
  "공인노무사-시험": {
    ko: "공인노무사 시험", en: "Certified Labor Attorney Exam", ja: "公認労務士試験",
    zh: "公认劳务士考试", fr: "Examen de conseiller du travail", es: "Examen de asesor laboral",
  },
  "변리사-시험": {
    ko: "변리사 시험", en: "Patent Attorney Exam", ja: "弁理士試験",
    zh: "专利代理人考试", fr: "Examen de conseil en brevets", es: "Examen de agente de patentes",
  },
  "법무사-시험": {
    ko: "법무사 시험", en: "Judicial Scrivener Exam", ja: "司法書士試験",
    zh: "司法书士考试", fr: "Examen de clerc juridique", es: "Examen de gestor judicial",
  },
  "세무사-시험": {
    ko: "세무사 시험", en: "Certified Tax Accountant Exam", ja: "税理士試験",
    zh: "税务士考试", fr: "Examen de conseiller fiscal", es: "Examen de asesor fiscal",
  },
  "공인회계사-시험": {
    ko: "공인회계사 시험", en: "CPA Exam", ja: "公認会計士試験",
    zh: "注册会计师考试", fr: "Examen d’expert-comptable", es: "Examen de contador público",
  },
  "경영지도사-시험": {
    ko: "경영지도사 시험", en: "Management Consultant Exam", ja: "経営指導士試験",
    zh: "经营指导士考试", fr: "Examen de consultant en gestion", es: "Examen de consultor de gestión",
  },
  "감정평가사-시험": {
    ko: "감정평가사 시험", en: "Certified Appraiser Exam", ja: "不動産鑑定士試験",
    zh: "估价师考试", fr: "Examen d’expert en évaluation", es: "Examen de tasador",
  },
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
  "accounting-principles": {
    ko: "회계원리", en: "Principles of Accounting", ja: "会計原理",
    zh: "会计原理", fr: "Principes comptables", es: "Principios de contabilidad",
  },
  "intermediate-accounting": {
    ko: "중급회계", en: "Intermediate Accounting", ja: "中級会計",
    zh: "中级会计", fr: "Comptabilité intermédiaire", es: "Contabilidad intermedia",
  },
  "advanced-accounting": {
    ko: "고급회계", en: "Advanced Accounting", ja: "上級会計",
    zh: "高级会计", fr: "Comptabilité avancée", es: "Contabilidad avanzada",
  },
  "cost-accounting": {
    ko: "원가회계", en: "Cost Accounting", ja: "原価会計",
    zh: "成本会计", fr: "Comptabilité des coûts", es: "Contabilidad de costos",
  },
  "managerial-accounting": {
    ko: "관리회계", en: "Managerial Accounting", ja: "管理会計",
    zh: "管理会计", fr: "Comptabilité de gestion", es: "Contabilidad de gestión",
  },
  "auditing": {
    ko: "회계감사", en: "Auditing", ja: "監査",
    zh: "审计", fr: "Audit", es: "Auditoría",
  },
  "tax-accounting": {
    ko: "세무회계", en: "Tax Accounting", ja: "税務会計",
    zh: "税务会计", fr: "Comptabilité fiscale", es: "Contabilidad fiscal",
  },
  "financial-statement-analysis": {
    ko: "재무제표분석", en: "Financial Statement Analysis", ja: "財務諸表分析",
    zh: "财务报表分析", fr: "Analyse des états financiers", es: "Análisis de estados financieros",
  },
  "civil-law": {
    ko: "민법", en: "Civil Law", ja: "民法",
    zh: "民法", fr: "Droit civil", es: "Derecho civil",
  },
  "criminal-law": {
    ko: "형법", en: "Criminal Law", ja: "刑法",
    zh: "刑法", fr: "Droit pénal", es: "Derecho penal",
  },
  "constitutional-law": {
    ko: "헌법", en: "Constitutional Law", ja: "憲法",
    zh: "宪法", fr: "Droit constitutionnel", es: "Derecho constitucional",
  },
  "commercial-law": {
    ko: "상법", en: "Commercial Law", ja: "商法",
    zh: "商法", fr: "Droit commercial", es: "Derecho mercantil",
  },
  "administrative-law": {
    ko: "행정법", en: "Administrative Law", ja: "行政法",
    zh: "行政法", fr: "Droit administratif", es: "Derecho administrativo",
  },
  "civil-procedure": {
    ko: "민사소송법", en: "Civil Procedure", ja: "民事訴訟法",
    zh: "民事诉讼法", fr: "Procédure civile", es: "Procedimiento civil",
  },
  "criminal-procedure": {
    ko: "형사소송법", en: "Criminal Procedure", ja: "刑事訴訟法",
    zh: "刑事诉讼法", fr: "Procédure pénale", es: "Procedimiento penal",
  },
  "labor-law": {
    ko: "노동법", en: "Labor Law", ja: "労働法",
    zh: "劳动法", fr: "Droit du travail", es: "Derecho laboral",
  },
  "intellectual-property-law": {
    ko: "지식재산권법", en: "Intellectual Property Law", ja: "知的財産法",
    zh: "知识产权法", fr: "Propriété intellectuelle", es: "Propiedad intelectual",
  },
  "legal-practice": {
    ko: "계약실무", en: "Contract Practice", ja: "契約実務",
    zh: "合同实务", fr: "Pratique contractuelle", es: "Práctica contractual",
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
