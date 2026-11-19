import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const areas = JSON.parse(fs.readFileSync(path.join(root, 'data/service-areas.json'), 'utf8'));
const localContent = JSON.parse(fs.readFileSync(path.join(root, 'data/service-area-content.json'), 'utf8'));
const serviceGroups = JSON.parse(fs.readFileSync(path.join(root, 'data/service-area-services.json'), 'utf8'));
const baseUrl = 'https://zenithroofingservices.com';
const requiredCopy = ['title', 'description', 'hero', 'repair', 'maintenance', 'coating', 'tpo', 'torch'];

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
    name: 'Tile Lift & Lay', href: '/services/residential/tile-lift-lay/', label: 'Reusable clay or concrete tile', image: '/images/finished-tile-lift-relay.webp', alt: 'Completed tile roof after serviceable tile was lifted and reset',
    lead: 'Keep serviceable tile while rebuilding the roof system beneath it.',
    explanation: 'In a tile lift and relay, we lift reusable clay or concrete tiles, remove the worn underlayment and inspect the deck. We document wood repairs and replace the affected flashings before resetting serviceable tile. Our current underlayment options include MBTechnology LayfastSBS TU43 and TU35. The estimate identifies the product, number of layers and roof sections included.',
    decision: 'A few slipped tiles or a failed pipe flashing may only need a local repair. If the underlayment is deteriorating across a slope, replacing surface tiles alone leaves the water path open. We show you where a repair can tie into sound material and where lifting a larger section makes sense.',
    points: ['Deck inspection and documented wood repair', 'Underlayment and critical-area protection', 'Valley, chimney, skylight and penetration flashing', 'Serviceable existing tile reset and blended']
  },
  {
    name: 'Asphalt Shingle Roofing', href: '/services/residential/asphalt-shingles/', label: 'Pitched residential systems', image: '/images/owens-corning/completed-owens-corning-shingle-roof.webp', alt: 'Completed architectural asphalt shingle roof installed by Zenith',
    lead: 'A complete shingle system starts with the deck, pitch and ventilation—not the color sample.',
    explanation: 'Missing or torn asphalt shingles can often be replaced if the adjacent courses will lift and reseal. Brittle shingles, repeated leaks or a deck that will not hold fasteners can change the scope. For a shingle replacement we check pitch, attic ventilation, sheathing and the roof-to-wall flashings. Options on suitable slopes include Owens Corning Duration COOL architectural shingles.',
    decision: 'A complete system coordinates corrected decking, slope-appropriate dry-in, drip edge, starter, field shingles, hip and ridge pieces, penetrations, wall and chimney flashings, and balanced intake and exhaust. Progress photography and a final magnetic sweep support a clear closeout.',
    points: ['Deck-first inspection and wood allowances', 'Slope-specific synthetic or self-adhered dry-in', 'Integrated metal, flashing and ventilation', 'Compatible starter, field and ridge components']
  },
  {
    name: 'TPO Single-Ply Roofing', href: '/services/commercial/tpo/', label: 'Heat-welded thermoplastic membrane', image: '/images/tpo/commercial-tpo-finished.jpg', alt: 'Completed commercial TPO single-ply roof installed by Zenith',
    lead: 'A reflective, heat-welded membrane for compatible low-slope roofs.',
    explanation: 'We install and repair thermoplastic polyolefin (TPO) membranes on low-slope roofs. One option is 60-mil WeatherBond TPO. The proposed assembly identifies the insulation or cover board, attachment method, heat-welded seams and perimeter metal. Pipe boots, equipment curbs, drains and scuppers each need a compatible membrane detail.',
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
    explanation: 'We repair modified-bitumen roofs and install two-ply torch-down roofing on suitable low-slope buildings. Options include Johns Manville DIBITEN membranes. A replacement scope identifies the base and cap sheets, deck repairs and the connections at edges, scuppers, parapets and pipes. Building use, access and hot-work restrictions help determine whether torch-down or a self-adhered assembly is appropriate.',
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
    explanation: 'We install American Standard Coatings (ASC) silicone on eligible low-slope roofs. We check for moisture and adhesion, repair the roof, clean the surface and let it dry. We use the primer specified for the substrate, detail seams, pipes, curbs and drains, then apply the ASC S Silicone Coating at the coverage specified for the project. Wet insulation and damaged decking need separate repairs.',
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

function faqData(area, copy) {
  return [
    {
      q: `Does Zenith provide roofing service in ${area.name}?`,
      a: `Yes. Zenith Roofing Services evaluates repair, replacement, maintenance, tile, shingle and low-slope roofing needs in ${area.name} and nearby ${area.county} communities. Property access and scope are confirmed for each request.`
    },
    ...copy.faqs,
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
      serviceType: 'Tile roof repair and lift and relay, shingle repair and replacement, roof tune-ups, commercial roof maintenance, silicone roof coating, TPO and PVC roofing, torch-down and self-adhered modified bitumen, gutters, roof inspections, storm support and real-estate roof services',
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

function projectSection(area, work) {
  const project = projectBySlug[area.slug];
  const local = work.some(example => example.place === area.name || example.place.endsWith(`, ${area.name}`));
  const hasWork = work.some(example => ['completed', 'in-progress', 'approved', 'scheduled', 'invoiced'].includes(example.status));
  const projectHeading = local
    ? `${hasWork ? 'Roofing work' : 'Roofing estimates'} in ${area.name}`
    : `A roofing project in ${work[0].place}`;
  const notes = work.map(example => {
    const link = example.url ? ` <a href="${html(example.url)}">${html(example.label)}</a>` : '';
    return `<p><strong>${html(example.heading)}.</strong> ${html(example.text)}${link}</p>`;
  }).join('\n          ');
  if (project) {
    const localHeading = work.every(example => example.status === 'proposal')
      ? `A completed project and a separate roofing estimate in ${area.name}`
      : `A real Zenith roofing project in ${area.name}`;
    return `
    <section class="local-section local-section--navy" id="project-proof" aria-labelledby="local-projects-heading">
      <div class="shell">
        <div class="local-heading local-heading--light local-projects-heading">
          <div><span class="eyebrow eyebrow--light">Documented local work</span><h2 id="local-projects-heading">${html(localHeading)}.</h2></div>
          <div>${notes}</div>
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
    <section class="local-section local-section--navy local-proof-hero" id="project-proof" aria-labelledby="project-slot-heading">
      <div class="shell local-proof-slot" data-case-study-slot="${html(area.slug)}">
        <div class="local-proof-slot__copy">
          <span class="eyebrow eyebrow--light">${local ? 'From our local work and estimates' : 'Regional project example'}</span>
          <h2 id="project-slot-heading">${html(projectHeading)}.</h2>
          ${notes}
          <div class="local-proof-slot__actions"><a class="button button--orange" href="/services/residential/tile-lift-lay/">Tile Lift &amp; Lay</a><a class="button button--glass" href="/services/residential/asphalt-shingles/">Asphalt Shingles</a></div>
          <div class="local-proof-slot__service-links"><a href="/services/commercial/tpo/">TPO roofing</a><a href="/services/commercial/pvc/">PVC roofing</a><a href="/services/commercial/self-adhered/">Self-adhered modified bitumen</a><a href="/services/commercial/torch-down/">Torch-down</a></div>
        </div>
        <figure class="local-proof-slot__visual">
          <img src="/images/projects/carmel-mountain-ranch-tile-lift-lay/completed-tile-roof-hero.webp" alt="Completed concrete tile roof photographed by Zenith" width="1280" height="720" loading="lazy">
          <figcaption>Photo from Zenith’s completed concrete tile lift and lay in Carmel Mountain Ranch.</figcaption>
        </figure>
      </div>
    </section>`;
}

function systemExpertise(area, copy) {
  const localDecisions = {
    '/services/commercial/tpo/': copy.tpo,
    '/services/commercial/torch-down/': copy.torch,
    '/services/commercial/silicone-coatings/': copy.coating
  };
  return systemGuides.map((system, index) => `
          <article class="local-system-guide${index % 2 ? ' local-system-guide--reverse' : ''}" id="system-${index + 1}">
            <figure class="local-system-guide__visual"><img src="${system.image}" alt="${html(system.alt)}" width="1200" height="800" loading="lazy"><figcaption>Real Zenith system photography · See the complete service page for specifications and project context.</figcaption></figure>
            <div class="local-system-guide__copy">
              <span class="local-system-guide__label">${html(system.label)}</span>
              <h3>${html(system.name)} in ${html(area.name)}</h3>
              <p class="local-system-guide__lead">${html(system.lead)}</p>
              <p>${html(system.explanation)}</p>
              <p>${html(localDecisions[system.href] ?? system.decision)}</p>
              <ul>${system.points.map((point) => `<li>${html(point)}</li>`).join('')}</ul>
              ${index === 0 ? `<div class="local-tile-paths"><span>Explore tile roofing paths</span><div><a href="/services/residential/concrete-tile-roof-replacement/">Concrete Tile Replacement</a><a href="/services/residential/clay-tile-roof-replacement/">Clay Tile Replacement</a><a href="/services/residential/concrete-tile-lift-lay/">Concrete Tile Lift &amp; Lay</a><a href="/services/residential/clay-tile-lift-lay/">Clay Tile Lift &amp; Lay</a><a href="/services/residential/clay-tile-mortar-booster/">Clay Tile Mortar Booster</a></div></div>` : ''}
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
  const copy = localContent[area.slug];
  if (!copy?.work?.length || !copy.faqs?.length) throw new Error(`Missing roofing content, local questions or project example for ${area.slug}`);
  for (const key of requiredCopy) {
    if (!copy[key]?.trim()) throw new Error(`Missing ${key} for ${area.slug}`);
  }
  const project = projectBySlug[area.slug];
  const hero = heroFor(area);
  const faqs = faqData(area, copy);
  const canonical = `${baseUrl}/service-areas/${area.slug}/`;
  const projectAction = project ? `<a class="button button--glass" href="${project.url}">View the Local Case Study</a>` : '<a class="button button--glass" href="#services">Explore Every Service</a>';
  const description = copy.description;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>${html(copy.title)}</title>
  <meta name="description" content="${html(description)}">
  <link rel="canonical" href="${canonical}">
  <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${html(copy.title)}">
  <meta property="og:description" content="${html(description)}">
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
        <h1>${html(copy.title)}</h1>
        <p>${html(copy.hero)}</p>
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
          <div><span class="eyebrow">Roofing decisions for ${html(area.name)}</span><h2>Does the roof need a repair, a tune-up or replacement?</h2></div>
          <p>${html(area.name)} includes ${html(area.setting)}. Local roofs commonly include ${html(area.roofMix)}, so the correct scope begins with identifying the installed system and the actual water path.</p>
        </div>
        <div class="local-card-grid">
          <article><b>01 · Repair</b><h3>Find and repair the source of a leak.</h3><p>${html(copy.repair)}</p></article>
          <article><b>02 · Maintain</b><h3>Plan roof tune-ups and commercial roof maintenance.</h3><p>${html(copy.maintenance)}</p></article>
          <article><b>03 · Replace or restore</b><h3>Choose a complete system when conditions require it.</h3><p>Widespread waterproofing failure, brittle materials, deck damage or an unsuitable existing assembly can support replacement, lift and reset, or a qualified restoration system.</p></article>
        </div>
        <aside class="local-condition-note"><strong>Local decision factors</strong><p>For ${html(area.name)}, Zenith’s evaluation can account for ${html(area.conditions)}. The recommendation still depends on the specific property, access, installed materials and visible or concealed damage.</p></aside>
      </div>
    </section>

    ${projectSection(area, copy.work)}

    <section class="local-section local-section--systems" id="roof-systems" aria-labelledby="roof-systems-heading">
      <div class="shell">
        <div class="local-heading">
          <div><span class="eyebrow">Roof-system expertise</span><h2 id="roof-systems-heading">Full system guidance for ${html(area.name)} properties.</h2></div>
          <p>Compare what can be repaired, when a roof coating is suitable and when the roof needs a new membrane or covering. Each service below explains how we evaluate the existing roof.</p>
        </div>
        <div class="local-system-guides">${systemExpertise(area, copy)}</div>
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
        <div class="local-coverage__copy"><span class="eyebrow">Service area</span><h2>${html(area.name)} ZIP codes and nearby communities.</h2><p>We serve ${html(area.name)} in ${html(area.county)}. Use the ZIP codes and nearby communities below to find the guide closest to your property.</p></div>
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
  <section class="interior-hero service-areas-hero"><img src="/images/modern-tile-roof-1600.webp" alt="Southern California tile roof inspected by Zenith Roofing Services" width="1600" height="900" fetchpriority="high"><span class="interior-hero__shade" aria-hidden="true"></span><div class="shell interior-hero__content"><span class="eyebrow eyebrow--light">Cities · neighborhoods · communities</span><h1>Roofing services by city and neighborhood.</h1><p>Find your community to compare tile and shingle repairs, roof tune-ups, silicone coatings, TPO and torch-down roofing. Each guide explains what we check on homes and commercial properties and links to relevant project examples.</p><div class="interior-hero__actions"><a class="button button--orange" href="/contact/">Request a Free Estimate <span aria-hidden="true">→</span></a><a class="button button--glass" href="tel:8589006163">Call&nbsp;858&#8209;900&#8209;6163</a></div></div></section>
  <section class="interior-trust" aria-label="Zenith service standards"><div class="shell interior-trust__grid"><span><b>Licensed C-39</b><small>CSLB #1036112</small></span><span><b>${areas.length} local guides</b><small>Cities and known communities</small></span><span><b>${serviceGroups.reduce((count, group) => count + group.services.length, 0)} roofing services</b><small>Repair through commercial systems</small></span><span><b>Real project proof</b><small>Added only when verified</small></span></div></section>
  <section class="service-area-directory" aria-labelledby="service-area-title"><div class="shell"><div class="service-area-directory__heading"><div><span class="eyebrow">Find your community</span><h2 id="service-area-title">Roofing service near you.</h2></div><p>Search a city, neighborhood or ZIP code to find the guide for your property. You can look up a community such as Rancho Bernardo directly.</p></div>
    <div class="service-area-search" role="search" aria-label="Search roofing service areas"><label for="service-area-search-input">Search by city, community or ZIP</label><div class="service-area-search__control"><span aria-hidden="true">⌕</span><input id="service-area-search-input" type="search" autocomplete="off" spellcheck="false" placeholder="Try San Marcos, 92078 or Rancho Bernardo" aria-describedby="service-area-search-status"><button id="service-area-search-clear" type="button" hidden>Clear</button></div><p id="service-area-search-status" aria-live="polite">${areas.length} service areas available.</p></div>
    <article class="service-area-featured" data-service-area-featured aria-labelledby="featured-carmel-title"><picture class="service-area-featured__image"><source media="(max-width:640px)" srcset="/images/projects/carmel-mountain-ranch-tile-lift-lay/completed-tile-roof-hero-640.webp"><source media="(max-width:960px)" srcset="/images/projects/carmel-mountain-ranch-tile-lift-lay/completed-tile-roof-hero-960.webp"><img src="/images/projects/carmel-mountain-ranch-tile-lift-lay/completed-tile-roof-hero.webp" alt="Completed concrete tile roof in Carmel Mountain Ranch" width="1280" height="720" loading="lazy"></picture><div class="service-area-featured__copy"><span class="eyebrow">Featured local proof</span><h3 id="featured-carmel-title">Carmel Mountain Ranch roofing backed by a real tile project.</h3><p>See the existing concrete tile lifted and reset after decking repairs, flashing work and underlayment replacement.</p><div class="service-area-featured__actions"><a class="button button--orange" href="/service-areas/carmel-mountain-ranch/">View Local Guide</a><a class="button button--navy" href="/projects/carmel-mountain-ranch-tile-lift-lay/">View Case Study</a></div></div></article>
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
