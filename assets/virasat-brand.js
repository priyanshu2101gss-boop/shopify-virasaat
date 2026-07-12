/**
 * virasat-brand.js
 * Lightweight brand behaviour layer.
 * ─ Header: transparent → dark after 80px scroll
 * ─ Scroll-reveal: IntersectionObserver on .vt-reveal elements
 * No external dependencies. ~80 lines.
 */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── 1. Header scroll behaviour ─── */
  function initHeaderScroll() {
    var headerWrapper = document.querySelector('.header-wrapper');
    if (!headerWrapper) return;

    var THRESHOLD = 80; // px before going dark
    var ticking   = false;

    function updateHeader() {
      ticking = false;
      if (window.scrollY > THRESHOLD) {
        headerWrapper.classList.add('vt-scrolled');
      } else {
        headerWrapper.classList.remove('vt-scrolled');
      }
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }, { passive: true });

    // Run once on load in case page is already scrolled
    updateHeader();
  }

  /* ─── 2. Scroll-reveal ─── */
  function initReveal() {
    var targets = document.querySelectorAll(
      '.vt-reveal, .vt-fade-up, ' +
      '.title-wrapper .title, ' +
      '.featured-collection .card-wrapper, ' +
      '.image-with-text__content, ' +
      '.rich-text__wrapper'
    );
    if (!targets.length) return;

    // Reduced motion: just show everything immediately
    if (prefersReducedMotion) {
      targets.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold:  0.1,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    targets.forEach(function (el) {
      // Only add the class if not already managed by Dawn's own animation
      if (!el.classList.contains('animate--slide-in') &&
          !el.classList.contains('scroll-trigger')) {
        el.classList.add('vt-reveal');
        observer.observe(el);
      }
    });
  }

  /* ─── 3. Product card: secondary image swap ─── */
  function initCardHover() {
    // Dawn handles secondary image natively via CSS .media--hover-effect
    // Nothing extra needed — we hook purely via CSS transforms.
  }

  /* ─── INIT ─── */
  function init() {
    initHeaderScroll();
    initReveal();
    initCardHover();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
