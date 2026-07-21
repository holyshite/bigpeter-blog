// assets/js/about.js
(function () {
  function initAvatarFallbacks() {
    document.querySelectorAll('.friend-avatar img').forEach(function (image) {
      function showFallback() {
        image.parentElement.classList.add('is-fallback');
      }

      image.addEventListener('error', showFallback, { once: true });
      if (image.complete && image.naturalWidth === 0) showFallback();
    });
  }

  function splitHeroTitle(title) {
    var text = title.textContent;
    var fragment = document.createDocumentFragment();

    title.setAttribute('aria-label', text);
    title.textContent = '';

    Array.from(text).forEach(function (character) {
      var span = document.createElement('span');
      span.className = 'about-hero__title-char';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = character;
      fragment.appendChild(span);
    });

    title.appendChild(fragment);
    return title.querySelectorAll('.about-hero__title-char');
  }

  function bindCardTilt(gsap) {
    document.querySelectorAll('.about-card').forEach(function (card) {
      var rotateX = gsap.quickTo(card, 'rotationX', { duration: 0.35, ease: 'power3.out' });
      var rotateY = gsap.quickTo(card, 'rotationY', { duration: 0.35, ease: 'power3.out' });

      card.addEventListener('pointermove', function (event) {
        var rect = card.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width - 0.5;
        var y = (event.clientY - rect.top) / rect.height - 0.5;

        rotateX(y * -7);
        rotateY(x * 7);
      });

      card.addEventListener('pointerleave', function () {
        rotateX(0);
        rotateY(0);
      });
    });
  }

  function initAboutAnimations() {
    var page = document.querySelector('.about-page');
    if (!page) return;

    initAvatarFallbacks();

    if (!window.gsap || !window.ScrollTrigger) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    var title = document.querySelector('.about-hero__title');
    var titleChars = splitHeroTitle(title);

    gsap.registerPlugin(ScrollTrigger);
    page.classList.add('is-gsap-ready');

    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .from('.about-hero__kicker', {
        x: -54,
        opacity: 0,
        duration: 0.55
      })
      .from(titleChars, {
        yPercent: 115,
        rotationX: -75,
        opacity: 0,
        duration: 0.9,
        stagger: 0.055,
        ease: 'back.out(1.45)'
      }, '-=0.28')
      .from('.about-hero__intro', {
        clipPath: 'inset(0 100% 0 0)',
        opacity: 0,
        duration: 0.75,
        clearProps: 'clip-path,opacity'
      }, '-=0.48')
      .from('.about-hero__topics span', {
        y: 22,
        opacity: 0,
        duration: 0.45,
        stagger: 0.1,
        clearProps: 'transform,opacity'
      }, '-=0.32')
      .from('.about-hero__rule > span:first-child', {
        opacity: 0,
        duration: 0.3
      }, '-=0.16')
      .from('.about-hero__rule-line', {
        scaleX: 0,
        duration: 0.7,
        clearProps: 'transform'
      }, '<');

    gsap.utils.toArray('.about-reveal').forEach(function (element) {
      gsap.from(element.children, {
        y: 38,
        opacity: 0,
        duration: 0.72,
        stagger: 0.08,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: element,
          start: 'top 88%',
          toggleActions: 'play none none reverse'
        }
      });
    });

    gsap.timeline({
      scrollTrigger: {
        trigger: '.about-profile-heading',
        start: 'top 96%',
        end: 'top 52%',
        scrub: 0.7
      }
    })
      .from('.about-profile-heading .about-section-heading__eyebrow', {
        x: -90,
        opacity: 0,
        ease: 'none'
      }, 0)
      .fromTo('.about-profile-heading h2', {
        x: 60,
        opacity: 0
      }, {
        x: 0,
        opacity: 1,
        ease: 'none'
      }, 0.14)
      .fromTo('.about-profile-title__primary', {
        opacity: 0.42
      }, {
        opacity: 1,
        ease: 'none'
      }, 0.14)
      .fromTo('.about-profile-title__rest-char', {
        x: function (index) {
          return index + 2;
        },
        opacity: function (index) {
          return 0.36 - index * 0.055;
        },
        filter: function (index) {
          return 'blur(' + (1 + index * 0.8) + 'px)';
        }
      }, {
        x: 0,
        opacity: 1,
        filter: 'blur(0px)',
        ease: 'none',
        stagger: 0.045
      }, 0.14)
      .from('.about-profile-heading > p:last-child', {
        x: 80,
        opacity: 0,
        ease: 'none'
      }, 0.34);

    var media = gsap.matchMedia();

    media.add('(min-width: 901px)', function () {
      gsap.timeline({
        scrollTrigger: {
          trigger: '#about-hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.65
        }
      })
        .to('.about-hero__title', {
          x: 150,
          scale: 1.14,
          opacity: 0.08,
          ease: 'none'
        }, 0)
        .to('.about-hero__kicker', {
          x: -70,
          opacity: 0,
          ease: 'none'
        }, 0)
        .to('.about-hero__intro', {
          x: -110,
          opacity: 0,
          ease: 'none'
        }, 0)
        .to('.about-hero__topics', {
          y: -42,
          opacity: 0,
          ease: 'none'
        }, 0)
        .to('.about-hero__rule', {
          scaleX: 0.5,
          opacity: 0,
          ease: 'none'
        }, 0);

      var profileTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: '.about-profile',
          start: 'top 14%',
          end: '+=850',
          scrub: 0.75,
          pin: true,
          anticipatePin: 1
        }
      });

      profileTimeline
        .fromTo('.about-card-track:first-child', {
          xPercent: -125,
          y: 150,
          rotation: -13,
          opacity: 0
        }, {
          xPercent: 0,
          y: 0,
          rotation: -2,
          opacity: 1,
          duration: 0.46,
          ease: 'power3.out'
        }, 0.05)
        .fromTo('.about-card-track:last-child', {
          xPercent: 125,
          y: 180,
          rotation: 12,
          opacity: 0
        }, {
          xPercent: 0,
          y: 0,
          rotation: 2,
          opacity: 1,
          duration: 0.46,
          ease: 'power3.out'
        }, 0.2)
        .to('.about-card-track', {
          rotation: 0,
          duration: 0.22,
          ease: 'power2.inOut'
        }, 0.7);

      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        bindCardTilt(gsap);
      }
    });

    media.add('(max-width: 900px)', function () {
      gsap.from('.about-card-track', {
        x: function (index) {
          return index % 2 === 0 ? -80 : 80;
        },
        y: 70,
        rotation: function (index) {
          return index % 2 === 0 ? -6 : 6;
        },
        opacity: 0,
        duration: 0.85,
        stagger: 0.15,
        ease: 'back.out(1.25)',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: '#about-cards',
          start: 'top 86%',
          toggleActions: 'play none none reverse'
        }
      });
    });

    gsap.from('.friend-link-track', {
      x: 72,
      y: 28,
      opacity: 0,
      duration: 0.68,
      stagger: 0.11,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
      scrollTrigger: {
        trigger: '.friend-links',
        start: 'top 88%',
        toggleActions: 'play none none reverse'
      }
    });

    gsap.from('.about-social .home-icon-item img', {
      y: 34,
      rotation: -32,
      opacity: 0,
      duration: 0.62,
      stagger: 0.08,
      ease: 'back.out(1.8)',
      clearProps: 'transform,opacity',
      scrollTrigger: {
        trigger: '.about-social',
        start: 'top 92%',
        toggleActions: 'play none none reverse'
      }
    });

    window.addEventListener('load', function () {
      ScrollTrigger.refresh();
    }, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAboutAnimations, { once: true });
  } else {
    initAboutAnimations();
  }
})();
