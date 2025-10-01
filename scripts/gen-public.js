const fs = require('fs');
const PRIV='data/projects-private.json', PUB='data/projects.json';

const cityCenter={Escondido:{lat:33.1192,lng:-117.0864},Temecula:{lat:33.4936,lng:-117.1484}};
function seeded(seed){let h=2166136261>>>0;for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return()=>((h=Math.imul(h^(h>>>15),2246822507)^Math.imul(h^(h>>>13),3266489909))>>>0)/4294967295;}
function jitter(lat,lng,id){const r=seeded('salt-'+id),m=150+r()*150,t=r()*Math.PI*2;const dLat=(m*Math.cos(t))/111320,dLng=(m*Math.sin(t))/(111320*Math.cos(lat*Math.PI/180));return{lat:+(lat+dLat).toFixed(5),lng:+(lng+dLng).toFixed(5)}}
const slugify=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const sortPhotos=(a,b)=>{const sc=f=>(/^00[-_]/i.test(f)?2:/hero|front/i.test(f)?1:0);const sa=sc(a),sb=sc(b);return sa!==sb?sb-sa:a.localeCompare(b);};

if(!fs.existsSync(PRIV)){console.error('Missing',PRIV);process.exit(1);}
const src=JSON.parse(fs.readFileSync(PRIV,'utf8')); const out=[];
for(const p of src){
  if((p.status||'').toLowerCase()!=='completed') continue;
  const baseLL=(typeof p.lat==='number'&&typeof p.lng==='number')?{lat:p.lat,lng:p.lng}:(cityCenter[p.city]||null);
  if(!baseLL) continue;
  const ll=jitter(baseLL.lat,baseLL.lng,p.id);
  // read any approved images present in the folder
  const folder=`images/projects/${p.id}`;
  let pics=[]; try { pics=fs.readdirSync(folder).filter(f=>/\.(jpe?g|png|webp|avif)$/i.test(f)).sort(sortPhotos).map(f=>`/${folder}/${f}`);} catch(_){}
  const slug=[p.city,p.service||p.name,p.id.replace(/^PRIV-/,'').toLowerCase()].map(slugify).filter(Boolean).slice(0,3).join('-');
  out.push({
    id:p.id.replace(/^PRIV-/,'GPS-'), privId:p.id,
    name:p.name||`${p.service||'Project'} — ${p.city||''}`,
    service:p.service||'', tags:p.tags||[],
    city:p.city||'', state:p.state||'CA',
    lat:ll.lat, lng:ll.lng, approx:true,
    photos:pics.slice(0,12),
    url:`/projects/${slug}/`,
    summary:p.summary||''
  });
}
fs.mkdirSync('data',{recursive:true});
fs.writeFileSync(PUB,JSON.stringify(out,null,2));
console.log('Wrote',PUB,'items:',out.length);
