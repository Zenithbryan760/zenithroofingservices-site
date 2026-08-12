import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const areas = JSON.parse(fs.readFileSync(path.join(root, 'data/service-areas.json'), 'utf8'));
const serviceGroups = JSON.parse(fs.readFileSync(path.join(root, 'data/service-area-services.json'), 'utf8'));
const baseUrl = 'https://zenithroofingservices.com';

const html = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const titleCaseKind = (value) => value.charAt(0).toUpperCase() + value.slice(1);
const zipText = (area) => area.zips.join(', ');
const nearbyText = (area) => {
  if (area.nearby.length === 1) return area.nearby[0];
  return `${area.nearby.slice(0, -1).join(', ')} and ${area.nearby.at(-1)}`;
};

const projectBySlug = {
  'carmel-mountain-ranch': {
    url: '/projects/carmel-mountain-ranch-tile-lift-lay/',
    image: '/images/projects/carmel-mountain-ranch-tile-lift-lay/completed-homestead-tile-roof.webp',
    hero: '/images/projects/carmel-mountain-ranch-tile-lift-lay/completed-tile-roof-hero.webp',
    srcset: '/images/projects/carmel-mountain-ranch-tile-lift-lay/completed-tile-roof-hero-640.webp 640w, /images/projects/carmel-mountain-ranch-tile-lift-lay/completed-tile-roof-hero-960.webp 960w, /images/projects/carmel-mountain-ranch-tile-lift-lay/completed-tile-roof-hero.webp 1280w',
    type: 'Tile lift & lay · Titanium system',
    name: 'Carmel Mountain Ranch Tile Roof Lift and Lay',
    title: 'Two-layer underlayment replacement with the original tile reset.',
    description: 'Zenith staged the reusable Monier Homestead tile, repaired localized decking, installed two layers of Titanium UDL50 with PSU30 at vulnerable details, renewed key flashings and reset the existing tile.',
    serviceUrl: '/services/residential/tile-lift-lay/',
    serviceName: 'Explore Tile Lift & Lay',
    alt: 'Completed Monier Homestead concrete tile roof in Carmel Mountain Ranch'
  },
  murrieta: {
    url: '/projects/murrieta-concrete-tile-roof-maintenance/',
    image: '/images/projects/murrieta-tile-roof-maintenance/completed-roof-overview.webp',
    hero: '/images/projects/murrieta-tile-roof-maintenance/roof-overview-hero.webp',
    type: 'Concrete tile roof maintenance',
    name: 'Complete Concrete Tile Roof Maintenance in Murrieta',
    title: 'Complete maintenance for a serviceable concrete tile roof.',
    description: 'Zenith corrected broken and shifted tiles, renewed vulnerable penetration details, maintained compatible sealants and documented the completed roof without recommending replacement where it was not required.',
    serviceUrl: '/services/roof-repairs/roof-tune-up/',
    serviceName: 'Explore Roof Tune-Ups',
    alt: 'Completed concrete tile roof maintenance project in Murrieta'
  },
  escondido: {
    url: '/projects/escondido-tile-lift-lay-elkhorn/',
    image: '/images/Escondido/00-hero@960.jpg',
    hero: '/images/Escondido/00-hero.jpg',
    type: 'Tile lift & relay · Escondido',
    name: 'Escondido Tile Lift and Relay',
    title: 'A documented tile lift-and-relay project in Escondido.',
    description: 'This case study documents Zenith’s work on a concrete tile assembly in the Country Club Lane area, showing the roof system and completed result without publishing a private street address.',
    serviceUrl: '/services/residential/tile-lift-lay/',
    serviceName: 'Explore Tile Lift & Lay',
    alt: 'Completed tile roof photographed by Zenith in Escondido'
  }
};

const systemGuides = [
  {
    name: 'Tile Lift & Reset', href: '/services/residential/tile-lift-lay/', label: 'Reusable clay or concrete tile', image: '/images/finished-tile-lift-relay.webp', alt: 'Completed tile roof after serviceable tile was lifted and reset',
    lead: 'Keep serviceable tile while rebuilding the roof system beneath it.',
    explanation: 'A lift and reset—also called lift and relay or lift and lay—carefully removes and stages reusable tile so the existing underlayment can be removed and the deck can be inspected. Documented wood repairs, new underlayment, flashing, metal and drainage details are completed before suitable tile is returned to the roof.',
    decision: 'This can be a responsible path when the visible tile retains value but the waterproofing below has aged beyond isolated repairs. The work boundary should follow complete slopes, valleys and transitions rather than stop at an unreliable tie-in.',
    points: ['Deck inspection and documented wood repair', 'Underlayment and critical-area protection', 'Valley, chimney, skylight and penetration flashing', 'Serviceable existing tile reset and blended']
  },
  {
    name: 'Asphalt Shingle Roofing', href: '/services/residential/asphalt-shingles/', label: 'Pitched residential systems', image: '/images/owens-corning/completed-owens-corning-shingle-roof.webp', alt: 'Completed architectural asphalt shingle roof installed by Zenith',
    lead: 'A complete shingle system starts with the deck, pitch and ventilation—not the color sample.',
    explanation: 'Zenith evaluates the attic and substrate before defining a shingle assembly. Plywood, OSB, solid planks, tongue-and-groove boards, skip sheathing and former wood-shake decks can require different tear-off, nailing-surface and ventilation work. Underlayment is selected by slope; asphalt shingles are not Zenith’s solution below a 2:12 pitch.',
    decision: 'A complete system coordinates corrected decking, slope-appropriate dry-in, drip edge, starter, field shingles, hip and ridge pieces, penetrations, wall and chimney flashings, and balanced intake and exhaust. Progress photography and a final magnetic sweep support a clear closeout.',
    points: ['Deck-first inspection and wood allowances', 'Slope-specific synthetic or self-adhered dry-in', 'Integrated metal, flashing and ventilation', 'Compatible starter, field and ridge components']
  },
  {
    name: 'TPO Single-Ply Roofing', href: '/services/commercial/tpo/', label: 'Heat-welded thermoplastic membrane', image: '/images/tpo/commercial-tpo-finished.jpg', alt: 'Completed commercial TPO single-ply roof installed by Zenith',
    lead: 'A reflective, heat-welded membrane for compatible low-slope roofs.',
    explanation: 'TPO is a thermoplastic single-ply system commonly considered for commercial, multifamily and selected residential low-slope roofs. The roof is designed around attachment, insulation or cover board where specified, membrane layout, heat-welded seams, perimeter securement, penetrations, drains, scuppers and transitions.',
    decision: 'Reliable TPO work depends on the substrate and details below the white field membrane. Zenith evaluates existing layers, moisture, drainage, building use, rooftop equipment, access and whether repair, recover or replacement is the responsible direction.',
    points: ['Deck and existing-system evaluation', 'Attachment and insulation strategy', 'Heat-welded seams and reinforced details', 'Drains, curbs, edges and penetrations']
  },
  {
    name: 'PVC Single-Ply Roofing', href: '/services/commercial/pvc/', label: 'Welded single-ply commercial membrane', image: '/images/tpo/commercial-details-finished.jpg', alt: 'Completed single-ply roof details photographed by Zenith',
    lead: 'A heat-welded single-ply option selected for the roof’s use and exposure.',
    explanation: 'PVC is another thermoplastic membrane system used on appropriate commercial and multifamily roofs. Like TPO, it relies on disciplined substrate preparation, attachment, welded seams, compatible accessories and continuous detailing around equipment, walls, drains and perimeter metal.',
    decision: 'PVC and TPO are not interchangeable labels. Chemical exposure, rooftop use, existing materials, manufacturer assembly requirements, drainage and budget can affect the selection. Zenith identifies the installed roof and explains the compatible path before proposing a membrane.',
    points: ['System identification before repair or replacement', 'Welded seams and compatible accessories', 'Perimeter, curb and drainage detailing', 'Assembly selected for property use']
  },
  {
    name: 'Torch-Down Modified Bitumen', href: '/services/commercial/torch-down/', label: 'Layered low-slope membrane', image: '/images/torch-down/modified-bitumen-roof-complete.jpg', alt: 'Completed modified bitumen low-slope roof installed by Zenith',
    lead: 'A durable modified-bitumen system when the roof and safe application conditions fit.',
    explanation: 'Torch-down uses modified-bitumen membrane courses fused as part of a compatible low-slope assembly. The system still begins with tear-off or approved preparation, deck review, base or interply requirements, primed metal, drains, edges, walls and penetration details—not simply heating a cap sheet over existing problems.',
    decision: 'Building use, combustible conditions, clearances, trees, access, existing counterflashing and hot-work controls influence whether torch application is appropriate. Where the conditions do not support it, self-adhered modified bitumen or another compatible system may be the more responsible recommendation.',
    points: ['Prepared and inspected substrate', 'Layered modified-bitumen assembly', 'Primed metal and integrated flashings', 'Site-specific hot-work controls']
  },
  {
    name: 'Self-Adhered Modified Bitumen', href: '/services/commercial/self-adhered/', label: 'Modified bitumen without field torch application', image: '/images/self-adhered-mod-bit/finished-low-slope.jpg', alt: 'Completed self-adhered modified bitumen low-slope roof by Zenith',
    lead: 'Controlled adhesion and a clean finish for a compatible low-slope assembly.',
    explanation: 'Self-adhered roofing remains a serious modified-bitumen system. Release film is removed as the membrane is positioned and rolled onto a prepared surface. Assembly options can include a mechanically attached base with a self-adhered cap or a more substantial base, smooth interply and cap configuration for roofs protecting occupied space.',
    decision: 'The roof still requires tear-off or proper preparation, deck inspection, cap-fastener or adhesion requirements, aligned laps, rolling pressure, primed metal and detailed edges and penetrations. Reduced field hot work does not reduce the importance of substrate and flashing work.',
    points: ['Mechanically attached base options', 'Self-adhered interply and cap configurations', 'Rolled courses and controlled adhesion', 'Compatible edge and penetration details']
  },
  {
    name: 'Silicone Roof Restoration', href: '/services/commercial/silicone-coatings/', label: 'Restoration for a dry, sound roof', image: '/images/silicone-coatings/silicone-finished-aerial-solar.jpg', alt: 'Completed silicone roof coating restoration photographed by Zenith',
    lead: 'Restore a qualified roof after the substrate and vulnerable details are corrected.',
    explanation: 'Silicone is a restoration system, not a coating used to cover wet insulation, failed decking or unresolved leaks. Zenith identifies the existing roof, checks moisture and substrate condition, plans repairs, prepares the surface, rebuilds edges, laps, scuppers, pipes and penetrations, and then applies the specified coating system.',
    decision: 'A qualified coating can reduce tear-off and disruption on eligible metal, modified-bitumen, built-up, foam and other compatible low-slope roofs. If moisture is widespread or the substrate is unsound, Zenith explains why repair or reroofing is the more responsible direction.',
    points: ['Compatibility and moisture evaluation', 'Cleaning and specified surface preparation', 'Detail repairs before coating', 'Specified coverage for the selected system']
  }
];

function heroFor(area) {
  const project = projectBySlug[area.slug];
  if (project) return { image: project.hero, srcset: project.srcset || '', alt: project.alt };
  if (['kearny-mesa', 'sorrento-valley', 'mission-valley', 'university-city'].includes(area.slug)) {
    return { image: '/images/tpo/commercial-tpo-finished.jpg', srcset: '', alt: `Commercial single-ply roofing photographed by Zenith for its ${area.name} service-area guide` };
  }
  if (/Coastal|Beach|La Jolla|Point Loma|Leucadia|Cardiff|Del Mar/i.test(`${area.region} ${area.name}`)) {
    return { image: '/images/clay-tile-roof-repair/two-piece-clay-roof-completed-1200.webp', srcset: '', alt: `Completed clay tile roofing photographed by Zenith for its ${area.name} service-area guide` };
  }
  return { image: '/images/modern-tile-roof-1600.webp', srcset: '', alt: `Completed tile roofing photographed by Zenith for its ${area.name} service-area guide` };
}

function faqData(area) {
  return [
    {
      q: `Does Zenith provide roofing service in ${area.name}?`,
      a: `Yes. Zenith Roofing Services evaluates repair, replacement, maintenance, tile, shingle and low-slope roofing needs in ${area.name} and nearby ${area.county} communities. Property access and scope are confirmed for each request.`
    },
    {
      q: `What roofing systems are common around ${area.name}?`,
      a: `${area.name} includes ${area.roofMix}. The correct repair or replacement method depends on the installed assembly, its age, previous work and the condition of the deck, flashings and drainage details.`
    },
    {
      q: `What can affect a roof in ${area.name}?`,
      a: `Local evaluations commonly account for ${area.conditions}. A site inspection is more reliable than selecting a scope from the visible surface alone.`
    },
    {
      q: `Can Zenith help decide between roof repair and replacement in ${area.name}?`,
      a: 'Yes. Zenith compares the isolated defect with the condition of the surrounding roof. A focused repair may be responsible when the assembly remains serviceable; widespread waterproofing, deck or material failure can justify a larger scope.'
    },
    {
      q: `Which ZIP codes and nearby areas does this ${area.name} guide cover?`,
      a: `This page is organized around ${area.name} and common ZIP code${area.zips.length === 1 ? '' : 's'} ${zipText(area)}, with nearby relevance to ${nearbyText(area)}. ZIP boundaries are approximate; Zenith confirms service availability for the property address.`
    }
  ];
}

function schemaFor(area, faqs) {
  const url = `${baseUrl}/service-areas/${area.slug}/`;
  const graph = [
    {
      '@type': 'RoofingContractor',
      '@id': `${baseUrl}/#business`,
      name: 'Zenith Roofing Services, Inc.',
      url: `${baseUrl}/`,
      telephone: '+1-858-900-6163',
      identifier: { '@type': 'PropertyValue', propertyID: 'California CSLB C-39', value: '1036112' }
    },
    {
      '@type': 'Service',
      '@id': `${url}#service`,
      name: `Roofing Services in ${area.name}`,
      serviceType: 'Roof repair, roof replacement, tile roofing, shingle roofing, TPO, PVC, modified bitumen, coatings, gutters, inspections, maintenance, storm support and real-estate roof services',
      provider: { '@id': `${baseUrl}/#business` },
      areaServed: { '@type': 'Place', name: `${area.name}, ${area.county}, California` },
      url
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
        { '@type': 'ListItem', position: 2, name: 'Service Areas', item: `${baseUrl}/service-areas/` },
        { '@type': 'ListItem', position: 3, name: area.name, item: url }
      ]
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqs.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
    }
  ];
  const project = projectBySlug[area.slug];
  if (project) {
    graph.splice(2, 0, {
      '@type': 'ItemList',
      '@id': `${url}#projects`,
      name: `Roofing Projects in ${area.name}`,
      numberOfItems: 1,
      itemListElement: [{ '@type': 'ListItem', position: 1, name: project.name, url: `${baseUrl}${project.url}` }]
    });
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('</', '<\\/');
}

function projectSection(area) {
  const project = projectBySlug[area.slug];
  if (project) {
    return `
    <section class="local-section local-section--navy" id="project-proof" aria-labelledby="local-projects-heading">
      <div class="shell">
        <div class="local-heading local-heading--light local-projects-heading">
          <div><span class="eyebrow eyebrow--light">Documented local work</span><h2 id="local-projects-heading">A real Zenith roofing project in ${html(area.name)}.</h2></div>
          <p>This verified case study adds property-specific proof to the broader ${html(area.name)} service guide. Future local projects can be added to this same library as they are published.</p>
        </div>
        <div class="local-project-grid" data-local-projects>
          <article class="local-project-card">
            <a class="local-project-card__image" href="${project.url}" aria-label="View the ${html(project.name)} case study">
              <img src="${project.image}" alt="${html(project.alt)}" width="1280" height="720" loading="lazy">
              <span>Completed Zenith project</span>
            </a>
            <div class="local-project-card__body">
              <span class="local-project-card__type">${html(project.type)}</span>
              <h3>${html(project.title)}</h3>
              <p>${html(project.description)}</p>
              <div class="local-project-card__actions">
                <a class="button button--orange" href="${project.url}">View Case Study <span aria-hidden="true">→</span></a>
                <a class="local-project-card__service" href="${project.serviceUrl}">${html(project.serviceName)}</a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>`;
  }

  return `
    <section class="local-section local-section--navy" id="project-proof" aria-labelledby="project-slot-heading">
      <div class="shell local-proof-slot" data-case-study-slot="${html(area.slug)}">
        <div class="local-proof-slot__copy">
          <span class="eyebrow eyebrow--light">Local project library</span>
          <h2 id="project-slot-heading">Local proof stays local—and verified.</h2>
          <p>Zenith will add a ${html(area.name)} case study here after the project photographs and completed scope are published. Until then, start with the full tile, shingle and low-slope system guides instead of seeing another city’s project presented as local proof.</p>
          <div class="local-proof-slot__actions"><a class="button button--orange" href="/services/residential/tile-lift-lay/">Tile Lift &amp; Reset</a><a class="button button--glass" href="/services/residential/asphalt-shingles/">Asphalt Shingles</a></div>
          <div class="local-proof-slot__service-links"><a href="/services/commercial/tpo/">TPO roofing</a><a href="/services/commercial/pvc/">PVC roofing</a><a href="/services/commercial/self-adhered/">Self-adhered modified bitumen</a><a href="/services/commercial/torch-down/">Torch-down</a></div>
        </div>
        <figure class="local-proof-slot__visual">
          <img src="/images/tile-underlayment-install.webp" alt="Zenith roofing underlayment installation documented during a project" width="1200" height="800" loading="lazy">
          <figcaption>Representative Zenith process photography—not presented as a ${html(area.name)} project.</figcaption>
        </figure>
      </div>
    </section>`;
}

function systemExpertise(area) {
  return systemGuides.map((system, index) => `
          <article class="local-system-guide${index % 2 ? ' local-system-guide--reverse' : ''}" id="system-${index + 1}">
            <figure class="local-system-guide__visual"><img src="${system.image}" alt="${html(system.alt)}" width="1200" height="800" loading="lazy"><figcaption>Real Zenith system photography · See the complete service page for specifications and project context.</figcaption></figure>
            <div class="local-system-guide__copy">
              <span class="local-system-guide__label">${html(system.label)}</span>
              <h3>${html(system.name)} in ${html(area.name)}</h3>
              <p class="local-system-guide__lead">${html(system.lead)}</p>
              <p>${html(system.explanation)}</p>
              <p>${html(system.decision)}</p>
              <ul>${system.points.map((point) => `<li>${html(point)}</li>`).join('')}</ul>
              <a class="button button--navy" href="${system.href}">Explore ${html(system.name)} <span aria-hidden="true">→</span></a>
            </div>
          </article>`).join('');
}

function serviceLibrary(area) {
  return serviceGroups.map((group, index) => `
          <details class="local-service-catalog__group"${index === 0 ? ' open' : ''}>
            <summary><span><small>Service group ${String(index + 1).padStart(2, '0')}</small><b>${html(group.group)}</b></span><em>${group.services.length} services</em></summary>
            <div class="local-service-catalog__intro"><p>${html(group.intro)} Availability and the responsible scope are confirmed for each ${html(area.name)} property.</p></div>
            <div class="local-service-catalog__grid">
              ${group.services.map((service) => `
              <article class="local-service-catalog__card">
                <h3><a href="${service.href}">${html(service.name)}</a></h3>
                <p>${html(service.description)}</p>
                <small><b>Common needs:</b> ${html(service.keywords)}</small>
                <a class="local-service-catalog__link" href="${service.href}">Service details <span aria-hidden="true">→</span></a>
              </article>`).join('')}
            </div>
          </details>`).join('');
}

function areaPage(area) {
  const project = projectBySlug[area.slug];
  const hero = heroFor(area);
  const faqs = faqData(area);
  const canonical = `${baseUrl}/service-areas/${area.slug}/`;
  const projectAction = project ? `<a class="button button--glass" href="${project.url}">View the Local Case Study</a>` : '<a class="button button--glass" href="#services">Explore Every Service</a>';
  const description = `Roof repair, replacement, tile, shingle, TPO, PVC and commercial roofing in ${area.name}, CA. Local guidance, common ZIPs and clear service options.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>Roofing in ${html(area.name)}, CA | Repair, Replacement &amp; Flat Roofs</title>
  <meta name="description" content="${html(description)}">
  <link rel="canonical" href="${canonical}">
  <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Roofing in ${html(area.name)}, CA | Zenith Roofing Services">
  <meta property="og:description" content="Premium local roofing guidance for ${html(area.name)}, with repair, replacement, tile, shingle and low-slope systems explained.">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${baseUrl}${hero.image}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preload" as="image" href="${hero.image}">
  <link rel="stylesheet" href="/css/zenith-premium-exact.css?v=exact-premium-3">
  <link rel="stylesheet" href="/css/service-area-authority.css?v=5">
  <script type="application/ld+json">${schemaFor(area, faqs)}</script>
  <script defer src="/js/loader.js"></script>
  <script defer src="/js/header.js"></script>
</head>
<body class="local-area-page">
  <div data-include="/components/header-section.html"></div>
  <main id="main-content">
    <section class="interior-hero local-hero">
      <img src="${hero.image}"${hero.srcset ? ` srcset="${hero.srcset}" sizes="100vw"` : ''} alt="${html(hero.alt)}" width="1600" height="900" fetchpriority="high">
      <span class="interior-hero__shade" aria-hidden="true"></span>
      <div class="shell interior-hero__content">
        <span class="eyebrow eyebrow--light">${html(titleCaseKind(area.kind))} · ${html(area.county)}</span>
        <h1>${html(area.name)} roofing, explained from repair through replacement.</h1>
        <p>One premium local guide to roof repair, tile and shingle systems, TPO, PVC, torch-down, self-adhered modified bitumen, coatings, maintenance and property-focused roof services in ${html(area.name)}.</p>
        <div class="interior-hero__actions"><a class="button button--orange" href="/contact/">Request a Free Estimate <span aria-hidden="true">→</span></a>${projectAction}</div>
      </div>
    </section>

    <section class="interior-trust" aria-label="${html(area.name)} roofing service standards">
      <div class="shell interior-trust__grid">
        <span><b>Licensed C-39</b><small>CSLB #1036112</small></span>
        <span><b>${html(titleCaseKind(area.kind))}</b><small>${html(area.parent)}</small></span>
        <span><b>Common ZIP${area.zips.length === 1 ? '' : 's'}</b><small>${html(zipText(area))}</small></span>
        <span><b>Condition based</b><small>Repair, maintain or replace</small></span>
      </div>
    </section>

    <nav class="local-jump-nav" aria-label="On this ${html(area.name)} roofing page"><div class="shell"><a href="#local-guidance">Local guidance</a><a href="#project-proof">Project proof</a><a href="#services">All services</a><a href="#nearby">ZIPs &amp; nearby areas</a><a href="#faqs">FAQs</a></div></nav>

    <section class="local-section local-section--mist" id="local-guidance">
      <div class="shell">
        <div class="local-heading">
          <div><span class="eyebrow">Roofing decisions for ${html(area.name)}</span><h2>Start with the assembly—not a one-size-fits-all answer.</h2></div>
          <p>${html(area.name)} includes ${html(area.setting)}. Local roofs commonly include ${html(area.roofMix)}, so the correct scope begins with identifying the installed system and the actual water path.</p>
        </div>
        <div class="local-card-grid">
          <article><b>01 · Repair</b><h3>Correct an isolated, repairable defect.</h3><p>A focused repair can make sense when the leak source is defined and the surrounding membrane, underlayment, flashing and roof covering remain serviceable.</p></article>
          <article><b>02 · Maintain</b><h3>Address wear before it expands.</h3><p>Maintenance may include compatible minor corrections, drainage and debris work, selected sealant or flashing service, and photo documentation of visible conditions.</p></article>
          <article><b>03 · Replace or restore</b><h3>Choose a complete system when conditions require it.</h3><p>Widespread waterproofing failure, brittle materials, deck damage or an unsuitable existing assembly can support replacement, lift and reset, or a qualified restoration system.</p></article>
        </div>
        <aside class="local-condition-note"><strong>Local decision factors</strong><p>For ${html(area.name)}, Zenith’s evaluation can account for ${html(area.conditions)}. The recommendation still depends on the specific property, access, installed materials and visible or concealed damage.</p></aside>
      </div>
    </section>

    ${projectSection(area)}

    <section class="local-section local-section--systems" id="roof-systems" aria-labelledby="roof-systems-heading">
      <div class="shell">
        <div class="local-heading">
          <div><span class="eyebrow">Roof-system expertise</span><h2 id="roof-systems-heading">Full system guidance for ${html(area.name)} properties.</h2></div>
          <p>These substantial summaries bring the core decision points from Zenith’s specialty service pages into the local guide. The linked service page remains the source for the complete process, qualifications, project examples and estimate request.</p>
        </div>
        <div class="local-system-guides">${systemExpertise(area)}</div>
      </div>
    </section>

    <section class="local-section local-section--services" id="services" aria-labelledby="services-heading">
      <div class="shell">
        <div class="local-heading">
          <div><span class="eyebrow">Complete roofing service library</span><h2 id="services-heading">Every Zenith service, organized for ${html(area.name)}.</h2></div>
          <p>Open each group to compare repairs, replacements, residential systems, commercial membranes, storm support, gutters and real-estate roof services, then follow any service to its complete specialty page.</p>
        </div>
        <div class="local-service-catalog">${serviceLibrary(area)}</div>
      </div>
    </section>

    <section class="local-section local-section--mist" id="nearby">
      <div class="shell local-coverage">
        <div class="local-coverage__copy"><span class="eyebrow">Local coverage signals</span><h2>${html(area.name)} ZIP codes and nearby communities.</h2><p>This page represents ${html(area.name)} as a ${html(area.kind)}${area.parent !== area.name ? ` associated with ${html(area.parent)}` : ''}. It does not imply that a neighborhood is a separately incorporated city.</p></div>
        <div class="local-coverage__panel">
          <div><small>Common ZIP code${area.zips.length === 1 ? '' : 's'}</small><ul class="local-chip-list">${area.zips.map((zip) => `<li>${html(zip)}</li>`).join('')}</ul></div>
          <div><small>Nearby areas</small><ul class="local-chip-list">${area.nearby.map((name) => `<li>${html(name)}</li>`).join('')}</ul></div>
          <p>ZIP boundaries are approximate and may overlap neighboring communities. Zenith confirms service availability for the property address.</p>
        </div>
      </div>
    </section>

    <section class="local-section local-section--mist local-section--faq" id="faqs">
      <div class="shell local-faq"><span class="eyebrow">${html(area.name)} roofing questions</span><h2>Frequently asked questions.</h2>${faqs.map(({ q, a }) => `<details><summary>${html(q)}</summary><p>${html(a)}</p></details>`).join('')}</div>
    </section>

    <section class="local-cta"><div class="shell local-cta__grid"><div><span class="eyebrow eyebrow--light">Clear next steps</span><h2>Tell us what is happening with your ${html(area.name)} roof.</h2><p>Zenith will evaluate the condition and explain whether repair, maintenance, restoration, lift and reset, or replacement is the responsible direction.</p></div><div class="local-cta__actions"><a class="button button--orange" href="/contact/">Request a Free Estimate</a><a class="button button--glass" href="tel:8589006163">Call&nbsp;858&#8209;900&#8209;6163</a></div></div></section>
  </main>
  <div data-include="/components/footer.html"></div>
</body>
</html>
`;
}

function indexPage() {
  const items = areas.map((area, index) => ({ '@type': 'ListItem', position: index + 1, name: area.name, url: `${baseUrl}/service-areas/${area.slug}/` }));
  const schema = JSON.stringify({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Zenith Roofing Services Service Areas', url: `${baseUrl}/service-areas/`, description: 'Roofing service areas across San Diego County, North County and Southwest Riverside County.', mainEntity: { '@type': 'ItemList', itemListElement: items } });
  const cards = areas.map((area) => `<li class="service-area-card" data-search="${html([area.name, area.kind, area.parent, area.region, ...area.zips, ...area.nearby].join(' '))}"><a href="/service-areas/${area.slug}/"><span>${html(area.name)}</span><small>${html(titleCaseKind(area.kind))} · ${html(area.region)}</small></a></li>`).join('');
  return `<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>Roofing Service Areas | San Diego, North County &amp; Temecula</title>
  <meta name="description" content="Explore Zenith roofing guides for ${areas.length} Southern California cities and communities, with local ZIPs, roof systems, repairs, replacement and commercial services.">
  <link rel="canonical" href="${baseUrl}/service-areas/"><meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large">
  <meta property="og:title" content="Roofing Service Areas | Zenith Roofing Services"><meta property="og:description" content="Premium local roofing guides for cities, neighborhoods and communities across San Diego County and Southwest Riverside County."><meta property="og:type" content="website"><meta property="og:url" content="${baseUrl}/service-areas/"><meta name="twitter:card" content="summary_large_image">
  <link rel="preload" as="image" href="/images/modern-tile-roof-1600.webp">
  <link rel="stylesheet" href="/css/zenith-premium-exact.css?v=exact-premium-3"><link rel="stylesheet" href="/css/service-areas-premium.css?v=4">
  <script type="application/ld+json">${schema}</script><script defer src="/js/loader.js"></script><script defer src="/js/header.js"></script><script defer src="/js/service-area-filter.js?v=2"></script>
</head><body><div data-include="/components/header-section.html"></div>
<main id="main-content" class="premium-page service-areas-page">
  <section class="interior-hero service-areas-hero"><img src="/images/modern-tile-roof-1600.webp" alt="Southern California tile roof inspected by Zenith Roofing Services" width="1600" height="900" fetchpriority="high"><span class="interior-hero__shade" aria-hidden="true"></span><div class="shell interior-hero__content"><span class="eyebrow eyebrow--light">Cities · neighborhoods · communities</span><h1>Premium local roofing guides across Southern California.</h1><p>Search by city, locally recognized community, nearby area or common ZIP code. Every page explains Zenith’s complete repair, replacement, residential and commercial roofing capabilities.</p><div class="interior-hero__actions"><a class="button button--orange" href="/contact/">Request a Free Estimate <span aria-hidden="true">→</span></a><a class="button button--glass" href="tel:8589006163">Call&nbsp;858&#8209;900&#8209;6163</a></div></div></section>
  <section class="interior-trust" aria-label="Zenith service standards"><div class="shell interior-trust__grid"><span><b>Licensed C-39</b><small>CSLB #1036112</small></span><span><b>${areas.length} local guides</b><small>Cities and known communities</small></span><span><b>49 explained services</b><small>Repair through commercial systems</small></span><span><b>Real project proof</b><small>Added only when verified</small></span></div></section>
  <section class="service-area-directory" aria-labelledby="service-area-title"><div class="shell"><div class="service-area-directory__heading"><div><span class="eyebrow">Find your community</span><h2 id="service-area-title">Roofing service near you.</h2></div><p>Neighborhoods such as Rancho Bernardo are identified accurately as communities while still matching how local property owners search.</p></div>
    <div class="service-area-search" role="search" aria-label="Search roofing service areas"><label for="service-area-search-input">Search by city, community or ZIP</label><div class="service-area-search__control"><span aria-hidden="true">⌕</span><input id="service-area-search-input" type="search" autocomplete="off" spellcheck="false" placeholder="Try San Marcos, 92078 or Rancho Bernardo" aria-describedby="service-area-search-status"><button id="service-area-search-clear" type="button" hidden>Clear</button></div><p id="service-area-search-status" aria-live="polite">${areas.length} service areas available.</p></div>
    <article class="service-area-featured" data-service-area-featured aria-labelledby="featured-carmel-title"><picture class="service-area-featured__image"><source media="(max-width:640px)" srcset="/images/projects/carmel-mountain-ranch-tile-lift-lay/completed-tile-roof-hero-640.webp"><source media="(max-width:960px)" srcset="/images/projects/carmel-mountain-ranch-tile-lift-lay/completed-tile-roof-hero-960.webp"><img src="/images/projects/carmel-mountain-ranch-tile-lift-lay/completed-tile-roof-hero.webp" alt="Completed concrete tile roof in Carmel Mountain Ranch" width="1280" height="720" loading="lazy"></picture><div class="service-area-featured__copy"><span class="eyebrow">Featured local proof</span><h3 id="featured-carmel-title">Carmel Mountain Ranch roofing backed by a real tile project.</h3><p>See how the premium area-page system connects local guidance to a documented Zenith tile lift-and-lay project without inventing proof for other communities.</p><div class="service-area-featured__actions"><a class="button button--orange" href="/service-areas/carmel-mountain-ranch/">View Local Guide</a><a class="button button--navy" href="/projects/carmel-mountain-ranch-tile-lift-lay/">View Case Study</a></div></div></article>
    <ul class="service-area-grid service-area-grid--detailed" data-service-area-list>${cards}</ul>
    <div class="service-area-empty" data-service-area-empty hidden><strong>No exact area match yet.</strong><p>Zenith may still serve your property. Call us or send the location through the estimate form.</p><a class="button button--orange" href="/contact/">Ask About Your Area</a></div><p class="service-area-note">Don’t see your community? <a href="/contact/">Contact our team</a>—we may still serve your property.</p>
  </div></section>
</main><div data-include="/components/footer.html"></div></body></html>
`;
}

for (const area of areas) {
  const outputDir = path.join(root, 'service-areas', area.slug);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'index.html'), `${areaPage(area).replace(/[ \t]+$/gm, '').trim()}\n`);
}
fs.writeFileSync(path.join(root, 'service-areas/index.html'), `${indexPage().replace(/[ \t]+$/gm, '').trim()}\n`);

const sitemapPath = path.join(root, 'sitemap.xml');
const sitemap = fs.readFileSync(sitemapPath, 'utf8');
const lines = sitemap.split('\n').filter((line) => !/\/service-areas\/[^<]+\/<\/loc>/.test(line));
const areaRootIndex = lines.findIndex((line) => line.includes('<loc>https://zenithroofingservices.com/service-areas/</loc>'));
const sitemapLines = areas.map((area) => `  <url><loc>${baseUrl}/service-areas/${area.slug}/</loc></url>`);
lines.splice(areaRootIndex + 1, 0, ...sitemapLines);
fs.writeFileSync(sitemapPath, lines.join('\n'));

console.log(`Generated ${areas.length} premium service-area pages, the area index and sitemap entries.`);
