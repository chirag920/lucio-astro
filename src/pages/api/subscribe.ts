import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/** Footer newsletter signup. Stores the address in D1 (`subscribers`); nothing is sent anywhere. */
export const prerender = false;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

export const POST: APIRoute = async ({ request }) => {
  let email: string;
  let honeypot: string;
  try {
    const type = request.headers.get('content-type') ?? '';
    if (type.includes('application/json')) {
      const body = (await request.json()) as Record<string, unknown>;
      email = String(body.email ?? '');
      honeypot = String(body.website ?? '');
    } else {
      const form = await request.formData();
      email = String(form.get('email') ?? '');
      honeypot = String(form.get('website') ?? '');
    }
  } catch {
    return json({ error: 'Malformed request body.' }, 400);
  }

  // Honeypot: pretend success, write nothing.
  if (honeypot.trim()) return json({ ok: true }, 200);

  email = email.trim().toLowerCase().slice(0, 320);
  if (!EMAIL.test(email)) return json({ error: 'Enter a valid email address.' }, 422);

  try {
    // Idempotent: resubscribing the same address is a no-op, not an error.
    await env.DB.prepare(
      'INSERT INTO subscribers (email, country) VALUES (?, ?) ON CONFLICT (email) DO NOTHING',
    )
      .bind(email, request.headers.get('cf-ipcountry') ?? null)
      .run();
  } catch (err) {
    console.error('[subscribe] insert failed:', err);
    return json({ error: 'Could not save that. Please try again.' }, 500);
  }
  return json({ ok: true }, 201);
};

export const ALL: APIRoute = () => json({ error: 'Method not allowed.' }, 405);
