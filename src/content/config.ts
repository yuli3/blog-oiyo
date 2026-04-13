import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  schema: z.object({
    title: z.string().min(10).max(100),
    description: z.string().min(10).max(200), // Note: Google shows ~155 chars; keep descriptions concise
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    keywords: z.array(z.string()).optional(), // Additional SEO keywords beyond tags
    category: z.string().optional(),
    locale: z.enum(['en', 'ko', 'ja', 'fr', 'es', 'zh', 'cn']).optional(),
    // TODO: make locale required after running migration script to add locale fields to all ~1970 posts
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    author: z.string().default("Oiyo"),
  })
});



export const collections = { blog };