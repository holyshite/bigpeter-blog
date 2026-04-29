// assets/js/theme.js
(function () {
    const STORAGE_KEY = 'site-theme';
    const BG_STORAGE_KEY = 'site-bg';
    const DARK_THEME = 'dark';
    const LIGHT_THEME = 'light';
    const BG_OPTIONS = ['paper', 'gradient', 'clean'];
    const DEFAULT_BG = 'paper';

    function getStoredTheme() {
        try {
            const value = window.localStorage.getItem(STORAGE_KEY);
            if (value === DARK_THEME) return DARK_THEME;
            if (value === LIGHT_THEME) return LIGHT_THEME;
            return LIGHT_THEME;
        } catch (error) {
            return LIGHT_THEME;
        }
    }

    function setStoredTheme(theme) {
        try {
            window.localStorage.setItem(STORAGE_KEY, theme);
        } catch (error) {
            // Ignore storage failures and keep the current in-memory theme.
        }
    }

    function getStoredBg() {
        try {
            const value = window.localStorage.getItem(BG_STORAGE_KEY);
            return BG_OPTIONS.includes(value) ? value : DEFAULT_BG;
        } catch (error) {
            return DEFAULT_BG;
        }
    }

    function setStoredBg(bg) {
        try {
            window.localStorage.setItem(BG_STORAGE_KEY, bg);
        } catch (error) {
            // Ignore storage failures.
        }
    }

    function applyTheme(theme) {
        const nextTheme = theme === LIGHT_THEME ? LIGHT_THEME : DARK_THEME;
        document.body.classList.toggle('theme-light', nextTheme === LIGHT_THEME);
        document.body.classList.toggle('theme-dark', nextTheme === DARK_THEME);
        document.documentElement.setAttribute('data-theme', nextTheme);

        const toggle = document.querySelector('.theme-toggle');
        const icon = toggle ? toggle.querySelector('.theme-toggle__icon') : null;

        if (toggle && icon) {
            const nextTarget = nextTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
            const nextIcon = nextTheme === DARK_THEME ? toggle.dataset.iconDark : toggle.dataset.iconLight;

            toggle.dataset.themeTarget = nextTarget;
            toggle.setAttribute('aria-pressed', String(nextTheme === LIGHT_THEME));
            toggle.setAttribute('aria-label', nextTheme === DARK_THEME ? '切换到白天主题' : '切换到黑夜主题');
            icon.src = nextIcon;
        }

        // Show/hide background selector
        updateBgVisibility(nextTheme);

        window.dispatchEvent(new CustomEvent('site-theme-change', {
            detail: { theme: nextTheme }
        }));
    }

    function applyBg(bg) {
        document.documentElement.setAttribute('data-bg', bg);
        document.querySelectorAll('.bg-btn').forEach(function (btn) {
            btn.classList.toggle('is-active', btn.dataset.bg === bg);
        });
        window.dispatchEvent(new CustomEvent('site-bg-change', {
            detail: { bg: bg }
        }));
    }

    function updateBgVisibility(theme) {
        var selector = document.querySelector('.bg-selector');
        if (selector) {
            selector.hidden = theme !== LIGHT_THEME;
        }
    }

    function bindThemeToggle() {
        const toggle = document.querySelector('.theme-toggle');
        if (!toggle) return;

        toggle.addEventListener('click', () => {
            const nextTheme = toggle.dataset.themeTarget === LIGHT_THEME ? LIGHT_THEME : DARK_THEME;
            applyTheme(nextTheme);
            setStoredTheme(nextTheme);
        });
    }

    function bindBgSelector() {
        const selector = document.querySelector('.bg-selector');
        if (!selector) return;

        selector.addEventListener('click', function (e) {
            const btn = e.target.closest('.bg-btn');
            if (!btn) return;
            const bg = btn.dataset.bg;
            applyBg(bg);
            setStoredBg(bg);
        });
    }

    function initTheme() {
        applyTheme(getStoredTheme());
        applyBg(getStoredBg());
        bindThemeToggle();
        bindBgSelector();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme, { once: true });
    } else {
        initTheme();
    }
})();
