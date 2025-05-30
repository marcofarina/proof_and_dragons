// js/tailwind.config.js
// Questo oggetto definisce la configurazione personalizzata per Tailwind CSS.

tailwind.config = {
    darkMode: 'class', // Abilita la modalità dark basata su classe HTML
    theme: {
        extend: {
            // Estende la palette di colori di default di Tailwind
            colors: {
                'game-cyan': { DEFAULT: '#06b6d4', light: '#67e8f9', dark: '#0891b2' },
                'game-purple': { DEFAULT: '#8b5cf6', light: '#c084fc', dark: '#7c3aed' },
                'game-teal': { DEFAULT: '#14b8a6', light: '#5eead4', dark: '#0d9488' },
                'game-orange': { DEFAULT: '#f97316', light: '#fdba74', dark: '#ea580c' },
                'game-indigo': { DEFAULT: '#6366f1', light: '#a5b4fc', dark: '#4f46e5' },
                'game-red': { DEFAULT: '#ef4444', light: '#fca5a5', dark: '#dc2626' },
                'game-green': { DEFAULT: '#22c55e', light: '#86efac', dark: '#16a34a' },
                'game-yellow': { DEFAULT: '#eab308', light: '#fde047', dark: '#ca8a04' },
            },
            // Estende i font di default di Tailwind
            fontFamily: {
                'display': ['"Press Start 2P"', 'cursive'], // Font per titoli e elementi "game"
                'body': ['Inter', 'sans-serif'],          // Font per il corpo del testo
            },
            // Aggiunge animazioni personalizzate
            animation: {
                'fadeInUp': 'fadeInUp 0.5s ease-out forwards',
            },
            // Definisce i keyframes per le animazioni personalizzate
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            }
        }
    }
};
