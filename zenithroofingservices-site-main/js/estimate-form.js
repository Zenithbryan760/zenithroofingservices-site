(function () {
  const FN_URL = '/.netlify/functions/jn-create-lead';
  let recaptchaId = null;

  const $ = (s, r = document) => r.querySelector(s);
  const cleanDigits = (v = '') => v.replace(/\D+/g, '');
  const debounce = (fn, wait = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait); }; };

  function showError(form, msg) {
    let box = $('.form-error-summary', form);
    if (!box) {
      box = document.createElement('div');
      box.className = 'form-error-summary';
      box.style.margin = '10px 0';
      box.style.fontSize = '0.95rem';
      box.style.color = '#b00020';
      const submitRow = form.querySelector('button[type="submit"]')?.parentElement || form;
      submitRow.parentNode.insertBefore(box, submitRow);
    }
    box.textContent = msg;
    box.style.display = 'block';
    // mark error-visible so CSS can upgrade invalid fields to red if you use that pattern
    box.classList.add('show');
  }
  function hideError(form) {
    const box = $('.form-error-summary', form);
    if (box) { box.style.display = 'none'; box.classList.remove('show'); }
  }

  // ---- Enhancements ----

  // Phone masking: (###) ###-####
  function maskPhoneInput(e) {
    const input = e.target;
    const d = cleanDigits(input.value).slice(0, 10);
    let out = d;
    if (d.length > 6) out = `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
    else if (d.length > 3) out = `(${d.slice(0,3)}) ${d.slice(3)}`;
    else if (d.length > 0) out = `(${d}`;
    input.value = out;
  }

  // ZIP -> City/State autofill (doesn’t overwrite user-entered values)
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
      if (cityEl && !cityEl.value.trim()) cityEl.value = city;

      const stateEl = $('#state', form);
      if (stateEl && !stateEl.readOnly && stateAbbr) stateEl.value = stateAbbr;
    } catch (_) {}
  }

  // Prefill from page config (service type, referral, description placeholder, submit text)
  function prefillFromConfig(form) {
    const cfg = window.ESTIMATE_FORM_CONFIG || {};

    // --- Page-path → desired service (special-cases live here) ---
    function serviceFromPath() {
      const p = location.pathname.replace(/\/+$/, '/').toLowerCase();
      if (p.endsWith('/services/roof-repairs/roof-tune-up/') ||
          p.endsWith('/services/roof-repairs/roof-tune-up/index.html')) {
        return 'Roof Tune-Up';
      }
      return ''; // no special case, fall back below
    }

    // Service Type — default to “Other”; allow per-page override via path OR cfg.lockService
    const svc = $('#serviceType', form);
    if (svc) {
      const byPath = serviceFromPath(); // e.g., "Roof Tune-Up" on that page
      const desired = (cfg.lockService || byPath || 'Other').toLowerCase();

      let matched = null;
      [...svc.options].forEach(o => {
        const t = (o.textContent || o.value || '').toLowerCase();
        if (!matched && (t === desired || t.includes(desired))) matched = o.value || o.textContent;
      });
      if (matched) svc.value = matched;

      if (cfg.lockServiceLock === true) {
        svc.disabled = true;
        // ensure value still posts
        const hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = svc.name;
        hidden.value = svc.value;
        form.appendChild(hidden);
      }
    }

    // Referral preselect
    const ref = $('#referral', form);
    if (ref && cfg.referralPreselect) {
      const norm = cfg.referralPreselect.toLowerCase();
      const opt = [...ref.options].find(o => (o.textContent || '').toLowerCase() === norm);
      if (opt) ref.value = opt.value || opt.textContent;
    }

    // Description placeholder
    const desc = $('#description', form);
    if (desc && cfg.descriptionPlaceholder) desc.placeholder = cfg.descriptionPlaceholder;

    // Per-page submit button text (default = "Request Estimate")
    const btn = form.querySelector('button[type="submit"]');
    if (btn) {
      const defaultText = 'Request Estimate';
      btn.textContent = cfg.submitText || defaultText;
    }
  }

  // ---- Validation & submit ----

  function validate(form) {
    hideError(form);
    const need = ['firstName','lastName','phone','email','streetAddress','city','state','zip'];
    for (const id of need) {
      const el = $('#'+id, form);
      if (!el || !el.value.trim()) { showError(form,'Please fill out all required fields (*).'); el?.focus(); return false; }
    }
    const phone = cleanDigits($('#phone', form)?.value);
    if (phone.length < 10) { showError(form,'Please enter a valid phone number.'); $('#phone', form).focus(); return false; }
    const zip = $('#zip', form)?.value.trim();
    if (!/^\d{5}(-?\d{4})?$/.test(zip)) { showError(form,'Please enter a valid ZIP code.'); $('#zip', form).focus(); return false; }
    return true;
  }

  function renderRecaptcha() {
    const host = window.grecaptcha && typeof grecaptcha.render === 'function';
    const holder = document.getElementById('recaptcha') || document.querySelector('.g-recaptcha');
    if (!host || !holder) return;
    if (recaptchaId != null || holder.childElementCount > 0) return; // already rendered or auto-rendered
    const sitekey = holder.getAttribute('data-sitekey') || window.RECAPTCHA_SITE_KEY || '';
    if (!sitekey) return;
    try { recaptchaId = grecaptcha.render(holder, { sitekey }); } catch {}
  }

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!validate(form)) return;

    // reCAPTCHA token — support explicit render AND auto-render
    let token = '';
    if (window.grecaptcha?.getResponse) {
      token = (recaptchaId != null) ? grecaptcha.getResponse(recaptchaId) : grecaptcha.getResponse();
    }
    if (!token) {
      const t = document.querySelector('textarea[name="g-recaptcha-response"]');
      if (t && t.value) token = t.value.trim();
    }
    if (!token) { showError(form, 'Please complete the reCAPTCHA.'); return; }

    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    payload.phone = cleanDigits(payload.phone);
    payload.recaptcha_token = token;
    payload.page = location.href;

    /* ====== Auto-append page/source note to the customer's description ====== */
    const cfg = window.ESTIMATE_FORM_CONFIG || {};
    const labelFromConfig = cfg.lockService || cfg?.hiddenFields?.campaign;
    const labelFromDOM =
      document.querySelector('main h1')?.textContent ||
      document.querySelector('meta[property="og:title"]')?.content ||
      document.title;
    const slug = location.pathname.replace(/\/+$/,'').split('/').pop() || 'home';
    const labelFromSlug = slug.replace(/[-_]+/g,' ').replace(/\b\w/g, c => c.toUpperCase());
    const pageLabel = (labelFromConfig || labelFromDOM || labelFromSlug).trim();
    const sourceLine = `[Source: ${pageLabel} • ${location.pathname}]`;
    if (!/\[Source:/.test(payload.description || '')) {
      payload.description = `${(payload.description || '').trim()}\n\n${sourceLine}`;
    }
    /* ====== /Auto-append ====== */

    const btn = form.querySelector('button[type="submit"]');
    const txt = btn?.textContent;
    if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }

    try {
      const res = await fetch(FN_URL, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      let bodyText = await res.text();
      if (!res.ok) {
        try { const j = JSON.parse(bodyText); bodyText = j.error || j.message || bodyText; } catch {}
        showError(form, `Submission failed: ${bodyText}`);
        return;
      }
      alert('Thanks! Your request has been submitted.');
      form.reset();
      hideError(form);
      if (window.grecaptcha?.reset && recaptchaId != null) grecaptcha.reset(recaptchaId);
    } catch (err) {
      showError(form, 'Network error. Please try again.');
      console.error(err);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = txt; }
    }
  }

  function bindForm() {
    const form = document.getElementById('estimate-form');
    if (!form) return;

    // Phone mask
    const phone = $('#phone', form);
    if (phone) {
      phone.removeEventListener('input', maskPhoneInput);
      phone.addEventListener('input', maskPhoneInput);
    }

    // ZIP autofill (debounced + on blur)
    const zipEl = $('#zip', form);
    if (zipEl) {
      const trigger = debounce(() => {
        const v = (zipEl.value || '').trim().slice(0,5);
        if (/^\d{5}$/.test(v)) fillCityStateFromZip(v, form);
      }, 350);
      zipEl.addEventListener('input', trigger);
      zipEl.addEventListener('blur', () => {
        const v = (zipEl.value || '').trim().slice(0,5);
        if (/^\d{5}$/.test(v)) fillCityStateFromZip(v, form);
      });
    }

    // Prefill from page config
    prefillFromConfig(form);

    // Ensure the CTA actually submits
    const btn = form.querySelector('button[type="submit"]');
    if (btn && btn.type !== 'submit') btn.type = 'submit';

    // Unbind/rebind to avoid duplicates when includes re-run
    form.removeEventListener('submit', onSubmit);
    form.addEventListener('submit', onSubmit);

    // Render reCAPTCHA now (and again when focused just in case)
    renderRecaptcha();
    form.addEventListener('focusin', renderRecaptcha, { once: true });

    // Prevent hero overlays from stealing taps
    const overlay = document.querySelector('.hero-overlay');
    if (overlay) overlay.style.pointerEvents = 'none';
  }

  document.addEventListener('DOMContentLoaded', bindForm);
  window.addEventListener('includes:ready', bindForm);
  window.onRecaptchaLoaded = () => { renderRecaptcha(); bindForm(); };
})();
