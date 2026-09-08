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
        date: fields.date({ label: 'Publish date', description: 'REQUIRED to publish — unticking Draft is not enough. With no date the post generates no page and still shows as "Coming soon". Leave empty only while drafting.' }),
        draft: fields.checkbox({ label: 'Draft', description: 'Drafts show as "Coming soon" on the landing page and get no /blog page.', defaultValue: true }),
        content: fields.markdoc({
          label: 'Content',
          extension: 'md',
          options: {
            // Without this, uploads land in <slug>/content/ but get referenced as a bare
            // filename, which Astro resolves against src/content/blog/ — so the build fails
            // with ImageNotFound. Keep directory and publicPath pointing at the same place:
            // publicPath is relative to the .md file, so ./images/ === src/content/blog/images/.
            // Relative refs also mean astro:assets optimises them (webp, resized).
            image: {
              directory: 'src/content/blog/images',
              publicPath: './images/',
              // Spaces become %20 in markdown and are a needless source of breakage.
              transformFilename: (name: string) =>
                name.trim().toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
            },
          },
        }),
      },
    }),
  },
});
