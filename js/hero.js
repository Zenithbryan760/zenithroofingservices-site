/* =========================================================
   Zenith – Hero Estimate Form Logic
   File: /js/hero.js
   Safe to include on any page. Looks for #estimate-form.
   ========================================================= */

(() => {
  'use strict';

  // ---------- Tiny helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const debounce = (fn, wait = 300) => {            // NEW
    let t;                                          // NEW
    return (...args) => {                           // NEW
      clearTimeout(t);                              // NEW
      t = setTimeout(() => fn(...args), wait);      // NEW
    };                                              // NEW
  };                                                // NEW

  // Create (or get) a compact error box near the submit button
  function ensureErrorSummary(form) {
    let box = $('.form-error-summary', form);
    if (!box) {
      box = document.createElement('div');
      box.className = 'form-error-summary';
      box.style.margin = '10px 0';
      box.style.fontSize = '0.95rem';
      box.style.lineHeight = '1.3';
      box.style.color = '#b00020';
      box.style.display = 'none';
      const submitRow = form.querySelector('button[type="submit"]')?.parentElement || form;
      submitRow.parentNode.insertBefore(box, submitRow);
    }
    return box;
  }
  function showError(form, msg) {
    const box = ensureErrorSummary(form);
    box.textContent = msg;
    box.style.display = 'block';
  }
  function hideError(form) {
    const box = $('.form-error-summary', form);
    if (box) box.style.display = 'none';
  }

  // ---------- Field validation ----------
  const emailOK = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const zipOK   = (v) => /^\d{5}(-?\d{4})?$/.test(v);
  const cleanDigits = (v) => (v || '').replace(/\D+/g, '');

  function validateForm(form) {
    hideError(form);

    // Required fields you collect server-side
    const requiredIds = [
      'firstName','lastName','phone','email',
      'streetAddress','city','state','zip'
    ];

    for (const id of requiredIds) {
      const el = $('#' + id, form);
      if (!el || !el.value || !el.value.trim()) {
        showError(form, 'Please fill out all required fields (marked with *).');
        el?.focus();
        return false;
      }
    }

    const email = $('#email', form).value.trim();
    if (!emailOK(email)) {
      showError(form, 'Please enter a valid email address.');
      $('#email', form).focus();
      return false;
    }

    const phoneRaw = $('#phone', form).value;
    const phoneDigits = cleanDigits(phoneRaw);
    if (phoneDigits.length < 10) {
      showError(form, 'Please enter a valid phone number (10 digits).');
      $('#phone', form).focus();
      return false;
    }

    const zip = $('#zip', form).value.trim();
    if (!zipOK(zip)) {
      showError(form, 'Please enter a valid ZIP code (5 or 9 digits).');
      $('#zip', form).focus();
      return false;
    }

    return true;
  }

  // ---------- Phone masking ----------
  function maskPhoneInput(e) {
    const input = e.target;
    const digits = input.value.replace(/\D+/g, '').slice(0, 10);
    let out = digits;

    if (digits.length > 6) out = `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
    else if (digits.length > 3) out = `(${digits.slice(0,3)}) ${digits.slice(3)}`;
    else if (digits.length > 0) out = `(${digits}`;

    input.value = out;
  }

  // ---------- ZIP → City/State autofill ----------  // NEW
  async function fillCityStateFromZip(zip, form) {    // NEW
    if (!/^\d{5}$/.test(zip)) return;                 // NEW
    try {                                             // NEW
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`, { mode: 'cors' }); // NEW
      if (!res.ok) return;                            // NEW
      const data = await res.json();                  // NEW
      const place = (data.places && data.places[0]) || null; // NEW
      if (!place) return;                             // NEW
      const city = place['place name'] || '';         // NEW
      const stateAbbr = place['state abbreviation'] || ''; // NEW

      const cityEl = $('#city', form);                // NEW
      if (cityEl && !cityEl.value.trim()) {          // NEW (won't overwrite user input)
        cityEl.value = city;                          // NEW
      }                                               // NEW
      const stateEl = $('#state', form);              // NEW
      if (stateEl && !stateEl.readOnly && stateAbbr) {// NEW
        stateEl.value = stateAbbr;                    // NEW
      }                                               // NEW
    } catch (_) { /* silent */ }                      // NEW
  }                                                   // NEW

  // ---------- reCAPTCHA render ----------
  // We’ll try to render once on load, and again on focus if needed.
  function renderRecaptchaIfPossible() {
    const host = window.grecaptcha && typeof window.grecaptcha.render === 'function';
    const container = document.getElementById('recaptcha') || document.querySelector('.g-recaptcha');
    if (!host || !container) return;

    // Avoid duplicate render
    if (typeof window._recaptchaWidgetId !== 'undefined') return;

    // Site key sources (pick the first you have):
    // 1) <div id="recaptcha" data-sitekey="..."></div>
    // 2) window.RECAPTCHA_SITE_KEY (set on the page)
    const sitekey = container.getAttribute('data-sitekey') || window.RECAPTCHA_SITE_KEY || '';
    if (!sitekey) return;

    try {
      window._recaptchaWidgetId = window.grecaptcha.render(container, { sitekey });
    } catch (e) {
      // noop
    }
  }

  // Some browsers load the API later; try a few times.
  function tryRenderRecaptchaWithRetries() {
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      renderRecaptchaIfPossible();
      if (typeof window._recaptchaWidgetId !== 'undefined' || tries > 20) {
        clearInterval(timer);
      }
    }, 300);
  }

  // ---------- Submit handler (includes recaptcha_token) ----------
  async function submitHandler(e) {
    e.preventDefault();
    const form = e.currentTarget;

    if (!validateForm(form)) return;

    // Collect reCAPTCHA token (required when RECAPTCHA_SECRET is set in Netlify)
    let token = '';
    if (window.grecaptcha && typeof window.grecaptcha.getResponse === 'function') {
      if (typeof window._recaptchaWidgetId !== 'undefined') {
        token = window.grecaptcha.getResponse(window._recaptchaWidgetId) || '';
      }
    }
    if (!token) {
      // Some themes add a hidden textarea; try that as a fallback
      const t = document.querySelector('textarea[name="g-recaptcha-response"]');
      if (t && t.value) token = t.value.trim();
    }
    if (!token) {
      showError(form, 'Please complete the reCAPTCHA before submitting.');
      return;
    }

    // Build payload (names must match your Netlify function expectations)
    const fd = new FormData(form);
    const data = {
      first_name:      (fd.get('first_name') || '').trim(),
      last_name:       (fd.get('last_name')  || '').trim(),
      phone:           (fd.get('phone')      || '').trim(),
      email:           (fd.get('email')      || '').trim(),
      street_address:  (fd.get('street_address') || '').trim(),
      city:            (fd.get('city')       || '').trim(),
      state:           (fd.get('state')      || '').trim(),
      zip:             (fd.get('zip')        || '').trim(),
      service_type:     fd.get('service_type')    || '',
      referral_source:  fd.get('referral_source') || '',
      description:     (fd.get('description')    || '').trim(),

      // ✅ NEW — required by your function when RECAPTCHA_SECRET is present
      recaptcha_token: token,

      // Helpful context in CRM/email
      page: location.href
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : null;
    if (submitBtn) { submitBtn.textContent = 'Submitting…'; submitBtn.disabled = true; }

    try {
      const res = await fetch('/.netlify/functions/jn-create-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const text = await res.text();
      if (!res.ok) {
        // Surface server message if available
        let msg = 'Sorry, there was a problem submitting your request.';
        try {
          const json = JSON.parse(text);
          if (json && (json.error || json.message)) {
            msg = 'Error: ' + (json.error || json.message);
          }
        } catch (_) {}
        console.error('Lead submit failed:', text);
        showError(form, msg);
        return;
      }

      alert('Thanks! Your request has been submitted.');
      form.reset();
      hideError(form);

      if (window.grecaptcha &&
          typeof window.grecaptcha.reset === 'function' &&
          typeof window._recaptchaWidgetId !== 'undefined') {
        window.grecaptcha.reset(window._recaptchaWidgetId);
      } else {
        const t = document.querySelector('textarea[name="g-recaptcha-response"]');
        if (t) t.value = '';
      }

    } catch (err) {
      console.error(err);
      showError(form, 'Network error. Please try again.');
    } finally {
      if (submitBtn && originalText) {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    }
  }

  // ---------- Boot ----------
  function attachBehaviors() {
    const form = document.getElementById('estimate-form');
    if (!form) return;

    // Phone mask
    const phone = $('#phone', form);
    if (phone) phone.addEventListener('input', maskPhoneInput);

    // ZIP → City/State autofill                         // NEW
    const zipEl = $('#zip', form);                       // NEW
    if (zipEl) {                                         // NEW
      const trigger = debounce(() => {                   // NEW
        const v = (zipEl.value || '').trim().slice(0, 5);// NEW
        if (/^\d{5}$/.test(v)) fillCityStateFromZip(v, form); // NEW
      }, 350);                                           // NEW
      zipEl.addEventListener('input', trigger);          // NEW
      zipEl.addEventListener('blur', () => {             // NEW
        const v = (zipEl.value || '').trim().slice(0, 5);// NEW
        if (/^\d{5}$/.test(v)) fillCityStateFromZip(v, form); // NEW
      });                                                // NEW
    }                                                    // NEW

    // Try to render reCAPTCHA now (and again on first focus)
    tryRenderRecaptchaWithRetries();
    form.addEventListener('focusin', renderRecaptchaIfPossible, { once: true });

    // Submit wiring
    form.addEventListener('submit', submitHandler);
  }

  // ✅ Expose init so your include loader can run it after injecting the hero
  window.initEstimateForm = attachBehaviors;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachBehaviors);
  } else {
    attachBehaviors();
  }
})();
// ... your existing hero.js above ...

  // ---------- Boot ----------
  function attachBehaviors() {
    const form = document.getElementById('estimate-form');
    if (!form) return;

    // NEW: apply per-page config if provided
    applyFormConfig(form); // NEW

    // Phone mask
    const phone = $('#phone', form);
    if (phone) phone.addEventListener('input', maskPhoneInput);

    // ZIP → City/State autofill
    const zipEl = $('#zip', form);
    if (zipEl) {
      const trigger = debounce(() => {
        const v = (zipEl.value || '').trim().slice(0, 5);
        if (/^\d{5}$/.test(v)) fillCityStateFromZip(v, form);
      }, 350);
      zipEl.addEventListener('input', trigger);
      zipEl.addEventListener('blur', () => {
        const v = (zipEl.value || '').trim().slice(0, 5);
        if (/^\d{5}$/.test(v)) fillCityStateFromZip(v, form);
      });
    }

    // Try to render reCAPTCHA now (and again on first focus)
    tryRenderRecaptchaWithRetries();
    form.addEventListener('focusin', renderRecaptchaIfPossible, { once: true });

    // Submit wiring
    form.addEventListener('submit', submitHandler);
  }

  // NEW: universal form config (title, subtitle, lock/preselect service, placeholders, hidden fields)
  function applyFormConfig(form) {
    const cfg = window.ESTIMATE_FORM_CONFIG || {};
    const block = form.closest('.estimate-form-block') || document;

    // Title / subtitle
    if (cfg.title) {
      const h1 = block.querySelector('.form-title');
      if (h1) h1.textContent = cfg.title;
    }
    if (cfg.subtitle) {
      const sub = block.querySelector('.form-subtitle');
      if (sub) sub.textContent = cfg.subtitle;
    }

    // Description placeholder
    if (cfg.descriptionPlaceholder) {
      const desc = form.querySelector('#description');
      if (desc) desc.placeholder = cfg.descriptionPlaceholder;
    }

    // Referral preselect
    if (cfg.referralPreselect) {
      const ref = form.querySelector('#referral');
      if (ref) {
        [...ref.options].forEach(o => {
          if (o.text.trim().toLowerCase() === String(cfg.referralPreselect).trim().toLowerCase()) {
            o.selected = true;
          }
        });
      }
    }

    // Service lock OR preselect
    const serviceWrap = form.querySelector('.service-select-wrap');
    const select = form.querySelector('#serviceType');

    if (cfg.lockService && serviceWrap) {
      // Replace the select with a hidden field + a visible pill
      const lockedVal = String(cfg.lockService);
      const hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = 'service_type';
      hidden.value = lockedVal;

      const pill = document.createElement('div');
      pill.setAttribute('aria-label', 'Selected service');
      pill.style.cssText = 'display:flex;align-items:center;gap:.5rem;padding:.9rem .95rem;border:1px solid var(--zenith-border);border-radius:10px;background:#f8fafc;color:#0f172a;font-weight:600;';
      pill.textContent = lockedVal;

      serviceWrap.innerHTML = '';
      serviceWrap.appendChild(pill);
      serviceWrap.appendChild(hidden);
    } else if (cfg.preselectService && select) {
      [...select.options].forEach(o => {
        if (o.text.trim().toLowerCase() === String(cfg.preselectService).trim().toLowerCase()) {
          o.selected = true;
        }
      });
    }

    // Extra hidden fields (e.g., campaign, page tag)
    if (cfg.hiddenFields && typeof cfg.hiddenFields === 'object') {
      Object.entries(cfg.hiddenFields).forEach(([name, val]) => {
        const h = document.createElement('input');
        h.type = 'hidden';
        h.name = name;
        h.value = String(val);
        form.appendChild(h);
      });
    }
  }

// ... rest of your hero.js remains the same ...
