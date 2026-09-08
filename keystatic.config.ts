import { collection, config, fields } from '@keystatic/core';

/**
 * Keystatic — git-based CMS. Local mode: run `npm run dev`, open http://localhost:4321/keystatic,
 * and edits are written straight to src/content/blog/*.md (the same files src/content.config.ts reads).
 * Field names/types mirror the zod schema in src/content.config.ts — keep them in sync.
 */
export default config({
  storage: { kind: 'local' },
  ui: { brand: { name: 'Lucio DMS' } },
  collections: {
    blog: collection({
      label: 'Notes',
      slugField: 'title',
      path: 'src/content/blog/*',
      format: { contentField: 'content' },
      entryLayout: 'content',
      columns: ['series', 'order', 'draft'],
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        series: fields.text({ label: 'Series', description: 'Eyebrow label, e.g. "Zine · No. 01" or "Engineering notes · 02"' }),
        summary: fields.text({ label: 'Summary', multiline: true }),
        order: fields.integer({ label: 'Order', description: 'Position in the Notes list (ascending)', defaultValue: 1 }),
        date: fields.date({ label: 'Publish date', description: 'Required to publish. Leave empty while drafting.' }),
        draft: fields.checkbox({ label: 'Draft', description: 'Drafts show as "Coming soon" on the landing page and get no /blog page.', defaultValue: true }),
        content: fields.markdoc({ label: 'Content', extension: 'md' }),
      },
    }),
  },
});
