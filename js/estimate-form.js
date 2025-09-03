(function () {
  const FN_URL = '/.netlify/functions/jn-create-lead';
  let recaptchaId = null;

  const $ = (s, r = document) => r.querySelector(s);
  const cleanDigits = (v = '') => v.replace(/\D+/g, '');

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
  }
  function hideError(form) {
    const box = $('.form-error-summary', form);
    if (box) box.style.display = 'none';
  }

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
    if (recaptchaId != null) return; // already rendered
    const sitekey = holder.getAttribute('data-sitekey');
    if (!sitekey) return;
    try { recaptchaId = grecaptcha.render(holder, { sitekey }); } catch {}
  }

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!validate(form)) return;

    // reCAPTCHA token (required by your function)
    let token = '';
    if (window.grecaptcha?.getResponse && recaptchaId != null) {
      token = grecaptcha.getResponse(recaptchaId) || '';
    }
    if (!token) { showError(form, 'Please complete the reCAPTCHA.'); return; }

    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    payload.phone = cleanDigits(payload.phone);
    payload.recaptcha_token = token;
    payload.page = location.href;

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
