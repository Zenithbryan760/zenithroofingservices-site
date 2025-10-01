(async function(){
  const res = await fetch('/data/projects.json').catch(()=>null);
  if(!res || !res.ok) return;
  const items = await res.json();
  const root = document.getElementById('project-cards');
  const filters = document.getElementById('project-filters');
  if(!root || !filters) return;

  const allTags = new Set(); items.forEach(i => (i.tags||[]).forEach(t => allTags.add(t)));
  const mk = t => { const b=document.createElement('button'); b.className='pill'; b.textContent=t; b.dataset.tag=t; b.onclick=()=>{b.classList.toggle('on'); render();}; return b; };
  filters.appendChild(mk('All')); [...allTags].sort().forEach(t=>filters.appendChild(mk(t)));

  function render(){
    const on=[...filters.querySelectorAll('.pill.on')].map(b=>b.dataset.tag).filter(t=>t!=='All');
    root.innerHTML='';
    items.forEach(i=>{
      const tags=new Set([i.city,...(i.tags||[])]); const show=on.length===0||on.every(t=>tags.has(t)); if(!show) return;
      const el=document.createElement('a'); el.href=i.href||'#'; el.className='card'; el.style.display='block';
      el.innerHTML=`
        <div class="thumb" style="background:url('${i.cover||''}') center/cover no-repeat; aspect-ratio:16/9; border-radius:12px;"></div>
        <div class="info"><h3>${i.title}</h3>
          <div class="tags">${[i.service,...(i.tags||[])].filter(Boolean).map(t=>`<span>${t}</span>`).join('')}</div>
          ${i.summary?`<p class="muted" style="margin-top:6px">${i.summary}</p>`:''}
        </div>`;
      root.appendChild(el);
    });
  }
  render();
})();
