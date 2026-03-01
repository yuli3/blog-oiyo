import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  schema: z.object({
    title: z.string().min(10).max(100),
    description: z.string().min(10).max(200),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),
    locale: z.enum(['en', 'ko', 'ja', 'fr', 'es']).optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    author: z.string().default("Oiyo"),
  })
});



export const collections = { blog };