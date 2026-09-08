// Footer newsletter form. Same pattern as inquiry-form: validate, POST, only claim success on 2xx.
// The v23 mockup shipped this button dead (type="button", no handler); this wires it to
// /api/subscribe, which stores the address in D1.
const form = document.getElementById('sub') as HTMLFormElement | null;
const sent = document.getElementById('sub-sent');
const errorEl = document.getElementById('sub-error');

const showError = (msg: string) => {
  if (!errorEl) return;
  errorEl.textContent = msg;
  errorEl.style.display = 'block';
};

if (form && sent) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorEl) errorEl.style.display = 'none';

    const email = form.elements.namedItem('email') as HTMLInputElement;
    const bad = !email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value);
    email.style.borderColor = bad ? '#F5C4A0' : '';
    if (bad) return;

    const button = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    const label = button?.textContent;
    if (button) {
      button.disabled = true;
      button.textContent = 'Subscribing…';
    }
    const honeypot = form.elements.namedItem('website') as HTMLInputElement | null;

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.value, website: honeypot?.value ?? '' }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'Something went wrong. Please try again.');
      }
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

// Make this a module so its top-level names do not collide with the other form script.
export {};
