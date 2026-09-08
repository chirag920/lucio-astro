import type { APIRoute } from 'astro';
// Astro.locals.runtime.env was REMOVED in Astro v6 and throws if touched. This is the supported
// way to reach bindings; `env` is typed from worker-configuration.d.ts (`npm run cf-types`).
import { env } from 'cloudflare:workers';

/**
 * The one server-rendered route on the site. Everything else is prerendered (see astro.config.mjs),
 * so this is the only thing that runs as a Worker.
 */
export const prerender = false;

/** Mirrors the client-side check in src/scripts/inquiry-form.ts. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

export const POST: APIRoute = async ({ request }) => {
  let email: string;
  let firm: string;
  let honeypot: string;

  // Accept both JSON (what the form sends) and urlencoded (so the form still works if JS fails).
  try {
    const type = request.headers.get('content-type') ?? '';
    if (type.includes('application/json')) {
      const body = (await request.json()) as Record<string, unknown>;
      email = String(body.email ?? '');
      firm = String(body.firm ?? '');
      honeypot = String(body.website ?? '');
    } else {
      const form = await request.formData();
      email = String(form.get('email') ?? '');
      firm = String(form.get('firm') ?? '');
      honeypot = String(form.get('website') ?? '');
    }
  } catch {
    return json({ error: 'Malformed request body.' }, 400);
  }

  // Honeypot: a real browser leaves this hidden field empty. Answer 200 so bots can't tell they
  // were caught, but write nothing.
  if (honeypot.trim()) return json({ ok: true }, 200);

  email = email.trim().slice(0, 320); // RFC max practical address length
  firm = firm.trim().slice(0, 200);

  if (!EMAIL.test(email)) return json({ error: 'Enter a valid email address.' }, 422);
  if (!firm) return json({ error: 'Enter your firm.' }, 422);

  const db = env.DB;
  if (!db) {
    console.error('[inquiry] D1 binding "DB" is missing — check wrangler.jsonc');
    return json({ error: 'Storage unavailable.' }, 503);
  }

  try {
    await db
      .prepare('INSERT INTO inquiries (email, firm, country) VALUES (?, ?, ?)')
      .bind(email, firm, request.headers.get('cf-ipcountry') ?? null)
      .run();
  } catch (err) {
    // Never leak driver internals to the client, but keep them in Workers Logs.
    console.error('[inquiry] insert failed:', err);
    return json({ error: 'Could not save that. Please try again.' }, 500);
  }

  return json({ ok: true }, 201);
};

/** Anything other than POST. Keeps the endpoint from looking like a page. */
export const ALL: APIRoute = () => json({ error: 'Method not allowed.' }, 405);
