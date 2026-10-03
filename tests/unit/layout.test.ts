import { describe, expect, it } from 'vitest';
import { easeOutBounce, fitDistance, gridSlots, nearestIndex, nextFree, pegPositions, railSlots, swingAngle } from '../../src/scripts/three/layout';

describe('railSlots', () => {
  it('spreads evenly inside the inset', () => {
    const s = railSlots(12, 7, 0.75);
    expect(s).toHaveLength(7);
    expect(s[0]).toBeCloseTo(-5.25);
    expect(s[6]).toBeCloseTo(5.25);
    expect(s[1] - s[0]).toBeCloseTo(s[6] - s[5]);
  });
  it('handles 0 and 1', () => { expect(railSlots(12, 0, 1)).toEqual([]); expect(railSlots(12, 1, 1)).toEqual([0]); });
});

describe('gridSlots', () => {
  const g = gridSlots({ width: 23, height: 23, rows: 4, cols: 4, frame: 0.75 });
  it('makes rows × cols centres, top-left first', () => {
    expect(g).toHaveLength(16);
    expect(g[0].x).toBeLessThan(0); expect(g[0].y).toBeGreaterThan(0);
    expect(g[15].x).toBeGreaterThan(0); expect(g[15].y).toBeLessThan(0);
  });
  it('is symmetric', () => { expect(g[0].x).toBeCloseTo(-g[3].x); expect(g[0].y).toBeCloseTo(-g[12].y); });
});

describe('nextFree / nearestIndex', () => {
  it('prefers the requested slot when free', () => expect(nextFree(new Set([1]), 4, 2)).toBe(2));
  it('falls back to the lowest free slot', () => expect(nextFree(new Set([0, 2]), 4, 2)).toBe(1));
  it('returns null when full', () => expect(nextFree(new Set([0, 1]), 2)).toBeNull());
  it('finds the nearest unskipped value', () => {
    expect(nearestIndex([-2, 0, 2], 1.4)).toBe(2);
    expect(nearestIndex([-2, 0, 2], 1.4, new Set([2]))).toBe(1);
    expect(nearestIndex([1], 0, new Set([0]))).toBe(-1);
  });
});

describe('motion curves', () => {
  it('swing starts at amplitude and settles', () => {
    expect(swingAngle(0, 0.4)).toBeCloseTo(0.4);
    expect(Math.abs(swingAngle(3, 0.4))).toBeLessThan(0.004);
  });
  it('bounce maps 0→0 and 1→1', () => { expect(easeOutBounce(0)).toBe(0); expect(easeOutBounce(1)).toBeCloseTo(1); });
});

describe('fitDistance', () => {
  it('backs off further for narrow viewports', () => {
    expect(fitDistance(14, 6, 30, 0.5)).toBeGreaterThan(fitDistance(14, 6, 30, 1.5));
  });
  it('fits height on wide viewports', () => {
    const d = fitDistance(10, 10, 30, 4, 1);
    expect(d).toBeCloseTo(5 / Math.tan((15 * Math.PI) / 180));
  });
});

describe('pegPositions', () => {
  const o = { width: 23, height: 23, rows: 4, cols: 4, frame: 0.75, pegHeight: 2.2 };
  const pegs = pegPositions(o);
  it('puts a peg at every column line on every shelf and both inner frame edges', () => {
    expect(pegs).toHaveLength((o.rows + 1) * (o.cols - 1));
  });
  it('keeps every peg inside the frame', () => {
    for (const p of pegs) {
      expect(p.y + o.pegHeight / 2).toBeLessThanOrEqual(o.height / 2 - o.frame + 1e-9);
      expect(p.y - o.pegHeight / 2).toBeGreaterThanOrEqual(-o.height / 2 + o.frame - 1e-9);
    }
  });
});
