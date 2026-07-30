(() => {
  "use strict";

  const form = document.getElementById("ad-estimate-form");
  if (!form) return;

  let recaptchaId = null;
  window.onRoofReplacementRecaptchaLoaded = () => {
    const holder = document.getElementById("roof-replacement-recaptcha");
    if (!holder || !window.grecaptcha || recaptchaId !== null) return;
    recaptchaId = window.grecaptcha.render(holder, {
      sitekey: holder.dataset.sitekey,
      "expired-callback": () => {
        setMessage("reCAPTCHA expired. Please check the box again.", "error");
      },
      "error-callback": () => {
        setMessage("reCAPTCHA could not load. Please refresh the page and try again.", "error");
      }
    });
  };

  const message = form.querySelector(".form-message");
  const button = form.querySelector('button[type="submit"]');
  const params = new URLSearchParams(location.search);
  const campaignKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid"];

  campaignKeys.forEach((name) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = params.get(name) || "";
    form.appendChild(input);
  });

  const event = (name, details = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ...details });
  };

  document.querySelectorAll(".track-call").forEach((link) => {
    link.addEventListener("click", () => event("roof_replacement_phone_click", { phone: "6194941122" }));
  });

  document.querySelectorAll(".track-financing").forEach((link) => {
    link.addEventListener("click", () => event("wisetack_prequal_click", { page_path: location.pathname }));
  });

  const setMessage = (text, type) => {
    message.textContent = text;
    message.className = `form-message ${type}`;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    form.classList.add("has-errors");
    if (!form.reportValidity()) return;

    let token = "";
    if (window.grecaptcha && typeof window.grecaptcha.getResponse === "function") {
      token = recaptchaId !== null
        ? window.grecaptcha.getResponse(recaptchaId) || ""
        : "";
    }
    if (!token) {
      setMessage("Please complete the reCAPTCHA before submitting.", "error");
      return;
    }

    const fd = new FormData(form);
    const description = [
      (fd.get("description") || "").trim(),
      `Campaign: ${fd.get("utm_campaign") || "not provided"}`,
      `Keyword: ${fd.get("utm_term") || "not provided"}`,
      `GCLID: ${fd.get("gclid") || "not provided"}`
    ].filter(Boolean).join("\n");

    const payload = {
      first_name: (fd.get("first_name") || "").trim(),
      last_name: (fd.get("last_name") || "").trim(),
      phone: (fd.get("phone") || "").trim(),
      email: (fd.get("email") || "").trim(),
      street_address: (fd.get("street_address") || "").trim(),
      city: (fd.get("city") || "").trim(),
      state: "CA",
      zip: (fd.get("zip") || "").trim(),
      service_type: "Roof Replacement",
      referral_source: "Google Search Ads",
      description,
      recaptcha_token: token,
      page: location.href
    };

    button.disabled = true;
    button.textContent = "Submitting…";
    setMessage("Sending your request…", "success");

    try {
      const response = await fetch("/.netlify/functions/jn-create-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const responseText = await response.text();
      if (!response.ok) throw new Error(responseText || "Submission failed");

      event("roof_replacement_lead", {
        page_path: location.pathname,
        campaign: fd.get("utm_campaign") || "",
        keyword: fd.get("utm_term") || ""
      });
      if (typeof window.gtag === "function") {
        window.gtag("event", "conversion", {
          send_to: "AW-574510700/C2wlCJGW2NgcEOys-ZEC"
        });
      }
      form.reset();
      form.classList.remove("has-errors");
      setMessage("Thank you. Your request was sent to Zenith Roofing Services.", "success");
    } catch (error) {
      console.error(error);
      let detail = "";
      try {
        const parsed = JSON.parse(error.message);
        detail = parsed.message || parsed.error || "";
      } catch (_) {}
      setMessage(
        detail
          ? `We couldn’t send the form: ${detail}`
          : "We couldn’t send the form. Please call 619-494-1122 so we can help.",
        "error"
      );
    } finally {
      // A reCAPTCHA v2 token is single-use and can also expire. Reset after
      // every attempt so a retry can never resend a stale token.
      if (window.grecaptcha && recaptchaId !== null) {
        window.grecaptcha.reset(recaptchaId);
      }
      button.disabled = false;
      button.textContent = "Request My Free Estimate";
    }
  });
})();
