# Lucio DMS site (Astro)

Marketing site for Lucio DMS, ported from the hand-built `lucio-dms-landing-v23` + `about` +
`notes` HTML pages (v22 port history is in git). Astro 7, static pages + two D1-backed API
routes on a Cloudflare Worker, notes via content collections, Keystatic (local mode) as the CMS.
Sibling of the Framer project in `../Code lucio`.

## Commands
- `npm run dev` — full-parity dev on :4321 (Cloudflare workerd runtime; D1 bindings live).
  `npx astro dev --background` to daemonize; `astro dev stop|status|logs`.
- `npm run edit` — **the CMS**: dev server on :4322 WITHOUT the Cloudflare adapter, open
  http://localhost:4322/keystatic. Keystatic's dev routes cannot run inside the adapter's workerd
  runtime ("exports is not defined"), so /keystatic on :4321 errors — this is expected; use :4322.
- `npm run build` — client to `dist/client/`, worker to `dist/server/` (generated wrangler.json
  there is what deploys). `postbuild` runs tools/check-images.mjs and fails on broken images.
- `npx astro check` — must stay at 0 errors. `npm run cf-types` after changing wrangler.jsonc.
- `node tools/shots.mjs <url> <outDir> [w=1440] [h=900] [scale=0.5]` — screenshot every
  `main > section` + footer. Serve reference HTML with simple filenames (spaces/parens break it).
- Local D1: `npx wrangler d1 migrations apply lucio-inquiries --local -c dist/server/wrangler.json`
  — its state lives under dist/, so **every rebuild wipes it**; reapply after `npm run build`.

## Layout
- `src/styles/` — one global cascade split by concern (tokens → base → layout → components →
  motion → responsive). Order matters. Subpage-only overrides are scoped `body.subpage` (set via
  BaseLayout's `subpage` prop — about and notes use it to drop scroll-snap).
- `src/components/sections/*.astro` — one file per landing section. `src/components/notes/*` —
  Astro components behind the Markdoc tags.
- `src/pages/notes.astro` — the notes issue page: every published note renders as a numbered
  section (#n1, #n2…). There are no per-note pages; old /blog/* URLs redirect (astro.config).
- `src/content/notes/*.mdoc` + `src/content.config.ts` (zod) + `keystatic.config.ts` (editor) —
  keep the two schemas in sync. Publishing = `draft: false`, nothing else (dates are gone; notes
  show read time).
- **Markdoc components sync in THREE places**: markdoc.config.mjs (tags) ↔ keystatic.config.ts
  (content components) ↔ src/components/notes/* (rendering). Change all three together.
- `src/pages/api/inquiry.ts` + `subscribe.ts` — the only non-prerendered routes; D1 via
  `import { env } from 'cloudflare:workers'` (Astro.locals.runtime.env throws since v6).
- Forms: success is shown only after a 2xx; honeypots are `<textarea name="website">` — a second
  `<input>` would break the `.form input:only-of-type` width rule from the design.

## Playbook
- This is Astro 7 — newer than model training. Verify APIs against `node_modules/astro` types
  before using them (e.g. `fonts` is stable top-level config; `z` comes from `astro/zod`).
- Google-provider fonts fetch only the `wght` axis. Newsreader needs
  `options: { experimental: { variableAxis: { opsz: ['6..72'] } } }` or display headings render
  with the wrong optical size.
- The CSS is global on purpose: selectors like `.dark .btn--primary`, `.rv .l>*` span components.
  Don't move rules into scoped `<style>` blocks.
- Section components must render a bare `<section>` as their root — `main > section` drives
  min-height/scroll-snap (landing only; subpages opt out via body.subpage) and `.rv .l>*` drives
  reveal. No wrapper divs.
- `<br>` in `.d1/.d2` headings no longer needs a leading space: v23's CSS turns br inline with
  `::after{content:" "}` under 960px. (The old `word <br>` rule is obsolete.)
- Keystatic is injected only when `command === 'dev'` (see `keystaticDevOnly` in
  astro.config.mjs) and only WORKS in `npm run edit` (no adapter). Its first load after
  installing/updating deps can 504 with "Outdated Optimize Dep" — restart the dev server, and
  restart it after ANY `npm install`; don't debug the page.
- Dev content re-sync is async; test publishing with `astro build` and inspect `dist/client/`.
- Browser-pane screenshots after scrolling return blank/misaligned frames. Use `tools/shots.mjs`
  for anything below the fold (and for original-vs-port comparisons).
- Astro build output with the adapter splits into dist/client (web root) and dist/server (worker).
  Anything that resolves paths against "dist" must handle both (see tools/check-images.mjs).
- Images: sharp is a direct dependency because Astro only WARNS and ships broken image URLs when
  it's missing (that broke every image in production once — check-images.mjs exists to fail the
  build instead). The adapter is pinned to `imageService: { build: 'compile', runtime:
  'passthrough' }`; its default would move optimisation to request time, which a
  static-assets-only Worker cannot serve.
- The hero photo ships from `src/assets/hero-matter.jpg` (900px wide source — the display is
  ~50vw, so replace with a wider original if one exists). Resize big images BEFORE committing;
  git keeps every byte forever.
- Deploys: push to main deploys. `wrangler versions upload` finds the worker via the generated
  `.wrangler/deploy/config.json` redirect — don't add `main` to the root wrangler.jsonc; the
  adapter injects it and setting it manually breaks `astro dev`/`astro check`.
- D1 schema changes = a numbered file in `migrations/` + `wrangler d1 migrations apply ...
  --remote` (only Chirag can run --remote). `wrangler d1 create` APPENDS its own binding block to
  wrangler.jsonc — delete the duplicate, keep the `DB` binding.
