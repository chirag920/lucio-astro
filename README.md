# Lucio DMS — site

Astro 7 static site with a content-collection blog and Keystatic as the editor.

```bash
npm install
npm run dev          # http://localhost:4321  (CMS at /keystatic)
npm run build        # → dist/
npx astro check      # type-check
```

- Landing page: `src/pages/index.astro` composes `src/components/sections/*`.
- Blog: markdown in `src/content/blog/`, schema in `src/content.config.ts`, routes in `src/pages/blog/`.
- Editing: run the dev server and open `/keystatic`. Set `draft: false` and a `date` to publish a post.
- Fonts (Newsreader, Inter) are self-hosted at build via Astro's Fonts API — no Google Fonts requests at runtime.
- Before deploying, set `site` in `astro.config.mjs` to the real URL (canonical links + sitemap).
- Visual check: `node tools/shots.mjs http://localhost:4321/ out/ 1440 900 0.5`.

See `CLAUDE.md` for project conventions and gotchas.
