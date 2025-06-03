// js/logic.js

// --- CONSTANTS ---
export const GameConstants = {
    MAX_BLOCKS: 3,
    ASCII_SUM_OFFSET: 1500,
    PROOF_MULTIPLIER: 3,
    TARGET_REMAINDER_OFFSET: 3,
    POOL_NAME_MAX_LENGTH: 10,
    NONCE_MIN: 2,
    NONCE_MAX: 32,
    MAX_TX_FOR_BLOCK_3: 2,
    BASE_TX_DATA: [
        { id: 'tx1', description: 'Scroll of Minor Hashing' },
        { id: 'tx2', description: 'Amulet of Chain Integrity' },
        { id: 'tx3', description: 'Potion of Nonce Discovery' },
        { id: 'tx4', description: 'Map to Forgotten Blocks' },
        { id: 'tx5', description: 'Golden Pickaxe Efficiency' },
        { id: 'tx6', description: 'Dragonscale Ledger' },
    ],
    TX_ICON_PATHS: [
        './icons/fee1.png', './icons/fee2.png', './icons/fee3.png',
        './icons/fee4.png', './icons/fee5.png', './icons/fee6.png'
    ],
    BASE_MIN_DIVISOR: 11,
    MIN_DIVISOR_ABSOLUTE: 8,
    MAX_DIVISOR_ABSOLUTE: 40,
    DIVISOR_RANGE_SPAN: 11,
    NUM_DIVISORS_TO_GENERATE: 8,
    BASE_GROUPS_FOR_DIFFICULTY: 5,
    DIFFICULTY_ADJUSTMENT_PER_GROUP: 1,

    // Nuove costanti per l'aggiustamento basato sul tempo
    TARGET_TIME_PER_BLOCK_MINUTES: 5,
    TIME_ADJUSTMENT_SENSITIVITY_PER_MINUTE: 1, // Punti di difficoltà (min_divisor shift) per minuto di deviazione
    MAX_TIME_BASED_DIFFICULTY_SHIFT: 5,      // Massimo +/- shift del min_divisor dovuto al tempo
};

// --- APPLICATION STATE ---
let gameState = {
    availableDivisors: [],
    selectedDivisor: null,
    mempool: [],
    currentlySelectedTxs: [],
    timewall: [],
    lastWinningRemainder: null,
    numberOfGroups: 1,
    currentMinDivisor: GameConstants.BASE_MIN_DIVISOR,
    currentMaxDivisor: GameConstants.BASE_MIN_DIVISOR + GameConstants.DIVISOR_RANGE_SPAN,
    blockStartTimestamp: null, // Timestamp di inizio del mining del blocco corrente
    lastTimeAdjustmentAmount: 0, // Ultimo aggiustamento applicato a min_divisor a causa del tempo
    timeTakenForLastBlockSeconds: null, // Tempo impiegato per l'ultimo blocco (per UI)
};

// --- UTILITY FUNCTIONS (Logica Pura) ---
const Utils = {
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },
    logError(message, error) {
        console.error(message, error);
    }
};

// --- VALIDATION MANAGER ---
export const ValidationManager = {
    validatePoolName(name) {
        if (!name) return "Nome Pool mancante.";
        if (name.length > GameConstants.POOL_NAME_MAX_LENGTH) return `Nome Pool: massimo ${GameConstants.POOL_NAME_MAX_LENGTH} caratteri.`;
        if (name.includes(' ')) return "Nome Pool: non deve contenere spazi.";
        return null;
    },
    validateNonce(nonceStr) {
        const nonce = parseInt(nonceStr, 10);
        if (isNaN(nonce) || nonce < GameConstants.NONCE_MIN || nonce > GameConstants.NONCE_MAX) {
            return `Il Nonce deve essere un numero valido tra ${GameConstants.NONCE_MIN} e ${GameConstants.NONCE_MAX}.`;
        }
        return null;
    }
};

// --- GAME LOGIC ---
export const GameLogic = {
    getCurrentState() {
        return {
            ...gameState,
            availableDivisors: [...gameState.availableDivisors],
            mempool: gameState.mempool.map(tx => ({...tx})),
            currentlySelectedTxs: gameState.currentlySelectedTxs.map(tx => ({...tx})),
            timewall: gameState.timewall.map(block => ({...block})),
        };
    },

    initializeMempoolData() {
        const shuffledIcons = [...GameConstants.TX_ICON_PATHS];
        Utils.shuffleArray(shuffledIcons);
        gameState.mempool = GameConstants.BASE_TX_DATA.map((txBase, index) => ({
            ...txBase,
            feeIconPath: shuffledIcons[index % shuffledIcons.length]
        }));
    },

    // Imposta la difficoltà iniziale basata sul numero di gruppi
    setInitialDifficultyByGroups(numGroups) {
        gameState.numberOfGroups = numGroups;
        let minDivTarget;

        minDivTarget = GameConstants.BASE_MIN_DIVISOR +
                       (numGroups - GameConstants.BASE_GROUPS_FOR_DIFFICULTY) * GameConstants.DIFFICULTY_ADJUSTMENT_PER_GROUP;

        let actualMinDiv = Math.max(GameConstants.MIN_DIVISOR_ABSOLUTE, minDivTarget);
        actualMinDiv = Math.min(actualMinDiv, GameConstants.MAX_DIVISOR_ABSOLUTE - GameConstants.DIVISOR_RANGE_SPAN);

        if (GameConstants.MAX_DIVISOR_ABSOLUTE - GameConstants.DIVISOR_RANGE_SPAN < GameConstants.MIN_DIVISOR_ABSOLUTE) {
            actualMinDiv = GameConstants.MIN_DIVISOR_ABSOLUTE;
        }

        let actualMaxDiv = actualMinDiv + GameConstants.DIVISOR_RANGE_SPAN;
        actualMaxDiv = Math.min(actualMaxDiv, GameConstants.MAX_DIVISOR_ABSOLUTE);

        if (actualMinDiv >= actualMaxDiv) {
            actualMinDiv = GameConstants.MIN_DIVISOR_ABSOLUTE;
            actualMaxDiv = Math.min(GameConstants.MIN_DIVISOR_ABSOLUTE + 1, GameConstants.MAX_DIVISOR_ABSOLUTE);
            if (actualMinDiv >= actualMaxDiv) {
                actualMaxDiv = GameConstants.MAX_DIVISOR_ABSOLUTE;
                actualMinDiv = GameConstants.MAX_DIVISOR_ABSOLUTE;
            }
        }

        gameState.currentMinDivisor = actualMinDiv;
        gameState.currentMaxDivisor = actualMaxDiv;
        gameState.lastTimeAdjustmentAmount = 0; // Nessun aggiustamento di tempo all'inizio
        gameState.timeTakenForLastBlockSeconds = null;


        console.log(`Difficoltà iniziale per ${numGroups} gruppi: Range Divisori [${gameState.currentMinDivisor}-${gameState.currentMaxDivisor}]`);
    },

    // Applica un aggiustamento alla difficoltà basato sul tempo impiegato per l'ultimo blocco
    applyTimedDifficultyShift(timeTakenSeconds) {
        const targetSeconds = GameConstants.TARGET_TIME_PER_BLOCK_MINUTES * 60;
        const deviationMinutes = (timeTakenSeconds - targetSeconds) / 60;

        // Calcola di quanto il min_divisor dovrebbe cambiare.
        // Se deviationMinutes è positivo (troppo tempo), difficultyShift è positivo.
        let difficultyShift = Math.round(deviationMinutes * GameConstants.TIME_ADJUSTMENT_SENSITIVITY_PER_MINUTE);
        difficultyShift = Math.max(-GameConstants.MAX_TIME_BASED_DIFFICULTY_SHIFT, Math.min(GameConstants.MAX_TIME_BASED_DIFFICULTY_SHIFT, difficultyShift));

        // Applica lo shift: se si è impiegato troppo tempo (difficultyShift > 0), si vuole rendere più facile, quindi si sottrae lo shift.
        let newMinDivisor = gameState.currentMinDivisor - difficultyShift;

        // Clamping del newMinDivisor
        let actualNewMinDiv = Math.max(GameConstants.MIN_DIVISOR_ABSOLUTE, newMinDivisor);
        actualNewMinDiv = Math.min(actualNewMinDiv, GameConstants.MAX_DIVISOR_ABSOLUTE - GameConstants.DIVISOR_RANGE_SPAN);

        if (GameConstants.MAX_DIVISOR_ABSOLUTE - GameConstants.DIVISOR_RANGE_SPAN < GameConstants.MIN_DIVISOR_ABSOLUTE) {
            actualNewMinDiv = GameConstants.MIN_DIVISOR_ABSOLUTE;
        }

        gameState.currentMinDivisor = actualNewMinDiv;
        gameState.currentMaxDivisor = gameState.currentMinDivisor + GameConstants.DIVISOR_RANGE_SPAN;
        // Assicura che anche currentMaxDivisor sia clampato
        gameState.currentMaxDivisor = Math.min(gameState.currentMaxDivisor, GameConstants.MAX_DIVISOR_ABSOLUTE);
         if (gameState.currentMinDivisor >= gameState.currentMaxDivisor) { // Ulteriore fallback se il clamping crea problemi
            gameState.currentMinDivisor = GameConstants.MIN_DIVISOR_ABSOLUTE;
            gameState.currentMaxDivisor = Math.min(GameConstants.MIN_DIVISOR_ABSOLUTE + 1, GameConstants.MAX_DIVISOR_ABSOLUTE);
             if (gameState.currentMinDivisor >= gameState.currentMaxDivisor) {
                gameState.currentMaxDivisor = GameConstants.MAX_DIVISOR_ABSOLUTE;
                gameState.currentMinDivisor = GameConstants.MAX_DIVISOR_ABSOLUTE;
            }
        }


        gameState.lastTimeAdjustmentAmount = -difficultyShift; // Memorizza l'impatto effettivo sul valore del divisore (positivo se più difficile)
        gameState.timeTakenForLastBlockSeconds = timeTakenSeconds;


        console.log(`Tempo impiegato: ${timeTakenSeconds.toFixed(1)}s. Deviazione: ${deviationMinutes.toFixed(1)}min. Shift difficoltà (su min_divisor): ${-difficultyShift}. Nuovo range: [${gameState.currentMinDivisor}-${gameState.currentMaxDivisor}]`);
    },


    generateRandomDivisors() {
        const divisors = new Set();
        const min = gameState.currentMinDivisor;
        const max = gameState.currentMaxDivisor;

        if (min > max) {
            Utils.logError("Range dei divisori non valido (min > max):", `Min: ${min}, Max: ${max}. Uso fallback.`);
            gameState.availableDivisors = [GameConstants.BASE_MIN_DIVISOR];
            return;
        }

        const uniqueNumbersInRange = max - min + 1;
        const numToGenerate = Math.min(GameConstants.NUM_DIVISORS_TO_GENERATE, uniqueNumbersInRange);

        if (numToGenerate <= 0) {
             Utils.logError("Non ci sono numeri unici nel range per generare divisori:", `Min: ${min}, Max: ${max}.`);
             if (min === max) {
                 divisors.add(min);
             } else {
                divisors.add(GameConstants.BASE_MIN_DIVISOR);
             }
        } else {
            while (divisors.size < numToGenerate) {
                divisors.add(Math.floor(Math.random() * uniqueNumbersInRange) + min);
            }
        }
        gameState.availableDivisors = Array.from(divisors);
    },

    // Chiamato dopo che un blocco è stato minato (e non è l'ultimo) o per un reset completo.
    // Se isFullReset è true, numGroupsForReset DEVE essere fornito per impostare la difficoltà iniziale.
    resetGameForNextBlockLogic(isFullReset = false, numGroupsForReset = null) {
        if (isFullReset) {
            if (numGroupsForReset === null) {
                Utils.logError("numGroupsForReset è necessario per un reset completo.");
                // Fallback, anche se non dovrebbe accadere se la UI lo gestisce correttamente
                this.setInitialDifficultyByGroups(gameState.numberOfGroups || 1);
            } else {
                this.setInitialDifficultyByGroups(numGroupsForReset);
            }
            gameState.timewall = [];
            gameState.lastWinningRemainder = null;
            this.initializeMempoolData();
        }
        // In entrambi i casi (reset completo o solo per il blocco successivo),
        // i divisori vengono generati usando currentMin/MaxDivisor che sono stati
        // appena impostati da setInitialDifficultyByGroups (per full reset)
        // o da applyTimedDifficultyShift (prima di chiamare questo per il blocco successivo).
        this.generateRandomDivisors();
        gameState.selectedDivisor = null;
        gameState.currentlySelectedTxs = [];

        // Resetta il timestamp di inizio blocco per il nuovo round di mining
        gameState.blockStartTimestamp = Date.now();
        if (!isFullReset) {
            // Se non è un reset completo, significa che un blocco è appena stato minato.
            // lastTimeAdjustmentAmount e timeTakenForLastBlockSeconds sono già stati impostati da applyTimedDifficultyShift.
            // Non li resettiamo qui, perché la UI li userà per mostrare il messaggio.
            // Verranno resettati/aggiornati al prossimo aggiustamento o reset completo.
        } else {
            // Per un reset completo, azzeriamo questi valori.
            gameState.lastTimeAdjustmentAmount = 0;
            gameState.timeTakenForLastBlockSeconds = null;
        }
    },

    resetFullGameLogic(numGroups) {
        this.resetGameForNextBlockLogic(true, numGroups);
    },

    selectDivisorLogic(divisorValue) {
        if (gameState.timewall.length >= GameConstants.MAX_BLOCKS) return false;
        gameState.selectedDivisor = divisorValue;
        return true;
    },

    selectTransactionLogic(tx) {
        // ... (invariato)
        if (gameState.timewall.length >= GameConstants.MAX_BLOCKS) return { success: false, message: "Gioco terminato." };

        const currentBlockNumber = gameState.timewall.length + 1;
        if (currentBlockNumber !== 3) {
            return { success: false, message: "Le transazioni possono essere selezionate solo per il Blocco 3." };
        }

        const index = gameState.currentlySelectedTxs.findIndex(selected => selected.id === tx.id);
        if (index > -1) {
            gameState.currentlySelectedTxs.splice(index, 1);
            return { success: true, type: 'deselected' };
        } else {
            if (gameState.currentlySelectedTxs.length < GameConstants.MAX_TX_FOR_BLOCK_3) {
                gameState.currentlySelectedTxs.push(tx);
                return { success: true, type: 'selected' };
            } else {
                return { success: false, message: `Puoi selezionare un massimo di ${GameConstants.MAX_TX_FOR_BLOCK_3} transazioni.` };
            }
        }
    },

    calculateWR(poolName) {
        // ... (invariato)
        if (!poolName) return 0;
        const upperPoolName = poolName.toUpperCase();
        let asciiSum = 0;
        for (let i = 0; i < upperPoolName.length; i++) {
            asciiSum += upperPoolName.charCodeAt(i);
        }
        return asciiSum + GameConstants.ASCII_SUM_OFFSET;
    },

    calculateTxValue() {
        // ... (invariato)
        if (gameState.currentlySelectedTxs.length === 0) return 0;
        return gameState.currentlySelectedTxs.reduce((sum, tx) => sum + tx.description.length, 0);
    },

    attemptMineBlock(poolName, nonceStr) {
        const currentBlockNumberForAttempt = gameState.timewall.length + 1;
        let calculationDetails = {
            // ... (definizione iniziale invariata)
            poolName: poolName || '',
            nonceInput: nonceStr || '',
            selectedDivisor: gameState.selectedDivisor,
            currentBlockNumber: currentBlockNumberForAttempt,
            lastWinningRemainder: (currentBlockNumberForAttempt > 1) ? gameState.lastWinningRemainder : null,
            selectedTransactionsForDisplay: (currentBlockNumberForAttempt === 3) ? gameState.currentlySelectedTxs.map(tx => `${tx.description} (${tx.description.length})`) : [],
            isSuccess: null,
            error: null,
            WR: 0, asciiSum: 0, proofFormula: '', proofValue: 0,
            calculatedRemainder: 0, targetRemainderValue: 0, txValue: 0,
            isGameEnd: false,
        };

        // ... (validazioni input invariate)
        if (currentBlockNumberForAttempt > GameConstants.MAX_BLOCKS) {
            calculationDetails.error = `Massimo di ${GameConstants.MAX_BLOCKS} blocchi già minati. Sessione di gioco completa.`;
            calculationDetails.isGameEnd = true;
            return calculationDetails;
        }
        const poolNameError = ValidationManager.validatePoolName(poolName);
        if (poolNameError) {
            calculationDetails.error = poolNameError;
            return calculationDetails;
        }
        if (gameState.selectedDivisor === null) {
            calculationDetails.error = "Per favore, seleziona un Divisore.";
            return calculationDetails;
        }
        const nonceError = ValidationManager.validateNonce(nonceStr);
        if (nonceError) {
            calculationDetails.error = nonceError;
            return calculationDetails;
        }
        const nonce = parseInt(nonceStr, 10);
        calculationDetails.nonce = nonce;
        if (currentBlockNumberForAttempt === 3 && gameState.currentlySelectedTxs.length > GameConstants.MAX_TX_FOR_BLOCK_3) {
            calculationDetails.error = `Per favore, seleziona un massimo di ${GameConstants.MAX_TX_FOR_BLOCK_3} Transazioni per il Blocco 3.`;
            return calculationDetails;
        }


        // ... (calcolo WR, txValue, Proof, CalculatedRemainder, TargetRemainder invariati)
        const WR = this.calculateWR(poolName);
        calculationDetails.WR = WR;
        calculationDetails.asciiSum = WR - GameConstants.ASCII_SUM_OFFSET;
        const txValue = (currentBlockNumberForAttempt === 3) ? this.calculateTxValue() : 0;
        calculationDetails.txValue = txValue;
        let Proof;
        let proofFormula = "";
        if (currentBlockNumberForAttempt === 1) {
            Proof = (WR + nonce) * GameConstants.PROOF_MULTIPLIER;
            proofFormula = `(${WR} + ${nonce}) * ${GameConstants.PROOF_MULTIPLIER}`;
        } else if (currentBlockNumberForAttempt === 2) {
            if (gameState.lastWinningRemainder === null) {
                 calculationDetails.error = "Errore: Resto del blocco precedente non disponibile per il Blocco 2.";
                 return calculationDetails;
            }
            Proof = (WR + nonce + gameState.lastWinningRemainder) * GameConstants.PROOF_MULTIPLIER;
            proofFormula = `(${WR} + ${nonce} + ${gameState.lastWinningRemainder}) * ${GameConstants.PROOF_MULTIPLIER}`;
        } else {
             if (gameState.lastWinningRemainder === null) {
                 calculationDetails.error = "Errore: Resto del blocco precedente non disponibile per il Blocco 3.";
                 return calculationDetails;
            }
            Proof = (WR + nonce + gameState.lastWinningRemainder + txValue) * GameConstants.PROOF_MULTIPLIER;
            proofFormula = `(${WR} + ${nonce} + ${gameState.lastWinningRemainder} + ${txValue}) * ${GameConstants.PROOF_MULTIPLIER}`;
        }
        calculationDetails.proofFormula = proofFormula;
        calculationDetails.proofValue = Proof;
        const CalculatedRemainder = Proof % gameState.selectedDivisor;
        calculationDetails.calculatedRemainder = CalculatedRemainder;
        let TargetRemainder = gameState.selectedDivisor - GameConstants.TARGET_REMAINDER_OFFSET;
        TargetRemainder = Math.max(0, TargetRemainder);
        calculationDetails.targetRemainderValue = TargetRemainder;

        const isSuccess = (CalculatedRemainder >= TargetRemainder);
        calculationDetails.isSuccess = isSuccess;

        if (isSuccess) {
            const timeTakenSeconds = (Date.now() - gameState.blockStartTimestamp) / 1000;
            gameState.timeTakenForLastBlockSeconds = timeTakenSeconds; // Salva per UI

            const winningRemainderForBlock = CalculatedRemainder;
            const newBlockEntry = {
                // ... (dettagli blocco invariati)
                id: `block-${Date.now()}-${gameState.timewall.length + 1}`,
                poolName: poolName,
                nonce: nonce,
                divisor: gameState.selectedDivisor,
                remainder: winningRemainderForBlock,
                previousRemainder: (currentBlockNumberForAttempt > 1) ? gameState.lastWinningRemainder : null,
                selectedTransactions: (currentBlockNumberForAttempt === 3) ? [...gameState.currentlySelectedTxs] : [],
                timestamp: new Date().toISOString(),
            };
            gameState.timewall.push(newBlockEntry);
            gameState.lastWinningRemainder = winningRemainderForBlock;

            if (gameState.timewall.length < GameConstants.MAX_BLOCKS) {
                // Applica l'aggiustamento della difficoltà basato sul tempo PRIMA di resettare per il prossimo blocco
                this.applyTimedDifficultyShift(timeTakenSeconds);
                this.resetGameForNextBlockLogic(false); // Questo rigenererà i divisori con la nuova difficoltà
                                                      // e resetterà blockStartTimestamp
            } else {
                calculationDetails.isGameEnd = true;
                gameState.lastTimeAdjustmentAmount = 0; // Nessun aggiustamento dopo l'ultimo blocco
                gameState.timeTakenForLastBlockSeconds = null;
            }
        }
        return calculationDetails;
    }
};

GameLogic.initializeMempoolData();
