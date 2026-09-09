import { gsap } from '../node_modules/gsap/index.js';
import { ScrollTrigger } from '../node_modules/gsap/ScrollTrigger.js';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = typeof matchMedia === 'function'
  ? matchMedia('(prefers-reduced-motion: reduce)')
  : { matches: false };

export function initHomeMotion() {
  const root = document.querySelector('[data-app-view="overview"]');
  const scroller = document.getElementById('home-scroll');
  if (!root || !scroller) return undefined;

  const chapters = [...root.querySelectorAll('[data-home-chapter]')];
  const labels = ['项目起点', '生物制造', '催化瓶颈', '突变设计', 'AI 学习', '协同机制', '研究愿景'];
  const reading = document.createElement('nav');
  reading.className = 'story-reading'; reading.setAttribute('aria-label', '主页阅读进度');
  reading.innerHTML = `<div class="story-reading-track"><i></i></div>${chapters.map((chapter, index) => `<button type="button" data-story-step="${index}" aria-label="${labels[index]}"><b>${String(index + 1).padStart(2, '0')}</b><span>${labels[index]}</span></button>`).join('')}`;
  root.append(reading);
  const updateReading = () => {
    const max = scroller.scrollHeight - scroller.clientHeight;
    reading.style.setProperty('--reading-progress', max > 0 ? scroller.scrollTop / max : 0);
    const top = scroller.getBoundingClientRect().top;
    let active = 0;
    chapters.forEach((chapter, index) => { if (chapter.getBoundingClientRect().top - top < scroller.clientHeight * .45) active = index; });
    reading.querySelectorAll('button').forEach((button, index) => { button.classList.toggle('is-current', index === active); button.setAttribute('aria-current', index === active ? 'step' : 'false'); });
  };
  reading.addEventListener('click', (event) => {
    const button = event.target.closest('[data-story-step]');
    if (button) chapters[Number(button.dataset.storyStep)].scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  });
  scroller.addEventListener('scroll', updateReading, { passive: true });
  updateReading();

  const scope = gsap.context(() => {
    if (reducedMotion.matches) {
      gsap.set(root.querySelectorAll('.home-reveal'), { clearProps: 'all' });
      return;
    }

    const titleMotion = { yPercent: 108, rotation: 1.2, opacity: 0, duration: .95, stagger: .15, ease: 'power4.out' };
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .from('.story-hero-copy .story-kicker', { opacity: 0, y: 8, letterSpacing: '.25em', duration: 0.6 })
      .from('.story-hero-copy .title-line-inner', titleMotion, '-=.25')
      .to('.story-hero-copy h1 em', { '--ink-progress': '100%', duration: .8, ease: 'power2.inOut' }, '-=.45')
      .from('.story-hero-copy > p, .story-actions', { opacity: 0, y: 16, duration: 0.65, stagger: 0.12 }, '-=.65')
      .from('.story-structure', { opacity: 0, x: 38, scale: 0.96, duration: 0.78 }, '-=.62')
      .from('.reaction-route', { opacity: 0, y: 18, duration: 0.5 }, '-=.34');

    root.querySelectorAll('.story-heading, .story-loop-heading').forEach((heading) => {
      const title = heading.querySelector('h2');
      if (!title) return;
      const timeline = gsap.timeline({ scrollTrigger: { trigger: heading, scroller, start: 'top 82%', once: true } });
      const kicker = heading.querySelector('.story-kicker');
      if (kicker) timeline.from(kicker, { opacity: 0, x: -10, letterSpacing: '.24em', duration: .55 }, 0);
      timeline.from(title.querySelectorAll('.title-line-inner'), titleMotion, .12);
      const paragraphs = heading.querySelectorAll('p');
      if (paragraphs.length) timeline.from(paragraphs, { opacity: 0, y: 16, duration: .75, stagger: .12, ease: 'power2.out' }, .45);
    });
    root.querySelectorAll('.editorial-body, .story-problem-copy, .ai-explanation').forEach((copy) => {
      // Trigger each paragraph at its own viewport entry: long/mobile columns stay readable.
      copy.querySelectorAll('p').forEach((paragraph) => gsap.from(paragraph, {
        opacity: 0, y: 18, duration: .8, ease: 'power2.out',
        scrollTrigger: { trigger: paragraph, scroller, start: 'top 90%', once: true },
      }));
    });

    gsap.to('.story-structure-frame', { y: 9, rotation: -1.2, duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.fromTo('.manufacturing-scene img', { y: 22 }, { y: -14, ease: 'none',
      scrollTrigger: { trigger: '#home-background', scroller, start: 'top bottom', end: 'bottom top', scrub: 1 } });
    gsap.to('.feedback-stage .feedback-path', { strokeDashoffset: -150, ease: 'none',
      scrollTrigger: { trigger: '.feedback-stage', scroller, start: 'top bottom', end: 'bottom top', scrub: 1 } });
    gsap.from('.feedback-stage .loop-node', { opacity: .3, stagger: .2, duration: .6,
      scrollTrigger: { trigger: '.feedback-stage', scroller, start: 'top 75%', once: true } });
    gsap.to('.meter-flow span', { x: 14, stagger: .1, ease: 'none',
      scrollTrigger: { trigger: '.bottleneck-meter', scroller, start: 'top 80%', end: 'bottom 30%', scrub: 1 } });
    chapters.forEach((chapter) => {
      gsap.fromTo(chapter, { '--story-light': '0%' }, {
        '--story-light': '100%', ease: 'none',
        scrollTrigger: { trigger: chapter, scroller, start: 'top bottom', end: 'bottom top', scrub: 1 },
      });
    });
    gsap.from('.design-evidence-line li', { y: 22, opacity: 0, stagger: .18, duration: .8,
      scrollTrigger: { trigger: '.design-evidence-line', scroller, start: 'top 85%', once: true } });

    gsap.timeline({
      scrollTrigger: { trigger: '#home-hero', scroller, start: 'top top', end: 'bottom top', scrub: 0.7 },
    })
      .to('.story-structure', { y: -22, rotation: 1.5, ease: 'none' }, 0)
      .to('.story-hero-copy', { y: -12, opacity: 0.86, ease: 'none' }, 0.15);

    gsap.utils.toArray('.home-reveal').forEach((element) => {
      if (element.closest('#home-hero') || element.matches('.learning-loop li, .story-heading, .story-loop-heading, .editorial-body, .story-problem-copy, .ai-explanation, .design-evidence-line')) return;
      gsap.from(element, {
        opacity: 0,
        y: 30,
        duration: 0.72,
        ease: 'power2.out',
        scrollTrigger: { trigger: element, scroller, start: 'top 86%', once: true },
      });
    });

    gsap.from('.meter-flow span', {
      opacity: 0,
      x: -24,
      duration: 0.45,
      stagger: 0.08,
      ease: 'power2.out',
      scrollTrigger: { trigger: '.bottleneck-meter', scroller, start: 'top 78%', once: true },
    });

    gsap.from('.learning-loop li', {
      opacity: 0,
      y: 26,
      duration: 0.58,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.learning-loop', scroller, start: 'top 78%', once: true },
    });
  }, root);

  const scrollButtons = [...root.querySelectorAll('[data-home-scroll-target]')];
  const handleScrollTarget = (event) => {
    document.getElementById(event.currentTarget.dataset.homeScrollTarget)?.scrollIntoView({
      behavior: reducedMotion.matches ? 'auto' : 'smooth',
      block: 'start',
    });
  };
  scrollButtons.forEach((button) => button.addEventListener('click', handleScrollTarget));

  const refresh = () => ScrollTrigger.refresh();
  const reduceAnimations = () => { if (reducedMotion.matches) scope.revert(); };
  reducedMotion.addEventListener?.('change', reduceAnimations);
  window.addEventListener('load', refresh, { once: true });
  requestAnimationFrame(refresh);

  return {
    refresh,
    scrollTo(sectionId) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
    },
    destroy() {
      scroller.removeEventListener('scroll', updateReading);
      reading.remove();
      scrollButtons.forEach((button) => button.removeEventListener('click', handleScrollTarget));
      scope.revert();
      reducedMotion.removeEventListener?.('change', reduceAnimations);
    },
  };
}
