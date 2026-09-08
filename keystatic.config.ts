import { collection, config, fields } from '@keystatic/core';
import { block, wrapper } from '@keystatic/core/content-components';

/**
 * Keystatic — git-based CMS. Local mode: run `npm run dev`, open http://localhost:4321/keystatic,
 * and edits are written straight to src/content/notes/*.mdoc (the same files content.config.ts
 * reads). Field names/types mirror the zod schema there — keep the two in sync, and keep the
 * content components below in sync with markdoc.config.mjs and src/components/notes/*.
 */
export default config({
  storage: { kind: 'local' },
  ui: { brand: { name: 'Lucio DMS' } },
  collections: {
    notes: collection({
      label: 'Engineering Notes',
      slugField: 'title',
      path: 'src/content/notes/*',
      format: { contentField: 'content' },
      entryLayout: 'content',
      columns: ['order', 'minutes', 'draft'],
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        order: fields.integer({
          label: 'Number',
          description: 'Position on the notes page: 1 renders as "01" and anchors as #n1.',
          defaultValue: 1,
        }),
        summary: fields.text({ label: 'Summary', multiline: true, description: 'One or two sentences; shown in the landing list and the notes-page contents.' }),
        minutes: fields.integer({ label: 'Read time (minutes)', defaultValue: 5 }),
        topic: fields.text({ label: 'Topic', description: 'Meta line after the read time, e.g. "Product and data model".' }),
        draft: fields.checkbox({
          label: 'Draft',
          description: 'Drafts appear nowhere — not on the landing list, not on the notes page. Untick to publish.',
          defaultValue: true,
        }),
        content: fields.markdoc({
          label: 'Content',
          extension: 'mdoc',
          options: {
            // Without an explicit location, uploads land somewhere Astro can't resolve and the
            // build fails with ImageNotFound (learned the hard way — see tools/check-images.mjs).
            image: {
              directory: 'src/content/notes/images',
              publicPath: './images/',
              transformFilename: (name: string) =>
                name.trim().toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
            },
          },
          components: {
            files: block({
              label: 'File listing',
              description: 'The folder-listing block. Tick "highlight" on rows the reader should focus on.',
              schema: {
                items: fields.array(
                  fields.object({
                    name: fields.text({ label: 'File name' }),
                    keep: fields.checkbox({ label: 'Highlight', defaultValue: false }),
                  }),
                  { label: 'Files', itemLabel: (props) => props.fields.name.value || 'file' },
                ),
              },
            }),
            aside: wrapper({
              label: 'Aside',
              description: 'Callout with a bold lead-in, e.g. "Lister, viewer, editor, admin".',
              schema: { label: fields.text({ label: 'Lead-in' }) },
            }),
            dropped: wrapper({
              label: 'What we dropped',
              description: 'Callout for an idea that was tried and removed.',
              schema: { label: fields.text({ label: 'Lead-in' }) },
            }),
          },
        }),
      },
    }),
  },
});
