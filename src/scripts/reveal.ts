// Adds `.in` to each `.rv` element the first time it scrolls into view. Loaded site-wide from BaseLayout.
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  },
  { threshold: 0.05, rootMargin: '0px 0px 15% 0px' },
);
document.querySelectorAll('.rv').forEach((el) => io.observe(el));
