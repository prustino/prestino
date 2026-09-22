(() => {
  'use strict';

  document.documentElement.classList.add('js');

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
      if (event.target.closest('a')) setMenuOpen(false);
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

  const filterButtons = [...document.querySelectorAll('button[data-filter]')];
  const projects = [...document.querySelectorAll('[data-project]')];
  const filterStatus = document.querySelector('[data-filter-status]');
  const projectSearch = document.querySelector('[data-project-search]');
  const searchClear = document.querySelector('[data-search-clear]');
  const searchReset = document.querySelector('[data-search-reset]');
  const resetButtons = [...document.querySelectorAll('[data-search-reset], [data-search-reset-empty]')];
  const emptyState = document.querySelector('[data-empty-state]');

  if (filterButtons.length && (projects.length || projectSearch)) {
    const normalizeSearch = (value) => value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
    const availableFilters = new Set(filterButtons.map((button) => button.dataset.filter));
    const initialFilter = filterButtons.find((button) => button.getAttribute('aria-pressed') === 'true');
    let activeFilter = initialFilter ? initialFilter.dataset.filter : 'all';
    const filterLabels = new Map(filterButtons.map((button) => [button.dataset.filter,
      [...button.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent).join('').trim()
    ]));
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
      if (activeFilter !== 'all') url.searchParams.set('categoria', activeFilter);
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
        const matchesCategory = activeFilter === 'all' || project.categories.includes(activeFilter);
        const visible = matchesCategory && terms.every((term) => project.text.includes(term));
        project.element.hidden = !visible;
        if (visible) visibleCount += 1;
        project.element.querySelectorAll('a[href]').forEach((link) => {
          const href = link.getAttribute('href');
          const url = new URL(href, window.location.href);
          const rawQuery = projectSearch?.value.trim() || '';
          if (rawQuery) url.searchParams.set('q', rawQuery);
          else url.searchParams.delete('q');
          if (activeFilter !== 'all') url.searchParams.set('categoria', activeFilter);
          else url.searchParams.delete('categoria');
          link.setAttribute('href', `${href.split(/[?#]/)[0]}${url.search}${url.hash}`);
        });
      });

      filterButtons.forEach((button) => {
        const active = button.dataset.filter === activeFilter;
        button.setAttribute('aria-pressed', String(active));
        button.classList.toggle('is-active', active);
        const count = button.querySelector('[data-filter-count]');
        if (count) count.textContent = projectIndex.filter((project) =>
          (button.dataset.filter === 'all' || project.categories.includes(button.dataset.filter))
          && terms.every((term) => project.text.includes(term))
        ).length;
      });

      if (filterStatus) {
        const countText = visibleCount === 1 ? '1 progetto' : `${visibleCount} progetti`;
        const queryText = projectSearch?.value.trim();
        const categoryText = activeFilter === 'all' ? '' : ` · ${filterLabels.get(activeFilter)}`;
        const announce = () => { filterStatus.textContent = `${countText}${queryText ? ` per “${queryText}”` : ''}${categoryText}.`; };
        window.clearTimeout(announcementTimer);
        if (announcementDelay) announcementTimer = window.setTimeout(announce, announcementDelay);
        else announce();
      }
      if (emptyState) emptyState.hidden = visibleCount > 0;
      if (searchClear) searchClear.hidden = !projectSearch?.value.length;
      if (searchReset) searchReset.hidden = !query && activeFilter === 'all';
      if (updateUrl) writeSearchToUrl();
    };

    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        activeFilter = button.dataset.filter;
        applyFilters();
      });
    });

    if (projectSearch) {
      const readSearchFromUrl = () => {
        const params = new URL(window.location.href).searchParams;
        const category = params.get('categoria');
        projectSearch.value = params.get('q') || '';
        activeFilter = availableFilters.has(category) ? category : 'all';
        applyFilters(false);
      };

      projectSearch.addEventListener('input', () => applyFilters(true, 250));
      searchClear?.addEventListener('click', () => {
        projectSearch.value = '';
        applyFilters();
        projectSearch.focus();
      });
      resetButtons.forEach((button) => button.addEventListener('click', () => {
        projectSearch.value = '';
        activeFilter = 'all';
        applyFilters();
        projectSearch.focus();
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
