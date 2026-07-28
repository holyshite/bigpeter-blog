(function () {
  function initPhotoGallery() {
    var canvas = document.querySelector('[data-photo-canvas]');
    var dialog = document.querySelector('[data-photo-dialog]');
    if (!canvas || !dialog) return;

    var cards = Array.from(canvas.querySelectorAll('[data-photo-card]'));
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
    var statementBackground = document.querySelector('[data-photo-statement-background]');
    var statementSection = statementBackground ? statementBackground.closest('.photo-statement') : null;
    var statementImages = statementBackground ? Array.from(statementBackground.querySelectorAll('.photo-statement__background-image')) : [];
    var floatingLayers = statementBackground ? Array.from(statementBackground.querySelectorAll('[data-photo-floating-layer]')) : [];
    var backgroundFrame = 0;
    var statementBackgroundIndex = -1;
    var smoothScroller = null;

    function getWork(index) {
      var card = cards[index];
      var sourceImage = card.querySelector('img');

      return {
        src: card.dataset.photoSrc || sourceImage.currentSrc || sourceImage.src,
        alt: card.dataset.photoTitle || sourceImage.alt,
        title: card.dataset.photoTitle || '',
        category: card.dataset.photoCategory || '',
        description: card.dataset.photoDescription || ''
      };
    }

    function updateCanvasParallax() {
      var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      if (!viewportHeight) return;

      cards.forEach(function (card) {
        var inner = card.querySelector('.parallax__inner');
        if (!inner) return;

        var rect = card.getBoundingClientRect();
        var progress = Math.max(0, Math.min(1, (viewportHeight - rect.top) / (viewportHeight + rect.height)));
        var shift = Math.max(-20.8333, Math.min(4.1667, 4.1667 - progress * 25));
        inner.style.transform = 'translateY(' + shift.toFixed(4) + '%)';
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
      cards[currentIndex].focus();
    }

    function toggleZoom() {
      if (!isTransitioning) setZoomState(!isZoomed);
    }

    cards.forEach(function (card, index) {
      card.addEventListener('dragstart', function (event) {
        event.preventDefault();
      });
      card.addEventListener('click', function () {
        open(index);
      });
    });

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

    var resizeTimer = 0;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        updateCanvasParallax();
      }, 180);
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhotoGallery, { once: true });
  } else {
    initPhotoGallery();
  }
})();
