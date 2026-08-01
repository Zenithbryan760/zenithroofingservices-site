/* /js/loader.js — shared HTML partial loader */
(async () => {
  const scriptSrcExists = (src) => {
    try {
      const abs = new URL(src, location.href).href;
      return [...document.querySelectorAll('script[src]')]
        .some(s => new URL(s.getAttribute('src'), location.href).href === abs);
    } catch { return false; }
  };

  async function loadScript(src) {
    if (scriptSrcExists(src)) return;
    await new Promise(resolve => {
      const s = document.createElement('script');
      s.src = src;
      s.defer = true;
      s.onload = s.onerror = resolve;
      document.head.appendChild(s);
    });
  }

  async function runScriptsSequentially(scripts) {
    for (const n of scripts) {
      const src = n.getAttribute('src');
      if (src && scriptSrcExists(src)) continue;
      const s = document.createElement('script');
      for (const { name, value } of [...n.attributes]) s.setAttribute(name, value);
      if (!src) s.textContent = n.textContent || '';
      const shouldAwait = !!src && !s.hasAttribute('async');
      const p = new Promise(resolve => { s.onload = s.onerror = resolve; });
      (document.head || document.documentElement).appendChild(s);
      if (shouldAwait) await p;
    }
  }

  await loadScript('/js/interior-service-premium.js?v=1');

  const slots = [...document.querySelectorAll('[data-include]')];
  await Promise.all(slots.map(async slot => {
    const url = slot.getAttribute('data-include');
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const wrap = document.createElement('div');
      wrap.innerHTML = (await res.text()).trim();
      const scripts = [...wrap.querySelectorAll('script')];
      scripts.forEach(s => s.remove());
      const parent = slot.parentNode;
      [...wrap.childNodes].forEach(n => parent.insertBefore(n, slot));
      await runScriptsSequentially(scripts);
      slot.remove();
    } catch (err) {
      console.error('Include failed:', url, err);
    }
  }));

  try {
    await loadScript('/js/header.js');
    if (window.ZenithHeader?.init) window.ZenithHeader.init();
  } catch (e) {
    console.debug('Post-include init skipped:', e);
  }

  try {
    document.dispatchEvent(new CustomEvent('includes:ready'));
    window.dispatchEvent(new Event('includes:ready'));
  } catch {
    document.dispatchEvent(new Event('includes:ready'));
    window.dispatchEvent(new Event('includes:ready'));
  }
})();
