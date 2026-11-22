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
})();
