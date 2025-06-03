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
    // Costanti per la difficoltà base dei divisori
    BASE_MIN_DIVISOR: 11, // Min divisore per il numero base di gruppi
    // BASE_MAX_DIVISOR non è più usata direttamente per generare il range, si usa DIVISOR_RANGE_SPAN
    MIN_DIVISOR_ABSOLUTE: 8,  // Valore minimo assoluto che un divisore può assumere
    MAX_DIVISOR_ABSOLUTE: 40, // Valore massimo assoluto che un divisore può assumere
    DIVISOR_RANGE_SPAN: 11,   // Ampiezza del range dei divisori (MAX - MIN)
    NUM_DIVISORS_TO_GENERATE: 8,

    // Nuove costanti per lo scaling della difficoltà
    BASE_GROUPS_FOR_DIFFICULTY: 5, // Numero di gruppi per cui BASE_MIN_DIVISOR è ottimale
    DIFFICULTY_ADJUSTMENT_PER_GROUP: 1, // Quanto cambia min_divisor per ogni gruppo in più/meno da BASE_GROUPS_FOR_DIFFICULTY
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

    adjustDifficulty(numGroups) {
        gameState.numberOfGroups = numGroups;
        let minDivTarget;

        // Calcola il minDiv target in base al numero di gruppi
        minDivTarget = GameConstants.BASE_MIN_DIVISOR +
                       (numGroups - GameConstants.BASE_GROUPS_FOR_DIFFICULTY) * GameConstants.DIFFICULTY_ADJUSTMENT_PER_GROUP;

        // Limita minDivTarget in modo che minDivTarget + SPAN non superi MAX_DIVISOR_ABSOLUTE,
        // e minDivTarget non sia inferiore a MIN_DIVISOR_ABSOLUTE.
        let actualMinDiv = Math.max(GameConstants.MIN_DIVISOR_ABSOLUTE, minDivTarget);
        actualMinDiv = Math.min(actualMinDiv, GameConstants.MAX_DIVISOR_ABSOLUTE - GameConstants.DIVISOR_RANGE_SPAN);

        // Se MAX_DIVISOR_ABSOLUTE - DIVISOR_RANGE_SPAN è inferiore a MIN_DIVISOR_ABSOLUTE (range assoluto troppo piccolo per lo span)
        // allora actualMinDiv deve essere MIN_DIVISOR_ABSOLUTE.
        if (GameConstants.MAX_DIVISOR_ABSOLUTE - GameConstants.DIVISOR_RANGE_SPAN < GameConstants.MIN_DIVISOR_ABSOLUTE) {
            actualMinDiv = GameConstants.MIN_DIVISOR_ABSOLUTE;
        }


        let actualMaxDiv = actualMinDiv + GameConstants.DIVISOR_RANGE_SPAN;
        // Assicurati che actualMaxDiv non superi MAX_DIVISOR_ABSOLUTE.
        // Questo potrebbe accadere se MIN_DIVISOR_ABSOLUTE + SPAN > MAX_DIVISOR_ABSOLUTE
        actualMaxDiv = Math.min(actualMaxDiv, GameConstants.MAX_DIVISOR_ABSOLUTE);

        // Se, a causa dei clamp, minDiv finisce per essere >= maxDiv (es. se SPAN è 0 o negativo, o range assoluto è 1)
        // imposta un range minimo valido.
        if (actualMinDiv >= actualMaxDiv) {
            actualMinDiv = GameConstants.MIN_DIVISOR_ABSOLUTE;
            actualMaxDiv = Math.min(GameConstants.MIN_DIVISOR_ABSOLUTE + 1, GameConstants.MAX_DIVISOR_ABSOLUTE);
            if (actualMinDiv >= actualMaxDiv) { // Se ancora problematico (es. MIN_ABS == MAX_ABS)
                actualMaxDiv = GameConstants.MAX_DIVISOR_ABSOLUTE;
                actualMinDiv = GameConstants.MAX_DIVISOR_ABSOLUTE; // Range di un solo numero
            }
        }

        gameState.currentMinDivisor = actualMinDiv;
        gameState.currentMaxDivisor = actualMaxDiv;

        console.log(`Difficoltà aggiustata per ${numGroups} gruppi: Range Divisori [${gameState.currentMinDivisor}-${gameState.currentMaxDivisor}]`);
    },

    generateRandomDivisors() {
        const divisors = new Set();
        const min = gameState.currentMinDivisor;
        const max = gameState.currentMaxDivisor;

        if (min > max) { // Sanity check se il range non è valido (min non può essere > max)
            Utils.logError("Range dei divisori non valido (min > max):", `Min: ${min}, Max: ${max}. Uso fallback.`);
            // Fallback a un range sicuro
            gameState.availableDivisors = [GameConstants.BASE_MIN_DIVISOR];
            return;
        }

        const uniqueNumbersInRange = max - min + 1;
        const numToGenerate = Math.min(GameConstants.NUM_DIVISORS_TO_GENERATE, uniqueNumbersInRange);

        // Se uniqueNumbersInRange è 0 (min === max + 1, impossibile con logica precedente) o negativo, numToGenerate sarà <=0
        if (numToGenerate <= 0) {
             Utils.logError("Non ci sono numeri unici nel range per generare divisori:", `Min: ${min}, Max: ${max}.`);
             // Se min e max sono uguali (uniqueNumbersInRange == 1), numToGenerate sarà 1.
             if (min === max) {
                 divisors.add(min);
             } else {
                // Caso di errore imprevisto, fornisci un fallback
                divisors.add(GameConstants.BASE_MIN_DIVISOR);
             }
        } else {
            while (divisors.size < numToGenerate) {
                divisors.add(Math.floor(Math.random() * uniqueNumbersInRange) + min);
            }
        }
        gameState.availableDivisors = Array.from(divisors);
    },

    resetGameForNextBlockLogic(isFullReset = false, numGroupsForReset = null) {
        if (isFullReset && numGroupsForReset !== null) {
            this.adjustDifficulty(numGroupsForReset);
        }
        this.generateRandomDivisors();
        gameState.selectedDivisor = null;
        gameState.currentlySelectedTxs = [];

        if (isFullReset) {
            gameState.timewall = [];
            gameState.lastWinningRemainder = null;
            this.initializeMempoolData();
        }
    },

    resetFullGameLogic(numGroups) {
        if (numGroups === undefined || numGroups === null) {
            numGroups = gameState.numberOfGroups || 1;
        }
        this.resetGameForNextBlockLogic(true, numGroups);
    },

    selectDivisorLogic(divisorValue) {
        if (gameState.timewall.length >= GameConstants.MAX_BLOCKS) return false;
        gameState.selectedDivisor = divisorValue;
        return true;
    },

    selectTransactionLogic(tx) {
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
        if (!poolName) return 0;
        const upperPoolName = poolName.toUpperCase();
        let asciiSum = 0;
        for (let i = 0; i < upperPoolName.length; i++) {
            asciiSum += upperPoolName.charCodeAt(i);
        }
        return asciiSum + GameConstants.ASCII_SUM_OFFSET;
    },

    calculateTxValue() {
        if (gameState.currentlySelectedTxs.length === 0) return 0;
        return gameState.currentlySelectedTxs.reduce((sum, tx) => sum + tx.description.length, 0);
    },

    attemptMineBlock(poolName, nonceStr) {
        const currentBlockNumberForAttempt = gameState.timewall.length + 1;
        let calculationDetails = {
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
        } else { // Blocco 3
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
            const winningRemainderForBlock = CalculatedRemainder;
            const newBlockEntry = {
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
                this.resetGameForNextBlockLogic(false);
            } else {
                calculationDetails.isGameEnd = true;
            }
        }
        return calculationDetails;
    }
};

GameLogic.initializeMempoolData();
