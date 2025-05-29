// js/ui.js
// L'import di 'ValidationManager' è stato rimosso perché non utilizzato.
import { GameLogic, GameConstants } from './logic.js';

// --- UI CONSTANTS ---
const UIConstants = {
    MESSAGE_TIMEOUT_DEFAULT: 4000,
    MESSAGE_FADEOUT_DURATION: 300,
    MANUAL_URL: './manuale.html', // URL del manuale
    GITHUB_URL: 'https://github.com/marcofarina/proof_and_dragons', // URL di GitHub
};

// --- DOM ELEMENTS ---
// Le chiavi qui devono corrispondere agli ID effettivi nell'HTML
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
    poolName: null,
    nonce: null,
    verifyAttempt: null,
    divisorGrid: null,
    mempoolGrid: null,
    timewallChain: null,
    timewallChainContainer: null,
    messageArea: null,
    calculationDetailsBox: null,
    calculationDetailsContainer: null,
};

// --- UI STATE ---
const uiState = {
    messageTimeoutId: null,
    isDarkMode: false,
    isMenuOpen: false,
};

// --- UTILITY FUNCTIONS (UI Specific) ---
const UIUtils = {
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
            UIUtils.logError("[ThemeManager.init] Elementi DOM relativi al tema non trovati.");
            return;
        }
        this.loadTheme();
        DOMElements.themeToggle.addEventListener('click', () => this.toggleTheme());
    },
    applyTheme(theme) {
        uiState.isDarkMode = theme === 'dark';
        if (uiState.isDarkMode) {
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
            UIUtils.logError("[MenuManager.init] Elementi DOM relativi al menu non trovati.");
            return;
        }

        DOMElements.manualLink.href = UIConstants.MANUAL_URL;
        DOMElements.githubLink.href = UIConstants.GITHUB_URL;

        DOMElements.menuToggle.addEventListener('click', () => this.toggleMenu());
        DOMElements.resetGameButton.addEventListener('click', () => {
            GameLogic.resetFullGameLogic();
            UIManager.updateUIafterReset();
            this.closeMenu();
            UIManager.displayMessage("Nuova partita! Seleziona un divisore per iniziare.", "info", 5000);
        });

        document.addEventListener('click', (event) => {
            if (uiState.isMenuOpen &&
                DOMElements.appMenu && !DOMElements.appMenu.contains(event.target) &&
                DOMElements.menuToggle && !DOMElements.menuToggle.contains(event.target)) {
                this.closeMenu();
            }
        });
    },
    toggleMenu() {
        uiState.isMenuOpen = !uiState.isMenuOpen;
        if (uiState.isMenuOpen) {
            this.openMenu();
        } else {
            this.closeMenu();
        }
    },
    openMenu() {
        uiState.isMenuOpen = true;
        if (DOMElements.appMenu) {
            DOMElements.appMenu.classList.remove('hidden');
            DOMElements.appMenu.classList.add('menu-active');
        }
        if (DOMElements.menuToggle) DOMElements.menuToggle.setAttribute('aria-expanded', 'true');
        this.updateResetButtonVisibility();
    },
    closeMenu() {
        uiState.isMenuOpen = false;
        if (DOMElements.appMenu) {
            DOMElements.appMenu.classList.remove('menu-active');
            setTimeout(() => {
                if (!uiState.isMenuOpen && DOMElements.appMenu) {
                    DOMElements.appMenu.classList.add('hidden');
                }
            }, 200);
        }
        if (DOMElements.menuToggle) DOMElements.menuToggle.setAttribute('aria-expanded', 'false');
    },
    updateResetButtonVisibility() {
        if (!DOMElements.resetGameButton) return;
        const currentState = GameLogic.getCurrentState();
        if (currentState.timewall.length >= GameConstants.MAX_BLOCKS) {
            DOMElements.resetGameButton.classList.remove('hidden');
            DOMElements.resetGameButton.classList.add('visible');
        } else {
            DOMElements.resetGameButton.classList.add('hidden');
            DOMElements.resetGameButton.classList.remove('visible');
        }
    }
};

// --- UI MANAGER ---
export const UIManager = {
    init() {
        Object.keys(DOMElements).forEach(key => {
            if (key !== 'html' && key !== 'body') {
                DOMElements[key] = document.getElementById(key);
            }
        });

        ThemeManager.init();
        MenuManager.init();

        this.setupEventListeners();
        GameLogic.resetFullGameLogic();
        this.updateUIafterReset();
        this.displayMessage("Benvenuto! Seleziona un divisore per iniziare.", "info", 5000);
    },

    updateUIafterReset() {
        const currentState = GameLogic.getCurrentState();
        this.renderDivisors(currentState.availableDivisors, currentState.selectedDivisor);
        this.renderTimewall(currentState.timewall);
        this.updateMempoolDisplay(currentState.mempool, currentState.currentlySelectedTxs, currentState.timewall.length);
        this.updateVerificationInputsState(currentState.timewall.length);
        this.renderCalculationDetails({ initialState: true });
        if (DOMElements.poolName) DOMElements.poolName.value = '';
        if (DOMElements.nonce) DOMElements.nonce.value = '';
    },

    setupEventListeners() {
        if (DOMElements.verifyAttempt) {
            DOMElements.verifyAttempt.addEventListener('click', () => this.handleVerifyAttemptUI());
        }

        document.addEventListener('keydown', (event) => {
            if (event.key.toUpperCase() === 'F') {
                if (document.activeElement === DOMElements.poolName || document.activeElement === DOMElements.nonce) {
                    return;
                }
                if (!event.ctrlKey && !event.metaKey && !event.altKey) {
                    event.preventDefault();
                    this.toggleFullScreen();
                }
            }
            if (event.key === 'Escape' && uiState.isMenuOpen) {
                MenuManager.closeMenu();
            }
        });

        if (DOMElements.poolName) {
            DOMElements.poolName.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); if(DOMElements.verifyAttempt) DOMElements.verifyAttempt.click(); }});
        }
        if (DOMElements.nonce) {
            DOMElements.nonce.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); if(DOMElements.verifyAttempt) DOMElements.verifyAttempt.click(); }});
        }
    },

    renderDivisors(availableDivisors, selectedDivisor) {
        if (!DOMElements.divisorGrid) return;
        DOMElements.divisorGrid.innerHTML = '';
        availableDivisors.forEach(value => {
            const item = document.createElement('div');
            item.className = `divisor-item p-3 sm:p-4 aspect-square bg-gray-200 dark:bg-gray-700 border-2 border-purple-400 dark:border-purple-500 rounded-lg flex items-center justify-center text-2xl sm:text-3xl font-bold cursor-pointer hover:bg-purple-300 dark:hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-gray-800 dark:text-gray-100`;
            item.textContent = value;
            item.dataset.value = value;

            if (value === selectedDivisor) {
                item.classList.add('active', 'bg-purple-400', 'dark:bg-purple-700', 'border-yellow-500', 'dark:border-yellow-400', 'shadow-lg', 'dark:shadow-yellow-400/30');
            }
            item.addEventListener('click', () => this.handleDivisorSelectUI(value));
            item.setAttribute('tabindex', '0');
            item.setAttribute('role', 'button');
            item.setAttribute('aria-pressed', value === selectedDivisor ? 'true' : 'false');
            item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') this.handleDivisorSelectUI(value); });
            DOMElements.divisorGrid.appendChild(item);
        });
    },

    renderMempoolItems(mempool, currentlySelectedTxs) {
        if (!DOMElements.mempoolGrid) return;
        DOMElements.mempoolGrid.innerHTML = '';
        mempool.forEach(tx => {
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
                UIUtils.logError(`Impossibile caricare l'immagine: ${tx.feeIconPath}`);
                feeIconImg.alt = "Icona non caricata";
                const fallbackText = document.createElement('span');
                fallbackText.textContent = '[icona mancante]';
                if (feeIconImg.parentNode) {
                    feeIconImg.parentNode.replaceChild(fallbackText, feeIconImg);
                }
            };

            descContainer.appendChild(desc);
            item.appendChild(descContainer);
            item.appendChild(feeIconImg);

            const isSelected = currentlySelectedTxs.find(selected => selected.id === tx.id);
            if (isSelected) {
                item.classList.add('selected', 'bg-teal-400', 'dark:bg-teal-700', 'border-green-500', 'dark:border-green-400', 'shadow-lg', 'dark:shadow-green-400/30');
            }
            item.addEventListener('click', () => this.handleTransactionSelectUI(tx));
            item.setAttribute('tabindex', '0');
            item.setAttribute('role', 'checkbox');
            item.setAttribute('aria-checked', isSelected ? 'true' : 'false');
            item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') this.handleTransactionSelectUI(tx); });
            DOMElements.mempoolGrid.appendChild(item);
        });
    },

    renderTimewall(timewall) {
        if (!DOMElements.timewallChain) return;
        DOMElements.timewallChain.innerHTML = '';

        for (let i = 0; i < GameConstants.MAX_BLOCKS; i++) {
            if (timewall[i]) {
                const block = timewall[i];
                const blockCard = document.createElement('div');
                blockCard.className = 'block-card bg-white dark:bg-gray-700 p-4 sm:p-5 rounded-lg shadow-lg border border-gray-300 dark:border-gray-600 flex-shrink-0 flex flex-col text-gray-800 dark:text-gray-100';

                let transactionsHTML = 'N/A';
                if (block.selectedTransactions && block.selectedTransactions.length > 0) {
                    transactionsHTML = block.selectedTransactions.map(tx =>
                        `<span class="tooltip text-sm bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-2 py-1 rounded-md mr-1.5 mb-1.5 inline-block">${UIUtils.escapeHTML(tx.description.split(' ')[0])}...<span class="tooltiptext bg-gray-700 dark:bg-gray-800 text-white">${UIUtils.escapeHTML(tx.description)}</span></span>`
                    ).join('');
                } else if (i + 1 === 3) {
                    transactionsHTML = 'Nessuna Selezionata';
                }

                let remainderHTML;
                if (i < GameConstants.MAX_BLOCKS -1) {
                    remainderHTML = `
                        <div class="mt-2 mb-1 p-3 border-2 border-yellow-500 dark:border-yellow-400 rounded-lg bg-yellow-50 dark:bg-gray-600/50 shadow-inner">
                            <p class="text-base font-semibold text-gray-700 dark:text-gray-200 text-center">Resto per Blocco Successivo:</p>
                            <p class="text-3xl font-bold text-yellow-600 dark:text-yellow-300 text-center tracking-wider">${block.remainder}</p>
                        </div>`;
                } else {
                    remainderHTML = `<p><strong class="text-gray-700 dark:text-gray-200">Resto Vincente:</strong> <span class="font-semibold text-orange-600 dark:text-orange-300">${block.remainder}</span></p>`;
                }

                const safePoolName = UIUtils.escapeHTML(block.poolName);

                blockCard.innerHTML = `
                    <h3 class="text-xl sm:text-2xl font-semibold text-orange-500 dark:text-orange-400 mb-3">Blocco #${i + 1}</h3>
                    <div class="text-sm sm:text-base space-y-2 text-gray-600 dark:text-gray-300 flex-grow">
                        <p><strong class="text-gray-800 dark:text-gray-200">Pool:</strong> ${safePoolName}</p>
                        <p><strong class="text-gray-800 dark:text-gray-200">Nonce:</strong> ${block.nonce}</p>
                        <p><strong class="text-gray-800 dark:text-gray-200">Divisore Usato:</strong> ${block.divisor}</p>
                        ${remainderHTML}
                        ${i > 0 && block.previousRemainder !== null ? `<p><strong class="text-gray-800 dark:text-gray-200">Resto Prec.:</strong> ${block.previousRemainder}</p>` : ''}
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
            DOMElements.timewallChainContainer.classList.toggle("overflow-y-auto", timewall.length > 0 || GameConstants.MAX_BLOCKS > 0);
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
            p.innerHTML = `<strong class="text-gray-700 dark:text-gray-200">${UIUtils.escapeHTML(label)}:</strong> <span class="text-gray-500 dark:text-gray-400">${UIUtils.escapeHTML(formula)}</span> = <span class="font-semibold text-gray-800 dark:text-gray-100">${UIUtils.escapeHTML(String(result))}</span>`;
            return p;
        };

        if (details.error) {
            const errorP = document.createElement('p');
            errorP.className = 'text-red-600 dark:text-red-400 font-semibold';
            errorP.textContent = `Errore: ${details.error}`;
            DOMElements.calculationDetailsBox.appendChild(errorP);
            if (details.poolName !== undefined) DOMElements.calculationDetailsBox.appendChild(createDetailLine('Nome Pool Inserito', details.poolName || 'N/A'));
            if (details.nonceInput !== undefined) DOMElements.calculationDetailsBox.appendChild(createDetailLine('Nonce Inserito', details.nonceInput || 'N/A'));
            if (details.selectedDivisor !== undefined && details.selectedDivisor !== null) DOMElements.calculationDetailsBox.appendChild(createDetailLine('Divisore Selezionato', details.selectedDivisor));
            else if (details.selectedDivisor === null) DOMElements.calculationDetailsBox.appendChild(createDetailLine('Divisore Selezionato', 'Nessuno'));

        } else {
            DOMElements.calculationDetailsBox.appendChild(createDetailLine('Nome Pool', UIUtils.escapeHTML(details.poolName)));
            DOMElements.calculationDetailsBox.appendChild(createDetailLine('Nonce Inserito', details.nonce));
            DOMElements.calculationDetailsBox.appendChild(createDetailLine('Divisore Selezionato (D)', details.selectedDivisor));
            if (details.currentBlockNumber > 1 && details.lastWinningRemainder !== null) {
                DOMElements.calculationDetailsBox.appendChild(createDetailLine('Resto Blocco Precedente', details.lastWinningRemainder));
            }
            if (details.currentBlockNumber === 3) {
                DOMElements.calculationDetailsBox.appendChild(createDetailLine('Transazioni Selezionate', details.selectedTransactionsForDisplay.join(', ') || 'Nessuna'));
                DOMElements.calculationDetailsBox.appendChild(createDetailLine('Valore Transazioni (txValue)', details.txValue));
            }
            const poolNameForWR = (details.poolName && typeof details.poolName === 'string') ? details.poolName.toUpperCase() : 'N/D';
            DOMElements.calculationDetailsBox.appendChild(createFormulaLine('WR', `${details.asciiSum} (Somma ASCII di '${UIUtils.escapeHTML(poolNameForWR)}') + ${GameConstants.ASCII_SUM_OFFSET}`, details.WR));
            DOMElements.calculationDetailsBox.appendChild(createFormulaLine('Proof', details.proofFormula, details.proofValue));
            DOMElements.calculationDetailsBox.appendChild(createFormulaLine('Resto Calcolato', `${details.proofValue} % ${details.selectedDivisor}`, details.calculatedRemainder));
            DOMElements.calculationDetailsBox.appendChild(createFormulaLine('Soglia Target', `${details.selectedDivisor} - ${GameConstants.TARGET_REMAINDER_OFFSET}`, details.targetRemainderValue));

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

    displayMessage(message, type = 'info', duration = UIConstants.MESSAGE_TIMEOUT_DEFAULT) {
        if (!DOMElements.messageArea) return;
        clearTimeout(uiState.messageTimeoutId);
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

        uiState.messageTimeoutId = setTimeout(() => {
            DOMElements.messageArea.style.opacity = '0';
            setTimeout(() => {
                if (DOMElements.messageArea.style.opacity === '0') {
                    DOMElements.messageArea.style.display = 'none';
                }
            }, UIConstants.MESSAGE_FADEOUT_DURATION);
        }, duration);
    },

    updateMempoolDisplay(mempool, currentlySelectedTxs, timewallLength) {
        if (!DOMElements.mempoolGrid) return;
        const nextBlockNumber = timewallLength + 1;
        if (nextBlockNumber === 3 && timewallLength < GameConstants.MAX_BLOCKS) {
            this.renderMempoolItems(mempool, currentlySelectedTxs);
        } else {
            DOMElements.mempoolGrid.innerHTML = '';
            const placeholderMessage = document.createElement('p');
            placeholderMessage.className = 'text-gray-500 dark:text-gray-400 text-base text-center col-span-full h-full flex items-center justify-center';
            placeholderMessage.textContent = nextBlockNumber < 3 ? 'Disponibile per il Blocco 3' : 'Mempool non attiva per questo blocco';
            DOMElements.mempoolGrid.appendChild(placeholderMessage);
        }
    },

    updateVerificationInputsState(timewallLength) {
        const isGameOver = timewallLength >= GameConstants.MAX_BLOCKS;
        if (DOMElements.poolName) DOMElements.poolName.disabled = isGameOver;
        if (DOMElements.nonce) DOMElements.nonce.disabled = isGameOver;
        if (DOMElements.verifyAttempt) {
            DOMElements.verifyAttempt.disabled = isGameOver;
            if (isGameOver) {
                DOMElements.verifyAttempt.classList.add('opacity-50', 'cursor-not-allowed');
                DOMElements.verifyAttempt.classList.remove('hover:bg-cyan-600', 'dark:hover:bg-cyan-700');
            } else {
                DOMElements.verifyAttempt.classList.remove('opacity-50', 'cursor-not-allowed');
                DOMElements.verifyAttempt.classList.add('hover:bg-cyan-600', 'dark:hover:bg-cyan-700');
            }
        }
        MenuManager.updateResetButtonVisibility();
    },

    toggleFullScreen() {
        if (!document.fullscreenElement) {
            DOMElements.html.requestFullscreen().catch(err => {
                this.displayMessage(`Fullscreen non disponibile o negato. (${err.message})`, "warn");
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(err => { // Aggiunto .catch() qui
                    this.displayMessage(`Impossibile uscire dal fullscreen. (${err.message})`, "warn");
                });
            } else if (document.webkitExitFullscreen) { // Fallback per Safari/Chrome più vecchi
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) { // Fallback per Firefox
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) { // Fallback per IE/Edge più vecchi
                document.msExitFullscreen();
            }
        }
    },

    handleDivisorSelectUI(divisorValue) {
        const success = GameLogic.selectDivisorLogic(divisorValue);
        if (success) {
            const currentState = GameLogic.getCurrentState();
            this.renderDivisors(currentState.availableDivisors, currentState.selectedDivisor);
            this.displayMessage(`Divisore ${currentState.selectedDivisor} selezionato.`, 'info', 2000);
        }
    },

    handleTransactionSelectUI(tx) {
        const result = GameLogic.selectTransactionLogic(tx);
        const currentState = GameLogic.getCurrentState();
        this.renderMempoolItems(currentState.mempool, currentState.currentlySelectedTxs);
        if (!result.success && result.message) {
            this.displayMessage(result.message, "warn");
        }
    },

    handleVerifyAttemptUI() {
        try {
            const poolName = DOMElements.poolName ? DOMElements.poolName.value.trim() : '';
            const nonceStr = DOMElements.nonce ? DOMElements.nonce.value : '';

            const resultDetails = GameLogic.attemptMineBlock(poolName, nonceStr);
            this.renderCalculationDetails(resultDetails);

            if (resultDetails.error) {
                this.displayMessage(resultDetails.error, "error");
                if (resultDetails.error.toLowerCase().includes("pool")) {
                    if(DOMElements.poolName) DOMElements.poolName.focus();
                } else if (resultDetails.error.toLowerCase().includes("nonce")) {
                     if(DOMElements.nonce) DOMElements.nonce.focus();
                }
                return;
            }

            const currentState = GameLogic.getCurrentState();

            if (resultDetails.isSuccess) {
                this.displayMessage(`Blocco Minato con Successo! Resto Calcolato: ${resultDetails.calculatedRemainder} (Soglia: >= ${resultDetails.targetRemainderValue})`, "success");

                if (!resultDetails.isGameEnd) {
                    if (DOMElements.poolName) DOMElements.poolName.value = '';
                    if (DOMElements.nonce) DOMElements.nonce.value = '';
                }

                this.renderTimewall(currentState.timewall);
                this.renderDivisors(currentState.availableDivisors, currentState.selectedDivisor);

                if (resultDetails.isGameEnd) {
                    this.displayMessage(`Tutti i ${GameConstants.MAX_BLOCKS} blocchi minati! Sessione di gioco completa. Apri il menu per ricominciare.`, "success", 6000);
                } else {
                     this.displayMessage("Nuovi divisori generati. Seleziona un divisore per il prossimo blocco!", "info", 3000);
                }
            } else {
                this.displayMessage(`Tentativo Fallito. Resto Calcolato (${resultDetails.calculatedRemainder}) è minore della Soglia Target (>= ${resultDetails.targetRemainderValue}). Prova un nuovo Nonce!`, "error");
            }
            this.updateMempoolDisplay(currentState.mempool, currentState.currentlySelectedTxs, currentState.timewall.length);
            this.updateVerificationInputsState(currentState.timewall.length);

        } catch (error) {
            UIUtils.logError("Errore imprevisto durante la verifica del tentativo (UI):", error);
            this.displayMessage("Si è verificato un errore imprevisto. Controlla la console per i dettagli.", "error");
            this.renderCalculationDetails({
                error: `Errore di sistema: ${error.message}`,
                poolName: DOMElements.poolName ? DOMElements.poolName.value.trim() : '',
                nonceInput: DOMElements.nonce ? DOMElements.nonce.value : '',
                selectedDivisor: GameLogic.getCurrentState().selectedDivisor,
                isSuccess: false
            });
        }
    }
};
