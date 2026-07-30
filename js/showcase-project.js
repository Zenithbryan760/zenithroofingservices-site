(async function(){
  const host=document.querySelector('[data-showcase-slug]');
  if(!host)return;
  const response=await fetch('/data/showcase-projects.json');
  if(!response.ok)return;
  const projects=await response.json();
  const project=projects.find(item=>item.slug===host.dataset.showcaseSlug);
  if(!project)return;
  const esc=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const list=items=>items.map(item=>`<li>${esc(item)}</li>`).join('');
  document.title=`${project.title} | Zenith Roofing Services`;
  host.innerHTML=`
    <section class="case-hero">
      <div class="case-wrap">
        <div class="case-kicker">Real Zenith Roofing Project · ${esc(project.city)}</div>
        <h1>${esc(project.title)}</h1>
        <p class="case-lede">${esc(project.summary)}</p>
        <div class="case-chips"><span class="case-chip">${esc(project.city)}</span><span class="case-chip">${esc(project.service)}</span><span class="case-chip">Documented jobsite work</span></div>
      </div>
    </section>
    <div class="case-main"><div class="case-wrap">
      <div class="case-grid">
        <div>
          <article class="case-card">
            ${project.image?`<img class="case-photo" src="${esc(project.image)}" alt="${esc(project.title)}" loading="eager">`:''}
            <h2>What we found</h2><p>${esc(project.conditions)}</p>
            <h2>What Zenith completed</h2><ul class="case-list">${list(project.scope)}</ul>
          </article>
          <article class="case-card case-lesson" style="margin-top:1.4rem">
            <h2>What homeowners can learn from this project</h2><p>${esc(project.lesson)}</p>
          </article>
        </div>
        <aside class="case-card">
          <h2>Project facts</h2>
          <div class="case-facts">
            <div class="case-fact"><strong>Location</strong>${esc(project.city)}, ${esc(project.region)}</div>
            <div class="case-fact"><strong>Roofing work</strong>${esc(project.service)}</div>
            <div class="case-fact"><strong>Confirmed materials</strong>${project.materials.map(esc).join('<br>')}</div>
          </div>
          <div class="case-actions"><a class="case-btn" href="/#estimate">Request an estimate</a><a class="case-btn secondary" href="tel:8589006163">Call 858-900-6163</a></div>
        </aside>
      </div>
      <section style="margin-top:2.2rem">
        <h2>Explore related roofing information</h2>
        <div class="case-related">
          <a href="${esc(project.serviceUrl)}"><article class="case-card"><h3>${esc(project.service)}</h3><p>See how this roof system is evaluated, detailed, and installed.</p></article></a>
          <a href="${esc(project.cityUrl)}"><article class="case-card"><h3>Roofing in ${esc(project.city)}</h3><p>Review local roofing services and project proof for this community.</p></article></a>
          <a href="/projects/"><article class="case-card"><h3>All roofing projects</h3><p>Browse more documented Zenith Roofing Services work.</p></article></a>
        </div>
      </section>
    </div></div>`;
})();
