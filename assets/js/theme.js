// assets/js/theme.js
(function () {
    const STORAGE_KEY = 'site-theme';
    const DARK_THEME = 'dark';
    const LIGHT_THEME = 'light';

    function getStoredTheme() {
        try {
            const value = window.localStorage.getItem(STORAGE_KEY);
            return value === LIGHT_THEME ? LIGHT_THEME : DARK_THEME;
        } catch (error) {
            return DARK_THEME;
        }
    }

    function setStoredTheme(theme) {
        try {
            window.localStorage.setItem(STORAGE_KEY, theme);
        } catch (error) {
            // Ignore storage failures and keep the current in-memory theme.
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

        window.dispatchEvent(new CustomEvent('site-theme-change', {
            detail: { theme: nextTheme }
        }));
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

    function initTheme() {
        applyTheme(getStoredTheme());
        bindThemeToggle();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme, { once: true });
    } else {
        initTheme();
    }
})();
