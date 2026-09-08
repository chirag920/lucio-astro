// Evaluation form. Validates client-side, then POSTs to /api/inquiry (the one server route on the
// site) which writes a row to D1. The form also carries method/action, so if this script fails to
// load the browser still submits it natively and the endpoint accepts urlencoded bodies.
const form = document.getElementById('inq') as HTMLFormElement | null;
const sent = document.getElementById('sent');
const errorEl = document.getElementById('inq-error');

const showError = (msg: string) => {
  if (!errorEl) return;
  errorEl.textContent = msg;
  errorEl.style.display = 'block';
};

if (form && sent) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorEl) errorEl.style.display = 'none';

    const fields = ['email', 'firm'].map((n) => form.elements.namedItem(n) as HTMLInputElement);
    let ok = true;
    for (const f of fields) {
      const bad = !f.value.trim() || (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value));
      f.style.borderColor = bad ? '#F5C4A0' : '';
      if (bad) ok = false;
    }
    if (!ok) return;

    const button = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    const label = button?.textContent;
    if (button) {
      button.disabled = true;
      button.textContent = 'Sending…';
    }

    const [email, firm] = fields;
    const honeypot = form.elements.namedItem('website') as HTMLInputElement | null;

    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.value, firm: firm.value, website: honeypot?.value ?? '' }),
      });

      if (!res.ok) {
        // The endpoint returns a human-readable `error` for 4xx/5xx; fall back if it didn't.
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'Something went wrong. Please try again.');
      }

      // Only claim receipt once the row is actually stored.
      form.style.display = 'none';
      sent.style.display = 'block';
    } catch (err) {
      if (button) {
        button.disabled = false;
        if (label) button.textContent = label;
      }
      showError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  });
}
