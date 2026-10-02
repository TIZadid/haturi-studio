import { describe, expect, it } from 'vitest';
import { mediaUrl, neighbours, sortProducts } from '../../src/lib/catalog';

const p = (id: string, order: number, name = id) => ({ id, data: { order, name } });

describe('catalog', () => {
  it('sorts by order then name', () => {
    expect(sortProducts([p('b', 2), p('z', 1, 'Zed'), p('a', 1, 'Abe')]).map((x) => x.id)).toEqual(['a', 'z', 'b']);
  });
  it('does not mutate input', () => {
    const list = [p('b', 2), p('a', 1)];
    sortProducts(list);
    expect(list[0].id).toBe('b');
  });
  it('wraps neighbours', () => {
    const list = [p('a', 1), p('b', 2), p('c', 3)];
    expect(neighbours(list, 'a')).toEqual({ prev: list[2], next: list[1] });
    expect(neighbours(list, 'c')?.next.id).toBe('a');
    expect(neighbours(list, 'x')).toBeNull();
  });
  it('a single product is its own neighbour', () => {
    const list = [p('a', 1)];
    expect(neighbours(list, 'a')?.next.id).toBe('a');
  });
  it('resolves media by folder', () => {
    const map = { '/src/content/products/a/reel.mp4': '/_astro/reel.123.mp4' };
    expect(mediaUrl(map, 'a', 'reel.mp4')).toBe('/_astro/reel.123.mp4');
    expect(mediaUrl(map, 'a', undefined)).toBeUndefined();
    expect(() => mediaUrl(map, 'a', 'missing.mp4')).toThrow(/missing\.mp4/);
  });
});
