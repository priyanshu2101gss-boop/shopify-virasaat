/**
 * virasat-homepage.js
 * Lightweight homepage interactivity.
 * - IntersectionObserver for scroll-reveal on .vt-hp-reveal elements
 * - Counter animation for heritage stat numbers
 * No external dependencies.
 */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── 1. Scroll-reveal for homepage elements ─── */
  function initHomepageReveal() {
    var targets = document.querySelectorAll('.vt-hp-reveal');
    if (!targets.length) return;

    if (prefersReducedMotion) {
      targets.forEach(function (el) { el.classList.add('is-visible'); });
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
      { threshold: 0.15, rootMargin: '0px 0px -30px 0px' }
    );

    targets.forEach(function (el) { observer.observe(el); });
  }

  /* ─── 2. Counter animation for heritage stats ─── */
  function initCounters() {
    var counters = document.querySelectorAll('[data-vt-counter]');
    if (!counters.length) return;

    if (prefersReducedMotion) {
      // Just show final values immediately
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    counters.forEach(function (el) { observer.observe(el); });
  }

  function animateCounter(el) {
    var text = el.textContent.trim();
    // Extract numeric part and suffix (e.g., "200+" -> 200, "+")
    var match = text.match(/^([\d,]+)(.*)/);
    if (!match) return;

    var target = parseInt(match[1].replace(/,/g, ''), 10);
    var suffix = match[2] || '';
    var duration = 1600; // ms
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease-out cubic
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.floor(eased * target);
      el.textContent = current.toLocaleString() + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  /* ─── INIT ─── */
  function init() {
    initHomepageReveal();
    initCounters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
