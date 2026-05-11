/* Mobile menu & logo home — robust delegation across all pages */
(() => {
  const HTML = document.documentElement;
  const BODY = document.body;

  const TOGGLE_SEL =
    '.menu-toggle, [data-nav-toggle], .nav-toggle, .hamburger, .hamburger-button, #menu-toggle, .menu-icon';
  const CLOSE_LINK_SEL = '.mobile-nav a, nav a[data-close-nav], .site-nav a';

  const isOpen = () =>
    HTML.classList.contains('nav-open') || BODY.classList.contains('nav-open') ||
    HTML.classList.contains('menu-open') || BODY.classList.contains('menu-open');

  function setOpen(open) {
    [HTML, BODY].forEach(el => {
      el.classList.toggle('nav-open', open);
      el.classList.toggle('menu-open', open);
    });
    const btn = document.querySelector(TOGGLE_SEL);
    if (btn) btn.setAttribute('aria-expanded', String(open));
  }

  document.addEventListener('click', (e) => {
    const toggle = e.target.closest(TOGGLE_SEL);
    if (toggle) { e.preventDefault(); setOpen(!isOpen()); return; }

    const link = e.target.closest(CLOSE_LINK_SEL);
    if (link && isOpen()) setOpen(false);

    const acc = e.target.closest('.accordion-toggle');
    if (acc) {
      e.preventDefault();
      const li = acc.closest('li');
      const submenu = li && li.querySelector(':scope > .submenu');
      if (submenu) submenu.setAttribute('data-open', String(submenu.getAttribute('data-open') !== 'true'));
    }
  }, { passive: false });

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

  const ready = () => {
    const logo = document.querySelector('.site-logo, .logo-section.logo-link, a[data-logo-home]');
    if (logo) logo.setAttribute('href', '/#home');

    const btn = document.querySelector(TOGGLE_SEL);
    if (btn && !btn.hasAttribute('aria-expanded')) {
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', 'site-nav');
    }
  };
  (document.readyState === 'loading')
    ? document.addEventListener('DOMContentLoaded', ready, { once: true })
    : ready();
})();
