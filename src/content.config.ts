import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * Blog / zine posts. Markdown files in src/content/blog — the same shape Keystatic reads and writes.
 * A post appears in the landing-page Notes list either way; it becomes a link (and gets a /blog/<id> page)
 * once `draft` is false and `date` is set.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    /** Eyebrow label, e.g. "Zine · No. 01" or "Engineering notes · 02". */
    series: z.string(),
    summary: z.string(),
    /** Display order in the Notes list (ascending). */
    order: z.number().int(),
    date: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
