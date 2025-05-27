![Proof & Dragons](/docs/static/logo_black.svg)

**Proof & Dragons** è l'applicazione web interattiva progettata come companion app dell'omonimo gioco didattico. Attraverso diverse metafore ludiche, gli utenti possono sperimentare in modo semplificato come i miner competono per aggiungere blocchi a una blockchain.

L'applicazione è costruita interamente con HTML, CSS (Tailwind CSS) e JavaScript vanilla, rendendola un ottimo strumento didattico sia per studenti di informatica che per un pubblico più generico.

## Contesto didattico

Questo progetto è stato sviluppato come risorsa educativa per studenti di scuole secondarie di secondo grado (età 15-18 anni) per illustrare:

* I principi base del Proof-of-Work.
* Come la difficoltà di mining e il nonce influenzano la creazione di un blocco.
* La struttura di una catena di blocchi (Timewall).
* Il concetto di "mempool" e la selezione delle transazioni (semplificata).

L'obiettivo è fornire una comprensione pratica e interattiva di concetti che possono apparire astratti, stimolando la curiosità verso Bitcoin.

## Funzionalità principali
L'applicazione viene usata dal docente o dal facilitatore per verificare automaticamente i calcoli degli studenti durante il gioco "Proof & Dragons" e fornire un feedback visivo su quello che succede durante la partita. Le funzionalità principali includono:

* **Visualizzazione del processo di mining:** il docente inserisce il nome del gruppo ("Nome Pool") e il nonce per validare un tentativo di mining.
* **Selezione del divisore (difficoltà):** all'avvio l'applicazione fornisce un set casuale di divisori (range 11-22), uno per ogni slot del template cartaceo su cui svolgono i calcoli i partecipanti. Prima di ogni validazione il docente deve selezionare un "divisore", che rappresenta la difficoltà target.
* **Calcolo del "Proof":** una formula semplificata calcola un valore "Proof" basato sul nome del pool, il nonce, il resto del blocco precedente (se presente) e, per il blocco finale, il valore delle transazioni selezionate.
* **Verifica del resto:** il "Proof" viene diviso per il divisore selezionato. Se il resto è maggiore o uguale a una soglia target (`divisore - 3`), il blocco è considerato "minato".
* **Timewall (Blockchain):** i blocchi minati con successo vengono aggiunti al "Timewall", mostrando i dettagli di ogni blocco.
* **Mempool (semplificata):** per il terzo blocco, gli utenti possono selezionare fino a due "transazioni" (rappresentate da descrizioni e icone) dalla mempool, il cui valore (lunghezza della descrizione) contribuisce al calcolo del Proof.
* **Dettaglio calcoli:** ogni passaggio del calcolo per la verifica del tentativo di mining viene visualizzato in tempo reale.
* **Tema chiaro/scuro:** possibilità di cambiare tema per una migliore esperienza visiva.
* **Menu interattivo:** accesso al manuale del gioco (#TODO), repository GitHub e opzione per ricominciare la partita.
* **Feedback utente:** messaggi informativi, di successo o di errore guidano l'utente.
* **Responsive design:** l'interfaccia si adatta a diverse dimensioni di schermo, ma è progettata principalmente per l'uso su TV e monitor di grandi dimensioni. È possibile attivare la modalità a schermo intero premendo il tasto `F`.

## Come eseguire il progetto
### Online

L'app è online sul sito [Rainbow Bits](https://rainbowbits.cloud/proof&dragons/).

### In locale
1.  **Clonare il repository (o scaricare i file):**
    ```bash
    git clone https://github.com/marcofarina/proof&dragons.git
    cd TUO_REPOSITORY
    ```
    Oppure, se non si ha familiarità con Git, è possibile scaricare il progetto come file ZIP da GitHub e decomprimerlo in una cartella a scelta.
2.  **Assicurarsi che la struttura delle cartelle sia corretta:**
    Il file `index.html`, `style.css`, e `script.js` devono trovarsi nella directory principale del progetto.
    La cartella `icons` (contenente `fee1.png`, `fee2.png`, ecc.) deve trovarsi anch'essa nella directory principale.
3.  **Aprire `index.html` nel browser:**
    Fare doppio clic sul file `index.html` o aprirlo tramite il menu "File > Apri" del proprio browser web preferito (es. Chrome, Firefox, Edge, Safari).

Non è richiesta alcuna installazione di dipendenze o build, poiché Tailwind CSS è caricato tramite CDN e il codice JavaScript è vanilla.

## Logica del "gioco" Proof & Dragons (semplificata)

Il gioco simula il processo di mining attraverso i seguenti passaggi:

1.  **Inizializzazione:**
    * Vengono generati 8 "divisori" casuali (numeri tra 11 e 22).
    * La "mempool" viene popolata con transazioni predefinite.
2.  **Selezione del divisore:** L'utente sceglie uno dei divisori disponibili. Questo rappresenta la difficoltà del blocco corrente.
3.  **Input utente:** L'utente inserisce:
    * `Nome Pool`: Una stringa (max 10 caratteri, no spazi).
    * `Nonce`: Un numero intero (tra 2 e 32).
4.  **Selezione transazioni (solo per il Blocco 3):** L'utente può selezionare fino a 2 transazioni dalla mempool.
5.  **Calcolo del `WR` (Winning Requirement - base):**
    * `WR = Somma dei valori ASCII delle lettere del Nome Pool (maiuscolo) + 1500`
6.  **Calcolo del `Proof`:**
    * **Blocco 1:** `Proof = (WR + Nonce) * 3`
    * **Blocco 2:** `Proof = (WR + Nonce + RestoDelBloccoPrecedente) * 3`
    * **Blocco 3:** `Proof = (WR + Nonce + RestoDelBloccoPrecedente + ValoreTransazioni) * 3`
        * `ValoreTransazioni`: Somma delle lunghezze delle descrizioni delle transazioni selezionate.
7.  **Verifica del `CalculatedRemainder` (Resto Calcolato):**
    * `CalculatedRemainder = Proof % DivisoreSelezionato`
8.  **Determinazione del successo:**
    * `TargetRemainder = DivisoreSelezionato - 3`
    * Se `CalculatedRemainder >= TargetRemainder`, il tentativo ha successo e il blocco viene "minato".
    * Altrimenti, il tentativo fallisce.
9.  **Aggiunta alla Timewall:** Se il blocco è minato con successo, viene aggiunto alla Timewall con i suoi dettagli. Il `CalculatedRemainder` di questo blocco diventa il `RestoDelBloccoPrecedente` per il successivo.
10. **Nuovo round:** Se non si è raggiunto il massimo di 3 blocchi, vengono generati nuovi divisori e l'utente può tentare di minare il blocco successivo.
11. **Fine partita:** Dopo 3 blocchi minati, la partita termina. È possibile ricominciare tramite il menu.

## Possibili miglioramenti futuri (per gli studenti)

Questo progetto può essere esteso e migliorato in molti modi, offrendo spunti per ulteriori esercitazioni:

* **Modal personalizzati:** Sostituire `window.confirm()` con un modale personalizzato per la conferma del reset, stilizzato in linea con l'applicazione.
* **Difficoltà dinamica:** Introdurre un meccanismo per cui la difficoltà (valori dei divisori) si aggiusta automaticamente in base al "tempo" impiegato per minare i blocchi precedenti (simulando l'aggiustamento della difficoltà di Bitcoin).
* **Visualizzazione più dettagliata della Timewall:** Aggiungere hash del blocco (simulati), hash del blocco precedente, merkle root (concettuale).
* **Introduzione di "fee" variabili:** Associare valori di fee diversi alle transazioni e permettere al "miner" di selezionare le transazioni anche in base a queste.
* **Salvataggio dello stato:** Utilizzare `localStorage` per salvare lo stato della partita, permettendo all'utente di riprenderla in un secondo momento.
* **Animazioni più complesse:** Migliorare le animazioni CSS o introdurre animazioni JavaScript per rendere l'esperienza più coinvolgente.
* **Test unitari:** Scrivere test per le funzioni logiche principali in `script.js`.
* **Internazionalizzazione (i18n):** Strutturare il codice per supportare facilmente più lingue.

## Contributi

I contributi sono benvenuti! Se hai idee per migliorare il progetto, apri una issue o invia una pull request.

## Licenza

Questo progetto è rilasciato sotto la licenza MIT (o un'altra licenza a tua scelta, es. Creative Commons per materiale didattico).
