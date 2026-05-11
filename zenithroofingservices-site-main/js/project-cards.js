// Renders filterable cards on /projects/ from data/projects.json
(async function(){
  const res = await fetch('/data/projects.json').catch(()=>null);
  if(!res || !res.ok) return;
  const items = await res.json();

  const root = document.getElementById('project-cards');
  const filters = document.getElementById('project-filters');
  if(!root || !filters) return;

  // collect tag set
  const allTags = new Set();
  items.forEach(i=> (i.tags||[]).forEach(t=> allTags.add(t)));
  allTags.add('Escondido'); // ensure city can be a filter

  // render filter buttons
  const mkBtn = (label)=> {
    const b=document.createElement('button');
    b.textContent=label; b.className='pill'; b.dataset.tag=label;
    b.addEventListener('click',()=>{ b.classList.toggle('on'); render(); });
    return b;
  };
  filters.appendChild(mkBtn('All'));
  [...allTags].sort().forEach(t=> filters.appendChild(mkBtn(t)));

  function render(){
    const on = [...filters.querySelectorAll('.pill.on')].map(b=>b.dataset.tag).filter(t=>t!=='All');
    root.innerHTML='';
    (items||[]).forEach(i=>{
      const tags = new Set([i.city, ...(i.tags||[])]);
      const show = on.length===0 || on.every(t=>tags.has(t));
      if(!show) return;
      const el=document.createElement('a');
      el.href=i.url; el.className='card';
      el.innerHTML = `
        <div class="thumb" style="background-image:url('${(i.photos||[])[0]||''}')"></div>
        <div class="info">
          <h3>${i.name}</h3>
          <p class="muted">${i.city}, ${i.state} • ${i.dateCompleted||''}</p>
          <div class="tags">${[i.service, ...(i.tags||[])]
            .filter(Boolean).map(t=>`<span>${t}</span>`).join('')}</div>
        </div>`;
      root.appendChild(el);
    });
  }
  render();
})();
