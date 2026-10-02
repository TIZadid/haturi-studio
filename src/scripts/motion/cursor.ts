import { gsap } from 'gsap';

// The native cursor always stays. A small label pill trails it, only over elements with data-cursor.
export function startCursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const el = document.querySelector<HTMLElement>('[data-cursor-ring]');
  const label = el?.querySelector('span');
  if (!el || !label || el.dataset.bound) return;
  el.dataset.bound = 'true';
  const x = gsap.quickTo(el, 'x', { duration: 0.12, ease: 'power3' });
  const y = gsap.quickTo(el, 'y', { duration: 0.12, ease: 'power3' });
  const hide = () => el.removeAttribute('data-active');
  addEventListener('pointermove', (e) => {
    x(e.clientX + 18);
    y(e.clientY + 18);
    const target = (e.target as Element).closest<HTMLElement>('[data-cursor]');
    if (target) { label.textContent = target.dataset.cursor ?? ''; el.setAttribute('data-active', ''); } else hide();
  }, { passive: true });
  addEventListener('scroll', hide, { passive: true });
  document.addEventListener('pointerleave', hide);
  document.addEventListener('astro:before-swap', hide);
}
