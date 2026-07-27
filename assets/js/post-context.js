(function () {
    const storageKey = 'post-list-context';

    function normalizePath(url) {
        return new URL(url, window.location.origin).pathname.replace(/\/$/, '');
    }

    function read() {
        try {
            const context = JSON.parse(sessionStorage.getItem(storageKey));
            return context && Array.isArray(context.posts) ? context : null;
        } catch (error) {
            return null;
        }
    }

    function write(context) {
        try {
            sessionStorage.setItem(storageKey, JSON.stringify(context));
        } catch (error) {
            // Session storage is optional; filtering still works without it.
        }
    }

    function clear() {
        try {
            sessionStorage.removeItem(storageKey);
        } catch (error) {
            // Ignore unavailable session storage.
        }
    }

    function updateNavItem(nav, className, post, position) {
        const current = nav.querySelector('.' + className);
        if (!current) return;

        if (!post) {
            if (current.tagName === 'SPAN') return;
            const disabled = document.createElement('span');
            disabled.className = className + ' disabled';
            disabled.textContent = position === 'next' ? '没有更新的文章' : '没有更早的文章';
            current.replaceWith(disabled);
            return;
        }

        const label = position === 'next' ? '← ' + post.title : post.title + ' →';
        if (current.tagName === 'A') {
            current.href = post.url;
            current.textContent = label;
            return;
        }

        const link = document.createElement('a');
        link.className = className;
        link.href = post.url;
        link.textContent = label;
        current.replaceWith(link);
    }

    function applyArticleNavigation() {
        const nav = document.querySelector('.post-card .post-nav');
        const context = read();
        if (!nav || !context || !context.posts.length) return;

        const currentPath = normalizePath(window.location.href);
        const currentIndex = context.posts.findIndex(function (post) {
            return normalizePath(post.url) === currentPath;
        });
        if (currentIndex === -1) return;

        updateNavItem(nav, 'next', context.posts[currentIndex - 1], 'next');
        updateNavItem(nav, 'prev', context.posts[currentIndex + 1], 'prev');
    }

    window.postListContext = { read: read, write: write, clear: clear };
    document.addEventListener('DOMContentLoaded', applyArticleNavigation);
})();
