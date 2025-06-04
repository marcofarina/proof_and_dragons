import { GameLogic, GameConstants } from './logic.js';

const UIConstants = {
    MESSAGE_TIMEOUT_DEFAULT: 4000,
    MESSAGE_FADEOUT_DURATION: 300,
    MANUAL_URL: './manuale.html',
};

const DOMElements = {
    html: document.documentElement,
    body: document.body,
    groupInputModal: null,
    numGroupsInput: null,
    startGameButton: null,
    numGroupsError: null,
    mainContent: null,
    divisorRangeInfo: null,
    difficultyAdjustmentMessage: null,
    revealDivisorsButton: null,

    themeToggle: null,
    themeIconSun: null,
    themeIconMoon: null,
    fullscreenToggle: null,
    fullscreenIconExpand: null,
    fullscreenIconCompress: null,
    menuToggle: null,
    appMenu: null,
    manualLink: null,
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

const uiState = {
    messageTimeoutId: null,
    isDarkMode: false,
    isMenuOpen: false,
    isFullscreen: false,
    hasGameStarted: false,
};

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

const ThemeManager = {
    init() {
        DOMElements.themeToggle = document.getElementById('themeToggle');
        DOMElements.themeIconSun = document.getElementById('themeIconSun');
        DOMElements.themeIconMoon = document.getElementById('themeIconMoon');

        if (!DOMElements.themeToggle || !DOMElements.themeIconSun || !DOMElements.themeIconMoon) {
            UIUtils.logError("Elementi DOM relativi al tema non trovati.");
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

const FullscreenManager = {
    init() {
        DOMElements.fullscreenToggle = document.getElementById('fullscreenToggle');
        DOMElements.fullscreenIconExpand = document.getElementById('fullscreenIconExpand');
        DOMElements.fullscreenIconCompress = document.getElementById('fullscreenIconCompress');

        if (!DOMElements.fullscreenToggle || !DOMElements.fullscreenIconExpand || !DOMElements.fullscreenIconCompress) {
            UIUtils.logError("Elementi DOM relativi al fullscreen non trovati.");
            return;
        }
        DOMElements.fullscreenToggle.addEventListener('click', () => this.toggle());
        document.addEventListener('fullscreenchange', () => this.updateIcon());
        this.updateIcon();
    },
    toggle() {
        if (!document.fullscreenElement) {
            DOMElements.html.requestFullscreen().catch(err => {
                UIManager.displayMessage(`Fullscreen non disponibile o negato. (${err.message})`, "warn");
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(err => {
                    UIManager.displayMessage(`Impossibile uscire dal fullscreen. (${err.message})`, "warn");
                });
            }
        }
    },
    updateIcon() {
        uiState.isFullscreen = !!document.fullscreenElement;
        if (uiState.isFullscreen) {
            DOMElements.fullscreenIconExpand.classList.add('hidden');
            DOMElements.fullscreenIconCompress.classList.remove('hidden');
        } else {
            DOMElements.fullscreenIconExpand.classList.remove('hidden');
            DOMElements.fullscreenIconCompress.classList.add('hidden');
        }
    }
};

const MenuManager = {
    init() {
        DOMElements.menuToggle = document.getElementById('menuToggle');
        DOMElements.appMenu = document.getElementById('appMenu');
        DOMElements.manualLink = document.getElementById('manualLink');
        DOMElements.resetGameButton = document.getElementById('resetGameButton');

        if (!DOMElements.menuToggle || !DOMElements.appMenu || !DOMElements.manualLink || !DOMElements.resetGameButton) {
            UIUtils.logError("Elementi DOM essenziali per il menu non trovati.");
            return;
        }

        DOMElements.manualLink.href = UIConstants.MANUAL_URL;

        DOMElements.menuToggle.addEventListener('click', () => this.toggleMenu());
        DOMElements.resetGameButton.addEventListener('click', () => {
            UIManager.showGroupInputModal();
            this.closeMenu();
        });

        document.addEventListener('click', (event) => {
            if (uiState.isMenuOpen &&
                DOMElements.appMenu && !DOMElements.appMenu.contains(event.target) &&
                DOMElements.menuToggle && !DOMElements.menuToggle.contains(event.target)) {
                this.closeMenu();
            }
        });
        this.updateResetButtonVisibility();
    },
    toggleMenu() {
        uiState.isMenuOpen = !uiState.isMenuOpen;
        if (uiState.isMenuOpen) this.openMenu();
        else this.closeMenu();
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
        DOMElements.resetGameButton.disabled = !uiState.hasGameStarted;
        if (!uiState.hasGameStarted) {
            DOMElements.resetGameButton.classList.add('opacity-50', 'cursor-not-allowed');
            DOMElements.resetGameButton.classList.remove('hover:bg-red-700', 'dark:hover:bg-red-700');
        } else {
            DOMElements.resetGameButton.classList.remove('opacity-50', 'cursor-not-allowed');
            DOMElements.resetGameButton.classList.add('hover:bg-red-700', 'dark:hover:bg-red-700');
        }
    }
};

export const UIManager = {
    init() {
        Object.keys(DOMElements).forEach(key => {
            if (key !== 'html' && key !== 'body') {
                DOMElements[key] = document.getElementById(key);
            }
        });
        DOMElements.mainContent = document.querySelector('main');

        ThemeManager.init();
        FullscreenManager.init();
        MenuManager.init();

        this.setupEventListeners();
        this.showGroupInputModal();
    },

    showGroupInputModal() {
        uiState.hasGameStarted = false;
        MenuManager.updateResetButtonVisibility();

        if (DOMElements.groupInputModal) DOMElements.groupInputModal.classList.add('active');
        if (DOMElements.mainContent) DOMElements.mainContent.style.visibility = 'hidden';
        if (DOMElements.numGroupsInput) {
            DOMElements.numGroupsInput.value = GameLogic.getCurrentState().numberOfGroups || 5;
            DOMElements.numGroupsInput.focus();
        }
        if (DOMElements.numGroupsError) DOMElements.numGroupsError.classList.add('hidden');
        if (DOMElements.revealDivisorsButton) DOMElements.revealDivisorsButton.classList.remove('hidden');
        if (DOMElements.divisorGrid) DOMElements.divisorGrid.classList.add('hidden-initial');
        if (DOMElements.difficultyAdjustmentMessage) DOMElements.difficultyAdjustmentMessage.textContent = '';
    },

    hideGroupInputModalAndStartGame() {
        const numGroupsStr = DOMElements.numGroupsInput ? DOMElements.numGroupsInput.value : '1';
        const numGroups = parseInt(numGroupsStr, 10);

        if (isNaN(numGroups) || numGroups < 1 || numGroups > 20) {
            if (DOMElements.numGroupsError) {
                DOMElements.numGroupsError.textContent = "Inserisci un numero valido (1-20).";
                DOMElements.numGroupsError.classList.remove('hidden');
            }
            if (DOMElements.numGroupsInput) DOMElements.numGroupsInput.focus();
            return;
        }

        if (DOMElements.numGroupsError) DOMElements.numGroupsError.classList.add('hidden');
        if (DOMElements.groupInputModal) DOMElements.groupInputModal.classList.remove('active');
        if (DOMElements.mainContent) DOMElements.mainContent.style.visibility = 'visible';

        GameLogic.resetFullGameLogic(numGroups);
        uiState.hasGameStarted = true;
        this.updateUIafterReset(true);
        this.displayMessage(`Nuova partita con ${numGroups} gruppi! Rivela i divisori per iniziare il round.`, "info", 5000);
        MenuManager.updateResetButtonVisibility();
    },

    updateUIafterReset(isNewRoundStart = false) {
        const currentState = GameLogic.getCurrentState();
        this.renderDivisors(
            currentState.availableDivisors,
            currentState.selectedDivisor,
            currentState.currentMinDivisor,
            currentState.currentMaxDivisor,
            currentState.lastTimeAdjustmentAmount,
            currentState.timeTakenForLastBlockSeconds,
            isNewRoundStart || !currentState.divisorsRevealedAndTimerStarted
        );
        this.renderTimewall(currentState.timewall);
        this.updateMempoolDisplay(currentState.mempool, currentState.currentlySelectedTxs, currentState.timewall.length);
        this.updateVerificationInputsState(currentState.timewall.length, currentState.divisorsRevealedAndTimerStarted);
        this.renderCalculationDetails({ initialState: true });
        if (DOMElements.poolName) DOMElements.poolName.value = '';
        if (DOMElements.nonce) DOMElements.nonce.value = '';
    },

    setupEventListeners() {
        if (DOMElements.startGameButton) {
            DOMElements.startGameButton.addEventListener('click', () => this.hideGroupInputModalAndStartGame());
        }
        if (DOMElements.numGroupsInput) {
            DOMElements.numGroupsInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.hideGroupInputModalAndStartGame();
                }
            });
        }
        if (DOMElements.revealDivisorsButton) {
            DOMElements.revealDivisorsButton.addEventListener('click', () => this.handleRevealDivisors());
        }

        if (DOMElements.verifyAttempt) {
            DOMElements.verifyAttempt.addEventListener('click', () => this.handleVerifyAttemptUI());
        }

        document.addEventListener('keydown', (event) => {
            if (event.key.toUpperCase() === 'F') {
                if (document.activeElement === DOMElements.poolName || document.activeElement === DOMElements.nonce || document.activeElement === DOMElements.numGroupsInput) {
                    return;
                }
                if (!event.ctrlKey && !event.metaKey && !event.altKey) {
                    event.preventDefault();
                    FullscreenManager.toggle();
                }
            }
            if (event.key === 'Escape') {
                if (DOMElements.groupInputModal && DOMElements.groupInputModal.classList.contains('active')) {
                    // Non fare nulla
                } else if (uiState.isFullscreen) {
                    FullscreenManager.toggle();
                } else if (uiState.isMenuOpen) {
                    MenuManager.closeMenu();
                }
            }
        });

        if (DOMElements.poolName) {
            DOMElements.poolName.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); if(DOMElements.verifyAttempt) DOMElements.verifyAttempt.click(); }});
        }
        if (DOMElements.nonce) {
            DOMElements.nonce.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); if(DOMElements.verifyAttempt) DOMElements.verifyAttempt.click(); }});
        }
    },

    handleRevealDivisors() {
        if (GameLogic.startRoundTimerAndRevealDivisors()) {
            const currentState = GameLogic.getCurrentState();
            this.renderDivisors(
                currentState.availableDivisors,
                currentState.selectedDivisor,
                currentState.currentMinDivisor,
                currentState.currentMaxDivisor,
                currentState.lastTimeAdjustmentAmount,
                currentState.timeTakenForLastBlockSeconds,
                false
            );
            this.updateVerificationInputsState(currentState.timewall.length, true);
            this.displayMessage("Divisori rivelati! Il tempo scorre. Mina ora!", "info");
        }
    },

    renderDivisors(availableDivisors, selectedDivisor, minDivisor, maxDivisor, lastTimeAdjustment, timeTakenSeconds, showRevealButton) {
        if (!DOMElements.divisorGrid || !DOMElements.revealDivisorsButton) return;

        if (showRevealButton) {
            DOMElements.revealDivisorsButton.classList.remove('hidden');
            DOMElements.divisorGrid.classList.add('hidden-initial');
            DOMElements.divisorGrid.innerHTML = '';
        } else {
            DOMElements.revealDivisorsButton.classList.add('hidden');
            DOMElements.divisorGrid.classList.remove('hidden-initial');
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
        }

        if (DOMElements.divisorRangeInfo) {
            DOMElements.divisorRangeInfo.textContent = `${minDivisor} - ${maxDivisor}`;
        }

        if (DOMElements.difficultyAdjustmentMessage) {
            DOMElements.difficultyAdjustmentMessage.textContent = ''; // Pulisci sempre prima
            DOMElements.difficultyAdjustmentMessage.className = 'text-center mt-1 text-base font-semibold'; // Classi base

            if (timeTakenSeconds !== null) { // Mostra un messaggio solo se un blocco è stato minato
                const timeMinutes = Math.round(timeTakenSeconds / 60);
                if (lastTimeAdjustment !== 0) {
                    const verb = lastTimeAdjustment < 0 ? "diminuita (più facile)" : "aumentata (più difficile)";
                    const absAdjustment = Math.abs(lastTimeAdjustment);
                    DOMElements.difficultyAdjustmentMessage.textContent = `Difficoltà ${verb} di ${absAdjustment} (tempo blocco: ~${timeMinutes} min).`;
                    DOMElements.difficultyAdjustmentMessage.classList.add(lastTimeAdjustment < 0 ? 'positive-adjustment' : 'negative-adjustment');
                } else {
                    DOMElements.difficultyAdjustmentMessage.textContent = `Difficoltà invariata (tempo blocco: ~${timeMinutes} min).`;
                    // Nessuna classe di colore specifica per "invariata"
                }
            }
        }
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
                const fallbackText = document.createElement('span');
                fallbackText.textContent = '[icona mancante]';
                if (feeIconImg.parentNode) feeIconImg.parentNode.replaceChild(fallbackText, feeIconImg);
            };
            descContainer.appendChild(desc);
            item.appendChild(descContainer);
            item.appendChild(feeIconImg);
            const isSelected = currentlySelectedTxs.find(selected => selected.id === tx.id);
            if (isSelected) item.classList.add('selected', 'bg-teal-400', 'dark:bg-teal-700', 'border-green-500', 'dark:border-green-400', 'shadow-lg', 'dark:shadow-green-400/30');
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
                } else if (i + 1 === 3) transactionsHTML = 'Nessuna Selezionata';
                let remainderHTML;
                if (i < GameConstants.MAX_BLOCKS -1) {
                    remainderHTML = `<div class="mt-2 mb-1 p-3 border-2 border-yellow-500 dark:border-yellow-400 rounded-lg bg-yellow-50 dark:bg-gray-600/50 shadow-inner"><p class="text-base font-semibold text-gray-700 dark:text-gray-200 text-center">Resto per blocco successivo:</p><p class="text-3xl font-bold text-yellow-600 dark:text-yellow-300 text-center tracking-wider">${block.remainder}</p></div>`;
                } else {
                    remainderHTML = `<p><strong class="text-gray-700 dark:text-gray-200">Resto vincente:</strong> <span class="font-semibold text-orange-600 dark:text-orange-300">${block.remainder}</span></p>`;
                }
                const safePoolName = UIUtils.escapeHTML(block.poolName);
                blockCard.innerHTML = `<h3 class="text-xl sm:text-2xl font-semibold text-orange-500 dark:text-orange-400 mb-3">Blocco #${i + 1}</h3><div class="text-sm sm:text-base space-y-2 text-gray-600 dark:text-gray-300 flex-grow"><p><strong class="text-gray-800 dark:text-gray-200">Pool:</strong> ${safePoolName}</p><p><strong class="text-gray-800 dark:text-gray-200">Nonce:</strong> ${block.nonce}</p><p><strong class="text-gray-800 dark:text-gray-200">Divisore usato:</strong> ${block.divisor}</p>${remainderHTML}${i > 0 && block.previousRemainder !== null ? `<p><strong class="text-gray-800 dark:text-gray-200">Resto prec.:</strong> ${block.previousRemainder}</p>` : ''}${i + 1 === 3 ? `<div class="mt-1.5"><strong class="text-gray-800 dark:text-gray-200">Transazioni:</strong><div class="flex flex-wrap mt-1">${transactionsHTML}</div></div>` : ''}</div><p class="text-sm text-gray-500 dark:text-gray-500 mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">${new Date(block.timestamp).toLocaleTimeString()}</p>`;
                DOMElements.timewallChain.appendChild(blockCard);
            } else {
                const placeholderSlot = document.createElement('div');
                placeholderSlot.className = 'timewall-placeholder-slot flex-shrink-0 border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/10 text-gray-500 dark:text-gray-500';
                placeholderSlot.textContent = `Blocco #${i + 1} non ancora minato`;
                DOMElements.timewallChain.appendChild(placeholderSlot);
            }
        }
        if (DOMElements.timewallChainContainer) DOMElements.timewallChainContainer.classList.toggle("overflow-y-auto", timewall.length > 0 || GameConstants.MAX_BLOCKS > 0);
        if (DOMElements.timewallChain.lastChild) DOMElements.timewallChain.lastChild.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' });
    },

    renderCalculationDetails(details) {
        if (!DOMElements.calculationDetailsBox || !DOMElements.calculationDetailsContainer) return;
        DOMElements.calculationDetailsBox.innerHTML = '';
        if (details.initialState) {
            DOMElements.calculationDetailsBox.innerHTML = '<p class="text-gray-500 dark:text-gray-400">Effettua una verifica per visualizzare i dettagli del calcolo.</p>';
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
            outcomeLine.innerHTML = `<strong class="text-gray-700 dark:text-gray-200">Esito:</strong> Resto calcolato (${details.calculatedRemainder}) &ge; Soglia target (${details.targetRemainderValue})?<br><span class="font-bold ${details.isSuccess ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}">${details.isSuccess ? 'SUCCESSO' : 'FALLIMENTO'}</span>`;
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
                if (DOMElements.messageArea.style.opacity === '0') DOMElements.messageArea.style.display = 'none';
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

    updateVerificationInputsState(timewallLength, divisorsRevealedAndTimerStarted) {
        const isGameOver = timewallLength >= GameConstants.MAX_BLOCKS;
        const canVerify = uiState.hasGameStarted && divisorsRevealedAndTimerStarted && !isGameOver;

        if (DOMElements.poolName) DOMElements.poolName.disabled = !canVerify;
        if (DOMElements.nonce) DOMElements.nonce.disabled = !canVerify;
        if (DOMElements.verifyAttempt) {
            DOMElements.verifyAttempt.disabled = !canVerify;
            if (!canVerify) {
                DOMElements.verifyAttempt.classList.add('opacity-50', 'cursor-not-allowed');
                DOMElements.verifyAttempt.classList.remove('hover:bg-cyan-600', 'dark:hover:bg-cyan-700');
            } else {
                DOMElements.verifyAttempt.classList.remove('opacity-50', 'cursor-not-allowed');
                DOMElements.verifyAttempt.classList.add('hover:bg-cyan-600', 'dark:hover:bg-cyan-700');
            }
        }
        MenuManager.updateResetButtonVisibility();
    },

    handleDivisorSelectUI(divisorValue) {
        const currentState = GameLogic.getCurrentState();
        if (!uiState.hasGameStarted || !currentState.divisorsRevealedAndTimerStarted) return;

        const success = GameLogic.selectDivisorLogic(divisorValue);
        if (success) {
            const updatedState = GameLogic.getCurrentState();
            this.renderDivisors(
                updatedState.availableDivisors,
                updatedState.selectedDivisor,
                updatedState.currentMinDivisor,
                updatedState.currentMaxDivisor,
                updatedState.lastTimeAdjustmentAmount,
                updatedState.timeTakenForLastBlockSeconds,
                false
            );
            this.displayMessage(`Divisore ${updatedState.selectedDivisor} selezionato.`, 'info', 2000);
        }
    },

    handleTransactionSelectUI(tx) {
        const currentState = GameLogic.getCurrentState();
        if (!uiState.hasGameStarted || !currentState.divisorsRevealedAndTimerStarted) return;
        const result = GameLogic.selectTransactionLogic(tx);
        const updatedState = GameLogic.getCurrentState();
        this.renderMempoolItems(updatedState.mempool, updatedState.currentlySelectedTxs);
        if (!result.success && result.message) {
            this.displayMessage(result.message, "warn");
        }
    },

    handleVerifyAttemptUI() {
        const preVerificationState = GameLogic.getCurrentState();
        if (!uiState.hasGameStarted || !preVerificationState.divisorsRevealedAndTimerStarted) {
            this.displayMessage("Devi prima rivelare i divisori e iniziare il round!", "warn");
            return;
        }
        try {
            const poolName = DOMElements.poolName ? DOMElements.poolName.value.trim() : '';
            const nonceStr = DOMElements.nonce ? DOMElements.nonce.value : '';

            const resultDetails = GameLogic.attemptMineBlock(poolName, nonceStr);
            this.renderCalculationDetails(resultDetails);

            if (resultDetails.error) {
                this.displayMessage(resultDetails.error, "error");
                if (resultDetails.error.toLowerCase().includes("pool") && DOMElements.poolName) DOMElements.poolName.focus();
                else if (resultDetails.error.toLowerCase().includes("nonce") && DOMElements.nonce) DOMElements.nonce.focus();
                return;
            }

            const postVerificationState = GameLogic.getCurrentState();

            if (resultDetails.isSuccess) {
                this.displayMessage(`Blocco Minato con Successo! Resto Calcolato: ${resultDetails.calculatedRemainder} (Soglia: >= ${resultDetails.targetRemainderValue})`, "success");

                if (!resultDetails.isGameEnd) {
                    if (DOMElements.poolName) DOMElements.poolName.value = '';
                    if (DOMElements.nonce) DOMElements.nonce.value = '';
                }

                this.renderTimewall(postVerificationState.timewall);
                this.renderDivisors(
                    postVerificationState.availableDivisors,
                    postVerificationState.selectedDivisor,
                    postVerificationState.currentMinDivisor,
                    postVerificationState.currentMaxDivisor,
                    postVerificationState.lastTimeAdjustmentAmount,
                    postVerificationState.timeTakenForLastBlockSeconds,
                    !resultDetails.isGameEnd
                );

                if (resultDetails.isGameEnd) {
                    this.displayMessage(`Tutti i ${GameConstants.MAX_BLOCKS} blocchi minati! Sessione di gioco completa. Apri il menu per ricominciare.`, "success", 6000);
                }
            } else {
                this.displayMessage(`Tentativo Fallito. Resto Calcolato (${resultDetails.calculatedRemainder}) è minore della Soglia Target (>= ${resultDetails.targetRemainderValue}). Prova un nuovo Nonce!`, "error");
            }
            this.updateMempoolDisplay(postVerificationState.mempool, postVerificationState.currentlySelectedTxs, postVerificationState.timewall.length);
            this.updateVerificationInputsState(postVerificationState.timewall.length, postVerificationState.divisorsRevealedAndTimerStarted);

        } catch (error) {
            UIUtils.logError("Errore imprevisto durante la verifica del tentativo (UI):", error);
            this.displayMessage("Si è verificato un errore imprevisto.", "error");
        }
    }
};
