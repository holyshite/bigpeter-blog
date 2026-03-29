// assets/js/nav.js
(function () {
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

    function initNav() {
        setActiveNavLink();
        bindNavClickEvents();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNav, { once: true });
    } else {
        initNav();
    }
})();
