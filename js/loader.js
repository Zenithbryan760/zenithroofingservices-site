/* /js/loader.js — Lightweight HTML partial loader (ready for all pages)
   - Finds [data-include]
   - Inserts markup
   - Executes ALL nested <script> tags (inline + external)
   - Skips duplicate external scripts
   - Applies the shared Zenith premium interior design only to approved pages
   - Fires "includes:ready" on document AND window
*/
(async () => {
  const premiumInteriorPaths = new Set([
    '/services/',
    '/services/roof-repairs/',
    '/services/roof-repairs/roof-tune-up/',
    '/services/roof-repairs/tile-roof-repair/',
    '/services/roof-repairs/clay-tile-roof-repair/',
    '/services/roof-repairs/flat-roof-repair/',
    '/services/roof-repairs/skylight-repair/',
    '/services/roof-replacement/',
    '/services/residential/tile-lift-lay/',
    '/services/residential/asphalt-shingles/',
    '/services/commercial/',
    '/services/commercial/tpo/',
    '/services/commercial/torch-down/',
    '/services/commercial/silicone-coatings/',
    '/services/roof-inspection/',
    '/services/insurance-claims/',
    '/services/real-estate/',
    '/services/gutters/',
    '/reviews/'
  ]);

  function applyPremiumInteriorDesign() {
    let path = location.pathname.replace(/\/index\.html$/i, '/');
    if (!path.endsWith('/')) path += '/';
    if (!premiumInteriorPaths.has(path)) return;

    document.body.classList.add('premium-interior', 'premium-service-page');
    if (path === '/services/') document.body.classList.add('premium-directory');
    if (path === '/reviews/') document.body.classList.add('premium-reviews');

    const href = '/css/premium-interior-pages.css?v=1';
    const alreadyLoaded = [...document.querySelectorAll('link[rel="stylesheet"]')]
      .some(link => new URL(link.href, location.href).pathname === '/css/premium-interior-pages.css');
    if (!alreadyLoaded) {
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = href;
      document.head.appendChild(stylesheet);
    }
  }

  applyPremiumInteriorDesign();

  const slots = [...document.querySelectorAll('[data-include]')];

  const scriptSrcExists = (src) => {
    try {
      const abs = new URL(src, location.href).href;
      return [...document.querySelectorAll('script[src]')]
        .some(s => new URL(s.getAttribute('src'), location.href).href === abs);
    } catch {
      return false;
    }
  };

  async function runScriptsSequentially(scripts) {
    for (const n of scripts) {
      const src = n.getAttribute('src');
      if (src && scriptSrcExists(src)) continue;
      const s = document.createElement('script');
      for (const { name, value } of [...n.attributes]) s.setAttribute(name, value);
      if (!src) s.textContent = n.textContent || '';
      const shouldAwait = !!src && !s.hasAttribute('async');
      const p = new Promise((resolve) => { s.onload = s.onerror = () => resolve(); });
      (document.head || document.documentElement).appendChild(s);
      if (shouldAwait) await p;
    }
  }

  async function ensureHeaderController() {
    if (window.ZenithHeader?.init) return;
    await new Promise((resolve) => {
      const existing = [...document.querySelectorAll('script[src]')]
        .find(s => /\/js\/header\.js(?:$|[?#])/.test(s.getAttribute('src') || ''));
      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', resolve, { once: true });
        setTimeout(resolve, 250);
        return;
      }
      const s = document.createElement('script');
      s.src = '/js/header.js';
      s.defer = true;
      s.onload = s.onerror = resolve;
      document.head.appendChild(s);
    });
  }

  await Promise.all(slots.map(async (slot) => {
    const url = slot.getAttribute('data-include');
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const wrap = document.createElement('div');
      wrap.innerHTML = html.trim();
      const scripts = [...wrap.querySelectorAll('script')];
      scripts.forEach(s => s.parentNode.removeChild(s));
      const parent = slot.parentNode;
      [...wrap.childNodes].forEach(n => parent.insertBefore(n, slot));
      await runScriptsSequentially(scripts);
      parent.removeChild(slot);
    } catch (err) {
      console.error('Include failed:', url, err);
    }
  }));

  try {
    await ensureHeaderController();
    if (window.ZenithHeader?.init) window.ZenithHeader.init();
  } catch (e) {
    console.debug('Post-include init skipped:', e);
  }

  try {
    const evt = new (window.CustomEvent || Event)('includes:ready');
    document.dispatchEvent(evt);
    window.dispatchEvent(new Event('includes:ready'));
  } catch {
    document.dispatchEvent(new Event('includes:ready'));
    window.dispatchEvent(new Event('includes:ready'));
  }
})();
