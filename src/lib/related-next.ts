/**
 * Helpers for landing "next one page" CTAs (RelatedPosts / RelatedToolLinks).
 * Keeps curation/scoring testable without mounting Astro components.
 */

export type RelatedPostLike = {
  slug: string;
  data: {
    draft?: boolean;
    tags?: string[];
    category?: string;
    title: string;
    pubDate?: Date;
  };
};

/** Locale-free slug from a collection entry slug like "en/foo-ch1". */
export function localeFreeSlug(slug: string): string {
  const parts = slug.split("/");
  return parts.length > 1 ? parts.slice(1).join("/") : slug;
}

/**
 * Resolve curated next-read posts for a locale.
 * `slugs` are locale-free (e.g. "academy-economics-basics-ch1").
 */
export function resolveCuratedPosts<T extends RelatedPostLike>(
  allPosts: T[],
  locale: string,
  slugs: string[],
  maxItems = 3,
): T[] {
  const byFree = new Map<string, T>();
  for (const post of allPosts) {
    if (post.data.draft) continue;
    const parts = post.slug.split("/");
    if (parts[0] !== locale) continue;
    byFree.set(localeFreeSlug(post.slug), post);
  }
  const out: T[] = [];
  for (const s of slugs) {
    const hit = byFree.get(s);
    if (hit) out.push(hit);
    if (out.length >= maxItems) break;
  }
  return out;
}

/**
 * Score related posts by tag overlap + category bonus (existing RelatedPosts logic).
 */
export function scoreRelatedPosts<T extends RelatedPostLike>(
  allPosts: T[],
  opts: {
    locale: string;
    currentSlug?: string;
    tags?: string[];
    category?: string;
    maxItems?: number;
  },
): T[] {
  const { locale, currentSlug, tags = [], category, maxItems = 3 } = opts;
  return allPosts
    .filter((post) => !post.data.draft)
    .filter((post) => post.slug !== currentSlug)
    .filter((post) => post.slug.split("/")[0] === locale)
    .map((post) => {
      const sharedTags = (post.data.tags ?? []).filter((t) => tags.includes(t));
      const categoryBonus = category && post.data.category === category ? 2 : 0;
      return { post, score: sharedTags.length + categoryBonus };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems)
    .map((item) => item.post);
}

/** Pick first-chapter locale-free slugs from priority series entries. */
export function firstChapterSlugs(
  series: { firstPost: { slug: string } }[],
  maxItems = 3,
): string[] {
  return series.slice(0, maxItems).map((s) => localeFreeSlug(s.firstPost.slug));
}

export const NEXT_READ_LABELS: Record<string, string> = {
  en: "Next read",
  ko: "다음 읽을 글",
  ja: "次に読む",
  zh: "下一篇",
  fr: "À lire ensuite",
  es: "Siguiente lectura",
};

export const RELATED_POST_LABELS: Record<string, string> = {
  en: "Related Posts",
  ko: "관련 글",
  ja: "関連記事",
  zh: "相关文章",
  fr: "Articles connexes",
  es: "Artículos relacionados",
};

export const NEXT_TOOL_LABELS: Record<string, string> = {
  en: "Try next",
  ko: "다음으로 써보기",
  ja: "次に試す",
  zh: "接着试试",
  fr: "Essayer ensuite",
  es: "Probar después",
};

export const RELATED_TOOL_LABELS: Record<string, string> = {
  en: "Related tools",
  ko: "관련 도구",
  ja: "関連ツール",
  fr: "Outils associés",
  es: "Herramientas relacionadas",
  zh: "相关工具",
};
