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
    TX_ICON_PATHS: [ // Questi potrebbero essere più legati all'UI, ma li teniamo con BASE_TX_DATA per coerenza
        './icons/fee1.png', './icons/fee2.png', './icons/fee3.png',
        './icons/fee4.png', './icons/fee5.png', './icons/fee6.png'
    ],
};

// --- APPLICATION STATE ---
// Stato interno del gioco, non direttamente manipolabile dall'esterno se non tramite le funzioni di GameLogic
let gameState = {
    availableDivisors: [],
    selectedDivisor: null,
    mempool: [], // Contiene gli oggetti transazione completi (con iconPath)
    currentlySelectedTxs: [], // Contiene gli oggetti transazione selezionati
    timewall: [],
    lastWinningRemainder: null,
};

// --- UTILITY FUNCTIONS (Logica Pura) ---
const Utils = {
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },
    // logError è più un'utility di debugging, potrebbe stare anche in ui.js se usata solo lì
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
    // Funzione per ottenere una copia dello stato corrente (per evitare modifiche dirette)
    getCurrentState() {
        return {
            ...gameState,
            // Restituisce copie degli array per evitare mutazioni esterne dirette
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

    generateRandomDivisors() {
        const divisors = new Set();
        while (divisors.size < 8) { // Genera 8 divisori unici
            divisors.add(Math.floor(Math.random() * (22 - 11 + 1)) + 11); // Range 11-22
        }
        gameState.availableDivisors = Array.from(divisors);
    },

    resetGameForNextBlockLogic(isFullReset = false) {
        this.generateRandomDivisors();
        gameState.selectedDivisor = null;
        gameState.currentlySelectedTxs = [];

        if (isFullReset) {
            gameState.timewall = [];
            gameState.lastWinningRemainder = null;
            this.initializeMempoolData(); // Reinizializza mempool solo su reset completo
        }
    },

    resetFullGameLogic() {
        this.resetGameForNextBlockLogic(true);
    },

    selectDivisorLogic(divisorValue) {
        if (gameState.timewall.length >= GameConstants.MAX_BLOCKS) return false; // Non fare nulla se il gioco è finito
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
            calculatedRemainder: 0, targetRemainderValue: 0, txValue: 0
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
            if (gameState.lastWinningRemainder === null) { // Sanity check
                 calculationDetails.error = "Errore: Resto del blocco precedente non disponibile per il Blocco 2.";
                 return calculationDetails;
            }
            Proof = (WR + nonce + gameState.lastWinningRemainder) * GameConstants.PROOF_MULTIPLIER;
            proofFormula = `(${WR} + ${nonce} + ${gameState.lastWinningRemainder}) * ${GameConstants.PROOF_MULTIPLIER}`;
        } else { // Blocco 3
             if (gameState.lastWinningRemainder === null) { // Sanity check
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
                calculationDetails.isGameEnd = true; // Segnala la fine del gioco
            }
        }
        return calculationDetails;
    }
};

// Inizializza lo stato del gioco la prima volta che il modulo viene caricato
GameLogic.resetFullGameLogic();
