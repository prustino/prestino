(() => {
  'use strict';

  const index = document.querySelector('.detail-index');
  const header = document.querySelector('.site-header');
  if (index && header) {
    const links = [...index.querySelectorAll('a[href^="#"]')];
    const sections = links.map((link) => document.getElementById(link.hash.slice(1)));
    let offset = 160;
    let scheduled = false;

    const updateCurrentSection = () => {
      scheduled = false;
      let current = 0;
      sections.forEach((section, position) => {
        if (section && section.getBoundingClientRect().top <= offset + 24) current = position;
      });
      links.forEach((link, position) => {
        if (position === current) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    };

    const updateOffsets = () => {
      const headerHeight = header.getBoundingClientRect().height;
      offset = headerHeight + index.getBoundingClientRect().height + 16;
      document.body.style.setProperty('--project-header-height', `${headerHeight}px`);
      document.documentElement.style.scrollPaddingTop = `${offset}px`;
      updateCurrentSection();
    };

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(updateOffsets);
      observer.observe(header);
      observer.observe(index);
    }
    window.addEventListener('scroll', () => {
      if (!scheduled) {
        scheduled = true;
        window.requestAnimationFrame(updateCurrentSection);
      }
    }, { passive: true });
    window.addEventListener('resize', updateOffsets);
    updateOffsets();
  }

  // Gallerie a righe bilanciate: le foto, ciascuna nel suo formato (--ar), si dividono in righe tutte piene,
  // con altezze che variano di poco, così in fondo alla lista non restano spazi vuoti.
  const grids = [...document.querySelectorAll('.portfolio-gallery-grid')];
  const targetRow = () => {
    const vw = window.innerWidth;
    if (vw <= 760) return 240;
    if (vw <= 1000) return 230;
    return Math.min(420, Math.max(260, vw * 0.21));
  };
  const balance = (grid) => {
    const items = [...grid.children].filter((item) => item.matches('figure'));
    const width = grid.clientWidth;
    if (!items.length || !width) return;
    const gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
    const ratios = items.map((item) => parseFloat(getComputedStyle(item).getPropertyValue('--ar')) || 4 / 3);
    // Divisione in righe consecutive: tra tutte le divisioni possibili si sceglie quella con le righe
    // più vicine all'altezza ideale; le righe troppo alte o troppo basse costano di più.
    const target = targetRow();
    const maxHeight = target * 1.7;
    const n = ratios.length;
    const prefix = [0];
    ratios.forEach((ratio, i) => prefix.push(prefix[i] + ratio));
    const rowHeight = (start, end) => (width - gap * (end - start - 1)) / (prefix[end] - prefix[start]);
    const rowCost = (start, end) => {
      const h = rowHeight(start, end);
      const deviation = (h - target) / target;
      return deviation ** 2 + (h > maxHeight ? 50 * ((h - maxHeight) / target) ** 2 : 0) + (h < target * 0.55 ? 10 : 0);
    };
    const best = new Array(n + 1).fill(Infinity);
    const cut = new Array(n + 1).fill(0);
    best[0] = 0;
    for (let end = 1; end <= n; end += 1) {
      for (let start = Math.max(0, end - 8); start < end; start += 1) {
        const value = best[start] + rowCost(start, end);
        if (value < best[end]) { best[end] = value; cut[end] = start; }
      }
    }
    const bounds = [];
    for (let end = n; end > 0; end = cut[end]) bounds.unshift([cut[end], end]);
    bounds.forEach(([start, end]) => {
      // Se resta una riga troppo alta (poche foto verticali) si accorcia ed è centrata.
      const height = Math.min(rowHeight(start, end), maxHeight);
      for (let i = start; i < end; i += 1) items[i].style.flex = `0 0 ${Math.floor(ratios[i] * height * 100) / 100 - 0.01}px`;
    });
    grid.classList.add('is-balanced');
  };
  if (grids.length) {
    const relayout = () => grids.forEach(balance);
    if ('ResizeObserver' in window) {
      let lastWidths = new WeakMap();
      const observer = new ResizeObserver((entries) => entries.forEach(({ target }) => {
        const width = Math.round(target.clientWidth);
        if (lastWidths.get(target) !== width) { lastWidths.set(target, width); balance(target); }
      }));
      grids.forEach((grid) => observer.observe(grid));
    } else window.addEventListener('resize', relayout);
    relayout();
  }
})();
