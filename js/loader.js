/* /js/loader.js — Lightweight HTML partial loader (ready for all pages)
   - Finds [data-include]
   - Inserts markup
   - Executes ALL nested <script> tags (inline + external)
   - Skips duplicate external scripts
   - Fires "includes:ready" on document AND window
*/
(async () => {
  const slots = [...document.querySelectorAll('[data-include]')];

  // Check if a given external script URL is already present on the page
  const scriptSrcExists = (src) => {
    try {
      const abs = new URL(src, location.href).href;
      return [...document.querySelectorAll('script[src]')]
        .some(s => new URL(s.getAttribute('src'), location.href).href === abs);
    } catch {
      return false;
    }
  };

  // Execute scripts in DOM order. External scripts are awaited unless async is set.
  async function runScriptsSequentially(scripts) {
    for (const n of scripts) {
      const src = n.getAttribute('src');

      // Skip external script if it's already loaded
      if (src && scriptSrcExists(src)) continue;

      // Create a real <script> so the browser executes it
      const s = document.createElement('script');

      // Copy all attributes (type, src, async, defer, data-*, etc.)
      for (const { name, value } of [...n.attributes]) s.setAttribute(name, value);

      // Inline code
      if (!src) s.textContent = n.textContent || '';

      // If external & async => don't block; otherwise await load to preserve order
      const shouldAwait = !!src && !s.hasAttribute('async');

      const p = new Promise((resolve) => {
        s.onload = s.onerror = () => resolve();
      });

      // Append to head (or body). Head is fine for both inline and external in this context.
      (document.head || document.documentElement).appendChild(s);

      if (shouldAwait) await p;
    }
  }

  await Promise.all(slots.map(async (slot) => {
    const url = slot.getAttribute('data-include');
    try {
      const res  = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();

      // Parse into a container
      const wrap = document.createElement('div');
      wrap.innerHTML = html.trim();

      // Collect ALL scripts (nested too), then remove them from the fragment
      const scripts = [...wrap.querySelectorAll('script')];
      scripts.forEach(s => s.parentNode.removeChild(s));

      // Insert all non-script nodes before the placeholder
      const parent = slot.parentNode;
      [...wrap.childNodes].forEach(n => parent.insertBefore(n, slot));

      // Execute scripts after DOM nodes are in place
      await runScriptsSequentially(scripts);

      // Remove the placeholder
      parent.removeChild(slot);
    } catch (err) {
      console.error('Include failed:', url, err);
    }
  }));

  // OPTIONAL: call any component initializers you expose globally
  try {
    if (window.ZenithHeader?.init) window.ZenithHeader.init();
  } catch (e) {
    console.debug('Post-include init skipped:', e);
  }

  // Fire the ready event for both patterns of listeners
  try {
    const evt = new (window.CustomEvent || Event)('includes:ready');
    document.dispatchEvent(evt);
    window.dispatchEvent(new Event('includes:ready'));
  } catch {
    // Old browsers: best-effort fallback
    document.dispatchEvent(new Event('includes:ready'));
    window.dispatchEvent(new Event('includes:ready'));
  }
})();
