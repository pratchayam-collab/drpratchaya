import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const seoSchema = z.object({
  title: z.string(),
  description: z.string(),
  keywords: z.string(),
  canonical: z.string().url(),
});

const ogSchema = z.object({
  title: z.string(),
  description: z.string(),
  url: z.string().url(),
  locale: z.string().optional(),
});

const faqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const conditions = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/conditions' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lang: z.literal('th'),
    conditionNameTh: z.string(),
    conditionNameEn: z.string(),
    sourceFile: z.string(),
    tag: z.string(),
    publishedYear: z.number().int(),
    seo: seoSchema,
    og: ogSchema,
    shortAnswer: z.string(),
    faq: z.array(faqItemSchema),
  }),
});

export const collections = { conditions };
