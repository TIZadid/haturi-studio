import { mulberry32 } from './random';

export interface Rect { x: number; y: number; w: number; h: number }
export interface Offset { x: number; y: number; rotation: number }

export function pileOffsets(rects: Rect[], center: { x: number; y: number }, seed: number, jitter = 40, maxRotation = 14): Offset[] {
  const rand = mulberry32(seed);
  const spread = () => rand() * 2 - 1;
  return rects.map((r) => ({
    x: center.x - (r.x + r.w / 2) + spread() * jitter,
    y: center.y - (r.y + r.h / 2) + spread() * jitter,
    rotation: spread() * maxRotation,
  }));
}
