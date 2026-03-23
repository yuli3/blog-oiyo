import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  schema: z.object({
    title: z.string().min(10).max(100),
    description: z.string().min(10).max(200), // TODO: tighten to max(160) after truncating long descriptions in existing posts
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),
    locale: z.enum(['en', 'ko', 'ja', 'fr', 'es', 'zh', 'cn']).optional(),
    // TODO: make locale required after running migration script to add locale fields to all ~1970 posts
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    author: z.string().default("Oiyo"),
  })
});



export const collections = { blog };