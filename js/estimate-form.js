/* js/estimate-form.js
   All-in-one logic for the Estimate Form (component-scoped only):
   - Normalizes miswired CTAs to a working form target (no edits elsewhere)
   - Smooth-scroll + legacy #estimate anchor handling
   - Client-side validation & error UI
   - Phone auto-format + ZIP guard
   - Optional reCAPTCHA v2 Invisible
   - POST to /.netlify/functions/jn-create-lead (JobNimbus + SendGrid)
------------------------------------------------------------------ */
(() => {
  'use strict';

  // ---------- Tiny helpers ----------
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const digits = (s) => (s || '').replace(/\D+/g, '');
  const formatPhone = (raw) => {
    const d = digits(raw).slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0,3)}) ${d.slice(3)}`;
    return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  };

  const ensureErrorBox = (form) => {
    let box = $('.form-error-summary', form);
    if (!box) {
      box = document.createElement('div');
      box.className = 'form-error-summary';
      form.insertBefore(box, form.querySelector('.form-row:last-of-type'));
    }
    return box;
  };
  const showError = (form, msg) => { const b = ensureErrorBox(form); b.hidden = false; b.textContent = msg; };
  const hideError = (form) => { const b = $('.form-error-summary', form); if (b) { b.hidden = true; b.textContent = ''; } };
  const setLoading = (form, on) => {
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    if (on) { btn.dataset.prev = btn.textContent; btn.textContent = 'Submitting…'; btn.disabled = true; }
    else { btn.textContent = btn.dataset.prev || 'Submit'; btn.disabled = false; }
  };

  // ---------- CTA normalizer (component-only) ----------
  // Goal: if a page includes this component, ANY “estimate” link on that page
  // will safely land on the local form; otherwise it sends to /#estimate-form.
  function normalizeEstimateLinks() {
    const hasForm = !!document.querySelector('#estimate-form');
    const toLocal = '#estimate-form';
    const toHome  = '/#estimate-form';

    // Patterns we correct (old links, or page paths that might 404)
    const patterns = [
      /^#estimate$/,              // old anchor
      /^\/#estimate$/,            // site-root old anchor
      /^#estimate-form$/,         // explicit anchor
      /^\/#estimate-form$/,       // explicit anchor at root
      /^\/services\/gutters\/?$/, // bad path that caused 404
      /^\/services\/gutters\/#estimate$/,
      /^\/services\/gutters\/#estimate-form$/
    ];

    $$('a[href]').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (patterns.some(rx => rx.test(href))) {
        a.setAttribute('href', hasForm ? toLocal : toHome);
      }
    });
  }

  // As a safety net, intercept clicks that match those patterns
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    const hasForm = !!document.querySelector('#estimate-form');

    const needsRedirect =
      /^#estimate$/.test(href) ||
      /^\/#estimate$/.test(href) ||
      /^#estimate-form$/.test(href) ||
      /^\/#estimate-form$/.test(href) ||
      /^\/services\/gutters\/?$/.test(href) ||
      /^\/services\/gutters\/#estimate$/.test(href) ||
      /^\/services\/gutters\/#estimate-form$/.test(href);

    if (!needsRedirect) return;

    e.preventDefault();
    const target = hasForm ? document.querySelector('#estimate-form, #estimate') : null;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      location.href = '/#estimate-form';
    }
  });

  // If someone lands with #estimate in the URL, scroll to the form on this page
  if (location.hash === '#estimate' || location.hash === '#estimate-form') {
    const target = document.querySelector('#estimate-form, #estimate');
    if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  // ---------- Optional reCAPTCHA v2 Invisible ----------
  let recaptchaWidgetId = null;
  function renderRecaptcha() {
    const el = document.getElementById('recaptcha-container');
    if (!el) return;
    const sitekey = el.getAttribute('data-sitekey') || '';
    if (!sitekey || !window.grecaptcha || typeof window.grecaptcha.render !== 'function') return;
    try { recaptchaWidgetId = window.grecaptcha.render(el, { sitekey, size: 'invisible' }); } catch (_) {}
  }
  window.addEventListener('load', renderRecaptcha);

  // ---------- Init ----------
  function init() {
    normalizeEstimateLinks(); // make all CTAs on this page safe

    const form = document.getElementById('estimate-form');
    if (!form) return;

    const phone = $('#phone', form);
    const zip   = $('#zip', form);

    if (phone) phone.addEventListener('input', () => { phone.value = formatPhone(phone.value); });
    if (zip)   zip.addEventListener('input', () => { zip.value = digits(zip.value).slice(0,5); });

    form.addEventListener('submit', async (evt) => {
      evt.preventDefault();
      hideError(form);

      // Required checks
      const required = $$('[required]', form);
      let invalid = [];
      required.forEach((el) => {
        const ok = !!(el.value && el.value.trim());
        el.classList.toggle('is-invalid', !ok);
        el.setAttribute('aria-invalid', String(!ok));
        if (!ok) invalid.push(el);
      });

      // Phone (10 digits)
      if (phone) {
        const ok = digits(phone.value).length >= 10;
        phone.classList.toggle('is-invalid', !ok);
        phone.setAttribute('aria-invalid', String(!ok));
        if (!ok && !invalid.includes(phone)) invalid.push(phone);
      }

      // ZIP (5 digits)
      if (zip) {
        const ok = /^\d{5}$/.test(zip.value);
        zip.classList.toggle('is-invalid', !ok);
        zip.setAttribute('aria-invalid', String(!ok));
        if (!ok && !invalid.includes(zip)) invalid.push(zip);
      }

      if (invalid.length) {
        showError(form, 'Please complete the required fields highlighted in red.');
        invalid[0].focus();
        return;
      }

      // reCAPTCHA token (if widget exists)
      let recaptcha_token = '';
      try {
        if (window.grecaptcha && typeof window.grecaptcha.execute === 'function' && recaptchaWidgetId !== null) {
          recaptcha_token = await window.grecaptcha.execute(recaptchaWidgetId, { action: 'submit' });
        } else {
          const t = document.querySelector('textarea[name="g-recaptcha-response"]');
          if (t && t.value) recaptcha_token = t.value;
        }
      } catch (_) {}

      // Build payload
      const data = {
        first_name:        $('#firstName', form)?.value?.trim() || '',
        last_name:         $('#lastName',  form)?.value?.trim() || '',
        phone:             $('#phone',     form)?.value?.trim() || '',
        email:             $('#email',     form)?.value?.trim() || '',
        street_address:    $('#streetAddress', form)?.value?.trim() || '',
        city:              $('#city', form)?.value?.trim() || '',
        state:             $('#state', form)?.value?.trim() || '',
        zip:               $('#zip',  form)?.value?.trim() || '',
        service_type:      $('#serviceType', form)?.value?.trim() || '',
        referral_source:   $('#referral', form)?.value?.trim() || '',
        description:       $('#description', form)?.value?.trim() || '',
        recaptcha_token,
        page: location.href
      };

      setLoading(form, true);
      try {
        const res = await fetch('/.netlify/functions/jn-create-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        let body = null;
        try { body = await res.json(); } catch (_) {}

        if (!res.ok) {
          const msg = (body && (body.error || body.message)) || `Submission failed (${res.status}). Please try again.`;
          showError(form, msg);
          return;
        }

        form.reset();
        $$('[aria-invalid="true"]', form).forEach(el => { el.classList.remove('is-invalid'); el.setAttribute('aria-invalid', 'false'); });
        if (window.grecaptcha && typeof window.grecaptcha.reset === 'function' && recaptchaWidgetId !== null) {
          window.grecaptcha.reset(recaptchaWidgetId);
        }
        hideError(form);
        alert('Thanks! Your request has been received. We’ll reach out shortly.');

      } catch (err) {
        console.error(err);
        showError(form, 'Network error. Please check your connection and try again.');
      } finally {
        setLoading(form, false);
      }
    });
  }

  // Public init (idempotent)
  window.ZenithEstimateForm = window.ZenithEstimateForm || { init };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
