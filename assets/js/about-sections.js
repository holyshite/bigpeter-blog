(function () {
  'use strict';
  const fonts = {
    sans: 'Arial, "PingFang SC", "Microsoft YaHei", sans-serif',
    serif: 'Georgia, "Songti SC", "SimSun", serif',
    mono: 'Consolas, "SFMono-Regular", monospace'
  };

  function mount(view, options) {
    const gsap = options.gsap;
    const reduced = options.reduced;
    const cleanups = [];
    const controller = new AbortController();
    const signal = controller.signal;
    const context = gsap ? gsap.context(function () {}, view) : null;
    const $ = function (selector) { return view.querySelector(selector); };
    const $$ = function (selector) { return Array.from(view.querySelectorAll(selector)); };
    function on(element, event, handler, config) {
      if (element) element.addEventListener(event, handler, Object.assign({}, config, { signal: signal }));
    }
    function animate(element, properties) {
      if (!gsap || reduced) return;
      context.add(function () { gsap.to(element, properties); });
    }
    function visibleLoop(element, timeline, allowed) {
      if (!timeline) return function () {};
      let visible = false;
      let disposed = false;
      function sync() {
        if (disposed) return;
        if (visible && !document.hidden && (!allowed || allowed())) timeline.play();
        else timeline.pause();
      }
      const observer = new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; sync(); }, { threshold: .05 });
      observer.observe(element);
      document.addEventListener('visibilitychange', sync);
      sync.dispose = function () {
        if (disposed) return;
        disposed = true;
        observer.disconnect();
        document.removeEventListener('visibilitychange', sync);
        timeline.kill();
      };
      cleanups.push(sync.dispose);
      return sync;
    }
    if (gsap) {
      context.add(function () {
        if (!reduced && window.ScrollTrigger) {
          gsap.registerPlugin(window.ScrollTrigger);
          $$('[data-reveal]').forEach(function (element) {
            gsap.fromTo(element, { y: 60, opacity: 0 }, {
              y: 0, opacity: 1, duration: 1, ease: 'power3.out',
              scrollTrigger: { trigger: element, start: 'top 94%', once: true },
              clearProps: 'opacity,transform'
            });
          });
          $$('[data-parallax]').forEach(function (element, index) {
            gsap.fromTo(element, { y: 60 }, { y: -45 - index * 25, ease: 'none', scrollTrigger: { trigger: element, start: 'top bottom', end: 'bottom top', scrub: .8 } });
          });
        }
      });
    }

    function logo() {
      const canvas = $('[data-logo-canvas]');
      $$('[data-logo-mode]').forEach(function (button) {
        on(button, 'click', function () {
          canvas.classList.toggle('is-word', button.dataset.logoMode === 'word');
          $$('[data-logo-mode]').forEach(function (item) { item.setAttribute('aria-pressed', String(item === button)); });
          animate(canvas.children[button.dataset.logoMode === 'word' ? 1 : 0], { keyframes: [{ opacity: 0, y: 15 }, { opacity: 1, y: 0 }], duration: .65, ease: 'power3.out' });
        });
      });
      [['[data-logo-invert]', 'is-inverse'], ['[data-logo-guides]', 'show-guides']].forEach(function (pair) {
        on($(pair[0]), 'click', function (event) { event.currentTarget.setAttribute('aria-pressed', String(canvas.classList.toggle(pair[1]))); });
      });
      $$('img').forEach(function (image) { on(image, 'error', function () { if (image.closest('.f-friend__avatar')) image.hidden = true; }); });
      if (gsap && !reduced && matchMedia('(hover:hover) and (pointer:fine)').matches) {
        context.add(function () {
          $$('.f-friend').forEach(function (link) {
            const avatar = link.querySelector('.f-friend__avatar');
            const arrow = link.querySelector('.f-friend__arrow');
            const spring = { duration: .8, ease: 'elastic.out(1,0.48)' };
            const y = gsap.quickTo(link, 'y', spring);
            const x = gsap.quickTo(link, 'x', { duration: .45, ease: 'power3.out' });
            const sx = gsap.quickTo(link, 'scaleX', spring);
            const sy = gsap.quickTo(link, 'scaleY', spring);
            const rotation = gsap.quickTo(avatar, 'rotation', spring);
            const avatarX = gsap.quickTo(avatar, 'scaleX', spring);
            const avatarY = gsap.quickTo(avatar, 'scaleY', spring);
            const arrowX = gsap.quickTo(arrow, 'x', spring);
            const arrowY = gsap.quickTo(arrow, 'y', spring);
            let bounds = null;
            function enter(event) {
              if (event.pointerType === 'touch') return;
              bounds = link.getBoundingClientRect();
              y(-4); sx(1.015); sy(1.015); avatarX(1.1); avatarY(1.1); arrowX(4); arrowY(-4);
            }
            function leave() { y(0); x(0); sx(1); sy(1); rotation(0); avatarX(1); avatarY(1); arrowX(0); arrowY(0); bounds = null; }
            on(link, 'pointerenter', enter);
            on(link, 'focus', enter);
            on(link, 'pointermove', function (event) {
              if (!bounds || event.pointerType === 'touch') return;
              const progress = (event.clientX - bounds.left) / bounds.width - .5;
              x(progress * 10); rotation(progress * 12);
            });
            on(link, 'pointerleave', leave); on(link, 'blur', leave); on(link, 'pointercancel', leave);
            on(window, 'scroll', function () { bounds = null; }, { passive: true });
          });
        });
      }
    }

    function typography() {
      const editor = $('[data-type-editor]');
      const size = $('[data-type-size]');
      size.value = Math.round(parseFloat(getComputedStyle(editor).fontSize));
      const phrases = ['保持好奇，\nKeep making.', '把想法，\n慢慢做出来。', 'Ordinary days.\nExtraordinary little things.', 'Hello, world.\n你好，生活。'];
      let phrase = 0;
      $$('[data-type-font]').forEach(function (button) {
        on(button, 'click', function () {
          editor.style.fontFamily = fonts[button.dataset.typeFont];
          $$('[data-type-font]').forEach(function (item) { item.setAttribute('aria-pressed', String(item === button)); });
          animate(editor, { keyframes: [{ opacity: .2, y: 12 }, { opacity: 1, y: 0 }], duration: .6 });
        });
      });
      on(size, 'input', function () { editor.style.fontSize = size.value + 'px'; });
      on(editor, 'paste', function (event) {
        event.preventDefault();
        const selection = getSelection();
        if (!selection.rangeCount) return;
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const text = document.createTextNode(event.clipboardData.getData('text/plain'));
        range.insertNode(text);
        range.setStartAfter(text); range.collapse(true); selection.removeAllRanges(); selection.addRange(range);
      });
      on($('[data-type-shuffle]'), 'click', function () { phrase = (phrase + 1) % phrases.length; editor.textContent = phrases[phrase]; animate(editor, { keyframes: [{ opacity: .1, y: 20 }, { opacity: 1, y: 0 }], duration: .65 }); });
      const glyphs = $$('[data-glyph]');
      function changeGlyph(button) {
        const next = (Number(button.dataset.fontIndex || 0) + 1) % 3;
        button.dataset.fontIndex = next;
        button.style.fontFamily = fonts[Object.keys(fonts)[next]];
        button.style.fontStyle = next === 1 ? 'italic' : 'normal';
        animate(button, { keyframes: [{ scaleX: .6, scaleY: .6, rotation: -8 }, { scaleX: 1, scaleY: 1, rotation: 0 }], duration: .75, ease: 'back.out(1.6)' });
      }
      glyphs.forEach(function (button) { on(button, 'click', function () { changeGlyph(button); }); });
      on($('[data-glyph-shuffle]'), 'click', function () { glyphs.forEach(changeGlyph); });
      if (gsap && !reduced) context.add(function () {
        visibleLoop($('.f-type-hero'), gsap.to($('[data-type-marquee]'), { xPercent: -6, duration: 5, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true }));
      });
    }

    function color() {
      const palettes = options.data.palettes;
      const dialog = $('[data-color-dialog]');
      const poster = $('[data-poster]');
      let currentPalette = Number(view.dataset.palette || 0);
      let layout = Number(poster.dataset.layout || 0);
      function selectPalette(index) {
        currentPalette = index;
        view.dataset.palette = index;
        palettes[index].colors.forEach(function (color, i) {
          view.style.setProperty('--p' + i, color);
          dialog.style.setProperty('--p' + i, color);
        });
        $$('[data-palette]').forEach(function (button) { button.setAttribute('aria-pressed', String(Number(button.dataset.palette) === index)); });
        $('[data-palette-name]').textContent = palettes[index].name + ' / 0' + (index + 1);
      }
      selectPalette(currentPalette);
      $$('[data-palette]').forEach(function (button) { on(button, 'click', function () { selectPalette(Number(button.dataset.palette)); }); });
      on($('[data-color-shuffle]'), 'click', function () { selectPalette((currentPalette + 1 + Math.floor(Math.random() * (palettes.length - 1))) % palettes.length); });
      on($('[data-layout-shuffle]'), 'click', function () { layout = (layout + 1) % 3; poster.dataset.layout = layout; });
      $$('[data-copy-color]').forEach(function (button) {
        on(button, 'click', async function () {
          const color = button.dataset.copyColor.toUpperCase();
          try { await navigator.clipboard.writeText(color); $('[data-color-status]').textContent = '已复制 ' + color; }
          catch (error) { $('[data-color-status]').textContent = '色值：' + color; }
        });
      });
      on($('[data-color-explore]'), 'click', function () { dialog.showModal(); bodyLock(true); });
      on($('[data-color-close]'), 'click', function () { dialog.close(); });
      on(dialog, 'close', function () { bodyLock(false); });
      cleanups.push(function () { if (dialog.open) dialog.close(); bodyLock(false); });
    }

    function bodyLock(lock) { document.body.style.overflow = lock ? 'hidden' : ''; }

    function photography() {
      const thumbs = Array.from(document.querySelectorAll('[data-photo-thumb]'));
      const strip = $('[data-photo-strip]');
      const canvas = $('[data-photo-canvas]');
      const viewer = document.querySelector('[data-photo-dialog]');
      let set = 0;
      let z = 5;
      const draggables = [];
      function openPhoto(event) {
        const button = event.target.closest('[data-photo-open]');
        if (!button || !view.contains(button) || !window.PhotoViewer) return;
        window.PhotoViewer.open(Number(button.dataset.photoOpen));
        bodyLock(true);
      }
      on(view, 'click', openPhoto);
      on(viewer, 'close', function () { bodyLock(false); });
      on($('[data-photo-shuffle]'), 'click', function () {
        set = (set + 1) % Math.ceil(thumbs.length / 6);
        Array.from(strip.children).forEach(function (button, index) {
          const photoIndex = (set * 6 + index) % thumbs.length;
          const photo = thumbs[photoIndex].dataset;
          button.dataset.photoOpen = photoIndex;
          button.setAttribute('aria-label', '查看 ' + photo.photoTitle);
          const image = button.querySelector('img');
          image.src = photo.photoSrc; image.alt = photo.photoTitle;
          animate(button, { keyframes: [{ opacity: 0, y: 30 }, { opacity: 1, y: 0 }], duration: .7, delay: index * .04, ease: 'power3.out' });
        });
        strip.scrollTo({ left: 0, behavior: reduced ? 'instant' : 'smooth' });
      });
      if (window.PhotoDrag) $$('[data-canvas-tile]').forEach(function (tile) {
        const draggable = window.PhotoDrag.create(tile, { bounds: canvas, onDragStart: function () { tile.style.zIndex = ++z; } });
        draggables.push(draggable);
      });
      on($('[data-canvas-reset]'), 'click', function () { draggables.forEach(function (draggable) { draggable.reset(); }); });
      cleanups.push(function () {
        draggables.forEach(function (draggable) { draggable.destroy(); });
        $$('[data-canvas-tile]').forEach(function (tile) { tile.style.removeProperty('transform'); tile.style.removeProperty('z-index'); });
        if (viewer.open && window.PhotoViewer) window.PhotoViewer.close();
        bodyLock(false);
      });
      const stack = Array.from($('[data-photo-stack]').children);
      let stackIndex = 0;
      function renderStack() {
        stack.forEach(function (card, index) {
          const distance = (index - stackIndex + stack.length) % stack.length;
          card.style.transform = 'translate(' + (distance * 9) + 'px,' + (-distance * 5) + 'px) rotate(' + (distance * 5 - 6) + 'deg) scale(' + (1 - distance * .035) + ')';
          card.style.zIndex = stack.length - distance;
          card.style.opacity = distance > 3 ? '0' : '1';
          card.style.pointerEvents = distance === 0 ? 'auto' : 'none';
          card.tabIndex = distance === 0 ? 0 : -1;
        });
        $('[data-stack-count]').textContent = String(stackIndex + 1).padStart(2, '0') + ' / 05';
      }
      on($('[data-stack-next]'), 'click', function () { stackIndex = (stackIndex + 1) % stack.length; renderStack(); });
      on($('[data-stack-prev]'), 'click', function () { stackIndex = (stackIndex - 1 + stack.length) % stack.length; renderStack(); });
      renderStack();
      if (gsap && !reduced && window.ScrollTrigger) context.add(function () {
        gsap.to($('.f-photo-hero > img'), { yPercent: -12, ease: 'none', scrollTrigger: { trigger: $('.f-photo-hero'), start: 'top bottom', end: 'bottom top', scrub: 1 } });
        gsap.fromTo($('.f-photo-hero__front'), { rotation: -8, y: 60 }, { rotation: 7, y: -50, ease: 'none', scrollTrigger: { trigger: $('.f-photo-hero'), start: 'top bottom', end: 'bottom top', scrub: 1 } });
      });
    }

    function motion() {
      const balls = $$('[data-motion-ball]');
      const play = $('[data-motion-play]');
      const scrub = $('[data-motion-scrub]');
      const speed = $('[data-motion-speed]');
      const easing = $('[data-motion-ease]');
      let timeline = null;
      let playing = !reduced;
      let syncPlayback = function () {};
      function updatePlay() { play.textContent = playing ? '暂停 Ⅱ' : '播放 ▷'; play.setAttribute('aria-pressed', String(playing)); }
      function createTimeline() {
        if (syncPlayback.dispose) syncPlayback.dispose();
        if (timeline) timeline.kill();
        if (!gsap) return;
        timeline = gsap.timeline({ repeat: -1, yoyo: true, repeatDelay: .4, paused: true, onUpdate: function () { scrub.value = Math.round(timeline.progress() * 100); } });
        timeline.fromTo(balls, { x: 0, rotation: 0 }, { x: function (index, ball) { return Math.max(0, ball.parentElement.clientWidth - ball.offsetWidth); }, rotation: 360, duration: 2.5, stagger: .18, ease: easing.value });
        timeline.timeScale(Number(speed.value));
        syncPlayback = visibleLoop($('[data-motion-playground]'), timeline, function () { return playing; });
        updatePlay();
      }
      createTimeline();
      if (!gsap) {
        // Native fallback keeps the timeline controls usable if the CDN is unavailable.
        let frame = 0;
        let progress = 0;
        let direction = 1;
        let previousTime = 0;
        let nativeVisible = false;
        const nativeObserver = new IntersectionObserver(function (entries) { nativeVisible = entries[0].isIntersecting; });
        nativeObserver.observe($('[data-motion-playground]'));
        function nativeFrame(time) {
          const delta = Math.min(time - (previousTime || time), 50); previousTime = time;
          if (playing && nativeVisible && !document.hidden) {
            progress += delta / 3000 * direction * Number(speed.value);
            if (progress >= 1 || progress <= 0) { progress = Math.max(0, Math.min(1, progress)); direction *= -1; }
            scrub.value = Math.round(progress * 100);
            renderNative(progress);
          }
          frame = requestAnimationFrame(nativeFrame);
        }
        function renderNative(value) { balls.forEach(function (ball) { ball.style.transform = 'translateX(' + ((ball.parentElement.clientWidth - ball.offsetWidth) * value) + 'px)'; }); }
        on(scrub, 'input', function () { playing = false; progress = Number(scrub.value) / 100; renderNative(progress); updatePlay(); });
        on($('[data-motion-replay]'), 'click', function () { progress = 0; direction = 1; playing = true; updatePlay(); });
        frame = requestAnimationFrame(nativeFrame);
        cleanups.push(function () { cancelAnimationFrame(frame); nativeObserver.disconnect(); });
      }
      on(play, 'click', function () { playing = !playing; syncPlayback(); updatePlay(); });
      on($('[data-motion-replay]'), 'click', function () { if (!timeline) return; timeline.restart(); playing = true; updatePlay(); syncPlayback(); });
      on(speed, 'change', function () { if (timeline) timeline.timeScale(Number(speed.value)); });
      on(easing, 'change', createTimeline);
      on(scrub, 'input', function () { if (!timeline) return; playing = false; timeline.pause().progress(Number(scrub.value) / 100); updatePlay(); });
      let resizeTimer = 0;
      on(window, 'resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(function () { if (timeline) timeline.invalidate(); }, 150); });
      cleanups.push(function () { clearTimeout(resizeTimer); if (timeline) timeline.kill(); });
      updatePlay();
      const tiles = $$('[data-motion-tile]');
      let tileTimeline = null;
      let syncTile = null;
      function selectTile(button) {
        tiles.forEach(function (tile) { tile.classList.toggle('is-active', tile === button); tile.setAttribute('aria-expanded', String(tile === button)); });
        if (syncTile) syncTile.dispose();
        if (tileTimeline) tileTimeline.kill();
        if (!gsap || reduced) return;
        context.add(function () {
          gsap.set(tiles.map(function (tile) { return tile.querySelectorAll('i'); }).flatMap(function (items) { return Array.from(items); }), { clearProps: 'transform,borderRadius' });
          const shapes = button.querySelectorAll('i');
          const mode = Number(button.dataset.motionTile);
          tileTimeline = gsap.timeline({ repeat: -1, yoyo: true, paused: true, repeatDelay: .3 });
          if (mode === 0) tileTimeline.to(shapes, { xPercent: -25, yPercent: -30, duration: 1.7, stagger: .15, ease: 'sine.inOut' });
          if (mode === 1) tileTimeline.to(shapes, { yPercent: -45, scaleX: .8, scaleY: 1.2, duration: 1.8, stagger: .15, ease: 'elastic.out(1,.4)' });
          if (mode === 2) tileTimeline.to(shapes, { rotation: 110, xPercent: -30, duration: 2.2, stagger: .12, ease: 'power3.inOut' });
          if (mode === 3) tileTimeline.to(shapes, { rotation: 180, xPercent: -60, yPercent: -30, duration: 2.5, stagger: .2, ease: 'sine.inOut', transformOrigin: '150% 100%' });
          if (mode === 4) tileTimeline.to(shapes, { borderRadius: '0%', scaleX: .7, scaleY: .7, rotation: 90, duration: 1.7, stagger: .2, ease: 'back.inOut(1.5)' });
          syncTile = visibleLoop(button, tileTimeline);
        });
      }
      tiles.forEach(function (button) { on(button, 'click', function () { selectTile(button); }); });
      selectTile(tiles[0]);
      if (gsap && !reduced) context.add(function () {
        visibleLoop($('[data-motion-hero]'), gsap.to($$('.f-motion-hero__orbs i'), { yPercent: -55, duration: 2.1, stagger: .25, ease: 'sine.inOut', repeat: -1, yoyo: true, paused: true }));
      });
    }
    const handlers = { logo: logo, typography: typography, color: color, photography: photography, motion: motion };
    if (handlers[view.dataset.view]) handlers[view.dataset.view]();
    function refresh() { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); }
    $$('img').forEach(function (image) { if (!image.complete) on(image, 'load', refresh, { once: true }); });
    const refreshFrame = requestAnimationFrame(refresh);
    return function () {
      cancelAnimationFrame(refreshFrame);
      controller.abort();
      cleanups.forEach(function (cleanup) { cleanup(); });
      if (context) context.revert();
    };
  }
  window.BigPeterSections = { mount: mount };
})();
