// Headless-Chrome section screenshots over CDP. No dependencies (Node ≥22 has fetch + WebSocket).
//   node tools/shots.mjs <url> <outDir> [width=1440] [height=900] [scale=0.5]
// Scrolls each `main > section` and the footer into view, waits for reveal transitions, saves a PNG per section.
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, outDir, width = '1440', height = '900', scale = '0.5'] = process.argv.slice(2);
if (!url || !outDir) {
  console.error('usage: node tools/shots.mjs <url> <outDir> [width] [height] [scale]');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333 + Math.floor(Math.random() * 500);
const profile = mkdtempSync(join(tmpdir(), 'shots-'));
const chrome = spawn(
  CHROME,
  ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', '--disable-gpu', 'about:blank'],
  { stdio: 'ignore' },
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForChrome() {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) return; } catch {}
    await sleep(200);
  }
  throw new Error('Chrome did not start');
}

try {
  await waitForChrome();
  const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let seq = 0;
  const pending = new Map();
  const events = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id) {
      const p = pending.get(msg.id); pending.delete(msg.id);
      msg.error ? p.rej(new Error(msg.error.message)) : p.res(msg.result);
    } else events.push(msg);
  };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params }));
  });
  const waitEvent = (name) => new Promise((res) => {
    const t = setInterval(() => { const i = events.findIndex((e) => e.method === name); if (i >= 0) { clearInterval(t); res(events.splice(i, 1)[0]); } }, 50);
  });

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: +width, height: +height, deviceScaleFactor: +scale, mobile: +width < 768 });
  await send('Page.navigate', { url });
  await waitEvent('Page.loadEventFired');
  await sleep(1000);

  const SEL = 'main > section, footer';
  const { result } = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `[...document.querySelectorAll('${SEL}')].map(s => s.id || s.className.split(' ').filter(c => !['split','rv','hr'].includes(c)).join('-') || s.tagName.toLowerCase())`,
  });
  const names = result.value;
  for (let i = 0; i < names.length; i++) {
    await send('Runtime.evaluate', { expression: `document.querySelectorAll('${SEL}')[${i}].scrollIntoView({behavior:'instant',block:'start'})` });
    await sleep(1900); // reveal transitions run ~1s + up to .55s stagger
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const file = join(outDir, `${String(i).padStart(2, '0')}-${names[i]}.png`);
    writeFileSync(file, Buffer.from(shot.data, 'base64'));
    console.log(file);
  }
  ws.close();
} finally {
  chrome.kill();
}
