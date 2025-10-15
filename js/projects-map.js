(function(){
  const MAP_ID='radius-only-map';
  const JSON_PATHS=['/data/projects.json','data/projects.json','../data/projects.json'];

  // Modern, compact tooltip styles (desktop + mobile)
  (function addTipCss(){
    if(document.getElementById('zr-tip-css')) return;
    const css = `
      .zr-tip-wrap.leaflet-tooltip{background:transparent;border:0;box-shadow:none;padding:0}
      .zr-tip-wrap.leaflet-tooltip:before{display:none}

      .zr-tip{
        --pad:12px;
        display:grid; grid-template-columns: 96px 1fr; gap:12px; align-items:center;
        background:#fff; border:1px solid #e6e9f0; border-radius:14px; padding:var(--pad);
        box-shadow:0 10px 28px rgba(0,0,0,.12); max-width:min(540px,86vw);
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
      }
      .zr-tip .img{
        width:96px; height:72px; border-radius:10px; overflow:hidden; border:1px solid #e6e9f0;
      }
      .zr-tip .img img{width:100%;height:100%;object-fit:cover;display:block}
      .zr-tip .t{min-width:0; display:flex; flex-direction:column; gap:6px}
      .zr-tip .title{
        font-weight:700; letter-spacing:.1px;
        font-size: clamp(.95rem, 1.15vw, 1.05rem); line-height:1.22;
        display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
      }
      .zr-tip .meta{
        display:flex; flex-wrap:wrap; gap:6px 8px; align-items:center;
      }
      .zr-chip{
        background:#f6f8fb; border:1px solid #e6e9f0; color:#303744;
        border-radius:999px; padding:4px 8px; font-size:.80rem; line-height:1; white-space:nowrap;
      }
      /* Tighten layout if width gets small */
      @media (max-width: 640px){
        .zr-tip{
          grid-template-columns: 72px 1fr;
          --pad:10px; gap:10px; max-width:92vw;
        }
        .zr-tip .img{width:72px;height:56px;border-radius:8px}
        .zr-chip{font-size:.78rem; padding:3px 7px}
      }
      /* Respect users who prefer less motion */
      @media (prefers-reduced-motion: reduce){
        .zr-tip{transition:none}
      }
    `.trim();
    const el=document.createElement('style'); el.id='zr-tip-css'; el.textContent=css;
    document.head.appendChild(el);
  })();

  function firstJson(paths){
    return new Promise((res,rej)=>{
      (function next(i){
        if(i>=paths.length) return rej(new Error('projects.json not found'));
        fetch(paths[i]).then(r=>r.ok?r.json():Promise.reject()).then(res).catch(()=>next(i+1));
      })(0);
    });
  }

  function pickProject(data){
    return data.find(p=>p.id==='ESCO-ELKHORN-LIFT-LAY')
        || data.find(p=>/escondido/i.test(p.city||'')) || data[0];
  }

  // Build compact, robust hover card
  function tipHTML(p){
    const img = p.cardImage || (p.images && p.images[0]) || '';
    const src = '/' + String(img||'').replace(/^\/+/, '');
    const title = p.name || 'Project';
    const chips = (p.chips && p.chips.length ? p.chips : [
      'Tile Lift & Relay',
      'Escondido',
      '2 layers Malarkey RightStart',
      'near Country Club Ln'
    ]);

    return `
      <div class="zr-tip" role="dialog" aria-label="${title}">
        <div class="img">${img ? `<img src="${src}" alt="${title}">` : ''}</div>
        <div class="t">
          <div class="title">${title}</div>
          <div class="meta">${chips.map(c=>`<span class="zr-chip">${c}</span>`).join('')}</div>
        </div>
      </div>
    `;
  }

  function init(){
    const el=document.getElementById(MAP_ID);
    if(!el || !window.L) return;

    const map=L.map(MAP_ID,{scrollWheelZoom:false});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);

    firstJson(JSON_PATHS).then(data=>{
      const p = pickProject(data||[]);
      if(!p || !p.radiusCenter) return;

      const center=[p.radiusCenter.lat, p.radiusCenter.lng];
      map.setView(center, 15);

      const circle=L.circle(center,{
        radius:p.radiusMeters||400, color:'#2d6cdf', fillColor:'#2d6cdf', fillOpacity:0.25, weight:2
      }).addTo(map);

      // Hover preview – compact and readable
      circle.bindTooltip(tipHTML(p), {
        direction:'top', sticky:true, opacity:1, className:'zr-tip-wrap', offset:[0,-10]
      });

      // Mobile: show tooltip on first tap (then click opens modal)
      circle.on('touchstart', ()=> circle.openTooltip());

      // Click → open modal (notes without privacy line)
      circle.on('click', ()=> window.ZR_openProjectModal && window.ZR_openProjectModal({
        name: p.name,
        images: p.images,
        cardImage: p.cardImage,
        url: p.url || "/projects/escondido-tile-lift-lay-elkhorn/",
        notes: p.notes || [
          "Tile lift & relay with high-temp underlayment.",
          "Updated flashings and vents."
        ]
      }));
    }).catch(()=>{});
  }

  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
