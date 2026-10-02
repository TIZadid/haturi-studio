import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { reducedMotion } from './lifecycle';

gsap.registerPlugin(ScrollTrigger);
let lenis: Lenis | null = null;

export function startSmooth() {
  if (lenis || reducedMotion()) return;
  lenis = new Lenis({ lerp: 0.16, wheelMultiplier: 1.1, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
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
