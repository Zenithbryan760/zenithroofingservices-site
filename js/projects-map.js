(function(){
  const MAP_ID='radius-only-map';
  const DATA_PATHS=['/data/projects.json','data/projects.json','../data/projects.json'];
  function loadData(paths){return new Promise((res,rej)=>{(function n(i){if(i>=paths.length)return rej();fetch(paths[i]).then(r=>r.ok?r.json():Promise.reject()).then(res).catch(()=>n(i+1));})(0);});}
  function popupHTML(p){
    const img='/' + (p.cardImage||'').replace(/^\/+/,'');
    const meta=['Tile Lift & Relay','Escondido','2 layers Malarkey RightStart','near Country Club Ln'].join(' • ');
    return `<div style="width:320px;display:grid;grid-template-columns:80px 1fr;gap:10px;align-items:center">
      <div style="width:80px;height:60px;overflow:hidden;border-radius:6px">${img?`<img src="${img}" style="width:100%;height:100%;object-fit:cover">`:''}</div>
      <div style="display:flex;flex-direction:column;gap:4px">
        <div style="font-weight:700">${p.name}</div>
        <div style="color:#475467;font-size:.85rem">${meta}</div>
      </div>
    </div>`;
  }
  function init(){
    const el=document.getElementById(MAP_ID); if(!el) return;
    const map=L.map(MAP_ID,{scrollWheelZoom:false});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
    loadData(DATA_PATHS).then(data=>{
      const p=data.find(pr=>pr.id==='ESCO-ELKHORN-LIFT-LAY')||data[0];
      const center=[p.radiusCenter.lat,p.radiusCenter.lng]; map.setView(center,15);
      const circle=L.circle(center,{radius:p.radiusMeters||400,color:'#2d6cdf',fillColor:'#2d6cdf',fillOpacity:0.25}).addTo(map);
      const popup=L.popup({closeButton:false,autoPan:false}).setContent(popupHTML(p));
      circle.on('mouseover',()=>{popup.setLatLng(center);map.openPopup(popup);});
      circle.on('mouseout',()=>map.closePopup(popup));
      circle.on('click',()=>window.ZR_openProjectModal && window.ZR_openProjectModal({
        name:"Tile Lift & Relay — Escondido (near Country Club Ln)",
        subtitle:"Two layers Malarkey RightStart UDL 40 • Country Club Ln / North Broadway",
        images:[p.cardImage],
        cardImage:p.cardImage,
        url:p.url,
        summary:[
          "Removed existing tiles, pressure washed deck.",
          "Installed two layers Malarkey RightStart UDL 40.",
          "Reinstalled tiles with ~15% replacement.",
          "Installed drip edge, bird stop, flashings.",
          "Completed fascia, shiplap, and ridge blocking."
        ],
        materials:[
          "Malarkey RightStart UDL 40","Concrete tiles (~15%)",
          "Drip edge & bird stop","Flashing & mastic","Ridge blocking"
        ],
        keywords:["Tile Lift & Relay","Escondido roofing","Malarkey RightStart","tile roof","Country Club Ln"]
      }));
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
