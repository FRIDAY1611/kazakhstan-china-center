/* 内页共享脚本：导航状态 / 移动端抽屉 / 滚动入场 / 页脚年份 */
(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
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
    const lang = (document.documentElement.lang || 'zh').toLowerCase();
    const labels = lang.startsWith('en')
      ? { open: 'Open menu', close: 'Close menu', nav: 'Navigation' }
      : lang.startsWith('ru')
        ? { open: 'Открыть меню', close: 'Закрыть меню', nav: 'Навигация' }
        : { open: '打开菜单', close: '关闭菜单', nav: '导航' };
    toggle.setAttribute('aria-controls', 'mobilePanel');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', labels.open);
    panel.setAttribute('inert', '');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', labels.nav);
    const focusables = () => $$('a, button', panel).filter((el) => !el.hasAttribute('disabled'));
    const setOpen = (open, restoreFocus = true) => {
      panel.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? labels.close : labels.open);
      if (open) {
        panel.removeAttribute('inert');
        const first = focusables()[0];
        if (first) requestAnimationFrame(() => first.focus());
      } else {
        const hadFocus = panel.contains(document.activeElement);
        panel.setAttribute('inert', '');
        if (restoreFocus && hadFocus) toggle.focus();
      }
    };
    toggle.addEventListener('click', () => setOpen(!panel.classList.contains('is-open')));
    $$('a', panel).forEach((a) => a.addEventListener('click', () => setOpen(false, false)));
    document.addEventListener('keydown', (e) => {
      if (!panel.classList.contains('is-open')) return;
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    const desktop = window.matchMedia('(min-width: 961px)');
    const closeOnDesktop = (e) => { if (e.matches) setOpen(false, false); };
    if (desktop.addEventListener) desktop.addEventListener('change', closeOnDesktop);
    else desktop.addListener(closeOnDesktop);
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

  const faqSearch = $('#faqSearch');
  if (faqSearch) {
    const sections = $$('main section').filter((sec) => sec.querySelector('.faq'));
    const tags = $$('.page-hero .tag');
    const counter = $('#faqCount');
    const empty = $('#faqEmpty');
    const norm = (str) => str.toLowerCase().replace(/\s+/g, ' ').trim();

    const run = () => {
      const q = norm(faqSearch.value);
      let shown = 0;
      sections.forEach((sec) => {
        let hits = 0;
        $$('.faq details', sec).forEach((item) => {
          const hit = !q || norm(item.textContent).includes(q);
          item.hidden = !hit;
          if (hit) {
            hits++;
            if (q) item.open = true;
          }
        });
        sec.hidden = !!q && hits === 0;
        shown += hits;
      });
      tags.forEach((link) => {
        const target = document.getElementById((link.getAttribute('href') || '').slice(1));
        link.hidden = !!q && !!target && target.hidden;
      });
      if (counter) counter.textContent = q ? `找到 ${shown} 条相关问题` : '';
      if (empty) empty.hidden = !q || shown > 0;
    };

    faqSearch.addEventListener('input', run);
    faqSearch.addEventListener('search', run);
  }

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
