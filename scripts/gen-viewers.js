// Builds a simple viewer page per published item in data/projects.json
import fs from 'fs';
const PUB='data/projects.json';
if(!fs.existsSync(PUB)){ console.error('Run gen-public.js first'); process.exit(1); }
const items=JSON.parse(fs.readFileSync(PUB,'utf8'));

const html = (it)=>`<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${it.name}</title>
<link rel="stylesheet" href="/css/base.css">
<style>
.page{max-width:1000px;margin:24px auto;padding:0 16px}
.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin:16px 0}
.gallery img{width:100%;height:auto;border-radius:10px}
.badges{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
.badges span{background:#eef3ff;border:1px solid #dfe7ff;padding:4px 8px;border-radius:999px;font-size:.85rem}
.meta{color:#556}
.breadcrumb a{color:#0a58; text-decoration:underline}
</style>
<script type="application/ld+json">
${JSON.stringify({
  "@context":"https://schema.org",
  "@type":"Place",
  "name": it.name,
  "address":{"@type":"PostalAddress","addressLocality":it.city,"addressRegion":it.state,"addressCountry":"US"},
  "geo":{"@type":"GeoCoordinates","latitude":it.lat,"longitude":it.lng}
})}
</script>
</head>
<body>
<div class="page">
  <p class="breadcrumb"><a href="/projects/">← Back to Projects</a></p>
  <h1>${it.name}</h1>
  <p class="meta">${it.city}, ${it.state} • ${it.dateCompleted || ''} ${it.approx?'• (approx. location)':''}</p>
  <div class="badges">
    ${[it.service, ...(it.tags||[])].filter(Boolean).map(t=>`<span>${t}</span>`).join('')}
  </div>
  <div class="gallery">
    ${(it.photos||[]).map(u=>`<img loading="lazy" src="${u}" alt="Project photo">`).join('')}
  </div>
</div>
</body></html>`;

for(const it of items){
  const slug = it.url.replace(/^\/projects\/|\/$/g,'');
  const dir = `projects/${slug}`;
  fs.mkdirSync(dir, {recursive:true});
  fs.writeFileSync(`${dir}/index.html`, html(it));
  console.log('Viewer:', it.name, '->', dir);
}
