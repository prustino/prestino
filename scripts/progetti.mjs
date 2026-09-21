import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { buildSite, inventory, moveProject, siteRoot } from './projects.mjs';

async function list() {
  const projects = await inventory(siteRoot, false);
  for (const state of ['attivi', 'nascosti']) {
    console.log(`\nProgetti ${state} (${projects[state].length}):`);
    for (const project of projects[state]) console.log(`  ${project.slug} — ${project.title}`);
    if (!projects[state].length) console.log('  Nessuno');
  }
  return projects;
}

async function run(action, slug) {
  if (action === 'elenco') return list();
  if (action === 'aggiorna') {
    const projects = await buildSite();
    console.log(`Sito aggiornato: ${projects.length} progetti attivi. L’anteprima dinamica si aggiorna da sola.`);
    return;
  }
  if (action === 'nascondi' || action === 'attiva') {
    if (!slug) throw new Error('Specifica il nome della cartella del progetto.');
    await moveProject(siteRoot, slug, action === 'attiva' ? 'attivi' : 'nascosti');
    console.log(`${slug}: ${action === 'attiva' ? 'attivato' : 'nascosto'}. Sito aggiornato; l’anteprima dinamica si aggiorna da sola.`);
    return;
  }
  throw new Error('Uso: node scripts/progetti.mjs elenco | aggiorna | nascondi NOME | attiva NOME');
}

async function menu() {
  const reader = createInterface({ input: stdin, output: stdout });
  try {
    while (true) {
      const projects = await list();
      const choice = (await reader.question('\n1 Nascondi un progetto\n2 Attiva un progetto\n3 Aggiorna manualmente il sito\n0 Esci\nScelta: ')).trim();
      if (choice === '0') break;
      try {
        if (choice === '3') { await run('aggiorna'); continue; }
        if (!['1', '2'].includes(choice)) { console.log('Scegli 0, 1, 2 o 3.'); continue; }
        const candidates = projects[choice === '1' ? 'attivi' : 'nascosti'];
        if (!candidates.length) { console.log('Nessun progetto da spostare.'); continue; }
        candidates.forEach((project, index) => console.log(`${index + 1} ${project.title} (${project.slug})`));
        const selected = (await reader.question('Numero del progetto (Invio per annullare): ')).trim();
        if (!selected) continue;
        const project = /^\d+$/.test(selected) ? candidates[Number(selected) - 1] : undefined;
        if (!project) throw new Error('Numero non valido.');
        await run(choice === '1' ? 'nascondi' : 'attiva', project.slug);
      } catch (error) { console.error(`Errore: ${error.message}`); }
    }
  } finally { reader.close(); }
}

try {
  if (process.argv[2] === 'menu') await menu();
  else await run(process.argv[2] || 'elenco', process.argv[3]);
} catch (error) { console.error(error.message); process.exitCode = 1; }
