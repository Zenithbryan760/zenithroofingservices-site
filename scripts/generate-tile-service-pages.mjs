import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const services = [
  { slug: 'concrete-tile-roof-replacement', title: 'Concrete Tile Roof Replacement', kicker: 'New concrete tile roofing', h1: 'Replace an aging concrete tile roof with a complete new system.', description: 'Zenith replaces concrete tile roofs with new tile, a renewed water-control system, flashings and details planned around the home’s roof geometry.', tile: 'concrete tile', types: 'flat, low-profile and traditional concrete tile profiles', process: 'Remove the existing roof covering, inspect the exposed deck, install the specified underlayment and flashings, then complete the new concrete tile layout.', decision: 'Replacement can be the right path when the existing concrete tile is widely broken, difficult to match, no longer suits the home, or the owner wants a fully new roof finish.', campaign: 'concrete-tile-roof-replacement' },
  { slug: 'clay-tile-roof-replacement', title: 'Clay Tile Roof Replacement', kicker: 'New clay tile roofing', h1: 'A dedicated replacement path for real clay tile roofs.', description: 'Zenith plans clay tile roof replacement around the profile, the roof structure, drainage details and the finished architecture of the home.', tile: 'clay tile', types: 'two-piece clay, S-tile and Spanish tile profiles', process: 'Remove the existing roof covering, inspect the exposed deck, install the specified underlayment and flashings, then complete the new clay tile layout.', decision: 'Replacement can be the right path when older clay tile is too fragile or incomplete to reuse reliably, matching is impractical, or the home needs a fully new clay tile system.', campaign: 'clay-tile-roof-replacement' },
  { slug: 'concrete-tile-lift-lay', title: 'Concrete Tile Lift & Lay', kicker: 'Concrete tile lift and lay', h1: 'Keep serviceable concrete tile. Rebuild the roof beneath it.', description: 'Zenith carefully lifts and stages reusable concrete tile so the deck, underlayment, valleys and flashing can be renewed before the tile is relaid.', tile: 'concrete tile', types: 'flat, low-profile and traditional concrete tile profiles', process: 'Lift and stage reusable concrete tile, remove the old underlayment, inspect the exposed deck, rebuild the water-control details, then relay suitable tile.', decision: 'A lift and lay can be the responsible path when concrete tile remains serviceable but the underlayment and flashings below have aged beyond isolated repair.', campaign: 'concrete-tile-lift-lay' },
  { slug: 'clay-tile-lift-lay', title: 'Clay Tile Lift & Lay', kicker: 'Clay tile lift and lay', h1: 'Protect the character of clay tile while renewing what is below it.', description: 'Zenith carefully handles reusable clay tile while rebuilding the underlayment, flashings and drainage details that protect the home.', tile: 'clay tile', types: 'two-piece clay, S-tile and Spanish tile profiles', process: 'Lift and stage reusable clay tile, remove the old underlayment, inspect the exposed deck, rebuild the water-control details, then relay suitable tile.', decision: 'A lift and lay can be the responsible path when the clay tile retains value but the underlayment, flashing or drainage details beneath it have reached the end of their service cycle.', campaign: 'clay-tile-lift-lay' },
  { slug: 'clay-tile-mortar-booster', title: 'Clay Tile Mortar Booster', kicker: 'Mortar-set clay tile maintenance', h1: 'Restore critical mortar details on a fully mortar-set clay tile roof.', description: 'Zenith evaluates and restores deteriorated mortar at clay tile hips, ridges, rakes and transitions when the roof’s condition supports focused mortar-booster work.', tile: 'clay tile', types: 'two-piece clay, S-tile and Spanish tile profiles', process: 'Inspect the mortar-set details, remove loose or failed material where included, prepare the area, install compatible new mortar and complete the affected clay-tile transitions.', decision: 'A mortar booster is a focused maintenance or repair path. It does not replace a needed lift and lay or roof replacement when the waterproofing below the tile has broadly failed.', campaign: 'clay-tile-mortar-booster' }
];

const esc = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const page = (service) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(service.title)} | Zenith Roofing</title>
  <meta name="description" content="${esc(service.description)}">
  <link rel="canonical" href="https://zenithroofingservices.com/services/residential/${service.slug}/">
  <link rel="stylesheet" href="/css/zenith-premium-exact.css">
  <link rel="stylesheet" href="/css/estimate-form.css">
  <link rel="stylesheet" href="/css/tile-roof-replacement-premium.css">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Service","name":"${esc(service.title)}","provider":{"@type":"RoofingContractor","name":"Zenith Roofing Services, Inc.","telephone":"+1-858-900-6163"}}</script>
</head>
<body class="tile-replacement">
  <a class="skip-link" href="#main-content">Skip to content</a>
  <div data-include="/components/header-section.html"></div>
  <main id="main-content" class="page">
    <section class="hero"><div class="shell hero-grid"><div>
      <p class="eyebrow">${esc(service.kicker)}</p><h1>${esc(service.h1)}</h1><p class="lede">${esc(service.description)}</p>
      <div class="actions"><a class="button button-primary" href="#estimate">Request a tile roof estimate</a><a class="button button-ghost" href="#process">See the process</a></div>
      <div class="pills"><span>${esc(service.tile)}</span><span>Deck, underlayment &amp; flashing</span><span>Southern California service</span></div>
    </div><figure class="glass"><img src="/images/finished-tile-lift-relay.webp" alt="Completed tile roof photographed by Zenith"><figcaption><strong>Roof-system first.</strong> The visible tile depends on the water-control system beneath it.</figcaption></figure></div></section>
    <nav class="pillnav" aria-label="Page sections"><a href="#system">The service</a><a href="#profiles">Tile profiles</a><a href="#process">Process</a><a href="#decision">Repair or replace</a><a href="#estimate">Estimate</a></nav>
    <section id="system" class="section shell"><div class="intro"><p class="eyebrow">A complete roofing decision</p><h2>Start with the actual roof assembly, not just the visible tile.</h2><p>${esc(service.process)} The final scope follows the roof condition, complete drainage paths and the selected material system.</p></div><div class="cards"><article><h3>Deck and dry-in</h3><p>Once the roof is opened, Zenith can identify exposed deck and wood conditions before new waterproofing covers them.</p></article><article><h3>Flashing and drainage</h3><p>Valleys, walls, chimneys, skylights, penetrations and edges are planned to shed water in the correct order.</p></article><article><h3>Tile layout and finish</h3><p>Tile profile, accessory pieces, ridges, hips, rakes and transitions are part of the completed roof system.</p></article></div></section>
    <section id="profiles" class="band"><div class="shell solar"><div><p class="eyebrow">Clay and concrete are not interchangeable</p><h2>${esc(service.title)} for the roof you actually have.</h2><p>This service addresses ${esc(service.types)}. Zenith confirms the installed profile, available compatible materials, roof geometry and the practical scope before work is scheduled.</p><p>Existing tile may be reusable in some lift-and-lay scopes; exact profile and color matching cannot always be guaranteed when older tile is discontinued.</p></div><figure><img src="/images/clay-tile-roof-repair/two-piece-clay-roof-completed-1200.webp" alt="Completed clay tile roofing photographed by Zenith"><figcaption>Representative Zenith tile-roof photography.</figcaption></figure></div></section>
    <section id="process" class="section photo"><div class="shell"><div class="intro light"><p class="eyebrow">The Zenith process</p><h2>Document the work before the roof is closed back in.</h2></div><ol class="steps"><li><b>01</b><h3>Inspect and plan</h3><p>Confirm the roof assembly, access, drainage paths and the appropriate scope.</p></li><li><b>02</b><h3>Open and prepare</h3><p>${esc(service.process)}</p></li><li><b>03</b><h3>Build water control</h3><p>Install the specified underlayment, flashings and critical-area details.</p></li><li><b>04</b><h3>Finish and document</h3><p>Complete the tile work, clean the site and provide progress documentation.</p></li></ol></div></section>
    <section id="decision" class="section shell"><div class="intro"><p class="eyebrow">Choose the responsible scope</p><h2>Repair, lift and lay, or replacement depends on what is still serviceable.</h2><p>${esc(service.decision)}</p></div><div class="cards"><article><h3>Focused repair</h3><p>Appropriate for a clear, isolated defect with a reliable tie-in to the surrounding roof.</p></article><article><h3>Lift &amp; lay</h3><p>Useful when serviceable tile can remain while the aged waterproofing system beneath it is renewed.</p></article><article><h3>Full replacement</h3><p>Considered when the existing tile, roof system or design goal no longer supports a durable reuse path.</p></article></div></section>
    <section id="estimate" class="estimate shell"><div><p class="eyebrow">Secure estimate request</p><h2>Tell us about your ${esc(service.tile)} roof.</h2><p>Share the approximate roof age, tile type, leak or repair history, and photos if available. We will help compare the responsible path for the roof.</p></div><div data-include="/components/estimate-form.html"></div></section>
  </main>
  <div data-include="/components/footer.html"></div>
  <script src="/js/loader.js" defer></script><script src="/js/header.js" defer></script>
  <script>window.ESTIMATE_FORM_CONFIG={submitText:"Request Free Estimate",referralPreselect:"Website",descriptionPlaceholder:"Tell us your tile type, approximate roof age, leak or repair history, and whether you are considering repair, lift and lay, replacement or mortar work.",hiddenFields:{campaign:"services/residential/${service.campaign}",page_tag:"${service.slug}"}};</script>
  <script src="/js/estimate-form.js" defer></script><script src="https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoaded&render=explicit" async defer></script>
</body>
</html>`;

for (const service of services) {
  const directory = path.join(root, 'services/residential', service.slug);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'index.html'), page(service));
}
