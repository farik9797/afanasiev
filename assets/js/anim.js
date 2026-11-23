/* Плавные анимации при прокрутке (GSAP + ScrollTrigger).
   Без JS или при «уменьшить движение» контент просто виден — начальное состояние задаёт только скрипт. */
(function () {
  'use strict';
  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);
  var $$ = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };
  var EASE = 'power2.out';

  /* подъём + проявление; группа — по очереди */
  var rise = function (els, opt) {
    els = els.filter(Boolean);
    if (!els.length) return;
    opt = opt || {};
    gsap.from(els, {
      y: opt.y == null ? 28 : opt.y,
      autoAlpha: 0,
      duration: opt.d || 0.8,
      ease: EASE,
      stagger: opt.stagger || 0,
      clearProps: 'transform,opacity,visibility',
      scrollTrigger: { trigger: opt.trigger || els[0], start: opt.start || 'top 88%', once: true }
    });
  };
  /* только проявление — для повёрнутых рукописных цитат, чтобы не сбить их наклон */
  var fade = function (els, delay) {
    els.filter(Boolean).forEach(function (el) {
      gsap.from(el, { autoAlpha: 0, duration: 1, delay: delay || 0.2, ease: 'power1.out', clearProps: 'opacity,visibility',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
  };
  var q = function (s) { return document.querySelector(s); };

  /* «Здоровый кишечник» */
  rise($$('.main-sec__text > *'), { stagger: 0.08 });
  var vf = q('.video-frame');
  if (vf) gsap.from(vf, { autoAlpha: 0, scale: 0.96, duration: 1, ease: EASE, clearProps: 'transform,opacity,visibility',
    scrollTrigger: { trigger: vf, start: 'top 88%', once: true } });
  fade($$('.main-sec__quote'), 0.4);

  /* преимущества */
  rise($$('.adv__item'), { stagger: 0.1, trigger: q('.adv') });

  /* изменения */
  rise($$('.changes__head > div > *').concat([q('.score-box')]), { stagger: 0.08 });
  rise($$('.change'), { stagger: 0.1, trigger: q('.changes__grid') });
  rise([q('.changes__note')], { y: 18 });
  fade($$('.changes__quote'), 0.3);

  /* программа */
  rise($$('.program__head > *'), { stagger: 0.08 });
  rise($$('.modules li'), { stagger: 0.06, trigger: q('.modules') });
  rise([q('.youget__head')]);
  rise($$('.youget__list li').concat([q('.youget__final')]), { stagger: 0.07, trigger: q('.youget__list') });

  /* второй урок */
  rise($$('.lesson2__left > *'), { stagger: 0.08, trigger: q('.lesson2__box') });
  fade($$('.lesson2__quote'), 0.3);
  rise($$('.bonus'), { stagger: 0.12, trigger: q('.bonuses') });

  /* для кого */
  rise([q('.for .h2')]);
  rise($$('.for__card, .for__photo'), { stagger: 0.12, trigger: q('.for__grid') });

  /* баннер */
  rise($$('.bannerline__inner > *'), { y: 18, stagger: 0.1, trigger: q('.bannerline') });

  /* отзывы */
  rise($$('.reviews__head > *'), { stagger: 0.08 });
  rise($$('.review'), { stagger: 0.1, trigger: q('.reviews__grid') });

  /* ветки слегка «плывут» при прокрутке (только декор) */
  $$('.main-sec__leafs, .lesson2__leafs, .bannerline__leafs').forEach(function (el) {
    gsap.fromTo(el, { y: 24 }, { y: -24, ease: 'none',
      scrollTrigger: { trigger: el.parentNode, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
  });

  /* после смены высоты слайдера и загрузки картинок — пересчёт точек срабатывания */
  window.addEventListener('load', function () { window.ScrollTrigger.refresh(); });
})();
