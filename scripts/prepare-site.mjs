import { buildSite, siteRoot } from './projects.mjs';

try {
  const projects = await buildSite(siteRoot);
  console.log(`Sito aggiornato: ${projects.length} progetti attivi. La copia pubblica è in dist/.`);
} catch (error) {
  console.error(`Aggiornamento interrotto: ${error.message}`);
  process.exitCode = 1;
}
