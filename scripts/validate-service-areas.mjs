import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const areas = JSON.parse(fs.readFileSync(path.join(root, 'data/service-areas.json'), 'utf8'));
const serviceGroups = JSON.parse(fs.readFileSync(path.join(root, 'data/service-area-services.json'), 'utf8'));
const errors = [];
const warnings = [];

function fail(file, message) { errors.push(`${file}: ${message}`); }
function count(text, regex) { return [...text.matchAll(regex)].length; }

const slugs = new Set();
for (const area of areas) {
  if (slugs.has(area.slug)) fail('data/service-areas.json', `duplicate slug ${area.slug}`);
  slugs.add(area.slug);
  if (!area.zips?.length) fail('data/service-areas.json', `${area.slug} has no common ZIP`);
  if (!area.nearby?.length) fail('data/service-areas.json', `${area.slug} has no nearby areas`);

  const relative = `service-areas/${area.slug}/index.html`;
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) {
    fail(relative, 'page missing');
    continue;
  }
  const source = fs.readFileSync(file, 'utf8');
  if (count(source, /<h1\b/gi) !== 1) fail(relative, 'must contain exactly one H1');
  if (!source.includes(`rel="canonical" href="https://zenithroofingservices.com/service-areas/${area.slug}/"`)) fail(relative, 'canonical URL is incorrect');
  if (!source.includes('id="services"')) fail(relative, 'complete service catalog section missing');
  if (!source.includes('id="roof-systems"')) fail(relative, 'full roof-system guidance section missing');
  if (count(source, /class="local-system-guide(?:\s|\")/g) !== 7) fail(relative, 'expected seven full system guides');
  if (!source.includes(area.zips[0])) fail(relative, 'common ZIP content missing');
  if (/SEO landing page auto-generated/i.test(source)) fail(relative, 'legacy auto-generated note remains');

  const ids = [...source.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) fail(relative, `duplicate IDs: ${[...new Set(duplicateIds)].join(', ')}`);

  for (const match of source.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(match[1]); } catch (error) { fail(relative, `invalid JSON-LD: ${error.message}`); }
  }

  for (const match of source.matchAll(/\s(?:src|href)="(\/(?:images|services|projects)\/[^"?#]+\/?)(?:[?#][^"]*)?"/g)) {
    const urlPath = match[1];
    const local = path.join(root, urlPath.replace(/^\//, ''));
    const expected = path.extname(local) ? local : path.join(local, 'index.html');
    if (!fs.existsSync(expected)) fail(relative, `broken local reference ${urlPath}`);
  }
}

const serviceCount = serviceGroups.flatMap((group) => group.services).length;
if (serviceCount !== 52) fail('data/service-area-services.json', `expected 52 services, found ${serviceCount}`);
for (const service of serviceGroups.flatMap((group) => group.services)) {
  const target = path.join(root, service.href.replace(/^\//, ''), 'index.html');
  if (!fs.existsSync(target)) fail('data/service-area-services.json', `service URL does not resolve: ${service.href}`);
}

const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
for (const area of areas) {
  if (!sitemap.includes(`https://zenithroofingservices.com/service-areas/${area.slug}/`)) fail('sitemap.xml', `missing ${area.slug}`);
}

const indexSource = fs.readFileSync(path.join(root, 'service-areas/index.html'), 'utf8');
for (const area of areas) {
  if (!indexSource.includes(`/service-areas/${area.slug}/`)) fail('service-areas/index.html', `missing ${area.slug}`);
}

if (warnings.length) console.warn(warnings.join('\n'));
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Validated ${areas.length} service-area pages, ${serviceCount} service definitions, local links, images, canonicals, H1s, JSON-LD and sitemap coverage.`);
