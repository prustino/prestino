import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, writeFile, rename, rm, mkdir, readdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildSite, inventory, moveProject, siteRoot } from './projects.mjs';

const exists = async (path) => access(path).then(() => true, () => false);
const read = (root, path) => readFile(join(root, path), 'utf8');
async function htmlFiles(root) {
  return (await readdir(join(root, 'dist'), { recursive: true })).filter((file) => file.endsWith('.html'));
}
async function assertAbsent(root, slug) {
  assert.equal(await exists(join(root, 'dist/progetti', slug)), false);
  assert.equal(await exists(join(root, 'dist/progetti-nascosti')), false);
  for (const file of await htmlFiles(root)) assert.ok(!(await read(root, `dist/${file}`)).includes(`${slug}/`), `${file} references ${slug}`);
}

test('moving complete projects keeps content and public visibility consistent', async () => {
  const root = await mkdtemp(join(tmpdir(), 'silve-projects-test-'));
  try {
    for (const name of ['index.html', 'progetti.html', 'chi-sono.html', 'contatti.html', 'style.css', 'script.js', 'img', 'progetti/progetti-dettaglio.css', 'scripts/templates']) {
      await cp(join(siteRoot, name), join(root, name), { recursive: true });
    }
    for (const slug of ['itaca-wasp', 'vaso-onda', 'supporto-modulare', 'guscio-nodo']) {
      const state = await exists(join(siteRoot, 'progetti', slug)) ? 'progetti' : 'progetti-nascosti';
      await cp(join(siteRoot, state, slug), join(root, 'progetti', slug), { recursive: true });
    }
    await mkdir(join(root, 'progetti-nascosti/bozza-incompleta'), { recursive: true });
    await buildSite(root);
    const initialEntry = await read(root, 'dist/index.html');
    const initialItaca = await read(root, 'progetti/itaca-wasp/index.html');
    assert.equal((await inventory(root)).attivi.length, 4);
    assert.equal(await exists(join(root, 'dist/progetti/itaca-wasp/progetto.json')), false);

    await moveProject(root, 'vaso-onda', 'nascosti');
    await assertAbsent(root, 'vaso-onda');
    assert.equal((await inventory(root)).attivi.length, 3);
    await moveProject(root, 'vaso-onda', 'attivi');
    assert.match(await read(root, 'dist/progetti.html'), /id="vaso-onda"/);

    await moveProject(root, 'itaca-wasp', 'nascosti');
    await assertAbsent(root, 'itaca-wasp');
    for (const page of ['index.html', 'chi-sono.html', 'progetti.html']) assert.doesNotMatch(await read(root, `dist/${page}`), /ITACA/i);
    for (const slug of ['vaso-onda', 'supporto-modulare', 'guscio-nodo']) await moveProject(root, slug, 'nascosti');
    assert.match(await read(root, 'dist/progetti.html'), /Nuovi progetti in arrivo/);
    assert.doesNotMatch(await read(root, 'dist/progetti.html'), /data-project\s/);

    await moveProject(root, 'vaso-onda', 'attivi');
    assert.doesNotMatch(await read(root, 'dist/progetti/vaso-onda/index.html'), /class="container project-pagination"/);
    await moveProject(root, 'supporto-modulare', 'attivi');
    const two = await read(root, 'dist/progetti/vaso-onda/index.html');
    assert.equal((two.match(/href="\.\.\/supporto-modulare\/index.html"/g) || []).length, 1);

    const publicBeforeFailure = await read(root, 'dist/progetti.html');
    await assert.rejects(moveProject(root, 'bozza-incompleta', 'attivi'), /Spostamento annullato/);
    assert.equal(await exists(join(root, 'progetti-nascosti/bozza-incompleta')), true);
    assert.equal(await read(root, 'dist/progetti.html'), publicBeforeFailure);

    await rename(join(root, 'scripts/templates/index.html'), join(root, 'scripts/templates/index.saved'));
    await assert.rejects(moveProject(root, 'vaso-onda', 'nascosti'), /Spostamento annullato/);
    assert.equal(await exists(join(root, 'progetti/vaso-onda')), true);
    assert.equal(await read(root, 'dist/progetti.html'), publicBeforeFailure);
    await rename(join(root, 'scripts/templates/index.saved'), join(root, 'scripts/templates/index.html'));

    const metadata = await read(root, 'progetti/vaso-onda/progetto.json');
    await writeFile(join(root, 'progetti/vaso-onda/progetto.json'), '{broken');
    await moveProject(root, 'vaso-onda', 'nascosti');
    await writeFile(join(root, 'progetti-nascosti/vaso-onda/progetto.json'), metadata);
    await moveProject(root, 'vaso-onda', 'attivi');

    await cp(join(root, 'progetti/vaso-onda'), join(root, 'progetti-nascosti/vaso-onda'), { recursive: true });
    await assert.rejects(buildSite(root), /entrambe le cartelle/);
    await assert.rejects(moveProject(root, 'vaso-onda', 'nascosti'), /destinazione esiste/);
    await rm(join(root, 'progetti-nascosti/vaso-onda'), { recursive: true });
    await assert.rejects(moveProject(root, '../itaca-wasp', 'attivi'), /nome della cartella/);

    // A Finder-style move is picked up by the same build command.
    await rename(join(root, 'progetti-nascosti/itaca-wasp'), join(root, 'progetti/itaca-wasp'));
    await moveProject(root, 'guscio-nodo', 'attivi');
    assert.equal(await read(root, 'dist/index.html'), initialEntry);
    assert.equal(await read(root, 'progetti/itaca-wasp/index.html'), initialItaca);
    const output = await readdir(join(root, 'dist'), { recursive: true });
    assert.ok(output.every((path) => !path.includes('nascosti') && !path.endsWith('progetto.json')));
    console.log('Verified: hide/restore, ITACA fallbacks, zero/one/two projects, manual moves, incomplete drafts, collisions and rollback.');
  } finally { await rm(root, { recursive: true, force: true }); }
});
