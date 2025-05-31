// js/manual.js

document.addEventListener('DOMContentLoaded', () => {
    // --- GESTIONE TEMA ---
    const htmlElement = document.documentElement;
    const themeToggleButtonManual = document.getElementById('themeToggleManual');
    const themeIconSunManual = document.getElementById('themeIconSunManual');
    const themeIconMoonManual = document.getElementById('themeIconMoonManual');

    if (themeToggleButtonManual && themeIconSunManual && themeIconMoonManual) {
        const applyThemeManual = (theme) => {
            localStorage.setItem('theme', theme); // Salva la preferenza
            if (theme === 'dark') {
                htmlElement.classList.add('dark');
                themeIconSunManual.classList.remove('hidden');
                themeIconMoonManual.classList.add('hidden');
                themeToggleButtonManual.setAttribute('aria-pressed', 'true');
            } else {
                htmlElement.classList.remove('dark');
                themeIconSunManual.classList.add('hidden');
                themeIconMoonManual.classList.remove('hidden');
                themeToggleButtonManual.setAttribute('aria-pressed', 'false');
            }
        };

        const toggleThemeManual = () => {
            const currentThemeIsDark = htmlElement.classList.contains('dark');
            applyThemeManual(currentThemeIsDark ? 'light' : 'dark');
        };

        const loadThemeManual = () => {
            const savedTheme = localStorage.getItem('theme');
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            applyThemeManual(savedTheme || (systemPrefersDark ? 'dark' : 'light'));
        };

        themeToggleButtonManual.addEventListener('click', toggleThemeManual);
        loadThemeManual(); // Carica il tema all'avvio
    } else {
        console.error("Elementi per il toggle del tema nel manuale non trovati!");
    }

    // --- GESTIONE NAVIGAZIONE E SCROLL-TO-TOP ---
    const navElement = document.getElementById('manualNav'); // Rinominato per chiarezza
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const navHeight = navElement ? navElement.offsetHeight : 0; // Altezza della nav sticky

    // Smooth scroll gestito da JavaScript per i link di navigazione interna
    // per un controllo preciso dell'offset.
    if (navElement) {
        const navLinks = navElement.querySelectorAll('a[href^="#"]');
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault(); // Previene il comportamento di default del link #
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);

                if (targetElement) {
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.scrollY - navHeight - 10; // Aggiunto un piccolo offset extra di 10px

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }


    // Gestione bottone "Scroll to Top"
    if (scrollToTopBtn) {
        // Mostra/nascondi bottone
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) { // Mostra dopo aver scrollato 300px (usando scrollY)
                scrollToTopBtn.classList.remove('hidden');
                scrollToTopBtn.classList.add('opacity-100');
            } else {
                scrollToTopBtn.classList.add('hidden');
                scrollToTopBtn.classList.remove('opacity-100');
            }
        });

        // Scrolla in cima al click
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Aggiorna l'anno corrente nel footer
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear().toString(); // Convertito in stringa
    }
});
