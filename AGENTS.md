# Lucio DMS site (Astro)

Marketing site for Lucio DMS, ported from the hand-built `lucio-dms-landing-v22.html`. Astro 7, static output, blog via
content collections, Keystatic (local mode) as the CMS. Sibling of the Framer project in `../Code lucio`.

## Commands
- `npm run dev` — dev server on :4321 (`npx astro dev --background` to daemonize; `astro dev stop|status|logs`).
- `npm run build` — static build to `dist/`. `npx astro check` — type-check (must stay at 0 errors).
- `node tools/shots.mjs <url> <outDir> [w=1440] [h=900] [scale=0.5]` — headless-Chrome screenshot of every `main > section` + footer.
- Editing content: with dev running, open http://localhost:4321/keystatic → writes `src/content/blog/*.md`.

## Layout
- `src/styles/` — one global cascade split by concern (tokens → base → layout → components → motion → responsive). Order matters.
- `src/components/sections/*.astro` — one file per landing-page section; `Program.astro` is the milestone stepper; `Logo.astro` the wordmark.
- `src/scripts/*.ts` — reveal (site-wide, from BaseLayout), counters (Stats), halftone (Hero canvas), inquiry-form (Evaluate).
- `src/content/blog/*.md` + `src/content.config.ts` (zod schema) + `keystatic.config.ts` (editor schema) — keep the two schemas in sync.
- Publishing a post = `draft: false` **and** a `date`. Drafts still appear on the landing page as "Coming soon" without a link.

## Playbook
<!-- Hard-won project rules. One bullet each: symptom → rule. Prune stale ones. -->
- This is Astro 7 — newer than model training. Verify APIs against `node_modules/astro` types before using them (e.g. `fonts` is stable top-level config; `z` comes from `astro/zod`, not `astro:content`).
- Google-provider fonts fetch only the `wght` axis. Newsreader needs `options: { experimental: { variableAxis: { opsz: ['6..72'] } } }` or display headings render with the wrong optical size. Probe with `font-variation-settings:'opsz' N` width differences.
- The CSS is global on purpose: selectors like `.dark .btn--primary`, `.rv .l>*`, `.ba .files li` span components. Don't move rules into scoped `<style>` blocks.
- Section components must render a bare `<section>` as their root — `main > section` drives min-height/scroll-snap and `.rv .l>*` drives reveal. No wrapper divs.
- `<br>` inside `.d1/.d2` headings is hidden ≤960px; always write `word <br>` (space before) or words concatenate on mobile.
- Keystatic is injected only when `command === 'dev'` (see `keystaticDevOnly` in astro.config.mjs). Its routes are SSR; adding them to the build would require an adapter. Cloud editing = switch storage to `github` + adapter + plain `keystatic()`.
- First `/keystatic` load after installing/updating deps can 504 with "Outdated Optimize Dep" — restart the dev server, don't debug the page.
- Dev content re-sync is async; a curl 3s after editing a post can read stale data. Test publishing with `astro build` and inspect `dist/`.
- Browser-pane screenshots after scrolling return blank/misaligned frames. Use `tools/shots.mjs` for anything below the fold (and for original-vs-port comparisons).
- `astro:assets` `<Image>` adds width/height attributes; any CSS that sets `width:100%` on those images also needs `height:auto` or they distort.
- `--paper` and `--cream` were undefined in the source (logo cutouts and capsule swatches rendered wrong). They live in `tokens.css` now; don't remove them as "unused".
