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
  }).refine((d) => d.draft || d.date !== undefined, {
    // Without this, `draft: false` and no `date` fails silently: the post generates no page and
    // still renders as "Coming soon", which is indistinguishable from being a draft. Fail loudly.
    message: 'Publishing needs BOTH `draft: false` and a `date`. This post has `draft: false` but no date, so it would generate no page and still show as "Coming soon". Add a publish date, or set `draft: true`.',
    path: ['date'],
  }),
});

export const collections = { blog };
