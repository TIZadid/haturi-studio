import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onPage } from './lifecycle';

onPage(() => {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;
  const triggers = [...document.querySelectorAll<HTMLElement>('[data-ground="dark"]')].map((section) =>
    ScrollTrigger.create({
      trigger: section,
      start: 'top top+=32',
      end: 'bottom top+=32',
      onToggle: (self) => header.toggleAttribute('data-on-dark', self.isActive),
    }),
  );
  triggers.push(ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      header.toggleAttribute('data-hidden', self.direction === 1 && self.scroll() > 160);
      header.toggleAttribute('data-scrolled', self.scroll() > 24);
    },
  }));
  return () => {
    triggers.forEach((t) => t.kill());
    header.removeAttribute('data-on-dark');
    header.removeAttribute('data-hidden');
    header.removeAttribute('data-scrolled');
  };
});
