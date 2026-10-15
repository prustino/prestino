(() => {
  'use strict';

  document.documentElement.classList.add('js');

  const normalizeSearch = (value) => value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  // Ricerca in tutto il sito: la lente compare nell'header di ogni pagina.
  const siteRoot = new URL('.', document.currentScript?.src || window.location.href);
  const onProjectsPage = document.body.classList.contains('projects-page');
  const headerInner = document.querySelector('.header-inner');
  let siteSearch = null;

  if (headerInner) {
    headerInner.insertAdjacentHTML('beforeend', `
      <div class="header-search" data-search-box>
        <label class="visually-hidden" for="site-search">Cerca nel sito</label>
        <input type="search" id="site-search" data-project-search placeholder="Cerca…" autocomplete="off" spellcheck="false" tabindex="-1" aria-controls="site-search-results">
        <button type="button" class="header-search-clear" data-search-clear hidden aria-label="Cancella la ricerca">×</button>
        <button type="button" class="header-search-toggle" data-search-toggle aria-expanded="false" aria-controls="site-search" aria-label="Apri la ricerca"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg></button>
        <div class="search-results" id="site-search-results" hidden><p class="search-results-status" role="status" aria-live="polite"></p><ul></ul></div>
      </div>`);

    const box = headerInner.querySelector('[data-search-box]');
    const input = box.querySelector('input');
    const clear = box.querySelector('[data-search-clear]');
    const toggle = box.querySelector('[data-search-toggle]');
    const results = box.querySelector('.search-results');
    const resultsStatus = results.querySelector('.search-results-status');
    const resultsList = results.querySelector('ul');
    let indexPromise;
    let renderTimer;

    const fetchPage = async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${response.status} ${url}`);
      return new DOMParser().parseFromString(await response.text(), 'text/html');
    };

    const toEntry = (doc, url, section) => {
      const main = doc.querySelector('main') || doc.body;
      main.querySelectorAll('script, noscript, .visually-hidden, [hidden]').forEach((node) => node.remove());
      const chunks = [...main.querySelectorAll('h1, h2, h3, p, li, figcaption, dt, dd, blockquote, a, strong, label')]
        .map((node) => node.textContent.replace(/\s+/g, ' ').trim())
        .filter(Boolean);
      const title = (doc.title || '').split(' — ')[0].trim() || section;
      const description = doc.querySelector('meta[name="description"]')?.content || '';
      return { url, section, title, chunks, titleText: normalizeSearch(title), text: normalizeSearch(`${title} ${description} ${chunks.join(' ')}`) };
    };

    // L'indice si costruisce alla prima ricerca leggendo le pagine pubblicate: progetti attivi, Chi sono e Contatti.
    const loadIndex = () => {
      indexPromise ||= (async () => {
        const projectsUrl = new URL('progetti.html', siteRoot);
        const projectsDoc = onProjectsPage ? document : await fetchPage(projectsUrl);
        const projectUrls = new Set([...projectsDoc.querySelectorAll('[data-project] .project-content a[href]')]
          .map((link) => new URL(link.getAttribute('href').split(/[?#]/)[0], projectsUrl).href));
        const pages = [
          [new URL('chi-sono.html', siteRoot).href, 'Chi sono'],
          [new URL('contatti.html', siteRoot).href, 'Contatti'],
          ...[...projectUrls].map((href) => [href, 'Progetto'])
        ];
        const entries = await Promise.all(pages.map(async ([url, section]) => {
          try { return toEntry(await fetchPage(url), url, section); } catch { return null; }
        }));
        return entries.filter(Boolean);
      })();
      return indexPromise;
    };

    const snippetFor = (entry, terms) => {
      const chunk = entry.chunks.find((text) => normalizeSearch(text).includes(terms[0])) || entry.chunks[0] || '';
      if (chunk.length <= 120) return chunk;
      const start = Math.max(0, normalizeSearch(chunk).indexOf(terms[0]) - 40);
      return `${start ? '…' : ''}${chunk.slice(start, start + 120).trim()}…`;
    };

    const renderResults = async () => {
      const query = normalizeSearch(input.value);
      if (!query) {
        results.hidden = true;
        return;
      }
      const terms = query.split(' ');
      let entries;
      try {
        entries = await loadIndex();
      } catch {
        resultsList.replaceChildren();
        resultsStatus.textContent = 'La ricerca nel sito non è disponibile in questa anteprima.';
        results.hidden = false;
        return;
      }
      if (normalizeSearch(input.value) !== query) return;
      // Nella pagina Progetti le schede si filtrano già sotto: qui si mostrano solo le altre sezioni.
      const matches = entries
        .filter((entry) => !(onProjectsPage && entry.section === 'Progetto'))
        .filter((entry) => terms.every((term) => entry.text.includes(term)))
        .sort((a, b) => Number(terms.every((term) => b.titleText.includes(term))) - Number(terms.every((term) => a.titleText.includes(term))))
        .slice(0, 6);
      resultsList.replaceChildren(...matches.map((entry) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        const section = document.createElement('span');
        const title = document.createElement('strong');
        const snippet = document.createElement('span');
        link.href = entry.url;
        section.className = 'search-result-section';
        section.textContent = entry.section;
        title.textContent = entry.title;
        snippet.className = 'search-result-snippet';
        snippet.textContent = snippetFor(entry, terms);
        link.append(section, title, snippet);
        item.append(link);
        return item;
      }));
      if (onProjectsPage && !matches.length) {
        results.hidden = true;
        return;
      }
      resultsStatus.textContent = matches.length
        ? (onProjectsPage ? 'Anche nelle altre sezioni' : `${matches.length} ${matches.length === 1 ? 'risultato' : 'risultati'}`)
        : 'Nessun risultato';
      results.hidden = false;
    };

    const setOpen = (open, focus = false) => {
      box.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Chiudi la ricerca' : 'Apri la ricerca');
      input.tabIndex = open ? 0 : -1;
      if (!open) results.hidden = true;
      if (open) loadIndex().catch(() => {});
      if (open && focus) input.focus({ preventScroll: true });
    };

    const setValue = (value) => {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };

    input.addEventListener('input', () => {
      clear.hidden = !input.value;
      window.clearTimeout(renderTimer);
      renderTimer = window.setTimeout(renderResults, 150);
    });
    input.addEventListener('focus', () => { if (input.value) renderResults(); });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (input.value) setValue('');
        else {
          setOpen(false);
          toggle.focus();
        }
      } else if (event.key === 'ArrowDown') {
        const first = resultsList.querySelector('a');
        if (first && !results.hidden) {
          event.preventDefault();
          first.focus();
        }
      } else if (event.key === 'Enter' && !onProjectsPage) {
        const first = resultsList.querySelector('a');
        if (first && !results.hidden) window.location.href = first.href;
      }
    });
    resultsList.addEventListener('keydown', (event) => {
      const links = [...resultsList.querySelectorAll('a')];
      const index = links.indexOf(document.activeElement);
      if (event.key === 'ArrowDown' && index < links.length - 1) {
        event.preventDefault();
        links[index + 1].focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        (index > 0 ? links[index - 1] : input).focus();
      } else if (event.key === 'Escape') {
        input.focus();
      }
    });
    toggle.addEventListener('click', () => {
      const open = !box.classList.contains('is-open');
      if (!open && input.value) setValue('');
      setOpen(open, true);
      if (!open) toggle.focus();
    });
    clear.addEventListener('click', () => {
      setValue('');
      input.focus();
    });
    box.addEventListener('focusout', (event) => {
      if (box.contains(event.relatedTarget)) return;
      results.hidden = true;
      if (!input.value) setOpen(false);
    });

    siteSearch = {
      open: () => { if (!box.classList.contains('is-open')) setOpen(true); },
      close: () => setOpen(false),
      sync: () => { clear.hidden = !input.value; }
    };
  }

  const menuToggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');

  if (menuToggle && nav) {
    const setMenuOpen = (open) => {
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
      nav.classList.toggle('is-open', open);
    };

    setMenuOpen(false);
    menuToggle.addEventListener('click', () => {
      setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', (event) => {
      if (event.target.closest('a') && !event.defaultPrevented) setMenuOpen(false);
    });

    document.addEventListener('click', (event) => {
      if (!nav.contains(event.target) && !menuToggle.contains(event.target)) {
        setMenuOpen(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
        setMenuOpen(false);
        menuToggle.focus();
      }
    });

    document.addEventListener('focusin', (event) => {
      if (!nav.contains(event.target) && !menuToggle.contains(event.target)) setMenuOpen(false);
    });
    window.matchMedia('(max-width: 650px)').addEventListener('change', () => setMenuOpen(false));
  }

  const aboutCarousel = document.querySelector('[data-about-carousel]');

  if (aboutCarousel) {
    const slides = [...aboutCarousel.querySelectorAll('[data-about-slide]')];
    const controls = aboutCarousel.querySelector('[data-about-controls]');
    const previous = aboutCarousel.querySelector('[data-about-prev]');
    const next = aboutCarousel.querySelector('[data-about-next]');
    const toggle = aboutCarousel.querySelector('[data-about-toggle]');
    const toggleLabel = aboutCarousel.querySelector('[data-about-toggle-label]');
    const counter = aboutCarousel.querySelector('[data-about-counter]');
    const status = aboutCarousel.querySelector('[data-about-status]');

    if (slides.length > 1 && controls && previous && next && toggle) {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      let current = 0;
      let timer;
      let pausedByUser = reducedMotion.matches;
      let pointerInside = false;
      let focusInside = false;

      const stopTimer = () => {
        window.clearTimeout(timer);
        timer = undefined;
      };

      const updateToggle = () => {
        const paused = pausedByUser;
        toggle.setAttribute('aria-label', paused ? 'Riprendi lo scorrimento automatico' : 'Metti in pausa lo scorrimento automatico');
        if (toggleLabel) toggleLabel.textContent = paused ? 'Riprendi' : 'Pausa';
      };

      const schedule = () => {
        stopTimer();
        if (pausedByUser || pointerInside || focusInside || document.hidden) return;
        timer = window.setTimeout(() => showSlide(current + 1), 6500);
      };

      const showSlide = (index, announce = false) => {
        current = (index + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => {
          const active = slideIndex === current;
          slide.hidden = !active;
          slide.classList.toggle('is-active', active);
          slide.setAttribute('aria-hidden', String(!active));
        });
        const followingImage = slides[(current + 1) % slides.length].querySelector('img[loading="lazy"]');
        if (followingImage) followingImage.loading = 'eager';
        if (counter) counter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
        if (announce && status) status.textContent = `Progetto ${current + 1} di ${slides.length}: ${slides[current].querySelector('strong')?.textContent || ''}`;
        schedule();
      };

      const pauseAfterControl = () => {
        pausedByUser = true;
        updateToggle();
        stopTimer();
      };

      previous.addEventListener('click', () => {
        pauseAfterControl();
        showSlide(current - 1, true);
      });
      next.addEventListener('click', () => {
        pauseAfterControl();
        showSlide(current + 1, true);
      });
      toggle.addEventListener('click', () => {
        pausedByUser = !pausedByUser;
        updateToggle();
        if (status) status.textContent = pausedByUser ? 'Scorrimento automatico in pausa.' : 'Scorrimento automatico attivo.';
        schedule();
      });
      aboutCarousel.addEventListener('pointerenter', () => {
        pointerInside = true;
        stopTimer();
      });
      aboutCarousel.addEventListener('pointerleave', () => {
        pointerInside = false;
        schedule();
      });
      aboutCarousel.addEventListener('focusin', () => {
        focusInside = true;
        stopTimer();
      });
      aboutCarousel.addEventListener('focusout', (event) => {
        if (!aboutCarousel.contains(event.relatedTarget)) {
          focusInside = false;
          schedule();
        }
      });
      document.addEventListener('visibilitychange', schedule);
      reducedMotion.addEventListener('change', (event) => {
        if (event.matches) pausedByUser = true;
        updateToggle();
        schedule();
      });

      controls.hidden = false;
      updateToggle();
      showSlide(0);
    }
  }

  // Il menu dei filtri si apre al passaggio del mouse; sugli schermi touch con un tocco su "Progetti".
  const navSubmenu = document.querySelector('[data-nav-submenu]');

  if (navSubmenu && !navSubmenu.querySelector('.nav-submenu')?.hidden) {
    const submenuLink = navSubmenu.querySelector('a');
    const canHover = window.matchMedia('(hover: hover)');
    submenuLink.addEventListener('click', (event) => {
      if (canHover.matches) return;
      event.preventDefault();
      navSubmenu.classList.toggle('is-open');
    });
    document.addEventListener('click', (event) => {
      if (!navSubmenu.contains(event.target)) navSubmenu.classList.remove('is-open');
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') navSubmenu.classList.remove('is-open');
    });
  }

  const filterButtons = [...document.querySelectorAll('button[data-filter]')];
  const projects = [...document.querySelectorAll('[data-project]')];
  const searchTags = [...document.querySelectorAll('button[data-search-tag]')];
  const filterStatus = document.querySelector('[data-filter-status]');
  const projectSearch = document.querySelector('[data-project-search]');
  const resetButtons = [...document.querySelectorAll('[data-search-reset], [data-search-reset-empty]')];
  const emptyState = document.querySelector('[data-empty-state]');

  if (filterButtons.length && (projects.length || projectSearch)) {
    searchTags.forEach((button) => { button.disabled = false; });
    const availableFilters = new Set(filterButtons.map((button) => button.dataset.filter));
    // Al massimo un ambito attivo; nessun ambito attivo mostra tutti i progetti.
    const activeFilters = new Set(filterButtons
      .filter((button) => button.getAttribute('aria-pressed') === 'true')
      .map((button) => button.dataset.filter));
    const filterLabels = new Map(filterButtons.map((button) => [button.dataset.filter,
      [...button.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent).join('').trim()
    ]));
    const matchesFilters = (categories, filters = activeFilters) => !filters.size || categories.some((category) => filters.has(category));
    const categoryParam = () => [...availableFilters].filter((filter) => activeFilters.has(filter)).join(',');
    let announcementTimer;

    // Keep illustrative mockups out of the searchable project content.
    const projectIndex = projects.map((project) => ({
      element: project,
      categories: (project.dataset.category || '').split(/\s+/),
      text: normalizeSearch(`${project.querySelector('.project-content')?.textContent || ''} ${project.dataset.keywords || ''}`)
    }));

    const writeSearchToUrl = () => {
      if (!projectSearch) return;

      const url = new URL(window.location.href);
      const query = projectSearch.value.replace(/\s+/g, ' ').trim();
      if (query) url.searchParams.set('q', query);
      else url.searchParams.delete('q');
      if (activeFilters.size) url.searchParams.set('categoria', categoryParam());
      else url.searchParams.delete('categoria');

      if (url.href !== window.location.href) {
        try {
          const currentPage = url.pathname.slice(url.pathname.lastIndexOf('/') + 1) || './';
          window.history.replaceState(window.history.state, '', `${currentPage}${url.search}${url.hash}`);
        } catch {
          // Search still works when a local-file preview restricts history updates.
        }
      }
    };

    const applyFilters = (updateUrl = true, announcementDelay = 0) => {
      const query = normalizeSearch(projectSearch?.value || '');
      const terms = query ? query.split(' ') : [];
      let visibleCount = 0;

      projectIndex.forEach((project) => {
        const visible = matchesFilters(project.categories) && terms.every((term) => project.text.includes(term));
        project.element.hidden = !visible;
        if (visible) visibleCount += 1;
        project.element.querySelectorAll('a[href]').forEach((link) => {
          const href = link.getAttribute('href');
          const url = new URL(href, window.location.href);
          const rawQuery = projectSearch?.value.trim() || '';
          if (rawQuery) url.searchParams.set('q', rawQuery);
          else url.searchParams.delete('q');
          if (activeFilters.size) url.searchParams.set('categoria', categoryParam());
          else url.searchParams.delete('categoria');
          link.setAttribute('href', `${href.split(/[?#]/)[0]}${url.search}${url.hash}`);
        });
      });

      filterButtons.forEach((button) => {
        const active = activeFilters.has(button.dataset.filter);
        button.setAttribute('aria-pressed', String(active));
        button.classList.toggle('is-active', active);
      });

      searchTags.forEach((button) => {
        const active = Boolean(query) && normalizeSearch(button.dataset.searchTag || '') === query;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });

      if (filterStatus) {
        const countText = visibleCount === 1 ? '1 progetto' : `${visibleCount} progetti`;
        const queryText = projectSearch?.value.trim();
        const categoryText = activeFilters.size ? ` · ${categoryParam().split(',').map((filter) => filterLabels.get(filter)).join(', ')}` : '';
        const announce = () => { filterStatus.textContent = `${countText}${queryText ? ` per “${queryText}”` : ''}${categoryText}.`; };
        window.clearTimeout(announcementTimer);
        if (announcementDelay) announcementTimer = window.setTimeout(announce, announcementDelay);
        else announce();
      }
      if (emptyState) emptyState.hidden = visibleCount > 0;
      if (projectSearch?.value) siteSearch?.open();
      if (updateUrl) writeSearchToUrl();
    };

    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        // Un solo ambito alla volta: un secondo clic sullo stesso filtro lo spegne.
        const filter = button.dataset.filter;
        const wasActive = activeFilters.has(filter);
        activeFilters.clear();
        if (!wasActive) activeFilters.add(filter);
        applyFilters();
      });
    });

    searchTags.forEach((button) => {
      button.addEventListener('click', () => {
        if (!projectSearch) return;
        const tag = button.dataset.searchTag || '';
        projectSearch.value = normalizeSearch(projectSearch.value) === normalizeSearch(tag) ? '' : tag;
        projectSearch.dispatchEvent(new Event('input'));
        applyFilters();
      });
    });

    if (projectSearch) {
      const readSearchFromUrl = () => {
        const params = new URL(window.location.href).searchParams;
        projectSearch.value = params.get('q') || '';
        activeFilters.clear();
        const category = (params.get('categoria') || '').split(',').find((value) => availableFilters.has(value));
        if (category) activeFilters.add(category);
        applyFilters(false);
        siteSearch?.sync();
      };

      projectSearch.addEventListener('input', () => applyFilters(true, 250));
      resetButtons.forEach((button) => button.addEventListener('click', () => {
        projectSearch.value = '';
        projectSearch.dispatchEvent(new Event('input'));
        activeFilters.clear();
        applyFilters();
        siteSearch?.close();
      }));
      window.addEventListener('popstate', readSearchFromUrl);
      readSearchFromUrl();
    } else {
      applyFilters(false);
    }
  }

  // Preserve search context in the collection link without storing browsing history.
  const contextLinks = document.querySelectorAll('.project-breadcrumb a, .project-pagination a');
  contextLinks.forEach((link) => {
    const context = new URL(window.location.href).searchParams;
    const href = link.getAttribute('href');
    const url = new URL(href, window.location.href);
    ['q', 'categoria'].forEach((key) => {
      if (context.has(key)) url.searchParams.set(key, context.get(key));
    });
    link.setAttribute('href', `${href.split(/[?#]/)[0]}${url.search}${url.hash}`);
  });

  const contactForm = document.querySelector('[data-contact-form]');
  const formStatus = document.querySelector('[data-form-status]');
  const placeholderMessage = 'Occorre configurare un indirizzo email valido prima di inviare un messaggio.';
  const isUsableEmail = (email) => /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email);
  const emailUrl = (email) => `mailto:${encodeURIComponent(email).replace(/%40/g, '@')}`;

  if (contactForm) {
    const configured = isUsableEmail((contactForm.dataset.email || '').trim());
    const fields = contactForm.querySelector('[data-contact-fields]');
    const submit = contactForm.querySelector('[type="submit"]');
    const notice = contactForm.querySelector('[data-contact-notice]');
    if (fields) fields.disabled = !configured;
    if (submit) submit.disabled = !configured;
    if (notice) notice.hidden = configured;
    if (configured) {
      submit.textContent = 'Apri nel programma email';
      if (formStatus) formStatus.textContent = 'Il messaggio si aprirà nel tuo programma email, dove potrai inviarlo.';
    }
    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!contactForm.reportValidity()) return;

      const recipient = (contactForm.dataset.email || '').trim();
      if (!isUsableEmail(recipient)) {
        if (formStatus) formStatus.textContent = placeholderMessage;
        return;
      }

      const fields = new FormData(contactForm);
      const name = String(fields.get('nome') || '').trim();
      const email = String(fields.get('email') || '').trim();
      const message = String(fields.get('messaggio') || '').trim();
      const subject = `Messaggio dal portfolio — ${name}`;
      const body = `Nome: ${name}\r\nEmail: ${email}\r\n\r\n${message}`;

      if (formStatus) {
        formStatus.textContent = 'Richiesta apertura del programma email con il messaggio compilato. Per inviarlo, conferma dal tuo programma email. Se non si apre, usa l’indirizzo indicato in questa pagina.';
      }
      window.location.href = `${emailUrl(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }
})();
