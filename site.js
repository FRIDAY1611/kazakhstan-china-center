/* 内页共享脚本：导航状态 / 移动端抽屉 / 滚动入场 / 页脚年份 */
(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const nav = $('#nav');
  const toggle = $('#navToggle');
  const panel = $('#mobilePanel');

  const onScroll = () => {
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toggle && panel) {
    toggle.addEventListener('click', () => {
      const open = panel.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    $$('a', panel).forEach((a) => a.addEventListener('click', () => {
      panel.classList.remove('is-open');
      document.body.style.overflow = '';
    }));
  }

  const items = $$('[data-reveal]');
  if (items.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      items.forEach((el) => io.observe(el));
    }
  }

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
