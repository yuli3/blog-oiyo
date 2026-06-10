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
    category: z.string().optional(),
    track: z.enum(["academy", "magazine", "interactive", "education"]).optional(),
    series: z.string().optional(),
    chapter: z.coerce.number().int().positive().optional(),
    chapterTitleShort: z.string().max(80).optional(),
    locale: z.enum(['en', 'ko', 'ja', 'fr', 'es', 'zh']).optional(),
    // TODO: make locale required after running migration script to add locale fields to all ~1970 posts
    draft: z.boolean().default(false),
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
