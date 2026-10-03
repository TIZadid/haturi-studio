import { describe, expect, it } from 'vitest';
import { bracket, pad2 } from '../../src/lib/format';

describe('format', () => {
  it('brackets uppercase', () => expect(bracket('for runners')).toBe('[FOR RUNNERS]'));
  it('pads', () => { expect(pad2(3)).toBe('03'); expect(pad2(14)).toBe('14'); });
});
