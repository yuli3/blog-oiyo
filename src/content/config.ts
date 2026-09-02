import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  schema: z.object({
    // The corpus now includes guide-style and localization-aware titles/descriptions.
    // Keep minimum quality gates, but allow a wider editorial envelope for stable builds.
    title: z.string().min(10).max(160),
    description: z.string().min(10).max(400),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    keywords: z.array(z.string()).optional(), // Additional SEO keywords beyond tags
    canonicalUrl: z.string().optional(), // cross-domain canonical override (e.g. wiki owns the definition)
    redirectTo: z.string().optional(), // oiyo canonical path (locale-less, e.g. "/mbti/test"); page becomes a redirect stub
    redirectToBlog: z.string().optional(), // same-site blog path (locale-less); page becomes a blog→blog redirect stub (dedup)
    category: z.string().optional(),
    // 카테고리 안의 갈래. `series` 는 강의 순서 내비게이션을 움직이므로
    // 쪼갤 수 없다 — 회계학 16강은 한 시리즈이면서 회계원리·중급·고급·원가관리
    // 네 갈래다. 그 둘을 한 필드로 겸하게 하면 둘 다 망가진다.
    subcategory: z.string().optional(),
    track: z.enum(["academy", "magazine", "interactive", "education"]).optional(),
    series: z.string().optional(),
    chapter: z.coerce.number().int().positive().optional(),
    chapterTitleShort: z.string().max(80).optional(),
    locale: z.enum(['en', 'ko', 'ja', 'fr', 'es', 'zh']).optional(),
    market: z.enum(["KR", "US", "JP", "GLOBAL", "EU", "LATAM", "CN", "TW"]).optional(),
    audienceMarket: z.enum(["KR", "US", "JP", "GLOBAL", "EU", "LATAM", "CN", "TW"]).optional(),
    contentScope: z.enum(["global", "local", "regional"]).optional(),
    localizationMode: z.enum(["original", "localized", "translated", "redirect-only"]).optional(),
    // TODO: make locale required after running migration script to add locale fields to all ~1970 posts
    draft: z.boolean().default(false),
    noindex: z.boolean().default(false), // temporary search quarantine; URL remains accessible
    featured: z.boolean().default(false),
    author: z.string().default("Oiyo"),
    sourceProject: z.enum(["blog-oiyo", "ahoxy-nextjs", "oiyo", "external-research"]).optional(),
    sourceSlug: z.string().optional(),
    migrationStatus: z.enum(["native", "candidate", "mapped", "drafted", "migrated", "needs-review"]).optional(),
    embeddedTools: z.array(z.string()).default([]),
    relatedCredentials: z.array(z.string()).default([]),
    seoIntent: z.string().optional(),
    layoutVariant: z.enum(["standard-essay", "lecture-series", "interactive-article", "comparison-guide", "qualification-roadmap"]).optional(),
    heroMode: z.enum(["none", "abstract", "legacy-image"]).optional(),
    contentStage: z.enum(["idea", "planned", "outlined", "drafting", "review", "published", "rework", "archived"]).optional(),
  })
});

export const collections = { blog };
