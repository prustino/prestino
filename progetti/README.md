# Progetti attivi di Alessio Silvestrino

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

La raccolta contiene dieci progetti attivi. ITACA WASP resta invariato; otto delle nove pagine importate hanno descrizioni e dati di progetto confermati. Clove Lamp conserva ancora contenuti provvisori.

| Progetto | Cartella |
| --- | --- |
| ITACA WASP | `itaca-wasp/` |
| Bentley Outdoor Furniture | `bentley-outdoor-furniture/` |
| Clove Lamp | `clove-lamp/` |
| Dagusha VII / ADA IV | `dagusha-7-ada-4/` |
| Dental ZX | `dental-zx/` |
| Durres Towers | `durres-towers/` |
| GoYoke | `goyoke/` |
| M\|53 | `maiora-53/` |
| ISA Timeless 52 | `palumbo-isa-timeless/` |
| Colosseum 339 | `colosseum-339/` |

I nuovi progetti includono 77 immagini selezionate da `PORTFOLIO 2026`, convertite in WebP con anteprime più leggere. Il README di ogni cartella associa i file del sito agli originali. Video e RAW restano fuori da questa prima struttura; i file originali non sono stati modificati.

I tre esempi Vaso Onda, Supporto Modulare e Guscio Nodo sono conservati in `../progetti-nascosti/` e non compaiono nella raccolta attiva.

## Nascondere o riattivare

Apri **Gestisci progetti.command** nella cartella principale e scegli l’operazione e il numero del progetto. Lo spostamento e l’aggiornamento del sito avvengono insieme. Nessun progetto viene cancellato.

Puoi anche trascinare l’intera cartella tra `progetti/` e `progetti-nascosti/` nel Finder; con **Anteprima sito.command** aperto, sito e browser si aggiornano automaticamente. Se l’anteprima è spenta, scegli **3 — Aggiorna** nel comando di gestione. Sposta la cartella, senza duplicarla o rinominarla. Se lo stesso nome è presente in entrambe le cartelle, l’aggiornamento si ferma per evitare ambiguità.

L’anteprima dinamica ricarica la pagina conservando ricerca e filtri. Per una versione già online occorre pubblicare nuovamente `dist/`.

## Aggiungere un progetto

1. Prepara una cartella con nome breve, in minuscolo e senza spazi (esempio `portaoggetti/`), inizialmente in `progetti-nascosti/`.
2. Aggiungi la pagina `index.html` e tutti i suoi file. Puoi partire dalla struttura di un progetto esistente.
3. Copia e personalizza `progetto.json`: titolo, descrizione, `order` (ordine crescente), `kind` (`real` o `concept`), etichetta, stato, tag, parole chiave e anteprima. In `categories` indica l’ambito principale usando uno solo dei valori ammessi: `architettura`, `nautica` o `prodotto`.
4. I percorsi `image.src` e gli eventuali `image.srcset` sono relativi alla cartella del progetto. Aggiorna anche testo alternativo, larghezza e altezza.
5. Attiva il progetto dal comando di gestione. La scheda nella raccolta e la card scorrevole nel “Chi sono” vengono generate automaticamente, senza modificare i due HTML.

I nuovi progetti entrano sia nella raccolta sia nella vetrina del “Chi sono”. La pagina iniziale del sito reindirizza a Chi sono; il menu contiene Progetti, Chi sono e Contatti.

### Copertina della scheda (`image` in `progetto.json`)

Nella raccolta tutte le schede hanno lo stesso riquadro 4:3. Scegli come copertina una foto orizzontale del progetto e, dentro ogni categoria, usa la stessa inquadratura, così le schede restano coerenti tra loro:

- `architettura`: plastico intero visto dall’alto, di tre quarti;
- `prodotto`: oggetto intero di tre quarti;
- `nautica`: vedi le regole qui sotto.

Campi facoltativi per regolare il ritaglio senza modificare la foto:

- `position`: punto da tenere al centro del riquadro, per esempio `"50% 40%"` (orizzontale, verticale);
- `zoom`: ingrandimento attorno a `position`, tra `1` e `3`, per esempio `1.2`.

Le foto non si specchiano mai: l’orientamento deve essere quello reale dello scatto.

#### Regole per i progetti di nautica

1. **Prua verso destra, sempre:** la barca è rivolta da sinistra a destra, con la poppa a sinistra e la prua a destra.
2. **Vista laterale:** la copertina mostra la barca di profilo, il più possibile ortogonale al fianco. Evita le viste troppo dall’alto: i riferimenti sono le copertine di M|53 (`maiora-53`, foto 02) e di ISA Timeless 52 (`palumbo-isa-timeless`, foto 10), fotografate quasi all’altezza dello scafo.
3. **Se non c’è un profilo con la prua a destra:** usa una vista di tre quarti anteriore, sempre con la barca che guarda da sinistra verso destra.
4. **Se manca anche questa:** non specchiare e non scegliere una foto con la prua a sinistra. Segnala che serve una nuova foto con l’orientamento corretto, da aggiungere nella cartella `immagini/` del progetto.
5. **Barca grande nel riquadro:** la barca deve occupare quasi tutta la larghezza del riquadro, con un piccolo margine ai lati e senza toccare i bordi. Se c’è troppo spazio intorno, ingrandisci con `zoom` (di solito tra `1.1` e `1.25`) e centra la barca con `position`.
6. **Formato:** usa una foto orizzontale 4:3, come quelle già presenti, così il riquadro si riempie senza tagliare prua o poppa.

**Copertine da sostituire:** Dagusha VII (`dagusha-7-ada-4`) usa provvisoriamente il profilo della foto 02, che ha la prua a sinistra. Tra le foto attuali non c’è né un profilo né un tre quarti anteriore con la prua a destra; la foto 06 ha l’orientamento giusto ma mostra il modello ancora in montaggio. Serve una nuova foto.

Esempio (M|53):

```json
"image": {
  "src": "immagini/02-720.webp",
  "alt": "Vista laterale del modello Maiora 53 dal lato opposto",
  "width": 720,
  "height": 540,
  "srcset": [
    { "src": "immagini/02-720.webp", "width": 720 },
    { "src": "immagini/02.webp", "width": 1600 }
  ],
  "position": "49% 52%",
  "zoom": 1.22
}
```

### Categorie, tag e parole chiave

Le categorie alimentano i tre filtri principali della raccolta e identificano l’ambito del progetto:

- `architettura`: plastici e modelli architettonici;
- `nautica`: yacht e modellismo navale;
- `prodotto`: arredo, illuminazione, dispositivi e altri progetti di prodotto.

I tag visibili devono essere brevi, coerenti e scritti in italiano. Usali per specificare la tipologia o la tecnica, per esempio `Plastico`, `Modellismo navale`, `Prototipazione` o `Stampa 3D FDM`; non ripetere nei tag il titolo del progetto. Il campo `keywords` può invece includere nomi propri, sinonimi, materiali, software, luoghi e varianti utili alla ricerca anche quando non devono apparire sulla scheda.

## Modificare le pagine

- Modifica la pagina dedicata direttamente in `progetti/nome-progetto/index.html` (o nella sua posizione nascosta).
- Modifica i dati della scheda in `progetto.json`.
- Lascia `<!-- PROJECT-NAVIGATION -->` nel punto in cui vuoi i link agli altri progetti: il sito genera collegamenti ai soli lavori attivi, senza collegare un progetto a se stesso.
- Le risorse generali usano `../../style.css`, `../../script.js` e `../../contatti.html`. Il foglio di stile condiviso usa `../../progetti/progetti-dettaglio.css`: il percorso resta valido anche spostando la cartella.
- Le nove nuove pagine usano anche `../../project-gallery.css` e `../../project-gallery.js` per il template case study, l’indice sticky, l’ingrandimento delle immagini e la navigazione da tastiera. Mantieni relativi tutti i collegamenti interni, senza domini o prefissi come `/prestino/`.
- Ogni fase del processo (`ol.portfolio-steps`) si apre con una foto in un riquadro quadrato: `<figure class="portfolio-step-media"><a href="immagini/04.webp" data-gallery="processo"><img src="immagini/04-720.webp" …></a></figure>`. Finché la foto manca resta il segnaposto `portfolio-step-missing` con la scritta IMMAGINE DA AGGIUNGERE.
- Foto, video e modelli usano percorsi interni al progetto, per esempio `immagini/dettaglio.webp` o `materiali/modello.stl`.
- L’anteprima dinamica rileva le modifiche. Se è spenta, scegli **3 — Aggiorna** o esegui `node scripts/prepare-site.mjs`.

### Completare i contenuti mancanti

Le informazioni non ancora confermate sono scritte esattamente come `DA AGGIUNGERE` e usano la classe `portfolio-placeholder`. Sostituisci il segnaposto in `index.html` solo quando il testo o il dato è disponibile; se cambia anche il riepilogo mostrato nella raccolta, aggiorna `progetto.json` e rigenera il sito.

I segnaposto principali riguardano Clove Lamp, la scala di Colosseum 339 e alcune descrizioni delle fasi di processo. Anni, clienti, scale, tecniche e ruoli vanno aggiunti solo quando confermati.

ITACA WASP documenta il plastico realizzato a Imola nel 2022; le sue fonti e le istruzioni dedicate restano nel suo README.
