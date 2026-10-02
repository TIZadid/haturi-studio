import { describe, expect, it } from 'vitest';
import { pileOffsets } from '../../src/lib/pile';
import { mulberry32 } from '../../src/lib/random';

describe('mulberry32', () => {
  it('is deterministic and in [0,1)', () => {
    const a = mulberry32(7), b = mulberry32(7);
    for (let i = 0; i < 50; i++) { const v = a(); expect(v).toBe(b()); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); }
  });
});

describe('pileOffsets', () => {
  const rects = [{ x: 0, y: 0, w: 100, h: 100 }, { x: 300, y: 200, w: 100, h: 100 }];
  const center = { x: 200, y: 150 };
  it('moves every rect centre to within jitter of the pile centre', () => {
    pileOffsets(rects, center, 3, 40).forEach((o, i) => {
      const cx = rects[i].x + rects[i].w / 2 + o.x, cy = rects[i].y + rects[i].h / 2 + o.y;
      expect(Math.abs(cx - center.x)).toBeLessThanOrEqual(40);
      expect(Math.abs(cy - center.y)).toBeLessThanOrEqual(40);
    });
  });
  it('keeps rotations within the max', () => {
    pileOffsets(rects, center, 3, 40, 14).forEach((o) => expect(Math.abs(o.rotation)).toBeLessThanOrEqual(14));
  });
  it('is stable for a seed', () => expect(pileOffsets(rects, center, 9)).toEqual(pileOffsets(rects, center, 9)));
});
