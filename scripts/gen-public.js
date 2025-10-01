// Reads data/projects-private.json and writes privacy-safe data/projects.json
// - jittered lat/lng (≈150–300 m) for privacy
// - only approved photos
// - adds a "slug" + viewer URL
import fs from 'fs';

const PRIV = 'data/projects-private.json';
const PUB  = 'data/projects.json';

const cityCenter = { // fallbacks if lat/lng missing
  Escondido: { lat: 33.1192, lng: -117.0864 },
  Temecula:  { lat: 33.4936, lng: -117.1484 },
};

function seeded(seed){ let h=2166136261>>>0; for(const c of String(seed)){ h^=c.charCodeAt(0); h=Math.imul(h,16777619);} return ()=>((h=Math.imul(h^(h>>>15),2246822507)^Math.imul(h^(h>>>13),3266489909))>>>0)/4294967295; }
function jitter(lat,lng,id){
  const rnd=seeded('salt-'+id);
  const meters=150+rnd()*150, theta=rnd()*Math.PI*2;
  const dLat=(meters*Math.cos(theta))/111320;
  const dLng=(meters*Math.sin(theta))/(111320*Math.cos(lat*Math.PI/180));
  return { lat:+(lat+dLat).toFixed(5), lng:+(lng+dLng).toFixed(5) };
}
const slugify = s => String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

if(!fs.existsSync(PRIV)) { console.error('Missing', PRIV); process.exit(1); }
const src = JSON.parse(fs.readFileSync(PRIV,'utf8'));

const out = [];
for(const p of src){
  if((p.status||'').toLowerCase()!=='completed') continue;
  const baseLL = (typeof p.lat==='number'&&typeof p.lng==='number')
    ? {lat:p.lat,lng:p.lng}
    : (cityCenter[p.city]||null);
  if(!baseLL){ console.warn('Skipping (no location):', p.id); continue; }

  const ll = jitter(baseLL.lat, baseLL.lng, p.id);
  const photos = (p.photosApproved||[]).slice(0, 12);

  const slug = [p.city, p.service||p.name, p.id.replace(/^PRIV-/,'').toLowerCase()]
    .map(slugify).filter(Boolean).slice(0,3).join('-');

  out.push({
    id: p.id.replace(/^PRIV-/,'GPS-'),
    privId: p.id,
    name: p.name || `${p.service||'Project'} — ${p.city||''}`,
    service: p.service || '',
    tags: p.tags || [],
    city: p.city || '',
    state: p.state || 'CA',
    dateCompleted: p.dateCompleted || '',
    lat: ll.lat, lng: ll.lng, approx: true,
    photos,
    url: `/projects/${slug}/`
  });
}

fs.mkdirSync('data', {recursive:true});
fs.writeFileSync(PUB, JSON.stringify(out,null,2));
console.log('Wrote', PUB, 'items:', out.length);
