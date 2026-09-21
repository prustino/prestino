import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rename, rm, mkdir, access, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';
import { startPreview } from './serve-site.mjs';
import { buildSite, moveProject, siteRoot } from './projects.mjs';

const exists = (path) => access(path).then(() => true, () => false);

test('preview follows manual folder moves, reloads clients and serves only current public files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'silve-preview-test-'));
  let preview;
  try {
    for (const name of ['index.html', 'progetti.html', 'chi-sono.html', 'contatti.html', 'style.css', 'script.js', 'img', 'progetti', 'scripts/templates']) await cp(join(siteRoot, name), join(root, name), { recursive: true });
    for (const slug of ['itaca-wasp', 'vaso-onda', 'supporto-modulare', 'guscio-nodo']) {
      if (!await exists(join(root, 'progetti', slug))) await cp(join(siteRoot, 'progetti-nascosti', slug), join(root, 'progetti', slug), { recursive: true });
    }
    await mkdir(join(root, 'progetti-nascosti/bozza'), { recursive: true });
    let updates = 0;
    preview = await startPreview({ root, port: 0, pollMs: 60, onUpdate: () => updates++ });
    const request = (path, options) => fetch(preview.url + path, options);
    const status = () => request('/__preview/status').then((response) => response.json());
    const initial = await status();
    assert.equal(initial.projects.length, 4);
    for (const path of ['/', '/index.html']) {
      const entry = await request(`${path}?q=stampa&categoria=modellazione`, { redirect: 'manual' });
      assert.equal(entry.status, 302);
      assert.equal(entry.headers.get('location'), '/progetti.html?q=stampa&categoria=modellazione');
    }
    const initialPage = await request('/progetti.html');
    assert.equal(initialPage.headers.get('cache-control'), 'no-store');
    assert.match(await initialPage.text(), /data-revision="[a-f0-9]+"/);
    await delay(220);
    assert.equal(updates, 1, 'Generated files must not cause rebuild loops');

    await rename(join(root, 'progetti/supporto-modulare'), join(root, 'progetti-nascosti/supporto-modulare'));
    // No HTTP request or manual build: the background scanner must update the output.
    for (let attempt = 0; attempt < 50; attempt++) {
      if (!(await readFile(join(root, 'dist/progetti.html'), 'utf8')).includes('id="supporto-modulare"')) break;
      await delay(40);
    }
    assert.doesNotMatch(await readFile(join(root, 'dist/progetti.html'), 'utf8'), /id="supporto-modulare"/);
    const hidden = await status();
    assert.equal(hidden.projects.length, 3);
    assert.notEqual(hidden.revision, initial.revision);
    assert.equal((await request('/progetti/supporto-modulare/anteprima.svg')).status, 404);
    assert.equal((await request('/progetti-nascosti/supporto-modulare/index.html')).status, 404);
    assert.equal((await request('/scripts/projects.mjs')).status, 404);
    const removedDetail = await request('/progetti/supporto-modulare/index.html?q=stampa', { redirect: 'manual' });
    assert.equal(removedDetail.status, 302);
    assert.equal(removedDetail.headers.get('location'), '/progetti.html?q=stampa');

    await rename(join(root, 'progetti-nascosti/supporto-modulare'), join(root, 'progetti/supporto-modulare'));
    assert.match(await (await request('/progetti.html')).text(), /id="supporto-modulare"/);
    assert.equal((await request('/progetti/supporto-modulare/anteprima.svg')).status, 200);
    await rename(join(root, 'progetti/itaca-wasp'), join(root, 'progetti-nascosti/itaca-wasp'));
    assert.doesNotMatch(await (await request('/progetti.html')).text(), /ITACA/);
    await rename(join(root, 'progetti-nascosti/itaca-wasp'), join(root, 'progetti/itaca-wasp'));
    assert.match(await (await request('/progetti.html')).text(), /ITACA/);

    const metadataPath = join(root, 'progetti/vaso-onda/progetto.json');
    const metadata = await readFile(metadataPath, 'utf8');
    await writeFile(metadataPath, '{invalid');
    assert.equal((await request('/progetti.html')).status, 503);
    assert.match((await status()).error, /vaso-onda/);
    await writeFile(metadataPath, metadata);
    assert.equal((await request('/progetti.html')).status, 200);
    assert.equal((await status()).error, '');

    const healthyRevision = (await status()).revision;
    await mkdir(join(root, 'progetti/bozza-incompleta'));
    const errorPage = await request('/progetti.html');
    assert.equal(errorPage.status, 503);
    assert.match(await errorPage.text(), /data-revision=""/);
    await rm(join(root, 'progetti/bozza-incompleta'), { recursive: true });
    assert.equal((await status()).revision, healthyRevision, 'Recovery to the same source must still reload an error page');

    await Promise.all([buildSite(root), buildSite(root), request('/progetti.html')]);
    await Promise.all([moveProject(root, 'vaso-onda', 'nascosti'), request('/progetti.html')]);
    assert.ok(!(await status()).projects.includes('vaso-onda'));
    await moveProject(root, 'vaso-onda', 'attivi');
    const videos = await readdir(join(root, 'progetti/itaca-wasp/video'));
    const video = '/progetti/itaca-wasp/video/' + videos.find((file) => file.endsWith('.mp4'));
    const head = await request(video, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(head.headers.get('accept-ranges'), 'bytes');
    const range = await request(video, { headers: { Range: 'bytes=0-99' } });
    assert.equal(range.status, 206);
    assert.match(range.headers.get('content-range'), /^bytes 0-99\//);
    assert.equal((await range.arrayBuffer()).byteLength, 100);
    assert.equal((await request(video, { headers: { Range: 'bytes=9999999999-' } })).status, 416);
    assert.equal((await request('/progetti/itaca-wasp/progetto.json')).status, 404);
    console.log('Verified automatic rebuild, recovery, hidden routes, redirect, caching, concurrent commands and video ranges.');
  } finally {
    if (preview) await preview.close();
    await rm(root, { recursive: true, force: true });
  }
});
