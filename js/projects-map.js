(function(){
  const MAP_ID='radius-only-map';
  const JSON_PATHS=['/data/projects.json','data/projects.json','../data/projects.json'];

  // Inject crisp, modern tooltip styles
  (function addTipCss(){
    if(document.getElementById('zr-tip-css')) return;
    const css = `
      .zr-tip-wrap.leaflet-tooltip{background:transparent;border:0;box-shadow:none;padding:0}
      .zr-tip-wrap.leaflet-tooltip-top:before,
      .zr-tip-wrap.leaflet-tooltip-bottom:before,
      .zr-tip-wrap.leaflet-tooltip-left:before,
      .zr-tip-wrap.leaflet-tooltip-right:before{display:none}
      .zr-tip{
        display:grid;grid-template-columns:112px 1fr;gap:12px;align-items:center;
        background:#fff;border:1px solid #e8eaf0;border-radius:14px;padding:12px;
        box-shadow:0 10px 28px rgba(0,0,0,.12);max-width:min(560px,82vw)
      }
      .zr-tip .img{width:112px;height:80px;border-radius:10px;overflow:hidden;border:1px solid #e8eaf0}
      .zr-tip .img img{width:100%;height:100%;object-fit:cover;display:block}
      .zr-tip .t{display:flex;flex-direction:column;gap:6px;min-width:0}
      .zr-tip .title{
        font-weight:600;font-size:clamp(.95rem,1.25vw,1.05rem);line-height:1.25;
        display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden
      }
      .zr-tip .sub{color:#5b6270;font-size:.9rem;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    `.trim();
    const el=document.createElement('style'); el.id='zr-tip-css'; el.textContent=css; document.head.appendChild(el);
  })();

  function firstJson(paths){
    return new Promise((res,rej)=>{
      (function next(i){
        if(i>=paths.length) return rej(new Error('projects.json not found'));
        fetch(paths[i]).then(r=>r.ok?r.json():Promise.reject()).then(res).catch(()=>next(i+1));
      })(0);
    });
  }

  function pickEscondido(data){
    return data.find(p=>p.id==='ESCO-ELKHORN-LIFT-LAY')
        || data.find(p=>/escondido/i.test(p.city||'')) || data[0];
  }

  function tipHTML(p){
    const img = p.cardImage || (p.images && p.images[0]) || '';
    const src = '/' + String(img||'').replace(/^\/+/, '');
    const title = p.name || 'Project';
    const context = 'Lift & Relay • Escondido (near Country Club Ln)';
    return `
      <div class="zr-tip">
        <div class="img">${img ? `<img src="${src}" alt="${title}">` : ''}</div>
        <div class="t">
          <div class="title">${title}</div>
          <div class="sub">${context}</div>
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
      const p = pickEscondido(data||[]);
      if(!p || !p.radiusCenter) return;

      const center=[p.radiusCenter.lat, p.radiusCenter.lng];
      map.setView(center, 15);

      const circle=L.circle(center,{
        radius:p.radiusMeters||400,
        color:'#2d6cdf', fillColor:'#2d6cdf', fillOpacity:0.25, weight:2
      }).addTo(map);

      // Hover preview
      circle.bindTooltip(tipHTML(p), {
        direction:'top', sticky:true, opacity:1, className:'zr-tip-wrap', offset:[0,-10]
      });

      // Click → open modal (from zr-modal.js) — no privacy line in notes
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
