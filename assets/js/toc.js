// assets/js/toc.js
(function () {
    // 获取 header 的高度（考虑固定定位的元素）
    function getHeaderOffset() {
        const header = document.querySelector('.site-header');
        if (header) {
            return header.offsetHeight;
        }
        return 0; // 默认值，如果没有找到 header
    }

    // 平滑滚动到指定元素，考虑 header 偏移
    function smoothScrollToElement(element, offset = 0) {
        if (!element) return;

        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    function generateTOC() {
        const content = document.querySelector('.post-content');
        const tocContainer = document.querySelector('.toc-content');

        if (!content || !tocContainer) return;

        // 获取所有标题
        const headers = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headers.length === 0) {
            tocContainer.innerHTML = '';
            return;
        }

        // 生成目录结构
        const toc = document.createElement('ul');
        let currentLevel = 1;
        let currentList = toc;
        const stack = [toc];

        headers.forEach((header, index) => {
            // 使用标题已有的 ID，如果没有则生成
            let headerId = header.id;

            if (!headerId) {
                // 生成一个安全的 ID（只包含字母、数字、连字符）
                let rawId = header.textContent
                    .trim()
                    .replace(/\s+/g, '-')
                    .replace(/[^\w\u4e00-\u9fa5\-]/g, '')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');

                if (!rawId) {
                    rawId = `heading-${index}`;
                }

                headerId = rawId;

                // 确保 ID 唯一
                let finalId = headerId;
                let counter = 1;
                while (document.getElementById(finalId)) {
                    finalId = `${headerId}-${counter}`;
                    counter++;
                }
                headerId = finalId;
                header.id = headerId;
            }

            const level = parseInt(header.tagName.substring(1));

            const item = document.createElement('li');
            const link = document.createElement('a');
            // 关键修改：使用 getElementById 可处理的格式，不需要转义
            link.href = `#${headerId}`;
            link.textContent = header.textContent;
            link.style.textDecoration = 'none';
            link.style.color = 'rgba(255, 255, 255, 0.8)';

            // 存储 ID 供点击事件使用
            link.setAttribute('data-target-id', headerId);

            link.addEventListener('mouseenter', () => {
                link.style.textDecoration = 'underline';
            });
            link.addEventListener('mouseleave', () => {
                link.style.textDecoration = 'none';
            });

            item.appendChild(link);

            if (level > currentLevel) {
                const newList = document.createElement('ul');
                const parentItem = stack[stack.length - 1].lastChild;
                if (parentItem) {
                    parentItem.appendChild(newList);
                } else {
                    currentList.appendChild(newList);
                }
                stack.push(newList);
                currentList = newList;
            } else if (level < currentLevel) {
                for (let i = 0; i < currentLevel - level; i++) {
                    stack.pop();
                }
                currentList = stack[stack.length - 1];
            }

            currentList.appendChild(item);
            currentLevel = level;
        });

        tocContainer.appendChild(toc);

        // 平滑滚动 - 使用 getElementById 避免选择器转义问题，并考虑 header 偏移
        document.querySelectorAll('.toc-content a').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('data-target-id') || this.getAttribute('href').substring(1);
                // 使用 getElementById 而不是 querySelector，避免转义问题
                const target = document.getElementById(targetId);
                if (target) {
                    // 获取 header 的高度作为偏移量
                    const headerOffset = getHeaderOffset();

                    // 使用自定义的平滑滚动函数，考虑偏移量
                    smoothScrollToElement(target, headerOffset);

                    // 更新 URL，但使用编码后的格式
                    history.pushState(null, null, `#${encodeURIComponent(targetId)}`);
                } else {
                    console.warn('Target not found:', targetId);
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', generateTOC);
    } else {
        generateTOC();
    }
})();