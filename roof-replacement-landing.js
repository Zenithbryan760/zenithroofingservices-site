(() => {
  "use strict";

  const form = document.getElementById("ad-estimate-form");
  if (!form) return;

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

  const encodePhoto = async (file, index) => {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.78));
    if (!blob) throw new Error("Could not prepare photo");
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return {
      filename: `roof-photo-${index + 1}.jpg`,
      type: "image/jpeg",
      content: String(dataUrl).split(",")[1]
    };
  };

  const preparePhotos = async () => {
    const input = form.querySelector('input[name="photos"]');
    const files = Array.from(input?.files || []);
    if (files.length > 3) throw new Error("Please select no more than 3 photos.");
    const attachments = await Promise.all(files.map(encodePhoto));
    const estimatedBytes = attachments.reduce((sum, photo) => sum + Math.ceil(photo.content.length * 0.75), 0);
    if (estimatedBytes > 4500000) throw new Error("The photos are too large. Please choose fewer photos.");
    return attachments;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    form.classList.add("has-errors");
    if (!form.reportValidity()) return;

    let token = "";
    if (window.grecaptcha && typeof window.grecaptcha.getResponse === "function") {
      token = window.grecaptcha.getResponse() || "";
    }
    if (!token) {
      setMessage("Please complete the reCAPTCHA before submitting.", "error");
      return;
    }

    const fd = new FormData(form);
    let photoAttachments = [];
    try {
      photoAttachments = await preparePhotos();
    } catch (photoError) {
      setMessage(photoError.message, "error");
      return;
    }
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
      photo_attachments: photoAttachments,
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
      if (window.grecaptcha) window.grecaptcha.reset();
      setMessage("Thank you. Your request was sent to Zenith Roofing Services.", "success");
    } catch (error) {
      console.error(error);
      setMessage("We couldn’t send the form. Please call 619-494-1122 so we can help.", "error");
    } finally {
      button.disabled = false;
      button.textContent = "Request My Free Estimate";
    }
  });
})();
