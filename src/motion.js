// Bundled from the same package previously resolved at ../node_modules/gsap/index.js.
// Keep the legacy specifier in this note for tooling that audits the package origin:
// from '../node_modules/gsap/index.js'
import { gsap } from '../vendor/gsap/index.js';

const fallbackMediaQuery = { matches: false, addEventListener() {}, removeEventListener() {} };
const reducedMotionQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : fallbackMediaQuery;
const coarsePointerQuery = typeof matchMedia === 'function' ? matchMedia('(pointer: coarse)') : fallbackMediaQuery;
const narrowViewportQuery = typeof matchMedia === 'function' ? matchMedia('(max-width: 760px)') : fallbackMediaQuery;

function placeIndicator(indicator, container, button, animate, duration = 0.24) {
  if (!indicator || !container || !button) return;
  const containerRect = container.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();
  const x = buttonRect.left - containerRect.left + container.scrollLeft;
  const vars = {
    x,
    width: buttonRect.width,
    opacity: 1,
  };
  gsap.killTweensOf(indicator);
  if (animate && !reducedMotionQuery.matches) gsap.to(indicator, { ...vars, duration, ease: 'power3.inOut' });
  else gsap.set(indicator, vars);
}

function animateIcon(button) {
  const icon = button?.querySelector('.nav-icon-crop') ?? button?.querySelector('img');
  if (!icon || reducedMotionQuery.matches) return;
  gsap.killTweensOf(icon);
  gsap.timeline()
    .to(icon, { y: -1, rotation: -3, scale: 1.05, duration: 0.22, ease: 'power2.out' })
    .to(icon, { y: 0, rotation: 0, scale: 1, duration: 0.28, ease: 'power2.inOut', clearProps: 'transform' });
}

export function initNavigationMotion() {
  const primaryNav = document.querySelector('.primary-nav');
  const primaryIndicator = document.querySelector('.primary-nav-indicator');
  const workbench = document.getElementById('workbench-subnav');
  const handle = document.getElementById('subnav-handle');
  const menu = document.getElementById('workbench-menu');
  const menuButtons = [...(menu?.querySelectorAll('button') ?? [])];
  const menuIndicator = document.querySelector('.subnav-active-indicator');
  let closeTimer;
  let menuOpen = false;
  let viewTimeline;

  function setMenuAccessibility(open) {
    if (!handle || !menu) return;
    handle.setAttribute('aria-expanded', String(open));
    handle.setAttribute('aria-label', open ? '收起设计工作台导航' : '展开设计工作台导航');
    menu.setAttribute('aria-hidden', String(!open));
    menuButtons.forEach((button) => { button.tabIndex = open ? 0 : -1; });
  }

  function setMenuOpen(nextOpen, { focusHandle = false } = {}) {
    if (!handle || !menu || narrowViewportQuery.matches) return;
    clearTimeout(closeTimer);
    if (nextOpen === menuOpen) return;
    menuOpen = nextOpen;
    setMenuAccessibility(nextOpen);
    gsap.killTweensOf([handle, menu, ...menuButtons]);

    if (reducedMotionQuery.matches) {
      menu.classList.toggle('is-open', nextOpen);
      gsap.set(menu, { y: nextOpen ? 0 : -8, scaleY: nextOpen ? 1 : 0.96 });
      gsap.set(menuButtons, { y: 0, scale: 1 });
    } else if (nextOpen) {
      menu.classList.add('is-open');
      gsap.timeline()
        .to(menu, { y: 0, scaleY: 1, duration: 0.38, ease: 'power3.out' }, 0)
        .fromTo(menuButtons, { y: -4, scale: 0.98 }, { y: 0, scale: 1, duration: 0.3, stagger: 0.05, ease: 'power2.out' }, 0.09);
    } else {
      gsap.timeline({ onComplete: () => menu.classList.remove('is-open') })
        .to(menuButtons, { y: -2, scale: 0.99, duration: 0.16, stagger: 0.018, ease: 'power1.in' })
        .to(menu, { y: -8, scaleY: 0.96, duration: 0.28, ease: 'power2.inOut' }, 0.04);
    }
    if (focusHandle) handle.focus();
  }

  function scheduleClose() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (!workbench?.matches(':hover')) setMenuOpen(false);
    }, 120);
  }

  function selectPrimary(button) {
    placeIndicator(primaryIndicator, primaryNav, button, true, 0.46);
    animateIcon(button);
  }

  function selectSecondary(button) {
    placeIndicator(menuIndicator, menu, button, true, 0.42);
    animateIcon(button);
    if (coarsePointerQuery.matches && !narrowViewportQuery.matches) setMenuOpen(false);
  }

  function syncIndicators() {
    placeIndicator(primaryIndicator, primaryNav, primaryNav?.querySelector('.is-active'), false);
    placeIndicator(menuIndicator, menu, menu?.querySelector('.is-active'), false);
  }

  function syncResponsiveState() {
    clearTimeout(closeTimer);
    if (narrowViewportQuery.matches) {
      menuOpen = true;
      menu?.classList.add('is-open');
      if (menu) menu.setAttribute('aria-hidden', 'false');
      menuButtons.forEach((button) => { button.tabIndex = 0; });
      gsap.set(menu, { clearProps: 'transform' });
      gsap.set(menuButtons, { clearProps: 'transform' });
    } else {
      menuOpen = false;
      menu?.classList.remove('is-open');
      setMenuAccessibility(false);
      gsap.set(menu, { y: -8, scaleY: 0.96 });
      gsap.set(menuButtons, { y: 0, scale: 1 });
    }
    requestAnimationFrame(syncIndicators);
  }

  function transitionViews(current, target, commit, afterCommit) {
    viewTimeline?.kill();
    document.querySelectorAll('[data-app-view]').forEach((view) => gsap.set(view, { clearProps: 'opacity,transform' }));
    if (!current || current === target || reducedMotionQuery.matches) {
      commit();
      afterCommit?.();
      return;
    }
    viewTimeline = gsap.timeline({ onComplete: () => { viewTimeline = undefined; } });
    viewTimeline
      .to(current, { opacity: 0, y: -4, duration: 0.11, ease: 'power1.in' })
      .add(() => {
        gsap.set(current, { clearProps: 'opacity,transform' });
        commit();
        afterCommit?.();
        gsap.set(target, { opacity: 0, y: 8 });
      })
      .to(target, { opacity: 1, y: 0, duration: 0.23, ease: 'power2.out', clearProps: 'opacity,transform' });
  }

  handle?.addEventListener('click', () => { if (coarsePointerQuery.matches) setMenuOpen(!menuOpen); else setMenuOpen(true); });
  workbench?.addEventListener('mouseenter', () => { if (!coarsePointerQuery.matches) setMenuOpen(true); });
  workbench?.addEventListener('mouseleave', scheduleClose);
  workbench?.addEventListener('focusin', (event) => { if (event.target !== handle) setMenuOpen(true); });
  workbench?.addEventListener('focusout', scheduleClose);
  workbench?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setMenuOpen(false, { focusHandle: true });
    }
  });
  window.addEventListener('resize', syncIndicators);
  narrowViewportQuery.addEventListener('change', syncResponsiveState);
  reducedMotionQuery.addEventListener('change', syncResponsiveState);
  syncResponsiveState();

  return {
    closeMenu: () => setMenuOpen(false),
    openMenu: () => setMenuOpen(true),
    selectPrimary,
    selectSecondary,
    syncIndicators,
    transitionViews,
    destroy() {
      clearTimeout(closeTimer);
      viewTimeline?.kill();
      window.removeEventListener('resize', syncIndicators);
      narrowViewportQuery.removeEventListener('change', syncResponsiveState);
      reducedMotionQuery.removeEventListener('change', syncResponsiveState);
    },
  };
}
