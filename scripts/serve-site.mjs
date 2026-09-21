import { createServer } from 'node:http';
import { readdir, lstat, readFile, open } from 'node:fs/promises';
import { join, resolve, extname, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { buildSite, siteRoot, withSiteLock } from './projects.mjs';

const generatedPages = new Set(['index.html', 'progetti.html', 'chi-sono.html']);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.pdf': 'application/pdf', '.stl': 'model/stl', '.3mf': 'model/3mf', '.step': 'application/step', '.woff2': 'font/woff2' };
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

async function fingerprint(root) {
  const entries = [];
  async function walk(path, recursive = true) {
    let info;
    try { info = await lstat(join(root, path)); }
    catch (error) { if (error.code === 'ENOENT') { entries.push(`${path}:missing`); return; } throw error; }
    if (info.isDirectory()) {
      const children = (await readdir(join(root, path))).filter((name) => !name.startsWith('.') && !name.endsWith('.md')).sort();
      entries.push(`${path}:${children.join(',')}`);
      if (recursive) for (const child of children) await walk(join(path, child));
    } else entries.push(`${path}:${info.size}:${info.mtimeMs}:${info.ctimeMs}`);
  }
  for (const folder of ['scripts/templates', 'img', 'progetti']) await walk(folder);
  // Hidden drafts can be incomplete; only their presence affects the active catalogue.
  await walk('progetti-nascosti', false);
  for (const file of (await readdir(root)).sort()) {
    if (/\.(html|css|js)$/.test(file) && !generatedPages.has(file)) await walk(file);
  }
  return createHash('sha256').update(entries.join('\n')).digest('hex');
}

export async function startPreview({ root = siteRoot, port = 4173, pollMs = 500, onUpdate = () => {} } = {}) {
  let revision = '';
  let projectSlugs = [];
  let failure = '';
  let pending;
  let lastAttempt = '';
  let attemptedAt = 0;
  const client = await readFile(new URL('./preview-client.js', import.meta.url), 'utf8');
  const liveScript = (pageRevision) => `<script src="/__preview/client.js" data-revision="${pageRevision}" defer></script>`;

  async function refresh() {
    if (pending) return pending;
    pending = (async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        let before;
        try {
          before = await fingerprint(root);
          if (before === revision && !failure) return;
          if (before === lastAttempt && failure && Date.now() - attemptedAt < 1500) return;
          lastAttempt = before;
          attemptedAt = Date.now();
          const projects = await buildSite(root);
          const after = await fingerprint(root);
          if (before !== after) { await delay(80); continue; }
          revision = after;
          projectSlugs = projects.map((project) => project.slug);
          failure = '';
          onUpdate(projects.length);
          return;
        } catch (error) {
          // Finder may finish the source and destination changes in separate events.
          if (attempt < 2) { await delay(100); continue; }
          failure = error.message;
          return;
        }
      }
      failure = 'Le cartelle stanno cambiando. Attendo che lo spostamento sia completato.';
    })();
    try { await pending; } finally { pending = undefined; }
  }

  const server = createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (status, body, type = 'text/plain; charset=utf-8') => {
      response.writeHead(status, { 'Content-Type': type });
      response.end(request.method === 'HEAD' ? undefined : body);
    };
    if (!['GET', 'HEAD'].includes(request.method)) { response.setHeader('Allow', 'GET, HEAD'); send(405, 'Metodo non consentito.'); return; }
    let url, pathname;
    try { url = new URL(request.url, 'http://localhost'); pathname = decodeURIComponent(url.pathname); }
    catch { send(400, 'Indirizzo non valido.'); return; }
    if (pathname === '/' || pathname === '/index.html') {
      response.writeHead(302, { Location: `/chi-sono.html${url.search}` }); response.end(); return;
    }
    if (pathname === '/__preview/client.js') { send(200, client, types['.js']); return; }
    try {
      await refresh();
      const pageRevision = revision;
      if (pathname === '/__preview/status') {
        send(200, JSON.stringify({ revision, projects: projectSlugs, error: failure }), 'application/json');
        return;
      }
      if (pathname.split('/').some((part) => part.startsWith('.')) || pathname.includes('\\') || pathname.includes('\0')) { send(404, 'Pagina non trovata.'); return; }
      const publicRoot = join(root, 'dist');
      const filePath = resolve(publicRoot, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`);
      const rel = relative(publicRoot, filePath);
      if (isAbsolute(rel) || rel.startsWith('..')) { send(404, 'Pagina non trovata.'); return; }
      const detailSlug = pathname.match(/^\/progetti\/([^/]+)\/(?:index\.html)?$/)?.[1];
      if (!failure && detailSlug && !projectSlugs.includes(detailSlug)) {
        response.writeHead(302, { Location: `/progetti.html${url.search}` }); response.end(); return;
      }
      if (failure) {
        send(503, `<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Anteprima in aggiornamento</title><body style="font:18px/1.6 system-ui;max-width:700px;margin:10vh auto;padding:24px"><h1>Anteprima in aggiornamento</h1><p>${escape(failure)}</p><p>Correggi il progetto o completa lo spostamento: la pagina si aggiornerà automaticamente.</p>${liveScript('')}</body></html>`, types['.html']);
        return;
      }
      let handle, info;
      // Open while the builder is idle; the descriptor remains valid across later builds.
      await withSiteLock(root, async () => {
        handle = await open(filePath, 'r');
        info = await handle.stat();
      });
      if (!info.isFile()) { await handle.close(); send(404, 'Pagina non trovata.'); return; }
      const extension = extname(filePath).toLowerCase();
      if (extension === '.html') {
        let html;
        try { html = await handle.readFile('utf8'); } finally { await handle.close(); }
        send(200, html.replace('</body>', `${liveScript(pageRevision)}</body>`), types['.html']);
        return;
      }
      response.setHeader('Accept-Ranges', 'bytes');
      let start = 0, end = info.size - 1;
      if (request.headers.range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
        if (!match || (!match[1] && !match[2])) { await handle.close(); response.setHeader('Content-Range', `bytes */${info.size}`); send(416, 'Intervallo non valido.'); return; }
        if (match[1]) { start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), end) : end; }
        else start = Math.max(0, info.size - Number(match[2]));
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= info.size) { await handle.close(); response.setHeader('Content-Range', `bytes */${info.size}`); send(416, 'Intervallo non valido.'); return; }
        response.setHeader('Content-Range', `bytes ${start}-${end}/${info.size}`);
      }
      response.writeHead(request.headers.range ? 206 : 200, { 'Content-Type': types[extension] || 'application/octet-stream', 'Content-Length': Math.max(0, end - start + 1) });
      if (request.method === 'HEAD' || info.size === 0) { await handle.close(); response.end(); return; }
      const stream = handle.createReadStream({ start, end });
      stream.on('error', () => response.destroy());
      response.on('close', () => stream.destroy());
      stream.pipe(response);
    } catch (error) {
      if (response.headersSent) response.destroy();
      else send(error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 500, error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 'Pagina non trovata.' : 'Aggiornamento in corso. Riprova tra poco.');
    }
  });
  await refresh();
  await new Promise((accept, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', accept); });
  const timer = setInterval(() => { void refresh(); }, pollMs);
  server.on('close', () => clearInterval(timer));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: async () => { clearInterval(timer); if (pending) await pending; await new Promise((accept, reject) => server.close((error) => error ? reject(error) : accept())); },
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const preview = await startPreview({ onUpdate: (count) => console.log(`Anteprima aggiornata: ${count} progetti attivi.`) });
    console.log(`Anteprima dinamica: ${preview.url}\nSposta le cartelle: il sito e il browser si aggiornano da soli.\nPremi Ctrl+C per fermare l’anteprima.`);
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await preview.close(); process.exit(); });
  } catch (error) {
    console.error(error.code === 'EADDRINUSE' ? 'La porta 4173 è già occupata. Chiudi il vecchio server di anteprima e riapri questo comando.' : error.message);
    process.exitCode = 1;
  }
}
