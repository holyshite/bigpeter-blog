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
    var floatingEls = [];

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

    function draw() {
        ticking = false;
        if (!canvas || !ctx) return;

        var w = window.innerWidth;
        var h = window.innerHeight;
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;

        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(cursorX, cursorY, 140, 0, Math.PI * 2);
        ctx.fill();
    }

    function scheduleDraw() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(draw);
    }

    function floatElements() {
        var els = document.querySelectorAll('.theme-toggle, .bg-selector');
        els.forEach(function (el) {
            var rect = el.getBoundingClientRect();
            var computed = window.getComputedStyle(el);

            // 克隆原元素做占位，保持完全相同的布局特性
            var placeholder = el.cloneNode(true);
            placeholder.removeAttribute('id');
            placeholder.style.visibility = 'hidden';
            placeholder.style.position = '';
            placeholder.style.zIndex = '';
            placeholder.style.top = '';
            placeholder.style.left = '';
            placeholder.style.width = '';
            placeholder.style.height = '';
            placeholder.className = el.className + ' fl-placeholder';
            el.parentNode.insertBefore(placeholder, el);

            // 记住原始状态
            floatingEls.push({
                el: el,
                placeholder: placeholder,
                parent: el.parentNode,
                next: el.nextSibling,
                origDisplay: el.style.display,
                origPosition: el.style.position,
                origZIndex: el.style.zIndex,
                origTop: el.style.top,
                origLeft: el.style.left,
                origWidth: el.style.width,
                origHeight: el.style.height
            });

            // 移到 body，固定定位
            document.body.appendChild(el);
            el.style.position = 'fixed';
            el.style.zIndex = '1002';
            el.style.top = rect.top + 'px';
            el.style.left = rect.left + 'px';
            el.style.width = rect.width + 'px';
            el.style.height = rect.height + 'px';
            el.style.margin = '0';
        });
    }

    function unfloatElements() {
        floatingEls.forEach(function (item) {
            item.el.style.display = item.origDisplay || '';
            item.el.style.position = item.origPosition || '';
            item.el.style.zIndex = item.origZIndex || '';
            item.el.style.top = item.origTop || '';
            item.el.style.left = item.origLeft || '';
            item.el.style.width = item.origWidth || '';
            item.el.style.height = item.origHeight || '';
            item.el.style.margin = '';

            // 放回原位
            if (item.placeholder && item.placeholder.parentNode) {
                item.placeholder.parentNode.insertBefore(item.el, item.placeholder);
                item.placeholder.remove();
            }
        });
        floatingEls = [];
    }

    function updateFloatPositions() {
        floatingEls.forEach(function (item) {
            var placeholder = item.placeholder;
            if (!placeholder || !placeholder.parentNode) return;
            var rect = placeholder.getBoundingClientRect();
            item.el.style.top = rect.top + 'px';
            item.el.style.left = rect.left + 'px';
            item.el.style.width = rect.width + 'px';
            item.el.style.height = rect.height + 'px';
        });
    }

    function onResize() {
        updateFloatPositions();
        scheduleDraw();
    }

    function onScroll() {
        updateFloatPositions();
        scheduleDraw();
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

    function createOverlay() {
        if (canvas) return;
        var old = document.querySelector('.flashlight-overlay');
        if (old) old.remove();
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

        floatElements();

        cursorX = window.innerWidth / 2;
        cursorY = window.innerHeight / 2;
        draw();

        document.addEventListener('mousemove', onMouseMove, { passive: true });
        document.addEventListener('touchmove', onMouseMove, { passive: true });
        window.addEventListener('resize', onResize);
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    function removeOverlay() {
        if (canvas) {
            canvas.remove();
            canvas = null;
            ctx = null;
        }
        // Also remove any other flashlight-overlay elements (e.g., from layout inline scripts)
        var old = document.querySelector('.flashlight-overlay');
        if (old) old.remove();
        // Remove any inline styles for flashlight-overlay
        var styles = document.querySelectorAll('style');
        for (var i = 0; i < styles.length; i++) {
            if (styles[i].textContent.indexOf('flashlight-overlay') !== -1) {
                styles[i].remove();
                break;
            }
        }
        document.body.classList.remove('flashlight-mode');

        unfloatElements();

        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('touchmove', onMouseMove);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('scroll', onScroll);
    }

    function applyMode(mode) {
        if (mode === MODE_ON) {
            createOverlay();
        } else {
            removeOverlay();
        }

        var toggle = document.querySelector('.theme-toggle:not(.fl-placeholder)');
        var icon = toggle ? toggle.querySelector('.theme-toggle__icon') : null;

        if (toggle && icon) {
            if (mode === MODE_ON) {
                icon.src = toggle.dataset.iconSun;
                toggle.setAttribute('aria-label', '关闭手电筒');
                toggle.setAttribute('aria-pressed', 'true');
            } else {
                icon.src = toggle.dataset.iconMoon;
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
        bindToggle();
        bindBgSelector();

        var selector = document.querySelector('.bg-selector');
        if (selector) {
            selector.hidden = false;
        }

        applyMode(getStoredMode());
        applyBg(getStoredBg());
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
