// assets/js/nav.js
(function () {
    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function normalizePath(path) {
        return path.replace(/^\/|\/$/g, '');
    }

    function setActiveNavLink() {
        const currentPath = normalizePath(window.location.pathname);
        const navLinks = document.querySelectorAll('.site-header .nav a');

        navLinks.forEach((link) => {
            link.classList.remove('active');

            const href = link.getAttribute('href');
            if (!href || href.startsWith('http') || href === '#') return;

            const linkPath = normalizePath(href.replace(/^\.\.?\//, ''));

            if ((linkPath === '' || linkPath === 'index.html') && (currentPath === '' || currentPath === 'index.html')) {
                link.classList.add('active');
                return;
            }

            if (linkPath && (currentPath === linkPath || currentPath.startsWith(`${linkPath}/`) || currentPath.startsWith(linkPath))) {
                link.classList.add('active');
            }
        });
    }

    function bindNavClickEvents() {
        const nav = document.querySelector('.site-header .nav');
        if (!nav) return;

        nav.addEventListener('click', (event) => {
            const link = event.target.closest('a');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href || href.startsWith('http') || href === '#') return;

            nav.querySelectorAll('a').forEach((navLink) => {
                navLink.classList.remove('active');
            });

            link.classList.add('active');
        });
    }

    function bindHeaderScrollMotion() {
        const header = document.querySelector('.site-header');
        if (!header) return;

        const rawTop = window.getComputedStyle(header).top;
        const initialTop = Number.parseFloat(rawTop);
        if (!Number.isFinite(initialTop)) return;

        const root = document.documentElement;
        const mobileMedia = window.matchMedia('(max-width: 720px)');

        let ticking = false;

        function updateHeaderTop() {
            ticking = false;

            const scrollY = window.scrollY || window.pageYOffset || 0;
            const nextTop = mobileMedia.matches ? initialTop : clamp(initialTop - scrollY, 0, initialTop);
            header.style.setProperty('--header-top', `${nextTop}px`);
            root.style.setProperty('--header-current-top', `${nextTop}px`);
            root.style.setProperty('--header-height', `${header.offsetHeight}px`);
        }

        updateHeaderTop();

        window.addEventListener('scroll', () => {
            if (ticking) return;

            ticking = true;
            window.requestAnimationFrame(updateHeaderTop);
        }, { passive: true });

        if (typeof mobileMedia.addEventListener === 'function') {
            mobileMedia.addEventListener('change', updateHeaderTop);
        } else if (typeof mobileMedia.addListener === 'function') {
            mobileMedia.addListener(updateHeaderTop);
        }
    }

    function initNav() {
        setActiveNavLink();
        bindNavClickEvents();
        bindHeaderScrollMotion();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNav, { once: true });
    } else {
        initNav();
    }
})();
