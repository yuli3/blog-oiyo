import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string(),
    locale: z.enum(['en', 'ko', 'ja', 'fr', 'es']),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    author: z.string(),
  })
});

export const collections = { blog };