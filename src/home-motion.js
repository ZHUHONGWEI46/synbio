import { gsap } from '../vendor/gsap/index.js';
import { ScrollTrigger } from '../vendor/gsap/ScrollTrigger.js';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = typeof matchMedia === 'function'
  ? matchMedia('(prefers-reduced-motion: reduce)')
  : { matches: false };

export function initHomeMotion() {
  const root = document.querySelector('[data-app-view="overview"]');
  const scroller = document.getElementById('home-scroll');
  if (!root || !scroller) return undefined;

  const desktopNarrative = matchMedia('(min-width: 761px) and (min-height: 700px)');
  let settleTimer;
  let settleTween;

  const cancelSettle = () => {
    clearTimeout(settleTimer);
    settleTween?.kill();
    settleTween = undefined;
  };

  const scope = gsap.context(() => {
    if (reducedMotion.matches) {
      gsap.set(root.querySelectorAll('.home-reveal, .reaction-frame, .home-bars > span'), { clearProps: 'all' });
      gsap.set(root.querySelector('.reaction-frame'), { opacity: 1 });
      return;
    }

    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .from('.hero-copy .home-kicker', { opacity: 0, y: 12, duration: 0.45 })
      .from('.hero-copy h1 span', { opacity: 0, y: 34, duration: 0.72, stagger: 0.11 }, '-=.22')
      .from('.hero-copy > p, .hero-actions, .hero-facts', { opacity: 0, y: 18, duration: 0.5, stagger: 0.08 }, '-=.32')
      .from('.hero-structure-card', { opacity: 0, scale: 0.94, x: 30, duration: 0.8 }, '-=.64');

    gsap.timeline({
      scrollTrigger: { trigger: '#home-hero', scroller, start: 'top top', end: 'bottom top', scrub: 0.75 },
    })
      .to('.hero-layer-back', { yPercent: -8, ease: 'none' }, 0)
      .to('.hero-layer-diagonal', { yPercent: -14, xPercent: 4, ease: 'none' }, 0)
      .to('.hero-layer-front', { yPercent: -18, scale: 1.04, ease: 'none' }, 0)
      .to('.hero-structure-card', { scale: 1.04, y: -22, ease: 'none' }, 0)
      .to('.hero-copy', { y: -12, opacity: 0.82, ease: 'none' }, 0.25);

    gsap.utils.toArray('.home-reveal').forEach((element) => {
      if (element.closest('#home-hero')) return;
      gsap.from(element, {
        opacity: 0,
        y: 30,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: { trigger: element, scroller, start: 'top 88%', once: true },
      });
    });

    gsap.from('.site-orbit button', {
      opacity: 0,
      scale: 0.7,
      duration: 0.45,
      stagger: 0.055,
      ease: 'back.out(1.45)',
      scrollTrigger: { trigger: '.site-orbit', scroller, start: 'top 76%', once: true },
    });

    gsap.from('.ai-pipeline-node', {
      opacity: 0,
      y: 24,
      scale: 0.94,
      duration: 0.6,
      stagger: 0.14,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.ai-pipeline', scroller, start: 'top 76%', once: true },
    });
    gsap.from('.ai-signal-line', {
      ...(matchMedia('(min-width: 761px)').matches ? { scaleX: 0 } : { scaleY: 0 }),
      duration: 0.55,
      stagger: 0.14,
      ease: 'power2.inOut',
      scrollTrigger: { trigger: '.ai-pipeline', scroller, start: 'top 70%', once: true },
    });

    gsap.from('.build-constellation img', {
      opacity: 0,
      scale: 0.82,
      y: 18,
      duration: 0.62,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.build-constellation', scroller, start: 'top 73%', once: true },
    });
    gsap.fromTo('.build-path path', { strokeDashoffset: 260 }, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: { trigger: '.build-constellation', scroller, start: 'top 78%', end: 'bottom 55%', scrub: 0.7 },
    });

    const reactionFrames = gsap.utils.toArray('.reaction-frame');
    const reactionTimeline = gsap.timeline({
      scrollTrigger: { trigger: '.screening-stage', scroller, start: 'top 68%', end: 'bottom 42%', scrub: 0.65 },
    });
    reactionFrames.forEach((frame, index) => {
      if (index === 0) return;
      reactionTimeline.to(reactionFrames[index - 1], { opacity: 0, duration: 0.18 }, index - 1)
        .to(frame, { opacity: 1, duration: 0.18 }, index - 0.92);
    });

    gsap.from('.evolution-track article', {
      opacity: 0,
      y: 26,
      scale: 0.92,
      duration: 0.55,
      stagger: 0.14,
      ease: 'back.out(1.25)',
      scrollTrigger: { trigger: '.evolution-track', scroller, start: 'top 74%', once: true },
    });

    if (desktopNarrative.matches) {
      gsap.timeline({
        scrollTrigger: {
          trigger: '#home-dbtl',
          scroller,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.45,
          invalidateOnRefresh: true,
          onEnter: cancelSettle,
          onEnterBack: cancelSettle,
          onLeave: cancelSettle,
          onLeaveBack: cancelSettle,
        },
      })
        .fromTo('.dbtl-ring', { rotation: -14, scale: 0.92 }, { rotation: 0, scale: 1, ease: 'none' }, 0)
        .from('.dbtl-item', { opacity: 0, scale: 0.72, stagger: 0.18, duration: 0.28 }, 0.08)
        .from('.dbtl-center', { opacity: 0, scale: 0.82, duration: 0.3 }, 0.55);
    } else {
      gsap.from('.dbtl-item, .dbtl-center', {
        opacity: 0,
        y: 18,
        duration: 0.55,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: { trigger: '#home-dbtl', scroller, start: 'top 76%', once: true },
      });
    }

    gsap.from('.home-bars > span', {
      scaleY: 0,
      duration: 0.85,
      stagger: 0.045,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.round0-chart', scroller, start: 'top 76%', once: true },
    });

    root.querySelectorAll('[data-count-to]').forEach((element) => {
      const target = Number(element.dataset.countTo);
      const decimals = Number(element.dataset.countDecimals ?? 0);
      const counter = { value: 0 };
      gsap.to(counter, {
        value: target,
        duration: 1.1,
        ease: 'power2.out',
        onUpdate: () => { element.textContent = counter.value.toFixed(decimals); },
        scrollTrigger: { trigger: element, scroller, start: 'top 86%', once: true },
      });
    });

    gsap.from('.verification-assets article', {
      opacity: 0,
      y: 24,
      scale: 0.94,
      duration: 0.55,
      stagger: 0.08,
      ease: 'power2.out',
      scrollTrigger: { trigger: '.verification-assets', scroller, start: 'top 80%', once: true },
    });

    gsap.from('.application-stage img', {
      opacity: 0,
      x: 55,
      duration: 0.8,
      stagger: 0.16,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.application-stage', scroller, start: 'top 78%', once: true },
    });
  }, root);

  let chapterOffsets = [];
  let dbtlRange;
  let lastScrollTop = scroller.scrollTop;
  let scrollDirection = 1;

  const elementTop = (element) => {
    return element.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
  };

  const collectChapterOffsets = () => {
    chapterOffsets = [...root.querySelectorAll('[data-home-chapter]')]
      .map(elementTop)
      .filter((value, index, values) => index === 0 || Math.abs(value - values[index - 1]) > 4)
      .sort((a, b) => a - b);
    const dbtl = root.querySelector('#home-dbtl');
    if (dbtl) {
      const start = elementTop(dbtl);
      dbtlRange = { start, end: start + Math.max(0, dbtl.offsetHeight - scroller.clientHeight) };
    }
  };

  const settleAtChapterBoundary = () => {
    if (!desktopNarrative.matches || reducedMotion.matches || settleTween || root.hidden) return;
    const scrollTop = scroller.scrollTop;
    const threshold = Math.min(scroller.clientHeight * 0.2, 190);
    const activeStickyScene = dbtlRange
      && scrollTop > dbtlRange.start + 6
      && scrollTop < dbtlRange.end - 6;
    const approachingStickyScene = dbtlRange
      && scrollTop >= dbtlRange.start - threshold
      && scrollTop <= dbtlRange.end + threshold;
    if (activeStickyScene || approachingStickyScene) return;

    const eligibleOffsets = chapterOffsets.filter((value) => value > 4 || scrollDirection < 0);
    const nearest = eligibleOffsets.reduce((best, value) => (
      Math.abs(value - scrollTop) < Math.abs(best - scrollTop) ? value : best
    ), eligibleOffsets[0] ?? scrollTop);
    const distance = Math.abs(nearest - scrollTop);
    if (distance < 10 || distance > threshold) return;

    settleTween = gsap.to(scroller, {
      scrollTop: nearest,
      duration: 0.58,
      ease: 'power3.inOut',
      overwrite: 'auto',
      onComplete: () => {
        lastScrollTop = nearest;
        settleTween = undefined;
      },
      onInterrupt: () => { settleTween = undefined; },
    });
  };

  const scheduleSettle = () => {
    if (!desktopNarrative.matches || reducedMotion.matches || settleTween) return;
    const nextScrollTop = scroller.scrollTop;
    if (Math.abs(nextScrollTop - lastScrollTop) > 1) scrollDirection = nextScrollTop > lastScrollTop ? 1 : -1;
    lastScrollTop = nextScrollTop;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settleAtChapterBoundary, 150);
  };

  scroller.addEventListener('scroll', scheduleSettle, { passive: true });
  scroller.addEventListener('wheel', cancelSettle, { passive: true });
  scroller.addEventListener('touchstart', cancelSettle, { passive: true });

  const scrollButtons = [...root.querySelectorAll('[data-home-scroll-target]')];
  const handleScrollTarget = (event) => {
    document.getElementById(event.currentTarget.dataset.homeScrollTarget)?.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
  };
  scrollButtons.forEach((button) => button.addEventListener('click', handleScrollTarget));

  const refresh = () => {
    ScrollTrigger.refresh();
    collectChapterOffsets();
  };
  window.addEventListener('load', refresh, { once: true });
  requestAnimationFrame(refresh);

  return {
    refresh,
    scrollTo(sectionId) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
    },
    destroy() {
      cancelSettle();
      scroller.removeEventListener('scroll', scheduleSettle);
      scroller.removeEventListener('wheel', cancelSettle);
      scroller.removeEventListener('touchstart', cancelSettle);
      scrollButtons.forEach((button) => button.removeEventListener('click', handleScrollTarget));
      scope.revert();
    },
  };
}
