(function () {
  'use strict';

  var RAF = window.requestAnimationFrame || function (fn) { return window.setTimeout(fn, 16); };
  var CAF = window.cancelAnimationFrame || function (id) { window.clearTimeout(id); };
  var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function createDraggable(element, options) {
    options = options || {};
    var bounds = options.bounds || null;
    var onDragStart = options.onDragStart || function () {};
    var onDrag = options.onDrag || function () {};
    var onDragEnd = options.onDragEnd || function () {};

    var x = 0;
    var y = 0;
    var baseX = 0;
    var baseY = 0;
    var startClientX = 0;
    var startClientY = 0;
    var pointerId = null;
    var dragging = false;
    var moved = false;
    var velocityX = 0;
    var velocityY = 0;
    var history = [];
    var inertiaFrame = 0;
    var suppressClick = false;
    var destroyed = false;
    var resetAnimation = null;

    function currentOffset() {
      var matrix = new DOMMatrixReadOnly(window.getComputedStyle(element).transform);
      return { x: matrix.m41 || 0, y: matrix.m42 || 0 };
    }

    function apply() {
      element.style.transform = 'translate3d(' + x.toFixed(2) + 'px, ' + y.toFixed(2) + 'px, 0)';
      onDrag();
    }

    function clamp() {
      if (!bounds) return;
      var canvasRect = bounds.getBoundingClientRect();
      var rect = element.getBoundingClientRect();
      var applied = currentOffset();
      var baseLeft = rect.left - applied.x;
      var baseTop = rect.top - applied.y;
      var minVisible = Math.min(rect.width, rect.height) * 0.2;
      var minX = canvasRect.left - baseLeft - minVisible;
      var maxX = canvasRect.right - baseLeft - rect.width + minVisible;
      var minY = canvasRect.top - baseTop - minVisible;
      var maxY = canvasRect.bottom - baseTop - rect.height + minVisible;
      x = Math.min(Math.max(x, minX), maxX);
      y = Math.min(Math.max(y, minY), maxY);
    }

    function stopInertia() {
      if (inertiaFrame) { CAF(inertiaFrame); inertiaFrame = 0; velocityX = 0; velocityY = 0; onDragEnd(); }
    }

    function startInertia() {
      var len = history.length;
      if (len < 2) { onDragEnd(); return; }
      var last = history[len - 1];
      var prev = history[len - 2];
      var dt = (last.t - prev.t) / 1000;
      if (dt <= 0 || dt > 0.1) { onDragEnd(); return; }
      var maxV = 5000;
      velocityX = Math.max(-maxV, Math.min(maxV, (last.x - prev.x) / dt));
      velocityY = Math.max(-maxV, Math.min(maxV, (last.y - prev.y) / dt));

      var step = function () {
        velocityX *= 0.92;
        velocityY *= 0.92;
        x += velocityX * 0.016;
        y += velocityY * 0.016;
        var prevX = x;
        var prevY = y;
        clamp();
        apply();
        var hitEdge = bounds && (x !== prevX || y !== prevY);
        if (hitEdge || (Math.abs(velocityX) < 1 && Math.abs(velocityY) < 1)) {
          inertiaFrame = 0;
          onDragEnd();
          return;
        }
        inertiaFrame = RAF(step);
      };
      inertiaFrame = RAF(step);
    }

    function onPointerDown(event) {
      if (destroyed || pointerId !== null) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pointerId = event.pointerId;
      var offset = currentOffset();
      if (resetAnimation) {
        resetAnimation.cancel();
        resetAnimation = null;
      }
      baseX = offset.x;
      baseY = offset.y;
      startClientX = event.clientX;
      startClientY = event.clientY;
      x = baseX;
      y = baseY;
      apply();
      moved = false;
      dragging = true;
      history = [];
      stopInertia();
      try { element.setPointerCapture(pointerId); } catch (err) {}
      element.classList.add('is-dragging');
    }

    function onPointerMove(event) {
      if (!dragging || event.pointerId !== pointerId) return;
      x = baseX + (event.clientX - startClientX);
      y = baseY + (event.clientY - startClientY);
      if (!moved && (Math.abs(event.clientX - startClientX) > 5 || Math.abs(event.clientY - startClientY) > 5)) {
        moved = true;
        onDragStart();
      }
      clamp();
      apply();
      history.push({ x: event.clientX, y: event.clientY, t: performance.now() });
      if (history.length > 6) history.shift();
    }

    function onPointerEnd(event) {
      if (!dragging || event.pointerId !== pointerId) return;
      dragging = false;
      pointerId = null;
      element.classList.remove('is-dragging');
      if (moved) {
        suppressClick = true;
        window.setTimeout(function () { suppressClick = false; }, 0);
        if (REDUCED_MOTION) {
          onDragEnd();
        } else {
          startInertia();
        }
      }
    }

    function onCaptureClick(event) {
      if (suppressClick) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    function reset() {
      stopInertia();
      dragging = false;
      pointerId = null;
      moved = false;
      element.classList.remove('is-dragging');
      if (resetAnimation) {
        resetAnimation.cancel();
        resetAnimation = null;
      }
      apply();
      var from = 'translate3d(' + x.toFixed(2) + 'px, ' + y.toFixed(2) + 'px, 0)';
      var animation = element.animate([
        { transform: from },
        { transform: 'translate3d(0px, 0px, 0px)' }
      ], {
        duration: 1000,
        easing: EASE,
        fill: 'forwards'
      });
      resetAnimation = animation;
      animation.finished.catch(function () {}).then(function () {
        if (resetAnimation !== animation) return;
        x = 0;
        y = 0;
        animation.cancel();
        resetAnimation = null;
        apply();
      });
    }

    function destroy() {
      destroyed = true;
      stopInertia();
      if (resetAnimation) {
        resetAnimation.cancel();
        resetAnimation = null;
      }
      dragging = false;
      pointerId = null;
      element.classList.remove('is-dragging');
      element.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerEnd);
      window.removeEventListener('pointercancel', onPointerEnd);
      element.removeEventListener('click', onCaptureClick, true);
    }

    element.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerEnd);
    window.addEventListener('pointercancel', onPointerEnd);
    element.addEventListener('click', onCaptureClick, true);

    return { reset: reset, destroy: destroy, isMoved: function () { return moved; } };
  }

  window.PhotoDrag = { create: createDraggable };
})();
