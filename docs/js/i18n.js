// docs/js/i18n.js

/**
 * @namespace I18nManager
 * @description Gestisce l'internazionalizzazione (i18n) dell'applicazione
 * caricando file di traduzione suddivisi per namespace.
 */
const I18nManager = {
    currentLanguage: 'it',
    translations: {}, // Struttura: { lang: { namespace: {...} } }
    loadedNamespaces: new Set(),
    availableLanguagesFromManifest: [],
    isLanguageMenuOpen: false,

    /**
     * Carica un singolo namespace di traduzione.
     * @param {string} lang - Codice lingua (es. 'it').
     * @param {string} namespace - Il nome del file JSON da caricare (es. 'common', 'index').
     * @returns {Promise<boolean>} True se il caricamento ha avuto successo, false altrimenti.
     */
    async loadNamespace(lang, namespace) {
        if (this.translations[lang] && this.translations[lang][namespace]) {
            return true;
        }
        try {
            const path = `./locales/${lang}/${namespace}.json?v=${new Date().getTime()}`;
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`File ${path} non trovato (status: ${response.status})`);
            }

            if (!this.translations[lang]) {
                this.translations[lang] = {};
            }
            this.translations[lang][namespace] = await response.json();

            this.loadedNamespaces.add(namespace);
            return true;
        } catch (error) {
            console.error(`[I18nManager] Errore caricando il namespace '${namespace}' per '${lang}':`, error.message);
            return false;
        }
    },

    /**
     * Carica un elenco di namespace per la lingua corrente.
     * @param {string[]} namespaces - Array di namespace da caricare.
     */
    async loadNamespaces(namespaces = []) {
        const promises = namespaces.map(ns => this.loadNamespace(this.currentLanguage, ns));
        await Promise.all(promises);
    },

    /**
     * Imposta la lingua e ricarica i namespace necessari.
     * @param {string} lang - Il codice della nuova lingua.
     */
    async setLanguage(lang) {
        if (!lang || lang === this.currentLanguage || !this.availableLanguagesFromManifest.find(l => l.code === lang)) {
            if (this.isLanguageMenuOpen) this.closeLanguageMenu();
            return;
        }
        this.currentLanguage = lang;
        localStorage.setItem('selectedLanguage', lang);
        document.documentElement.lang = lang;
        console.log(`[I18nManager] Lingua cambiata in '${lang}'. Ricarico i namespace...`);

        await this.loadNamespaces(Array.from(this.loadedNamespaces));

        this.updateUI();
        this.updateLanguageMenuActiveState();

        const event = new CustomEvent('languageChange', { detail: { currentLanguage: this.currentLanguage } });
        document.dispatchEvent(event);

        if (this.isLanguageMenuOpen) this.closeLanguageMenu();
    },

    /**
     * Recupera una stringa di traduzione usando una chiave con namespace.
     * @param {string} key - La chiave, formato "namespace.path.to.key".
     * @param {Object} [params={}] - Parametri per interpolazione.
     * @returns {string} La stringa tradotta o la chiave stessa.
     */
    t(key, params = {}) {
        const keyParts = key.split('.');
        if (keyParts.length < 2) {
            console.warn(`[I18nManager] Chiave i18n "${key}" non valida. Deve includere un namespace (es. 'common.appTitle').`);
            return key;
        }
        const namespace = keyParts[0];
        const actualKey = keyParts.slice(1).join('.');
        const langTranslations = this.translations[this.currentLanguage];

        if (!langTranslations || !langTranslations[namespace]) {
            return key;
        }

        let text = actualKey.split('.').reduce((obj, k) => obj && obj[k], langTranslations[namespace]);

        if (text === undefined) {
            if (namespace !== 'common' && langTranslations['common']) {
                text = actualKey.split('.').reduce((obj, k) => obj && obj[k], langTranslations['common']);
            }
            if (text === undefined) {
                return key;
            }
        }

        for (const param in params) {
            text = text.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
        }
        return text;
    },

    /**
     * Aggiorna gli elementi HTML statici con le traduzioni.
     */
    updateUI() {
        document.querySelectorAll('[data-i18n-key]').forEach(el => {
            const key = el.dataset.i18nKey;
            const translation = this.t(key);
            if (el.innerHTML !== translation) el.innerHTML = translation;
        });
        document.querySelectorAll('[data-i18n-attr]').forEach(el => {
            const attrRules = el.dataset.i18nAttr.split(';');
            attrRules.forEach(rule => {
                const [attrName, key] = rule.split(':');
                if (attrName && key) {
                    const translation = this.t(key);
                    if (el.getAttribute(attrName) !== translation) el.setAttribute(attrName, translation);
                }
            });
        });
    },

    /**
     * Inizializza il gestore, caricando il manifest e i namespace richiesti.
     */
    async init(requiredNamespaces = []) {
        console.log("[I18nManager] Init con namespace richiesti:", requiredNamespaces);
        await this.loadManifest();

        let initialLang = 'it';
        const savedLang = localStorage.getItem('selectedLanguage');
        const browserLang = navigator.language.split('-')[0].toLowerCase();

        const langExists = (langCode) => this.availableLanguagesFromManifest.some(l => l.code === langCode);

        if (savedLang && langExists(savedLang)) initialLang = savedLang;
        else if (browserLang && langExists(browserLang)) initialLang = browserLang;
        else if (!langExists('it') && this.availableLanguagesFromManifest.length > 0) {
            initialLang = this.availableLanguagesFromManifest[0].code;
        }

        this.currentLanguage = initialLang;
        localStorage.setItem('selectedLanguage', initialLang);
        document.documentElement.lang = initialLang;
        console.log(`[I18nManager] Lingua iniziale impostata a '${initialLang}'.`);

        await this.loadNamespaces(requiredNamespaces);

        await this.populateLanguageMenu();
        this.setupMenuListeners();
        return this;
    },

    /**
     * Carica il file manifest delle lingue.
     */
    async loadManifest() {
        try {
            const response = await fetch(`./locales/locales-manifest.json?v=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`Manifest non trovato`);
            this.availableLanguagesFromManifest = await response.json();
        } catch (error) {
            console.error("[I18nManager] Errore caricando il manifest. Fallback:", error.message);
            this.availableLanguagesFromManifest = [
                { "code": "it", "name": "Italiano 🇮🇹" },
                { "code": "en", "name": "English 🇬🇧" }
            ];
        }
    },

    /**
     * Imposta i listener per il menu delle lingue.
     */
    setupMenuListeners() {
        const langToggle = document.getElementById('languageToggle');
        if (langToggle) {
            langToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleLanguageMenu();
            });
        }
        document.addEventListener('click', (event) => {
            if (this.isLanguageMenuOpen) {
                const languageMenu = document.getElementById('languageMenu');
                const languageToggle = document.getElementById('languageToggle');
                if (languageMenu && languageToggle && !languageMenu.contains(event.target) && !languageToggle.contains(event.target)) {
                    this.closeLanguageMenu();
                }
            }
        });
    },

    /**
     * Popola il menu a tendina delle lingue basandosi sul manifest.
     */
    async populateLanguageMenu() {
        const languageMenu = document.getElementById('languageMenu');
        if (!languageMenu) return;
        languageMenu.innerHTML = '';

        for (const langInfo of this.availableLanguagesFromManifest) {
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
        this.updateLanguageMenuActiveState();
    },

    /**
     * Aggiorna lo stile (es. grassetto) per la lingua attualmente attiva nel menu.
     */
    updateLanguageMenuActiveState() {
        const languageMenu = document.getElementById('languageMenu');
        if (!languageMenu) return;
        Array.from(languageMenu.children).forEach(item => {
            item.classList.toggle('font-bold', item.dataset.langCode === this.currentLanguage);
        });
    },

    /**
     * Apre/chiude il menu a tendina delle lingue.
     */
    toggleLanguageMenu() {
        this.isLanguageMenuOpen = !this.isLanguageMenuOpen;
        const languageMenu = document.getElementById('languageMenu');
        const langToggle = document.getElementById('languageToggle');
        if (languageMenu && langToggle) {
            languageMenu.classList.toggle('hidden', !this.isLanguageMenuOpen);
            langToggle.setAttribute('aria-expanded', this.isLanguageMenuOpen);
        }
    },

    /**
     * Chiude forzatamente il menu delle lingue.
     */
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
