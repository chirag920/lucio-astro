// Client-side validation for the evaluation form. Swaps the form for the "Received." message on success.
// No backend yet — the source marks this "Replace with the Framer form embed".
const form = document.getElementById('inq') as HTMLFormElement | null;
const sent = document.getElementById('sent');
if (form && sent) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = ['email', 'firm'].map((n) => form.elements.namedItem(n) as HTMLInputElement);
    let ok = true;
    for (const f of fields) {
      const bad = !f.value.trim() || (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value));
      f.style.borderColor = bad ? '#F5C4A0' : '';
      if (bad) ok = false;
    }
    if (!ok) return;
    form.style.display = 'none';
    sent.style.display = 'block';
  });
}
