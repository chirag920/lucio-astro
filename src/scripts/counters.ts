// Eases `[data-count]` numbers from 0 to their target once visible.
const cio = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target as HTMLElement;
      const end = Number(el.dataset.count);
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / 1400);
        el.textContent = String(Math.round(end * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      tick(t0);
      cio.unobserve(el);
    }
  },
  { threshold: 0.4 },
);
document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => cio.observe(el));
