<picture>
  <source srcset="/docs/static/logo_white.svg" media="(prefers-color-scheme: dark)">
  <source srcset="/docs/static/logo_black.svg" media="(prefers-color-scheme: light)">
  <img src="/docs/static/logo_white.svg" alt="Logo">
</picture>

**Proof & Dragons** è un'applicazione web interattiva progettata come companion app dell'omonimo gioco didattico. Attraverso diverse metafore ludiche, gli utenti possono sperimentare in modo semplificato come i miner competono per aggiungere blocchi a una blockchain.

## Contesto didattico

Questo progetto è stato sviluppato come risorsa educativa per studenti di scuole secondarie di secondo grado (età 15-18 anni) per illustrare:

* I principi base del Proof-of-Work.
* Come la difficoltà di mining e il nonce influenzano la creazione di un blocco.
* La struttura di una catena di blocchi (Timewall).
* Il concetto di "mempool" e la selezione delle transazioni (semplificata).

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
    Vai al Manuale del gioco
  </a>
</div>


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

L'app è online sul sito [Rainbow Bits](https://rainbowbits.cloud/proof_and_dragons/).

### In locale
1.  **Clonare il repository (o scaricare i file):**
    ```bash
    git clone https://github.com/marcofarina/proof_and_dragons.git
    cd proof_and_dragons
    ```
    Oppure, se non si ha familiarità con Git, è possibile scaricare il progetto come file ZIP da GitHub e decomprimerlo in una cartella a scelta.
2. **Aprire `index.html` nel browser:**
    Fare doppio clic sul file `index.html` o aprirlo tramite il menu "File > Apri" del proprio browser web preferito (es. Chrome, Firefox, Edge, Safari).

Non è richiesta alcuna installazione di dipendenze o build, poiché Tailwind CSS è caricato tramite CDN e il codice JavaScript è vanilla.

## Logica del "gioco" Proof & Dragons (semplificata)

Il gioco simula il processo di mining attraverso i seguenti passaggi:

1.  **Inizializzazione:**
    * Vengono generati 8 "divisori" casuali (numeri tra 11 e 22 — equivalente a 1d12+10).
    * La "mempool" viene popolata con transazioni predefinite che saranno visualizzate dopo aver minato il secondo blocco.
Quando un gruppo vuole verificare un tentavivo di mining il docente inserisce i dati:

2.  **Selezione del divisore:** si sceglie uno dei divisori disponibili. Questo rappresenta la difficoltà del blocco corrente.
3.  **Input:** si inserisce:
    * `Nome Pool`: una stringa (max 10 caratteri, no spazi).
    * `Nonce`: un numero intero (tra 2 e 32).
4.  **Selezione transazioni (solo per il Blocco 3):** ogni gruppo può selezionare fino a 2 transazioni dalla mempool.
5.  **Calcolo del `WR` (Werkle Root - base):**
    * `WR = Somma dei valori ASCII delle lettere del Nome Pool (maiuscolo) + 1500`
6.  **Calcolo del `Proof`:**
    * **Blocco 1:** `Proof = (WR + Nonce) * 3`
    * **Blocco 2:** `Proof = (WR + Nonce + RestoDelBloccoPrecedente) * 3`
    * **Blocco 3:** `Proof = (WR + Nonce + RestoDelBloccoPrecedente + ValoreTransazioni) * 3`
        * `ValoreTransazioni`: Somma delle lunghezze delle descrizioni delle transazioni selezionate.
7.  **Verifica del `CalculatedRemainder` (Resto calcolato dal gruppo):**
    * `CalculatedRemainder = Proof % DivisoreSelezionato` (l'operatore modulo rappresenta il resto della divisione intera)
8.  **Determinazione del successo:**
    * `TargetRemainder = DivisoreSelezionato - 3`
    * Se `CalculatedRemainder >= TargetRemainder`, il tentativo ha successo e il blocco viene "minato".
    * Altrimenti, il tentativo fallisce.
9.  **Aggiunta al Timewall:** se il blocco è minato con successo, viene aggiunto al Timewall con i suoi dettagli. Il `CalculatedRemainder` di questo blocco diventa il `RestoDelBloccoPrecedente` per il successivo.
10. **Nuovo round:** se non si è raggiunto il massimo di 3 blocchi, vengono generati nuovi divisori e i gruppi possono tentare di minare il blocco successivo.
11. **Fine partita:** dopo 3 blocchi minati, la partita termina. È possibile ricominciare tramite il menu.

## Contributi

I contributi sono benvenuti! Se hai idee per migliorare il progetto, apri una issue o invia una pull request.

* **Internazionalizzazione (i18n):** strutturare il codice per supportare facilmente più lingue.
* **Difficoltà dinamica:** introdurre un meccanismo per cui la difficoltà (valori dei divisori) si aggiusta automaticamente in base al "tempo" impiegato per minare i blocchi precedenti (simulando l'aggiustamento della difficoltà di Bitcoin), oppure in base al numero di gruppi che partecipano al gioco (input manuale).
* **Introduzione di "fee" variabili:** associare valori di fee diversi alle transazioni e permettere al "miner" di selezionare le transazioni anche in base a queste.
* **Salvataggio dello stato:** utilizzare `localStorage` per salvare lo stato della partita, permettendo all'utente di riprenderla in un secondo momento.
* **Animazioni più complesse:** migliorare le animazioni CSS o introdurre animazioni JavaScript per rendere l'esperienza più coinvolgente.

## Licenza

Questo progetto è distribuito con licenza **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)**.

Ciò significa che puoi **copiare, distribuire, modificare e riutilizzare** il materiale, **a condizione che**:

- **Attribuzione**: venga sempre indicato in modo chiaro l'autore originale.
- **Non commerciale**: non puoi utilizzare l’opera per scopi commerciali.
- **Condividi allo stesso modo**: se modifichi o trasformi il materiale, devi distribuire il contributo con la **stessa licenza**.

Per maggiori informazioni: [creativecommons.org/licenses/by-nc-sa/4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.it)

### License (English)

This project is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)** license.

You are free to **copy, distribute, remix, and reuse** the material, **under the following terms**:

- **Attribution**: You must give appropriate credit to the original author.
- **NonCommercial**: You may not use the material for commercial purposes.
- **ShareAlike**: If you remix, transform, or build upon the material, you must distribute your contributions under the **same license**.

More info: [creativecommons.org/licenses/by-nc-sa/4.0](https://creativecommons.org/licenses/by-nc-sa/4.0)

<div align="center">
  <a rel="license" href="https://creativecommons.org/licenses/by-nc-sa/4.0/">
    <img alt="Licenza Creative Commons" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" />
  </a>
</div>