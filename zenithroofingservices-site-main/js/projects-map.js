(function () {
  const MAP_ID = 'radius-only-map';
  const JSON_PATHS = ['/data/projects.json','data/projects.json','../data/projects.json'];

  // Inject tight, scoped styles (prevents page CSS from leaking into the tooltip)
  (function injectCss(){
    if (document.getElementById('zr-tip-css')) return;
    const css = `
      /* Tooltip shell */
      .leaflet-tooltip.zr-tip{ background:transparent !important;border:0 !important;box-shadow:none !important;padding:0 !important; }
      .leaflet-tooltip.zr-tip:before{ display:none !important; }
      .leaflet-tooltip.zr-tip .leaflet-tooltip-content{ margin:0 !important;padding:0 !important;white-space:normal !important;display:block !important; }

      /* SCOPED reset just for our card */
      #${MAP_ID} .zr-card, #${MAP_ID} .zr-card *{
        box-sizing:border-box !important;
        writing-mode:horizontal-tb !important; direction:ltr !important; text-orientation:mixed !important;
        text-transform:none !important; letter-spacing:normal !important; white-space:normal !important;
        transform:none !important; font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial !important;
        color:#0f172a !important;
      }

      /* Card */
      #${MAP_ID} .zr-card{
        --pad:12px; --imgW:96px; --imgH:72px;
        display:grid; grid-template-columns:var(--imgW) 1fr; gap:12px; align-items:center;
        background:#fff; border:1px solid #e6e9f0; border-radius:16px; padding:var(--pad);
        inline-size:clamp(280px,48vw,360px); max-inline-size:360px;
        box-shadow:0 10px 26px rgba(2,6,23,.14); overflow:hidden; isolation:isolate; contain:content;
        transition:box-shadow .18s ease, transform .18s ease;
        pointer-events:none; /* allows hover on circle; buttons re-enable */
      }
      #${MAP_ID} .zr-card:hover{ box-shadow:0 16px 36px rgba(2,6,23,.18); transform:translateY(-1px); }

      #${MAP_ID} .zr-card__img{ width:var(--imgW); height:var(--imgH); border-radius:10px; overflow:hidden; border:1px solid #e6e9f0; }
      #${MAP_ID} .zr-card__img img{ width:100%; height:100%; object-fit:cover; display:block; }

      #${MAP_ID} .zr-card__body{ min-width:0; display:flex; flex-direction:column; gap:6px; }
      #${MAP_ID} .zr-title{
        font-weight:700; font-size:.98rem; line-height:1.22; letter-spacing:.1px;
        display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
      }
      #${MAP_ID} .zr-sub{ color:#475467; font-size:.86rem; line-height:1.25; overflow-wrap:anywhere; }
      #${MAP_ID} .zr-chips{ display:flex; flex-wrap:wrap; gap:6px 8px; max-inline-size:100%; }
      #${MAP_ID} .zr-chip{
        background:#f6f8fb; border:1px solid #e6e9f0; color:#303744;
        border-radius:999px; padding:4px 8px; font-size:.78rem; line-height:1; overflow-wrap:anywhere;
      }
      #${MAP_ID} .zr-cta{ margin-top:2px; display:flex; gap:8px; }
      #${MAP_ID} .zr-btn{ pointer-events:auto; cursor:pointer; border-radius:999px; line-height:1;
        padding:6px 10px; font-size:.82rem; border:1px solid #2d6cdf; background:#2d6cdf; color:#fff; }
      #${MAP_ID} .zr-btn--ghost{ background:#fff; color:#2d6cdf; }

      /* Mobile */
      @media (max-width:640px){
        #${MAP_ID} .zr-card{ --pad:10px; --imgW:72px; --imgH:56px; gap:10px; inline-size:min(92vw,360px); }
        #${MAP_ID} .zr-title{ font-size:.95rem; }
        #${MAP_ID} .zr-chip{ font-size:.76rem; padding:3px 7px; }
      }
    `.trim();
    const el = document.createElement('style'); el.id='zr-tip-css'; el.textContent = css; document.head.appendChild(el);
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

  function cardHTML(p){
    const img = p.cardImage || (p.images && p.images[0]) || '';
    const src = '/' + String(img||'').replace(/^\/+/, '');
    const title = p.name || 'Project';
    const sub = p.subtitle || '';
    const chips = (p.chips && p.chips.length ? p.chips : [
      'Tile Lift & Relay','Escondido','2 layers Malarkey RightStart','near Country Club Ln'
    ]);
    return `
      <div class="zr-card" role="dialog" aria-label="${title}">
        <div class="zr-card__img">${img ? `<img src="${src}" alt="${title}">` : ''}</div>
        <div class="zr-card__body">
          <div class="zr-title">${title}</div>
          ${sub ? `<div class="zr-sub">${sub}</div>` : ''}
          <div class="zr-chips">${chips.map(c=>`<span class="zr-chip">${c}</span>`).join('')}</div>
          <div class="zr-cta">
            <button class="zr-btn" onclick="(event.stopPropagation(), window.ZR_openProjectModal && window.ZR_openProjectModal(${JSON.stringify({name:title, images:p.images, cardImage:p.cardImage, url:p.url||'/projects/'}).replace(/"/g,'&quot;')}))">View Project</button>
            ${p.url ? `<a class="zr-btn zr-btn--ghost" href="${p.url}" onclick="event.stopPropagation()">Details</a>` : ''}
          </div>
        </div>
      </div>`;
  }

  function init(){
    const host = document.getElementById(MAP_ID); if(!host) return;
    const map = L.map(MAP_ID,{scrollWheelZoom:false});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);

    firstJson(JSON_PATHS).then(data=>{
      const p = pickProject(data||[]); if(!p || !p.radiusCenter) return;

      const center=[p.radiusCenter.lat,p.radiusCenter.lng];
      map.setView(center, 15);

      const circle = L.circle(center,{
        radius:p.radiusMeters||400, color:'#2d6cdf', fillColor:'#2d6cdf', fillOpacity:0.25, weight:2
      }).addTo(map);

      circle.bindTooltip(cardHTML(p), {
        className:'zr-tip', direction:'top', sticky:true, opacity:1, offset:[0,-12]
      });

      // Touch: first tap shows card; second tap triggers modal
      circle.on('touchstart', ()=> circle.openTooltip());

      circle.on('click', ()=> window.ZR_openProjectModal && window.ZR_openProjectModal({
        name:p.name, images:p.images, cardImage:p.cardImage, url:p.url||"/projects/escondido-tile-lift-lay-elkhorn/",
        notes:p.notes||["Tile lift & relay with high-temp underlayment.","Updated flashings and vents."]
      }));
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* === ZR brand CTA override (orange primary) === */
;(function(){
  if (document.getElementById('zr-brand-cta-css')) return;
  const css = `
  /* Primary CTA (orange with white text) */
  .zr-tip .actions .btn-primary,
  .zr-tip .zr-cta,
  .leaflet-tooltip.zr-tip-wrap .zr-cta{
    background:#f97316;           /* orange-500 */
    color:#fff !important;
    border:1px solid #f97316;
    box-shadow:0 1px 0 rgba(0,0,0,.04);
  }
  .zr-tip .actions .btn-primary:hover,
  .zr-tip .zr-cta:hover{
    filter:brightness(.95);
  }
  .zr-tip .actions .btn-primary:focus-visible,
  .zr-tip .zr-cta:focus-visible{
    outline:2px solid #fdba74;    /* light orange ring */
    outline-offset:2px;
    border-color:#ea580c;          /* orange-600 */
  }

  /* Secondary/ghost CTA in brand color */
  .zr-tip .actions .btn-ghost,
  .zr-tip .zr-ghost{
    background:transparent;
    color:#f97316 !important;
    border:1px solid #fed7aa;      /* orange-200-ish */
  }
  .zr-tip .actions .btn-ghost:hover,
  .zr-tip .zr-ghost:hover{
    background:rgba(249,115,22,.06); /* faint orange wash */
  }

  /* Just in case: keep text/content contained */
  .zr-tip, .zr-tip *{
    white-space:normal !important;
    overflow-wrap:anywhere;
  }
  `;
  const s = document.createElement('style');
  s.id = 'zr-brand-cta-css';
  s.textContent = css;
  document.head.appendChild(s);
})();

/* === ZR Projects card: minimal (no CTAs) === */
;(function(){
  if (document.getElementById('zr-card-minimal-css')) return;
  const css = `
  /* hide any action buttons / orange accents */
  .zr-tip .actions,
  .zr-tip .zr-cta,
  .zr-tip .zr-ghost{ display:none !important; }

  /* remove any decorative orange line if present */
  .zr-tip .accent, .zr-tip .bar { display:none !important; }

  /* add an inline hint inside the text column */
  .zr-tip .t::after{
    content:"Click the blue shaded area to view details";
    display:block;
    margin-top:6px;
    font-size:.82rem;
    line-height:1.25;
    color:#475467;           /* subtle */
    letter-spacing:.2px;
  }

  /* keep layout tidy on small screens */
  @media (max-width:640px){
    .zr-tip .t::after{ font-size:.80rem; }
  }
  `;
  const s = document.createElement('style');
  s.id = 'zr-card-minimal-css';
  s.textContent = css;
  document.head.appendChild(s);
})();
