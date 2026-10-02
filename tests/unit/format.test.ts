import { describe, expect, it } from 'vitest';
import { bracket, dotDate, pad2 } from '../../src/lib/format';

describe('format', () => {
  it('dot-dates', () => expect(dotDate(new Date(2026, 9, 2))).toBe('2026.OCT'));
  it('brackets uppercase', () => expect(bracket('for runners')).toBe('[FOR RUNNERS]'));
  it('pads', () => { expect(pad2(3)).toBe('03'); expect(pad2(14)).toBe('14'); });
});
