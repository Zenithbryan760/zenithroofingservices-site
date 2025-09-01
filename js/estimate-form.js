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
    s.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    s.async = true; s.defer = true;
    s.setAttribute('data-zenith-recaptcha', '1');
    document.head.appendChild(s);
  }
  window._recaptchaOnLoad = function () {
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

  // --- ZIP -> CITY autofill (simple) ---
  function bindZipToCity() {
    const zipInput  = document.getElementById('zip');
    const cityInput = document.getElementById('city');
    if (!zipInput || !cityInput || zipInput._zipBound) return;
    zipInput._zipBound = true;

    async function maybeFill() {
      const z = (zipInput.value || '').trim().slice(0,5);
      if (z.length !== 5 || !/^\d{5}$/.test(z)) return;
      try {
        const res = await fetch(`https://api.zippopotam.us/us/${z}`);
        if (!res.ok) return;
        const json = await res.json();
        const place = json.places?.[0];
        if (place && !cityInput.value) {
          cityInput.value = place['place name'] || '';
          const st = document.getElementById('state');
          if (st && !st.value) st.value = place['state abbreviation'] || '';
        }
      } catch {}
    }

    zipInput.addEventListener('input',  maybeFill);
    zipInput.addEventListener('change', maybeFill);
    maybeFill();
  }

  // --- VALIDATION UI helpers ---
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
    let note = group.querySelector('.field-error');
    if (!note) {
      note = document.createElement('div');
      note.className = 'field-error';
      note.setAttribute('role', 'alert');
      input.setAttribute('aria-invalid', 'true');
      group.appendChild(note);
    }
    note.textContent = message || 'Please check this field.';
  }

  // show red on blur and remove as user fixes
  function wireLiveValidation(form) {
    const els = form.querySelectorAll('input[required], select[required], textarea[required]');
    els.forEach(el => {
      el.addEventListener('blur', () => {
        if (el.checkValidity()) {
          el.closest('.form-group')?.classList.remove('has-error');
          el.removeAttribute('aria-invalid');
          el.closest('.form-group')?.querySelector('.field-error')?.remove();
        } else {
          showFieldError(el);
        }
      });
      el.addEventListener('input', () => {
        if (el.checkValidity()) {
          el.closest('.form-group')?.classList.remove('has-error');
          el.removeAttribute('aria-invalid');
          el.closest('.form-group')?.querySelector('.field-error')?.remove();
        }
      });
    });
  }

  // --- SUBMIT ---
  async function submitHandler(e) {
    e.preventDefault();
    const form = e.currentTarget;
    clearErrors(form);

    // Client-side validity
    let anyInvalid = false;
    form.querySelectorAll('input[required], select[required], textarea[required]').forEach(el => {
      if (!el.checkValidity()) { showFieldError(el); anyInvalid = true; }
    });
    if (anyInvalid) {
      const box = ensureErrorSummary(form);
      box.textContent = 'Please fill in the required fields highlighted below.';
      box.classList.add('show');
      return;
    }

    // Build payload
    const fd = new FormData(form);
    const data = {
      first_name:  (fd.get("first_name") || "").trim(),
      last_name:   (fd.get("last_name")  || "").trim(),
      phone:       (fd.get("phone")      || "").trim(),
      email:       (fd.get("email")      || "").trim(),
      street_address: (fd.get("street_address") || "").trim(),
      city:        (fd.get("city")       || "").trim(),
      state:       (fd.get("state")      || "").trim(),
      zip:         (fd.get("zip")        || "").trim(),
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
        location.assign(redirect);
      } else {
        alert("Thanks! We received your request and will contact you soon.");
        form.reset();
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again.");
    } finally {
      if (submitBtn) { submitBtn.textContent = originalText; submitBtn.disabled = false; }
    }
  }

  function initEstimateFormUniversal() {
    const form = document.getElementById('estimate-form');
    if (!form) return;
    bindPhoneMask();
    bindZipToCity();
    wireLiveValidation(form);
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
