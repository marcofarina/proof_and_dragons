// script.js for Proof & Dragons

// --- CONSTANTS ---
const Constants = {
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
    MESSAGE_TIMEOUT_DEFAULT: 4000,
    MESSAGE_FADEOUT_DURATION: 300,
    MANUAL_URL: './manuale.html',
    GITHUB_URL: 'https://github.com/marcofarina/proofdragons', // Placeholder GitHub URL
};

// --- APPLICATION STATE ---
const AppState = {
    availableDivisors: [],
    selectedDivisor: null,
    mempool: [],
    currentlySelectedTxs: [],
    timewall: [],
    lastWinningRemainder: null,
    messageTimeoutId: null,
    isDarkMode: false,
    isMenuOpen: false,
};

// --- DOM ELEMENTS ---
const DOMElements = {
    html: document.documentElement,
    body: document.body,
    themeToggle: null,
    themeIconSun: null,
    themeIconMoon: null,
    menuToggle: null,
    appMenu: null,
    manualLink: null,
    githubLink: null,
    resetGameButton: null,
    poolNameInput: null,
    nonceInput: null,
    verifyAttemptButton: null,
    divisorGrid: null,
    mempoolGrid: null,
    timewallChain: null,
    timewallChainContainer: null,
    messageArea: null,
    calculationDetailsBox: null,
    calculationDetailsContainer: null,
};

// --- UTILITY FUNCTIONS ---
const Utils = {
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },
    escapeHTML(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[&<>"']/g, match => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[match]));
    },
    logError(message, error) {
        console.error(message, error);
    }
};

// --- THEME MANAGER ---
const ThemeManager = {
    init() {
        DOMElements.themeToggle = document.getElementById('themeToggle');
        DOMElements.themeIconSun = document.getElementById('themeIconSun');
        DOMElements.themeIconMoon = document.getElementById('themeIconMoon');

        if (!DOMElements.themeToggle || !DOMElements.themeIconSun || !DOMElements.themeIconMoon) {
            Utils.logError("[ThemeManager.init] Theme-related DOM elements not found.");
            return;
        }
        this.loadTheme();
        DOMElements.themeToggle.addEventListener('click', () => this.toggleTheme());
    },
    applyTheme(theme) {
        AppState.isDarkMode = theme === 'dark';
        if (AppState.isDarkMode) {
            DOMElements.html.classList.add('dark');
            DOMElements.themeIconSun.classList.remove('hidden');
            DOMElements.themeIconMoon.classList.add('hidden');
            DOMElements.themeToggle.setAttribute('aria-pressed', 'true');
        } else {
            DOMElements.html.classList.remove('dark');
            DOMElements.themeIconSun.classList.add('hidden');
            DOMElements.themeIconMoon.classList.remove('hidden');
            DOMElements.themeToggle.setAttribute('aria-pressed', 'false');
        }
    },
    toggleTheme() {
        const newTheme = DOMElements.html.classList.contains('dark') ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        this.applyTheme(newTheme);
    },
    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const themeToApply = savedTheme || systemTheme;
        this.applyTheme(themeToApply);
    }
};

// --- MENU MANAGER ---
const MenuManager = {
    init() {
        DOMElements.menuToggle = document.getElementById('menuToggle');
        DOMElements.appMenu = document.getElementById('appMenu');
        DOMElements.manualLink = document.getElementById('manualLink');
        DOMElements.githubLink = document.getElementById('githubLink');
        DOMElements.resetGameButton = document.getElementById('resetGameButton');

        if (!DOMElements.menuToggle || !DOMElements.appMenu || !DOMElements.resetGameButton || !DOMElements.manualLink || !DOMElements.githubLink) {
            Utils.logError("[MenuManager.init] Menu-related DOM elements not found.");
            return;
        }

        DOMElements.manualLink.href = Constants.MANUAL_URL;
        DOMElements.githubLink.href = Constants.GITHUB_URL;

        DOMElements.menuToggle.addEventListener('click', () => this.toggleMenu());
        DOMElements.resetGameButton.addEventListener('click', () => {
            GameLogic.resetFullGame();
            this.closeMenu();
        });

        // Close menu if clicking outside
        document.addEventListener('click', (event) => {
            if (AppState.isMenuOpen &&
                !DOMElements.appMenu.contains(event.target) &&
                !DOMElements.menuToggle.contains(event.target)) {
                this.closeMenu();
            }
        });
    },
    toggleMenu() {
        AppState.isMenuOpen = !AppState.isMenuOpen;
        if (AppState.isMenuOpen) {
            this.openMenu();
        } else {
            this.closeMenu();
        }
    },
    openMenu() {
        AppState.isMenuOpen = true;
        DOMElements.appMenu.classList.remove('hidden');
        DOMElements.appMenu.classList.add('menu-active');
        DOMElements.menuToggle.setAttribute('aria-expanded', 'true');
        this.updateResetButtonVisibility();
    },
    closeMenu() {
        AppState.isMenuOpen = false;
        DOMElements.appMenu.classList.remove('menu-active');
        // Delay hiding to allow for transition
        setTimeout(() => {
            if (!AppState.isMenuOpen) { // Check again in case it was reopened quickly
                DOMElements.appMenu.classList.add('hidden');
            }
        }, 200); // Match transition duration in CSS
        DOMElements.menuToggle.setAttribute('aria-expanded', 'false');
    },
    updateResetButtonVisibility() {
        if (AppState.timewall.length >= Constants.MAX_BLOCKS) {
            DOMElements.resetGameButton.classList.remove('hidden');
            DOMElements.resetGameButton.classList.add('visible');
        } else {
            DOMElements.resetGameButton.classList.add('hidden');
            DOMElements.resetGameButton.classList.remove('visible');
        }
    }
};

// --- UI MANAGER ---
const UIManager = {
    init() {
        DOMElements.poolNameInput = document.getElementById('poolName');
        DOMElements.nonceInput = document.getElementById('nonce');
        DOMElements.verifyAttemptButton = document.getElementById('verifyAttempt');
        DOMElements.divisorGrid = document.getElementById('divisorGrid');
        DOMElements.mempoolGrid = document.getElementById('mempoolGrid');
        DOMElements.timewallChain = document.getElementById('timewallChain');
        DOMElements.timewallChainContainer = document.getElementById('timewallChainContainer');
        DOMElements.messageArea = document.getElementById('messageArea');
        DOMElements.calculationDetailsBox = document.getElementById('calculationDetailsBox');
        DOMElements.calculationDetailsContainer = document.getElementById('calculationDetailsContainer');
    },

    renderDivisors() {
        if (!DOMElements.divisorGrid) return;
        DOMElements.divisorGrid.innerHTML = '';
        AppState.availableDivisors.forEach(value => {
            const item = document.createElement('div');
            item.className = `divisor-item p-3 sm:p-4 aspect-square bg-gray-200 dark:bg-gray-700 border-2 border-purple-400 dark:border-purple-500 rounded-lg flex items-center justify-center text-2xl sm:text-3xl font-bold cursor-pointer hover:bg-purple-300 dark:hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-gray-800 dark:text-gray-100`;
            item.textContent = value;
            item.dataset.value = value;

            if (value === AppState.selectedDivisor) {
                item.classList.add('active', 'bg-purple-400', 'dark:bg-purple-700', 'border-yellow-500', 'dark:border-yellow-400', 'shadow-lg', 'dark:shadow-yellow-400/30');
            }
            item.addEventListener('click', () => GameLogic.handleDivisorSelect(value));
            item.setAttribute('tabindex', '0');
            item.setAttribute('role', 'button');
            item.setAttribute('aria-pressed', value === AppState.selectedDivisor ? 'true' : 'false');
            item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') GameLogic.handleDivisorSelect(value); });
            DOMElements.divisorGrid.appendChild(item);
        });
    },

    renderMempoolItems() {
        if (!DOMElements.mempoolGrid) return;
        DOMElements.mempoolGrid.innerHTML = '';
        AppState.mempool.forEach(tx => {
            const item = document.createElement('div');
            item.className = `tx-item p-3 sm:p-4 bg-gray-200 dark:bg-gray-700 border-2 border-teal-400 dark:border-teal-500 rounded-lg cursor-pointer hover:bg-teal-300 dark:hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 flex flex-col items-center justify-center text-center text-gray-800 dark:text-gray-100`;
            item.dataset.id = tx.id;

            const descContainer = document.createElement('div');
            const desc = document.createElement('span');
            desc.className = 'text-sm sm:text-base leading-tight block';
            desc.textContent = `${tx.description} (${tx.description.length})`;

            const feeIconImg = document.createElement('img');
            feeIconImg.src = tx.feeIconPath;
            feeIconImg.alt = tx.description;
            feeIconImg.className = 'tx-icon';
            feeIconImg.onerror = () => {
                Utils.logError(`Failed to load image: ${tx.feeIconPath}`);
                feeIconImg.alt = "Icona non caricata";
            };

            descContainer.appendChild(desc);
            item.appendChild(descContainer);
            item.appendChild(feeIconImg);

            const isSelected = AppState.currentlySelectedTxs.find(selected => selected.id === tx.id);
            if (isSelected) {
                item.classList.add('selected', 'bg-teal-400', 'dark:bg-teal-700', 'border-green-500', 'dark:border-green-400', 'shadow-lg', 'dark:shadow-green-400/30');
            }
            item.addEventListener('click', () => GameLogic.handleTransactionSelect(tx));
            item.setAttribute('tabindex', '0');
            item.setAttribute('role', 'checkbox');
            item.setAttribute('aria-checked', isSelected ? 'true' : 'false');
            item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') GameLogic.handleTransactionSelect(tx); });
            DOMElements.mempoolGrid.appendChild(item);
        });
    },

    renderTimewall() {
        if (!DOMElements.timewallChain) return;
        DOMElements.timewallChain.innerHTML = '';

        for (let i = 0; i < Constants.MAX_BLOCKS; i++) {
            if (AppState.timewall[i]) {
                const block = AppState.timewall[i];
                const blockCard = document.createElement('div');
                blockCard.className = 'block-card bg-white dark:bg-gray-700 p-4 sm:p-5 rounded-lg shadow-lg border border-gray-300 dark:border-gray-600 flex-shrink-0 flex flex-col text-gray-800 dark:text-gray-100';

                let transactionsHTML = 'N/A';
                if (block.selectedTransactions && block.selectedTransactions.length > 0) {
                    transactionsHTML = block.selectedTransactions.map(tx =>
                        `<span class="tooltip text-sm bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-2 py-1 rounded-md mr-1.5 mb-1.5 inline-block">${Utils.escapeHTML(tx.description.split(' ')[0])}...<span class="tooltiptext bg-gray-700 dark:bg-gray-800 text-white">${Utils.escapeHTML(tx.description)}</span></span>`
                    ).join('');
                } else if (i + 1 === 3) {
                    transactionsHTML = 'Nessuna Selezionata';
                }

                let remainderHTML;
                if (i === 0 || i === 1) {
                    remainderHTML = `
                        <div class="mt-2 mb-1 p-3 border-2 border-yellow-500 dark:border-yellow-400 rounded-lg bg-yellow-50 dark:bg-gray-600/50 shadow-inner">
                            <p class="text-base font-semibold text-gray-700 dark:text-gray-200 text-center">Resto per Blocco Successivo:</p>
                            <p class="text-3xl font-bold text-yellow-600 dark:text-yellow-300 text-center tracking-wider">${block.remainder}</p>
                        </div>`;
                } else {
                    remainderHTML = `<p><strong class="text-gray-700 dark:text-gray-200">Resto Vincente:</strong> <span class="font-semibold text-orange-600 dark:text-orange-300">${block.remainder}</span></p>`;
                }

                const safePoolName = Utils.escapeHTML(block.poolName);

                blockCard.innerHTML = `
                    <h3 class="text-xl sm:text-2xl font-semibold text-orange-500 dark:text-orange-400 mb-3">Blocco #${i + 1}</h3>
                    <div class="text-sm sm:text-base space-y-2 text-gray-600 dark:text-gray-300 flex-grow">
                        <p><strong class="text-gray-800 dark:text-gray-200">Pool:</strong> ${safePoolName}</p>
                        <p><strong class="text-gray-800 dark:text-gray-200">Nonce:</strong> ${block.nonce}</p>
                        <p><strong class="text-gray-800 dark:text-gray-200">Divisore Usato:</strong> ${block.divisor}</p>
                        ${remainderHTML}
                        ${i > 0 ? `<p><strong class="text-gray-800 dark:text-gray-200">Resto Prec.:</strong> ${block.previousRemainder}</p>` : ''}
                        ${i + 1 === 3 ? `<div class="mt-1.5"><strong class="text-gray-800 dark:text-gray-200">Transazioni:</strong><div class="flex flex-wrap mt-1">${transactionsHTML}</div></div>` : ''}
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-500 mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">${new Date(block.timestamp).toLocaleTimeString()}</p>
                `;
                DOMElements.timewallChain.appendChild(blockCard);
            } else {
                const placeholderSlot = document.createElement('div');
                placeholderSlot.className = 'timewall-placeholder-slot flex-shrink-0 border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/10 text-gray-500 dark:text-gray-500';
                placeholderSlot.textContent = `Blocco #${i + 1} non ancora minato`;
                DOMElements.timewallChain.appendChild(placeholderSlot);
            }
        }
        if (DOMElements.timewallChainContainer) {
            DOMElements.timewallChainContainer.classList.toggle("overflow-y-auto", AppState.timewall.length > 0 || Constants.MAX_BLOCKS > 0);
        }
        if (DOMElements.timewallChain.lastChild) {
            DOMElements.timewallChain.lastChild.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' });
        }
    },

    renderCalculationDetails(details) {
        if (!DOMElements.calculationDetailsBox || !DOMElements.calculationDetailsContainer) return;
        DOMElements.calculationDetailsBox.innerHTML = '';

        if (details.initialState) {
            DOMElements.calculationDetailsBox.innerHTML = '<p class="text-gray-500 dark:text-gray-400">Effettua una verifica per visualizzare i dettagli del calcolo qui.</p>';
            DOMElements.calculationDetailsContainer.classList.remove('border-green-400', 'dark:border-green-500', 'border-red-400', 'dark:border-red-500');
            DOMElements.calculationDetailsContainer.classList.add('border-gray-300', 'dark:border-gray-700');
            return;
        }

        const createDetailLine = (label, value) => {
            const p = document.createElement('p');
            const strong = document.createElement('strong');
            strong.className = 'text-gray-700 dark:text-gray-200';
            strong.textContent = `${label}: `;
            const span = document.createElement('span');
            span.className = 'text-gray-800 dark:text-gray-100';
            span.textContent = value;
            p.appendChild(strong);
            p.appendChild(span);
            return p;
        };
        const createFormulaLine = (label, formula, result) => {
            const p = document.createElement('p');
            p.innerHTML = `<strong class="text-gray-700 dark:text-gray-200">${Utils.escapeHTML(label)}:</strong> <span class="text-gray-500 dark:text-gray-400">${Utils.escapeHTML(formula)}</span> = <span class="font-semibold text-gray-800 dark:text-gray-100">${Utils.escapeHTML(String(result))}</span>`;
            return p;
        };

        if (details.error) {
            const errorP = document.createElement('p');
            errorP.className = 'text-red-600 dark:text-red-400 font-semibold';
            errorP.textContent = `Errore: ${details.error}`;
            DOMElements.calculationDetailsBox.appendChild(errorP);
            if (details.poolName !== undefined) DOMElements.calculationDetailsBox.appendChild(createDetailLine('Nome Pool Inserito', details.poolName || 'N/A'));
            if (details.nonce !== undefined) DOMElements.calculationDetailsBox.appendChild(createDetailLine('Nonce Inserito', details.nonce || 'N/A'));
            if (details.selectedDivisor !== undefined) DOMElements.calculationDetailsBox.appendChild(createDetailLine('Divisore Selezionato', details.selectedDivisor || 'N/A'));
        } else {
            DOMElements.calculationDetailsBox.appendChild(createDetailLine('Nome Pool', Utils.escapeHTML(details.poolName)));
            DOMElements.calculationDetailsBox.appendChild(createDetailLine('Nonce Inserito', details.nonce));
            DOMElements.calculationDetailsBox.appendChild(createDetailLine('Divisore Selezionato (D)', details.selectedDivisor));
            if (details.currentBlockNumber > 1 && details.lastWinningRemainder !== null) {
                DOMElements.calculationDetailsBox.appendChild(createDetailLine('Resto Blocco Precedente', details.lastWinningRemainder));
            }
            if (details.currentBlockNumber === 3) {
                DOMElements.calculationDetailsBox.appendChild(createDetailLine('Transazioni Selezionate', details.selectedTransactions.map(tx => Utils.escapeHTML(tx)).join(', ') || 'Nessuna'));
                DOMElements.calculationDetailsBox.appendChild(createDetailLine('Valore Transazioni (txValue)', details.txValue));
            }
            const poolNameForWR = (details.poolName && typeof details.poolName === 'string') ? details.poolName.toUpperCase() : 'N/D';
            DOMElements.calculationDetailsBox.appendChild(createFormulaLine('WR', `${details.asciiSum} (Somma ASCII di '${Utils.escapeHTML(poolNameForWR)}') + ${Constants.ASCII_SUM_OFFSET}`, details.WR));
            DOMElements.calculationDetailsBox.appendChild(createFormulaLine('Proof', details.proofFormula, details.proofValue));
            DOMElements.calculationDetailsBox.appendChild(createFormulaLine('Resto Calcolato', `${details.proofValue} % ${details.selectedDivisor}`, details.calculatedRemainder));
            DOMElements.calculationDetailsBox.appendChild(createFormulaLine('Soglia Target', `${details.selectedDivisor} - ${Constants.TARGET_REMAINDER_OFFSET}`, details.targetRemainderValue));

            const outcomeLine = document.createElement('p');
            outcomeLine.innerHTML = `<strong class="text-gray-700 dark:text-gray-200">Esito:</strong> Resto Calcolato (${details.calculatedRemainder}) &ge; Soglia Target (${details.targetRemainderValue})?<br><span class="font-bold ${details.isSuccess ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}">${details.isSuccess ? 'SUCCESSO' : 'FALLIMENTO'}</span>`;
            DOMElements.calculationDetailsBox.appendChild(outcomeLine);
        }

        DOMElements.calculationDetailsContainer.classList.remove('border-gray-300', 'dark:border-gray-700', 'border-green-400', 'dark:border-green-500', 'border-red-400', 'dark:border-red-500');
        if (details.isSuccess === true) {
            DOMElements.calculationDetailsContainer.classList.add('border-green-400', 'dark:border-green-500');
        } else if (details.isSuccess === false) {
            DOMElements.calculationDetailsContainer.classList.add('border-red-400', 'dark:border-red-500');
        } else {
            DOMElements.calculationDetailsContainer.classList.add('border-gray-300', 'dark:border-gray-700');
        }
    },

    displayMessage(message, type = 'info', duration = Constants.MESSAGE_TIMEOUT_DEFAULT) {
        if (!DOMElements.messageArea) return;
        clearTimeout(AppState.messageTimeoutId);
        DOMElements.messageArea.textContent = message;
        DOMElements.messageArea.className = 'fixed bottom-5 right-5 text-white p-4 sm:p-5 rounded-lg shadow-xl max-w-sm sm:max-w-md text-base sm:text-lg z-50 transition-opacity duration-300 ease-out';

        switch (type) {
            case 'success': DOMElements.messageArea.classList.add('bg-green-500', 'dark:bg-green-600'); break;
            case 'warn': DOMElements.messageArea.classList.add('bg-yellow-400', 'dark:bg-yellow-500'); break;
            case 'error': DOMElements.messageArea.classList.add('bg-red-500', 'dark:bg-red-600'); break;
            default: DOMElements.messageArea.classList.add('bg-blue-500', 'dark:bg-blue-600'); break;
        }
        DOMElements.messageArea.style.display = 'block';
        DOMElements.messageArea.style.opacity = '0';

        void DOMElements.messageArea.offsetWidth;

        DOMElements.messageArea.style.opacity = '1';

        AppState.messageTimeoutId = setTimeout(() => {
            DOMElements.messageArea.style.opacity = '0';
            setTimeout(() => {
                if (DOMElements.messageArea.style.opacity === '0') {
                    DOMElements.messageArea.style.display = 'none';
                }
            }, Constants.MESSAGE_FADEOUT_DURATION);
        }, duration);
    },

    updateMempoolDisplay() {
        if (!DOMElements.mempoolGrid) return;
        const nextBlockNumber = AppState.timewall.length + 1;
        if (nextBlockNumber === 3 && AppState.timewall.length < Constants.MAX_BLOCKS) {
            this.renderMempoolItems();
        } else {
            DOMElements.mempoolGrid.innerHTML = '';
            const placeholderMessage = document.createElement('p');
            placeholderMessage.className = 'text-gray-500 dark:text-gray-400 text-base text-center col-span-full h-full flex items-center justify-center';
            placeholderMessage.textContent = 'Disponibile dopo il Blocco 2';
            DOMElements.mempoolGrid.appendChild(placeholderMessage);
        }
    },

    updateVerificationInputsState() {
        const isGameOver = AppState.timewall.length >= Constants.MAX_BLOCKS;
        DOMElements.poolNameInput.disabled = isGameOver;
        DOMElements.nonceInput.disabled = isGameOver;
        DOMElements.verifyAttemptButton.disabled = isGameOver;

        if (isGameOver) {
            DOMElements.verifyAttemptButton.classList.add('opacity-50', 'cursor-not-allowed');
            DOMElements.verifyAttemptButton.classList.remove('hover:bg-cyan-600', 'dark:hover:bg-cyan-700');
        } else {
            DOMElements.verifyAttemptButton.classList.remove('opacity-50', 'cursor-not-allowed');
            DOMElements.verifyAttemptButton.classList.add('hover:bg-cyan-600', 'dark:hover:bg-cyan-700');
        }
        MenuManager.updateResetButtonVisibility(); // Update reset button based on game state
    },

    toggleFullScreen() {
        if (!document.fullscreenElement) {
            DOMElements.html.requestFullscreen().catch(err => {
                this.displayMessage(`Fullscreen non disponibile o negato. (${err.message})`, "warn");
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
};

// --- VALIDATION MANAGER ---
const ValidationManager = {
    validatePoolName(name) {
        if (!name) return "Nome Pool mancante.";
        if (name.length > Constants.POOL_NAME_MAX_LENGTH) return `Nome Pool: massimo ${Constants.POOL_NAME_MAX_LENGTH} caratteri.`;
        if (name.includes(' ')) return "Nome Pool: non deve contenere spazi.";
        return null;
    },
    validateNonce(nonceStr) {
        const nonce = parseInt(nonceStr, 10);
        if (isNaN(nonce) || nonce < Constants.NONCE_MIN || nonce > Constants.NONCE_MAX) {
            return `Il Nonce deve essere un numero valido tra ${Constants.NONCE_MIN} e ${Constants.NONCE_MAX}.`;
        }
        return null;
    }
};

// --- GAME LOGIC ---
const GameLogic = {
    init() {
        ThemeManager.init();
        MenuManager.init(); // Initialize menu before other UI that might depend on its state
        UIManager.init();

        this.resetFullGame(); // Start with a fresh game state

        this.setupEventListeners();
        // Initial message moved to resetFullGame to avoid double messaging on init/reset
    },

    setupEventListeners() {
        DOMElements.verifyAttemptButton.addEventListener('click', () => this.handleVerifyAttempt());

        document.addEventListener('keydown', (event) => {
            if (event.key.toUpperCase() === 'F') {
                if (document.activeElement === DOMElements.poolNameInput || document.activeElement === DOMElements.nonceInput) {
                    return;
                }
                if (!event.ctrlKey && !event.metaKey && !event.altKey) {
                    event.preventDefault();
                    UIManager.toggleFullScreen();
                }
            }
            if (event.key === 'Escape' && AppState.isMenuOpen) {
                MenuManager.closeMenu();
            }
        });

        DOMElements.poolNameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); DOMElements.verifyAttemptButton.click(); }});
        DOMElements.nonceInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); DOMElements.verifyAttemptButton.click(); }});
    },

    initializeMempoolData() {
        const shuffledIcons = [...Constants.TX_ICON_PATHS];
        Utils.shuffleArray(shuffledIcons);
        return Constants.BASE_TX_DATA.map((txBase, index) => ({
            ...txBase,
            feeIconPath: shuffledIcons[index % shuffledIcons.length]
        }));
    },

    generateRandomDivisors() {
        const divisors = new Set();
        while (divisors.size < 8) {
            divisors.add(Math.floor(Math.random() * (22 - 11 + 1)) + 11);
        }
        return Array.from(divisors);
    },

    resetGameForNextBlock(isFullReset = false) {
        AppState.availableDivisors = this.generateRandomDivisors();
        AppState.selectedDivisor = null;
        AppState.currentlySelectedTxs = [];
        if(DOMElements.poolNameInput) DOMElements.poolNameInput.value = '';
        if(DOMElements.nonceInput) DOMElements.nonceInput.value = '';

        if (isFullReset) {
            AppState.timewall = [];
            AppState.lastWinningRemainder = null;
        }
    },

    resetFullGame() {
        this.resetGameForNextBlock(true); // true indicates a full reset
        AppState.mempool = this.initializeMempoolData(); // Re-initialize mempool for a new game

        UIManager.renderDivisors();
        UIManager.renderTimewall();
        UIManager.updateMempoolDisplay();
        UIManager.updateVerificationInputsState(); // This will also update reset button visibility via MenuManager
        UIManager.renderCalculationDetails({ initialState: true });
        UIManager.displayMessage("Nuova partita! Seleziona un divisore per iniziare.", "info", 5000);
    },

    handleDivisorSelect(divisorValue) {
        if (AppState.timewall.length >= Constants.MAX_BLOCKS) return;
        AppState.selectedDivisor = divisorValue;
        UIManager.renderDivisors();
        UIManager.displayMessage(`Divisore ${AppState.selectedDivisor} selezionato.`, 'info', 2000);
    },

    handleTransactionSelect(tx) {
        if (AppState.timewall.length >= Constants.MAX_BLOCKS) return;
        const index = AppState.currentlySelectedTxs.findIndex(selected => selected.id === tx.id);
        if (index > -1) {
            AppState.currentlySelectedTxs.splice(index, 1);
        } else {
            if (AppState.currentlySelectedTxs.length < Constants.MAX_TX_FOR_BLOCK_3) {
                AppState.currentlySelectedTxs.push(tx);
            } else {
                UIManager.displayMessage(`Puoi selezionare un massimo di ${Constants.MAX_TX_FOR_BLOCK_3} transazioni.`, "warn");
                return;
            }
        }
        UIManager.renderMempoolItems();
    },

    calculateWR(poolName) {
        if (!poolName) return 0;
        const upperPoolName = poolName.toUpperCase();
        let asciiSum = 0;
        for (let i = 0; i < upperPoolName.length; i++) {
            asciiSum += upperPoolName.charCodeAt(i);
        }
        return asciiSum + Constants.ASCII_SUM_OFFSET;
    },

    calculateTxValue() {
        if (AppState.currentlySelectedTxs.length === 0) return 0;
        return AppState.currentlySelectedTxs.reduce((sum, tx) => sum + tx.description.length, 0);
    },

    handleVerifyAttempt() {
        try {
            const currentBlockNumberForAttempt = AppState.timewall.length + 1;
            if (currentBlockNumberForAttempt > Constants.MAX_BLOCKS) {
                UIManager.displayMessage(`Massimo di ${Constants.MAX_BLOCKS} blocchi già minati. Sessione di gioco completa.`, "info");
                return;
            }

            const poolName = DOMElements.poolNameInput.value.trim();
            const nonceStr = DOMElements.nonceInput.value;

            let calculationDataForDisplay = {
                poolName: poolName || '',
                nonce: parseInt(nonceStr,10) || 'N/D',
                selectedDivisor: AppState.selectedDivisor === null ? 'N/D' : AppState.selectedDivisor,
                currentBlockNumber: currentBlockNumberForAttempt,
                lastWinningRemainder: (currentBlockNumberForAttempt > 1) ? AppState.lastWinningRemainder : null,
                selectedTransactions: (currentBlockNumberForAttempt === 3) ? AppState.currentlySelectedTxs.map(tx => `${tx.description} (${tx.description.length})`) : [],
                isSuccess: null
            };

            const poolNameError = ValidationManager.validatePoolName(poolName);
            if (poolNameError) {
                UIManager.displayMessage(poolNameError, "error");
                calculationDataForDisplay.error = poolNameError;
                UIManager.renderCalculationDetails(calculationDataForDisplay);
                DOMElements.poolNameInput.focus();
                return;
            }

            if (AppState.selectedDivisor === null) {
                const errorMsg = "Per favore, seleziona un Divisore.";
                UIManager.displayMessage(errorMsg, "error");
                calculationDataForDisplay.error = errorMsg;
                UIManager.renderCalculationDetails(calculationDataForDisplay);
                return;
            }

            const nonceError = ValidationManager.validateNonce(nonceStr);
            if (nonceError) {
                UIManager.displayMessage(nonceError, "error");
                calculationDataForDisplay.error = nonceError;
                UIManager.renderCalculationDetails(calculationDataForDisplay);
                DOMElements.nonceInput.focus();
                return;
            }
            const nonce = parseInt(nonceStr, 10);

            if (currentBlockNumberForAttempt === 3 && AppState.currentlySelectedTxs.length > Constants.MAX_TX_FOR_BLOCK_3) {
                const errorMsg = `Per favore, seleziona un massimo di ${Constants.MAX_TX_FOR_BLOCK_3} Transazioni per il Blocco 3.`;
                UIManager.displayMessage(errorMsg, "error");
                calculationDataForDisplay.error = errorMsg;
                UIManager.renderCalculationDetails(calculationDataForDisplay);
                return;
            }

            const WR = this.calculateWR(poolName);
            const asciiSum = WR - Constants.ASCII_SUM_OFFSET;
            const txValue = (currentBlockNumberForAttempt === 3) ? this.calculateTxValue() : 0;
            let Proof;
            let proofFormula = "";

            if (currentBlockNumberForAttempt === 1) {
                Proof = (WR + nonce) * Constants.PROOF_MULTIPLIER;
                proofFormula = `(${WR} + ${nonce}) * ${Constants.PROOF_MULTIPLIER}`;
            } else if (currentBlockNumberForAttempt === 2) {
                Proof = (WR + nonce + AppState.lastWinningRemainder) * Constants.PROOF_MULTIPLIER;
                proofFormula = `(${WR} + ${nonce} + ${AppState.lastWinningRemainder}) * ${Constants.PROOF_MULTIPLIER}`;
            } else {
                Proof = (WR + nonce + AppState.lastWinningRemainder + txValue) * Constants.PROOF_MULTIPLIER;
                proofFormula = `(${WR} + ${nonce} + ${AppState.lastWinningRemainder} + ${txValue}) * ${Constants.PROOF_MULTIPLIER}`;
            }
            const CalculatedRemainder = Proof % AppState.selectedDivisor;
            let TargetRemainder = AppState.selectedDivisor - Constants.TARGET_REMAINDER_OFFSET;
            const isSuccess = (CalculatedRemainder >= TargetRemainder);

            calculationDataForDisplay = {
                ...calculationDataForDisplay,
                poolName: poolName,
                nonce: nonce,
                txValue: txValue, WR: WR, asciiSum: asciiSum,
                proofFormula: proofFormula, proofValue: Proof,
                calculatedRemainder: CalculatedRemainder, targetRemainderValue: TargetRemainder,
                isSuccess: isSuccess, error: null
            };
            UIManager.renderCalculationDetails(calculationDataForDisplay);

            if (isSuccess) {
                const winningRemainderForBlock = CalculatedRemainder;
                UIManager.displayMessage(`Blocco Minato con Successo! Resto Calcolato: ${CalculatedRemainder} (Soglia: >= ${TargetRemainder})`, "success");
                const newBlockEntry = {
                    id: `block-${Date.now()}-${AppState.timewall.length + 1}`,
                    poolName: poolName, nonce: nonce, divisor: AppState.selectedDivisor,
                    remainder: winningRemainderForBlock,
                    previousRemainder: (currentBlockNumberForAttempt > 1) ? AppState.lastWinningRemainder : null,
                    selectedTransactions: (currentBlockNumberForAttempt === 3) ? [...AppState.currentlySelectedTxs] : [],
                    timestamp: new Date().toISOString(),
                };
                AppState.timewall.push(newBlockEntry);
                AppState.lastWinningRemainder = winningRemainderForBlock;

                this.resetGameForNextBlock(false); // Reset inputs and selections for the next block
                UIManager.renderDivisors(); // Render new divisors
                UIManager.renderTimewall(); // Render the new block

                if (AppState.timewall.length < Constants.MAX_BLOCKS) {
                    UIManager.displayMessage("Nuovi divisori generati. Seleziona un divisore per il prossimo blocco!", "info", 3000);
                } else {
                    UIManager.displayMessage(`Tutti i ${Constants.MAX_BLOCKS} blocchi minati! Sessione di gioco completa. Apri il menu per ricominciare.`, "success", 6000);
                }
                UIManager.updateMempoolDisplay();
                UIManager.updateVerificationInputsState(); // This will also update reset button visibility

            } else {
                UIManager.displayMessage(`Tentativo Fallito. Resto Calcolato (${CalculatedRemainder}) è minore della Soglia Target (>= ${TargetRemainder}). Prova un nuovo Nonce!`, "error");
            }
        } catch (error) {
            Utils.logError("Errore imprevisto durante la verifica del tentativo:", error);
            UIManager.displayMessage("Si è verificato un errore imprevisto. Controlla la console per i dettagli.", "error");
            UIManager.renderCalculationDetails({
                error: `Errore di sistema: ${error.message}`,
                poolName: DOMElements.poolNameInput.value.trim(),
                nonce: DOMElements.nonceInput.value,
                selectedDivisor: AppState.selectedDivisor,
                isSuccess: false
            });
        }
    }
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    GameLogic.init();
});
