# Progetti attivi di Silve

Ogni sottocartella è un progetto visibile nel sito. I progetti nascosti sono nella cartella parallela `../progetti-nascosti/`.

```text
progetti/                      ← progetti attivi
├── progetti-dettaglio.css      ← stile condiviso, resta qui
└── nome-progetto/
    ├── index.html             ← pagina dedicata
    ├── progetto.json          ← scheda, ordine, ricerca e anteprima
    ├── immagini/              ← foto e immagini, se necessarie
    └── video/                 ← video, se necessari
progetti-nascosti/              ← cartelle complete dei lavori nascosti
```

## Nascondere o riattivare

Apri **Gestisci progetti.command** nella cartella principale e scegli l’operazione e il numero del progetto. Lo spostamento e l’aggiornamento del sito avvengono insieme. Nessun progetto viene cancellato.

Puoi anche trascinare l’intera cartella tra `progetti/` e `progetti-nascosti/` nel Finder; con **Anteprima sito.command** aperto, sito e browser si aggiornano automaticamente. Se l’anteprima è spenta, scegli **3 — Aggiorna** nel comando di gestione. Sposta la cartella, senza duplicarla o rinominarla. Se lo stesso nome è presente in entrambe le cartelle, l’aggiornamento si ferma per evitare ambiguità.

L’anteprima dinamica ricarica la pagina conservando ricerca e filtri. Per una versione già online occorre pubblicare nuovamente `dist/`.

## Aggiungere un progetto

1. Prepara una cartella con nome breve, in minuscolo e senza spazi (esempio `portaoggetti/`), inizialmente in `progetti-nascosti/`.
2. Aggiungi la pagina `index.html` e tutti i suoi file. Puoi partire dalla struttura di un progetto esistente.
3. Copia e personalizza `progetto.json`: titolo, descrizione, `order` (ordine crescente), `kind` (`real` o `concept`), etichetta, stato, tag, parole chiave e anteprima. Le categorie ammesse sono `modellazione`, `stampa`, `prototipi`; se ne possono indicare più di una.
4. I percorsi `image.src` e gli eventuali `image.srcset` sono relativi alla cartella del progetto. Aggiorna anche testo alternativo, larghezza e altezza.
5. Attiva il progetto dal comando di gestione. La scheda nella raccolta viene generata automaticamente, senza modificare `progetti.html`.

I nuovi progetti entrano nella raccolta. La pagina iniziale del sito reindirizza a Chi sono; il menu contiene Progetti, Chi sono e Contatti.

## Modificare le pagine

- Modifica la pagina dedicata direttamente in `progetti/nome-progetto/index.html` (o nella sua posizione nascosta).
- Modifica i dati della scheda in `progetto.json`.
- Lascia `<!-- PROJECT-NAVIGATION -->` nel punto in cui vuoi i link agli altri progetti: il sito genera collegamenti ai soli lavori attivi, senza collegare un progetto a se stesso.
- Le risorse generali usano `../../style.css`, `../../script.js` e `../../contatti.html`. Il foglio di stile condiviso usa `../../progetti/progetti-dettaglio.css`: il percorso resta valido anche spostando la cartella.
- Foto, video e modelli usano percorsi interni al progetto, per esempio `immagini/dettaglio.webp` o `materiali/modello.stl`.
- L’anteprima dinamica rileva le modifiche. Se è spenta, scegli **3 — Aggiorna** o esegui `node scripts/prepare-site.mjs`.

ITACA WASP documenta il plastico realizzato a Imola nel 2022; le sue fonti sono nel README dedicato. Gli altri tre lavori sono concept dimostrativi.
