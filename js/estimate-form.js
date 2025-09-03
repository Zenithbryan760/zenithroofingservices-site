/* js/estimate-form.js
   - Posts to '/.netlify/functions/jn-create-lead'
   - Uses your variable names (display_name, first_name, etc.)
   - Optional Invisible reCAPTCHA
   - Redirects to data-redirect / ESTIMATE_FORM_CONFIG.redirect / '/thank-you/'
   - Normalizes miswired CTAs to avoid 404s
-------------------------------------------------------------- */
(() => {
  'use strict';

  const FN_URL = '/.netlify/functions/jn-create-lead';

  // ---------- Helpers ----------
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const digits = (s) => (s || '').replace(/\D+/g, '');
  const normalizePhone = (raw = '') =>
    (String(raw).match(/\d/g) || []).join('').replace(/^1(?=\d{10}$)/, '');
  const splitName = (full = '') => {
    const t = full.trim().replace(/\s+/g, ' ');
    if (!t) return { first: '', last: '' };
    const parts = t.split(' ');
    if (parts.length === 1) return { first: parts[0], last: '' };
    return { first: parts.shift(), last: parts.join(' ') };
  };
  const ensureErrorBox = (form) => {
    let box = form.querySelector('.form-error-summary');
    if (!box) {
      box = document.createElement('div');
      box.className = 'form-error-summary';
      form.appendChild(box);
    }
    return box;
  };
  const showError = (form, msg) => { const b = ensureErrorBox(form); b.hidden = false; b.textContent = msg; };
  const hideError = (form) => { const b = form.querySelector('.form-error-summary'); if (b) { b.hidden = true; b.textContent = ''; } };
  const setLoading = (form, on) => {
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    if (on) { btn.dataset.prev = btn.textContent; btn.textContent = 'Submitting…'; btn.disabled = true; }
    else { btn.textContent = btn.dataset.prev || 'Submit'; btn.disabled = false; }
  };
  const formatUS = (raw) => {
    const d = digits(raw).slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0,3)}) ${d.slice(3)}`;
    return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  };

  // ---------- CTA safety (prevents 404s to non-existent pages) ----------
  function normalizeEstimateLinks() {
    const hasForm = !!document.querySelector('#estimate-form');
    const toLocal = '#estimate-form';
    const toHome  = '/#estimate-form';
    const patterns = [
      /^#estimate$/, /^\/#estimate$/,
      /^#estimate-form$/, /^\/#estimate-form$/,
      /^\/services\/gutters\/?$/, /^\/services\/gutters\/#estimate$/, /^\/services\/gutters\/#estimate-form$/
    ];
    $$('a[href]').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (patterns.some(rx => rx.test(href))) a.setAttribute('href', hasForm ? toLocal : toHome);
    });
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    const hasForm = !!document.querySelector('#estimate-form');
    const bad = /^#estimate$|^\/#estimate$|^#estimate-form$|^\/#estimate-form$|^\/services\/gutters\/?$|^\/services\/gutters\/#estimate$|^\/services\/gutters\/#estimate-form$/;
    if (!bad.test(href)) return;
    e.preventDefault();
    const t = hasForm ? document.querySelector('#estimate-form, #estimate') : null;
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else location.href = '/#estimate-form';
  });

  if (location.hash === '#estimate' || location.hash === '#estimate-form') {
    const t = document.querySelector('#estimate-form, #estimate');
    if (t) setTimeout(() => t.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  // ---------- Optional reCAPTCHA ----------
  let recaptchaWidgetId = null;
  function renderRecaptcha() {
    const el = document.getElementById('recaptcha-container');
    if (!el) return;
    const sitekey = el.getAttribute('data-sitekey') || '';
    if (!sitekey || !window.grecaptcha || typeof window.grecaptcha.render !== 'function') return;
    try { recaptchaWidgetId = window.grecaptcha.render(el, { sitekey, size: 'invisible' }); } catch {}
  }
  window.addEventListener('load', renderRecaptcha);

  // ---------- Init ----------
  function init() {
    normalizeEstimateLinks();

    const form = document.getElementById('estimate-form');
    if (!form || form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';

    const phone = $('#phone', form);
    const zip   = $('#zip', form);
    if (phone) phone.addEventListener('input', () => { phone.value = formatUS(phone.value); });
    if (zip)   zip.addEventListener('input', () => { zip.value = digits(zip.value).slice(0,5); });

    form.addEventListener('submit', async (evt) => {
      evt.preventDefault();
      hideError(form);

      // Name handling: supports either separate fields or a hidden 'name'
      const fullName =
        form.querySelector('[name="name"]')?.value ||
        [$('#firstName', form)?.value, $('#lastName', form)?.value].filter(Boolean).join(' ') || '';
      const { first, last } = splitName(fullName);

      // Required checks
      const required = [...form.querySelectorAll('[required]')];
      let invalid = [];
      required.forEach((el) => {
        const ok = !!(el.value && el.value.trim());
        el.classList.toggle('is-invalid', !ok);
        el.setAttribute('aria-invalid', String(!ok));
        if (!ok) invalid.push(el);
      });

      // Phone 10 digits
      const nPhone = normalizePhone($('#phone', form)?.value || '');
      if (!(nPhone && nPhone.length === 10)) {
        const p = $('#phone', form);
        if (p && !invalid.includes(p)) { p.classList.add('is-invalid'); p.setAttribute('aria-invalid','true'); invalid.push(p); }
      }

      // ZIP 5 digits
      const zipEl = $('#zip', form);
      if (zipEl && !/^\d{5}$/.test(zipEl.value || '')) {
        if (!invalid.includes(zipEl)) { zipEl.classList.add('is-invalid'); zipEl.setAttribute('aria-invalid','true'); invalid.push(zipEl); }
      }

      if (invalid.length) {
        showError(form, 'Please complete the required fields highlighted in red.');
        invalid[0].focus();
        return;
      }

      // reCAPTCHA token (optional)
      let recaptcha_token = '';
      try {
        if (window.grecaptcha && typeof window.grecaptcha.execute === 'function' && recaptchaWidgetId !== null) {
          recaptcha_token = await window.grecaptcha.execute(recaptchaWidgetId, { action: 'submit' });
        } else {
          const t = document.querySelector('textarea[name="g-recaptcha-response"]');
          if (t && t.value) recaptcha_token = t.value;
        }
      } catch {}

      // Description lines (mirrors your adapter)
      const descLines = [];
      const msg = $('#description', form)?.value?.trim();
      if (msg) descLines.push(msg);
      const serviceType = $('#serviceType', form)?.value?.trim() || '';
      if (serviceType) descLines.push(`Service Type: ${serviceType}`);
      const zipVal = $('#zip', form)?.value?.trim() || '';
      if (zipVal) descLines.push(`ZIP: ${zipVal}`);
      descLines.push(`Page: ${location.pathname}`);
      descLines.push('Note: Real-estate / third-party inspections are billed.');

      // Build payload (keys your function expects)
      const payload = {
        display_name: fullName || ($('#email', form)?.value || $('#phone', form)?.value) || 'Website Lead',
        first_name: $('#firstName', form)?.value?.trim() || first,
        last_name:  $('#lastName',  form)?.value?.trim() || last,
        phone:      $('#phone', form)?.value || '',
        email:      $('#email', form)?.value || '',
        street_address: $('#streetAddress', form)?.value || '',
        city:       $('#city', form)?.value || '',
        state:      $('#state', form)?.value || '',
        zip:        $('#zip',  form)?.value || '',
        description: descLines.join('\n'),
        service_type: serviceType,
        referral_source: $('#referral', form)?.value || document.referrer || '',
        page: location.href,
        recaptcha_token
      };

      setLoading(form, true);
      try {
        // Debug lines (optional while verifying):
        // console.log('POST →', FN_URL);
        // console.log('payload:', payload);

        const res = await fetch(FN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const text = await res.text();

        if (res.ok || res.status === 201) {
          // ====== SUCCESS (no alert, redirect instead) ======
          form.reset();
          [...form.querySelectorAll('[aria-invalid="true"]')].forEach(el => {
            el.classList.remove('is-invalid');
            el.setAttribute('aria-invalid', 'false');
          });
          if (window.grecaptcha && typeof window.grecaptcha.reset === 'function') {
            try { window.grecaptcha.reset(); } catch (_) {}
          }
          const block = form.closest('.estimate-form-block');
          const redirectTo =
            (window.ESTIMATE_FORM_CONFIG && window.ESTIMATE_FORM_CONFIG.redirect) ||
            (block && block.dataset && block.dataset.redirect) ||
            '/thank-you/';
          location.href = redirectTo;
          return;
        }

        // Error path: show returned message if possible
        try {
          const j = JSON.parse(text);
          showError(form, j.error || j.message || 'Something went wrong. Please call or text us.');
        } catch {
          showError(form, text || 'Something went wrong. Please call or text us.');
        }

      } catch (err) {
        console.error(err);
        showError(form, 'Network error. Please check your connection and try again.');
      } finally {
        setLoading(form, false);
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
