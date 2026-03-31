// assets/js/toc.js
(function () {
    function getHeaderOffset() {
        const header = document.querySelector('.site-header');
        return header ? header.offsetHeight : 0;
    }

    function smoothScrollToElement(element, offset) {
        if (!element) return;

        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    function toSlug(text, index, usedIds) {
        let slug = text
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\u4e00-\u9fa5\-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        if (!slug) {
            slug = `heading-${index}`;
        }

        let candidate = slug;
        let counter = 1;

        while (usedIds.has(candidate) || document.getElementById(candidate)) {
            candidate = `${slug}-${counter}`;
            counter += 1;
        }

        usedIds.add(candidate);
        return candidate;
    }

    function generateTOC() {
        const content = document.querySelector('.post-content');
        const tocContainer = document.querySelector('.toc-content');

        if (!content || !tocContainer) return;

        const headers = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
        tocContainer.textContent = '';

        if (headers.length === 0) return;

        const rootList = document.createElement('ul');
        let currentLevel = 1;
        let currentList = rootList;
        const stack = [rootList];
        const usedIds = new Set();
        const tocLinks = [];

        headers.forEach((header, index) => {
            if (!header.id) {
                header.id = toSlug(header.textContent, index, usedIds);
            } else {
                usedIds.add(header.id);
            }

            const level = Number(header.tagName.slice(1));
            const item = document.createElement('li');
            const link = document.createElement('a');
            link.href = `#${header.id}`;
            link.textContent = header.textContent;
            link.dataset.targetId = header.id;
            item.appendChild(link);
            tocLinks.push(link);

            if (level > currentLevel) {
                const nestedList = document.createElement('ul');
                const parentItem = stack[stack.length - 1].lastElementChild;

                if (parentItem) {
                    parentItem.appendChild(nestedList);
                } else {
                    currentList.appendChild(nestedList);
                }

                stack.push(nestedList);
                currentList = nestedList;
            } else if (level < currentLevel) {
                for (let i = 0; i < currentLevel - level; i += 1) {
                    stack.pop();
                }

                currentList = stack[stack.length - 1];
            }

            currentList.appendChild(item);
            currentLevel = level;
        });

        tocContainer.appendChild(rootList);

        function setActiveLink(activeId) {
            tocLinks.forEach((link) => {
                const isActive = link.dataset.targetId === activeId;
                link.classList.toggle('is-active', isActive);
                if (isActive) {
                    link.setAttribute('aria-current', 'true');
                } else {
                    link.removeAttribute('aria-current');
                }
            });
        }

        function updateActiveLink() {
            const headerOffset = getHeaderOffset();
            const activationY = headerOffset + 24;
            let activeId = headers[0].id;

            headers.forEach((header) => {
                if (header.getBoundingClientRect().top - activationY <= 0) {
                    activeId = header.id;
                }
            });

            setActiveLink(activeId);
        }

        updateActiveLink();

        tocContainer.addEventListener('click', (event) => {
            const link = event.target.closest('a[data-target-id]');
            if (!link) return;

            event.preventDefault();

            const target = document.getElementById(link.dataset.targetId || '');
            if (!target) return;

            smoothScrollToElement(target, getHeaderOffset());
            history.pushState(null, '', `#${encodeURIComponent(link.dataset.targetId)}`);
            setActiveLink(link.dataset.targetId || '');
        }, { passive: false });

        let ticking = false;

        window.addEventListener('scroll', () => {
            if (ticking) return;

            ticking = true;
            window.requestAnimationFrame(() => {
                ticking = false;
                updateActiveLink();
            });
        }, { passive: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', generateTOC, { once: true });
    } else {
        generateTOC();
    }
})();
