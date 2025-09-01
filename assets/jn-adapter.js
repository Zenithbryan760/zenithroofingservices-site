// /js/jn-adapter.js
(() => {
  const FN_URL = '/.netlify/functions/jn-create-lead';

  const waitForForm = (root) =>
    new Promise((resolve) => {
      const now = root.querySelector('form');
      if (now) return resolve(now);

      const mo = new MutationObserver(() => {
        const f = root.querySelector('form');
        if (f) {
          mo.disconnect();
          resolve(f);
        }
      });
      mo.observe(root, { childList: true, subtree: true });

      // Fallback <template> support
      const tpl = root.querySelector('#lead-form-fallback');
      if (tpl) {
        const node = tpl.content ? tpl.content.cloneNode(true) : null;
        if (node) {
          root.prepend(node);
          const f2 = root.querySelector('form');
          if (f2) {
            mo.disconnect();
            resolve(f2);
          }
        }
      }
    });

  const inferService = (section, form) => {
    const hidden = form.querySelector('input[name="service_type"]')?.value?.trim();
    if (hidden) return hidden;

    const dataCat = section.dataset.category?.trim();
    if (dataCat) return dataCat;

    const urlBits = (location.pathname || '').split('/').filter(Boolean);
    const guess = urlBits.slice(-1)[0]?.replace(/[-_]/g, ' ') || document.title || 'Website';
    return guess;
  };

  const ensureDisclaimer = (form) => {
    if (form.querySelector('.jn-disclaimer')) return;
    const p = document.createElement('p');
    p.className = 'jn-disclaimer';
    p.innerHTML = 'Real-estate transaction inspections and third-party report requests are billed services.';
    // place near submit
    const submit = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submit && submit.parentElement) {
      submit.parentElement.appendChild(p);
    } else {
      form.appendChild(p);
    }
  };

  const splitName = (full = '') => {
    const t = full.trim().replace(/\s+/g, ' ');
    if (!t) return { first: '', last: '' };
    const parts = t.split(' ');
    if (parts.length === 1) return { first: parts[0], last: '' };
    return { first: parts.shift(), last: parts.join(' ') };
  };

  const normalizePhone = (raw = '') =>
    (String(raw).match(/\d/g) || []).join('').replace(/^1(?=\d{10}$)/, '');

  const showError = (form, msg) => {
    let box = form.querySelector('.jn-error');
    if (!box) {
      box = document.createElement('div');
      box.className = 'jn-error';
      form.prepend(box);
    }
    box.textContent = msg;
  };

  const handleSubmit = async (e, section) => {
    e.preventDefault();
    const form = e.currentTarget;

    // Honeypot (bot trap) optional: <input name="company" style="display:none">
    const hp = form.querySelector('input[name="company"]');
    if (hp && hp.value) return;

    const btn = form.querySelector('button[type="submit"], input[type="submit"]');
    const btnOrig = btn?.textContent;
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

    // read common fields (works with your fallback + most includes)
    const fullName =
      form.querySelector('[name="name"]')?.value ||
      [form.querySelector('[name="first_name"]')?.value, form.querySelector('[name="last_name"]')?.value]
        .filter(Boolean).join(' ') || '';

    const { first, last } = splitName(fullName);

    const phone = form.querySelector('[name="phone"]')?.value || '';
    const email = form.querySelector('[name="email"]')?.value || '';
    const zip = form.querySelector('[name="zip"]')?.value || '';
    const street = form.querySelector('[name="street_address"], [name="streetname"]')?.value || '';
    const city = form.querySelector('[name="city"]')?.value || '';
    const state = form.querySelector('[name="state"]')?.value || '';
    const message = form.querySelector('[name="message"], [name="notes"], textarea')?.value || '';

    const serviceType = inferService(section, form);

    // client-side phone sanity to avoid 400s
    const nPhone = normalizePhone(phone);
    if (!nPhone || nPhone.length !== 10) {
      showError(form, 'Please enter a valid 10-digit phone number.');
      if (btn) { btn.disabled = false; btn.textContent = btnOrig; }
      return;
    }

    // build description
    const descLines = [];
    if (message) descLines.push(message.trim());
    descLines.push(`Service Type: ${serviceType}`);
    if (zip) descLines.push(`ZIP: ${zip}`);
    descLines.push(`Page: ${location.pathname}`);
    descLines.push('Note: Real-estate / third-party inspections are billed.');

    const payload = {
      display_name: fullName || email || phone || 'Website Lead',
      first_name: first,
      last_name: last,
      phone,
      email,
      street_address: street,
      city,
      state,
      zip,
      description: descLines.join('\n'),
      service_type: serviceType,
      referral_source: document.referrer || ''
    };

    try {
      const res = await fetch(FN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const text = await res.text();
      if (res.ok || res.status === 201) {
        const to = section.dataset.redirect || '/thank-you/';
        location.href = to;
        return;
      }
      try {
        const j = JSON.parse(text);
        showError(form, j.error || 'Something went wrong. Please call or text us.');
      } catch {
        showError(form, text || 'Something went wrong. Please call or text us.');
      }
    } catch (_) {
      showError(form, 'Network error. Please try again or call/text us.');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = btnOrig; }
    }
  };

  const init = async () => {
    const section = document.querySelector('[data-estimate-context]');
    if (!section) return;

    const form = await waitForForm(section);
    if (!form) return;

    ensureDisclaimer(form);
    form.addEventListener('submit', (e) => handleSubmit(e, section));
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
