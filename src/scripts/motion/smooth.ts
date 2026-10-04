import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { reducedMotion } from './lifecycle';

gsap.registerPlugin(ScrollTrigger);
let lenis: Lenis | null = null;
let forward = true;

export function startSmooth() {
  if (lenis || reducedMotion()) return;
  lenis = new Lenis({ lerp: 0.16, wheelMultiplier: 1.1 });
  lenis.on('scroll', ScrollTrigger.update);
  // a glide still running when you tap a link would carry on into the next page; stop it on every swap.
  // forward links open at the top; back/forward keep the position the router restores.
  document.addEventListener('astro:before-preparation', (e) => {
    forward = (e as Event & { navigationType?: string }).navigationType !== 'traverse';
  });
  document.addEventListener('astro:after-swap', () => {
    lenis?.stop(); lenis?.start();
    if (forward && !location.hash) { lenis?.scrollTo(0, { immediate: true, force: true }); ScrollTrigger.clearScrollMemory(); scrollTo(0, 0); }
  });
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

export const getLenis = () => lenis;

export function refreshScroll() {
  lenis?.resize();
  // triggers are created module by module, not in page order; sort so pins shift the ones below them
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
}

/** Land on #section after pins exist; the router's own jump happens before pin spacing is added. */
export function scrollToHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  const el = id ? document.getElementById(id) : null;
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { immediate: true, force: true });
  else el.scrollIntoView({ block: 'start' });
}

/** Same-page section links (e.g. /#craft while on /) glide there via Lenis instead of the router's jump. */
export function startHashLinks() {
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href*="#"]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    history.pushState(history.state, '', url.hash);
    if (lenis) lenis.scrollTo(el, { duration: 1.1, force: true });
    else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, { capture: true });
}
