import { describe, expect, it } from 'vitest';
import { igDm, igProfile, site } from '../../src/config/site';

describe('site config', () => {
  it('has a real instagram handle', () => expect(site.instagram).toMatch(/^[a-z0-9._]{1,30}$/));
  it('builds a DM link', () => expect(igDm('haturi')).toBe('https://ig.me/m/haturi'));
  it('builds a profile link', () => expect(igProfile('haturi')).toBe('https://www.instagram.com/haturi/'));
});
