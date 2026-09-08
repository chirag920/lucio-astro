// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

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
