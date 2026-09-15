# Silve — Progettazione e stampa 3D

Portfolio statico in italiano dedicato a Silve, alla modellazione, alla prototipazione e alla stampa 3D. Non richiede compilazione o dipendenze da installare.

## Anteprima locale

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Aprire [http://127.0.0.1:4173](http://127.0.0.1:4173).

## Struttura

- `index.html`: presentazione, concept e percorso dall’idea all’oggetto.
- `progetti.html`: ricerca per parole chiave e filtri per modellazione, stampa 3D e prototipi.
- `chi-sono.html`: interessi e approccio di Silve, senza qualifiche o esperienze non fornite.
- `contatti.html`: telefono, WhatsApp e modulo dimostrativi.
- `progetti/`: tutti i concept, ciascuno nella propria cartella (`vaso-onda`, `supporto-modulare`, `guscio-nodo`) con pagina `index.html` e immagine `anteprima.svg`. Vedi `progetti/README.md` per aggiungere nuovi lavori.
- `style.css` e `progetti/progetti-dettaglio.css`: stili responsive, palette panna e terracotta.
- `script.js`: menu mobile, ricerca, conteggi, filtri e preparazione dei messaggi email.
- `scripts/prepare-site.mjs`: prepara in `dist/` una copia delle sole pagine e risorse pubbliche, per l’hosting; le modifiche si fanno nelle cartelle originali.
- `img/hero-forma.svg`: illustrazione della homepage. Le anteprime dei singoli concept sono nelle rispettive cartelle sotto `progetti/`.

Ogni progetto si trova nella propria cartella sotto `progetti/`. Le pagine duplicate, i documenti del precedente portfolio e le immagini non utilizzate sono stati rimossi.

## Ricerca

La ricerca legge titolo, descrizione, tag e `data-keywords` delle schede di `progetti.html`. Ignora maiuscole e accenti e cerca tutte le parole inserite. I conteggi dei filtri si aggiornano con la ricerca. Il pulsante “Azzera ricerca e filtri” ripristina la raccolta. I parametri URL `q` e `categoria` conservano il contesto anche usando “Tutti i progetti” dalla pagina di un concept.

## Contenuti da personalizzare

- **Progetti reali:** le tre schede attuali e le immagini sono concept dimostrativi, non lavori attribuiti a Silve. Sostituire immagini, testi, tag e parole chiave con i suoi lavori. Non sono presenti modelli STL, quote validate o risultati di stampa.
- **Biografia:** aggiungere una descrizione personale, competenze e strumenti realmente utilizzati quando saranno forniti.
- **Telefono e WhatsApp:** le schede mostrano `+39 000 000 0000` e sono informative. Con il numero reale, convertirle in link `tel:` e `https://wa.me/` e rimuovere lo stato “Esempio” e il relativo avviso.
- **Email:** `esempio@email.com` è un segnaposto. Per attivare il modulo, impostare un indirizzo reale in `data-email` e aggiornare il recapito visibile e il testo per chi non usa JavaScript. Il codice abilita i campi, aggiorna il pulsante e prepara una bozza nel programma email dell’utente; non c’è un servizio di invio sul server. Senza JavaScript il modulo resta disabilitato.

I caratteri vengono caricati da Google Fonts, con alternativa di sistema. Il sito rispetta la preferenza di riduzione del movimento. Senza JavaScript, navigazione e progetti restano visibili.
