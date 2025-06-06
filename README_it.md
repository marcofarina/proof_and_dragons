[Read the documentation in English](README.md)

<picture>
  <source srcset="/docs/static/logo_white.svg" media="(prefers-color-scheme: dark)">
  <source srcset="/docs/static/logo_black.svg" media="(prefers-color-scheme: light)">
  <img src="/docs/static/logo_white.svg" alt="Logo">
</picture>

**Proof & Dragons** è un'applicazione web interattiva progettata come companion app dell'omonimo gioco didattico. Attraverso diverse metafore ludiche, gli utenti possono sperimentare in modo semplificato come i miner competono per aggiungere blocchi a una blockchain.

## Contesto didattico

Questo progetto è stato sviluppato come risorsa educativa per studenti di scuole secondarie di secondo grado (età 15-18 anni) per illustrare:

* i principi base del Proof-of-Work;
* come la difficoltà di mining e il nonce influenzano la creazione di un blocco;
* la struttura di una catena di blocchi (il Timewall);
* il concetto di "mempool" e la selezione delle transazioni (in modo semplificato).

L'obiettivo è fornire una comprensione pratica e interattiva di concetti che possono apparire astratti, stimolando la curiosità verso Bitcoin.

Per i docenti è disponibile un [manuale del gioco](https://rainbowbits.cloud/proof_and_dragons/manuale.html) che spiega come utilizzare l'applicazione e integrare il gioco nella didattica.

<div align="center">
  <a href="https://rainbowbits.cloud/proof_and_dragons/manuale.html" target="_blank" style="
    display: inline-block;
    padding: 12px 24px;
    font-size: 16px;
    font-weight: bold;
    color: white;
    background-color: #4F46E5;
    border-radius: 8px;
    text-decoration: none;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: background-color 0.3s ease;
  " onmouseover="this.style.backgroundColor='#3730A3'" onmouseout="this.style.backgroundColor='#4F46E5'">
    Vai al manuale del gioco
  </a>
</div>

## Funzionalità principali

L'applicazione viene usata dal docente o dal facilitatore per verificare automaticamente i calcoli degli studenti durante il gioco "Proof & Dragons" e fornire un feedback visivo su quello che succede durante la partita. Le funzionalità principali includono:

* **Visualizzazione del processo di mining:** il docente inserisce il nome del gruppo ("Nome Pool") e il nonce per validare un tentativo di mining.
* **Aggiustamento dinamico della difficoltà:**
    * **Difficoltà iniziale:** impostata all'inizio della partita in base al numero di gruppi partecipanti.
    * **Aggiustamento basato sul tempo:** dopo che un blocco è stato minato, la difficoltà per il round successivo viene automaticamente modificata in base al tempo impiegato, con l'obiettivo di mantenere il tempo di blocco intorno ai 5 minuti.
* **Calcolo del "Proof":** una formula semplificata calcola un valore "Proof" basato sul nome del pool, il nonce, il resto del blocco precedente (se presente) e, per il blocco finale, il valore delle transazioni selezionate.
* **Verifica del resto:** il "Proof" viene diviso per un divisore scelto. Se il resto è maggiore o uguale a una soglia target (`divisore - 3`), il blocco è considerato "minato".
* **Timewall (Blockchain):** i blocchi minati con successo vengono aggiunti al "Timewall", mostrando i dettagli di ogni blocco.
* **Mempool (semplificata):** per il terzo blocco, gli utenti possono selezionare fino a due "transazioni" dalla mempool, il cui valore (la lunghezza della loro descrizione) contribuisce al calcolo del Proof.
* **Dettaglio calcoli:** ogni passaggio del calcolo per la verifica del tentativo di mining viene visualizzato in tempo reale.
* **Internazionalizzazione (i18n):** l'interfaccia supporta più lingue (italiano, inglese, spagnolo) con un apposito selettore, e la struttura è pronta per aggiungerne facilmente altre.
* **Tema chiaro/scuro:** possibilità di cambiare tema per una migliore esperienza visiva.
* **Responsive design:** l'interfaccia si adatta a diverse dimensioni di schermo, ma è progettata principalmente per l'uso su TV e monitor di grandi dimensioni. È possibile attivare la modalità a schermo intero premendo il tasto `F`.

## Come eseguire il progetto

### Online
L'app è online sul sito [Rainbow Bits](https://rainbowbits.cloud/proof_and_dragons/).

### In locale
1.  **Clonare il repository (o scaricare i file):**
    ```bash
    git clone [https://github.com/marcofarina/proof_and_dragons.git](https://github.com/marcofarina/proof_and_dragons.git)
    cd proof_and_dragons
    ```
    Oppure, se non si ha familiarità con Git, è possibile scaricare il progetto come file ZIP da GitHub e decomprimerlo in una cartella a scelta.
2.  **Aprire `index.html` nel browser:**
    Fare doppio clic sul file `index.html` o aprirlo tramite il menu "File > Apri" del proprio browser web preferito (es. Chrome, Firefox, Edge, Safari).

Non è richiesta alcuna installazione di dipendenze o build, poiché Tailwind CSS è caricato tramite CDN e il codice JavaScript è vanilla.

## Contributi

I contributi sono benvenuti! Se hai idee per migliorare il progetto, apri una issue o invia una pull request.

Alcune aree di miglioramento:
* **Aggiungere altre lingue:** grazie al nuovo sistema i18n, aggiungere una nuova lingua è semplice: basta creare una nuova cartella in `docs/locales`, aggiungere i file tradotti `common.json` e `index.json`, e aggiornare il file `locales-manifest.json`.
* **Tradurre il manuale:** la pagina `manuale.html` è attualmente solo in italiano. Potrebbe essere tradotta e integrata nel sistema i18n.
* **Salvataggio dello stato:** utilizzare `localStorage` per salvare lo stato della partita, permettendo all'utente di riprenderla in un secondo momento.
* **Animazioni più complesse:** migliorare le animazioni CSS o introdurre animazioni JavaScript per rendere l'esperienza più coinvolgente.

## Licenza

Questo progetto è distribuito con licenza **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)**.

Ciò significa che puoi **copiare, distribuire, modificare e riutilizzare** il materiale, **a condizione che**:

-   **Attribuzione**: venga sempre indicato in modo chiaro l'autore originale.
-   **Non commerciale**: non puoi utilizzare l’opera per scopi commerciali.
-   **Condividi allo stesso modo**: se modifichi o trasformi il materiale, devi distribuire il contributo con la **stessa licenza**.

Per maggiori informazioni: [creativecommons.org/licenses/by-nc-sa/4.0/deed.it](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.it)

<div align="center">
  <a rel="license" href="https://creativecommons.org/licenses/by-nc-sa/4.0/">
    <img alt="Licenza Creative Commons" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" />
  </a>
</div>