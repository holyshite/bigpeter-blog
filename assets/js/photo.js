(function () {
    function initPhotoGallery() {
        var dialog = document.querySelector('[data-photo-dialog]');
        var desktopCanvas = document.querySelector('[data-photo-canvas]');
        var mobileCanvas = document.querySelector('[data-photo-canvas-mobile]');
        if (!desktopCanvas || !dialog) return;

        var isMobileQuery = window.matchMedia('(max-width: 900px)');
        var activeCanvas = isMobileQuery.matches ? mobileCanvas : desktopCanvas;
        var cards = [];
        var dragInstances = [];
        var interactionEnabled = false;
        var hintHovering = false;
        var hintOnReset = false;
        var resetButton = document.querySelector('[data-photo-reset]');
        var hint = document.querySelector('[data-photo-hint]');
        var gridSection = document.querySelector('.photo-grid-section');
        var statementBackground = document.querySelector('[data-photo-statement-background]');
        var statementSection = statementBackground ? statementBackground.closest('.photo-statement') : null;
        var statementImages = statementBackground ? Array.from(statementBackground.querySelectorAll('.photo-statement__background-image')) : [];
        var floatingLayers = statementBackground ? Array.from(statementBackground.querySelectorAll('[data-photo-floating-layer]')) : [];
        var backgroundFrame = 0;
        var statementBackgroundIndex = -1;
        var smoothScroller = null;
        var hintMoveFrame = 0;
        var dragCount = 0;

        function getActiveCanvas() {
            return isMobileQuery.matches && mobileCanvas ? mobileCanvas : desktopCanvas;
        }

        function isMobile() {
            return isMobileQuery.matches;
        }

        function openViewer(index) {
            if (window.PhotoViewer && typeof window.PhotoViewer.open === 'function') {
                window.PhotoViewer.open(index);
            }
        }

        function bindCanvas() {
            activeCanvas = getActiveCanvas();
            cards = Array.from(activeCanvas.querySelectorAll('[data-photo-card]'));
            var otherCanvas = activeCanvas === desktopCanvas ? mobileCanvas : desktopCanvas;
            if (otherCanvas) otherCanvas.setAttribute('aria-hidden', 'true');
            activeCanvas.setAttribute('aria-hidden', 'false');

            activeCanvas.addEventListener('click', onCanvasClick);
            cards.forEach(function (card) {
                card.addEventListener('dragstart', preventDrag);
                if (isMobile() || !window.PhotoDrag) return;
                var draggableEl = card.querySelector('.photographyImageGridItem__draggable');
                if (!draggableEl) return;
                dragInstances.push(window.PhotoDrag.create(draggableEl, {
                    bounds: gridSection,
                    onDragStart: function () {
                        dragCount += 1;
                        if (smoothScroller) smoothScroller.stop();
                        document.documentElement.classList.add('photo-dragging');
                        if (!interactionEnabled) {
                            interactionEnabled = true;
                            if (resetButton) resetButton.classList.add('is-visible');
                        }
                    },
                    onDragEnd: function () {
                        dragCount = Math.max(0, dragCount - 1);
                        if (dragCount === 0) {
                            if (smoothScroller && !dialog.open) smoothScroller.start();
                            document.documentElement.classList.remove('photo-dragging');
                        }
                    }
                }));
            });
        }

        function unbindCanvas() {
            if (!activeCanvas) return;
            activeCanvas.removeEventListener('click', onCanvasClick);
            cards.forEach(function (card) {
                card.removeEventListener('dragstart', preventDrag);
            });
            dragInstances.forEach(function (instance) { instance.destroy(); });
            dragCount = 0;
            document.documentElement.classList.remove('photo-dragging');
            if (smoothScroller && !dialog.open) smoothScroller.start();
            dragInstances = [];
            cards = [];
        }

        function preventDrag(event) {
            event.preventDefault();
        }

        function onCanvasClick(event) {
            var card = event.target.closest('[data-photo-card]');
            if (!card) return;
            var index = parseInt(card.dataset.index, 10);
            if (!isNaN(index)) openViewer(index);
        }

        function switchCanvas() {
            unbindCanvas();
            bindCanvas();
            hintHovering = false;
            updateHint();
        }

        function updateScrollBackground() {
            if (!statementSection || !statementBackground) return;

            var rect = statementSection.getBoundingClientRect();
            var stageHeight = statementBackground.clientHeight;
            var travel = Math.max(1, rect.height - window.innerHeight);
            var progress = Math.max(0, Math.min(1, -rect.top / travel));
            var scaledProgress = progress * Math.max(1, statementImages.length - 1);
            var nextIndex = Math.min(statementImages.length - 1, Math.floor(scaledProgress));
            var reveal = nextIndex >= statementImages.length - 1 ? 1 : scaledProgress - nextIndex;
            if (nextIndex !== statementBackgroundIndex) {
                statementBackgroundIndex = nextIndex;
                statementBackground.dataset.activeIndex = String(nextIndex);
            }
            statementBackground.style.setProperty('--photo-statement-progress', progress.toFixed(3));
            statementBackground.style.setProperty('--photo-reveal', reveal.toFixed(3));
            statementBackground.style.setProperty('--photo-bg-parallax', (progress * -100).toFixed(2) + 'px');
            floatingLayers.forEach(function (layer, index) {
                var layerSpeed = 0.75;
                var layerOffset = (index - scaledProgress * layerSpeed) * stageHeight;
                var visibilityBuffer = stageHeight * 1.3;
                var isVisible = layerOffset > -visibilityBuffer && layerOffset < visibilityBuffer;
                layer.style.visibility = isVisible ? 'visible' : 'hidden';
                layer.style.transform = 'translate3d(0, ' + layerOffset.toFixed(2) + 'px, 0)';
            });
            statementImages.forEach(function (item, index) {
                var clipPath = 'inset(100% 0 0 0)';
                if (index <= nextIndex) clipPath = 'inset(0 0 0 0)';
                if (index === nextIndex + 1) {
                    var top = (1 - reveal) * 100;
                    clipPath = 'polygon(0 ' + top + '%, 100% ' + top + '%, 100% 100%, 0 100%)';
                }
                item.style.clipPath = clipPath;
                item.style.webkitClipPath = clipPath;
            });
            statementBackground.dataset.scrollProgress = progress.toFixed(3);
        }

        function scheduleScrollBackground() {
            if (backgroundFrame) return;
            backgroundFrame = window.requestAnimationFrame(function () {
                backgroundFrame = 0;
                updateScrollBackground();
            });
        }

        function initSmoothScroll() {
            if (!window.Lenis || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

            smoothScroller = new window.Lenis({
                autoRaf: true,
                duration: 0.8,
                easing: function (progress) {
                    return Math.min(1, 1.001 - Math.pow(2, -10 * progress));
                },
                smoothWheel: true,
                wheelMultiplier: 1
            });
            smoothScroller.on('scroll', scheduleScrollBackground);
        }

        function isGridInViewport() {
            if (!gridSection) return false;
            var rect = gridSection.getBoundingClientRect();
            return rect.top < window.innerHeight && rect.bottom > 0;
        }

        function updateHint() {
            if (!hint) return;
            var visible = false;
            if (isMobile()) {
                visible = isGridInViewport() && !dialog.open;
            } else {
                visible = hintHovering && !dialog.open && !hintOnReset;
            }
            hint.classList.toggle('is-visible', visible);
        }

        function scheduleHintMove(event) {
            if (!hint || isMobile() || !hint.classList.contains('is-visible')) return;
            if (hintMoveFrame) return;
            hintMoveFrame = window.requestAnimationFrame(function () {
                hintMoveFrame = 0;
                hint.style.transform = 'translate3d(' + (event.clientX + 14) + 'px, ' + (event.clientY + 14) + 'px, 0)';
            });
        }

        dialog.addEventListener('open', function () {
            if (smoothScroller) smoothScroller.stop();
            document.documentElement.classList.add('photo-dialog-open');
            updateHint();
        });

        dialog.addEventListener('close', function () {
            if (smoothScroller) smoothScroller.start();
            document.documentElement.classList.remove('photo-dialog-open');
            updateHint();
        });

        if (gridSection) {
            gridSection.addEventListener('mouseenter', function () {
                hintHovering = true;
                updateHint();
            });
            gridSection.addEventListener('mouseleave', function () {
                hintHovering = false;
                updateHint();
            });
        }

        if (resetButton) {
            resetButton.addEventListener('click', function () {
                interactionEnabled = false;
                resetButton.classList.remove('is-visible');
                dragInstances.forEach(function (instance) { instance.reset(); });
            });
            resetButton.addEventListener('mouseenter', function () {
                hintOnReset = true;
                updateHint();
            });
            resetButton.addEventListener('mouseleave', function () {
                hintOnReset = false;
                updateHint();
            });
        }

        if (hint) {
            window.addEventListener('pointermove', scheduleHintMove, { passive: true });
        }

        window.addEventListener('scroll', function () {
            updateHint();
            scheduleScrollBackground();
        }, { passive: true });

        initSmoothScroll();
        updateScrollBackground();
        bindCanvas();

        if (typeof isMobileQuery.addEventListener === 'function') {
            isMobileQuery.addEventListener('change', switchCanvas);
        } else {
            isMobileQuery.addListener(switchCanvas);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPhotoGallery, { once: true });
    } else {
        initPhotoGallery();
    }
})();
