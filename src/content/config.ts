import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  schema: z.object({
    title: z.string().min(10).max(100),
    description: z.string().min(50).max(200),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).min(1).max(10).default([]),
    category: z.string(),
    locale: z.enum(['en', 'ko', 'ja', 'fr', 'es']),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    author: z.string().default("Oiyo"),
  })
});

export const collections = { blog };