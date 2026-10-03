import { z } from 'astro/zod';
import { globSync } from 'tinyglobby';
import { describe, expect, it } from 'vitest';
import { PRODUCT_GLOB, productSchema } from '../../src/lib/product-schema';

const schema = productSchema(() => z.string());
const minimal = {
  name: 'Medal Hanger', code: 'HTR—MH', wordmark: 'Hanger.', order: 1,
  audience: 'For runners', tagline: 'Sixteen medals. One wall.',
  hero: './hero.jpg', heroAlt: 'A hanger on a wall', specs: [{ label: 'Wood', value: 'Teak' }],
};

describe('productSchema', () => {
  it('accepts a minimal product and fills defaults', () => {
    const p = schema.parse(minimal);
    expect(p.gallery).toEqual([]);
    expect(p.callouts).toEqual([]);
    expect(p.status).toBe('available');
    expect(p.model).toBeUndefined();
  });
  it('rejects a code without the em dash pattern', () => {
    expect(() => schema.parse({ ...minimal, code: 'HTR-MH' })).toThrow();
  });
  it('requires the wordmark full stop', () => {
    expect(() => schema.parse({ ...minimal, wordmark: 'Hanger' })).toThrow();
  });
  it('accepts an optional note', () => {
    expect(schema.parse({ ...minimal, note: 'Customisable' }).note).toBe('Customisable');
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
  it('accepts an optional sketch with labels', () => {
    const p = schema.parse({ ...minimal, sketch: { src: './sketch.png', caption: 'Drawn before it is cut', labels: [{ label: 'Teak / Shegun', x: 30, y: 80 }] } });
    expect(p.sketch?.labels[0].side).toBe('up');
    expect(schema.parse(minimal).sketch).toBeUndefined();
  });
  it('glob skips folders starting with underscore', () => {
    const found = globSync(PRODUCT_GLOB, { cwd: 'src/content/products' });
    expect(found).not.toContain('_template/index.md');
    expect(found).toEqual(expect.arrayContaining(['medal-hanger/index.md', 'grid-shelf/index.md']));
  });
});
