(function(){
  const $ = (s)=>document.querySelector(s);
  const modalHtml = `
  <div class="zr-modal" id="zrModal" role="dialog" aria-modal="true" aria-labelledby="zrModalTitle" style="position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.5);z-index:1000">
    <div class="zr-dialog" style="background:#fff;max-width:880px;width:94vw;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.28);padding:16px">
      <div class="zr-head" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <h3 id="zrModalTitle" style="margin:0;font-size:1.15rem">Featured Project</h3>
        <button id="zrClose" aria-label="Close" style="background:transparent;border:0;font-size:1.4rem;cursor:pointer;line-height:1">&times;</button>
      </div>
      <div class="zr-body" style="display:grid;gap:14px">
        <div class="zr-carousel" style="position:relative;overflow:hidden;border-radius:10px;border:1px solid #e4e6ea">
          <div class="zr-track" id="zrTrack" style="display:flex;transition:transform .3s ease"></div>
        </div>
        <div class="zr-nav" style="display:flex;gap:10px;justify-content:center;margin-top:8px">
          <button id="zrPrev" type="button" style="border:1px solid #e4e6ea;background:#fff;border-radius:10px;padding:6px 12px;cursor:pointer">Prev</button>
          <button id="zrNext" type="button" style="border:1px solid #e4e6ea;background:#fff;border-radius:10px;padding:6px 12px;cursor:pointer">Next</button>
        </div>
        <ul class="zr-notes" id="zrNotes" style="font-size:.95rem;color:#333;list-style:disc;padding-left:18px;margin:6px 0"></ul>
        <div class="zr-cta" style="display:flex;gap:10px;justify-content:flex-end">
          <a id="zrProjectLink" href="#" rel="noopener" style="display:inline-block;background:#f7941d;color:#fff;padding:10px 14px;border-radius:10px;text-decoration:none">View full project</a>
        </div>
      </div>
    </div>
  </div>`;
  document.addEventListener('DOMContentLoaded', ()=>{
    if(!$('#zrModal')) document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = $('#zrModal'), closeBtn = $('#zrClose');
    const track = $('#zrTrack'), notesEl = $('#zrNotes'), linkEl = $('#zrProjectLink');
    const prev = $('#zrPrev'), next = $('#zrNext');
    let idx=0, total=0;
    function open(){ modal.style.display='flex'; document.body.style.overflow='hidden'; }
    function close(){ modal.style.display='none'; document.body.style.overflow=''; }
    closeBtn.addEventListener('click', close);
    modal.addEventListener('click', (e)=>{ if(e.target===modal) close(); });
    prev.addEventListener('click', ()=>{ idx=(idx-1+total)%total; track.style.transform='translateX('+(-idx*100)+'%)'; });
    next.addEventListener('click', ()=>{ idx=(idx+1)%total; track.style.transform='translateX('+(-idx*100)+'%)'; });
    window.ZR_openProjectModal = function(p){
      const imgs = (p.images && p.images.length ? p.images : [p.cardImage]).filter(Boolean);
      track.innerHTML = imgs.map(src=>{
        const safe = '/' + String(src).replace(/^\/+/, '');
        return '<img src="'+safe+'" alt="'+(p.name||"Project image")+'" loading="lazy" style="flex:0 0 100%;max-height:420px;width:100%;object-fit:cover">';
      }).join('');
      total = imgs.length; idx=0; track.style.width=(total*100)+'%'; track.style.transform='translateX(0)';
      notesEl.innerHTML = (p.notes||[]).map(n=>'<li>'+n+'</li>').join('');
      linkEl.href = p.url || '#';
      document.getElementById('zrModalTitle').textContent = p.name || 'Featured Project';
      open();
    };
  });
})();
