// js/logic.js

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
        { id: 'tx1', descriptionKey: 'common.gameConstants.transactions.tx1_desc', feeIconPath: './icons/fee1.png' },
        { id: 'tx2', descriptionKey: 'common.gameConstants.transactions.tx2_desc', feeIconPath: './icons/fee2.png' },
        { id: 'tx3', descriptionKey: 'common.gameConstants.transactions.tx3_desc', feeIconPath: './icons/fee3.png' },
        { id: 'tx4', descriptionKey: 'common.gameConstants.transactions.tx4_desc', feeIconPath: './icons/fee4.png' },
        { id: 'tx5', descriptionKey: 'common.gameConstants.transactions.tx5_desc', feeIconPath: './icons/fee5.png' },
        { id: 'tx6', descriptionKey: 'common.gameConstants.transactions.tx6_desc', feeIconPath: './icons/fee6.png' },
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
    TARGET_TIME_PER_BLOCK_MINUTES: 5,
    TIME_ADJUSTMENT_SENSITIVITY_PER_MINUTE: 1,
    MAX_TIME_BASED_DIFFICULTY_SHIFT: 5,
};

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
    blockStartTimestamp: null,
    lastTimeAdjustmentAmount: 0,
    timeTakenForLastBlockSeconds: null,
    divisorsRevealedAndTimerStarted: false,
};

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

export const ValidationManager = {
    validatePoolName(name) {
        if (!name) return { key: "common.errors.poolNameMissing" };
        if (name.length > GameConstants.POOL_NAME_MAX_LENGTH) {
            return { key: "common.errors.poolNameTooLong", params: { maxLength: GameConstants.POOL_NAME_MAX_LENGTH } };
        }
        if (name.includes(' ')) return { key: "common.errors.poolNameSpaces" };
        return null;
    },
    validateNonce(nonceStr) {
        const nonce = parseInt(nonceStr, 10);
        if (isNaN(nonce) || nonce < GameConstants.NONCE_MIN || nonce > GameConstants.NONCE_MAX) {
            return {
                key: "common.errors.nonceInvalid",
                params: { min: GameConstants.NONCE_MIN, max: GameConstants.NONCE_MAX }
            };
        }
        return null;
    }
};

export const GameLogic = {
    getCurrentState() {
        return {
            ...gameState,
            availableDivisors: [...gameState.availableDivisors],
            mempool: gameState.mempool.map(tx => ({...tx })),
            currentlySelectedTxs: gameState.currentlySelectedTxs.map(tx => ({...tx })),
            timewall: gameState.timewall.map(block => ({...block}))
        };
    },

    initializeMempoolData() {
        const shuffledIcons = [...GameConstants.TX_ICON_PATHS];
        Utils.shuffleArray(shuffledIcons);
        gameState.mempool = GameConstants.BASE_TX_DATA.map((txBase, index) => ({
            id: txBase.id,
            descriptionKey: txBase.descriptionKey,
            feeIconPath: shuffledIcons[index % shuffledIcons.length]
        }));
    },

    setInitialDifficultyByGroups(numGroups) {
        gameState.numberOfGroups = numGroups;
        let minDivTarget = GameConstants.BASE_MIN_DIVISOR +
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
        gameState.lastTimeAdjustmentAmount = 0;
        gameState.timeTakenForLastBlockSeconds = null;
        console.log(`[GameLogic] Difficoltà iniziale per ${numGroups} gruppi: Range Divisori [${gameState.currentMinDivisor}-${gameState.currentMaxDivisor}]`);
    },

    applyTimedDifficultyShift(timeTakenSeconds) {
        const targetSeconds = GameConstants.TARGET_TIME_PER_BLOCK_MINUTES * 60;
        const deviationMinutes = (timeTakenSeconds - targetSeconds) / 60;
        let difficultyShift = Math.round(deviationMinutes * GameConstants.TIME_ADJUSTMENT_SENSITIVITY_PER_MINUTE);
        difficultyShift = Math.max(-GameConstants.MAX_TIME_BASED_DIFFICULTY_SHIFT, Math.min(GameConstants.MAX_TIME_BASED_DIFFICULTY_SHIFT, difficultyShift));
        let newMinDivisor = gameState.currentMinDivisor - difficultyShift;
        let actualNewMinDiv = Math.max(GameConstants.MIN_DIVISOR_ABSOLUTE, newMinDivisor);
        actualNewMinDiv = Math.min(actualNewMinDiv, GameConstants.MAX_DIVISOR_ABSOLUTE - GameConstants.DIVISOR_RANGE_SPAN);
        if (GameConstants.MAX_DIVISOR_ABSOLUTE - GameConstants.DIVISOR_RANGE_SPAN < GameConstants.MIN_DIVISOR_ABSOLUTE) {
            actualNewMinDiv = GameConstants.MIN_DIVISOR_ABSOLUTE;
        }
        gameState.currentMinDivisor = actualNewMinDiv;
        gameState.currentMaxDivisor = gameState.currentMinDivisor + GameConstants.DIVISOR_RANGE_SPAN;
        gameState.currentMaxDivisor = Math.min(gameState.currentMaxDivisor, GameConstants.MAX_DIVISOR_ABSOLUTE);
        if (gameState.currentMinDivisor >= gameState.currentMaxDivisor) {
            gameState.currentMinDivisor = GameConstants.MIN_DIVISOR_ABSOLUTE;
            gameState.currentMaxDivisor = Math.min(GameConstants.MIN_DIVISOR_ABSOLUTE + 1, GameConstants.MAX_DIVISOR_ABSOLUTE);
            if (gameState.currentMinDivisor >= gameState.currentMaxDivisor) {
                gameState.currentMaxDivisor = GameConstants.MAX_DIVISOR_ABSOLUTE;
                gameState.currentMinDivisor = GameConstants.MAX_DIVISOR_ABSOLUTE;
            }
        }
        gameState.lastTimeAdjustmentAmount = -difficultyShift;
        gameState.timeTakenForLastBlockSeconds = timeTakenSeconds;
        console.log(`[GameLogic] Tempo impiegato: ${timeTakenSeconds.toFixed(1)}s. Deviazione: ${deviationMinutes.toFixed(1)}min. Shift difficoltà (su min_divisor): ${-difficultyShift}. Nuovo range: [${gameState.currentMinDivisor}-${gameState.currentMaxDivisor}]`);
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
             if (min === max) divisors.add(min);
             else divisors.add(GameConstants.BASE_MIN_DIVISOR);
        } else {
            while (divisors.size < numToGenerate) {
                divisors.add(Math.floor(Math.random() * uniqueNumbersInRange) + min);
            }
        }
        gameState.availableDivisors = Array.from(divisors);
    },

    startRoundTimerAndRevealDivisors() {
        if (!gameState.divisorsRevealedAndTimerStarted) {
            gameState.blockStartTimestamp = Date.now();
            gameState.divisorsRevealedAndTimerStarted = true;
            console.log("[GameLogic] Timer del round avviato e divisori rivelati.");
            return true;
        }
        return false;
    },

    resetGameForNextBlockLogic(isFullReset = false, numGroupsForReset = null) {
        if (isFullReset) {
            if (numGroupsForReset === null) {
                Utils.logError("numGroupsForReset è necessario per un reset completo.");
                this.setInitialDifficultyByGroups(gameState.numberOfGroups || 1);
            } else {
                this.setInitialDifficultyByGroups(numGroupsForReset);
            }
            gameState.timewall = [];
            gameState.lastWinningRemainder = null;
            this.initializeMempoolData();
        }
        this.generateRandomDivisors();
        gameState.selectedDivisor = null;
        gameState.currentlySelectedTxs = [];
        gameState.divisorsRevealedAndTimerStarted = false;
        if (isFullReset) {
            gameState.lastTimeAdjustmentAmount = 0;
            gameState.timeTakenForLastBlockSeconds = null;
        }
    },

    resetFullGameLogic(numGroups) {
        this.resetGameForNextBlockLogic(true, numGroups);
    },

    selectDivisorLogic(divisorValue) {
        if (gameState.timewall.length >= GameConstants.MAX_BLOCKS || !gameState.divisorsRevealedAndTimerStarted) return false;
        gameState.selectedDivisor = divisorValue;
        return true;
    },

    selectTransactionLogic(tx) {
        if (gameState.timewall.length >= GameConstants.MAX_BLOCKS || !gameState.divisorsRevealedAndTimerStarted) {
            return { success: false, messageKey: "common.errors.gameEndedOrRoundNotStarted" };
        }
        const currentBlockNumber = gameState.timewall.length + 1;
        if (currentBlockNumber !== 3) {
            return { success: false, messageKey: "common.errors.txOnlyBlock3" };
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
                return {
                    success: false,
                    messageKey: "common.errors.maxTxSelected",
                    messageParams: { maxTx: GameConstants.MAX_TX_FOR_BLOCK_3 }
                };
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
        if (typeof I18nManager === 'undefined' || typeof I18nManager.t !== 'function') {
            console.error("I18nManager o I18nManager.t non è disponibile in calculateTxValue. Le lunghezze potrebbero essere basate sulle chiavi.");
            return gameState.currentlySelectedTxs.reduce((sum, tx) => sum + (tx.descriptionKey ? tx.descriptionKey.length : 0), 0);
        }
        return gameState.currentlySelectedTxs.reduce((sum, tx) => {
            const translatedDescription = I18nManager.t(tx.descriptionKey);
            return sum + translatedDescription.length;
        }, 0);
    },

    attemptMineBlock(poolName, nonceStr) {
        if (!gameState.divisorsRevealedAndTimerStarted) {
            return { errorKey: "common.errors.revealDivisorsFirst", isSuccess: false };
        }
        const currentBlockNumberForAttempt = gameState.timewall.length + 1;
        let calculationDetails = {
            poolName: poolName || '',
            nonceInput: nonceStr || '',
            selectedDivisor: gameState.selectedDivisor,
            currentBlockNumber: currentBlockNumberForAttempt,
            lastWinningRemainder: (currentBlockNumberForAttempt > 1) ? gameState.lastWinningRemainder : null,
            selectedTransactionsForDisplay: (currentBlockNumberForAttempt === 3) ? gameState.currentlySelectedTxs.map(tx => tx.descriptionKey) : [],
            isSuccess: null,
            errorKey: null, errorParams: {},
            WR: 0, asciiSum: 0, proofFormula: '', proofValue: 0,
            calculatedRemainder: 0, targetRemainderValue: 0, txValue: 0,
            isGameEnd: false,
        };
        if (currentBlockNumberForAttempt > GameConstants.MAX_BLOCKS) {
            calculationDetails.errorKey = "index.messages.maxBlocksReached";
            calculationDetails.errorParams = { maxBlocks: GameConstants.MAX_BLOCKS };
            calculationDetails.isGameEnd = true;
            return calculationDetails;
        }
        const poolNameValidationError = ValidationManager.validatePoolName(poolName);
        if (poolNameValidationError) {
            calculationDetails.errorKey = poolNameValidationError.key;
            calculationDetails.errorParams = poolNameValidationError.params || {};
            return calculationDetails;
        }
        if (gameState.selectedDivisor === null) {
            calculationDetails.errorKey = "common.errors.selectDivisor";
            return calculationDetails;
        }
        const nonceValidationError = ValidationManager.validateNonce(nonceStr);
        if (nonceValidationError) {
            calculationDetails.errorKey = nonceValidationError.key;
            calculationDetails.errorParams = nonceValidationError.params || {};
            return calculationDetails;
        }
        const nonce = parseInt(nonceStr, 10);
        calculationDetails.nonce = nonce;
        if (currentBlockNumberForAttempt === 3 && gameState.currentlySelectedTxs.length > GameConstants.MAX_TX_FOR_BLOCK_3) {
             calculationDetails.errorKey = "common.errors.maxTxSelected";
             calculationDetails.errorParams = { maxTx: GameConstants.MAX_TX_FOR_BLOCK_3 };
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
                 calculationDetails.errorKey = "common.errors.prevRemainderMissingBlock2";
                 return calculationDetails;
            }
            Proof = (WR + nonce + gameState.lastWinningRemainder) * GameConstants.PROOF_MULTIPLIER;
            proofFormula = `(${WR} + ${nonce} + ${gameState.lastWinningRemainder}) * ${GameConstants.PROOF_MULTIPLIER}`;
        } else {
             if (gameState.lastWinningRemainder === null) {
                 calculationDetails.errorKey = "common.errors.prevRemainderMissingBlock3";
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
            gameState.timeTakenForLastBlockSeconds = timeTakenSeconds;
            const winningRemainderForBlock = CalculatedRemainder;
            const newBlockEntry = {
                id: `block-${Date.now()}-${gameState.timewall.length + 1}`,
                poolName: poolName,
                nonce: nonce,
                divisor: gameState.selectedDivisor,
                remainder: winningRemainderForBlock,
                previousRemainder: (currentBlockNumberForAttempt > 1) ? gameState.lastWinningRemainder : null,
                selectedTransactions: (currentBlockNumberForAttempt === 3) ? gameState.currentlySelectedTxs.map(tx => ({ id: tx.id, descriptionKey: tx.descriptionKey, feeIconPath: tx.feeIconPath })) : [],
                timestamp: new Date().toISOString(),
            };
            gameState.timewall.push(newBlockEntry);
            gameState.lastWinningRemainder = winningRemainderForBlock;
            if (gameState.timewall.length < GameConstants.MAX_BLOCKS) {
                this.applyTimedDifficultyShift(timeTakenSeconds);
                this.resetGameForNextBlockLogic(false);
            } else {
                calculationDetails.isGameEnd = true;
                gameState.lastTimeAdjustmentAmount = 0;
                gameState.timeTakenForLastBlockSeconds = null;
                gameState.divisorsRevealedAndTimerStarted = false;
            }
        }
        return calculationDetails;
    }
};

GameLogic.initializeMempoolData();
