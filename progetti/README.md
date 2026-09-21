# Progetti attivi di Silve

Ogni sottocartella è un progetto visibile nel sito. I progetti nascosti sono nella cartella parallela `../progetti-nascosti/`.

```text
progetti/                      ← progetti attivi
├── progetti-dettaglio.css      ← stile condiviso, resta qui
└── nome-progetto/
    ├── index.html             ← pagina dedicata
    ├── progetto.json          ← scheda, ordine, ricerca e anteprima
    ├── README.md              ← istruzioni e corrispondenza con gli originali
    ├── immagini/              ← foto e immagini, se necessarie
    └── video/                 ← video, se necessari
progetti-nascosti/              ← cartelle complete dei lavori nascosti
```

## Progetti presenti

La raccolta contiene dieci progetti attivi. ITACA WASP resta invariato; gli altri nove hanno pagine dedicate con gallerie e testi provvisori che Silve può correggere.

| Progetto | Cartella |
| --- | --- |
| ITACA WASP | `itaca-wasp/` |
| Bentley Outdoor Furniture | `bentley-outdoor-furniture/` |
| Clove Lamp | `clove-lamp/` |
| Dagusha 7 / ADA 4 | `dagusha-7-ada-4/` |
| Dental ZX | `dental-zx/` |
| Durres Towers | `durres-towers/` |
| GoYoke | `goyoke/` |
| Maiora 53 | `maiora-53/` |
| Palumbo ISA Timeless | `palumbo-isa-timeless/` |
| colosseum 339 | `colosseum-339/` |

I nuovi progetti includono 77 immagini selezionate da `PORTFOLIO 2026`, convertite in WebP con anteprime più leggere. Il README di ogni cartella associa i file del sito agli originali. Video e RAW restano fuori da questa prima struttura; i file originali non sono stati modificati.

I tre esempi Vaso Onda, Supporto Modulare e Guscio Nodo sono conservati in `../progetti-nascosti/` e non compaiono nella raccolta attiva.

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
- Le nove nuove pagine usano anche `../../project-gallery.css` e `../../project-gallery.js` per impaginazione, ingrandimento delle immagini e navigazione da tastiera. Mantieni relativi tutti i collegamenti interni, senza domini o prefissi come `/prestino/`.
- Foto, video e modelli usano percorsi interni al progetto, per esempio `immagini/dettaglio.webp` o `materiali/modello.stl`.
- L’anteprima dinamica rileva le modifiche. Se è spenta, scegli **3 — Aggiorna** o esegui `node scripts/prepare-site.mjs`.

### Completare i testi provvisori

Nelle nuove pagine il commento `TESTO PROVVISORIO` individua la descrizione iniziale. Modifica il testo in `index.html`, la `meta description` e le didascalie `figcaption`; aggiorna poi i dati della scheda in `progetto.json`. Per approfondire il progetto puoi aggiungere, prima della galleria, obiettivo, contributo di Silve, strumenti e fasi di lavoro.

Quando Silve ha confermato i contenuti, rimuovi il paragrafo con classe `portfolio-draft` e sostituisci lo stato “Descrizione in aggiornamento” in `progetto.json`. Il README di ogni progetto contiene istruzioni specifiche. Anni, clienti, scale, tecniche e ruoli vanno aggiunti solo quando confermati.

ITACA WASP documenta il plastico realizzato a Imola nel 2022; le sue fonti e le istruzioni dedicate restano nel suo README.
