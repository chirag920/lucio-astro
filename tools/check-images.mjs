/**
 * Post-build guard against silently broken images.
 *
 * Astro only WARNS when it can't optimise an image (e.g. sharp missing on a CI builder): the
 * build still exits 0, but it ships originals and HTML pointing at .webp files that were never
 * generated, or falls back to /_image?href=... URLs that need a server. On a static deploy every
 * one of those 404s — which is exactly how every image on this site broke without the build
 * failing. This turns that into a hard error.
 *
 * Run automatically as `postbuild`.
 */
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dist = resolve('dist');
const problems = [];

async function htmlFiles(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await htmlFiles(p)));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const files = await htmlFiles(dist);
for (const file of files) {
  const html = await readFile(file, 'utf8');
  const rel = file.slice(dist.length + 1);

  // 1. On-demand endpoint URLs cannot work on a static deploy.
  for (const m of html.matchAll(/<img[^>]+src="(\/_image\?[^"]*)"/g)) {
    problems.push(`${rel}: needs the server-only /_image endpoint — sharp likely missing at build time\n    ${m[1].slice(0, 100)}`);
  }

  // 2. Locally-referenced image files that were never emitted.
  for (const m of html.matchAll(/<img[^>]+src="(\/[^"]+\.(?:webp|jpg|jpeg|png|avif|gif|svg))"/gi)) {
    const asset = decodeURIComponent(m[1].split('?')[0]);
    if (!existsSync(join(dist, asset))) problems.push(`${rel}: references missing file ${asset}`);
  }
}

if (problems.length) {
  console.error(`\n[check-images] ${problems.length} broken image reference(s) in dist:\n`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error('\nIf this says sharp is missing, the build environment did not install it.');
  console.error('sharp is a direct dependency — check the install step actually ran.\n');
  process.exit(1);
}
console.log(`[check-images] OK — ${files.length} pages, all image references resolve.`);
