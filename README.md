# Silve — Progettazione e stampa 3D

Portfolio statico in italiano dedicato a Silve, alla modellazione, alla prototipazione e alla stampa 3D. Non richiede dipendenze da installare. Node.js genera la raccolta dei progetti e la copia pubblica del sito.

## Anteprima locale

```sh
node scripts/serve-site.mjs
```

Oppure apri con doppio clic **Anteprima sito.command** e lascia aperta la sua finestra. Apri [http://127.0.0.1:4173](http://127.0.0.1:4173).

Con questa anteprima, spostare le cartelle nel Finder aggiorna automaticamente il sito e la pagina aperta, normalmente entro 1–2 secondi. Si aggiornano anche testi, immagini e metadati modificati. Ricerca e filtro restano nell’URL. Se nascondi il progetto attualmente aperto, il browser torna alla raccolta. Non avviare il vecchio server `python3 -m http.server`: serve soltanto file statici e non rileva gli spostamenti.

## Gestire progetti attivi e nascosti

Apri con doppio clic **Gestisci progetti.command**: scegli **1** per nascondere un progetto, **2** per riattivarlo o **3** per aggiornare manualmente quando l’anteprima dinamica è spenta. I progetti attivi sono in `progetti/`, quelli nascosti in `progetti-nascosti/`. Sposta sempre la cartella completa. Con l’anteprima dinamica accesa il browser si aggiorna da solo.

La raccolta, la ricerca, i contatori e i collegamenti mostrano solo i progetti attivi. Se nascondi ITACA, anche foto e riferimenti dedicati in “Chi sono” scompaiono; riattivandolo tornano. La copia `dist/` non contiene cartelle nascoste, metadati o strumenti di gestione. Per aggiornare una versione online occorre ripubblicare `dist/`.

Comandi equivalenti da terminale:

```sh
node scripts/progetti.mjs elenco
node scripts/progetti.mjs nascondi vaso-onda
node scripts/progetti.mjs attiva vaso-onda
node scripts/progetti.mjs aggiorna
```

## Struttura

- `scripts/templates/`: sorgenti della raccolta, di “Chi sono” e del reindirizzamento iniziale, con blocchi condizionati dalla presenza dei progetti. Modifica qui queste pagine: le copie HTML nella cartella principale e in `dist/` vengono rigenerate.
- `index.html`: reindirizzamento alla pagina Chi sono. Il sito ha tre sezioni: Progetti, Chi sono e Contatti.
- `progetti.html`: ricerca per parole chiave e filtri per modellazione, stampa 3D e prototipi.
- `chi-sono.html`: interessi, approccio ed esperienza documentata di Silve sul plastico ITACA presso WASP nel 2022.
- `contatti.html`: telefono, WhatsApp e modulo dimostrativi.
- `progetti/`: dieci progetti, ciascuno nella propria cartella: ITACA WASP e nove lavori importati da `PORTFOLIO 2026`. Vedi `progetti/README.md` per l’elenco e per aggiungere nuovi lavori.
- `progetti-nascosti/`: archivio locale escluso dalla copia pubblica; contiene i tre concept dimostrativi `vaso-onda`, `supporto-modulare` e `guscio-nodo` e ammette anche bozze incomplete.
- `progetti/*/progetto.json`: informazioni per generare ogni scheda nella raccolta.
- `scripts/serve-site.mjs` e `scripts/preview-client.js`: anteprima locale con aggiornamento automatico delle cartelle e del browser, supporto ai video ed esclusione dei file nascosti.
- `scripts/projects.mjs` e `scripts/progetti.mjs`: generazione, convalida e spostamento dei progetti con ripristino in caso di errore.
- `style.css` e `progetti/progetti-dettaglio.css`: stili responsive, palette panna e terracotta.
- `script.js`: menu mobile, ricerca, conteggi, filtri e preparazione dei messaggi email.
- `project-gallery.css` e `project-gallery.js`: impaginazione e galleria condivise dai nove nuovi progetti, con ingrandimento delle immagini e navigazione da tastiera.
- `progetti/itaca-wasp/itaca.js`: indice delle sezioni e galleria per ingrandire foto, modelli digitali e schemi con navigazione da tastiera.
- `scripts/prepare-site.mjs`: rigenera le pagine in base alle cartelle attive e prepara in `dist/` solo pagine e risorse pubbliche. Usa questa cartella per il server locale e l’hosting.
- `progetti/itaca-wasp/immagini/`: selezione ottimizzata delle foto, delle viste digitali e dei tre schemi di autosufficienza forniti dall’utente. I video delle lavorazioni sono in `progetti/itaca-wasp/video/`, con controlli nativi e caricamento su richiesta. `README.md` nella cartella ITACA documenta le fonti e la corrispondenza con gli originali.
- `progetti/*/immagini/`: nei nove nuovi progetti, 77 immagini selezionate e ottimizzate in WebP, ciascuna con un’anteprima più leggera. Ogni progetto ha un `README.md` con la corrispondenza fra i file del sito e gli originali e le istruzioni per modificare i testi. Gli originali restano invariati; video e RAW non sono inclusi in questa prima struttura.

Ogni progetto si conserva nella propria cartella completa, in `progetti/` o in `progetti-nascosti/`. Non modificare i file in `dist/`, perché vengono rigenerati.

## Ricerca

I collegamenti interni, le risorse e il redirect iniziale restano relativi alla pagina, anche quando JavaScript aggiunge i parametri di ricerca o apre la galleria. Non inserire domini o prefissi come `/prestino/` nei percorsi interni: il sito deve funzionare anche in un’altra sottocartella. Gli indirizzi di servizi e siti esterni restano completi.

La ricerca legge titolo, descrizione, tag e parole chiave delle schede generate dai file `progetto.json` dei soli progetti attivi. Ignora maiuscole e accenti e cerca tutte le parole inserite. I conteggi dei filtri si aggiornano con la ricerca. Il pulsante “Azzera ricerca e filtri” ripristina la raccolta. I parametri URL `q` e `categoria` conservano il contesto anche usando “Tutti i progetti” dalla pagina di un progetto.

## Contenuti da personalizzare

- **Nuovi progetti:** le nove pagine hanno una struttura completa di immagini e testi provvisori, contrassegnati da “Descrizione in aggiornamento”. Silve può correggere descrizioni, didascalie e contributo personale in `index.html`, poi aggiornare descrizione breve, tag, categorie e parole chiave in `progetto.json`. Ogni README dedicato indica i punti da modificare. Prima della versione definitiva vanno confermati tecniche e ruolo svolto; non sono stati aggiunti anni, clienti o scale non forniti.
- **ITACA WASP:** resta invariato e documenta il plastico realizzato da Silve durante il tirocinio in azienda a Imola nel 2022. L’architettura è attribuita a WASP. Non sono stati forniti rapporto di scala o modelli scaricabili.
- **Esempi dimostrativi:** Vaso Onda, Supporto Modulare e Guscio Nodo sono conservati in `progetti-nascosti/` e possono essere riattivati con gli strumenti di gestione.
- **Biografia:** aggiungere una descrizione personale, competenze e strumenti realmente utilizzati quando saranno forniti.
- **Telefono e WhatsApp:** le schede mostrano `+39 000 000 0000` e sono informative. Con il numero reale, convertirle in link `tel:` e `https://wa.me/` e rimuovere lo stato “Esempio” e il relativo avviso.
- **Email:** `esempio@email.com` è un segnaposto. Per attivare il modulo, impostare un indirizzo reale in `data-email` e aggiornare il recapito visibile e il testo per chi non usa JavaScript. Il codice abilita i campi, aggiorna il pulsante e prepara una bozza nel programma email dell’utente; non c’è un servizio di invio sul server. Senza JavaScript il modulo resta disabilitato.

I caratteri vengono caricati da Google Fonts, con alternativa di sistema. Il sito rispetta la preferenza di riduzione del movimento. Senza JavaScript, navigazione e progetti restano visibili.

## Controlli

`node --test scripts/projects.test.mjs scripts/preview.test.mjs` verifica spostamenti, ripristino, aggiornamento automatico, esclusione dei nascosti, aggiornamenti concorrenti e intervalli dei video su copie temporanee.
