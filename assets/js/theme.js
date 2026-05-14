// assets/js/theme.js
(function () {
    var STORAGE_KEY = 'flashlight-mode';
    var BG_STORAGE_KEY = 'site-bg';
    var MODE_ON = 'on';
    var MODE_OFF = 'off';
    var BG_OPTIONS = ['paper', 'gradient', 'clean'];
    var DEFAULT_BG = 'paper';

    var canvas = null;
    var ctx = null;
    var cursorX = -1000;
    var cursorY = -1000;
    var ticking = false;

    function getStoredMode() {
        try {
            return window.localStorage.getItem(STORAGE_KEY) === MODE_ON ? MODE_ON : MODE_OFF;
        } catch (e) {
            return MODE_OFF;
        }
    }

    function setStoredMode(mode) {
        try {
            window.localStorage.setItem(STORAGE_KEY, mode);
        } catch (e) { }
    }

    function getStoredBg() {
        try {
            var v = window.localStorage.getItem(BG_STORAGE_KEY);
            return BG_OPTIONS.indexOf(v) !== -1 ? v : DEFAULT_BG;
        } catch (e) {
            return DEFAULT_BG;
        }
    }

    function setStoredBg(bg) {
        try {
            window.localStorage.setItem(BG_STORAGE_KEY, bg);
        } catch (e) { }
    }

    function getBtnCenter() {
        var toggle = document.querySelector('.theme-toggle');
        if (!toggle) return null;
        var r = toggle.getBoundingClientRect();
        return {
            x: r.left + r.width / 2,
            y: r.top + r.height / 2,
            radius: Math.max(r.width, r.height) / 2 + 8
        };
    }

    function getBgCenter() {
        var sel = document.querySelector('.bg-selector');
        if (!sel) return null;
        var r = sel.getBoundingClientRect();
        return {
            x: r.left + r.width / 2,
            y: r.top + r.height / 2,
            radius: Math.max(r.width, r.height) / 2 + 6
        };
    }

    function draw() {
        ticking = false;
        if (!canvas || !ctx) return;

        var w = window.innerWidth;
        var h = window.innerHeight;
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;

        // 全黑背景
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        // 挖洞模式
        ctx.globalCompositeOperation = 'destination-out';

        // 光标洞
        ctx.beginPath();
        ctx.arc(cursorX, cursorY, 140, 0, Math.PI * 2);
        ctx.fill();

        // 切换按钮洞
        var btn = getBtnCenter();
        if (btn) {
            ctx.beginPath();
            ctx.arc(btn.x, btn.y, btn.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // 背景选择器洞
        var bg = getBgCenter();
        if (bg) {
            ctx.beginPath();
            ctx.arc(bg.x, bg.y, bg.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function scheduleDraw() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(draw);
    }

    function onMouseMove(e) {
        var cx, cy;
        if (e.touches) {
            cx = e.touches[0].clientX;
            cy = e.touches[0].clientY;
        } else {
            cx = e.clientX;
            cy = e.clientY;
        }
        cursorX = cx;
        cursorY = cy;
        scheduleDraw();
    }

    function onResize() {
        scheduleDraw();
    }

    function createOverlay() {
        if (canvas) return;
        // 清理防闪脚本创建的旧 div 遮罩和注入的 style
        var old = document.querySelector('.flashlight-overlay');
        if (old) old.remove();
        var oldStyle = document.querySelector('style');
        // 移除防闪注入的 flashlight-overlay 样式（匹配包含 flashlight-overlay 的 style）
        var styles = document.querySelectorAll('style');
        for (var i = 0; i < styles.length; i++) {
            if (styles[i].textContent.indexOf('flashlight-overlay') !== -1) {
                styles[i].remove();
                break;
            }
        }

        canvas = document.createElement('canvas');
        canvas.className = 'flashlight-overlay';
        canvas.style.background = 'transparent';
        ctx = canvas.getContext('2d');
        document.body.appendChild(canvas);
        document.body.classList.add('flashlight-mode');

        // 初始位置设为屏幕中心，同步绘制首帧
        cursorX = window.innerWidth / 2;
        cursorY = window.innerHeight / 2;
        draw();

        document.addEventListener('mousemove', onMouseMove, { passive: true });
        document.addEventListener('touchmove', onMouseMove, { passive: true });
        window.addEventListener('resize', onResize);
        window.addEventListener('scroll', scheduleDraw, { passive: true });
    }

    function removeOverlay() {
        if (canvas) {
            canvas.remove();
            canvas = null;
            ctx = null;
        }
        document.body.classList.remove('flashlight-mode');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('touchmove', onMouseMove);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('scroll', scheduleDraw);
    }

    function applyMode(mode) {
        if (mode === MODE_ON) {
            createOverlay();
        } else {
            removeOverlay();
        }

        var toggle = document.querySelector('.theme-toggle');
        var icon = toggle ? toggle.querySelector('.theme-toggle__icon') : null;

        if (toggle && icon) {
            if (mode === MODE_ON) {
                icon.src = toggle.dataset.iconMoon;
                toggle.setAttribute('aria-label', '关闭手电筒');
                toggle.setAttribute('aria-pressed', 'true');
            } else {
                icon.src = toggle.dataset.iconSun;
                toggle.setAttribute('aria-label', '打开手电筒');
                toggle.setAttribute('aria-pressed', 'false');
            }
        }
    }

    function applyBg(bg) {
        document.documentElement.setAttribute('data-bg', bg);
        document.querySelectorAll('.bg-btn').forEach(function (btn) {
            btn.classList.toggle('is-active', btn.dataset.bg === bg);
        });
        window.dispatchEvent(new CustomEvent('site-bg-change', {
            detail: { bg: bg }
        }));
    }

    function bindToggle() {
        var toggle = document.querySelector('.theme-toggle');
        if (!toggle) return;

        toggle.addEventListener('click', function () {
            var next = getStoredMode() === MODE_ON ? MODE_OFF : MODE_ON;
            applyMode(next);
            setStoredMode(next);
        });
    }

    function bindBgSelector() {
        var selector = document.querySelector('.bg-selector');
        if (!selector) return;

        selector.addEventListener('click', function (e) {
            var btn = e.target.closest('.bg-btn');
            if (!btn) return;
            applyBg(btn.dataset.bg);
            setStoredBg(btn.dataset.bg);
        });
    }

    function init() {
        applyMode(getStoredMode());
        applyBg(getStoredBg());
        bindToggle();
        bindBgSelector();

        var selector = document.querySelector('.bg-selector');
        if (selector) {
            selector.hidden = false;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
