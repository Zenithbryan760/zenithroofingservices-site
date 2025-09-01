/* Testimonials — Swiper carousel with centered “peek”, dim effect, a11y */
(function () {
  const hasReducedMotion = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function doInit() {
    const el = document.querySelector('.testimonialSwiper');
    if (!el || typeof Swiper === 'undefined') return;
    if (el.dataset.inited === '1') return;
    el.dataset.inited = '1';

    const reduce = hasReducedMotion();

    const swiper = new Swiper(el, {
      loop: true,
      speed: reduce ? 0 : 550,
      grabCursor: true,
      watchSlidesVisibility: true,
      centeredSlides: true,         // mobile “peek”
      slidesPerView: 1.1,           // mobile
      spaceBetween: 20,
      breakpoints: {
        680:  { slidesPerView: 2,   spaceBetween: 22, centeredSlides: false },
        1024: { slidesPerView: 3,   spaceBetween: 24, centeredSlides: false }
      },
      autoplay: reduce ? false : { delay: 6000, disableOnInteraction: false, pauseOnMouseEnter: true },
      pagination: { el: '.swiper-pagination', clickable: true, dynamicBullets: true },
      navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
      keyboard: { enabled: true, onlyInViewport: true },
      on: {
        init(sw) {
          sw.slides.forEach(s => s.classList.add('t-slide'));
          updateActive(sw);
        },
        transitionStart: updateActive,
        resize: updateActive
      }
    });

    function updateActive(sw) {
      const count = typeof sw.params.slidesPerView === 'number' ? sw.params.slidesPerView : 1;
      sw.slides.forEach(s => {
        s.classList.add('is-dim');
        s.setAttribute('aria-hidden', 'true');
      });
      // Mark currently visible slides as not dimmed
      const start = sw.activeIndex;
      for (let i = 0; i < Math.ceil(count); i++) {
        const slide = sw.slides[start + i];
        if (slide) {
          slide.classList.remove('is-dim');
          slide.setAttribute('aria-hidden', 'false');
        }
      }
    }
  }

  function ensureInit() {
    const target = document.querySelector('.testimonialSwiper');
    if (!target) return;
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            doInit();
            io.disconnect();
          }
        });
      }, { threshold: 0.15 });
      io.observe(target);
    } else {
      doInit();
    }
  }

  // Expose for your index loader’s initFunctions list
  window.initTestimonials = ensureInit;

  // Fallback if loaded standalone
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureInit);
  } else {
    ensureInit();
  }
})();
