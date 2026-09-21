import { cp, mkdir, readdir, readFile, writeFile, rename, rm, lstat, access, mkdtemp } from 'node:fs/promises';
import { resolve, dirname, relative, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

export const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const folders = { attivi: 'progetti', nascosti: 'progetti-nascosti' };
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const exists = async (path) => { try { await access(path); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } };

async function localFile(directory, name) {
  if (typeof name !== 'string' || !name || name.includes('\\') || name.includes('?') || name.includes('#') || isAbsolute(name)) throw new Error(`Percorso risorsa non valido: ${name}`);
  const path = resolve(directory, name);
  const parts = relative(directory, path).split('/');
  if (parts.includes('..') || parts.some((part) => part.startsWith('.'))) throw new Error(`La risorsa deve restare nel progetto: ${name}`);
  let current = directory;
  for (const part of parts) {
    current = join(current, part);
    if ((await lstat(current)).isSymbolicLink()) throw new Error(`I collegamenti simbolici non sono supportati: ${name}`);
  }
  if (!(await lstat(path)).isFile()) throw new Error(`File mancante: ${name}`);
}

export async function readProjects(root, state = 'attivi', validate = true) {
  if (!folders[state]) throw new Error('Stato del progetto non valido.');
  const directory = join(root, folders[state]);
  if (!await exists(directory)) return [];
  const projects = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isSymbolicLink()) throw new Error(`Rimuovi il collegamento simbolico ${folders[state]}/${entry.name}.`);
    if (!entry.isDirectory()) continue;
    const projectDir = join(directory, entry.name);
    // Hidden folders may contain unfinished projects; validate them on activation.
    if (state === 'nascosti' || !validate) {
      let title = entry.name;
      try { title = JSON.parse(await readFile(join(projectDir, 'progetto.json'), 'utf8')).title || title; } catch {}
      projects.push({ slug: entry.name, title, order: 0, directory: projectDir });
      continue;
    }
    if (!slugPattern.test(entry.name)) throw new Error(`Nome cartella non valido: ${entry.name}. Usa lettere minuscole, numeri e trattini.`);
    let data;
    try { data = JSON.parse(await readFile(join(projectDir, 'progetto.json'), 'utf8')); }
    catch (error) { throw new Error(`${folders[state]}/${entry.name}/progetto.json: ${error.message}`); }
    for (const key of ['title', 'label', 'description', 'keywords', 'status']) {
      if (typeof data[key] !== 'string' || !data[key].trim()) throw new Error(`${entry.name}: manca il campo ${key}.`);
    }
    if (!['real', 'concept'].includes(data.kind) || !Number.isFinite(data.order)) throw new Error(`${entry.name}: kind o order non valido.`);
    if (!Array.isArray(data.categories) || !data.categories.length || data.categories.some((category) => !['modellazione', 'stampa', 'prototipi'].includes(category))) throw new Error(`${entry.name}: categorie non valide.`);
    if (!Array.isArray(data.tags) || data.tags.some((tag) => typeof tag !== 'string')) throw new Error(`${entry.name}: tags non validi.`);
    if (!data.image || typeof data.image.alt !== 'string' || !data.image.alt.trim() || !Number.isInteger(data.image.width) || data.image.width <= 0 || !Number.isInteger(data.image.height) || data.image.height <= 0) throw new Error(`${entry.name}: anteprima non valida.`);
    await localFile(projectDir, 'index.html');
    await localFile(projectDir, data.image.src);
    if (data.image.srcset !== undefined) {
      if (!Array.isArray(data.image.srcset)) throw new Error(`${entry.name}: srcset non valido.`);
      for (const source of data.image.srcset) {
        if (!Number.isInteger(source.width) || source.width <= 0) throw new Error(`${entry.name}: larghezza srcset non valida.`);
        await localFile(projectDir, source.src);
      }
    }
    projects.push({ ...data, slug: entry.name, directory: projectDir });
  }
  return projects.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}

export async function inventory(root, validate = true) {
  const [attivi, nascosti] = await Promise.all([readProjects(root, 'attivi', validate), readProjects(root, 'nascosti')]);
  const duplicate = attivi.find((project) => nascosti.some((hidden) => hidden.slug === project.slug));
  if (duplicate) throw new Error(`Il progetto ${duplicate.slug} esiste in entrambe le cartelle. Nessun file è stato sovrascritto.`);
  return { attivi, nascosti };
}

function card(project, index) {
  const base = `progetti/${project.slug}/`;
  const url = `${base}index.html`;
  const real = project.kind === 'real';
  const image = project.image;
  const srcset = image.srcset?.length ? ` srcset="${image.srcset.map((source) => `${escape(base + source.src)} ${source.width}w`).join(', ')}" sizes="(max-width: 650px) calc(100vw - 40px), 600px"` : '';
  return `          <article class="project-card${real ? ' project-card-real' : ''}" id="${project.slug}" data-project data-category="${escape(project.categories.join(' '))}" data-keywords="${escape(project.keywords)}">
            <a class="project-preview-link" href="${url}" aria-label="Scopri ${escape(project.title)}"><div class="project-visual ${real ? 'photo' : 'object'}-visual"><img src="${escape(base + image.src)}"${srcset} width="${image.width}" height="${image.height}" loading="lazy" decoding="async" alt="${escape(image.alt)}"></div></a>
            <div class="project-content"><div class="project-eyebrow"><span>${escape(project.label)}</span><span>/${String(index + 1).padStart(2, '0')}</span></div><h2><a href="${url}">${escape(project.title)}<span class="project-arrow" aria-hidden="true">↗</span></a></h2><p>${escape(project.description)}</p><div class="tags">${project.tags.map((tag) => `<span>${escape(tag)}</span>`).join('')}</div><span class="${real ? 'project-status' : 'concept-label'}">${escape(project.status)}</span><a class="text-link" href="${url}">${real ? 'Scopri il progetto' : 'Esplora il concept'} <span aria-hidden="true">↗</span></a></div>
          </article>`;
}

function renderTemplate(template, projects) {
  const values = {
    PROJECT_CARDS: projects.map(card).join('\n'),
    COUNT_ALL: projects.length,
    COUNT_LABEL: `${projects.length} ${projects.length === 1 ? 'progetto' : 'progetti'}`,
    CONTROLS_HIDDEN: projects.length ? '' : 'hidden',
    EMPTY_HIDDEN: projects.length ? 'hidden' : '',
    EMPTY_ACTION_HIDDEN: projects.length ? '' : 'hidden',
    EMPTY_TITLE: projects.length ? 'Nessun progetto trovato' : 'Nuovi progetti in arrivo.',
    EMPTY_TEXT: projects.length ? 'Prova un’altra parola chiave oppure rimuovi i filtri per vedere tutti i progetti.' : 'La raccolta è in aggiornamento. Torna presto per scoprire i prossimi lavori.',
  };
  for (const category of ['modellazione', 'stampa', 'prototipi']) values[`COUNT_${category.toUpperCase()}`] = projects.filter((project) => project.categories.includes(category)).length;
  return template.replace(/<!-- IF-PROJECT ([a-z0-9-]+) -->([\s\S]*?)<!-- ENDIF-PROJECT -->/g, (_, slug, content) => {
    const [visible, hidden = ''] = content.split('<!-- ELSE -->');
    return projects.some((project) => project.slug === slug) ? visible : hidden;
  }).replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`Segnaposto sconosciuto: ${key}`);
    return values[key];
  });
}

function navigation(project, projects) {
  const index = projects.findIndex((item) => item.slug === project.slug);
  const neighbors = projects.length <= 1 ? [] : [projects[(index - 1 + projects.length) % projects.length], ...(projects.length > 2 ? [projects[(index + 1) % projects.length]] : [])];
  if (!neighbors.length) return '';
  return `<nav class="container project-pagination" aria-label="Altri progetti">${neighbors.map((item, i) => `<a href="../${item.slug}/index.html"><span>${neighbors.length === 1 ? 'Altro progetto →' : i ? 'Progetto successivo →' : '← Progetto precedente'}</span><strong>${escape(item.title)}</strong></a>`).join('')}</nav>`;
}

async function publicCopy(source, target) {
  await cp(source, target, {
    recursive: true,
    filter: async (path) => {
      const parts = relative(source, path).split('/');
      if (parts.some((part) => part.startsWith('.')) || /\.(md|json)$/i.test(path)) return false;
      if ((await lstat(path)).isSymbolicLink()) throw new Error(`Collegamento simbolico non pubblicabile: ${path}`);
      return true;
    },
  });
}

// Preview and manual commands share this lock, including the folder rename.
export async function withSiteLock(root, action) {
  const lock = join(root, '.site-projects.lock');
  const started = Date.now();
  while (true) {
    try { await mkdir(lock); break; }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      try {
        const pid = Number(await readFile(join(lock, 'pid'), 'utf8'));
        if (Number.isInteger(pid) && pid > 0) {
          try { process.kill(pid, 0); }
          catch (check) { if (check.code === 'ESRCH') { await rm(lock, { recursive: true, force: true }); continue; } }
        } else {
          const info = await lstat(lock);
          if (Date.now() - info.mtimeMs > 30000) { await rm(lock, { recursive: true, force: true }); continue; }
        }
      } catch (check) {
        if (check.code === 'ENOENT') {
          const info = await lstat(lock).catch(() => null);
          if (info && Date.now() - info.mtimeMs > 30000) { await rm(lock, { recursive: true, force: true }); continue; }
        } else throw check;
      }
      if (Date.now() - started > 15000) throw new Error('Un altro aggiornamento è in corso. Riprova tra poco.');
      await delay(30);
    }
  }
  try {
    await writeFile(join(lock, 'pid'), String(process.pid));
    return await action();
  } finally { await rm(lock, { recursive: true, force: true }); }
}

export async function buildSite(root = siteRoot) {
  return withSiteLock(root, () => buildUnlocked(root));
}

async function buildUnlocked(root) {
  const { attivi: projects } = await inventory(root);
  const staging = await mkdtemp(join(root, '.site-build-'));
  const output = join(root, 'dist');
  const backup = join(staging, 'previous');
  const ready = join(staging, 'public');
  const generated = new Map();
  const changedRootFiles = [];
  let outputBackedUp = false;
  let outputInstalled = false;
  let committed = false;
  try {
    await mkdir(ready);
    for (const file of await readdir(root)) {
      if (/\.(html|css|js)$/.test(file)) await publicCopy(join(root, file), join(ready, file));
    }
    await publicCopy(join(root, 'img'), join(ready, 'img'));
    await mkdir(join(ready, 'progetti'));
    await publicCopy(join(root, 'progetti/progetti-dettaglio.css'), join(ready, 'progetti/progetti-dettaglio.css'));
    for (const project of projects) {
      await publicCopy(project.directory, join(ready, 'progetti', project.slug));
      const page = await readFile(join(project.directory, 'index.html'), 'utf8');
      await writeFile(join(ready, 'progetti', project.slug, 'index.html'), page.replace(/<!-- PROJECT-NAVIGATION -->/g, navigation(project, projects)));
    }
    for (const file of ['index.html', 'progetti.html', 'chi-sono.html']) {
      const template = await readFile(join(root, 'scripts/templates', file), 'utf8');
      const html = renderTemplate(template, projects);
      generated.set(file, html);
      await writeFile(join(ready, file), html);
    }
    // Prepare all content before replacing the last working public copy.
    await mkdir(join(staging, 'root-backup'));
    for (const [file, html] of generated) {
      const prepared = join(staging, file);
      await writeFile(prepared, html);
      const hadOriginal = await exists(join(root, file));
      if (hadOriginal) await rename(join(root, file), join(staging, 'root-backup', file));
      changedRootFiles.push({ file, hadOriginal });
      await rename(prepared, join(root, file));
    }
    if (await exists(output)) { await rename(output, backup); outputBackedUp = true; }
    await rename(ready, output);
    outputInstalled = true;
    committed = true;
    return projects;
  } catch (error) {
    if (outputInstalled) await rm(output, { recursive: true, force: true });
    if (outputBackedUp) await rename(backup, output);
    for (const { file, hadOriginal } of changedRootFiles.reverse()) {
      await rm(join(root, file), { force: true });
      if (hadOriginal) await rename(join(staging, 'root-backup', file), join(root, file));
    }
    throw error;
  } finally {
    try { await rm(staging, { recursive: true, force: true }); }
    catch (error) { if (committed) console.warn(`Sito aggiornato. Pulizia temporanei non completata: ${staging}`); else throw error; }
  }
}

export async function moveProject(root, slug, targetState) {
  return withSiteLock(root, () => moveUnlocked(root, slug, targetState));
}

async function moveUnlocked(root, slug, targetState) {
  if (!slugPattern.test(slug)) throw new Error('Usa il nome della cartella, per esempio vaso-onda.');
  if (!['attivi', 'nascosti'].includes(targetState)) throw new Error('Destinazione non valida.');
  const sourceState = targetState === 'attivi' ? 'nascosti' : 'attivi';
  const source = join(root, folders[sourceState], slug);
  const target = join(root, folders[targetState], slug);
  if (!await exists(source)) throw new Error(`Progetto non trovato tra i ${sourceState}: ${slug}.`);
  const sourceInfo = await lstat(source);
  if (!sourceInfo.isDirectory() || sourceInfo.isSymbolicLink()) throw new Error('Il progetto deve essere una cartella locale.');
  await mkdir(dirname(target), { recursive: true });
  if (await exists(target)) throw new Error(`La destinazione esiste già: ${target}.`);
  await rename(source, target);
  try { await buildUnlocked(root); }
  catch (error) {
    await rename(target, source);
    throw new Error(`Spostamento annullato; il progetto è rimasto tra i ${sourceState}. ${error.message}`);
  }
}
