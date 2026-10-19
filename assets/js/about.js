(function () {
  'use strict';
  const body = document.body;
  if (!body.classList.contains('foundations-page')) return;
  const data = JSON.parse(document.getElementById('foundation-data').textContent);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const gsap = window.gsap;
  const root = body.dataset.aboutRoot;
  const menu = document.querySelector('.f-menu');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const chapterLink = document.querySelector('.f-header__chapter');
  const transition = document.querySelector('[data-transition]');
  const views = Array.from(document.querySelectorAll('[data-view]'));
  const cards = Array.from(document.querySelectorAll('[data-orbit-card]'));
  let current = body.dataset.initialSection;
  let changing = false;
  let pendingPop = null;
  let sectionCleanup = function () {};
  let orbitFrame = 0;
  let previewContext = null;
  let previewTweens = [];
  let orbitPaused = false;
  let angle = 0;
  let targetAngle = 0;
  let active = 0;
  let lastTime = 0;
  let lastInput = performance.now();
  let hovering = false;
  let dragging = null;
  let suppressClickUntil = 0;
  const orbit = document.querySelector('[data-orbit]');
  const step = 360 / cards.length;

  try { body.classList.toggle('is-dark', localStorage.getItem('bigpeter-about-theme') === 'dark'); } catch (error) {}
  const themeToggle = document.querySelector('[data-theme-toggle]');
  themeToggle.setAttribute('aria-pressed', String(body.classList.contains('is-dark')));
  themeToggle.addEventListener('click', function () {
    const dark = body.classList.toggle('is-dark');
    themeToggle.setAttribute('aria-pressed', String(dark));
    try { localStorage.setItem('bigpeter-about-theme', dark ? 'dark' : 'light'); } catch (error) {}
  });

  function closeMenu(returnFocus) {
    if (menu.hidden) return;
    menu.hidden = true;
    body.classList.remove('is-menu-open');
    document.getElementById('foundation-main').inert = false;
    document.getElementById('foundation-main').removeAttribute('aria-hidden');
    menuToggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) menuToggle.focus();
    lastInput = performance.now();
  }
  menuToggle.addEventListener('click', function () {
    if (!menu.hidden) return closeMenu(true);
    menu.hidden = false;
    body.classList.add('is-menu-open');
    document.getElementById('foundation-main').inert = true;
    document.getElementById('foundation-main').setAttribute('aria-hidden', 'true');
    menuToggle.setAttribute('aria-expanded', 'true');
    if (gsap && !reduced.matches) gsap.fromTo(menu.querySelectorAll('.f-menu__chapters a'), { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: .7, stagger: .05, ease: 'power3.out', clearProps: 'all' });
    menu.querySelector('a').focus({ preventScroll: true });
  });

  function routeFromPath() {
    const relative = location.pathname.replace(root, '').replace(/\/$/, '');
    return data.chapters.some(function (chapter) { return chapter.key === relative; }) ? relative : 'index';
  }
  function updateCaption(index) {
    if (active === index && document.querySelector('[data-orbit-title]').textContent === data.chapters[index].title) return;
    active = index;
    document.querySelector('[data-orbit-title]').textContent = data.chapters[index].title;
    document.querySelector('[data-orbit-count]').textContent = String(index + 1).padStart(2, '0') + ' / 05';
    document.querySelector('[data-orbit-description]').textContent = data.chapters[index].description;
    cards.forEach(function (card, i) { card.classList.toggle('is-active', i === index); });
  }
  function renderOrbit(time) {
    if (current !== 'index' || document.hidden) { orbitFrame = 0; return; }
    const dt = Math.min((time - (lastTime || time)) / 1000, .04);
    lastTime = time;
    if (!dragging && !hovering && menu.hidden && !orbitPaused && !reduced.matches && time - lastInput > 250) targetAngle += dt * 7;
    angle += (targetAngle - angle) * (reduced.matches ? 1 : Math.min(dt * 6, 1));
    const mobile = innerWidth <= 600;
    const radius = Math.min(innerWidth * (mobile ? .21 : innerWidth <= 900 ? .27 : .31), 590);
    const depth = mobile ? 35 : Math.min(160, innerWidth * .1);
    cards.forEach(function (card, index) {
      const degrees = angle + index * step;
      const radians = degrees * Math.PI / 180;
      const x = Math.sin(radians) * radius;
      const z = Math.cos(radians) * depth;
      const y = -Math.cos(radians) * (mobile ? Math.min(160, orbit.clientHeight * .29) : 100);
      card.style.transform = 'translate(-50%, -50%) translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,' + z.toFixed(2) + 'px) rotateY(' + (Math.sin(radians) * -16).toFixed(2) + 'deg) rotateZ(' + (Math.sin(radians) * 7).toFixed(2) + 'deg)';
    });
    const nearest = ((Math.round(-angle / step) % cards.length) + cards.length) % cards.length;
    updateCaption(nearest);
    orbitFrame = requestAnimationFrame(renderOrbit);
  }
  function startOrbit() {
    lastTime = 0;
    if (!orbitFrame && current === 'index' && !document.hidden) orbitFrame = requestAnimationFrame(renderOrbit);
    if (gsap && !reduced.matches && !previewContext) {
      previewContext = gsap.context(function () {
        previewTweens = [
          gsap.to('.f-art__logo .f-mark', { rotation: -8, scale: .94, duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true }),
          gsap.to('.f-art__type > span:first-child', { rotation: 5, yPercent: -6, duration: 3.2, repeat: -1, yoyo: true, ease: 'sine.inOut' }),
          gsap.to('.f-art__swatches', { rotation: -8, xPercent: 5, duration: 5, repeat: -1, yoyo: true, ease: 'sine.inOut' }),
          gsap.to('.f-art__photo-front', { rotation: 6, yPercent: -10, duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut' }),
          gsap.to('.f-art__motion i', { yPercent: -65, duration: 1.8, stagger: .2, repeat: -1, yoyo: true, ease: 'sine.inOut' })
        ];
        previewTweens.forEach(function (tween) { tween.paused(orbitPaused); });
      }, orbit);
    }
  }
  function stopOrbit() {
    cancelAnimationFrame(orbitFrame);
    orbitFrame = 0;
    if (previewContext) previewContext.revert();
    previewContext = null;
    previewTweens = [];
  }
  function stepOrbit(direction) {
    targetAngle = Math.round(targetAngle / step) * step + direction * step;
    lastInput = performance.now();
  }
  document.querySelector('[data-orbit-prev]').addEventListener('click', function () { stepOrbit(1); });
  document.querySelector('[data-orbit-next]').addEventListener('click', function () { stepOrbit(-1); });
  document.querySelector('[data-orbit-pause]').addEventListener('click', function (event) {
    orbitPaused = !orbitPaused;
    event.currentTarget.setAttribute('aria-pressed', String(orbitPaused));
    event.currentTarget.setAttribute('aria-label', orbitPaused ? '继续旋转' : '暂停旋转');
    event.currentTarget.textContent = orbitPaused ? '▷' : 'Ⅱ';
    previewTweens.forEach(function (tween) { tween.paused(orbitPaused); });
    lastInput = performance.now();
  });
  orbit.addEventListener('wheel', function (event) {
    if (current !== 'index' || !menu.hidden) return;
    event.preventDefault();
    targetAngle -= Math.max(-120, Math.min(120, event.deltaY || event.deltaX)) * .16;
    lastInput = performance.now();
  }, { passive: false });
  orbit.addEventListener('pointerdown', function (event) {
    if (event.button !== 0) return;
    dragging = { id: event.pointerId, x: event.clientX, angle: targetAngle, moved: false };
    lastInput = performance.now();
  });
  window.addEventListener('pointermove', function (event) {
    if (!dragging || dragging.id !== event.pointerId) return;
    const offset = event.clientX - dragging.x;
    if (Math.abs(offset) > 6) {
      dragging.moved = true;
      orbit.classList.add('is-dragging');
      if (!orbit.hasPointerCapture(event.pointerId)) orbit.setPointerCapture(event.pointerId);
    }
    if (dragging.moved) targetAngle = dragging.angle + offset * .23;
  });
  function endDrag(event) {
    if (!dragging || dragging.id !== event.pointerId) return;
    if (dragging.moved) {
      suppressClickUntil = performance.now() + 350;
      targetAngle = Math.round(targetAngle / step) * step;
    }
    dragging = null;
    orbit.classList.remove('is-dragging');
    lastInput = performance.now();
  }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  cards.forEach(function (card) {
    card.addEventListener('pointerenter', function (event) { if (event.pointerType !== 'touch') hovering = true; });
    card.addEventListener('pointerleave', function () { hovering = false; lastInput = performance.now(); });
    card.addEventListener('focus', function () { hovering = true; });
    card.addEventListener('blur', function () { hovering = false; lastInput = performance.now(); });
    card.addEventListener('dragstart', function (event) { event.preventDefault(); });
  });

  function mountView(key, focus) {
    sectionCleanup();
    sectionCleanup = function () {};
    stopOrbit();
    views.forEach(function (view) { view.hidden = view.dataset.view !== key; });
    current = key;
    body.classList.toggle('is-index', key === 'index');
    body.dataset.section = key;
    const chapter = data.chapters.find(function (item) { return item.key === key; });
    chapterLink.textContent = chapter ? chapter.title : '个人索引';
    document.title = (chapter ? chapter.title : '关于') + ' · BigPeter';
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (key === 'index') {
      startOrbit();
      if (focus) cards[active].focus({ preventScroll: true });
    } else {
      const view = views.find(function (item) { return item.dataset.view === key; });
      if (window.BigPeterSections) sectionCleanup = window.BigPeterSections.mount(view, { gsap: gsap, reduced: reduced.matches, data: data });
      if (focus) view.querySelector('h1').focus({ preventScroll: true });
    }
  }

  async function navigate(key, source, historyMode) {
    if (!views.some(function (view) { return view.dataset.view === key; })) return;
    if (changing) {
      if (historyMode === 'pop') pendingPop = key;
      return;
    }
    if (key === current) { closeMenu(false); return; }
    changing = true;
    const wasMenuOpen = !menu.hidden;
    closeMenu(false);
    const oldView = views.find(function (view) { return view.dataset.view === current; });
    const canAnimate = gsap && !reduced.matches;
    const art = source && source.querySelector('.f-art');
    if (canAnimate && art && !wasMenuOpen) {
      const bounds = source.getBoundingClientRect();
      transition.replaceChildren(art.cloneNode(true));
      gsap.set(transition, { display: 'block', left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height, opacity: 1 });
      await new Promise(function (resolve) { gsap.to(transition, { left: 0, top: 0, width: innerWidth, height: innerHeight, duration: .85, ease: 'power3.inOut', onComplete: resolve }); });
    } else if (canAnimate) {
      await new Promise(function (resolve) { gsap.to(oldView, { opacity: 0, y: -25, duration: .3, ease: 'power2.in', onComplete: resolve }); });
    }
    mountView(key, true);
    if (historyMode !== 'pop' && pendingPop === null) history.pushState({ section: key }, '', root + (key === 'index' ? '' : key + '/'));
    if (gsap) gsap.set(oldView, { clearProps: 'opacity,transform' });
    const newView = views.find(function (view) { return view.dataset.view === key; });
    if (canAnimate) {
      gsap.fromTo(newView, { opacity: 0 }, { opacity: 1, duration: .6, clearProps: 'opacity' });
      if (transition.style.display === 'block') await new Promise(function (resolve) { gsap.to(transition, { opacity: 0, duration: .5, delay: .08, onComplete: resolve }); });
      transition.style.display = 'none';
      transition.replaceChildren();
    }
    changing = false;
    if (pendingPop !== null) {
      const next = pendingPop;
      pendingPop = null;
      if (next !== current) navigate(next, null, 'pop');
    }
  }
  document.addEventListener('click', function (event) {
    const link = event.target.closest('a[data-route]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    if (performance.now() < suppressClickUntil) return;
    navigate(link.dataset.route, link, 'push');
  });
  window.addEventListener('popstate', function () { navigate(routeFromPath(), null, 'pop'); });
  document.addEventListener('keydown', function (event) {
    if (!menu.hidden) {
      if (event.key === 'Escape') closeMenu(true);
      if (event.key === 'Tab') {
        const focusable = [themeToggle, menuToggle].concat(Array.from(menu.querySelectorAll('a')));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      return;
    }
    if (current === 'index' && !event.target.matches('input, textarea, [contenteditable]')) {
      if (event.key === 'ArrowRight') { event.preventDefault(); stepOrbit(-1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); stepOrbit(1); }
    }
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopOrbit();
    else { lastInput = performance.now(); startOrbit(); }
  });
  reduced.addEventListener('change', function () {
    const scroll = window.scrollY;
    mountView(current, false);
    window.scrollTo(0, scroll);
  });
  mountView(current, false);
  if (gsap && !reduced.matches && current === 'index') {
    gsap.fromTo('.f-orbit__art', { opacity: 0, scale: .65 }, { opacity: 1, scale: 1, duration: 1.5, stagger: .09, ease: 'power3.out' });
  }
  requestAnimationFrame(function () { body.classList.add('is-ready'); });
})();
