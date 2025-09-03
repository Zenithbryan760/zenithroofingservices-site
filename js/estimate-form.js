/* =========================================================
   Safe to include on any page. Looks for #estimate-form.
   ========================================================= */

(() => {
  'use strict';

  // ---------- Tiny helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const debounce = (fn, wait = 300) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  };

  // Create (or get) a compact error box near the submit button
  function ensureErrorSummary(form) {
    let box = $('.form-error-summary', form);
    if (!box) {
      box = document.createElement('div');
      box.className = 'form-error-summary';
      box.style.cssText = 'margin: 10px 0; font-size: 0.95rem; line-height: 1.3; color: #b00020; display: none; padding: 10px; background: #ffe6e6; border-radius: 4px;';
      const submitRow = form.querySelector('button[type="submit"]')?.parentElement || form;
      submitRow.parentNode.insertBefore(box, submitRow);
    }
    return box;
  }
  
  function showError(form, msg) {
    const box = ensureErrorSummary(form);
    box.textContent = msg;
    box.style.display = 'block';
    // Scroll to error
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      'streetAddress','city','state','zip',
      'serviceType', 'referral', 'description'
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

  // ---------- ZIP → City/State autofill ----------
  async function fillCityStateFromZip(zip, form) {
    if (!/^\d{5}$/.test(zip)) return;
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`, { mode: 'cors' });
      if (!res.ok) return;
      const data = await res.json();
      const place = (data.places && data.places[0]) || null;
      if (!place) return;
      const city = place['place name'] || '';
      const stateAbbr = place['state abbreviation'] || '';

      const cityEl = $('#city', form);
      if (cityEl && !cityEl.value.trim()) {
        cityEl.value = city;
      }
      const stateEl = $('#state', form);
      if (stateEl && !stateEl.readOnly && stateAbbr) {
        stateEl.value = stateAbbr;
      }
    } catch (_) { /* silent */ }
  }

  // ---------- reCAPTCHA render ----------
  function renderRecaptchaIfPossible() {
    const host = window.grecaptcha && typeof window.grecaptcha.render === 'function';
    const container = document.getElementById('recaptcha') || document.querySelector('.g-recaptcha');
    if (!host || !container) return;

    // Avoid duplicate render
    if (typeof window._recaptchaWidgetId !== 'undefined') return;

    const sitekey = container.getAttribute('data-sitekey') || window.RECAPTCHA_SITE_KEY || '';
    if (!sitekey) return;

    try {
      window._recaptchaWidgetId = window.grecaptcha.render(container, { sitekey });
    } catch (e) {
      console.error('reCAPTCHA render error:', e);
    }
  }

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

    // Collect reCAPTCHA token
    let token = '';
    if (window.grecaptcha && typeof window.grecaptcha.getResponse === 'function') {
      if (typeof window._recaptchaWidgetId !== 'undefined') {
        token = window.grecaptcha.getResponse(window._recaptchaWidgetId) || '';
      }
    }
    
    // Fallback for hidden textarea
    if (!token) {
      const t = document.querySelector('textarea[name="g-recaptcha-response"]');
      if (t && t.value) token = t.value.trim();
    }
    
    if (!token) {
      showError(form, 'Please complete the reCAPTCHA before submitting.');
      return;
    }

    // Build payload
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
      recaptcha_token: token,
      page: location.href
    };

    // Add hidden fields if any
    const hiddenFields = form.querySelectorAll('input[type="hidden"]');
    hiddenFields.forEach(field => {
      if (field.name && !data[field.name]) {
        data[field.name] = field.value;
      }
    });

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : null;
    if (submitBtn) { 
      submitBtn.textContent = 'Submitting…'; 
      submitBtn.disabled = true; 
    }

    try {
      const res = await fetch('/.netlify/functions/jn-create-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const text = await res.text();
      if (!res.ok) {
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

      // Success
      alert('Thanks! Your request has been submitted. We\'ll contact you shortly.');
      form.reset();
      hideError(form);

      // Reset reCAPTCHA
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

  // NEW: universal form config
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
      pill.style.cssText = 'display:flex;align-items:center;gap:.5rem;padding:.9rem .95rem;border:1px solid #d1d5db;border-radius:10px;background:#f8fafc;color:#0f172a;font-weight:600;';
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

    // Extra hidden fields
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

  // ---------- Boot ----------
  function attachBehaviors() {
    const form = document.getElementById('estimate-form');
    if (!form) return;

    // Apply per-page config if provided
    applyFormConfig(form);

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
    form.addEventListener('focusin', () => {
      renderRecaptchaIfPossible();
    }, { once: true });

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
