(function () {
  function initPhotoGallery() {
    var canvas = document.querySelector('[data-photo-canvas]');
    var dialog = document.querySelector('[data-photo-dialog]');
    if (!canvas || !dialog) return;

    var cards = Array.from(canvas.querySelectorAll('[data-photo-card]'));
    var buttons = Array.from(canvas.querySelectorAll('.photo-canvas-card__button'));
    var imageWrap = dialog.querySelector('.photo-dialog__image-wrap');
    var image = dialog.querySelector('[data-photo-dialog-image]');
    var title = dialog.querySelector('[data-photo-dialog-title]');
    var category = dialog.querySelector('[data-photo-dialog-category]');
    var description = dialog.querySelector('[data-photo-dialog-description]');
    var count = dialog.querySelector('[data-photo-dialog-count]');
    var currentIndex = 0;
    var isTransitioning = false;
    var isZoomed = false;
    var wheelDelta = 0;
    var wheelResetTimer = 0;
    var layoutMode = '';
    var statementBackground = document.querySelector('[data-photo-statement-background]');
    var statementSection = statementBackground ? statementBackground.closest('.photo-statement') : null;
    var statementImages = statementBackground ? Array.from(statementBackground.querySelectorAll('.photo-statement__background-image')) : [];
    var floatingLayers = statementBackground ? Array.from(statementBackground.querySelectorAll('[data-photo-floating-layer]')) : [];
    var backgroundFrame = 0;
    var statementBackgroundIndex = -1;
    var smoothScroller = null;
    var resetButton = document.querySelector('[data-photo-reset]');
    var desktopRowTemplates = [
      [1, 2, 8],
      [4, 5],
      [],
      [2, 8],
      [],
      [1, 5, 6],
      [],
      [7],
      [2, 3, 5],
      [],
      [],
      [1, 5, 6],
      [],
      [2, 8],
      [5],
      [],
      [1, 2, 6],
      [8],
      [],
      [5, 6],
      [1],
      [3],
      [7, 8],
      [1],
      [4, 5],
      [8],
      [2],
      [6],
      [1],
      [3, 4],
      [5, 6],
      [],
      [1, 2, 8],
      [4, 5],
      [],
      [2, 8],
      [],
      [1]
    ];
    var mobileRowTemplates = [
      [0, 2], [], [1, 3], [0], [2, 3], [], [0, 1], [2], [1, 3], [],
      [0, 2], [1], [0, 3], [], [1, 2], [0], [2, 3], [], [0, 1], [3]
    ];

    function getWork(index) {
      var card = cards[index];
      var sourceImage = card.querySelector('img');
      var detailLines = card.querySelectorAll('.photo-canvas-card__details p');

      return {
        src: sourceImage.currentSrc || sourceImage.src,
        alt: sourceImage.alt,
        title: card.querySelector('h3').textContent,
        category: detailLines[0].textContent.trim(),
        description: detailLines[1].textContent
      };
    }

    function applyInitialLayout() {
      var isMobile = window.matchMedia('(max-width: 720px)').matches;
      layoutMode = isMobile ? 'mobile' : 'desktop';
      var rowTemplates = isMobile ? mobileRowTemplates : desktopRowTemplates;
      var slotCount = isMobile ? 4 : 12;
      var canvasStyles = window.getComputedStyle(canvas);
      var rootFontSize = parseFloat(canvasStyles.fontSize) || 10;

      function readCssSize(name, fallback) {
        var raw = canvasStyles.getPropertyValue(name).trim();
        if (!raw) return fallback;
        var value = parseFloat(raw);
        if (Number.isNaN(value)) return fallback;
        if (raw.endsWith('rem')) return value * rootFontSize;
        if (raw.endsWith('px')) return value;
        return value * rootFontSize;
      }

      var columnGap = readCssSize('--columnGap', 2 * rootFontSize);
      var columnWidth = readCssSize('--columnWidth', 9.5 * rootFontSize);
      var rowHeight = readCssSize('--rowHeight', 19.3 * rootFontSize);
      var availableWidth = canvas.clientWidth || 0;
      var slotWidth = slotCount > 0
        ? (availableWidth - (slotCount - 1) * columnGap) / slotCount
        : columnWidth;
      var cardWidth = Math.max(1, Math.floor(Math.min(columnWidth, slotWidth)));
      var cardHeight = Math.round(cardWidth * 4 / 3);
      var slotStep = cardWidth + columnGap;
      var rowPitch = rowHeight;
      var cardIndex = 0;
      var rowTop = 0;
      var rowIndex = 0;

      rowTemplates.forEach(function (slots) {
        if (cardIndex >= cards.length) return;
        if (slots.length === 0) {
          rowTop += rowPitch;
          rowIndex += 1;
          return;
        }

        slots.forEach(function (slot) {
          if (cardIndex >= cards.length) return;

          var card = cards[cardIndex];
          var resolvedSlot = Math.max(1, Math.min(slot, slotCount));
          var left = (resolvedSlot - 1) * slotStep;
          var parallaxSpeed = isMobile
            ? [0.018, 0.026, 0.022, 0.03][cardIndex % 4]
            : [0.014, 0.02, 0.03, 0.024, 0.036][cardIndex % 5];

          card.style.left = Math.max(0, left) + 'px';
          card.style.top = rowTop + 'px';
          card.style.width = cardWidth + 'px';
          card.style.height = cardHeight + 'px';
          card.style.setProperty('--photo-parallax-speed', parallaxSpeed.toFixed(3));
          card.style.setProperty('--photo-parallax-offset', '0px');
          card.style.setProperty('--photo-parallax-x', '0px');
          card.dataset.rowIndex = String(rowIndex);

          cardIndex += 1;
        });

        rowTop += rowPitch;
        rowIndex += 1;
      });

      while (cardIndex < cards.length) {
        var fallbackCard = cards[cardIndex];
        var fallbackSlot = (cardIndex % slotCount) + 1;
        var fallbackLeft = (fallbackSlot - 1) * slotStep;
        fallbackCard.style.left = Math.max(0, fallbackLeft) + 'px';
        fallbackCard.style.top = rowTop + 'px';
        fallbackCard.style.width = cardWidth + 'px';
        fallbackCard.style.height = cardHeight + 'px';
        fallbackCard.style.setProperty('--photo-parallax-speed', (isMobile ? 0.02 : 0.016).toFixed(3));
        fallbackCard.style.setProperty('--photo-parallax-offset', '0px');
        fallbackCard.style.setProperty('--photo-parallax-x', '0px');
        fallbackCard.dataset.rowIndex = String(rowIndex);
        cardIndex += 1;
        rowIndex += 1;
        rowTop += rowPitch;
      }

      canvas.style.height = (rowTop + rowPitch + (isMobile ? 56 : 80)) + 'px';

      if (resetButton) {
        resetButton.classList.remove('is-visible');
      }

      updateCanvasParallax();
    }

    function updateCanvasParallax() {
      var rect = canvas.getBoundingClientRect();
      var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      var progress = 0;

      if (viewportHeight > 0) {
        progress = Math.max(0, Math.min(1, (viewportHeight - rect.top) / (viewportHeight + rect.height)));
      }

      cards.forEach(function (card, index) {
        var speed = parseFloat(card.style.getPropertyValue('--photo-parallax-speed')) || 0.02;
        var horizontalSpeed = (index % 2 === 0 ? -1 : 1) * speed * 18;
        var verticalShift = (progress - 0.5) * speed * 160;
        card.style.setProperty('--photo-parallax-offset', verticalShift.toFixed(2) + 'px');
        card.style.setProperty('--photo-parallax-x', horizontalSpeed.toFixed(2) + 'px');
      });
    }

    function updateScrollBackground() {
      if (!statementSection || !statementBackground) return;

      var rect = statementSection.getBoundingClientRect();
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
      var stageHeight = statementBackground.clientHeight;
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
      updateCanvasParallax();
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

    function setZoomState(zoomed) {
      isZoomed = zoomed;
      dialog.classList.toggle('is-zoomed', zoomed);
      imageWrap.style.setProperty('--photo-pan-x', '0px');
      imageWrap.style.setProperty('--photo-pan-y', '0px');
      image.setAttribute('aria-label', zoomed ? '缩小当前图片' : '放大当前图片');
    }

    function preloadAdjacentImages() {
      [-1, 1].forEach(function (offset) {
        var preloadIndex = (currentIndex + offset + cards.length) % cards.length;
        var preload = new Image();
        preload.src = getWork(preloadIndex).src;
      });
    }

    function render(index) {
      currentIndex = (index + cards.length) % cards.length;
      var work = getWork(currentIndex);

      setZoomState(false);
      image.src = work.src;
      image.alt = work.alt;
      title.textContent = work.title;
      category.textContent = work.category;
      description.textContent = work.description;
      count.textContent = String(currentIndex + 1).padStart(2, '0')
        + ' / '
        + String(cards.length).padStart(2, '0');
      preloadAdjacentImages();
    }

    function waitForCurrentImage() {
      if (image.complete && image.naturalWidth > 0) {
        return typeof image.decode === 'function' ? image.decode().catch(function () { }) : Promise.resolve();
      }

      return new Promise(function (resolve) {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
      });
    }

    function animateImage(keyframes, options) {
      if (typeof image.animate !== 'function') return Promise.resolve();

      var animation = image.animate(keyframes, options);
      return animation.finished.catch(function () { }).then(function () {
        animation.cancel();
      });
    }

    function transitionTo(index, direction) {
      if (isTransitioning || cards.length < 2) return;

      var nextIndex = (index + cards.length) % cards.length;
      var movement = direction > 0 ? -46 : 46;
      isTransitioning = true;
      setZoomState(false);

      animateImage([
        { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' },
        { opacity: 0, transform: 'translate3d(0, ' + movement + 'px, 0) scale(0.985)' }
      ], {
        duration: 420,
        easing: 'cubic-bezier(0.55, 0, 1, 0.45)',
        fill: 'forwards'
      }).then(function () {
        render(nextIndex);
        return waitForCurrentImage();
      }).then(function () {
        return animateImage([
          { opacity: 0, transform: 'translate3d(0, ' + (-movement) + 'px, 0) scale(0.985)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' }
        ], {
          duration: 620,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'forwards'
        });
      }).finally(function () {
        isTransitioning = false;
      });
    }

    function open(index) {
      render(index);
      if (typeof dialog.showModal === 'function') dialog.showModal();
      if (smoothScroller) smoothScroller.stop();
      document.documentElement.classList.add('photo-dialog-open');
      image.focus({ preventScroll: true });
    }

    function close() {
      dialog.close();
      setZoomState(false);
      if (smoothScroller) smoothScroller.start();
      document.documentElement.classList.remove('photo-dialog-open');
      buttons[currentIndex].focus();
    }

    function toggleZoom() {
      if (!isTransitioning) setZoomState(!isZoomed);
    }

    function bindCanvasDrag(button, index) {
      var activeDrag = null;

      function moveDrag(event) {
        if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;
        if (event.cancelable) event.preventDefault();

        var deltaX = event.clientX - activeDrag.startX;
        var deltaY = event.clientY - activeDrag.startY;
        if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) activeDrag.moved = true;

        var maxLeft = canvas.clientWidth - activeDrag.card.offsetWidth;
        var maxTop = canvas.clientHeight - activeDrag.card.offsetHeight;
        activeDrag.card.style.left = Math.max(0, Math.min(maxLeft, activeDrag.startLeft + deltaX)) + 'px';
        activeDrag.card.style.top = Math.max(0, Math.min(maxTop, activeDrag.startTop + deltaY)) + 'px';
      }

      function stopDrag(event) {
        if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;

        activeDrag.card.classList.remove('is-dragging');
        if (activeDrag.moved) {
          button.dataset.dragged = 'true';
          if (resetButton) resetButton.classList.add('is-visible');
          window.setTimeout(function () {
            delete button.dataset.dragged;
          }, 400);
        }

        if (button.hasPointerCapture && button.hasPointerCapture(activeDrag.pointerId)) {
          button.releasePointerCapture(activeDrag.pointerId);
        }

        activeDrag = null;
        window.removeEventListener('pointermove', moveDrag);
        window.removeEventListener('pointerup', stopDrag);
        window.removeEventListener('pointercancel', stopDrag);
      }

      button.addEventListener('dragstart', function (event) {
        event.preventDefault();
      });

      button.addEventListener('pointerdown', function (event) {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        event.preventDefault();

        var card = cards[index];
        delete button.dataset.dragged;
        activeDrag = {
          card: card,
          pointerId: event.pointerId,
          startLeft: card.offsetLeft,
          startTop: card.offsetTop,
          startX: event.clientX,
          startY: event.clientY,
          moved: false
        };
        button.setPointerCapture(event.pointerId);
        card.classList.add('is-dragging');
        window.addEventListener('pointermove', moveDrag, { passive: false });
        window.addEventListener('pointerup', stopDrag);
        window.addEventListener('pointercancel', stopDrag);
      });

      button.addEventListener('click', function (event) {
        if (button.dataset.dragged) {
          event.preventDefault();
          delete button.dataset.dragged;
          return;
        }
        open(index);
      });
    }

    buttons.forEach(bindCanvasDrag);
    applyInitialLayout();
    initSmoothScroll();
    updateScrollBackground();
    window.addEventListener('scroll', scheduleScrollBackground, { passive: true });

    image.addEventListener('click', toggleZoom);
    image.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggleZoom();
    });

    imageWrap.addEventListener('pointermove', function (event) {
      if (!isZoomed || event.pointerType === 'touch') return;

      var rect = imageWrap.getBoundingClientRect();
      var normalizedX = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
      var normalizedY = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
      imageWrap.style.setProperty('--photo-pan-x', normalizedX * rect.width * 0.14 + 'px');
      imageWrap.style.setProperty('--photo-pan-y', normalizedY * rect.height * 0.14 + 'px');
    });

    imageWrap.addEventListener('pointerleave', function () {
      if (!isZoomed) return;
      imageWrap.style.setProperty('--photo-pan-x', '0px');
      imageWrap.style.setProperty('--photo-pan-y', '0px');
    });

    dialog.addEventListener('wheel', function (event) {
      if (!dialog.open) return;
      event.preventDefault();
      if (isZoomed || isTransitioning) return;

      wheelDelta += event.deltaY;
      window.clearTimeout(wheelResetTimer);
      wheelResetTimer = window.setTimeout(function () {
        wheelDelta = 0;
      }, 180);

      if (Math.abs(wheelDelta) < 45) return;
      var direction = wheelDelta > 0 ? 1 : -1;
      wheelDelta = 0;
      transitionTo(currentIndex + direction, direction);
    }, { passive: false });

    dialog.querySelector('[data-photo-close]').addEventListener('click', close);
    dialog.querySelector('[data-photo-previous]').addEventListener('click', function () {
      transitionTo(currentIndex - 1, -1);
    });
    dialog.querySelector('[data-photo-next]').addEventListener('click', function () {
      transitionTo(currentIndex + 1, 1);
    });

    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) close();
    });

    dialog.addEventListener('cancel', function () {
      setZoomState(false);
      if (smoothScroller) smoothScroller.start();
      document.documentElement.classList.remove('photo-dialog-open');
    });

    document.addEventListener('keydown', function (event) {
      if (!dialog.open) return;
      if (event.key === 'ArrowLeft') transitionTo(currentIndex - 1, -1);
      if (event.key === 'ArrowRight') transitionTo(currentIndex + 1, 1);
    });

    if (resetButton) resetButton.addEventListener('click', applyInitialLayout);

    var resizeTimer = 0;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        applyInitialLayout();
      }, 180);
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhotoGallery, { once: true });
  } else {
    initPhotoGallery();
  }
})();
