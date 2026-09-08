// @ts-check
import { defineConfig, fontProviders, sharpImageService } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';
import cloudflare from '@astrojs/cloudflare';

/**
 * Keystatic (local mode) only during `astro dev`. Its /keystatic and /api/keystatic routes are
 * server-rendered, so including them in `astro build` would require an SSR adapter. For cloud
 * editing from the deployed site, switch storage to `github` in keystatic.config.ts, add an
 * adapter, and use `keystatic()` directly here.
 */
const keystaticDevOnly = () => ({
  name: 'keystatic-dev-only',
  hooks: {
    /** @param {import('astro').HookParameters<'astro:config:setup'>} ctx */
    'astro:config:setup': (ctx) => {
      if (ctx.command === 'dev') keystatic().hooks['astro:config:setup']?.(ctx);
    },
  },
});

export default defineConfig({
  // Standalone test deploy — deliberately NOT lucioai.com, which stays on Framer.
  // Canonical links, og:url and the sitemap all derive from this, so pointing it at the
  // live domain would make every test page claim to be the real site. This is a Cloudflare
  // Worker serving static assets (not Pages), hence workers.dev rather than pages.dev.
  site: 'https://lucio-astro.chirag-c32.workers.dev',
  integrations: [react(), sitemap(), keystaticDevOnly()],
  // `output` stays 'static': Astro prerenders every page unless a route opts out with
  // `export const prerender = false`. Only src/pages/api/inquiry.ts does, so the marketing site
  // is still plain files on the edge and just that one endpoint runs as a Worker.
  // No sessions on this site. Left unset, the adapter wires a Cloudflare KV session driver and
  // expects a "SESSION" KV namespace to exist — another binding to create for no benefit.
  session: false,
  adapter: cloudflare({
    // The adapter's DEFAULT is 'cloudflare-binding', which swaps sharp for a runtime image
    // service and needs a Cloudflare Images binding — that would undo the build-time
    // optimisation fix and put us back to images resolved on request. `build: 'compile'`
    // keeps transforms at build time; `runtime: 'passthrough'` means no request-time image
    // endpoint exists to depend on. tools/check-images.mjs verifies this held.
    imageService: { build: 'compile', runtime: 'passthrough' },
  }),
  // Declared explicitly to document the dependency: without sharp, Astro only WARNS and still
  // exits 0, shipping unoptimised originals plus HTML pointing at .webp files it never wrote (or
  // /_image?href=... URLs needing a server). On this static-assets-only Worker those 404 — which
  // broke every image on the site with a green build. Config can't make that fatal, so `sharp` is
  // a direct dependency and tools/check-images.mjs fails the build on any broken reference.
  image: { service: sharpImageService() },
  // Fonts are downloaded at build, self-hosted, subset, and given metric-matched fallbacks.
  // Weights are ranges so the variable font files (incl. Newsreader's optical-size axis) are fetched.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Newsreader',
      cssVariable: '--font-newsreader',
      weights: ['300 400'],
      styles: ['normal', 'italic'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['Georgia', 'serif'],
      // Newsreader's optical-size axis (6..72) changes letterforms at display sizes; the source requested it explicitly.
      options: { experimental: { variableAxis: { opsz: ['6..72'] } } },
    },
    {
      provider: fontProviders.google(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: ['400 600'],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
});
