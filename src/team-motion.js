import { gsap } from '../vendor/gsap/index.js';

const reducedMotion = typeof matchMedia === 'function'
  ? matchMedia('(prefers-reduced-motion: reduce)')
  : { matches: false };

export function initTeamMotion() {
  const root = document.querySelector('[data-app-view="team"]');
  if (!root) return undefined;

  let intro;
  let ambient;

  const play = () => {
    intro?.kill();

    if (reducedMotion.matches) {
      gsap.set(root.querySelectorAll('.team-copy > *, .team-member, .team-member-label, .team-orbit-line, .team-prop'), { clearProps: 'all' });
      return;
    }

    intro = gsap.timeline({ defaults: { ease: 'power3.out' } })
      .fromTo('.team-copy > *', { opacity: 0, x: -28 }, { opacity: 1, x: 0, duration: 0.62, stagger: 0.07 }, 0)
      .fromTo('.team-orbit-line', { opacity: 0, scale: 0.86, rotation: -4 }, { opacity: 1, scale: 1, rotation: 0, duration: 1.05 }, 0.1)
      .from('.team-prop', { opacity: 0, scale: 0.84, duration: 0.9, stagger: 0.1 }, 0.08)
      .fromTo('.team-member', {
        opacity: 0,
        y: (index) => 48 + Math.abs(2 - index) * 15,
        rotation: (index) => (index - 2) * 2.4,
        scale: 0.9,
      }, {
        opacity: 1,
        y: 0,
        rotation: 0,
        scale: 1,
        duration: 0.78,
        stagger: { each: 0.09, from: 'edges' },
        ease: 'back.out(1.16)',
      }, 0.22)
      .fromTo('.team-member-label', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.07 }, 0.7)
      .set('.team-copy > *, .team-member, .team-member-label', { clearProps: 'transform,opacity' });

    if (!ambient) {
      ambient = gsap.timeline({ repeat: -1, yoyo: true })
        .to('.team-prop-protein', { y: 14, rotation: 15, duration: 5.8, ease: 'sine.inOut' }, 0)
        .to('.team-prop-dashboard', { y: -10, rotation: -3, duration: 6.6, ease: 'sine.inOut' }, 0)
        .to('.team-prop-lab', { y: -12, rotation: 4, duration: 6.2, ease: 'sine.inOut' }, 0)
        .to('.team-orbit-line path', { strokeDashoffset: -34, duration: 7, ease: 'none' }, 0);
    }
  };

  return {
    play,
    destroy() {
      intro?.kill();
      ambient?.kill();
    },
  };
}
