/* =======================================================================
   js/header.js — Desktop dropdowns + Mobile off-canvas (single file)
   - Desktop: optional .submenu-toggle click handler (if you use it)
   - Mobile: .menu-toggle opens/closes off-canvas by toggling body.nav-open
   - Mobile accordions: .accordion-toggle expands nested <li> menus
   - Click-outside, ESC to close, resize cleanup
   - Idempotent: safe to call window.ZenithHeader.init() multiple times
   - Legacy alias: window.initMobileMenu() calls the same init
   ======================================================================= */
(() => {
  'use strict';

  // Guards so we don’t double-bind global listeners
  let desktopBound = false;
  let outsideClickBound = false;
  let escBound = false;
  let resizeBound = false;

  // Cache current bound elements so we only bind once per element
  const boundMenuToggles = new WeakSet();
  let boundMobileNav  = null;

  // --- Utilities ---
  const isOpen = () => document.body.classList.contains('nav-open');
  const syncExpanded = (expanded) => {
    document.querySelectorAll('.menu-toggle, .zr-dock-menu')
      .forEach((toggle) => toggle.setAttribute('aria-expanded', String(expanded)));
  };
  const openMobile = () => {
    document.body.classList.add('nav-open');
    syncExpanded(true);
    document.body.style.overflow = 'hidden';
  };
  const closeMobile = () => {
    document.body.classList.remove('nav-open');
    syncExpanded(false);
    document.body.style.overflow = '';
  };
  const isMobileViewport = () => window.matchMedia('(max-width: 1024px)').matches; // matches your CSS

  // --- [A] Desktop dropdowns (optional click support) ---
  // If you add .submenu-toggle to desktop triggers, this will handle click-to-toggle
  function bindDesktopDropdowns() {
    if (desktopBound) return;
    document.addEventListener('click', (e) => {
      const toggle = e.target.closest('.submenu-toggle');
      if (!toggle) return;

      const li = toggle.closest('li');
      const parentUl = li?.parentElement;
      if (!li || !parentUl) return;

      // Close siblings
      parentUl.querySelectorAll(':scope > li.open').forEach((openLi) => {
        if (openLi !== li) {
          openLi.classList.remove('open');
          openLi.querySelectorAll('.submenu-toggle,[aria-expanded]')
                .forEach((b) => b.setAttribute('aria-expanded', 'false'));
        }
      });

      // Toggle current
      const nowOpen = li.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(nowOpen));

      // Prevent accidental nav if the toggle is an <a>
      if (toggle.tagName === 'A') e.preventDefault();
    }, { passive: false });
    desktopBound = true;
  }

  // --- [B] Mobile: off-canvas open/close & helpers ---
  function bindMobileControls() {
    const menuToggle = document.querySelector('.menu-toggle');
    const menuToggles = document.querySelectorAll('.menu-toggle, .zr-dock-menu');
    const mobileNav  = document.querySelector('.mobile-nav');

    // If either element is missing, nothing to bind (ok on desktop-only pages)
    if (!menuToggle || !mobileNav || !menuToggles.length) return;

    // Bind hamburger only once per element
    menuToggles.forEach((toggle) => {
      if (boundMenuToggles.has(toggle)) return;
      toggle.addEventListener('click', () => {
        const opening = !isOpen();
        opening ? openMobile() : closeMobile();
      });
      boundMenuToggles.add(toggle);
    });

    // Click outside to close (bind once globally)
    if (!outsideClickBound) {
      document.addEventListener('click', (e) => {
        if (!isOpen()) return;
        // Don’t close if clicking inside the panel or on the toggle
        if (mobileNav.contains(e.target) || e.target.closest('.menu-toggle, .zr-dock-menu')) return;
        closeMobile(menuToggle);
      });
      outsideClickBound = true;
    }

    // ESC to close (bind once globally)
    if (!escBound) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen()) closeMobile(menuToggle);
      });
      escBound = true;
    }

    // On resize to desktop, clean up (bind once globally)
    if (!resizeBound) {
      let lastIsMobile = isMobileViewport();
      window.addEventListener('resize', () => {
        const nowIsMobile = isMobileViewport();
        if (lastIsMobile && !nowIsMobile) closeMobile(menuToggle);
        lastIsMobile = nowIsMobile;
      });
      resizeBound = true;
    }


    // Delegate mobile nav clicks once per injected mobileNav element.
    // This handles both normal links and accordion buttons without double-binding.
    if (boundMobileNav !== mobileNav) {
      mobileNav.addEventListener('click', (e) => {
        const btn = e.target.closest('.accordion-toggle');
        if (btn) {
          e.preventDefault();
          e.stopPropagation();

          const li = btn.closest('li');
          if (!li) return;

          li.parentElement?.querySelectorAll(':scope > li.open').forEach((openLi) => {
            if (openLi !== li) {
              openLi.classList.remove('open');
              openLi.querySelectorAll('.accordion-toggle,[aria-expanded]')
                    .forEach((b) => b.setAttribute('aria-expanded', 'false'));
            }
          });

          const now = li.classList.toggle('open');
          btn.setAttribute('aria-expanded', String(now));
          return;
        }

        const link = e.target.closest('a[href]');
        if (link) closeMobile(menuToggle);
      }, { passive: false });

      boundMobileNav = mobileNav;
    }
  }

  function init() {
    // Desktop click support (safe if you only use :hover in CSS too)
    bindDesktopDropdowns();

    // Mobile controls & accordions
    bindMobileControls();
  }

  // Auto-init on DOM ready (safe: idempotent)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  // Expose for your include loader (safe to call multiple times)
  window.ZenithHeader = { init };
  // Legacy alias so existing calls to initMobileMenu() keep working
  window.initMobileMenu = () => window.ZenithHeader.init();
})();
