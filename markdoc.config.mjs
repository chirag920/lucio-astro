import { defineMarkdocConfig, component } from '@astrojs/markdoc/config';

/**
 * Custom tags for the designed blocks inside Engineering Notes bodies. Three definitions must
 * stay in sync: these tags, the matching content components in keystatic.config.ts (what the
 * editor shows), and the Astro components they render to.
 */
export default defineMarkdocConfig({
  tags: {
    files: {
      render: component('./src/components/notes/FilesList.astro'),
      selfClosing: true,
      attributes: { items: { type: Array, required: true } },
    },
    aside: {
      render: component('./src/components/notes/NoteAside.astro'),
      attributes: { label: { type: String, required: true } },
    },
    dropped: {
      render: component('./src/components/notes/NoteDropped.astro'),
      attributes: { label: { type: String, required: true } },
    },
  },
});
