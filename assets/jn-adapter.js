// jn-adapter.js
// Drop-in adapter that binds to existing forms and posts them to Netlify JobNimbus function.
//  - Auto-detects common field names (firstname/first_name/etc.)
//  - Adds disclaimer
//  - Infers service_type from URL keywords
//  - Adds page title/URL/referrer into referral_source and description

(function () {
  const ENDPOINT = '/.netlify/functions/jn-create-lead';

  // Map URL keywords -> service types you want to see in JobNimbus
  const SERVICE_MAP = [
    { rx: /inspection|inspect/i, value: 'Roof Inspection' },
    { rx: /clean|wash/i,        value: 'Roof Cleaning' },
    { rx: /tile/i,              value: 'Tile Repair' },
    { rx: /shingle/i,           value: 'Shingle Repair' },
    { rx: /gutter/i,            value: 'Gutter' },
  ];
  const DEFAULT_SERVICE = 'General Roofing';

  // Try to find the best matching service from the current URL/path/title
  function inferServiceType() {
    const hay = `${location.pathname} ${document.title}`;
    for (const m of SERVICE_MAP) {
      if (m.rx.test(hay)) return m.value;
    }
    return DEFAULT_SERVICE;
  }

  // Friendly selectors list for common field names your forms might use
  const PICKS = {
    first_name:  ['[name="first_name"]','[name="firstname"]','[name="first"]','[name="FirstName"]','[name*="first"]'],
    last_name:   ['[name="last_name"]','[name="lastname"]','[name="last"]','[name="LastName"]','[name*="last"]'],
    phone:       ['[name="phone"]','[name="phone_number"]','[name="Phone"]','[name*="phone"]'],
    email:       ['[name="email"]','[name="Email"]','input[type="email"]'],
    street:      ['[name="street_address"]','[name="address"]','[name="street"]','[name*="address"]'],
    city:        ['[name="city"]'],
    state:       ['[name="state"]','[name="region"]'],
    zip:         ['[name="zip"]','[name="zipcode"]','[name="postal"]','[name*="zip"]'],
    description: ['[name="description"]','[name="message"]','textarea[name*="message"]','textarea'],
    // honeypot (optional): any hidden/company field that bots might fill
    honeypot:    ['[name="company"]','[name="website"]','[name="url"]','input[type="hidden"][name*="hp"]']
  };

  function pick(form, list) {
    for (const sel of list) {
      const el = form.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function ensureDisclaimer(form) {
    if (form.querySelector('.jn-disclaimer')) return;
    const p = document.createElement('p');
    p.className = 'jn-disclaimer';
    p.textContent = 'Real estate and third-party inspections are billed services (not free).';
    // Put disclaimer just above the submit button if possible
    const submit = form.querySelector('[type="submit"]') || form.lastElementChild;
    form.insertBefore(p, submit ? submit : null);
  }

  function ensureStatusBox(form) {
    let box = form.querySelector('.jn-status');
    if (!box) {
      box = document.createElement('div');
      box.className = 'jn-status';
      form.appendChild(box);
    }
    return box;
  }

  function cleanPhone(v='') {
    return String(v).replace(/[^\d]/g,'');
  }

  function attach(form) {
    // Only attach once
    if (form.__jnBound) return;
    form.__jnBound = true;

    ensureDisclaimer(form);
    const status = ensureStatusBox(form);

    form.addEventListener('submit', async (e) => {
      // Intercept the *browser* submit; we’ll post via fetch instead
      e.preventDefault();
      status.className = 'jn-status';
      status.textContent = '';

      // Honeypot
      const hp = pick(form, PICKS.honeypot);
      if (hp && hp.value) { status.classList.add('error'); status.textContent = 'Submission blocked.'; return; }

      // Collect values
      const F = (key) => {
        const el = pick(form, PICKS[key]);
        return el ? el.value.trim() : '';
      };

      const first = F('first_name');
      const last  = F('last_name');
      const phone = cleanPhone(F('phone'));
      const email = F('email');

      if (!first || !last || !phone) {
        status.classList.add('error');
        status.textContent = 'Please provide first name, last name, and phone.';
        (pick(form,PICKS.first_name) || pick(form,PICKS.phone) || form).focus();
        return;
      }

      const street = F('street');
      const city   = F('city');
      const state  = F('state');
      const zip    = F('zip');

      const service_type = inferServiceType();

      // Page context
      const pageLine = `${document.title ? document.title + ' | ' : ''}${window.location.href}${document.referrer ? ' (ref: '+document.referrer+')' : ''}`;

      // Description: prepend page marker only once
      let description = F('description');
      const marker = '[Page]';
      if (!description.startsWith(marker)) {
        description = `${marker} ${pageLine}\n${description}`.trim();
      }

      const payload = {
        // display_name is built server-side if omitted, but we can set one to reduce duplicates
        display_name: `${first} ${last} (${service_type})`.trim(),
        first_name: first,
        last_name:  last,
        phone,
        email,
        street_address: street,
        city, state, zip,
        service_type,
        referral_source: pageLine,
        description
      };

      const btn = form.querySelector('[type="submit"]');
      if (btn) btn.disabled = true;

      try {
        const res  = await fetch(ENDPOINT, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
        const text = await res.text();

        if (res.ok) {
          status.classList.add('success');
          status.textContent = 'Thanks! We received your request.';
          form.reset();
        } else {
          status.classList.add('error');
          status.textContent = text || 'There was a problem submitting the form.';
        }
      } catch (err) {
        status.classList.add('error');
        status.textContent = 'Network error. Please try again.';
      } finally {
        if (btn) btn.disabled = false;
      }
    }, { capture:true });
  }

  function init() {
    // Bind to all forms that look like lead/contact forms.
    // If you want to be stricter, add a class on your form like class="zn-lead"
    // and replace the selector below with 'form.zn-lead'.
    document.querySelectorAll('form').forEach((f) => {
      const looksLikeLead =
        pick(f, PICKS.first_name) || pick(f, PICKS.phone) || pick(f, PICKS.description);
      if (looksLikeLead) attach(f);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
