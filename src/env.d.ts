/// <reference types="astro/client" />
/// <reference path="../worker-configuration.d.ts" />

// Bindings come from wrangler.jsonc and are typed by worker-configuration.d.ts, generated with
// `npm run cf-types`. Re-run that after changing bindings in wrangler.jsonc.
// Access them with `import { env } from "cloudflare:workers"` — Astro.locals.runtime.env was
// removed in Astro v6 and throws.
