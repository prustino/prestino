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

  // Keep the original image links usable when JavaScript or dialog is unavailable.
  const viewer = document.querySelector('#image-viewer');
  if (!viewer || typeof viewer.showModal !== 'function') return;

  const image = viewer.querySelector('[data-viewer-image]');
  const caption = viewer.querySelector('#viewer-caption');
  const count = viewer.querySelector('[data-viewer-count]');
  const original = viewer.querySelector('[data-viewer-original]');
  const error = viewer.querySelector('[data-viewer-error]');
  const close = viewer.querySelector('[data-viewer-close]');
  const previous = viewer.querySelector('[data-viewer-prev]');
  const next = viewer.querySelector('[data-viewer-next]');
  const imageLinks = [...document.querySelectorAll('a[data-gallery]')];
  let group = [];
  let position = 0;
  let trigger;

  const displayImage = () => {
    const link = group[position];
    const thumbnail = link.querySelector('img');
    const description = link.closest('figure')?.querySelector('figcaption');
    error.hidden = true;
    image.hidden = false;
    image.alt = thumbnail.alt;
    image.setAttribute('src', link.getAttribute('href'));
    caption.textContent = description?.innerText.replace(/\s+/g, ' ').trim() || thumbnail.alt;
    count.textContent = `${position + 1} / ${group.length}`;
    original.setAttribute('href', link.getAttribute('href'));
    previous.disabled = next.disabled = group.length < 2;
  };
  const step = (direction) => {
    position = (position + direction + group.length) % group.length;
    displayImage();
  };

  imageLinks.forEach((link) => {
    const label = link.querySelector('img').alt;
    link.setAttribute('aria-label', `Ingrandisci: ${label}`);
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      trigger = link;
      group = imageLinks.filter((item) => item.dataset.gallery === link.dataset.gallery);
      position = group.indexOf(link);
      displayImage();
      viewer.showModal();
      document.body.classList.add('image-viewer-open');
      close.focus();
    });
  });
  image.addEventListener('error', () => {
    image.hidden = true;
    error.hidden = false;
  });
  previous.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  close.addEventListener('click', () => viewer.close());
  viewer.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      step(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  let startedOnBackdrop = false;
  const isOutside = (event) => {
    const bounds = viewer.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom;
  };
  viewer.addEventListener('pointerdown', (event) => { startedOnBackdrop = isOutside(event); });
  viewer.addEventListener('click', (event) => {
    if (startedOnBackdrop && isOutside(event)) viewer.close();
    startedOnBackdrop = false;
  });
  viewer.addEventListener('close', () => {
    document.body.classList.remove('image-viewer-open');
    trigger?.focus({ preventScroll: true });
  });
})();
