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
    toggle.setAttribute('aria-controls', 'mobilePanel');
    toggle.setAttribute('aria-expanded', 'false');
    const setOpen = (open) => {
      panel.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    };
    toggle.addEventListener('click', () => setOpen(!panel.classList.contains('is-open')));
    $$('a', panel).forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
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
