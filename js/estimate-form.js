/* js/estimate-form.js
   Standalone logic for the Estimate Form:
   - Smooth-scroll + legacy #estimate anchor handling
   - Client-side validation & error summary
   - Phone auto-format (US)
   - Optional reCAPTCHA v2 Invisible (if site key present)
   - POST to /.netlify/functions/jn-create-lead (JSON)
   - Graceful success/reset
------------------------------------------------------------------ */
(() => {
  'use strict';

  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
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

  const showError = (form, msg) => {
    const box = ensureErrorBox(form);
    box.hidden = false;
    box.textContent = msg;
  };

  const hideError = (form) => {
    const box = $('.form-error-summary', form);
    if (box) { box.hidden = true; box.textContent = ''; }
  };

  const setLoading = (form, on) => {
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    if (on) {
      btn.dataset.prev = btn.textContent;
      btn.textContent = 'Submitting…';
      btn.disabled = true;
    } else {
      btn.textContent = btn.dataset.prev || 'Submit';
      btn.disabled = false;
    }
  };

  // ---------- Legacy #estimate anchor behavior ----------
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href="#estimate"]');
    if (!a) return;
    e.preventDefault();
    const target = document.querySelector('#estimate-form, #estimate');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      location.href = '/#estimate-form';
    }
  });

  if (location.hash === '#estimate') {
    const target = document.querySelector('#estimate-form, #estimate');
    if (target) {
      setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
    } else {
      location.replace('/#estimate-form');
    }
  }

  // ---------- reCAPTCHA (optional) ----------
  // If a sitekey is provided on #recaptcha-container, render an invisible widget
  let recaptchaWidgetId = null;
  function renderRecaptcha() {
    const el = document.getElementById('recaptcha-container');
    if (!el) return;
    const sitekey = el.getAttribute('data-sitekey') || '';
    if (!sitekey || !window.grecaptcha || typeof window.grecaptcha.render !== 'function') return;
    try {
      recaptchaWidgetId = window.grecaptcha.render(el, { sitekey, size: 'invisible' });
    } catch (_) { /* ignore */ }
  }
  // Try to render once script is ready
  window.addEventListener('load', renderRecaptcha);

  // ---------- Main init ----------
  function init() {
    const form = document.getElementById('estimate-form');
    if (!form) return;

    // Live field hygiene
    const phone = $('#phone', form);
    if (phone) {
      phone.addEventListener('input', () => { phone.value = formatPhone(phone.value); });
    }

    const zip = $('#zip', form);
    if (zip) {
      zip.addEventListener('input', () => { zip.value = digits(zip.value).slice(0,5); });
    }

    // Submit handler
    form.addEventListener('submit', async (evt) => {
      evt.preventDefault();
      hideError(form);

      // Basic validation (required + minimal checks)
      const required = $$('[required]', form);
      let invalid = [];
      required.forEach((el) => {
        const ok = !!(el.value && el.value.trim());
        el.classList.toggle('is-invalid', !ok);
        el.setAttribute('aria-invalid', String(!ok));
        if (!ok) invalid.push(el);
      });

      // Phone digits length check (>=10)
      if (phone) {
        const ok = digits(phone.value).length >= 10;
        phone.classList.toggle('is-invalid', !ok);
        phone.setAttribute('aria-invalid', String(!ok));
        if (!ok && !invalid.includes(phone)) invalid.push(phone);
      }

      // ZIP 5 digits
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

      // Get reCAPTCHA token (if available)
      let recaptcha_token = '';
      try {
        if (window.grecaptcha && typeof window.grecaptcha.execute === 'function' && recaptchaWidgetId !== null) {
          recaptcha_token = await window.grecaptcha.execute(recaptchaWidgetId, { action: 'submit' });
        } else {
          // v2 fallback textarea (some themes inject it)
          const t = document.querySelector('textarea[name="g-recaptcha-response"]');
          if (t && t.value) recaptcha_token = t.value;
        }
      } catch (_) { /* ignore */ }

      // Build payload (mirrors your Netlify function expectations)
      const data = {
        first_name: $('#firstName', form)?.value?.trim() || '',
        last_name:  $('#lastName', form)?.value?.trim()  || '',
        phone:      $('#phone', form)?.value?.trim()     || '',
        email:      $('#email', form)?.value?.trim()     || '',
        street_address: $('#streetAddress', form)?.value?.trim() || '',
        city:       $('#city', form)?.value?.trim()      || '',
        state:      $('#state', form)?.value?.trim()     || '',
        zip:        $('#zip', form)?.value?.trim()       || '',
        service_type:   $('#serviceType', form)?.value?.trim()   || '',
        referral_source:$('#referral', form)?.value?.trim()      || '',
        description: $('#description', form)?.value?.trim()      || '',
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

        // Parse JSON if possible for richer messages
        let body = null;
        try { body = await res.json(); } catch (_) {}

        if (!res.ok) {
          const msg = (body && (body.error || body.message)) || `Submission failed (${res.status}). Please try again.`;
          showError(form, msg);
          return;
        }

        // Success: clear form, reset captcha, small confirmation
        form.reset();
        $$('[aria-invalid="true"]', form).forEach(el => {
          el.classList.remove('is-invalid');
          el.setAttribute('aria-invalid', 'false');
        });
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

  // Public init (safe to call multiple times)
  window.ZenithEstimateForm = window.ZenithEstimateForm || { init };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
