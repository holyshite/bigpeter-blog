// assets/js/nav.js
(function () {
    // 设置当前激活的导航链接
    function setActiveNavLink() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.site-header .nav a');

        if (navLinks.length === 0) return;

        navLinks.forEach(link => {
            // 移除所有现有的 active 类
            link.classList.remove('active');

            // 获取链接的 href 属性
            let linkPath = link.getAttribute('href');

            if (linkPath && !linkPath.startsWith('http') && linkPath !== '#') {
                // 处理相对路径
                let cleanLinkPath = linkPath.replace(/^\.\.?\//, '');
                let cleanCurrentPath = currentPath.replace(/^\/|\/$/g, ''); // 移除首尾斜杠
                cleanLinkPath = cleanLinkPath.replace(/^\/|\/$/g, '');

                // 如果是首页
                if (cleanLinkPath === '' || cleanLinkPath === 'index.html') {
                    if (cleanCurrentPath === '' || cleanCurrentPath === 'index.html') {
                        link.classList.add('active');
                    }
                }
                // 其他页面匹配
                else if (cleanCurrentPath === cleanLinkPath ||
                    cleanCurrentPath.startsWith(cleanLinkPath)) {
                    link.classList.add('active');
                }
            }
        });
    }

    // 点击时切换激活状态
    function bindNavClickEvents() {
        const navLinks = document.querySelectorAll('.site-header .nav a');

        navLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                // 只对内部链接切换 active 状态
                if (href && !href.startsWith('http') && href !== '#') {
                    navLinks.forEach(l => l.classList.remove('active'));
                    this.classList.add('active');
                }
            });
        });
    }

    // 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setActiveNavLink();
            bindNavClickEvents();
        });
    } else {
        setActiveNavLink();
        bindNavClickEvents();
    }
})();