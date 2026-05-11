(function () {
  // Inject scoped CSS (only under #zrModal)
  function injectCSS() {
    if (document.getElementById('zr-modal-css')) return;
    const css = `
    #zrModal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.55);z-index:1000}
    #zrModal .dialog{background:#fff;width:min(960px,94vw);border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.28);padding:18px}
    /* Header */
    #zrModal .head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:12px}
    #zrModal .title{margin:0;font-size:1.25rem;line-height:1.2}
    #zrModal .subtitle{color:#475467;font-size:.95rem}
    #zrModal .close{background:transparent;border:0;font-size:1.6rem;cursor:pointer;line-height:1}
    /* Media */
    #zrModal .media{position:relative;border-radius:12px;border:1px solid #e6e9f0;overflow:hidden}
    #zrModal .track{display:flex;transition:transform .35s ease}
    #zrModal .slide{flex:0 0 100%}
    #zrModal .slide img{width:100%;max-height:58vh;object-fit:cover;display:block}
    #zrModal .navBtn{position:absolute;top:50%;transform:translateY(-50%);border:1px solid #e6e9f0;background:#fff;border-radius:999px;
      width:38px;height:38px;display:grid;place-items:center;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.15)}
    #zrModal .navBtn.left{left:10px}  #zrModal .navBtn.right{right:10px}
    #zrModal .dots{position:absolute;left:0;right:0;bottom:10px;display:flex;justify-content:center;gap:6px}
    #zrModal .dot{width:8px;height:8px;border-radius:999px;background:#d6dae0}
    #zrModal .dot.active{background:#6b7280}
    /* Content */
    #zrModal .grid{display:grid;gap:16px;margin-top:14px}
    @media(min-width:900px){ #zrModal .grid{grid-template-columns:1.35fr 1fr} }
    #zrModal .card{border:1px solid #e6e9f0;border-radius:12px;padding:12px}
    #zrModal .card h4{margin:0 0 6px 0;font-size:1rem}
    #zrModal ul{margin:0;padding-left:18px;line-height:1.45;list-style:disc;text-align:left}
    #zrModal .chips{display:flex;flex-wrap:wrap;gap:8px}
    #zrModal .chip{background:#f6f8fb;border:1px solid #e6e9f0;color:#2f3747;border-radius:999px;padding:6px 10px;font-size:.85rem;line-height:1}
    #zrModal .cta{display:flex;justify-content:flex-end;margin-top:4px}
    #zrModal .btn{display:inline-block;background:#f7941d;color:#fff;padding:10px 14px;border-radius:10px;text-decoration:none}
    `;
    const s = document.createElement('style');
    s.id = 'zr-modal-css'; s.textContent = css;
    document.head.appendChild(s);
  }

  const template = `
  <div id="zrModal" role="dialog" aria-modal="true" aria-labelledby="zrTitle">
    <div class="dialog">
      <div class="head">
        <div>
          <h3 id="zrTitle" class="title"></h3>
          <div id="zrSubtitle" class="subtitle"></div>
        </div>
        <button id="zrClose" class="close" aria-label="Close">&times;</button>
      </div>

      <div class="media">
        <div id="zrTrack" class="track"></div>
        <button id="zrPrev"  class="navBtn left"  type="button" aria-label="Previous">&#8249;</button>
        <button id="zrNext"  class="navBtn right" type="button" aria-label="Next">&#8250;</button>
        <div id="zrDots" class="dots"></div>
      </div>

      <div class="grid">
        <section class="card">
          <h4>Scope Overview</h4>
          <ul id="zrSummary"></ul>
        </section>
        <section class="card">
          <h4>Key Materials</h4>
          <ul id="zrMaterials"></ul>
        </section>
        <section class="card" style="grid-column:1/-1">
          <h4>SEO Keywords</h4>
          <div id="zrKeywords" class="chips"></div>
        </section>
      </div>

      <div class="cta">
        <a id="zrLink" class="btn" href="#" rel="noopener">View full project</a>
      </div>
    </div>
  </div>`;

  function chip(t){ return `<span class="chip">${t}</span>`; }

  document.addEventListener('DOMContentLoaded', () => {
    injectCSS();
    if (!document.getElementById('zrModal')) document.body.insertAdjacentHTML('beforeend', template);

    const modal  = document.getElementById('zrModal');
    const close  = document.getElementById('zrClose');
    const title  = document.getElementById('zrTitle');
    const sub    = document.getElementById('zrSubtitle');
    const track  = document.getElementById('zrTrack');
    const dots   = document.getElementById('zrDots');
    const sumEl  = document.getElementById('zrSummary');
    const matEl  = document.getElementById('zrMaterials');
    const kwEl   = document.getElementById('zrKeywords');
    const linkEl = document.getElementById('zrLink');
    const prev   = document.getElementById('zrPrev');
    const next   = document.getElementById('zrNext');

    let idx = 0, total = 0, startX = 0, deltaX = 0;

    function open(){ modal.style.display = 'flex'; document.body.style.overflow='hidden'; }
    function closeModal(){ modal.style.display = 'none'; document.body.style.overflow=''; }
    close.addEventListener('click', closeModal);
    modal.addEventListener('click', (e)=>{ if(e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e)=>{ if(modal.style.display==='flex' && e.key==='Escape') closeModal(); });

    function renderDots(){
      dots.innerHTML = Array.from({length: total}, (_,i)=>`<span class="dot ${i===idx?'active':''}"></span>`).join('');
    }
    function go(i){
      if(!total) return;
      idx = (i + total) % total;
      track.style.transform = 'translateX('+(-idx*100)+'%)';
      renderDots();
    }

    prev.addEventListener('click', ()=> go(idx-1));
    next.addEventListener('click', ()=> go(idx+1));

    // Touch swipe for mobile
    track.addEventListener('touchstart', (e)=>{ startX = e.touches[0].clientX; deltaX = 0; }, {passive:true});
    track.addEventListener('touchmove',  (e)=>{ deltaX = e.touches[0].clientX - startX; }, {passive:true});
    track.addEventListener('touchend',   ()=>{ if(Math.abs(deltaX) > 50) go(idx + (deltaX<0?1:-1)); });

    // Public API
    window.ZR_openProjectModal = function(p){
      // Images
      const imgs = (p.images && p.images.length ? p.images : [p.cardImage]).filter(Boolean);
      track.innerHTML = imgs.map(src=>{
        const safe = '/' + String(src).replace(/^\/+/, '');
        return `<div class="slide"><img src="${safe}" alt="${p.name||'Project image'}" loading="lazy"></div>`;
      }).join('');
      total = imgs.length || 1; idx = 0;
      track.style.width = (total * 100) + '%';
      go(0);

      // Text sections
      title.textContent = p.name || 'Featured Project';
      sub.textContent   = p.subtitle || '';
      sumEl.innerHTML   = (p.summary||[]).map(x=>`<li>${x}</li>`).join('');
      matEl.innerHTML   = (p.materials||[]).map(x=>`<li>${x}</li>`).join('');
      kwEl.innerHTML    = (p.keywords||[]).map(chip).join('');
      linkEl.href       = p.url || '#';

      open();
    };
  });
})();
