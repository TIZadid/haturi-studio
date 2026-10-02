import { describe, expect, it } from 'vitest';
import { fbDm, igDm, igProfile, site } from '../../src/config/site';

describe('site config', () => {
  it('has a real instagram handle', () => expect(site.instagram).toMatch(/^[a-z0-9._]{1,30}$/));
  it('builds a DM link', () => expect(igDm('haturi')).toBe('https://ig.me/m/haturi'));
  it('builds a Messenger link', () => expect(fbDm('haturistudio')).toBe('https://m.me/haturistudio'));
  it('has a real messenger handle', () => expect(site.messenger).toMatch(/^[a-z0-9.]{1,50}$/));
  it('builds a profile link', () => expect(igProfile('haturi')).toBe('https://www.instagram.com/haturi/'));
});
