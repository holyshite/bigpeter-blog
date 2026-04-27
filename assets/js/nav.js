// assets/js/nav.js
(function () {
    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function normalizePath(path) {
        return path.replace(/^\/|\/$/g, '');
    }

    function updateNavIndicator(targetLink) {
        const indicator = document.querySelector('.site-header .nav .nav-indicator');
        if (!indicator) return;

        if (!targetLink) {
            indicator.style.opacity = '0';
            return;
        }

        const navLinks = targetLink.closest('.nav-links');
        if (!navLinks) return;

        const linkRect = targetLink.getBoundingClientRect();
        const navRect = navLinks.getBoundingClientRect();

        indicator.style.opacity = '1';
        indicator.style.left = `${linkRect.left - navRect.left}px`;
        indicator.style.width = `${linkRect.width}px`;
        indicator.style.top = `${linkRect.top - navRect.top}px`;
        indicator.style.height = `${linkRect.height}px`;
    }

    function setActiveNavLink() {
        const currentPath = normalizePath(window.location.pathname);
        const navLinks = document.querySelectorAll('.site-header .nav a');
        const section = document.body?.dataset?.section;

        let activeLink = null;

        navLinks.forEach((link) => {
            link.classList.remove('active');

            const href = link.getAttribute('href');
            if (!href || href.startsWith('http') || href === '#') return;

            const linkPath = normalizePath(href.replace(/^\.\.?\//, ''));

            if ((linkPath === '' || linkPath === 'index.html') && (currentPath === '' || currentPath === 'index.html')) {
                link.classList.add('active');
                activeLink = link;
                return;
            }

            if (linkPath && (currentPath === linkPath || currentPath.startsWith(`${linkPath}/`) || currentPath.startsWith(linkPath))) {
                link.classList.add('active');
                activeLink = link;
            }
        });

        // 如果 URL 匹配不上（如具体文章页），用 data-section 确定选中项
        if (!activeLink && section) {
            navLinks.forEach((link) => {
                const href = link.getAttribute('href');
                if (!href) return;
                const linkPath = normalizePath(href.replace(/^\.\.?\//, ''));
                if (linkPath === section) {
                    link.classList.add('active');
                    activeLink = link;
                }
            });
        }

        updateNavIndicator(activeLink);
    }

    function bindNavClickEvents() {
        const nav = document.querySelector('.site-header .nav');
        const navLinks = document.querySelector('.site-header .nav-links');
        if (!nav) return;

        nav.addEventListener('click', (event) => {
            const link = event.target.closest('a');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href || href.startsWith('http') || href === '#') return;

            const isActive = link.classList.contains('active');

            nav.querySelectorAll('a').forEach((navLink) => {
                navLink.classList.remove('active');
            });

            link.classList.add('active');
            updateNavIndicator(link);

            if (!isActive) {
                const linkPath = normalizePath(href.replace(/^\.\.?\//, ''));
                const currentPath = normalizePath(window.location.pathname);

                if (linkPath !== currentPath) {
                    event.preventDefault();
                    setTimeout(() => {
                        window.location.href = href;
                    }, 300);
                }
            }
        });

        if (!navLinks) return;

        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('mouseenter', () => {
                updateNavIndicator(link);
            });
        });

        navLinks.addEventListener('mouseleave', () => {
            const activeLink = document.querySelector('.site-header .nav a.active');
            if (activeLink) updateNavIndicator(activeLink);
        });
    }

    function updateAsideRight() {
        const root = document.documentElement;
        const windowWidth = window.innerWidth;
        const maxWidth = 1260;

        // 计算侧边栏的正确右边距，避免滚动条影响
        const rightValue = Math.max(
            (windowWidth - maxWidth) / 2,
            windowWidth * 0.15 - 30
        );

        root.style.setProperty('--aside-right', `${rightValue}px`);
    }

    function updateAsideHeight() {
        const firstAside = document.querySelector('.sidebar-wrapper .page-aside-card:nth-child(1)');
        const root = document.documentElement;

        if (firstAside) {
            const height = firstAside.offsetHeight;
            root.style.setProperty('--aside-height', `${height}px`);
        }
    }

    let resizeObserver;

    function observeAsideSize() {
        const firstAside = document.querySelector('.sidebar-wrapper .page-aside-card:nth-child(1)');
        if (!firstAside || resizeObserver) return;

        resizeObserver = new ResizeObserver(() => {
            updateAsideHeight();
        });

        resizeObserver.observe(firstAside);
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

        window.addEventListener('resize', () => {
            updateAsideHeight();
            updateAsideRight();
            const activeLink = document.querySelector('.site-header .nav a.active');
            if (activeLink) updateNavIndicator(activeLink);
        }, { passive: true });

        if (typeof mobileMedia.addEventListener === 'function') {
            mobileMedia.addEventListener('change', updateHeaderTop);
        } else if (typeof mobileMedia.addListener === 'function') {
            mobileMedia.addListener(updateHeaderTop);
        }
    }

    function initNavIndicator() {
        const indicator = document.querySelector('.site-header .nav .nav-indicator');
        if (!indicator) return;

        const activeLink = document.querySelector('.site-header .nav a.active');
        if (activeLink) {
            indicator.style.transition = 'none';
            updateNavIndicator(activeLink);
            indicator.offsetHeight;
            indicator.style.transition = '';
        } else {
            indicator.style.opacity = '0';
        }
    }

    function bindTopBtnScroll() {
        const topBtn = document.querySelector('.top-btn');
        if (!topBtn) return;

        const SCROLL_THRESHOLD = 300;
        let ticking = false;

        function updateTopBtn() {
            ticking = false;
            topBtn.classList.toggle('top-btn--visible', window.scrollY > SCROLL_THRESHOLD);
        }

        updateTopBtn();

        window.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(updateTopBtn);
        }, { passive: true });
    }

    function bindTopBtnClick() {
        const topBtn = document.querySelector('.top-btn');
        if (!topBtn) return;

        topBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    function initNav() {
        setActiveNavLink();
        bindNavClickEvents();
        bindHeaderScrollMotion();
        bindTopBtnScroll();
        bindTopBtnClick();
        updateAsideHeight();
        updateAsideRight();
        observeAsideSize();
        initNavIndicator();

        // 延迟再计算一次，确保所有内容都加载完成
        setTimeout(() => {
            updateAsideHeight();
            updateAsideRight();
            const activeLink = document.querySelector('.site-header .nav a.active');
            if (activeLink) updateNavIndicator(activeLink);
        }, 500);

        // 监听 DOM 变化重新计算侧边栏高度
        const observer = new MutationObserver(() => {
            updateAsideHeight();
        });

        const container = document.querySelector('.sidebar-wrapper');
        if (container) {
            observer.observe(container, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true
            });
        }

        // 监听主题切换，重新计算侧边栏位置
        window.addEventListener('site-theme-change', () => {
            updateAsideRight();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNav, { once: true });
    } else {
        initNav();
    }
})();
