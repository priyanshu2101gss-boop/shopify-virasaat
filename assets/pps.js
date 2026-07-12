/**
 * PPS — Product Parallax Showcase  (pps.js)
 * Vanilla JS only. No external libraries.
 * Techniques:
 *   - IntersectionObserver  → scroll-triggered reveal classes
 *   - requestAnimationFrame → parallax (reads scroll, writes transform once per frame)
 *   - Passive event listeners → keeps scroll/touch at 60fps
 *   - Touch events          → mobile gallery swipe
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────────────────
     Utility: wait for DOM ready
  ───────────────────────────────────────────────────────────────────────── */
  function ready(fn) {
    if (document.readyState !== 'loading') { fn(); }
    else { document.addEventListener('DOMContentLoaded', fn); }
  }

  /* ─────────────────────────────────────────────────────────────────────────
     Utility: respect prefers-reduced-motion
  ───────────────────────────────────────────────────────────────────────── */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─────────────────────────────────────────────────────────────────────────
     1. SCROLL-TRIGGERED REVEAL (IntersectionObserver)
     Adds .is-visible to any .pps-reveal or .pps-reveal--scale element when
     it enters the viewport. Disconnects after first trigger for performance.
  ───────────────────────────────────────────────────────────────────────── */
  function initReveal() {
    const revealEls = document.querySelectorAll('.pps-reveal, .pps-reveal--scale');
    if (!revealEls.length) return;

    if (prefersReducedMotion) {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
    );

    revealEls.forEach(function (el) { observer.observe(el); });
  }

  /* ─────────────────────────────────────────────────────────────────────────
     2. PARALLAX (rAF loop)
     Reads parallax intensity from data-pps-intensity attribute on the section.
     Moves designated elements at fractional scroll speeds.
     Only runs on non-touch-primary devices for performance.
  ───────────────────────────────────────────────────────────────────────── */
  function initParallax() {
    if (prefersReducedMotion) return;

    const section = document.querySelector('.pps-section');
    if (!section) return;

    const intensity = parseFloat(section.dataset.ppsIntensity || '8');

    // Hero background parallax
    const heroBg = section.querySelector('.pps-hero__parallax');
    // Hero floating product image parallax (counter-direction for depth feel)
    const heroFloat = section.querySelector('.pps-hero__float-wrap');
    // Story image parallax
    const storyImg = section.querySelector('.pps-story__parallax-img');

    let ticking = false;
    let lastScrollY = window.scrollY;

    function onScroll() {
      lastScrollY = window.scrollY;
      if (!ticking) {
        window.requestAnimationFrame(applyParallax);
        ticking = true;
      }
    }

    function getOffsetTop(el) {
      let top = 0;
      while (el) {
        top += el.offsetTop;
        el = el.offsetParent;
      }
      return top;
    }

    function parallaxValue(el, factor) {
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const viewCenter = window.innerHeight / 2;
      return (center - viewCenter) * factor;
    }

    function applyParallax() {
      ticking = false;

      if (heroBg) {
        const val = lastScrollY * (intensity / 100);
        heroBg.style.transform = 'translateY(' + val + 'px)';
      }

      if (heroFloat) {
        const val = lastScrollY * -(intensity / 180);
        heroFloat.style.transform = 'translateY(calc(-50% + ' + val + 'px))';
      }

      if (storyImg) {
        const sRect = storyImg.closest('.pps-story__media');
        if (sRect) {
          const r = sRect.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) {
            const offset = parallaxValue(sRect, intensity / 160);
            storyImg.style.transform = 'translate(-12%, calc(-12% + ' + offset + 'px))';
          }
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    applyParallax(); // initial call
  }

  /* ─────────────────────────────────────────────────────────────────────────
     3. PRODUCT GALLERY
     - Click thumbnail  → swap main image with fade transition
     - Click main image → open lightbox
     - Mobile touch swipe on main image → cycle through images
  ───────────────────────────────────────────────────────────────────────── */
  function initGallery() {
    const gallery = document.querySelector('.pps-gallery');
    if (!gallery) return;

    const mainImg = gallery.querySelector('.pps-gallery__main-img');
    const thumbs  = gallery.querySelectorAll('.pps-gallery__thumb');
    const mainWrap = gallery.querySelector('.pps-gallery__main');
    const lightbox = document.querySelector('.pps-lightbox');
    const lightboxImg = lightbox ? lightbox.querySelector('.pps-lightbox__img') : null;
    const lightboxClose = lightbox ? lightbox.querySelector('.pps-lightbox__close') : null;

    if (!mainImg || !thumbs.length) return;

    let images = [];
    thumbs.forEach(function (thumb) {
      images.push({
        full: thumb.dataset.full || thumb.querySelector('img').src,
        thumb: thumb
      });
    });
    let currentIndex = 0;

    function setActive(index) {
      if (index < 0) index = images.length - 1;
      if (index >= images.length) index = 0;
      currentIndex = index;

      mainImg.classList.add('is-fading');
      setTimeout(function () {
        mainImg.src = images[index].full;
        mainImg.classList.remove('is-fading');
      }, 180);

      thumbs.forEach(function (t) { t.classList.remove('is-active'); });
      images[index].thumb.classList.add('is-active');
      images[index].thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    thumbs.forEach(function (thumb, i) {
      thumb.addEventListener('click', function () { setActive(i); });
      thumb.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(i); }
      });
      thumb.setAttribute('tabindex', '0');
      thumb.setAttribute('role', 'button');
    });

    // Lightbox
    if (mainWrap && lightbox && lightboxImg) {
      mainWrap.addEventListener('click', function () {
        lightboxImg.src = images[currentIndex].full;
        lightbox.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      });

      function closeLightbox() {
        lightbox.classList.remove('is-open');
        document.body.style.overflow = '';
      }

      if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
      }
      lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) closeLightbox();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeLightbox();
      });
    }

    // Mobile swipe
    var touchStartX = 0;
    var touchStartY = 0;
    if (mainWrap) {
      mainWrap.addEventListener('touchstart', function (e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      mainWrap.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].clientX - touchStartX;
        var dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
          if (dx < 0) { setActive(currentIndex + 1); }
          else        { setActive(currentIndex - 1); }
        }
      }, { passive: true });
    }

    // Init first thumb as active
    if (thumbs.length) { thumbs[0].classList.add('is-active'); }
  }

  /* ─────────────────────────────────────────────────────────────────────────
     4. FAQ ACCORDION
  ───────────────────────────────────────────────────────────────────────── */
  function initFaq() {
    const faqItems = document.querySelectorAll('.pps-faq__item');
    if (!faqItems.length) return;

    faqItems.forEach(function (item) {
      const btn = item.querySelector('.pps-faq__question');
      if (!btn) return;

      btn.addEventListener('click', function () {
        const isOpen = item.classList.contains('is-open');

        // Close all
        faqItems.forEach(function (i) { i.classList.remove('is-open'); });

        // Open clicked (unless it was already open)
        if (!isOpen) {
          item.classList.add('is-open');
        }

        btn.setAttribute('aria-expanded', !isOpen);
      });

      btn.setAttribute('aria-expanded', 'false');
    });
  }

  /* ─────────────────────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────────────────────── */
  ready(function () {
    initReveal();
    initParallax();
    initGallery();
    initFaq();
  });

})();
