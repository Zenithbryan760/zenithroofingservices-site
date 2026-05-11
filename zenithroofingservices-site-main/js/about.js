// Optional: subtle fade-in on scroll
(()=>{
  const els = document.querySelectorAll('#about .about-card');
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.style.transition='300ms ease'; e.target.style.transform='translateY(0)'; e.target.style.opacity='1'; } });
  },{threshold:.2});
  els.forEach(el=>{ el.style.opacity='0'; el.style.transform='translateY(10px)'; io.observe(el); });
})();
