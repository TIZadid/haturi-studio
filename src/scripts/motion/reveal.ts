import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onPage } from './lifecycle';

gsap.registerPlugin(ScrollTrigger);

onPage(() => {
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // hide only what is below the fold, so nothing visible ever flickers out
    gsap.utils.toArray<HTMLElement>('[data-reveal]:not([data-reveal="rule"])')
      .filter((el) => el.getBoundingClientRect().top > innerHeight)
      .forEach((el) => gsap.set(el, { autoAlpha: 0 }));
    ScrollTrigger.batch('[data-reveal]:not([data-reveal="rule"])', {
      start: 'top 88%',
      once: true,
      onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08 }),
    });
    gsap.utils.toArray<HTMLElement>('[data-reveal="rule"]').forEach((el) =>
      gsap.fromTo(el, { scaleX: 0, transformOrigin: '0 50%' }, {
        scaleX: 1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      }),
    );
  });
  return () => mm.revert();
});
