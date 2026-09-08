// Hero: a halftone. Documents drift, are gathered into a floating widget, and settle into an
// ordered store. Everything is dots. Ported verbatim from the source; only types were added.
type Frag = {
  x: number; y: number; w: number; h: number; seed: number; vx: number; vy: number;
  state: 'float' | 'drag' | 'absorb'; p: number; alpha: number; sx: number; sy: number;
};

function init(cv: HTMLCanvasElement) {
  const g = cv.getContext('2d');
  if (!g) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, d = 1, t = 0, mx = -1e4, my = -1e4, last = performance.now(), dt = 1 / 60;
  const S = 11; // grid step
  const P = new Uint8Array(512);
  {
    const p = [...Array(256).keys()];
    for (let i = 255; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [p[i], p[j]] = [p[j], p[i]]; }
    for (let i = 0; i < 512; i++) P[i] = p[i & 255];
  }
  const fade = (x: number) => x * x * x * (x * (x * 6 - 15) + 10);
  const lerp = (a: number, b: number, x: number) => a + x * (b - a);
  const grad = (h: number, x: number, y: number) => { switch (h & 3) { case 0: return x + y; case 1: return -x + y; case 2: return x - y; default: return -x - y; } };
  function n2(x: number, y: number) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y), A = P[X] + Y, B = P[X + 1] + Y;
    return lerp(lerp(grad(P[A], x, y), grad(P[B], x - 1, y), u), lerp(grad(P[A + 1], x, y - 1), grad(P[B + 1], x - 1, y - 1), u), v);
  }
  // one warm family, cream at the edges to coral at the core
  const RAMP: [number, [number, number, number]][] = [[0, [120, 110, 220]], [0.4, [168, 158, 238]], [0.7, [216, 209, 244]], [1, [250, 247, 240]]];
  const ACCENT = '#F5C4A0';
  function shade(u: number) {
    u = Math.max(0, Math.min(1, u));
    for (let i = 1; i < RAMP.length; i++) {
      if (u <= RAMP[i][0]) { const [a0, c0] = RAMP[i - 1], [a1, c1] = RAMP[i], k = (u - a0) / (a1 - a0); return `rgb(${c0.map((c, j) => Math.round(c + (c1[j] - c) * k)).join(',')})`; }
    }
    return 'rgb(204,60,44)';
  }
  function dot(x: number, y: number, dens: number, alpha = 1) {
    if (dens <= 0.04) return;
    const r = S * 0.46 * Math.min(1, 0.22 + dens * 0.85);
    g!.globalAlpha = alpha * (0.45 + 0.55 * Math.min(1, dens)); g!.fillStyle = shade(dens); g!.beginPath(); g!.arc(x, y, r, 0, 6.2832); g!.fill(); g!.globalAlpha = 1;
  }
  function fit() { const r = cv.getBoundingClientRect(); d = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; g!.setTransform(d, 0, 0, d, 0, 0); }
  fit(); addEventListener('resize', fit);
  const host = cv.parentElement ?? cv;
  host.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
  host.addEventListener('pointerleave', () => { mx = my = -1e4; });
  const widget = () => ({ x: W * 0.30, y: H * 0.52, w: W * 0.44, h: S * 3 });
  // documents: little dotted sheets
  const frags: Frag[] = []; let stored = 0, pulse = 0, spawnT = 0, grabT = 0;
  function spawn() { const n = 5 + ((Math.random() * 4) | 0); frags.push({ x: W * (0.06 + Math.random() * 0.55), y: H * (0.06 + Math.random() * 0.28), w: n, h: n, seed: Math.random() * 100, vx: (Math.random() - 0.5) * 0.10, vy: (Math.random() - 0.5) * 0.06, state: 'float', p: 0, alpha: 0, sx: 0, sy: 0 }); }
  for (let i = 0; i < 3; i++) spawn();
  function sheet(f: Frag, alpha: number, scale = 1) { // an abstract cluster: dots on a soft radial falloff, breathing
    const w = f.w, h = f.h, R = Math.max(w, h) / 2;
    for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
      const cx = (i + 0.5) - w / 2, cy = (j + 0.5) - h / 2; const r = Math.sqrt(cx * cx + cy * cy) / R; if (r > 1) continue;
      const core = Math.pow(1 - r, 1.4); const dens = core * (0.85 + 0.2 * n2(f.seed + i * 0.5 + t * 1.5, j * 0.5 - t));
      dot(f.x + (i + 0.5) * S * scale, f.y + (j + 0.5) * S * scale, dens * scale, alpha);
    }
  }
  function frame(now: number = performance.now()) {
    dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt * 0.36; g!.clearRect(0, 0, W, H);
    const wd = widget(); const rows = Math.ceil(H / S);
    // store: ordered shelves of dots, deepest rows warmest
    const c0 = Math.round(wd.x / S), capacity = Math.round(wd.w / S), baseRow = rows - 3, maxRows = 5, start = Math.max(0, stored - capacity * maxRows);
    for (let k = start; k < stored; k++) {
      const kk = k - start, row = Math.floor(kk / capacity), col = kk % capacity; const y = (baseRow - row * 2 + 0.5) * S, x = (c0 + col + 0.5) * S;
      if (y < wd.y + wd.h + 40) break; const u = row / maxRows; dot(x, y, 0.30 + 0.55 * (1 - u) + 0.06 * n2(col * 0.4, row + t * 2), 0.9);
    }
    // fragments
    spawnT += dt; if (spawnT > 1.8 && frags.filter((f) => f.state === 'float').length < 4) { spawn(); spawnT = 0; }
    grabT += dt; if (grabT > 2.4) { const cand = frags.filter((f) => f.state === 'float' && f.alpha > 0.9); if (cand.length) { const f = cand[(Math.random() * cand.length) | 0]; f.state = 'drag'; f.p = 0; f.sx = f.x; f.sy = f.y; } grabT = 0; }
    for (let k = frags.length - 1; k >= 0; k--) {
      const f = frags[k];
      if (f.state === 'float') {
        f.alpha = Math.min(1, f.alpha + dt * 0.8); f.x += (f.vx * 60 + Math.sin(t * 3 + f.seed) * 8) * dt; f.y += (f.vy * 60 + Math.cos(t * 2.3 + f.seed) * 5) * dt;
        const dx = mx - (f.x + f.w * S / 2), dy = my - (f.y + f.h * S / 2); if (dx * dx + dy * dy < 9000 && f.alpha > 0.9) { f.state = 'drag'; f.p = 0; f.sx = f.x; f.sy = f.y; }
        sheet(f, f.alpha);
      } else if (f.state === 'drag') {
        f.p = Math.min(1, f.p + dt / 1.6); const e = f.p < 0.5 ? 4 * f.p * f.p * f.p : 1 - Math.pow(-2 * f.p + 2, 3) / 2;
        const tx = wd.x + wd.w * 0.5 - f.w * S / 2, ty = wd.y - f.h * S + S; const cx = (f.sx + tx) / 2, cy = Math.min(f.sy, ty) - 90;
        f.x = (1 - e) * (1 - e) * f.sx + 2 * (1 - e) * e * cx + e * e * tx; f.y = (1 - e) * (1 - e) * f.sy + 2 * (1 - e) * e * cy + e * e * ty;
        sheet(f, 1);
        if (f.p >= 1) { f.state = 'absorb'; f.p = 0; pulse = 1; }
      } else if (f.state === 'absorb') {
        f.p += dt / 0.5; const sc = 1 - f.p; sheet({ ...f, x: f.x + f.w * S * (1 - sc) / 2, y: wd.y - f.h * S * sc + S }, 1 - f.p * 0.7, sc);
        if (f.p >= 1) { frags.splice(k, 1); stored += Math.round(f.w * f.h * 1.1); }
      }
    }
    // the widget: a pill made of dots, hot at the mark, cooling along its length; swells when something lands
    pulse *= Math.pow(0.05, dt);
    const pc = Math.round(wd.w / S), pr = 3;
    for (let i = 0; i < pc; i++) for (let j = 0; j < pr; j++) {
      const u = i / pc; const edge = j === 1 ? 1 : 0.72; const dens = (0.95 - u * 0.6) * edge + 0.08 * n2(i * 0.5 + t * 3, j) + pulse * 0.25 * (1 - u);
      if ((i === 0 || i === pc - 1) && j !== 1) continue; // rounded ends
      dot(wd.x + (i + 0.5) * S, wd.y + (j + 0.5) * S, dens, 0.95);
    }
    // the mark: one bigger dot at the left, ringed when something lands
    g!.fillStyle = ACCENT; g!.beginPath(); g!.arc(wd.x + 1.5 * S, wd.y + 1.5 * S, S * 0.62 + pulse * 4, 0, 7); g!.fill();
    if (pulse > 0.02) { g!.strokeStyle = 'rgba(245,196,160,' + pulse * 0.7 + ')'; g!.lineWidth = 1.5; g!.beginPath(); g!.arc(wd.x + 1.5 * S, wd.y + 1.5 * S, S + (1 - pulse) * 30, 0, 7); g!.stroke(); }
    // the drop: dots falling from the pill to the top shelf
    if (pulse > 0.05) { const y0 = wd.y + wd.h + S, y1 = (baseRow - Math.min(maxRows - 1, Math.floor((stored - start) / capacity)) * 2) * S; for (let y = y0; y < y1; y += S) dot(wd.x + wd.w * 0.5, y + 0.5 * S, 0.3, pulse); }
    if (!reduce) requestAnimationFrame(frame);
  }
  frame();
}

const canvas = document.getElementById('layers');
if (canvas instanceof HTMLCanvasElement) init(canvas);
