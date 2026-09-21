(() => {
  const revision = document.currentScript.dataset.revision;
  let pending = false;
  let notice;
  async function check() {
    if (pending || document.hidden) return;
    pending = true;
    try {
      const response = await fetch('/__preview/status', { cache: 'no-store' });
      if (!response.ok) return;
      const state = await response.json();
      if (state.error) {
        if (!notice) {
          notice = document.createElement('div');
          notice.setAttribute('role', 'alert');
          notice.style.cssText = 'position:fixed;bottom:12px;left:12px;right:12px;z-index:9999;padding:16px;background:#342521;color:#fff;border-radius:8px;font:15px/1.5 system-ui;box-shadow:0 4px 20px #0003;';
          document.body.append(notice);
        }
        notice.textContent = `Anteprima non aggiornata: ${state.error}`;
        return;
      }
      notice?.remove();
      notice = undefined;
      if (state.revision !== revision) {
        const project = location.pathname.match(/^\/progetti\/([^/]+)\/(?:index\.html)?$/)?.[1];
        if (project && !state.projects.includes(project)) location.replace(`/progetti.html${location.search}`);
        else location.reload();
      }
    } catch { /* The preview reconnects automatically after a local server restart. */ }
    finally { pending = false; }
  }
  setInterval(check, 800);
  document.addEventListener('visibilitychange', check);
  window.addEventListener('pageshow', check);
  check();
})();
