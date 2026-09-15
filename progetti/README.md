# Progetti di Silve

Questa cartella raccoglie le pagine e i file dei singoli progetti.

```text
progetti/
├── progetti-dettaglio.css
├── vaso-onda/
│   ├── index.html
│   └── anteprima.svg
├── supporto-modulare/
│   ├── index.html
│   └── anteprima.svg
└── guscio-nodo/
    ├── index.html
    └── anteprima.svg
```

## Dove mettere i file

Dentro la cartella del progetto puoi aggiungere immagini e, quando servono, una sottocartella `materiali/` per modelli STL, 3MF e STEP o schede PDF. Collega i file dalla pagina del progetto con percorsi relativi, per esempio `materiali/modello.stl` o `immagini/dettaglio.jpg`.

I concept attuali contengono un’illustrazione; modelli 3D e schede non sono ancora disponibili. Aggiorna testi e stato della pagina quando aggiungi materiali reali.

## Aggiungere un progetto

1. Duplica la struttura di uno dei progetti in una nuova cartella, con un nome breve senza spazi, per esempio `portaoggetti/`.
2. Personalizza `index.html` e sostituisci l’anteprima. Aggiorna titolo, descrizione, immagini, stato del progetto e collegamenti agli altri progetti.
3. Aggiungi una scheda nella raccolta `progetti.html`, nella cartella principale del sito, con il link `progetti/portaoggetti/`. Imposta anche categorie e parole chiave per filtri e ricerca.
4. Se desideri mostrarlo anche in homepage, aggiungi la relativa scheda nell’`index.html` principale.

Dalle pagine dei singoli progetti, le risorse comuni si raggiungono con `../../`: per esempio `../../style.css`, `../../script.js` e `../../contatti.html`. Il CSS dedicato ai progetti si trova invece in `../progetti-dettaglio.css`.

**Aggiungere file o cartelle non li rende automaticamente visibili nella raccolta progetti:** occorre aggiornare le pagine HTML e i relativi collegamenti.
