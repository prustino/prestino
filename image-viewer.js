// Visualizzatore delle immagini dei progetti: a schermo intero, nero, senza titoli né contatori.
// Le immagini di un gruppo (data-gallery) stanno in una striscia che si scorre col dito (scroll-snap) o con le frecce;
// le versioni grandi si caricano solo per l'immagine visibile e le due vicine. Per aprire il file da solo resta il menu
// del browser sull'immagine (tasto destro, o dito tenuto premuto sul telefono).
// Zoom: rotellina, doppio clic o tasti + e − sul computer; due dita o doppio tocco sul telefono. Da ingrandita la foto si
// sposta trascinandola, e se il collegamento ha data-zoom si carica la versione grande (NOME-zoom.webp) per restare nitida.
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

  // ---- Zoom ----
  const MAX_ZOOM = 5;
  const zoom = { s: 1, x: 0, y: 0, img: null };
  const currentImg = () => slides[position]?.querySelector('img');
  // Misura dell'immagine visibile a zoom 1 (object-fit: contain dentro lo schermo).
  const baseSize = (img) => {
    const W = track.clientWidth, H = track.clientHeight;
    const r = (img.naturalWidth || 4) / (img.naturalHeight || 3);
    return W / H > r ? { w: H * r, h: H } : { w: W, h: W / r };
  };
  const limit = () => {
    const { w, h } = baseSize(zoom.img);
    const mx = Math.max(0, (w * zoom.s - track.clientWidth) / 2);
    const my = Math.max(0, (h * zoom.s - track.clientHeight) / 2);
    zoom.x = Math.max(-mx, Math.min(mx, zoom.x));
    zoom.y = Math.max(-my, Math.min(my, zoom.y));
  };
  const apply = (animate = false) => {
    const img = zoom.img;
    if (!img) return;
    img.style.transition = animate ? 'transform .22s ease' : 'none';
    img.style.transform = zoom.s === 1 ? '' : `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.s})`;
    viewer.classList.toggle('is-zoomed', zoom.s > 1);
  };
  const resetZoom = (animate = false) => {
    if (zoom.img) { zoom.s = 1; zoom.x = 0; zoom.y = 0; apply(animate); }
    zoom.img = null;
    viewer.classList.remove('is-zoomed');
  };
  // Versione grande: si scarica al primo ingrandimento e sostituisce quella normale quando è pronta.
  const sharpen = (img, i) => {
    const big = group[i]?.dataset.zoom;
    if (!big || img.dataset.sharp) return;
    img.dataset.sharp = '1';
    const pre = new Image();
    pre.src = big;
    pre.decode().then(() => { img.src = big; }).catch(() => { delete img.dataset.sharp; });
  };
  // Ingrandisce a "scale" tenendo fermo il punto dello schermo (cx, cy).
  const setZoom = (scale, cx, cy, animate = false) => {
    const img = currentImg();
    if (!img || !img.naturalWidth) return;
    if (zoom.img !== img) { resetZoom(); zoom.img = img; }
    const target = Math.max(1, Math.min(MAX_ZOOM, scale));
    const rect = track.getBoundingClientRect();
    const px = (cx ?? rect.left + rect.width / 2) - (rect.left + rect.width / 2);
    const py = (cy ?? rect.top + rect.height / 2) - (rect.top + rect.height / 2);
    if (target <= 1.01) { zoom.s = 1; zoom.x = 0; zoom.y = 0; apply(animate); return; }
    zoom.x = px - (px - zoom.x) * (target / zoom.s);
    zoom.y = py - (py - zoom.y) * (target / zoom.s);
    zoom.s = target;
    limit();
    apply(animate);
    sharpen(img, position);
  };
  const pan = (x, y) => { zoom.x = x; zoom.y = y; limit(); apply(); };

  // ---- Striscia delle immagini ----
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
    resetZoom();
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
      if (current !== position) { resetZoom(); position = current; update(); }
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
      img.draggable = false;
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

  // ---- Mouse: rotellina, doppio clic, trascinamento ----
  let moved = false; // dopo un trascinamento o un gesto il clic non nasconde i pulsanti
  track.addEventListener('wheel', (event) => {
    event.preventDefault();
    const delta = event.deltaMode === 1 ? event.deltaY * 30 : event.deltaY;
    setZoom(zoom.s * Math.exp(-delta * 0.0018), event.clientX, event.clientY);
  }, { passive: false });
  track.addEventListener('dblclick', (event) => {
    if (zoom.s > 1) setZoom(1, null, null, true);
    else setZoom(2.5, event.clientX, event.clientY, true);
  });
  let drag = null;
  track.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch' || zoom.s === 1 || event.button !== 0) return;
    drag = { id: event.pointerId, sx: event.clientX, sy: event.clientY, x: zoom.x, y: zoom.y };
    try { track.setPointerCapture(event.pointerId); } catch { /* puntatore già rilasciato */ }
    viewer.classList.add('is-dragging');
  });
  track.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.sx, dy = event.clientY - drag.sy;
    if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
    pan(drag.x + dx, drag.y + dy);
  });
  const endDrag = () => { drag = null; viewer.classList.remove('is-dragging'); };
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);

  // ---- Touch: due dita per ingrandire, un dito per spostare, doppio tocco ----
  let pinch = null;
  let touchPan = null;
  let lastTap = { time: 0, x: 0, y: 0 };
  const distance = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  const middle = (a, b) => ({ x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 });
  const center = () => { const r = track.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  track.addEventListener('touchstart', (event) => {
    if (event.touches.length === 2) {
      event.preventDefault();
      const img = currentImg();
      if (!img || !img.naturalWidth) return;
      if (zoom.img !== img) { resetZoom(); zoom.img = img; }
      const [a, b] = event.touches;
      pinch = { d: distance(a, b), m: middle(a, b), s: zoom.s, x: zoom.x, y: zoom.y };
      touchPan = null;
      moved = true;
    } else if (event.touches.length === 1 && zoom.s > 1) {
      const t = event.touches[0];
      touchPan = { sx: t.clientX, sy: t.clientY, x: zoom.x, y: zoom.y };
    }
  }, { passive: false });
  track.addEventListener('touchmove', (event) => {
    if (pinch && event.touches.length === 2) {
      event.preventDefault();
      const [a, b] = event.touches;
      const m = middle(a, b), c = center();
      const s = Math.max(1, Math.min(MAX_ZOOM, pinch.s * distance(a, b) / pinch.d));
      zoom.x = (m.x - c.x) - (pinch.m.x - c.x - pinch.x) * (s / pinch.s);
      zoom.y = (m.y - c.y) - (pinch.m.y - c.y - pinch.y) * (s / pinch.s);
      zoom.s = s;
      limit();
      apply();
      if (s > 1) sharpen(zoom.img, position);
    } else if (touchPan && event.touches.length === 1 && zoom.s > 1) {
      event.preventDefault();
      const t = event.touches[0];
      if (Math.abs(t.clientX - touchPan.sx) + Math.abs(t.clientY - touchPan.sy) > 6) moved = true;
      pan(touchPan.x + t.clientX - touchPan.sx, touchPan.y + t.clientY - touchPan.sy);
    }
  }, { passive: false });
  track.addEventListener('touchend', (event) => {
    if (pinch && event.touches.length < 2) {
      pinch = null;
      if (zoom.s < 1.05) setZoom(1, null, null, true);
      if (event.touches.length === 1 && zoom.s > 1) {
        const t = event.touches[0];
        touchPan = { sx: t.clientX, sy: t.clientY, x: zoom.x, y: zoom.y };
      }
      return;
    }
    if (event.touches.length === 0) {
      const wasPan = touchPan && moved;
      touchPan = null;
      const t = event.changedTouches[0];
      const now = Date.now();
      if (!wasPan && now - lastTap.time < 300 && Math.hypot(t.clientX - lastTap.x, t.clientY - lastTap.y) < 30) {
        event.preventDefault();
        if (zoom.s > 1) setZoom(1, null, null, true); else setZoom(2.5, t.clientX, t.clientY, true);
        lastTap = { time: 0, x: 0, y: 0 };
        moved = true;
      } else lastTap = { time: now, x: t.clientX, y: t.clientY };
    }
  });

  // Un tocco sull'immagine nasconde o mostra i pulsanti, per guardarla senza niente sopra.
  track.addEventListener('click', () => {
    if (moved) { moved = false; return; }
    viewer.classList.toggle('is-idle');
  });
  viewer.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      go(position + (event.key === 'ArrowRight' ? 1 : -1));
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      setZoom(zoom.s * 1.5, null, null, true);
    } else if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      setZoom(zoom.s / 1.5, null, null, true);
    } else if (event.key === '0') {
      setZoom(1, null, null, true);
    }
  });
  // Esc in schermo intero esce dallo schermo intero: in quel caso si chiude anche il visualizzatore.
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && wentFullscreen && viewer.open) viewer.close();
  });
  viewer.addEventListener('close', () => {
    if (document.fullscreenElement === viewer) document.exitFullscreen().catch(() => {});
    wentFullscreen = false;
    resetZoom();
    document.body.classList.remove('image-viewer-open');
    track.replaceChildren();
    trigger?.focus({ preventScroll: true });
  });
})();
