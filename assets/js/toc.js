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

        // 仅收集标题作为目录项
        const headers = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        tocContainer.textContent = '';

        if (headers.length === 0) return;

        function createStyledList() {
            const ul = document.createElement('ul');
            ul.style.listStyle = 'none';
            ul.style.margin = '0';
            ul.style.paddingLeft = '16px';
            return ul;
        }

        // 收集所有目录项元素，按DOM顺序处理
        const usedIds = new Set();
        
        // 为所有标题添加ID
        headers.forEach((header, index) => {
            if (!header.id) {
                header.id = toSlug(header.textContent, index, usedIds);
            } else {
                usedIds.add(header.id);
            }
        });
        
        // 收集标题元素，按DOM顺序排序
        const allElements = [];
        
        // 递归遍历所有子节点，收集标题
        function collectElements(node) {
            if (!node) return;
            
            if (node.nodeType === Node.ELEMENT_NODE) {
                const tag = node.tagName.toLowerCase();
                if (tag.match(/^h[1-6]$/)) {
                    allElements.push({
                        element: node,
                        level: Number(tag.slice(1)),
                        id: node.id,
                        text: node.textContent.trim(),
                        type: 'header'
                    });
                }
            }
            
            // 递归遍历子节点
            for (const child of node.childNodes) {
                collectElements(child);
            }
        }
        
        collectElements(content);
        
        const tocElements = allElements;
        
        const rootList = createStyledList();
        let currentLevel = tocElements.length > 0 ? tocElements[0].level : 1;
        let currentList = rootList;
        const stack = [rootList];
        const tocLinks = [];

        tocElements.forEach((tocItem) => {
            const item = document.createElement('li');
            const link = document.createElement('a');
            link.href = `#${tocItem.id}`;
            link.textContent = tocItem.text;
            link.dataset.targetId = tocItem.id;
            item.appendChild(link);
            tocLinks.push(link);
            
            const level = tocItem.level;
            
            if (level > currentLevel) {
                const jump = level - currentLevel;
                for (let i = 0; i < jump; i++) {
                    const nestedList = createStyledList();
                    const parentItem = stack[stack.length - 1].lastElementChild;

                    if (parentItem) {
                        parentItem.appendChild(nestedList);
                    } else {
                        currentList.appendChild(nestedList);
                    }

                    stack.push(nestedList);
                    currentList = nestedList;
                }
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
            let activeId = tocElements.length > 0 ? tocElements[0].id : '';

            tocElements.forEach((item) => {
                const element = item.element;
                if (element.getBoundingClientRect().top - activationY <= 0) {
                    activeId = item.id;
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
