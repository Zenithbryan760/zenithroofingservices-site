<!-- js/estimate-form.js -->
<script>
(function () {
  const RECAPTCHA_SITEKEY = '6LclaJ4rAAAAAEMe8ppXrEJvIgLeFVxgmkq4DBrI';

  // --- helper to find config wrapper that survives includes ---
  function getContextEl() {
    // Prefer an outer wrapper you place around the include:
    // <section data-estimate-context data-category="Pitched Roof" ...>
    return document.querySelector('[data-estimate-context]') ||
           document.body; // fallback
  }

  // --- Lazy-load reCAPTCHA ---
  function ensureRecaptchaScript() {
    if (document.querySelector('script[data-zenith-recaptcha]')) return;
    const s = document.createElement('script');
    s.src = 'https://www.google.com/recaptcha/api.js?onload=recaptchaOnload&render=explicit';
    s.async = true; s.defer = true; s.setAttribute('data-zenith-recaptcha','1');
    document.head.appendChild(s);
  }
  window.recaptchaOnload = function() {
    const slot = document.getElementById('recaptcha-slot');
    if (slot && !slot.dataset.rendered && window.grecaptcha) {
      window._recaptchaWidgetId = grecaptcha.render(slot, {
        sitekey: RECAPTCHA_SITEKEY, theme: 'light', size: 'normal'
      });
      slot.dataset.rendered = '1';
    }
  };
  function setupLazyRecaptcha(form) {
    const trigger = () => { ensureRecaptchaScript(); obs && obs.disconnect(); form.removeEventListener('focusin', trigger); };
    const obs = ('IntersectionObserver' in window)
      ? new IntersectionObserver((es)=>{ if (es.some(e=>e.isIntersecting)) trigger(); }, { rootMargin:'300px' })
      : null;
    if (obs) obs.observe(form);
    form.addEventListener('focusin', trigger, { once:true });
  }

  // --- PHONE MASK ---
  function bindPhoneMask() {
    const el = document.getElementById('phone');
    if (!el || el._masked) return;
    el._masked = true;
    el.setAttribute('maxlength', '14');
    const fmt = v => {
      const d = (v || '').replace(/\D/g, '').slice(0, 10);
      if (!d) return '';
      if (d.length < 4) return `(${d}`;
      if (d.length < 7) return `(${d.slice(0,3)}) ${d.slice(3)}`;
      return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
    };
    el.addEventListener('input', e => { e.target.value = fmt(e.target.value); });
    el.addEventListener('blur', e => {
      const len = e.target.value.replace(/\D/g, '').length;
      e.target.setCustomValidity(len === 0 || len === 10 ? '' : 'Enter a 10-digit phone number');
    });
  }

  // --- ZIP → CITY ---
  function bindZipToCity() {
    const zipInput  = document.getElementById('zip');
    const cityInput = document.getElementById('city');
    if (!zipInput || !cityInput || zipInput._zipBound) return;
    zipInput._zipBound = true;

    const cache = {};
    cityInput.addEventListener('input', () => { cityInput.dataset.autofilled = ''; });

    async function lookup(zip5) {
      if (cache[zip5]) return cache[zip5];
      const res = await fetch('https://api.zippopotam.us/us/' + zip5);
      if (!res.ok) throw new Error('zip lookup failed');
      const data = await res.json();
      const place = data.places && data.places[0];
      const city  = place ? place['place name'] : '';
      cache[zip5] = city;
      return city;
    }

    async function maybeFill() {
      const digits = (zipInput.value || '').replace(/\D/g, '');
      if (!(digits.length === 5 || digits.length === 9)) return;
      try {
        const city = await lookup(digits.slice(0,5));
        const canOverwrite = !cityInput.value || cityInput.dataset.autofilled === '1';
        if (canOverwrite) {
          cityInput.value = city || '';
          cityInput.dataset.autofilled = '1';
        }
      } catch {}
    }

    zipInput.addEventListener('input',  maybeFill);
    zipInput.addEventListener('change', maybeFill);
    maybeFill();
  }

  // --- VALIDATION ---
  function ensureErrorSummary(form) {
    let box = form.querySelector('.error-summary');
    if (!box) {
      box = document.createElement('div');
      box.className = 'error-summary';
      box.setAttribute('role', 'alert');
      box.setAttribute('aria-live', 'assertive');
      const firstRow = form.querySelector('.form-row');
      (firstRow?.parentNode || form).insertBefore(box, firstRow);
    }
    return box;
  }
  function clearErrors(form) {
    form.querySelectorAll('.form-group.has-error').forEach(g => g.classList.remove('has-error'));
    form.querySelectorAll('.field-error').forEach(n => n.remove());
    const box = form.querySelector('.error-summary');
    if (box) { box.textContent = ''; box.classList.remove('show'); }
  }
  function showFieldError(input, message) {
    const group = input.closest('.form-group') || input.parentElement;
    if (!group) return;
    group.classList.add('has-error');
    if (!group.querySelector('.field-error')) {
      const note = document.createElement('div');
      note.className = 'field-error';
      note.textContent = message;
      group.appendChild(note);
    }
  }
  function getMessageFor(input) {
    if (input.validity.valueMissing) return 'This field is required.';
    if (input.id === 'email' && input.validity.typeMismatch) return 'Enter a valid email address.';
    if (input.id === 'phone' && input.validity.patternMismatch) return 'Use format: (555) 123-4567';
    if (input.id === 'zip'   && input.validity.patternMismatch) return 'Enter a 5-digit ZIP (or ZIP+4).';
    return 'Please check this field.';
  }
  function validateForm(form) {
    clearErrors(form);
    const required = Array.from(form.querySelectorAll('[required]'));
    const invalid = required.filter(el => !el.checkValidity());
    if (invalid.length) {
      const box = ensureErrorSummary(form);
      box.textContent = 'Please fix the highlighted fields. Photos are optional; all other fields are required.';
      box.classList.add('show');
      invalid.forEach(el => showFieldError(el, getMessageFor(el)));
      invalid[0].focus();
      return false;
    }
    return true;
  }

  // --- SUBMIT ---
  async function submitHandler(e) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!validateForm(form)) return;

    // Honeypot check
    if ((form.querySelector('input[name="website"]')?.value || '').trim()) {
      // likely a bot — silently succeed
      form.reset(); return;
    }

    // reCAPTCHA required
    let token = '';
    if (window.grecaptcha && typeof window.grecaptcha.getResponse === 'function') {
      if (typeof window._recaptchaWidgetId !== 'undefined') {
        token = window.grecaptcha.getResponse(window._recaptchaWidgetId) || '';
      }
      if (!token) {
        const t = document.querySelector('textarea[name="g-recaptcha-response"]');
        if (t && t.value) token = t.value.trim();
      }
    }
    if (!token) {
      const box = ensureErrorSummary(form);
      box.textContent = 'Please complete the reCAPTCHA before submitting.';
      box.classList.add('show');
      return;
    }

    const fd = new FormData(form);
    const data = {
      first_name: (fd.get("first_name") || "").trim(),
      last_name:  (fd.get("last_name")  || "").trim(),
      phone:      (fd.get("phone")      || "").trim(),
      email:      (fd.get("email")      || "").trim(),
      street_address: (fd.get("street_address") || "").trim(),
      city:       (fd.get("city")       || "").trim(),
      state:      (fd.get("state")      || "").trim(),
      zip:        (fd.get("zip")        || "").trim(),
      service_type:    fd.get("service_type")    || "",
      referral_source: fd.get("referral_source") || "",
      description:     (fd.get("description")    || "").trim(),
      page:            (fd.get("page")           || "").trim(),
      category:        (fd.get("category")       || "").trim()
    };

    const submitBtn = form.querySelector('#est-submit');
    const originalText = submitBtn ? submitBtn.textContent : null;
    if (submitBtn) { submitBtn.textContent = "Submitting…"; submitBtn.disabled = true; }

    try {
      const res = await fetch("/.netlify/functions/jn-create-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const text = await res.text();
      if (!res.ok) {
        console.error("JobNimbus error:", text);
        alert("Sorry, there was a problem submitting your request.");
        return;
      }

      const ctx = getContextEl();
      const redirect = ctx?.dataset.redirect || ctx?.dataset.thanks || "";
      if (redirect) {
        window.location.href = redirect;
      } else {
        alert("Thanks! Your request has been submitted.");
      }

      form.reset();
      if (window.grecaptcha && typeof window.grecaptcha.reset === "function" &&
          typeof window._recaptchaWidgetId !== "undefined") {
        window.grecaptcha.reset(window._recaptchaWidgetId);
      } else {
        const t = document.querySelector('textarea[name="g-recaptcha-response"]');
        if (t) t.value = '';
      }
      clearErrors(form);
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again.");
    } finally {
      if (submitBtn && originalText) { submitBtn.textContent = originalText; submitBtn.disabled = false; }
    }
  }

  // --- INIT (universal) ---
  function initEstimateFormUniversal() {
    const form = document.getElementById('estimate-form');
    if (!form || form._bound) return;
    form._bound = true;

    // Fill hidden context
    const pageInput = form.querySelector('input[name="page"]');
    const catInput  = form.querySelector('input[name="category"]');
    if (pageInput) pageInput.value = location.pathname || '';

    const ctx = getContextEl();
    if (catInput) catInput.value = ctx?.dataset.category || document.body.dataset.category || '';

    // Optional config via data- attrs on the context wrapper
    const title = ctx?.dataset.title;
    const button = ctx?.dataset.button;
    const serviceDefault = ctx?.dataset.service; // e.g. "Roof Replacement"

    if (title) {
      const h = document.getElementById('est-title');
      if (h) h.textContent = title;
    }
    if (button) {
      const b = document.getElementById('est-submit');
      if (b) b.textContent = button;
    }
    if (serviceDefault) {
      const sel = document.getElementById('serviceType');
      if (sel) {
        const opt = Array.from(sel.options).find(o => o.textContent.trim().toLowerCase() === serviceDefault.trim().toLowerCase());
        if (opt) { sel.value = opt.textContent; }
      }
    }

    bindPhoneMask();
    bindZipToCity();
    setupLazyRecaptcha(form);

    form.addEventListener('submit', submitHandler);
  }

  // Export & auto-run
  window.initEstimateFormUniversal = initEstimateFormUniversal;
  window.initEstimateForm = window.initEstimateForm || initEstimateFormUniversal;

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('estimate-form')) initEstimateFormUniversal();
  });
})();
</script>
