import { describe, expect, it } from 'vitest';
import { RAIL, medalZ, railFrontZ } from '../../src/scripts/three/models/medal-hanger';

describe('medal hanger geometry', () => {
  it('the upper rail stands further out from the board than the lower one', () => {
    expect(RAIL.rails[0].standoff).toBeGreaterThan(RAIL.rails[1].standoff);
  });
  it('medals on the upper rail hang in front of the lower rail and its medals', () => {
    expect(medalZ(0)).toBeGreaterThan(railFrontZ(1));
    expect(medalZ(0)).toBeGreaterThan(medalZ(1));
  });
});
