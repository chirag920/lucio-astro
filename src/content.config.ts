import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * Engineering Notes. Markdoc files in src/content/notes — the same shape Keystatic reads and
 * writes. Each note renders as a numbered section (#n1, #n2…) of the /notes issue page and as a
 * row in the landing-page zine list. `draft: true` hides a note from both.
 * The v22-era date-gated publishing (draft + date) is gone with the redesign: notes show read
 * time, not dates, so `draft` alone controls visibility.
 */
const notes = defineCollection({
  loader: glob({ pattern: '**/*.mdoc', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    /** Position and badge number: 1 renders as "01" and anchors as #n1. */
    order: z.number().int().positive(),
    summary: z.string(),
    /** Read time in minutes, shown as "6 min". */
    minutes: z.number().int().positive(),
    /** Meta line after the read time, e.g. "Product and data model". */
    topic: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { notes };
