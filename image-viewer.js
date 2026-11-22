// Visualizzatore delle immagini dei progetti: a schermo intero, nero, senza titoli né contatori.
// Le immagini di un gruppo (data-gallery) stanno in una striscia che si scorre col dito (scroll-snap) o con le frecce;
// le versioni grandi si caricano solo per l'immagine visibile e le due vicine. Per aprire il file da solo resta il menu
// del browser sull'immagine (tasto destro, o dito tenuto premuto sul telefono).
(() => {
  'use strict';

  const links = [...document.querySelectorAll('a[data-gallery]')];
  if (!links.length) return;
  const viewer = document.createElement('dialog');
  if (typeof viewer.showModal !== 'function') return; // senza dialog i collegamenti aprono l'immagine direttamente

  const icon = (path) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
  viewer.className = 'image-viewer';
  viewer.setAttribute('aria-label', 'Immagini a schermo intero');
  viewer.innerHTML = `<div class="image-viewer-track"></div>
    <button type="button" class="image-viewer-close" aria-label="Chiudi">${icon('<path d="M6 6l12 12M18 6L6 18"/>')}</button>
    <button type="button" class="image-viewer-prev" aria-label="Immagine precedente">${icon('<path d="M15 5l-7 7 7 7"/>')}</button>
    <button type="button" class="image-viewer-next" aria-label="Immagine successiva">${icon('<path d="M9 5l7 7-7 7"/>')}</button>
    <p class="image-viewer-caption" hidden></p>
    <p class="visually-hidden" aria-live="polite"></p>`;
  document.body.append(viewer);

  const track = viewer.querySelector('.image-viewer-track');
  const close = viewer.querySelector('.image-viewer-close');
  const previous = viewer.querySelector('.image-viewer-prev');
  const next = viewer.querySelector('.image-viewer-next');
  const caption = viewer.querySelector('.image-viewer-caption');
  const status = viewer.querySelector('[aria-live]');
  let group = [];
  let slides = [];
  let position = 0;
  let trigger;
  let wentFullscreen = false;

  const load = (i) => {
    const img = slides[i]?.querySelector('img');
    if (img && !img.getAttribute('src')) img.src = group[i].getAttribute('href');
  };
  // Didascalia solo se la figura ne ha una (cioè quando è stata richiesta).
  const update = () => {
    [position - 1, position, position + 1].forEach(load);
    const text = group[position]?.closest('figure')?.querySelector('figcaption')?.innerText.replace(/\s+/g, ' ').trim() || '';
    caption.textContent = text;
    caption.hidden = !text;
    previous.disabled = position === 0;
    next.disabled = position === group.length - 1;
    status.textContent = `Immagine ${position + 1} di ${group.length}`;
  };
  const go = (target, smooth = true) => {
    position = Math.max(0, Math.min(group.length - 1, target));
    track.scrollTo({ left: position * track.clientWidth, behavior: smooth ? 'smooth' : 'instant' });
    update();
  };

  let ticking = false;
  track.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const current = Math.round(track.scrollLeft / track.clientWidth);
      if (current !== position) { position = current; update(); }
    });
  }, { passive: true });
  // Quando cambia la misura (schermo intero, rotazione del telefono) si resta sulla stessa immagine.
  if ('ResizeObserver' in window) new ResizeObserver(() => { if (viewer.open) go(position, false); }).observe(track);

  const open = (link) => {
    trigger = link;
    group = links.filter((item) => item.dataset.gallery === link.dataset.gallery);
    slides = group.map((item) => {
      const slide = document.createElement('figure');
      slide.className = 'image-viewer-slide';
      const img = document.createElement('img');
      img.alt = item.querySelector('img')?.alt || '';
      img.decoding = 'async';
      slide.append(img);
      return slide;
    });
    track.replaceChildren(...slides);
    viewer.classList.remove('is-idle');
    viewer.showModal();
    document.body.classList.add('image-viewer-open');
    go(group.indexOf(link), false);
    close.focus({ preventScroll: true });
    // Schermo intero vero dove il browser lo permette (non su iPhone): il dialog copre comunque tutta la finestra.
    wentFullscreen = false;
    if (viewer.requestFullscreen && !document.fullscreenElement) {
      viewer.requestFullscreen({ navigationUI: 'hide' }).then(() => { wentFullscreen = true; }).catch(() => {});
    }
  };

  links.forEach((link) => {
    const label = link.querySelector('img')?.alt || 'immagine';
    link.setAttribute('aria-label', `Ingrandisci: ${label}`);
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      open(link);
    });
  });

  previous.addEventListener('click', () => go(position - 1));
  next.addEventListener('click', () => go(position + 1));
  close.addEventListener('click', () => viewer.close());
  // Un tocco sull'immagine nasconde o mostra i pulsanti, per guardarla senza niente sopra.
  track.addEventListener('click', () => viewer.classList.toggle('is-idle'));
  viewer.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      go(position + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  // Esc in schermo intero esce dallo schermo intero: in quel caso si chiude anche il visualizzatore.
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && wentFullscreen && viewer.open) viewer.close();
  });
  viewer.addEventListener('close', () => {
    if (document.fullscreenElement === viewer) document.exitFullscreen().catch(() => {});
    wentFullscreen = false;
    document.body.classList.remove('image-viewer-open');
    track.replaceChildren();
    trigger?.focus({ preventScroll: true });
  });
})();
