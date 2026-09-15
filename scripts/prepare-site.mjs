import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Create a public-only copy; the editable pages stay in their existing folders.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of await readdir(root)) {
  if (/\.(html|css|js)$/.test(file)) await cp(resolve(root, file), resolve(output, file));
}
for (const directory of ['img', 'progetti']) {
  await cp(resolve(root, directory), resolve(output, directory), {
    recursive: true,
    filter: (source) => !source.endsWith('.md') && !source.split('/').some((part) => part.startsWith('.')),
  });
}
console.log('Sito pronto: 7 pagine e relative risorse in dist/.');
