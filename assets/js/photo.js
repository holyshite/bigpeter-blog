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

    var desktopLayout = [
      [3, 4, 10], [18, 11, 11], [40, 4, 16], [72, 13, 10], [85, 3, 10],
      [7, 28, 12], [31, 24, 10], [56, 32, 11], [79, 27, 11], [16, 45, 10],
      [43, 42, 17], [76, 49, 11], [4, 62, 17], [29, 65, 10], [58, 59, 11],
      [83, 68, 10], [12, 81, 11], [38, 77, 11], [65, 84, 10], [84, 79, 11]
    ];

    var mobileLayout = [
      [4, 2, 29], [61, 6, 28], [8, 11, 46], [58, 15, 28], [5, 20, 29],
      [55, 24, 28], [11, 29, 28], [62, 33, 28], [5, 38, 29], [52, 42, 28],
      [8, 47, 45], [63, 51, 28], [5, 56, 46], [57, 60, 28], [10, 65, 28],
      [63, 69, 28], [5, 74, 29], [52, 78, 28], [9, 83, 28], [62, 87, 28]
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
      var layout = isMobile ? mobileLayout : desktopLayout;
      layoutMode = isMobile ? 'mobile' : 'desktop';

      cards.forEach(function (card, index) {
        var position = layout[index % layout.length];
        card.style.left = position[0] + '%';
        card.style.top = position[1] + '%';
        card.style.width = position[2] + '%';
      });
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
        return typeof image.decode === 'function' ? image.decode().catch(function () {}) : Promise.resolve();
      }

      return new Promise(function (resolve) {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
      });
    }

    function animateImage(keyframes, options) {
      if (typeof image.animate !== 'function') return Promise.resolve();

      var animation = image.animate(keyframes, options);
      return animation.finished.catch(function () {}).then(function () {
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
      document.documentElement.classList.add('photo-dialog-open');
      image.focus({ preventScroll: true });
    }

    function close() {
      dialog.close();
      setZoomState(false);
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
      document.documentElement.classList.remove('photo-dialog-open');
    });

    document.addEventListener('keydown', function (event) {
      if (!dialog.open) return;
      if (event.key === 'ArrowLeft') transitionTo(currentIndex - 1, -1);
      if (event.key === 'ArrowRight') transitionTo(currentIndex + 1, 1);
    });

    var reset = document.querySelector('[data-photo-reset]');
    if (reset) reset.addEventListener('click', applyInitialLayout);

    var resizeTimer = 0;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        var nextMode = window.matchMedia('(max-width: 720px)').matches ? 'mobile' : 'desktop';
        if (nextMode !== layoutMode) applyInitialLayout();
      }, 180);
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhotoGallery, { once: true });
  } else {
    initPhotoGallery();
  }
})();
