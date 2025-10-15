(function(){
  const MAP_ID='radius-only-map';
  const JSON_PATHS=['/data/projects.json','data/projects.json','../data/projects.json'];
  function firstJson(paths){
    return new Promise((res,rej)=>{
      (function next(i){
        if(i>=paths.length) return rej(new Error('projects.json not found'));
        fetch(paths[i]).then(r=>r.ok?r.json():Promise.reject()).then(res).catch(()=>next(i+1));
      })(0);
    });
  }
  function pickEscondido(data){
    // Prefer explicit ID; fall back to first Escondido item
    return data.find(p=>p.id==='ESCO-ELKHORN-LIFT-LAY')
        || data.find(p=>/escondido/i.test(p.city||''))
        || data[0];
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
      const circle=L.circle(center,{radius:p.radiusMeters||400,color:'#2d6cdf',fillColor:'#2d6cdf',fillOpacity:0.25,weight:2}).addTo(map);
      circle.on('click', ()=> window.ZR_openProjectModal && window.ZR_openProjectModal({
        name: p.name,
        images: p.images,      // optional array (if present)
        cardImage: p.cardImage,
        url: p.url || "/projects/escondido-tile-lift-lay-elkhorn/",
        notes: p.notes || [
          "Tile lift & relay with high-temp underlayment.",
          "Updated flashings and vents.",
          "Privacy preserved — radius shown, no street address."
        ]
      }));
    }).catch(()=>{});
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
