import { z } from 'astro/zod';
import { globSync } from 'tinyglobby';
import { describe, expect, it } from 'vitest';
import { PRODUCT_GLOB, productSchema } from '../../src/lib/product-schema';

const schema = productSchema(() => z.string());
const minimal = {
  name: 'Medal Hanger', code: 'HTR—MH', wordmark: 'Hanger.', order: 1,
  audience: 'For runners', tagline: 'Fourteen medals. One wall.', released: '2026.AUG',
  hero: './hero.jpg', heroAlt: 'A hanger on a wall', specs: [{ label: 'Wood', value: 'Teak' }],
};

describe('productSchema', () => {
  it('accepts a minimal product and fills defaults', () => {
    const p = schema.parse(minimal);
    expect(p.gallery).toEqual([]);
    expect(p.callouts).toEqual([]);
    expect(p.status).toBe('available');
    expect(p.reel).toBeUndefined();
    expect(p.model).toBeUndefined();
  });
  it('rejects a code without the em dash pattern', () => {
    expect(() => schema.parse({ ...minimal, code: 'HTR-MH' })).toThrow();
  });
  it('requires the wordmark full stop', () => {
    expect(() => schema.parse({ ...minimal, wordmark: 'Hanger' })).toThrow();
  });
  it('requires a dot-date', () => {
    expect(() => schema.parse({ ...minimal, released: 'Aug 2026' })).toThrow();
  });
  it('requires at least one spec', () => {
    expect(() => schema.parse({ ...minimal, specs: [] })).toThrow();
  });
  it('bounds callout positions to 0–100', () => {
    expect(() => schema.parse({ ...minimal, callouts: [{ label: 'Teak', x: 120, y: 10 }] })).toThrow();
  });
  it('rejects unknown models', () => {
    expect(() => schema.parse({ ...minimal, model: 'chair' })).toThrow();
  });
  it('accepts a reel with mp4 file', () => {
    expect(schema.parse({ ...minimal, reel: { file: 'reel.mp4', poster: './reel-poster.jpg' } }).reel?.file).toBe('reel.mp4');
  });
  it('glob skips folders starting with underscore', () => {
    const found = globSync(PRODUCT_GLOB, { cwd: 'src/content/products' });
    expect(found).not.toContain('_template/index.md');
    expect(found).toEqual(expect.arrayContaining(['medal-hanger/index.md', 'grid-shelf/index.md']));
  });
});
