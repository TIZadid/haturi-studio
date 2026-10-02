import { gsap } from 'gsap';

export function startCursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const el = document.querySelector<HTMLElement>('[data-cursor-ring]');
  const label = el?.querySelector('span');
  if (!el || !label || el.dataset.bound) return;
  el.dataset.bound = 'true';
  document.documentElement.dataset.cursorOn = '';
  gsap.set(el, { xPercent: -50, yPercent: -50 });
  const x = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3' });
  const y = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3' });
  addEventListener('pointermove', (e) => { x(e.clientX); y(e.clientY); el.dataset.visible = ''; });
  document.addEventListener('pointerleave', () => delete el.dataset.visible);
  document.addEventListener('pointerover', (e) => {
    const target = (e.target as Element).closest<HTMLElement>('[data-cursor]');
    label.textContent = target?.dataset.cursor ?? '';
    el.toggleAttribute('data-active', Boolean(target));
  });
  addEventListener('pointerdown', () => gsap.fromTo(el, { scale: 0.7 }, { scale: 1, duration: 0.45, ease: 'back.out(3)' }));
}
