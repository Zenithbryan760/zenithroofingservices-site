(() => {
  const approved = new Set([
    '/services/','/services/roof-repairs/','/services/roof-repairs/roof-tune-up/',
    '/services/roof-repairs/tile-roof-repair/','/services/roof-repairs/clay-tile-roof-repair/',
    '/services/roof-repairs/flat-roof-repair/','/services/roof-repairs/skylight-repair/',
    '/services/roof-replacement/','/services/residential/tile-lift-lay/',
    '/services/residential/asphalt-shingles/','/services/commercial/','/services/commercial/tpo/',
    '/services/commercial/torch-down/','/services/commercial/silicone-coatings/',
    '/services/roof-inspection/','/services/insurance-claims/','/services/real-estate/',
    '/services/gutters/','/reviews/'
  ]);

  const normalize = () => {
    let path = location.pathname.replace(/\/index\.html$/i, '/');
    if (!path.endsWith('/')) path += '/';
    return path;
  };

  const path = normalize();
  if (!approved.has(path)) return;

  const body = document.body;
  body.classList.add('zenith-interior-page');
  if (path === '/services/') body.classList.add('zenith-services-directory');
  if (path === '/reviews/') body.classList.add('zenith-reviews-page');

  const addStyles = () => {
    if ([...document.styleSheets].some(s => (s.href || '').includes('interior-service-premium.css'))) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/interior-service-premium.css?v=2';
    document.head.appendChild(link);
  };

  const directChildren = (parent, selector) => [...parent.children].filter(el => el.matches(selector));

  const rebuild = () => {
    addStyles();
    const main = document.querySelector('main');
    if (!main || main.dataset.premiumRebuilt === 'true') return;
    main.dataset.premiumRebuilt = 'true';

    const heroSelectors = '.hero,.tile-hero,.clay-hero,.shingle-hero,.slate-hero,.skylight-hero,.flat-hero,.services-directory-hero,.interior-hero';
    const hero = directChildren(main, 'section').find(section => section.matches(heroSelectors)) || main.querySelector(heroSelectors);

    if (hero) {
      const image = hero.querySelector('img');
      if (image?.getAttribute('src')) hero.style.setProperty('--interior-hero-image', `url("${image.getAttribute('src')}")`);

      const h1 = hero.querySelector('h1');
      const lead = hero.querySelector('.lede,.lead,.services-hero-lede,.flat-lede') || h1?.parentElement?.querySelector('p') || h1?.nextElementSibling;
      const actions = hero.querySelector('.cta,.hero-actions,.services-hero-actions,.flat-actions,.interior-hero__actions');
      const eyebrow = hero.querySelector('.eyebrow,.services-eyebrow,.flat-kicker');

      const content = document.createElement('div');
      content.className = 'shell interior-service-hero__content';
      if (eyebrow) {
        eyebrow.className = 'eyebrow eyebrow--light';
        content.appendChild(eyebrow);
      }
      if (h1) {
        h1.removeAttribute('style');
        content.appendChild(h1);
      }
      if (lead && lead.tagName === 'P') {
        lead.className = 'interior-service-hero__lede';
        content.appendChild(lead);
      }
      if (actions) {
        actions.className = 'interior-service-hero__actions';
        content.appendChild(actions);
      }

      hero.replaceChildren();
      hero.className = 'interior-service-hero';
      const shade = document.createElement('span');
      shade.className = 'interior-service-hero__shade';
      shade.setAttribute('aria-hidden', 'true');
      hero.append(shade, content);

      const trust = document.createElement('div');
      trust.className = 'interior-service-trust';
      const trustGrid = document.createElement('div');
      trustGrid.className = 'shell interior-service-trust__grid';
      ['Licensed C-39','Photo documented','Local roofing team','Clear recommendations'].forEach(text => {
        const span = document.createElement('span');
        span.textContent = text;
        trustGrid.appendChild(span);
      });
      trust.appendChild(trustGrid);
      hero.insertAdjacentElement('afterend', trust);
    }

    directChildren(main, 'nav').forEach(nav => {
      if (!nav.querySelector(':scope > .interior-section-nav__inner')) {
        const inner = document.createElement('div');
        inner.className = 'shell interior-section-nav__inner';
        while (nav.firstChild) inner.appendChild(nav.firstChild);
        nav.appendChild(inner);
      }
      nav.classList.add('interior-section-nav');
    });

    directChildren(main, 'section').forEach(section => {
      if (section.classList.contains('interior-service-hero')) return;
      section.classList.remove('card','airy','hoverable');
      section.classList.add('section','interior-section');
      if (!section.querySelector(':scope > .shell,:scope > .container')) {
        const inner = document.createElement('div');
        inner.className = 'shell interior-section__inner';
        while (section.firstChild) inner.appendChild(section.firstChild);
        section.appendChild(inner);
      }
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', rebuild, { once: true });
  else rebuild();
  document.addEventListener('includes:ready', rebuild, { once: true });
})();
