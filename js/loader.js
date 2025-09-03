/* /js/loader.js
   Lightweight HTML partial loader.

   WHAT THIS FILE DOES (high level):
   1) Finds every element on the page with data-include="/path/file.html".
   2) Fetches the referenced HTML file.
   3) Replaces the placeholder element with the fetched HTML fragment.
   4) **Executes any <script> tags found in the fragment**, including:
        - External scripts: <script src="/js/estimate-form.js" defer></script>
        - Inline scripts:   <script>console.log('Hello')</script>
      (Browsers do NOT run scripts injected via innerHTML by default. We fix that.)
   5) **Avoids inserting duplicate external scripts** that are already on the page.
   6) After all includes are finished, calls optional initializers (e.g., window.ZenithHeader.init()).
   7) Fires a custom "includes:ready" event in case other code is waiting for includes.

   WHY YOU NEED THIS:
   - Your components (e.g., components/estimate-form.html) are injected via innerHTML.
   - Without this loader’s “script-aware” behavior, scripts in those components won’t run.
   - This file preserves your original behavior and adds just the missing execution step.
*/

(async () => {
  // 1) Find all placeholder elements like:
  //    <div data-include="/components/header-section.html"></div>
  //    <section data-include="/components/footer.html"></section>
  const slots = [...document.querySelectorAll('[data-include]')];

  // 2) Helper: avoid adding the same external script more than once.
  //    - If we inject a component that includes <script src="/js/estimate-form.js">,
  //      but that script already exists on the page (or was previously included),
  //      we skip adding it again to prevent duplicate execution and event binding.
  const scriptSrcExists = (src) => {
    try {
      // Convert "src" into an absolute URL so we can compare apples to apples.
      const abs = new URL(src, location.href).href;

      // Look through all <script src="..."> already on the page and compare absolute URLs.
      return [...document.querySelectorAll('script[src]')]
        .some(s => new URL(s.getAttribute('src'), location.href).href === abs);
    } catch {
      // If URL parsing fails (malformed src), be conservative and say "doesn't exist".
      return false;
    }
  };

  // 3) Fetch and insert each include in parallel (fast, and your original approach).
  await Promise.all(slots.map(async (slot) => {
    const url = slot.getAttribute('data-include'); // e.g., "/components/estimate-form.html"
    try {
      // 3a) Fetch the component HTML.
      //     cache:'no-store' ensures you always get the latest version (useful during development).
      const res  = await fetch(url, { cache: 'no-store' });
      const html = await res.text();

      // 3b) Create a temporary container and parse the HTML string into DOM nodes.
      //     We do not insert directly into the document yet; we want to examine nodes first.
      const wrap = document.createElement('div');
      wrap.innerHTML = html.trim();

      // 3c) Prepare to replace the placeholder element with the new nodes.
      const parent = slot.parentNode;
      const nodes  = [...wrap.childNodes]; // turn NodeList into a plain array

      // 3d) Insert each node before the placeholder (so order is preserved).
      nodes.forEach((n) => {
        // IMPORTANT PART: execute <script> tags from the included fragment
        // Browsers ignore <script> tags inserted by innerHTML, so we must recreate them.
        if (n.tagName === 'SCRIPT') {
          const src = n.getAttribute('src');

          // If this is an external script and it already exists in the page,
          // we skip it to prevent double-loading and double-binding events.
          if (src && scriptSrcExists(src)) return;

          // Recreate a real <script> element so the browser executes it.
          const s = document.createElement('script');

          // Copy ALL attributes (e.g., src, type, async, defer, data-*, etc.)
          for (const { name, value } of [...n.attributes]) {
            s.setAttribute(name, value);
          }

          // If there is no "src" (inline script), copy its JS code into textContent.
          // This is how you execute inline scripts from includes.
          if (!src) s.textContent = n.textContent || '';

          // Insert the <script> element into the DOM (this is when it actually executes).
          parent.insertBefore(s, slot);
        } else {
          // For all non-script nodes, preserve your original behavior:
          // just insert them before the placeholder.
          parent.insertBefore(n, slot);
        }
      });

      // Finally, remove the include placeholder element from the DOM.
      parent.removeChild(slot);

    } catch (err) {
      // If the fetch fails (404, network error), log it. This helps you debug broken include paths.
      console.error('Include failed:', url, err);
    }
  }));

  // 4) After ALL includes are finished:
  //    - Optionally (re)initialize UI components that depend on included markup.
  //    - This preserves your original post-include header init pattern.
  try {
    // If your header component defines window.ZenithHeader.init(), call it now.
    if (window.ZenithHeader?.init) window.ZenithHeader.init();

    // If you add other components in the future that expose init functions,
    // you can call them here as well, e.g.:
    // if (window.Footer?.init) window.Footer.init();
    // if (window.SomeWidget?.mount) window.SomeWidget.mount();

  } catch (e) {
    // Never break the page if an init fails; just log a soft message.
    console.debug('Post-include init skipped:', e);
  }

  // 5) ADDED: Broadcast a custom event so other scripts can run AFTER includes are ready.
  //    - This is optional and harmless. You can listen for it elsewhere:
  //        document.addEventListener('includes:ready', () => { /* do stuff */ });
  try {
    document.dispatchEvent(new CustomEvent('includes:ready'));
  } catch {} // Old browsers without CustomEvent constructor will just skip.
})();
