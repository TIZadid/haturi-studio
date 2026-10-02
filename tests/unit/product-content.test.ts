import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { globSync } from 'tinyglobby';
import { describe, expect, it } from 'vitest';
import { PRODUCT_GLOB } from '../../src/lib/product-schema';

const front = (f: string) => yaml.load(readFileSync(f, 'utf8').split('---')[1]) as Record<string, unknown>;

describe('product content', () => {
  it('keeps commas inside spec values', () => {
    const mh = front('src/content/products/medal-hanger/index.md') as { specs: { value: string }[] };
    expect(mh.specs.map((s) => s.value)).toContain('Two, 12 in each');
    expect(mh.specs.map((s) => s.value)).toContain('One at a time, Dhaka');
  });
  it.each(globSync(PRODUCT_GLOB, { cwd: 'src/content/products', absolute: true }))('%s spec rows have only label and value', (f) => {
    for (const s of (front(f).specs as object[])) expect(Object.keys(s).sort()).toEqual(['label', 'value']);
  });
  it.each(globSync(PRODUCT_GLOB, { cwd: 'src/content/products', absolute: true }))('%s gallery rows have only src and alt', (f) => {
    for (const g of ((front(f).gallery ?? []) as object[])) expect(Object.keys(g).sort()).toEqual(['alt', 'src']);
  });
});
