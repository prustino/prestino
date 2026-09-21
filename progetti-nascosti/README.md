# Progetti nascosti

Metti qui le **cartelle complete** dei lavori che vuoi conservare senza mostrarli nel sito. Puoi tenere anche progetti ancora incompleti.

## Spostare un progetto

Apri con doppio clic **Gestisci progetti.command**, nella cartella principale del sito:

- **1 — Nascondi:** sposta un progetto da `progetti/` a questa cartella.
- **2 — Attiva:** sposta un progetto da questa cartella a `progetti/`.
- **3 — Aggiorna:** aggiorna manualmente il sito quando l’anteprima dinamica è spenta.

La gestione aggiorna schede, ricerca, contatori, collegamenti tra progetti e riferimenti a ITACA in “Chi sono”. Con **Anteprima sito.command** aperto, gli spostamenti nel Finder e le operazioni di gestione aggiornano automaticamente sito e browser, senza usare “Aggiorna”.

Per attivare un progetto servono `index.html`, `progetto.json` e le immagini indicate nella scheda. Se manca qualcosa, l’attivazione viene annullata e la cartella resta qui. Non vengono sovrascritti progetti con lo stesso nome.

Questa cartella non viene copiata in `dist/`, la cartella da usare per anteprima e pubblicazione. I file restano sul computer: “nascosto” non significa cifrato o protetto da password. Non servire o pubblicare l’intera cartella di lavoro.
