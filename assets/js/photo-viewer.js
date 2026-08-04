(function () {
  'use strict';

  function initViewer() {
    var dialog = document.querySelector('[data-photo-dialog]');
    if (!dialog) return;

    var image = dialog.querySelector('[data-photo-dialog-image]');
    var imageWrap = dialog.querySelector('.photo-dialog__image-wrap');
    var description = dialog.querySelector('[data-photo-dialog-description]');
    var count = dialog.querySelector('[data-photo-dialog-count]');
    var thumbs = dialog.querySelector('[data-photo-thumbs]');
    var thumbButtons = Array.from(dialog.querySelectorAll('[data-photo-thumb]'));
    var closeButton = dialog.querySelector('[data-photo-close]');
    var prevButton = dialog.querySelector('[data-photo-previous]');
    var nextButton = dialog.querySelector('[data-photo-next]');

    var currentIndex = 0;
    var isTransitioning = false;
    var scale = 1;
    var thumbDrag = null;
    var total = thumbButtons.length;

    function getWork(index) {
      var thumb = thumbButtons[index];
      if (!thumb) return { src: '', title: '', category: '', description: '' };
      return {
        src: thumb.dataset.photoSrc || '',
        title: thumb.dataset.photoTitle || '',
        category: thumb.dataset.photoCategory || '',
        description: thumb.dataset.photoDescription || ''
      };
    }

    function applyScale() {
      var panX = imageWrap.style.getPropertyValue('--photo-pan-x') || '0px';
      var panY = imageWrap.style.getPropertyValue('--photo-pan-y') || '0px';
      image.style.transform = 'translate3d(' + panX + ', ' + panY + ', 0) scale(' + scale.toFixed(3) + ')';
      image.setAttribute('aria-label', scale > 1 ? '缩小当前图片' : '放大当前图片');
    }

    function preloadAdjacentImages() {
      [-1, 1].forEach(function (offset) {
        var preloadIndex = (currentIndex + offset + total) % total;
        var preload = new Image();
        preload.src = getWork(preloadIndex).src;
      });
    }

    function updateThumbs() {
      thumbButtons.forEach(function (thumb, index) {
        var active = index === currentIndex;
        thumb.classList.toggle('is-active', active);
        thumb.setAttribute('aria-pressed', String(active));
      });
      var activeThumb = thumbButtons[currentIndex];
      if (!activeThumb) return;
      var barRect = thumbs.getBoundingClientRect();
      var thumbRect = activeThumb.getBoundingClientRect();
      var horizontal = thumbs.offsetWidth >= thumbs.offsetHeight * 1.5;
      if (horizontal) {
        var leftOffset = thumbRect.left - barRect.left - (barRect.width - thumbRect.width) / 2;
        thumbs.scrollTo({ left: thumbs.scrollLeft + leftOffset, behavior: 'smooth' });
      } else {
        var topOffset = thumbRect.top - barRect.top - (barRect.height - thumbRect.height) / 2;
        thumbs.scrollTo({ top: thumbs.scrollTop + topOffset, behavior: 'smooth' });
      }
    }

    function render(index) {
      currentIndex = (index + total) % total;
      var work = getWork(currentIndex);
      scale = 1;
      imageWrap.style.setProperty('--photo-pan-x', '0px');
      imageWrap.style.setProperty('--photo-pan-y', '0px');
      applyScale();
      image.src = work.src;
      image.alt = work.title;
      description.textContent = work.description;
      count.textContent = String(currentIndex + 1).padStart(2, '0')
        + ' / '
        + String(total).padStart(2, '0');
      updateThumbs();
      preloadAdjacentImages();
    }

    function waitForCurrentImage() {
      if (image.complete) {
        if (image.naturalWidth > 0) {
          return typeof image.decode === 'function' ? image.decode().catch(function () { }) : Promise.resolve();
        }
        return Promise.resolve();
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
      if (isTransitioning || total < 2) return;

      var nextIndex = (index + total) % total;
      var movement = direction > 0 ? -46 : 46;
      isTransitioning = true;

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
      if (typeof image.getAnimations === 'function') {
        image.getAnimations().forEach(function (animation) { animation.cancel(); });
      }
      isTransitioning = false;
      render(index);
      if (typeof dialog.showModal === 'function') dialog.showModal();
      image.focus({ preventScroll: true });
    }

    function close() {
      dialog.close();
    }

    function toggleZoom() {
      if (isTransitioning) return;
      scale = scale > 1 ? 1 : 1.5;
      applyScale();
    }

    thumbButtons.forEach(function (thumb, index) {
      thumb.addEventListener('click', function () {
        if (thumbDrag && thumbDrag.moved) return;
        var direction = index > currentIndex ? 1 : -1;
        transitionTo(index, direction);
      });
    });

    image.addEventListener('click', toggleZoom);
    image.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggleZoom();
    });

    imageWrap.addEventListener('wheel', function (event) {
      event.preventDefault();
      if (isTransitioning) return;
      var direction = event.deltaY > 0 ? 1 : -1;
      transitionTo(currentIndex + direction, direction);
    }, { passive: false });

    imageWrap.addEventListener('pointermove', function (event) {
      if (scale <= 1 || event.pointerType === 'touch') return;
      image.classList.add('is-dragging');

      var rect = imageWrap.getBoundingClientRect();
      var normalizedX = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
      var normalizedY = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
      imageWrap.style.setProperty('--photo-pan-x', normalizedX * rect.width * 0.14 + 'px');
      imageWrap.style.setProperty('--photo-pan-y', normalizedY * rect.height * 0.14 + 'px');
      applyScale();
    });

    imageWrap.addEventListener('pointerleave', function () {
      image.classList.remove('is-dragging');
      if (scale <= 1) return;
      imageWrap.style.setProperty('--photo-pan-x', '0px');
      imageWrap.style.setProperty('--photo-pan-y', '0px');
      applyScale();
    });

    thumbs.addEventListener('wheel', function (event) {
      event.preventDefault();
      var horizontal = thumbs.offsetWidth >= thumbs.offsetHeight * 1.5;
      if (horizontal) {
        thumbs.scrollLeft += event.deltaY;
      } else {
        thumbs.scrollTop += event.deltaY;
      }
    }, { passive: false });

    thumbs.addEventListener('pointerdown', function (event) {
      thumbDrag = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        st: thumbs.scrollTop,
        sl: thumbs.scrollLeft,
        moved: false
      };
      try { thumbs.setPointerCapture(event.pointerId); } catch (err) {}
    });

    thumbs.addEventListener('pointermove', function (event) {
      if (!thumbDrag || event.pointerId !== thumbDrag.id) return;
      var dx = event.clientX - thumbDrag.x;
      var dy = event.clientY - thumbDrag.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) thumbDrag.moved = true;
      thumbs.scrollTop = thumbDrag.st - dy;
      thumbs.scrollLeft = thumbDrag.sl - dx;
    });

    thumbs.addEventListener('pointerup', function (event) {
      if (!thumbDrag || event.pointerId !== thumbDrag.id) return;
      if (thumbDrag.moved) {
        thumbs.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
        }, { once: true, capture: true });
      }
      thumbDrag = null;
    });

    thumbs.addEventListener('pointercancel', function () {
      thumbDrag = null;
    });

    closeButton.addEventListener('click', close);
    prevButton.addEventListener('click', function () {
      transitionTo(currentIndex - 1, -1);
    });
    nextButton.addEventListener('click', function () {
      transitionTo(currentIndex + 1, 1);
    });

    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) close();
    });

    dialog.addEventListener('cancel', function () {
      scale = 1;
      applyScale();
    });

    document.addEventListener('keydown', function (event) {
      if (!dialog.open) return;
      if (event.key === 'ArrowLeft') transitionTo(currentIndex - 1, -1);
      if (event.key === 'ArrowRight') transitionTo(currentIndex + 1, 1);
    });

    window.PhotoViewer = { open: open, close: close };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initViewer, { once: true });
  } else {
    initViewer();
  }
})();
