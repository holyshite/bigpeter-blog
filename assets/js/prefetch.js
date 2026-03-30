// assets/js/prefetch.js
(function () {
    const prefetchedUrls = new Set();
    const supportsIO = 'IntersectionObserver' in window;

    function canPrefetch() {
        const link = document.createElement('link');
        return !link.relList || !link.relList.supports || link.relList.supports('prefetch');
    }

    function shouldPrefetch(anchor) {
        if (!anchor) return false;
        if (anchor.target && anchor.target !== '_self') return false;
        if (anchor.hasAttribute('download')) return false;

        const href = anchor.getAttribute('href');
        if (!href || href.startsWith('#')) return false;

        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return false;
        if (url.pathname === window.location.pathname && url.hash === window.location.hash) return false;

        return true;
    }

    function prefetch(anchor) {
        if (!canPrefetch() || !shouldPrefetch(anchor)) return;

        const url = new URL(anchor.href, window.location.href);
        const key = `${url.pathname}${url.search}`;

        if (prefetchedUrls.has(key)) return;
        prefetchedUrls.add(key);

        const preloadLink = document.createElement('link');
        preloadLink.rel = 'prefetch';
        preloadLink.href = url.href;
        preloadLink.as = 'document';
        document.head.appendChild(preloadLink);
    }

    function warmVisibleLinks() {
        const links = document.querySelectorAll('.site-header a, .post-item a, .post-nav a');

        if (!supportsIO) {
            links.forEach(prefetch);
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                prefetch(entry.target);
                observer.unobserve(entry.target);
            });
        }, {
            rootMargin: '200px'
        });

        links.forEach((link) => observer.observe(link));
    }

    function findAnchorFromEventTarget(target) {
        return target instanceof Element ? target.closest('a') : null;
    }

    function initPrefetch() {
        document.addEventListener('pointerenter', (event) => {
            const anchor = findAnchorFromEventTarget(event.target);
            prefetch(anchor);
        }, true);

        document.addEventListener('focusin', (event) => {
            const anchor = findAnchorFromEventTarget(event.target);
            prefetch(anchor);
        });

        document.addEventListener('touchstart', (event) => {
            const anchor = findAnchorFromEventTarget(event.target);
            prefetch(anchor);
        }, { passive: true });

        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(warmVisibleLinks, { timeout: 1200 });
        } else {
            window.setTimeout(warmVisibleLinks, 600);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPrefetch, { once: true });
    } else {
        initPrefetch();
    }
})();
