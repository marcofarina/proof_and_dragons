// docs/js/i18n.js

/**
 * @namespace I18nManager
 * @description Gestisce l'internazionalizzazione (i18n) dell'applicazione.
 */
const I18nManager = {
    currentLanguage: 'it',
    translations: {},
    validLanguageFileStatus: {},
    availableLanguagesFromManifest: [],
    isLanguageMenuOpen: false,

    async loadTranslations(lang) {
        if (this.translations[lang] && Object.keys(this.translations[lang]).length > 0) {
            return this.translations[lang];
        }
        try {
            const cacheBuster = `v=${new Date().getTime()}`;
            const response = await fetch(`./locales/${lang}.json?${cacheBuster}`);
            if (!response.ok) {
                this.validLanguageFileStatus[lang] = false;
                throw new Error(`File ${lang}.json non trovato o errore di caricamento (status: ${response.status})`);
            }
            this.translations[lang] = await response.json();
            this.validLanguageFileStatus[lang] = true;
            return this.translations[lang];
        } catch (error) {
            console.error(`Errore durante il caricamento del file di traduzione ${lang}.json:`, error.message);
            this.validLanguageFileStatus[lang] = false;
            if (lang !== 'it') {
                console.warn(`Tentativo di fallback alla lingua di default 'it'.`);
                if (this.translations['it'] && Object.keys(this.translations['it']).length > 0) {
                    return this.translations['it'];
                }
                return await this.loadTranslations('it');
            }
            this.translations[lang] = {};
            return {};
        }
    },

    async setLanguage(lang) {
        const langToggle = document.getElementById('languageToggle');
        const targetLangInfo = this.availableLanguagesFromManifest.find(l => l.code === lang);

        if (!lang || typeof lang !== 'string' || !targetLangInfo) {
            console.warn(`Tentativo di impostare una lingua non valida o non presente nel manifest: ${lang}.`);
            let fallbackLang = this.currentLanguage;
            if (!this.availableLanguagesFromManifest.find(l => l.code === fallbackLang)) {
                fallbackLang = 'it';
            }
            if (!this.availableLanguagesFromManifest.find(l => l.code === fallbackLang) && this.availableLanguagesFromManifest.length > 0) {
                fallbackLang = this.availableLanguagesFromManifest[0].code;
            }

            if (this.availableLanguagesFromManifest.find(l => l.code === fallbackLang) && fallbackLang !== this.currentLanguage) {
                 console.warn(`Fallback a '${fallbackLang}'.`);
                 await this.setLanguageInternal(fallbackLang);
            } else if (this.availableLanguagesFromManifest.find(l => l.code === fallbackLang)) {
                 console.warn(`Mantenimento lingua corrente: '${this.currentLanguage}'.`);
            } else {
                console.error("Nessuna lingua valida disponibile per il fallback.");
            }
            if (langToggle) langToggle.setAttribute('aria-expanded', 'false');
            this.closeLanguageMenu();
            return;
        }
        if (!(await this.checkLanguageFileExists(lang))) {
            console.error(`File di traduzione per la lingua '${lang}' non trovato. Impossibile cambiare lingua.`);
            this.closeLanguageMenu();
            return;
        }

        await this.setLanguageInternal(lang);
        if (langToggle) langToggle.setAttribute('aria-expanded', 'false');
        this.closeLanguageMenu();
    },

    async setLanguageInternal(lang) {
        console.log(`[I18nManager] setLanguageInternal: Inizio impostazione lingua a '${lang}'`);
        await this.loadTranslations(lang);
        this.currentLanguage = lang;

        if (this.translations[lang] && Object.keys(this.translations[lang]).length === 0 && lang !== 'it') {
             if (this.translations['it'] && Object.keys(this.translations['it']).length > 0) {
                 this.currentLanguage = 'it';
                 console.log(`[I18nManager] setLanguageInternal: Fallback a 'it' perché '${lang}' era vuoto.`);
             }
        }

        localStorage.setItem('selectedLanguage', this.currentLanguage);
        console.log(`[I18nManager] Lingua impostata in localStorage: '${this.currentLanguage}'.`);
        document.documentElement.lang = this.currentLanguage;

        console.log("[I18nManager] Chiamata a updateUI() per elementi statici...");
        this.updateUI();
        console.log("[I18nManager] Chiamata a updateLanguageMenuActiveState()...");
        this.updateLanguageMenuActiveState();

        // Emetti un evento per notificare il cambio di lingua
        console.log(`[I18nManager] Invio evento 'languageChange' per la lingua: ${this.currentLanguage}`);
        const event = new CustomEvent('languageChange', {
            detail: {
                currentLanguage: this.currentLanguage
            }
        });
        document.dispatchEvent(event);

        console.log(`[I18nManager] setLanguageInternal: Fine impostazione lingua a '${this.currentLanguage}'`);
    },

    t(key, params = {}) {
        let effectiveLang = this.currentLanguage;
        let langTranslations = this.translations[effectiveLang];
        if ((!langTranslations || Object.keys(langTranslations).length === 0) && effectiveLang !== 'it') {
            if (this.translations['it'] && Object.keys(this.translations['it']).length > 0) {
                langTranslations = this.translations['it'];
            } else {
                langTranslations = {};
            }
        } else if (!langTranslations) {
            langTranslations = {};
        }
        let text = key.split('.').reduce((obj, k) => obj && obj[k], langTranslations);
        if (text === undefined) {
            return key;
        }
        for (const param in params) {
            text = text.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
        }
        return text;
    },

    updateUI() {
        document.querySelectorAll('[data-i18n-key]').forEach(el => {
            const key = el.dataset.i18nKey;
            const translation = this.t(key);
            if (el.innerHTML !== translation) {
                 el.innerHTML = translation;
            }
        });
        document.querySelectorAll('[data-i18n-attr]').forEach(el => {
            const attrRules = el.dataset.i18nAttr.split(';');
            attrRules.forEach(rule => {
                const [attrName, key] = rule.split(':');
                if (attrName && key) {
                    const translation = this.t(key);
                    if (el.getAttribute(attrName) !== translation) {
                        el.setAttribute(attrName, translation);
                    }
                }
            });
        });
    },

    async init() {
        console.log("[I18nManager] Inizializzazione I18nManager...");
        await this.loadManifest();

        let savedLang = localStorage.getItem('selectedLanguage');
        let initialLang = 'it';

        if (savedLang && this.availableLanguagesFromManifest.find(l => l.code === savedLang) && (await this.checkLanguageFileExists(savedLang))) {
            initialLang = savedLang;
        } else {
            const browserLang = navigator.language.split('-')[0].toLowerCase();
            if (this.availableLanguagesFromManifest.find(l => l.code === browserLang) && (await this.checkLanguageFileExists(browserLang))) {
                initialLang = browserLang;
            } else if (this.availableLanguagesFromManifest.find(l => l.code === 'it') && (await this.checkLanguageFileExists('it'))) {
                initialLang = 'it';
            } else if (this.availableLanguagesFromManifest.length > 0) {
                for (const langInfo of this.availableLanguagesFromManifest) {
                    if (await this.checkLanguageFileExists(langInfo.code)) {
                        initialLang = langInfo.code;
                        break;
                    }
                }
                 if (initialLang === 'it' && !(await this.checkLanguageFileExists('it')) && this.availableLanguagesFromManifest.length > 0) {
                    console.warn("[I18nManager] File it.json non trovato, ma è il fallback principale.");
                }
            } else {
                console.warn("[I18nManager] Manifest vuoto o non caricato, o nessuna lingua nel manifest ha un file JSON valido. Fallback a 'it'.");
            }
        }

        console.log(`[I18nManager] Lingua iniziale determinata: ${initialLang}`);
        await this.populateLanguageMenu();
        // setLanguageInternal emetterà l'evento 'languageChange'
        await this.setLanguageInternal(initialLang);

        const langToggle = document.getElementById('languageToggle');
        if (langToggle) {
            langToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleLanguageMenu();
            });
        } else {
            console.warn("[I18nManager] Elemento 'languageToggle' non trovato nel DOM.");
        }

        document.addEventListener('click', (event) => {
            const languageMenu = document.getElementById('languageMenu');
            const languageToggle = document.getElementById('languageToggle');
            if (this.isLanguageMenuOpen && languageMenu && languageToggle &&
                !languageMenu.contains(event.target) && !languageToggle.contains(event.target)) {
                this.closeLanguageMenu();
            }
        });
        console.log("[I18nManager] I18nManager inizializzato.");
    },

    async loadManifest() {
        try {
            const cacheBuster = `v_manifest=${new Date().getTime()}`;
            const response = await fetch(`./locales/locales-manifest.json?${cacheBuster}`);
            if (!response.ok) {
                throw new Error(`File locales-manifest.json non trovato o errore (status: ${response.status})`);
            }
            this.availableLanguagesFromManifest = await response.json();
            console.log("[I18nManager] Manifest delle lingue caricato:", this.availableLanguagesFromManifest);
            if (!Array.isArray(this.availableLanguagesFromManifest) || this.availableLanguagesFromManifest.some(l => !l.code || !l.name)) {
                 console.error("[I18nManager] Formato del manifest delle lingue non valido.");
                 this.availableLanguagesFromManifest = [];
            }
        } catch (error) {
            console.error("[I18nManager] Errore durante il caricamento del manifest delle lingue:", error);
            this.availableLanguagesFromManifest = [];
            if (this.availableLanguagesFromManifest.length === 0) {
                console.warn("[I18nManager] Fallback a lingue di default hardcoded a causa di errore nel manifest.");
                this.availableLanguagesFromManifest = [
                    { code: 'it', name: 'Italiano �🇹', filePath: './locales/it.json' },
                    { code: 'en', name: 'English 🇬🇧', filePath: './locales/en.json' }
                ];
            }
        }
    },

    async checkLanguageFileExists(lang) {
        if (!lang || typeof lang !== 'string') return false;
        try {
            const cacheBuster = `v_check_exist=${new Date().getTime()}`;
            const langInfo = this.availableLanguagesFromManifest.find(l => l.code === lang);
            const filePath = langInfo && langInfo.filePath ? langInfo.filePath : `./locales/${lang}.json`;

            const response = await fetch(`${filePath}?${cacheBuster}`);
            this.validLanguageFileStatus[lang] = response.ok;
            return response.ok;
        } catch (error) {
            this.validLanguageFileStatus[lang] = false;
            return false;
        }
    },

    updateLanguageMenuActiveState() {
        const languageMenu = document.getElementById('languageMenu');
        if (!languageMenu) return;

        Array.from(languageMenu.children).forEach(item => {
            if (item.dataset.langCode === this.currentLanguage) {
                item.classList.add('font-bold');
            } else {
                item.classList.remove('font-bold');
            }
        });
    },

    async populateLanguageMenu() {
        const languageMenu = document.getElementById('languageMenu');
        if (!languageMenu) {
            console.warn("[I18nManager] Elemento 'languageMenu' non trovato per il popolamento.");
            return;
        }
        languageMenu.innerHTML = '';

        if (this.availableLanguagesFromManifest.length === 0) {
            console.warn("[I18nManager] Nessuna lingua disponibile dal manifest per popolare il menu.");
            return;
        }

        let foundAnyValidLanguage = false;
        for (const langInfo of this.availableLanguagesFromManifest) {
            if (await this.checkLanguageFileExists(langInfo.code)) {
                foundAnyValidLanguage = true;
                const langItem = document.createElement('a');
                langItem.href = '#';
                langItem.dataset.langCode = langInfo.code;
                langItem.className = 'block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer whitespace-nowrap';
                langItem.textContent = langInfo.name;

                langItem.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.setLanguage(langInfo.code);
                });
                languageMenu.appendChild(langItem);
            }
        }

        if (!foundAnyValidLanguage) {
             console.warn("[I18nManager] Nessuna lingua valida con file JSON trovata per popolare il menu. Tentativo di aggiungere 'it' di default se esiste.");
             if(await this.checkLanguageFileExists('it')) {
                const langItem = document.createElement('a');
                langItem.href = '#';
                langItem.dataset.langCode = 'it';
                langItem.className = 'block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer whitespace-nowrap';
                const itLangInfo = this.availableLanguagesFromManifest.find(l=>l.code==='it');
                langItem.textContent = itLangInfo ? itLangInfo.name : "Italiano";
                langItem.addEventListener('click', (e) => {e.preventDefault(); this.setLanguage('it'); });
                languageMenu.appendChild(langItem);
             } else {
                const item = document.createElement('div');
                item.className = 'block px-4 py-2 text-sm text-gray-500 dark:text-gray-400';
                // Assicurati che la chiave 'errors.noLanguagesConfigured' esista nei tuoi file JSON
                item.textContent = this.t('errors.noLanguagesConfigured') || "Nessuna lingua";
                languageMenu.appendChild(item);
             }
        }
        this.updateLanguageMenuActiveState();
    },

    toggleLanguageMenu() {
        this.isLanguageMenuOpen = !this.isLanguageMenuOpen;
        const languageMenu = document.getElementById('languageMenu');
        const langToggle = document.getElementById('languageToggle');
        if (languageMenu && langToggle) {
            if (this.isLanguageMenuOpen) {
                languageMenu.classList.remove('hidden');
                langToggle.setAttribute('aria-expanded', 'true');
            } else {
                languageMenu.classList.add('hidden');
                langToggle.setAttribute('aria-expanded', 'false');
            }
        }
    },

    closeLanguageMenu() {
        this.isLanguageMenuOpen = false;
        const languageMenu = document.getElementById('languageMenu');
        const langToggle = document.getElementById('languageToggle');
        if (languageMenu && langToggle) {
            languageMenu.classList.add('hidden');
            langToggle.setAttribute('aria-expanded', 'false');
        }
    }
};

// Assicurati che DOMContentLoaded sia gestito correttamente per l'inizializzazione.
// Lo script viene eseguito quando il DOM è pronto o aggiunge un listener.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        I18nManager.init();
    });
} else {
    // Il DOM è già pronto
    I18nManager.init();
}